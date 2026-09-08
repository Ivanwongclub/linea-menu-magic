// M5 item 6: colour and finish, branching on the material.
//
// Metal products show their attached PUBLIC finishes as rendered swatches
// from the shared finishes module, opening on the default. Non-metal
// products show their colour list. A product that is neither renders
// nothing. Selecting a finish changes the name and code and must NOT
// touch the hero image, because per-finish photography does not exist.
import assert from "node:assert/strict";
import sharp from "sharp";

const BUCKET = "product-assets";
const ZH_NAME = "拉絲鎳測試";

export default async function ({ page, base, admin, h }) {
  const { data: seeds } = await admin
    .from("products")
    .select("id, slug, name, status, is_public, item_code, material_id, default_finish_id")
    .like("slug", "sample-%")
    .order("slug")
    .limit(3);
  const [METAL, NONMETAL, NEITHER] = seeds;

  const { data: metals } = await admin.from("product_materials").select("id, name").eq("is_metal", true).limit(1);
  const { data: nonMetals } = await admin.from("product_materials").select("id, name").eq("is_metal", false).limit(1);
  const { data: finishes } = await admin
    .from("finishes")
    .select("id, cyc_code, marketing_name, marketing_name_zh_hant, is_public, surface_id, hex_approx")
    .not("surface_id", "is", null)
    .order("sort_order")
    .limit(3);
  assert.ok(metals?.length && nonMetals?.length && finishes.length === 3, "reference data");
  const [fA, fB, fPrivate] = finishes;

  const objectPaths = [];
  const restore = async () => {
    // default_finish_id must clear before the finishes and the material
    for (const p of seeds) await admin.from("products").update({ default_finish_id: null }).eq("id", p.id);
    for (const p of seeds) await admin.from("product_finishes").delete().eq("product_id", p.id);
    for (const p of seeds) await admin.from("product_colours").delete().eq("product_id", p.id);
    for (const p of seeds) await admin.from("product_images").delete().eq("product_id", p.id);
    if (objectPaths.length) await admin.storage.from(BUCKET).remove(objectPaths);
    for (const f of finishes) {
      await admin.from("finishes").update({ is_public: f.is_public, marketing_name_zh_hant: f.marketing_name_zh_hant }).eq("id", f.id);
    }
    for (const p of seeds) {
      await admin.from("products").update({
        status: p.status, is_public: p.is_public, item_code: p.item_code, material_id: p.material_id,
      }).eq("id", p.id);
    }
  };
  await restore();

  const ok = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
  try {
    for (const [i, p] of seeds.entries()) {
      ok(await admin.from("products").update({ status: "active", is_public: true, item_code: `E2E-CF-00${i + 1}` }).eq("id", p.id));
    }
    ok(await admin.from("finishes").update({ is_public: true }).in("id", [fA.id, fB.id]));
    ok(await admin.from("finishes").update({ is_public: false }).eq("id", fPrivate.id));
    ok(await admin.from("finishes").update({ marketing_name_zh_hant: ZH_NAME }).eq("id", fB.id));

    /* METAL: three attachments, one of them private; the default is the second */
    ok(await admin.from("products").update({ material_id: metals[0].id }).eq("id", METAL.id));
    ok(await admin.from("product_finishes").insert([
      { product_id: METAL.id, finish_id: fA.id, sort_order: 0 },
      { product_id: METAL.id, finish_id: fB.id, sort_order: 1 },
      { product_id: METAL.id, finish_id: fPrivate.id, sort_order: 2 },
    ]));
    ok(await admin.from("products").update({ default_finish_id: fB.id }).eq("id", METAL.id));
    // colours on a metal product must be ignored: the material decides the branch
    ok(await admin.from("product_colours").insert({ product_id: METAL.id, name: "Ignored On Metal", hex: "#123456", sort_order: 0 }));
    // one image, so there is a hero whose src can be checked for stability
    const buf = await sharp({ create: { width: 400, height: 400, channels: 3, background: "#777777" } }).png().toBuffer();
    const path = `images/${METAL.id}/e2e-cf.png`;
    ok(await admin.storage.from(BUCKET).upload(path, buf, { contentType: "image/png", upsert: true }));
    objectPaths.push(path);
    ok(await admin.from("product_images").insert({
      product_id: METAL.id, url: admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
      sort_order: 0, is_primary: true, alt_text: "Metal sample",
    }));

    /* NON-METAL: a colour list */
    ok(await admin.from("products").update({ material_id: nonMetals[0].id }).eq("id", NONMETAL.id));
    ok(await admin.from("product_colours").insert([
      { product_id: NONMETAL.id, name: "Ivory", hex: "#F4F0E6", sort_order: 0 },
      { product_id: NONMETAL.id, name: "Charcoal", hex: "#36393B", sort_order: 1 },
    ]));

    /* NEITHER: no material, nothing attached */
    ok(await admin.from("products").update({ material_id: null }).eq("id", NEITHER.id));

    const finishSection = page.getByTestId("finish-section");
    const colourSection = page.getByTestId("colour-section");
    const swatches = page.getByTestId("finish-swatch");
    const out = {};

    /* ---- METAL ---- */
    await page.goto(`${base}/products/${METAL.slug}`);
    await h.dismissCookies();
    await finishSection.waitFor({ timeout: 20000 });
    assert.equal(await colourSection.count(), 0, "a metal product shows finishes, never its colour rows");
    assert.ok(!(await page.evaluate(() => document.body.innerText)).includes("Ignored On Metal"));
    assert.equal(await swatches.count(), 2, "the private finish is not offered");

    const selectedId = async () => page.locator('[data-testid="finish-swatch"][data-selected="true"]').getAttribute("data-finish-id");
    assert.equal(await selectedId(), fB.id, "opens on the default finish, not the first attached");
    assert.equal((await page.getByTestId("finish-selected").innerText()).includes(fB.marketing_name), true, "default finish named");
    assert.equal((await page.getByTestId("finish-code").innerText()).trim(), fB.cyc_code, "and its CYC code");

    // the shared renderer is what draws the swatch
    const surfaces = await swatches.locator("[data-surface]").evaluateAll((els) => els.map((e) => e.getAttribute("data-surface")));
    assert.equal(surfaces.length, 2, `swatches rendered through the finishes module: ${surfaces.join(",")}`);
    out.surfaces = surfaces;

    // selecting another finish changes the name and code, and leaves the hero alone
    const heroSrc = () => page.getByTestId("gallery-hero").locator("img").getAttribute("src");
    const before = await heroSrc();
    await page.locator(`[data-finish-id="${fA.id}"]`).click();
    await page.waitForFunction(
      (id) => document.querySelector('[data-testid="finish-swatch"][data-selected="true"]')?.getAttribute("data-finish-id") === id,
      fA.id,
    );
    assert.ok((await page.getByTestId("finish-selected").innerText()).includes(fA.marketing_name), "name followed the selection");
    assert.equal((await page.getByTestId("finish-code").innerText()).trim(), fA.cyc_code, "code followed the selection");
    assert.equal(await heroSrc(), before, "selecting a finish must not swap the hero image");
    assert.ok(/samples/i.test(await finishSection.innerText()), "the indicative line is present");
    out.metal = { swatches: 2, defaultFirstShown: fB.cyc_code, afterClick: fA.cyc_code, heroUnchanged: true };

    /* ---- NON-METAL ---- */
    await page.goto(`${base}/products/${NONMETAL.slug}`);
    await colourSection.waitFor({ timeout: 20000 });
    assert.equal(await finishSection.count(), 0, "a non-metal product shows no finish row");
    const chips = page.getByTestId("colour-chip");
    assert.equal(await chips.count(), 2);
    const chipText = await colourSection.innerText();
    for (const expected of ["Ivory", "Charcoal", "#F4F0E6", "#36393B"]) {
      assert.ok(chipText.includes(expected), `chip shows ${expected}`);
    }
    const dot = await chips.first().getByTestId("colour-dot").evaluate((el) => getComputedStyle(el).backgroundColor);
    assert.equal(dot, "rgb(244, 240, 230)", "the chip is coloured by its hex");
    assert.ok(/samples/i.test(chipText), "the indicative line is present here too");
    out.nonMetal = { chips: 2, firstDot: dot };

    /* ---- NEITHER ---- */
    await page.goto(`${base}/products/${NEITHER.slug}`);
    await page.locator("#pdp-overview").waitFor({ timeout: 20000 });
    assert.equal(await finishSection.count(), 0);
    assert.equal(await colourSection.count(), 0, "no empty section, no placeholder");
    out.neither = { sections: 0 };

    /* ---- Traditional Chinese ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));
    await page.goto(`${base}/products/${METAL.slug}`);
    await finishSection.waitFor({ timeout: 20000 });
    const zhFinish = await finishSection.innerText();
    assert.ok(zhFinish.includes("表面處理"), "finish heading translated");
    assert.ok(zhFinish.includes(ZH_NAME), `the finish name is localised: ${zhFinish.replace(/\n/g, " | ")}`);
    await page.goto(`${base}/products/${NONMETAL.slug}`);
    await colourSection.waitFor({ timeout: 20000 });
    assert.ok((await colourSection.innerText()).includes("顏色"), "colour heading translated");
    out.zhHant = zhFinish.replace(/\n+/g, " | ");

    return out;
  } finally {
    await restore();
  }
}
