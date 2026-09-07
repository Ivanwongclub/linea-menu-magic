// M4 Step 1: the public catalogue reads its taxonomy from the database.
// Publishes a handful of seeds across families, then browses /products
// ANONYMOUSLY and checks the sidebar, mega-menu, family/category/segment
// filters and the listing count against the database — including that
// draft and archived products never appear.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const CODE = (i) => `E2E-TAX-${String(i).padStart(3, "0")}`;

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
  assert.ok(byFamily.size >= 2, `need seeds in at least two families, found ${byFamily.size}`);

  // Publish two seeds from each of the first three families that have any.
  const toPublish = [...byFamily.values()].slice(0, 3).flatMap((list) => list.slice(0, 2));
  // One more seed goes ARCHIVED (but public) and one stays DRAFT (but public): neither may show.
  const spare = [...byFamily.values()].flat().filter((s) => !toPublish.includes(s));
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

    const fam = toPublish[0].family;
    const famCats = catsOf(fam);
    const expectedFamily = await countIn(famCats.map((c) => c.id));
    const cat = categories.find((c) => c.id === toPublish[0].category_id);
    const expectedCategory = await countIn([cat.id]);
    const segment = fam.segment;
    const expectedSegment = await countIn(
      families.filter((f) => f.segment === segment).flatMap((f) => catsOf(f).map((c) => c.id)),
    );

    const countText = (n) => page.getByText(new RegExp(`^${n} products?$`)).first();
    const out = { expectedAll, expectedFamily, expectedCategory, expectedSegment, familyUsed: fam.slug, categoryUsed: cat.slug, segmentUsed: segment };

    /* ---- anonymous listing: every published product, nothing else ---- */
    await page.goto(`${base}/products`);
    await h.dismissCookies();
    await countText(expectedAll).waitFor({ timeout: 20000 });
    // no stale-slug undercount: the archived and draft seeds are absent
    for (const s of [archivedSeed, draftSeed]) {
      assert.equal(await page.locator(`a[href="/products/${s.slug}"]`).count(), 0, `${s.slug} (${s === archivedSeed ? "archived" : "draft"}) must not be listed`);
    }
    assert.equal(await page.locator(`a[href="/products/${toPublish[0].slug}"]`).count(), 1, "a published seed is listed");

    /* ---- sidebar is the database structure, in English ---- */
    const sidebar = page.locator("aside");
    for (const f of families) {
      await sidebar.getByRole("button", { name: f.name, exact: true }).waitFor();
    }
    for (const c of famCats) await sidebar.locator(`label[for="cat-${c.slug}"]`).waitFor();
    out.sidebarFamilies = families.map((f) => f.name);

    /* ---- family filter resolves through the database ---- */
    await sidebar.getByRole("button", { name: fam.name, exact: true }).click();
    await page.waitForURL((u) => u.searchParams.get("family") === fam.slug);
    await countText(expectedFamily).waitFor({ timeout: 20000 });
    assert.equal(await page.locator(`a[href="/products/${toPublish[0].slug}"]`).count(), 1);
    // chip carries the database name
    await page.getByText(fam.name, { exact: true }).first().waitFor();

    /* ---- category filter by slug (the mega-menu's link shape) ---- */
    await page.goto(`${base}/products?category=${cat.slug}`);
    await countText(expectedCategory).waitFor({ timeout: 20000 });

    /* ---- segment filter resolves through product_families.segment ---- */
    await page.goto(`${base}/products`);
    await sidebar.getByRole("button", { name: { apparel: "Apparel", beauty: "Beauty", material: "Material" }[segment], exact: true }).click();
    await page.waitForURL((u) => u.searchParams.get("segment") === segment);
    await countText(expectedSegment).waitFor({ timeout: 20000 });

    /* ---- an unknown family yields nothing, not everything ---- */
    await page.goto(`${base}/products?family=no-such-family`);
    await page.getByText("No products found").waitFor({ timeout: 20000 });

    /* ---- mega-menu: families and category links from the database ---- */
    await page.goto(`${base}/products`);
    await page.locator('nav a[href="/products"]').first().hover();
    const mega = page.locator(`a[href="/products?category=${cat.slug}"]`).first();
    await mega.waitFor({ state: "visible", timeout: 10000 });
    assert.equal((await mega.textContent())?.trim(), cat.name);
    await page.locator(`a[href="/products?family=${fam.slug}"]`).first().waitFor({ state: "visible" });
    const megaFamilyLinks = await page.locator('a[href^="/products?family="]').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    for (const f of families) assert.ok(megaFamilyLinks.includes(f.name), `mega-menu lists ${f.name}`);
    out.megaMenuFamilies = [...new Set(megaFamilyLinks)];

    /* ---- Traditional Chinese: same structure, Chinese names ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));
    await page.goto(`${base}/products`);
    const zhFam = families.find((f) => f.name_zh_hant) ?? fam;
    await sidebar.getByRole("button", { name: zhFam.name_zh_hant, exact: true }).waitFor({ timeout: 20000 });
    const zhCat = famCats.find((c) => c.name_zh_hant);
    if (zhCat) await sidebar.locator(`label[for="cat-${zhCat.slug}"]`).filter({ hasText: zhCat.name_zh_hant }).waitFor();
    out.zhHant = { family: zhFam.name_zh_hant, category: zhCat?.name_zh_hant ?? null };

    /* ---- Designer Studio surfaces read the same source ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "en"));
    await page.goto(`${base}/designer-studio/trim-library`);
    for (const f of families) await page.getByRole("button", { name: f.name, exact: true }).waitFor({ timeout: 20000 });
    // Both studio surfaces show one pick per family; the chip narrows to that family.
    const famSlugs = byFamily.get(fam.slug).filter((s) => toPublish.includes(s)).map((s) => s.slug);
    const studioLink = (slug) => page.locator(`a[href="/designer-studio/products/${slug}"]`).first();
    await page.getByRole("button", { name: fam.name, exact: true }).click();
    // placeholderData keeps the previous grid until the family query lands — wait for the narrowed state
    await page.waitForFunction(
      (ok) => {
        const links = [...document.querySelectorAll('a[href^="/designer-studio/products/"]')].map((e) => e.getAttribute("href").split("/").pop());
        return links.length > 0 && links.every((slug) => ok.includes(slug));
      },
      famSlugs,
      { timeout: 20000 },
    );
    const shown = await page.locator('a[href^="/designer-studio/products/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href").split("/").pop()));
    assert.ok(shown.every((slug) => famSlugs.includes(slug)), `trim library narrowed to ${fam.slug}: ${shown.join(",")}`);
    await page.goto(`${base}/designer-studio`);
    await Promise.race(toPublish.map((s) => studioLink(s.slug).waitFor({ timeout: 20000 })));
    out.studio = { trimLibraryChips: families.length, narrowedTo: shown };

    return out;
  } finally {
    await reset();
  }
}
