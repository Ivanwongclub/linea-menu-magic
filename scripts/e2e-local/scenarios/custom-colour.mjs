// Phase 6a R3/R4/R7 — a custom colour: a Pantone code from the bundled table,
// an unknown code falling back to the buyer's own hex, the info line on the
// strip, and plating refusing custom colours altogether.
import assert from "node:assert/strict";
import {
  addSampleText,
  colourAt,
  glyphReports,
  hueDistance,
  labOfHex,
  openEditorFor,
  reliefReports,
  samplePoint,
  setMode,
  stageAppearance,
  waitForRecipe,
} from "../lib/appearance.mjs";

/** In the bundled subset (`lib/pantone.ts`). */
const KNOWN_CODE = "185 C";
const KNOWN_HEX = "#E4002B";
/** Not in it: the code is kept and the buyer's own colour is used. */
const UNKNOWN_CODE = "1234 C";
const TYPED_HEX = "#1E88E5";

export default async function ({ page, base, admin, editor, h }) {
  const { product, restore } = await stageAppearance(admin, "sample-zipper-pullers-sliders", "e2e-custom-colour.obj");
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);
    const canvas = page.getByTestId("editor-viewport").locator("canvas").first();
    await addSampleText(page);

    /* ---- 1. plating never accepts a custom colour (R3) ---- */
    await setMode(page, "Plated finish");
    assert.equal(await page.getByTestId("appearance-custom-open").count(), 0, "a plated layer is offered no custom colour");

    /* ---- 2. a known Pantone code (R3) ---- */
    await setMode(page, "Paint colour");
    await page.getByTestId("appearance-custom-open").click();
    await page.getByTestId("custom-pantone").fill(KNOWN_CODE);
    await page.waitForTimeout(400);
    const knownHint = (await page.getByTestId("custom-colour-hint").innerText()).trim();
    assert.match(knownHint, /approximation/i, knownHint);
    assert.equal(
      (await page.getByTestId("custom-hex").inputValue()).toUpperCase(),
      KNOWN_HEX,
      "the table's colour fills the hex field",
    );
    await page.getByTestId("custom-apply").click();
    const recipe = await waitForRecipe(page, admin, designId, (r) => !!r.layers?.[0]?.appearance?.custom, "custom colour stored");
    assert.deepEqual(recipe.layers[0].appearance, { mode: "paint", finish_id: null, custom: { pantone: KNOWN_CODE, hex: KNOWN_HEX } });
    out.known = recipe.layers[0].appearance.custom;

    /* ---- 3. the row says so, and the strip says WIN-CYC confirms it (R4/R5) ---- */
    const layerAppearance = page.locator(`[data-testid="layer-appearance"][data-layer-id="${recipe.layers[0].id}"]`);
    assert.equal(await layerAppearance.getByTestId("appearance-swatch").getAttribute("data-hex"), KNOWN_HEX, "the layer row carries the colour");
    const info = page.locator('[data-testid="manufacturing-info"][data-kind="customColour"]');
    await info.waitFor({ timeout: 20000 });
    const infoText = (await info.innerText()).trim();
    assert.equal(infoText, `Custom colour ${KNOWN_CODE} — to be confirmed by WIN-CYC`, infoText);
    assert.equal(await info.getAttribute("data-severity"), "info", "a custom colour is not a warning");
    out.info = infoText;

    /* ---- 4. and it renders in that colour (R7) ---- */
    const [report] = await reliefReports(page);
    assert.equal(report.colourHex, KNOWN_HEX, "the layer renders in the custom colour");
    const glyph = (await glyphReports(page))[0];
    await page.waitForTimeout(1000);
    const painted = await colourAt(page, canvas, samplePoint(glyph, report));
    const hue = hueDistance(painted.lab, labOfHex(KNOWN_HEX));
    assert.ok(painted.lab[1] > 25, `the letter is red on screen (a* ${painted.lab[1].toFixed(1)}, rgb ${painted.rgb})`);
    assert.ok(hue <= 35, `in the custom colour's own hue: ${hue.toFixed(1)}°`);
    out.rendered = { rgb: painted.rgb, hueFromCustom: +hue.toFixed(1) };

    /* ---- 5. an unknown code keeps the code and takes the typed hex (R3) ---- */
    await page.getByTestId("appearance-custom-open").click();
    await page.getByTestId("custom-pantone").fill(UNKNOWN_CODE);
    await page.getByTestId("custom-hex").fill(TYPED_HEX);
    await page.waitForTimeout(300);
    const unknownHint = (await page.getByTestId("custom-colour-hint").innerText()).trim();
    assert.match(unknownHint, /isn't in this build's table/i, unknownHint);
    await page.getByTestId("custom-apply").click();
    const fallback = await waitForRecipe(page, admin, designId, (r) => r.layers[0].appearance.custom?.pantone === UNKNOWN_CODE, "unknown code stored");
    assert.deepEqual(fallback.layers[0].appearance.custom, { pantone: UNKNOWN_CODE, hex: TYPED_HEX });
    out.unknown = fallback.layers[0].appearance.custom;

    /* ---- 6. nonsense is refused before it can be applied (R3) ---- */
    await page.getByTestId("appearance-custom-open").click();
    await page.getByTestId("custom-pantone").fill("not a colour");
    await page.getByTestId("custom-hex").fill("");
    await page.waitForTimeout(300);
    const invalidHint = (await page.getByTestId("custom-colour-hint").innerText()).trim();
    assert.match(invalidHint, /solid coated code/i, invalidHint);
    assert.equal(await page.getByTestId("custom-apply").isDisabled(), true, "nothing to apply");
    out.invalidHint = invalidHint;

    return out;
  } finally {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
