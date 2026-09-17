// Phase 4j: recovered branding → a new layer's placement (C8, C9, the 4d
// direction ruling) and the selected layer's ruler dimensions.
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { applyLayerPatch, newTextLayer } from "../../../src/features/editor/lib/recipe.ts";
import {
  angularClusters,
  faceAngle,
  largestCluster,
  recoveredDefaults,
  recoveredSpanDeg,
  toFace,
} from "../../../src/features/editor/lib/recoveredPlacement.ts";
import { edgeMarginMm, layerDimensions } from "../../../src/features/editor/lib/layerMeasurements.ts";

const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

// A quarter turn about +X: raw +Y → face +Z, raw +Z → face −Y.
const quarterX = [Math.sin(Math.PI / 4), 0, 0, Math.cos(Math.PI / 4)];
const reference = {
  centre_raw: [0.4, 2, 0.5],
  radius_raw: 5.048,
  start_angle_deg: 300,
  end_angle_deg: 60,
  direction: "cw",
  text_height_raw: 1.68,
  relief_raw: 0.3,
  confidence: "high",
};
const transform = { quaternion: quarterX, scale: 0.72, offset: [0, 0, -1] };

test("raw → face: rotation, then scale, then the model's recentring", () => {
  const [x, y, z] = toFace(transform, [1, 2, 3]);
  close(x, 0.72, 1e-9, "x");
  close(y, -3 * 0.72, 1e-9, "y (raw +Z became face −Y)");
  close(z, 2 * 0.72 - 1, 1e-9, "z");
});

test("defaults convert at the factor and are labelled recovered (C8)", () => {
  const defaults = recoveredDefaults(reference, transform, 0.72, []);
  close(defaults.radius_mm, 5.048 * 0.72, 1e-9, "radius");
  close(defaults.text_size_mm, 1.68 * 0.72, 1e-9, "text size");
  close(defaults.relief.depth_mm, 0.3 * 0.72, 1e-9, "relief depth");
  assert.equal(defaults.relief.type, "emboss");
  const layer = newTextLayer("l", 10.8, "", defaults);
  assert.equal(layer.placement.layout, "circle");
  close(layer.placement.radius_mm, 5.048 * 0.72, 1e-9, "layer radius");
  assert.equal(layer.provenance.radius_mm, "recovered");
  assert.equal(layer.provenance.text_size_mm, "recovered");
  assert.equal(layer.provenance.depth_mm, "recovered");
  // A 120° arc keeps its own direction and midpoint.
  close(recoveredSpanDeg(reference), 120, 1e-9, "span");
  close(defaults.arc_position_deg, 0, 1e-9, "arc position is the midpoint of 300° → 60°");
  assert.equal(defaults.direction, "cw");
});

test("a recovered field the buyer edits becomes user; the rest keep their label", () => {
  const layer = newTextLayer("l", 10.8, "", recoveredDefaults(reference, transform, 0.72, []));
  const edited = applyLayerPatch(layer, { placement: { radius_mm: 4.2 } });
  assert.equal(edited.provenance.radius_mm, "user");
  assert.equal(edited.provenance.centre_mm, "recovered");
  const same = applyLayerPatch(layer, { placement: { radius_mm: layer.placement.radius_mm } });
  assert.equal(same.provenance.radius_mm, "recovered", "writing the same value is not an edit");
});

test("no reference, or a low-confidence one, falls back to E1 §3.3 (C9)", () => {
  assert.equal(recoveredDefaults(null, transform, 0.72, []), null);
  assert.equal(recoveredDefaults({ ...reference, confidence: "low" }, transform, 0.72, []), null);
  assert.equal(recoveredDefaults(reference, transform, null, []), null);
  const layer = newTextLayer("l", 10.8);
  assert.equal(layer.placement.layout, "straight");
  close(layer.placement.radius_mm, 0.35 * 10.8, 1e-9, "70% of the face radius");
  assert.equal(layer.provenance, undefined);
});

test("an arc over most of the circle: cw at the widest cluster of glyphs (4d ruling)", () => {
  const wide = { ...reference, start_angle_deg: 350, end_angle_deg: 20, direction: "ccw" };
  assert.ok(recoveredSpanDeg(wide) > 180, "the recovered arc covers most of the circle");
  // Four glyphs near 10° and eight spread over 150°–210°.
  const centres = [
    ...[0, 5, 10, 15].map((deg) => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)]),
    ...[150, 160, 170, 180, 190, 200, 210].map((deg) => [Math.sin((deg * Math.PI) / 180), Math.cos((deg * Math.PI) / 180)]),
  ];
  const defaults = recoveredDefaults({ ...wide, centre_raw: [0, 0, 0] }, { quaternion: [0, 0, 0, 1], scale: 1, offset: [0, 0, 0] }, 1, centres);
  assert.equal(defaults.direction, "cw");
  close(defaults.arc_position_deg, 180, 1e-6, "midpoint of the 150°–210° cluster");
  const clusters = angularClusters(centres.map(([x, y]) => faceAngle(x, y)));
  assert.equal(clusters.length, 2);
  assert.equal(largestCluster(clusters).count, 7);
});

test("ruler dimensions: radius, letter height, edge margin = face radius − radius − size / 2", () => {
  const layer = newTextLayer("l", 10.8, "POLO", recoveredDefaults(reference, transform, 0.72, []));
  const dims = layerDimensions(layer, 5.4);
  assert.deepEqual(
    dims.map((d) => d.kind),
    ["brandingRadius", "letterHeight", "edgeMargin"],
  );
  close(dims[0].valueMm, layer.placement.radius_mm, 1e-9, "radius");
  close(dims[1].valueMm, layer.style.text_size_mm, 1e-9, "letter height");
  close(dims[2].valueMm, 5.4 - layer.placement.radius_mm - layer.style.text_size_mm / 2, 1e-9, "edge margin");
  close(edgeMarginMm(layer, 5.4), dims[2].valueMm, 1e-12, "same formula");
  // Every dimension is drawn clear of the text it measures.
  for (const d of dims) {
    for (const p of [d.from, d.to]) {
      const angle = faceAngle(p.x - layer.placement.centre_mm.x, p.y - layer.placement.centre_mm.y);
      const fromText = Math.abs(((angle - layer.placement.arc_position_deg + 540) % 360) - 180);
      const atCentre = Math.hypot(p.x - layer.placement.centre_mm.x, p.y - layer.placement.centre_mm.y) < 1e-9;
      assert.ok(atCentre || fromText >= 90, `${d.kind} stays at least a quadrant from the text (${fromText.toFixed(1)}°)`);
    }
  }
  // Straight text has a letter height only.
  const straight = newTextLayer("s", 10.8, "POLO");
  assert.deepEqual(
    layerDimensions(straight, 5.4).map((d) => d.kind),
    ["letterHeight"],
  );
});
