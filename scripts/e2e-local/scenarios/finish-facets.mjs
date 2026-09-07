// M4 Step 4: finish facets on the public listing. Two metal seeds in one
// family carry finishes with different SURFACE values; a non-metal seed in
// another family has none. Browses ANONYMOUSLY: the rail exists only in a
// scope with metal products, a facet narrows to products carrying a
// matching finish (OR within the axis), the selection round-trips through
// the URL and its chip, and a non-metal scope has no rail.
import assert from "node:assert/strict";

export default async function ({ page, base, admin, h }) {
  /* ---- data: families, seeds, a metal material, two public finishes on different surfaces ---- */
  const { data: families } = await admin.from("product_families").select("id, slug, name").eq("is_active", true).order("sort_order");
  const { data: categories } = await admin.from("product_categories").select("id, slug, family_id").eq("is_active", true);
  const catsOf = (fam) => categories.filter((c) => c.family_id === fam.id);
  const seedsIn = async (fam, n) => {
    const { data } = await admin
      .from("product_category_map")
      .select("product_id, products!inner(id, slug, material_id)")
      .in("category_id", catsOf(fam).map((c) => c.id))
      .like("products.slug", "sample-%");
    const uniq = [...new Map(data.map((r) => [r.products.id, r.products])).values()];
    assert.ok(uniq.length >= n, `need ${n} seeds in ${fam.slug}`);
    return uniq.slice(0, n);
  };
  const metalFam = families.find((f) => f.slug === "buttons");
  const otherFam = families.find((f) => f.slug === "laces-ribbons");
  const [A, B] = await seedsIn(metalFam, 2);
  const [C] = await seedsIn(otherFam, 1);

  const { data: metals } = await admin.from("product_materials").select("id").eq("is_metal", true).limit(1);
  const { data: nonMetals } = await admin.from("product_materials").select("id").eq("is_metal", false).limit(1);
  assert.ok(metals?.length && nonMetals?.length, "need a metal and a non-metal material");

  // The anonymous finishes policy is is_public = true. The local seed has
  // none public, so publish the two this scenario uses and restore after.
  const { data: finishes } = await admin
    .from("finishes")
    .select("id, cyc_code, marketing_name, surface_id, is_public")
    .not("surface_id", "is", null)
    .order("sort_order");
  const f1 = finishes[0];
  const f2 = finishes.find((f) => f.surface_id !== f1.surface_id);
  assert.ok(f2, "need two finishes on different surfaces");
  const { data: surfaces } = await admin.from("finish_surfaces").select("id, code, name").in("id", [f1.surface_id, f2.surface_id]);
  const s1 = surfaces.find((s) => s.id === f1.surface_id);
  const s2 = surfaces.find((s) => s.id === f2.surface_id);

  const touched = [A, B, C];
  const reset = async () => {
    await admin.from("product_finishes").delete().in("product_id", [A.id, B.id]);
    for (const f of [f1, f2]) await admin.from("finishes").update({ is_public: f.is_public }).eq("id", f.id);
    for (const p of touched) {
      await admin.from("products").update({ status: "draft", is_public: false, item_code: null, material_id: p.material_id }).eq("id", p.id);
    }
  };
  await reset();
  try {
    for (const f of [f1, f2]) {
      const { error } = await admin.from("finishes").update({ is_public: true }).eq("id", f.id);
      if (error) throw error;
    }
    // A: metal, finishes f1 + f2.  B: metal, finish f2 only.  C: non-metal, no finishes.
    for (const [i, p] of [A, B].entries()) {
      const { error } = await admin.from("products").update({ material_id: metals[0].id, status: "active", is_public: true, item_code: `E2E-FCT-${i + 1}` }).eq("id", p.id);
      if (error) throw error;
    }
    const { error: cErr } = await admin.from("products").update({ material_id: nonMetals[0].id, status: "active", is_public: true, item_code: "E2E-FCT-3" }).eq("id", C.id);
    if (cErr) throw cErr;
    const { error: pfErr } = await admin.from("product_finishes").insert([
      { product_id: A.id, finish_id: f1.id, sort_order: 0 },
      { product_id: A.id, finish_id: f2.id, sort_order: 1 },
      { product_id: B.id, finish_id: f2.id, sort_order: 0 },
    ]);
    if (pfErr) throw pfErr;
    const { count: all } = await admin.from("products").select("id", { count: "exact", head: true }).eq("status", "active").eq("is_public", true);

    const countText = (n) => page.getByText(new RegExp(`^${n} products?$`)).first();
    const rail = page.locator('aside [data-testid="finish-facets"]');
    const facet = (code) => rail.locator(`[data-testid="facet-surface-${code}"]`);
    const out = { all, surfaces: [s1.code, s2.code], finishes: [f1.cyc_code ?? f1.marketing_name, f2.cyc_code ?? f2.marketing_name] };

    /* ---- whole catalogue: rail present, both surface values offered ---- */
    await page.goto(`${base}/products`);
    await h.dismissCookies();
    await countText(all).waitFor({ timeout: 20000 });
    await rail.waitFor({ timeout: 20000 });
    await facet(s1.code).waitFor();
    await facet(s2.code).waitFor();
    // facet counts are finishes in scope: s1 carries f1 (1), s2 carries f2 (1)
    assert.equal((await facet(s1.code).locator('[data-testid="facet-count"]').textContent()).trim(), "1");

    /* ---- one facet: only the product carrying a matching finish ---- */
    await facet(s1.code).click();
    await page.waitForURL((u) => u.searchParams.get("finish") === `surface:${s1.code}`);
    await countText(1).waitFor({ timeout: 20000 });
    assert.equal(await page.locator(`a[href="/products/${A.slug}"]`).count(), 1, "A (f1) matches");
    assert.equal(await page.locator(`a[href="/products/${B.slug}"]`).count(), 0, "B (f2 only) does not");
    assert.equal(await page.locator(`a[href="/products/${C.slug}"]`).count(), 0, "C (no finishes) does not");
    // chip carries axis label + value name
    await page.getByText(`Surface: ${s1.name}`, { exact: true }).waitFor();

    /* ---- second value on the same axis: OR within the axis ---- */
    await facet(s2.code).click();
    await page.waitForURL((u) => (u.searchParams.get("finish") ?? "").split(",").length === 2);
    await countText(2).waitFor({ timeout: 20000 });
    assert.equal(await page.locator(`a[href="/products/${B.slug}"]`).count(), 1, "B now matches via f2");
    out.orWithinAxis = 2;

    /* ---- bookmarkable: family + finish straight from the URL ---- */
    await page.goto(`${base}/products?family=${metalFam.slug}&finish=surface:${s1.code}`);
    await countText(1).waitFor({ timeout: 20000 });

    /* ---- chip removal clears the finish param and widens again ---- */
    await page.locator("span").filter({ hasText: new RegExp(`^Surface: ${s1.name}$`) }).getByRole("button").click();
    await page.waitForURL((u) => !u.searchParams.has("finish") && u.searchParams.get("family") === metalFam.slug);
    await countText(2).waitFor({ timeout: 20000 });

    /* ---- non-metal scope: no rail at all ---- */
    await page.goto(`${base}/products?family=${otherFam.slug}`);
    await countText(1).waitFor({ timeout: 20000 });
    assert.equal(await rail.count(), 0, "no finish rail when the scope has no metal products");
    out.railInNonMetalScope = false;

    /* ---- anonymous read of the attachments themselves follows product visibility ---- */
    const { createClient } = await import("@supabase/supabase-js");
    const st = JSON.parse((await import("node:fs")).readFileSync((await import("node:os")).tmpdir() + "/linea-e2e-local/status.json", "utf8"));
    const anon = createClient(st.API_URL, st.ANON_KEY, { auth: { persistSession: false } });
    const { data: anonRows } = await anon.from("product_finishes").select("product_id").in("product_id", [A.id, B.id]);
    assert.equal(anonRows.length, 3, "published products' attachments are readable anonymously");
    await admin.from("products").update({ status: "draft" }).eq("id", B.id);
    const { data: afterDraft } = await anon.from("product_finishes").select("product_id").in("product_id", [A.id, B.id]);
    assert.equal(afterDraft.length, 2, "a drafted product's attachments vanish for anonymous readers");
    out.anonAttachments = { published: anonRows.length, afterDraftingB: afterDraft.length };
    return out;
  } finally {
    await reset();
  }
}
