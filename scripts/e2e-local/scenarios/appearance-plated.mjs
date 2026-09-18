// Phase 6a R2/R7 — a layer plated in a finish of its own.
//
// On a nickel button: a raised text layer switched to Plated finish and given
// gold renders in gold, the recipe records the choice, and the picker offers
// plated processes only.
import assert from "node:assert/strict";
import {
  BUTTON_FINISH,
  LAYER_PLATED,
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

export default async function ({ page, base, admin, editor, h }) {
  const { product, finishes, restore } = await stageAppearance(admin, "sample-metal-pendants-brand-badges", "e2e-appearance-plated.obj");
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);
    const canvas = page.getByTestId("editor-viewport").locator("canvas").first();
    await addSampleText(page);

    /* ---- the part's own finish, to compare against ---- */
    const [asPart] = await reliefReports(page);
    assert.equal(asPart.appearance.mode, "part", "a new layer is the part's own finish");
    const glyph = (await glyphReports(page))[0];
    assert.ok(glyph, "the layer is on the face");
    await page.waitForTimeout(800);
    const partColour = await colourAt(page, canvas, samplePoint(glyph, asPart));

    /* ---- plated: the layer's own finish (R1/R2) ---- */
    await setMode(page, "Plated finish");
    await pickLayerFinish(page, LAYER_PLATED);
    const recipe = await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.appearance?.finish_id === finishes[LAYER_PLATED].id, "plated appearance stored");
    assert.equal(recipe.recipe_version, 3, "R5: appearance ships with recipe v3");
    assert.deepEqual(recipe.layers[0].appearance, { mode: "plated", finish_id: finishes[LAYER_PLATED].id, custom: null });
    assert.equal(recipe.layers[0].relief.type, "emboss", "plating does not change the relief");
    out.stored = recipe.layers[0].appearance;

    const [report] = await reliefReports(page);
    assert.equal(report.colourHex, finishes[LAYER_PLATED].base_color_hex.toUpperCase(), "the layer renders in the finish's own colour");

    /* ---- and it is gold on screen, where the button is not (R7) ---- */
    await page.waitForTimeout(1000);
    const layerColour = await colourAt(page, canvas, samplePoint(glyph, report));
    const goldLab = labOfHex(finishes[LAYER_PLATED].base_color_hex);
    const hue = hueDistance(layerColour.lab, goldLab);
    assert.ok(hue <= 30, `the rendered layer is the finish's hue: ${hue.toFixed(1)}° from gold (rgb ${layerColour.rgb})`);
    assert.ok(
      layerColour.lab[2] - partColour.lab[2] > 5,
      `and warmer than the nickel button it sits on (b* ${layerColour.lab[2].toFixed(1)} vs ${partColour.lab[2].toFixed(1)})`,
    );
    out.plated = { rgb: layerColour.rgb, hueFromFinish: +hue.toFixed(1), partRgb: partColour.rgb };

    /* ---- the picker offers plated processes only (R2) ---- */
    await page.getByTestId("appearance-choose").click();
    await page.locator('[data-testid="appearance-picker"] [data-testid="finish-swatch"]').first().waitFor({ timeout: 20000 });
    const offered = await page.evaluate(() =>
      [...document.querySelectorAll('[data-testid="appearance-picker"] [data-testid="finish-swatch"]')].map((el) => el.getAttribute("data-code")),
    );
    assert.ok(offered.includes(LAYER_PLATED) && offered.includes(BUTTON_FINISH), "the plated finishes are there");
    assert.ok(!offered.includes("CYC-0131"), "and a paint colour is not");
    out.offered = offered.length;
    await page.keyboard.press("Escape");

    return out;
  } finally {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
