// Phase 6a R2/R7 — paint on a layer, which on an engraved one is the fill of
// axis-design §3: colour on the recess floor and walls, plating left on the rim.
import assert from "node:assert/strict";
import {
  LAYER_PAINT,
  LAYER_PLATED,
  addSampleText,
  chroma,
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

export default async function ({ page, base, admin, editor, h }) {
  const { product, finishes, restore } = await stageAppearance(admin, "sample-metal-zippers", "e2e-appearance-paint.obj");
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);
    const canvas = page.getByTestId("editor-viewport").locator("canvas").first();
    await addSampleText(page);

    /* ---- engraved, still the part's own plating ---- */
    await page.locator('[data-testid="relief-type"] [data-value="deboss"]').click();
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-reliefs") ?? "[]")[0]?.floorMm != null,
      null,
      { timeout: 20000 },
    );
    const [engraved] = await reliefReports(page);
    const glyph = (await glyphReports(page))[0];
    await page.waitForTimeout(800);
    const beforeFill = await colourAt(page, canvas, samplePoint(glyph, engraved));
    assert.ok(chroma(beforeFill.lab) < 12, `the recess is plated nickel before the fill (chroma ${chroma(beforeFill.lab).toFixed(1)})`);

    /* ---- the fill (R2) ---- */
    await setMode(page, "Paint colour");
    await pickLayerFinish(page, LAYER_PAINT);
    const recipe = await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.appearance?.finish_id === finishes[LAYER_PAINT].id, "fill stored");
    assert.deepEqual(recipe.layers[0].appearance, { mode: "paint", finish_id: finishes[LAYER_PAINT].id, custom: null });
    assert.equal(recipe.layers[0].relief.type, "deboss", "a fill does not change the relief");
    out.stored = recipe.layers[0].appearance;

    const [filled] = await reliefReports(page);
    assert.equal(filled.colourHex, finishes[LAYER_PAINT].base_color_hex.toUpperCase(), "the floor and walls take the paint's own colour");
    assert.ok(filled.wallMeshes > 0 && filled.floorMm != null, "the recess still has its own floor and walls");

    /* ---- and the recess is blue on screen where it was nickel (R7) ---- */
    await page.waitForTimeout(1000);
    const afterFill = await colourAt(page, canvas, samplePoint(glyph, filled));
    const paintLab = labOfHex(finishes[LAYER_PAINT].base_color_hex);
    assert.ok(afterFill.lab[2] < -8, `the fill reads blue (b* ${afterFill.lab[2].toFixed(1)}, rgb ${afterFill.rgb})`);
    const hue = hueDistance(afterFill.lab, paintLab);
    assert.ok(hue <= 35, `and in the paint's own hue: ${hue.toFixed(1)}° (rgb ${afterFill.rgb})`);
    assert.ok(beforeFill.lab[2] - afterFill.lab[2] > 8, "the same point changed when the fill was chosen");
    out.fill = { before: beforeFill.rgb, after: afterFill.rgb, hueFromFinish: +hue.toFixed(1) };

    /* ---- the rim is still the button's plating (axis-design §3) ---- */
    const rim = await colourAt(page, canvas, { x: glyph.x, y: glyph.y + 2.6, z: glyph.z + 0.02 });
    assert.ok(chroma(rim.lab) < 14, `the face beside the recess is still plated (chroma ${chroma(rim.lab).toFixed(1)}, rgb ${rim.rgb})`);
    out.rim = rim.rgb;

    /* ---- the picker offers PAINT only (R2) ---- */
    await page.getByTestId("appearance-choose").click();
    await page.locator('[data-testid="appearance-picker"] [data-testid="finish-swatch"]').first().waitFor({ timeout: 20000 });
    const offered = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="appearance-picker"] [data-testid="finish-swatch"]')].map((el) => el.getAttribute("data-code")),
    );
    assert.ok(offered.includes(LAYER_PAINT), "the paint colours are there");
    assert.ok(!offered.includes(LAYER_PLATED), "and a plating is not");
    out.offered = offered.length;
    await page.keyboard.press("Escape");

    return out;
  } finally {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
