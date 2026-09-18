// Phase 6a R1/R2/R4/R7 — printed layers: a relief type of its own (flat, no
// depth), ink in a paint colour, raster artwork accepted for printing, and the
// strip checking the print line's own minimum feature.
import assert from "node:assert/strict";
import path from "node:path";
import { REPO_ROOT } from "../lib/stack.mjs";
import {
  LAYER_PAINT,
  addSampleText,
  colourAt,
  glyphReports,
  hueDistance,
  labOfHex,
  openEditorFor,
  pickLayerFinish,
  reliefReports,
  samplePoint,
  setMode,
  stageAppearance,
  waitForRecipe,
} from "../lib/appearance.mjs";

const RASTER = path.join(REPO_ROOT, "scripts/e2e-local/fixtures/logo-raster.png");
const PRINT_MIN_FEATURE_MM = 0.35;

export default async function ({ page, base, admin, editor, h }) {
  const { product, finishes, restore } = await stageAppearance(admin, "sample-snap-fasteners-jeans-buttons", "e2e-appearance-printed.obj");
  const { data: paintProcess } = await admin.from("finish_processes").select("id, name, min_feature_mm, min_deboss_depth_mm, max_deboss_depth_mm").eq("code", "PAINT").single();
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await admin.from("design_assets").delete().eq("owner_id", editor.userId);
    const setPrintThresholds = async (values) => {
      const { error } = await admin.from("finish_processes").update(values).eq("id", paintProcess.id);
      if (error) throw new Error(error.message);
    };
    await setPrintThresholds({ min_feature_mm: PRINT_MIN_FEATURE_MM });

    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);
    const canvas = page.getByTestId("editor-viewport").locator("canvas").first();
    await addSampleText(page);

    /* ---- 1. Printed is a relief type (R1) ---- */
    await page.locator('[data-testid="relief-type"] [data-value="printed"]').click();
    const printedRecipe = await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.relief?.type === "printed", "printed relief stored");
    assert.equal(printedRecipe.layers[0].appearance.mode, "printed", "and an appearance at the same time");
    assert.equal(await page.getByTestId("layer-appearance").first().getAttribute("data-mode"), "printed", "the appearance control agrees");
    assert.equal(await page.getByTestId("relief-depth-input").count(), 0, "printed ink has no depth to type");
    out.printedRelief = printedRecipe.layers[0].relief.type;

    /* ---- 2. flat: nothing extruded, nothing carved ---- */
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-reliefs") ?? "[]")[0]?.type === "printed",
      null,
      { timeout: 20000 },
    );
    const [flat] = await reliefReports(page);
    assert.equal(flat.heightMm, null, "a printed layer stands nothing proud");
    assert.equal(flat.floorMm, null, "and carves nothing");
    assert.equal(flat.wallMeshes, 0);
    assert.equal(flat.openingMeshes, 0);
    assert.equal(flat.pieces, 2, "both glyphs are drawn");

    /* ---- 3. the ink is the paint colour (R2/R7) ---- */
    await pickLayerFinish(page, LAYER_PAINT);
    const inked = await waitForRecipe(page, admin, designId, (r) => r.layers[0].appearance.finish_id === finishes[LAYER_PAINT].id, "ink colour stored");
    assert.deepEqual(inked.layers[0].appearance, { mode: "printed", finish_id: finishes[LAYER_PAINT].id, custom: null });
    const [printed] = await reliefReports(page);
    assert.equal(printed.colourHex, finishes[LAYER_PAINT].base_color_hex.toUpperCase());
    const glyph = (await glyphReports(page))[0];
    await page.waitForTimeout(1000);
    const ink = await colourAt(page, canvas, samplePoint(glyph, printed));
    const hue = hueDistance(ink.lab, labOfHex(finishes[LAYER_PAINT].base_color_hex));
    assert.ok(ink.lab[2] < -8 && hue <= 35, `the ink reads as the paint colour (b* ${ink.lab[2].toFixed(1)}, hue ${hue.toFixed(1)}°, rgb ${ink.rgb})`);
    out.ink = { rgb: ink.rgb, hueFromFinish: +hue.toFixed(1) };

    /* ---- 4. the strip checks the print line's minimum feature (R4) ---- */
    // Only the stroke check is this scenario's business: the edge-margin line
    // is 4j's, and a 3.6 mm letter on a 15 mm face is close to the rim.
    const strokeWarnings = () => page.locator('[data-testid="manufacturing-warning"][data-kind="stroke"]').allInnerTexts();
    assert.deepEqual(await strokeWarnings(), [], "3.6 mm text prints fine");
    await page.getByTestId("pc-text-size-input").fill("0.6");
    await page.getByTestId("pc-text-size-input").blur();
    await page.waitForFunction(
      () => !!document.querySelector('[data-testid="manufacturing-warning"][data-kind="stroke"]'),
      null,
      { timeout: 20000 },
    );
    const warning = page.locator('[data-testid="manufacturing-warning"][data-kind="stroke"]');
    const text = (await warning.innerText()).trim();
    assert.match(text, /^⚠ Printed stroke 0\.\d{2} mm — below the 0\.35 mm minimum for painting$/, text);
    out.printWarning = text;
    await page.getByTestId("pc-text-size-input").fill("3.6");
    await page.getByTestId("pc-text-size-input").blur();

    /* ---- 5. with no print threshold, nothing is said about ink (R4) ---- */
    await setPrintThresholds({ min_feature_mm: null });
    await page.reload({ waitUntil: "networkidle" });
    await canvas.waitFor({ timeout: 40000 });
    await page.getByTestId("text-layer-select").first().click();
    await page.getByTestId("position-and-curve-toggle").click();
    await page.getByTestId("pc-text-size-input").fill("0.6");
    await page.getByTestId("pc-text-size-input").blur();
    await page.waitForTimeout(2500);
    assert.deepEqual(await strokeWarnings(), [], "an unset print minimum says nothing about ink");
    await setPrintThresholds({ min_feature_mm: PRINT_MIN_FEATURE_MM });

    /* ---- 6. a raster is accepted, for printing only (R2) ---- */
    await page.getByTestId("logo-input").setInputFiles(RASTER);
    const withRaster = await waitForRecipe(page, admin, designId, (r) => r.layers.length === 2 && r.layers[1].kind === "logo", "raster layer stored");
    assert.equal(withRaster.layers[1].relief.type, "printed", "a bitmap has no outline to extrude, so it lands printed");
    assert.equal(withRaster.layers[1].appearance.mode, "printed");
    assert.ok(Math.abs(withRaster.layers[1].content.aspect - 256 / 160) < 0.01, "at the artwork's own aspect");
    const { data: assets } = await admin.from("design_assets").select("id, kind, mime_type, storage_path").eq("owner_id", editor.userId);
    assert.equal(assets.length, 1, "one asset for one raster");
    assert.equal(assets[0].mime_type, "image/png");
    assert.equal(assets[0].kind, "texture", "a raster is stored as the texture it renders as");
    assert.ok(assets[0].storage_path.endsWith(".png"), assets[0].storage_path);
    await page.waitForFunction(() => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-logo-count") === "1", null, { timeout: 30000 });
    const logos = JSON.parse(await page.getByTestId("editor-viewport").getAttribute("data-logos"));
    assert.equal(logos.length, 1, "and it is on the face");
    assert.ok(Math.abs(logos[0].measuredWidthMm - logos[0].widthMm) < 0.01, "the decal is the width the recipe asks for");
    // 6b R9: the two relief choices a bitmap has no outline for are offered but
    // disabled, with the reason beside them — not silently missing.
    const rasterRelief = page.locator('[data-testid="layer-relief"][data-layer-id="' + withRaster.layers[1].id + '"]');
    for (const type of ["emboss", "deboss"]) {
      assert.equal(await rasterRelief.locator(`[data-value="${type}"]`).getAttribute("aria-disabled"), "true", `${type} is offered but disabled for a bitmap`);
    }
    assert.equal(await rasterRelief.locator('[data-value="printed"]').getAttribute("aria-disabled"), "false");
    const reason = (await rasterRelief.getByTestId("relief-raster-reason").innerText()).trim();
    assert.match(reason, /vector/i, reason);
    out.raster = { kind: assets[0].kind, widthMm: +logos[0].widthMm.toFixed(2), reason };

    return out;
  } finally {
    await admin.from("finish_processes").update({ min_feature_mm: paintProcess.min_feature_mm }).eq("id", paintProcess.id);
    for (const asset of (await admin.from("design_assets").select("storage_path").eq("owner_id", editor.userId)).data ?? []) {
      await admin.storage.from("design-uploads").remove([asset.storage_path]);
    }
    await admin.from("design_assets").delete().eq("owner_id", editor.userId);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
