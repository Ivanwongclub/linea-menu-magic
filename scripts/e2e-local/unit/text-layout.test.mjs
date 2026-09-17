// Phase 4f/4g: recipe v2 normalisation, variant scaling (C10) and the
// per-glyph text layout, against the bundled typeface JSON.
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { newTextLayer, normalizeRecipe, scaleLayers, applyLayerPatch } from "../../../src/features/editor/lib/recipe.ts";
import { layoutText, unitScale } from "../../../src/features/editor/lib/textLayout.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const font = JSON.parse(readFileSync(path.join(ROOT, "public/fonts/poppins-semibold.typeface.json"), "utf8"));
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

test("bundled fonts are Latin-1 subsets with cap height and licence", () => {
  for (const key of ["poppins-semibold", "dm-serif-display"]) {
    const data = JSON.parse(readFileSync(path.join(ROOT, `public/fonts/${key}.typeface.json`), "utf8"));
    assert.equal(Object.keys(data.glyphs).length, 191, `${key} glyph count`);
    assert.ok(data.glyphs["é"] && data.glyphs["A"] && !data.glyphs["Ā"], `${key} is Latin-1 only`);
    assert.ok(data.capHeight > 0, `${key} capHeight`);
    assert.match(readFileSync(path.join(ROOT, `public/fonts/${key}.LICENSE.txt`), "utf8"), /SIL Open Font License/);
  }
});

test("a v1 recipe reads as v2 with no layers and the ruler off", () => {
  const v1 = normalizeRecipe({ size_variant_id: "a", finish_id: "b", colour_id: null });
  assert.deepEqual(v1, { recipe_version: 2, size_variant_id: "a", finish_id: "b", colour_id: null, view: { ruler: false }, layers: [] });
  const layer = newTextLayer("l1", 10.8, "POLO");
  const v2 = normalizeRecipe({ recipe_version: 2, size_variant_id: "a", finish_id: null, colour_id: null, view: { ruler: true }, layers: [layer] });
  assert.equal(v2.layers[0].content.value, "POLO");
  assert.equal(v2.view.ruler, true);
});

test("new-layer fallbacks follow E1 §3.3", () => {
  const layer = newTextLayer("l1", 10.8);
  close(layer.style.text_size_mm, 1.296, 1e-12, "12% of face diameter");
  close(layer.placement.radius_mm, 3.78, 1e-12, "0.35 × face diameter");
  assert.equal(layer.placement.direction, "cw");
  assert.equal(layer.placement.conform, true);
  assert.equal(layer.relief, null);
});

test("a variant switch scales placement and size, not angles (C10)", () => {
  const layer = applyLayerPatch(newTextLayer("l1", 10.8, "POLO"), { placement: { arc_position_deg: 30, centre_mm: { x: 1, y: -2 } } });
  const [scaled] = scaleLayers([layer], 15 / 10.8);
  close(scaled.placement.radius_mm, 3.78 * (15 / 10.8), 1e-9, "radius");
  close(scaled.style.text_size_mm, 1.296 * (15 / 10.8), 1e-9, "size");
  close(scaled.placement.centre_mm.y, -2 * (15 / 10.8), 1e-9, "centre");
  assert.equal(scaled.placement.arc_position_deg, 30);
  assert.equal(scaled.relief, null);
});

test("straight layout: centred, advances + spacing, clockwise rotation", () => {
  const layer = applyLayerPatch(newTextLayer("l1", 10, "POLO"), { style: { text_size_mm: 1, letter_spacing_mm: 0.1 } });
  const glyphs = layoutText(font, layer);
  const s = unitScale(font, 1);
  const adv = [..."POLO"].map((c) => font.glyphs[c].ha * s);
  const total = adv.reduce((a, b) => a + b, 0) + 3 * 0.1;
  close(glyphs[0].x, -total / 2 + adv[0] / 2, 1e-12, "first glyph centre");
  close(glyphs[3].x, total / 2 - adv[3] / 2, 1e-12, "last glyph centre");
  close(glyphs[1].x - glyphs[0].x, adv[0] / 2 + 0.1 + adv[1] / 2, 1e-12, "pitch");
  const rotated = layoutText(font, applyLayerPatch(layer, { placement: { rotation_deg: 90 } }));
  close(rotated[0].y, total / 2 - adv[0] / 2, 1e-12, "90° clockwise puts the first glyph on top");
  close(rotated[0].rotationZ, -Math.PI / 2, 1e-12, "three.js rotation is counter-clockwise");
});
