// M4 close-out: the /products sidebar is a sticky column bounded to the
// viewport with its own scroll, so the finish rail at its bottom is
// reachable without scrolling the page past the whole category list
// (the Phase 6 picker defect, on the storefront). Measured, not just
// present: with the column scrolled to its bottom, the rail sits inside
// the viewport while the page itself has not moved. With many categories
// showing, families collapse by default and carry product counts; the
// family in play stays open.
import assert from "node:assert/strict";

export default async function ({ page, base, admin, h }) {
  /* ---- publish EVERY seed so all categories show, plus a metal one with finishes ---- */
  const { data: seeds } = await admin.from("products").select("id, slug, material_id, status, is_public, item_code").like("slug", "sample-%");
  const { data: metals } = await admin.from("product_materials").select("id").eq("is_metal", true).limit(1);
  const { data: finishes } = await admin.from("finishes").select("id, surface_id, is_public").not("surface_id", "is", null).order("sort_order").limit(2);
  const { data: fams } = await admin.from("product_families").select("id, slug, name").eq("is_active", true).order("sort_order");
  const { data: cats } = await admin.from("product_categories").select("id, slug, family_id").eq("is_active", true);
  const buttons = fams.find((f) => f.slug === "buttons");
  const { data: inButtons } = await admin
    .from("product_category_map")
    .select("product_id")
    .in("category_id", cats.filter((c) => c.family_id === buttons.id).map((c) => c.id));
  const metalSeed = seeds.find((s) => inButtons.some((m) => m.product_id === s.id));
  assert.ok(metalSeed && finishes.length === 2, "need a Buttons seed and two finishes");

  const reset = async () => {
    await admin.from("product_finishes").delete().eq("product_id", metalSeed.id);
    for (const f of finishes) await admin.from("finishes").update({ is_public: f.is_public }).eq("id", f.id);
    for (const s of seeds) {
      await admin.from("products").update({ status: s.status, is_public: s.is_public, item_code: s.item_code, material_id: s.material_id }).eq("id", s.id);
    }
  };
  try {
    for (const [i, s] of seeds.entries()) {
      const { error } = await admin
        .from("products")
        .update({ status: "active", is_public: true, item_code: s.item_code ?? `E2E-LAY-${String(i + 1).padStart(3, "0")}`, ...(s.id === metalSeed.id ? { material_id: metals[0].id } : {}) })
        .eq("id", s.id);
      if (error) throw error;
    }
    for (const f of finishes) await admin.from("finishes").update({ is_public: true }).eq("id", f.id);
    const { error: pfErr } = await admin.from("product_finishes").insert(finishes.map((f, i) => ({ product_id: metalSeed.id, finish_id: f.id, sort_order: i })));
    if (pfErr) throw pfErr;

    // what should be visible
    const { data: visibleMaps } = await admin.from("product_category_map").select("category_id, products!inner(id)").eq("products.status", "active").eq("products.is_public", true);
    const catsWithProducts = new Set(visibleMaps.map((m) => m.category_id));
    const shownFamilies = fams.filter((f) => cats.some((c) => c.family_id === f.id && catsWithProducts.has(c.id)));
    const shownCategories = cats.filter((c) => catsWithProducts.has(c.id) && shownFamilies.some((f) => f.id === c.family_id));
    assert.ok(shownCategories.length > 10, `enough categories to force collapse: ${shownCategories.length}`);
    const out = { families: shownFamilies.length, categories: shownCategories.length };

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(`${base}/products`);
    await h.dismissCookies();
    const aside = page.getByTestId("products-sidebar");
    const rail = aside.getByTestId("finish-facets");
    await rail.waitFor({ timeout: 20000 });

    /* ---- collapsed by default, counts on the family row ---- */
    for (const f of shownFamilies) {
      assert.equal(await aside.getByTestId(`family-toggle-${f.slug}`).getAttribute("aria-expanded"), "false", `${f.slug} starts collapsed`);
      const famCats = cats.filter((c) => c.family_id === f.id && catsWithProducts.has(c.id));
      const distinct = new Set(visibleMaps.filter((m) => famCats.some((c) => c.id === m.category_id)).map((m) => m.products.id)).size;
      assert.equal((await aside.getByTestId(`family-count-${f.slug}`).textContent()).trim(), String(distinct), `${f.slug} family count`);
    }
    assert.equal(await aside.locator('label[for^="cat-"]').count(), 0, "no category rows while collapsed");
    out.collapsedByDefault = true;

    /* ---- the column scrolls on its own; the page does not ---- */
    const m = await aside.evaluate((el) => ({
      position: getComputedStyle(el).position,
      overflowY: getComputedStyle(el).overflowY,
      clientHeight: el.clientHeight,
      scrollHeight: el.scrollHeight,
      top: el.getBoundingClientRect().top,
    }));
    assert.equal(m.position, "sticky");
    assert.equal(m.overflowY, "auto");
    assert.ok(m.clientHeight <= 800 - 80 + 1, `column bounded to the viewport: ${m.clientHeight}`);
    out.column = m;

    // expand every family so the column is genuinely longer than the viewport
    for (const f of shownFamilies) await aside.getByTestId(`family-toggle-${f.slug}`).click();
    await aside.locator('label[for^="cat-"]').first().waitFor();
    assert.equal(await aside.locator('label[for^="cat-"]').count(), shownCategories.length, "all categories shown once expanded");
    const expanded = await aside.evaluate((el) => ({ clientHeight: el.clientHeight, scrollHeight: el.scrollHeight }));
    assert.ok(expanded.scrollHeight > expanded.clientHeight, `column overflows and scrolls: ${JSON.stringify(expanded)}`);

    // engage the sticky (the column sits below the breadcrumb until the page scrolls a little)
    await page.evaluate(() => window.scrollTo(0, 240));
    await page.waitForTimeout(150);
    assert.equal(Math.round(await aside.evaluate((el) => el.getBoundingClientRect().top)), 80, "column stuck at the header line");
    const before = await page.evaluate(() => window.scrollY);
    await aside.evaluate((el) => { el.scrollTop = el.scrollHeight; });
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => window.scrollY);
    assert.equal(after, before, "scrolling the column does not scroll the page");

    /* ---- measured: the rail is inside the viewport with the column at its bottom ---- */
    const railBox = await rail.evaluate((el) => { const r = el.getBoundingClientRect(); return { top: r.top, bottom: r.bottom }; });
    const viewportH = await page.evaluate(() => window.innerHeight);
    assert.ok(railBox.top >= 80 && railBox.top < viewportH, `rail top within the viewport: ${railBox.top}`);
    assert.ok(railBox.bottom <= viewportH + 1, `rail bottom within the viewport: ${railBox.bottom} vs ${viewportH}`);
    await rail.locator('[data-testid^="facet-surface-"]').first().waitFor();
    out.railWhenColumnScrolledToBottom = { top: Math.round(railBox.top), bottom: Math.round(railBox.bottom), viewport: viewportH, expandedScrollHeight: expanded.scrollHeight };

    /* ---- the family in play stays open by default ---- */
    await page.goto(`${base}/products?family=${buttons.slug}`);
    await aside.getByTestId(`family-toggle-${buttons.slug}`).waitFor();
    assert.equal(await aside.getByTestId(`family-toggle-${buttons.slug}`).getAttribute("aria-expanded"), "true", "active family open");
    const other = shownFamilies.find((f) => f.slug !== buttons.slug);
    assert.equal(await aside.getByTestId(`family-toggle-${other.slug}`).getAttribute("aria-expanded"), "false", "others stay collapsed");
    out.activeFamilyOpen = true;

    return out;
  } finally {
    await reset();
  }
}
