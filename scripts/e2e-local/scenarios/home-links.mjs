// M4 Step 5: the footer, the home category tiles and the hero CTAs link
// to working query-string filters on the database taxonomy. A target with
// nothing published falls back to the full listing (footer: omitted).
// Browses ANONYMOUSLY and follows the links to the count the database gives.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const FOOTER_FAMILIES = ["buttons", "zippers", "laces-ribbons", "metal-hardware-accessories"];

export default async function ({ page, base, admin, status, h }) {
  const anon = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
  const { data: families } = await admin.from("product_families").select("id, slug").eq("is_active", true);
  const { data: categories } = await admin.from("product_categories").select("id, slug, family_id").eq("is_active", true);
  const famBySlug = (slug) => families.find((f) => f.slug === slug);
  const catsOf = (fam) => categories.filter((c) => c.family_id === fam.id);

  // Publish one seed in Buttons and one in Metal & Hardware; leave Laces & Ribbons empty.
  const seedIn = async (familySlug) => {
    const fam = famBySlug(familySlug);
    const { data } = await admin
      .from("product_category_map")
      .select("product_id, products!inner(id, slug)")
      .in("category_id", catsOf(fam).map((c) => c.id))
      .like("products.slug", "sample-%")
      .limit(1);
    assert.ok(data?.length, `a seed exists in ${familySlug}`);
    return data[0].products;
  };
  const published = [await seedIn("buttons"), await seedIn("metal-hardware-accessories")];
  const reset = () =>
    admin.from("products").update({ status: "draft", is_public: false, item_code: null }).in("id", published.map((p) => p.id));
  await reset();
  try {
    for (const [i, p] of published.entries()) {
      const { error } = await admin.from("products").update({ status: "active", is_public: true, item_code: `E2E-LNK-${i + 1}` }).eq("id", p.id);
      if (error) throw error;
    }
    const countIn = async (catIds) => {
      const { data } = await admin.from("product_category_map").select("product_id").in("category_id", catIds);
      const ids = [...new Set(data.map((r) => r.product_id))];
      if (!ids.length) return 0;
      const { count } = await anon.from("products").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_public", true).in("id", ids);
      return count;
    };
    const familyCount = async (slug) => countIn(catsOf(famBySlug(slug)).map((c) => c.id));
    const nonEmpty = [];
    for (const slug of FOOTER_FAMILIES) if ((await familyCount(slug)) > 0) nonEmpty.push(slug);
    assert.ok(nonEmpty.includes("buttons") && !nonEmpty.includes("laces-ribbons"));
    const { count: all } = await anon.from("products").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_public", true);
    const out = { nonEmptyFamilies: nonEmpty, all };

    await page.goto(`${base}/`);
    await h.dismissCookies();

    /* ---- footer: family links, empty family omitted, "other" = full listing ---- */
    const footer = page.locator("footer");
    await footer.locator('a[href="/products?family=buttons"]').waitFor({ timeout: 20000 });
    const footerHrefs = await footer.locator('a[href^="/products"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    for (const slug of nonEmpty) assert.ok(footerHrefs.includes(`/products?family=${slug}`), `footer links ${slug}`);
    assert.ok(!footerHrefs.some((h) => h.includes("laces-ribbons")), "empty family is omitted from the footer");
    assert.ok(footerHrefs.includes("/products"), "the 'other' entry opens the full listing");
    assert.ok(!footerHrefs.some((h) => h.includes("#")), "no hash links remain");
    out.footer = footerHrefs;

    /* ---- home tiles: family links; empty family falls back to the full listing ---- */
    const tile = (id) => page.getByTestId(`home-category-${id}`);
    await page.waitForFunction(() => document.querySelector('[data-testid="home-category-buttons"]')?.getAttribute("href") === "/products?family=buttons", null, { timeout: 20000 });
    assert.equal(await tile("hardware").getAttribute("href"), "/products?family=metal-hardware-accessories");
    assert.equal(await tile("lace").getAttribute("href"), "/products", "empty family tile falls back");
    assert.equal(await tile("other").getAttribute("href"), "/products");
    out.tiles = { zippers: await tile("zippers").getAttribute("href") };

    /* ---- hero CTAs: every slide's CTA is a family/category filter or the listing ---- */
    const heroHrefs = await page.locator('a[href^="/products"]').evaluateAll((els) =>
      els.filter((e) => e.closest("section") && !e.closest("footer") && !e.closest("nav")).map((e) => e.getAttribute("href")),
    );
    assert.ok(heroHrefs.every((h) => /^\/products(\?(family|category)=[a-z0-9-]+)?$/.test(h)), `hero hrefs well-formed: ${heroHrefs.join(" ")}`);
    assert.ok(heroHrefs.includes("/products?family=buttons"), "buttons slide CTA");
    out.heroHrefs = [...new Set(heroHrefs)];

    /* ---- follow one: the count is the database's ---- */
    await footer.locator('a[href="/products?family=buttons"]').click();
    await page.waitForURL((u) => u.pathname === "/products" && u.searchParams.get("family") === "buttons");
    const expected = await familyCount("buttons");
    await page.getByText(new RegExp(`^${expected} products?$`)).first().waitFor({ timeout: 20000 });
    out.followed = { family: "buttons", count: expected };

    return out;
  } finally {
    await reset();
  }
}
