// M4 Steps 1 + 3: the public catalogue reads its taxonomy from the database.
// Publishes a handful of seeds across families, then browses /products
// ANONYMOUSLY and checks the sidebar, mega-menu, family/category/segment
// filters and the listing count against the database — including that
// draft and archived products never appear, that empty categories and
// families are hidden, that counts are real published counts, that the
// Segments block is gone while one segment exists, and that a category
// narrows within its family.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const CODE = (i) => `E2E-TAX-${String(i).padStart(3, "0")}`;
const SEGMENT_LABEL = { apparel: "Apparel", beauty: "Beauty", material: "Material" };

export default async function ({ page, base, admin, status, h }) {
  const anon = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });

  /* ---- what the database says the structure is ---- */
  const { data: families } = await admin
    .from("product_families")
    .select("id, slug, name, name_zh_hant, segment, sort_order")
    .eq("is_active", true)
    .order("sort_order");
  const { data: categories } = await admin
    .from("product_categories")
    .select("id, slug, name, name_zh_hant, family_id")
    .eq("is_active", true)
    .order("sort_order");
  const catsOf = (family) => categories.filter((c) => c.family_id === family.id);
  const familyOfCat = (catId) => families.find((f) => f.id === categories.find((c) => c.id === catId)?.family_id);
  const segments = [...new Set(families.map((f) => f.segment))];

  // Seeds by their primary category (or first mapping — the seeds carry
  // none flagged primary, and the storefront falls back the same way),
  // grouped by family.
  const { data: seedMaps } = await admin
    .from("product_category_map")
    .select("product_id, category_id, is_primary, products!inner(id, slug, brand_id)")
    .like("products.slug", "sample-%");
  const perProduct = new Map();
  for (const m of seedMaps) {
    const prev = perProduct.get(m.product_id);
    if (!prev || (m.is_primary && !prev.is_primary)) perProduct.set(m.product_id, m);
  }
  const byFamily = new Map();
  for (const m of perProduct.values()) {
    const fam = familyOfCat(m.category_id);
    if (!fam) continue;
    if (!byFamily.has(fam.slug)) byFamily.set(fam.slug, []);
    byFamily.get(fam.slug).push({ id: m.products.id, slug: m.products.slug, category_id: m.category_id, family: fam });
  }
  assert.ok(byFamily.size >= 3, `need seeds in at least three families, found ${byFamily.size}`);

  // Publish two seeds from each of the first two families that have any —
  // in DIFFERENT categories where the family allows it, so a category can
  // be shown to narrow within its family. At least one family stays empty.
  const twoApart = (list) => {
    const first = list[0];
    const other = list.find((s) => s.category_id !== first.category_id) ?? list[1];
    return other ? [first, other] : [first];
  };
  const familiesInOrder = [...byFamily.values()];
  const toPublish = familiesInOrder.slice(0, 2).flatMap(twoApart);
  const publishedFamilySlugs = new Set(toPublish.map((s) => s.family.slug));
  // One more seed goes ARCHIVED (but public) and one stays DRAFT (but public): neither may show.
  const spare = familiesInOrder.flat().filter((s) => !toPublish.includes(s));
  const [archivedSeed, draftSeed] = spare;
  assert.ok(archivedSeed && draftSeed, "need two spare seeds for the negative cases");

  const touched = [...toPublish, archivedSeed, draftSeed];
  const reset = () =>
    admin.from("products").update({ status: "draft", is_public: false, item_code: null }).in("id", touched.map((s) => s.id));
  await reset();
  try {
    for (const [i, s] of toPublish.entries()) {
      const { error } = await admin.from("products").update({ status: "active", is_public: true, item_code: CODE(i + 1) }).eq("id", s.id);
      if (error) throw error;
    }
    await admin.from("products").update({ status: "archived", is_public: true, item_code: CODE(98) }).eq("id", archivedSeed.id);
    await admin.from("products").update({ status: "draft", is_public: true }).eq("id", draftSeed.id);

    /* ---- expected counts, straight from the database ---- */
    const count = async (build) => {
      const { count: n, error } = await build(anon.from("products").select("id", { count: "exact", head: true }));
      if (error) throw error;
      return n;
    };
    const idsInCategories = async (catIds) => {
      const { data } = await admin.from("product_category_map").select("product_id").in("category_id", catIds);
      return [...new Set(data.map((r) => r.product_id))];
    };
    const countIn = async (catIds) => {
      const ids = await idsInCategories(catIds);
      return ids.length ? count((q) => q.eq("status", "active").eq("is_public", true).in("id", ids)) : 0;
    };
    const expectedAll = await count((q) => q.eq("status", "active").eq("is_public", true));
    assert.ok(expectedAll >= toPublish.length, "published seeds are counted");

    const categoryCounts = new Map();
    for (const c of categories) categoryCounts.set(c.slug, await countIn([c.id]));
    const visibleFamilies = families.filter((f) => catsOf(f).some((c) => categoryCounts.get(c.slug) > 0));
    const hiddenFamilies = families.filter((f) => !visibleFamilies.includes(f));
    assert.ok(hiddenFamilies.length >= 1, "at least one family is empty and must be hidden");

    const fam = toPublish[0].family;
    const famCats = catsOf(fam);
    const expectedFamily = await countIn(famCats.map((c) => c.id));
    const cat = categories.find((c) => c.id === toPublish[0].category_id);
    const expectedCategory = await countIn([cat.id]);
    const otherSeed = toPublish.find((s) => s.family.slug !== fam.slug);
    const otherFam = otherSeed.family;
    const otherCat = categories.find((c) => c.id === otherSeed.category_id);
    const expectedTwoCats = await countIn([cat.id, otherCat.id]);
    const segment = fam.segment;
    const expectedSegment = await countIn(
      families.filter((f) => f.segment === segment).flatMap((f) => catsOf(f).map((c) => c.id)),
    );

    const countText = (n) => page.getByText(new RegExp(`^${n} products?$`)).first();
    const out = {
      expectedAll, expectedFamily, expectedCategory, expectedTwoCats, expectedSegment,
      familyUsed: fam.slug, categoryUsed: cat.slug, otherCategory: otherCat.slug, segments,
      visibleFamilies: visibleFamilies.map((f) => f.slug), hiddenFamilies: hiddenFamilies.map((f) => f.slug),
    };

    /* ---- anonymous listing: every published product, nothing else ---- */
    await page.goto(`${base}/products`);
    await h.dismissCookies();
    await countText(expectedAll).waitFor({ timeout: 20000 });
    for (const s of [archivedSeed, draftSeed]) {
      assert.equal(await page.locator(`a[href="/products/${s.slug}"]`).count(), 0, `${s.slug} (${s === archivedSeed ? "archived" : "draft"}) must not be listed`);
    }
    assert.equal(await page.locator(`a[href="/products/${toPublish[0].slug}"]`).count(), 1, "a published seed is listed");

    /* ---- sidebar: database structure, empty families/categories hidden, real counts ---- */
    const sidebar = page.locator("aside");
    for (const f of visibleFamilies) await sidebar.getByRole("button", { name: f.name, exact: true }).waitFor();
    for (const f of hiddenFamilies) {
      assert.equal(await sidebar.getByRole("button", { name: f.name, exact: true }).count(), 0, `empty family ${f.slug} is hidden`);
    }
    const shownCounts = {};
    for (const c of famCats) {
      const n = categoryCounts.get(c.slug);
      const label = sidebar.locator(`label[for="cat-${c.slug}"]`);
      if (n > 0) {
        await label.waitFor();
        const shown = (await sidebar.getByTestId(`cat-count-${c.slug}`).textContent()).trim();
        assert.equal(shown, String(n), `count shown for ${c.slug}`);
        shownCounts[c.slug] = Number(shown);
      } else {
        assert.equal(await label.count(), 0, `empty category ${c.slug} is hidden`);
      }
    }
    out.sidebarCounts = shownCounts;

    /* ---- segments block only exists once there is a choice ---- */
    const segmentsBlock = sidebar.getByTestId("segments-block");
    if (segments.length > 1) {
      await segmentsBlock.waitFor();
      await sidebar.getByRole("button", { name: SEGMENT_LABEL[segment], exact: true }).click();
      await page.waitForURL((u) => u.searchParams.get("segment") === segment);
      await countText(expectedSegment).waitFor({ timeout: 20000 });
      await page.goto(`${base}/products`);
      out.segmentsBlock = "shown";
    } else {
      assert.equal(await segmentsBlock.count(), 0, "single-segment taxonomy shows no Segments block");
      out.segmentsBlock = "hidden";
    }

    /* ---- family filter resolves through the database; a category NARROWS within it ---- */
    await sidebar.getByRole("button", { name: fam.name, exact: true }).click();
    await page.waitForURL((u) => u.searchParams.get("family") === fam.slug);
    await countText(expectedFamily).waitFor({ timeout: 20000 });
    await page.getByText(fam.name, { exact: true }).first().waitFor(); // chip carries the database name
    await sidebar.locator(`label[for="cat-${cat.slug}"]`).click();
    await page.waitForURL((u) => u.searchParams.get("family") === fam.slug && u.searchParams.get("category") === cat.slug);
    await countText(expectedCategory).waitFor({ timeout: 20000 });
    assert.ok(expectedCategory <= expectedFamily, "category within family cannot exceed the family");
    // ticking a category in ANOTHER family releases the family instead of yielding nothing
    await sidebar.locator(`label[for="cat-${otherCat.slug}"]`).click();
    await page.waitForURL((u) => !u.searchParams.has("family") && (u.searchParams.get("category") ?? "").split(",").includes(otherCat.slug));
    await countText(expectedTwoCats).waitFor({ timeout: 20000 });
    out.narrowing = { family: expectedFamily, thenCategory: expectedCategory, thenOtherFamilyCategory: expectedTwoCats, otherFamily: otherFam.slug };

    /* ---- category filter by slug (the mega-menu's link shape) ---- */
    await page.goto(`${base}/products?category=${cat.slug}`);
    await countText(expectedCategory).waitFor({ timeout: 20000 });

    /* ---- an unknown family yields nothing, not everything ---- */
    await page.goto(`${base}/products?family=no-such-family`);
    await page.getByText("No products found").waitFor({ timeout: 20000 });

    /* ---- mega-menu: only families/categories with products, from the database ---- */
    await page.goto(`${base}/products`);
    await page.locator('nav a[href="/products"]').first().hover();
    const mega = page.locator(`a[href="/products?category=${cat.slug}"]`).first();
    await mega.waitFor({ state: "visible", timeout: 10000 });
    assert.equal((await mega.textContent())?.trim(), cat.name);
    await page.locator(`a[href="/products?family=${fam.slug}"]`).first().waitFor({ state: "visible" });
    const megaFamilyLinks = await page.locator('a[href^="/products?family="]').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    for (const f of visibleFamilies) assert.ok(megaFamilyLinks.includes(f.name), `mega-menu lists ${f.name}`);
    for (const f of hiddenFamilies) assert.ok(!megaFamilyLinks.includes(f.name), `mega-menu hides empty ${f.name}`);
    const emptyCat = famCats.find((c) => categoryCounts.get(c.slug) === 0);
    if (emptyCat) assert.equal(await page.locator(`a[href="/products?category=${emptyCat.slug}"]`).count(), 0, `mega-menu hides empty ${emptyCat.slug}`);
    out.megaMenuFamilies = [...new Set(megaFamilyLinks)];

    /* ---- Traditional Chinese: same structure, Chinese names ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));
    await page.goto(`${base}/products`);
    const zhFam = visibleFamilies.find((f) => f.name_zh_hant) ?? fam;
    await sidebar.getByRole("button", { name: zhFam.name_zh_hant, exact: true }).waitFor({ timeout: 20000 });
    if (cat.name_zh_hant) await sidebar.locator(`label[for="cat-${cat.slug}"]`).filter({ hasText: cat.name_zh_hant }).waitFor();
    out.zhHant = { family: zhFam.name_zh_hant, category: cat.name_zh_hant ?? null };

    /* ---- Designer Studio surfaces read the same source ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "en"));
    await page.goto(`${base}/designer-studio/trim-library`);
    for (const f of families) await page.getByRole("button", { name: f.name, exact: true }).waitFor({ timeout: 20000 });
    const famSlugs = byFamily.get(fam.slug).filter((s) => toPublish.includes(s)).map((s) => s.slug);
    const studioLink = (slug) => page.locator(`a[href="/designer-studio/products/${slug}"]`).first();
    await page.getByRole("button", { name: fam.name, exact: true }).click();
    await page.waitForFunction(
      (ok) => {
        const links = [...document.querySelectorAll('a[href^="/designer-studio/products/"]')].map((e) => e.getAttribute("href").split("/").pop());
        return links.length > 0 && links.every((slug) => ok.includes(slug));
      },
      famSlugs,
      { timeout: 20000 },
    );
    await page.goto(`${base}/designer-studio`);
    await Promise.race(toPublish.map((s) => studioLink(s.slug).waitFor({ timeout: 20000 })));
    out.studio = { trimLibraryChips: families.length, publishedFamilies: [...publishedFamilySlugs] };

    return out;
  } finally {
    await reset();
  }
}
