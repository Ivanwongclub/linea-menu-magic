// Phase 4f/4g: recipe v2 normalisation, variant scaling (C10) and the
// per-glyph text layout, against the bundled typeface JSON.
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { newTextLayer, normalizeRecipe, scaleLayers, applyLayerPatch } from "../../../src/features/editor/lib/recipe.ts";
import { layoutText, letterSpacingForSpan, textArc, unitScale } from "../../../src/features/editor/lib/textLayout.ts";
import * as THREE from "three";

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
  // Phase 5 R1: a new layer carries a relief from the start (0.30 mm with no process minimum).
  assert.deepEqual(layer.relief, { type: "emboss", depth_mm: 0.3, bevel_mm: 0.05 });
});

test("a variant switch scales placement and size, not angles (C10)", () => {
  const layer = applyLayerPatch(newTextLayer("l1", 10.8, "POLO"), { placement: { arc_position_deg: 30, centre_mm: { x: 1, y: -2 } } });
  const [scaled] = scaleLayers([layer], 15 / 10.8);
  close(scaled.placement.radius_mm, 3.78 * (15 / 10.8), 1e-9, "radius");
  close(scaled.style.text_size_mm, 1.296 * (15 / 10.8), 1e-9, "size");
  close(scaled.placement.centre_mm.y, -2 * (15 / 10.8), 1e-9, "centre");
  assert.equal(scaled.placement.arc_position_deg, 30);
  assert.deepEqual(scaled.relief, layer.relief, "relief is physical: a variant switch never scales it");
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

const circle = (value, direction, arc, extra = {}) =>
  applyLayerPatch(newTextLayer("c", 10.8, value), {
    style: { text_size_mm: 1, letter_spacing_mm: 0.05 },
    placement: { layout: "circle", radius_mm: 3.63, arc_position_deg: arc, direction, ...extra },
  });

test("circle cw at 0°: centred on 12 o'clock, span from advances, glyph tops outward", () => {
  const layer = circle("POLO", "cw", 0);
  const glyphs = layoutText(font, layer);
  const s = unitScale(font, 1);
  const adv = [..."POLO"].map((c) => font.glyphs[c].ha * s);
  const spanDeg = ((adv.reduce((a, b) => a + b, 0) + 3 * 0.05) / 3.63) * (180 / Math.PI);
  close(textArc(font, layer).spanDeg, spanDeg, 1e-9, "span");
  close(glyphs[0].angleDeg, 360 - spanDeg / 2 + (adv[0] / 2 / 3.63) * (180 / Math.PI), 1e-9, "first glyph angle");
  for (const g of glyphs) {
    close(Math.hypot(g.x, g.y), 3.63, 1e-12, "radius");
    const up = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), g.rotationZ);
    close(up.dot(new THREE.Vector3(g.x, g.y, 0).normalize()), 1, 1e-12, "glyph up points outward");
  }
  assert.ok(glyphs[0].x < glyphs[3].x, "reads left to right across the top");
});

test("circle ccw at 180°: reads left to right along the bottom, tops inward, no mirroring", () => {
  const glyphs = layoutText(font, circle("POLO", "ccw", 180));
  for (let i = 1; i < glyphs.length; i++) assert.ok(glyphs[i].x > glyphs[i - 1].x, "x increases in glyph order");
  for (const g of glyphs) {
    assert.ok(g.y < 0, "on the bottom arc");
    const up = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), g.rotationZ);
    close(up.dot(new THREE.Vector3(g.x, g.y, 0).normalize()), -1, 1e-12, "glyph up points to the centre");
    const m = new THREE.Matrix4().compose(new THREE.Vector3(g.x, g.y, 0), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), g.rotationZ), new THREE.Vector3(1, 1, 1));
    assert.ok(m.determinant() > 0, "determinant > 0");
  }
});

test("preserve radius: more text widens the span; a wider span spaces letters, radius fixed (C7)", () => {
  const four = circle("POLO", "cw", 0);
  const five = circle("POLOS", "cw", 0);
  assert.ok(textArc(font, five).spanDeg > textArc(font, four).spanDeg);
  const spacing = letterSpacingForSpan(font, four, 90);
  const widened = applyLayerPatch(four, { style: { letter_spacing_mm: spacing } });
  close(textArc(font, widened).spanDeg, 90, 1e-9, "span after widening");
  assert.equal(widened.placement.radius_mm, 3.63);
});
