// Phase 5: the inset stroke measure (R3/R7), the manufacturing checks and the
// relief the recipe stores and the geometry builds (R1, R2).
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import { minStrokeWidth } from "../../../src/features/editor/lib/strokeWidth.ts";
import { MIN_EDGE_MARGIN_MM, manufacturingWarnings, hasThresholds, processThresholds } from "../../../src/features/editor/lib/manufacturing.ts";
import { applyLayerPatch, defaultRelief, layerRelief, newTextLayer } from "../../../src/features/editor/lib/recipe.ts";
import { RELIEF_SINK_MM, OPENING_LIFT_MM, effectiveBevel, offsetRing, raisedGeometry, recessFloorGeometry, recessWallGeometry } from "../../../src/features/editor/lib/reliefGeometry.ts";

const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);
const rect = (x0, y0, w, h) => ({ outer: [[x0, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0, y0 + h]], holes: [] });
const ring = (r, n = 128) => Array.from({ length: n }, (_, i) => [r * Math.cos((2 * Math.PI * i) / n), r * Math.sin((2 * Math.PI * i) / n)]);
/** The measure rasterises, so it is exact to about a cell; 5% is comfortably outside that. */
const within5 = (got, want, msg) => assert.ok(Math.abs(got / want - 1) <= 0.05, `${msg}: ${got} vs ${want}`);

test("the inset test measures the narrowest stroke, not the widest part (R3)", () => {
  within5(minStrokeWidth([rect(0, 0, 2, 0.14)]), 0.14, "a 0.14 mm bar");
  within5(minStrokeWidth([rect(0, 0, 1, 1)]), 1, "a solid square's narrowest stroke is its side");
  within5(minStrokeWidth([{ outer: ring(1), holes: [ring(0.8)] }]), 0.2, "an annulus measures its wall, not its diameter");
  within5(minStrokeWidth([{ outer: ring(1), holes: [] }]), 2, "a disc measures its diameter");
});

test("a hairline joined to a thick part is what gets measured (R3)", () => {
  // A T: a 0.30 bar with a 0.10 stem. The widest disc that fits is the bar's,
  // and a binary search that assumed one radius would hide the stem.
  const tee = { outer: [[0, 0], [1, 0], [1, 0.3], [0.55, 0.3], [0.55, 1], [0.45, 1], [0.45, 0.3], [0, 0.3]], holes: [] };
  within5(minStrokeWidth([tee]), 0.1, "the stem");
});

test("a convex corner is not a hairline (R3)", () => {
  // Every polygon has corners no disc can cover; only a real thin feature counts.
  within5(minStrokeWidth([{ outer: [[0, 0], [2, 0], [2, 2], [0, 2]], holes: [] }]), 2, "a square is its own side");
  const spike = minStrokeWidth([{ outer: [[0, 0], [3, 0], [0, 0.5]], holes: [] }]);
  assert.ok(spike < 0.1, `a needle-sharp spike is a thin feature: ${spike}`);
});

test("stroke width scales with the layer's size, so it is measured once at unit size", () => {
  const unit = minStrokeWidth([rect(0, 0, 2, 0.2)]);
  const tenth = minStrokeWidth([rect(0, 0, 0.2, 0.02)]);
  within5(tenth * 10, unit, "the same outline at a tenth of the size");
});

test("R1: a new layer's depth is the process minimum, then 0.30 mm, and the bevel is 0.05", () => {
  assert.deepEqual(defaultRelief(null, 0.18), { type: "emboss", depth_mm: 0.18, bevel_mm: 0.05 });
  assert.deepEqual(defaultRelief(null, null), { type: "emboss", depth_mm: 0.3, bevel_mm: 0.05 });
  // A recovered relief wins over both, and keeps the factory's own type.
  assert.deepEqual(defaultRelief({ type: "deboss", depth_mm: 0.22 }, 0.18), { type: "deboss", depth_mm: 0.22, bevel_mm: 0.05 });
  const layer = newTextLayer("l", 10.8, "POLO", null, 0.18);
  assert.deepEqual(layer.relief, { type: "emboss", depth_mm: 0.18, bevel_mm: 0.05 });
  // A layer stored before Phase 5 renders as a raised default rather than nothing.
  assert.deepEqual(layerRelief({ ...layer, relief: null }), { type: "emboss", depth_mm: 0.3, bevel_mm: 0.05 });
  assert.deepEqual(layerRelief({ ...layer, relief: { type: "deboss", depth_mm: 0.25 } }), { type: "deboss", depth_mm: 0.25, bevel_mm: 0.05 });
});

test("a patch changes one relief field and marks a recovered depth as the buyer's (§4.1)", () => {
  const recovered = newTextLayer("l", 10.8, "POLO", {
    centre_mm: { x: 0, y: 0 },
    radius_mm: 3.6,
    arc_position_deg: 0,
    direction: "cw",
    text_size_mm: 1,
    relief: { type: "deboss", depth_mm: 0.22 },
  });
  assert.equal(recovered.provenance.depth_mm, "recovered");
  const typed = applyLayerPatch(recovered, { relief: { type: "emboss" } });
  assert.deepEqual(typed.relief, { type: "emboss", depth_mm: 0.22, bevel_mm: 0.05 }, "the depth survives a type change");
  assert.equal(typed.provenance.depth_mm, "recovered", "and is still the factory's");
  const retyped = applyLayerPatch(recovered, { relief: { depth_mm: 0.4 } });
  assert.equal(retyped.provenance.depth_mm, "user", "a retyped depth is the buyer's");
});

test("R3: the strip's checks, and what a null threshold means", () => {
  const layer = { ...newTextLayer("l", 15, "POLO", null, 0.15), placement: { ...newTextLayer("l", 15).placement, layout: "circle", radius_mm: 5, centre_mm: { x: 0, y: 0 } }, style: { text_size_mm: 0.6, letter_spacing_mm: 0 } };
  const process = { name: "Roll Plating", min_feature_mm: 0.2, min_deboss_depth_mm: 0.2, max_deboss_depth_mm: 0.5 };
  const measures = [{ layer, strokeMm: 0.14 }];

  const warnings = manufacturingWarnings(measures, process, 7.5);
  assert.deepEqual(
    warnings.map((w) => [w.kind, +w.valueMm.toFixed(2), w.limitMm]),
    [
      ["stroke", 0.14, 0.2],
      ["depthMin", 0.15, 0.2],
    ],
    "a thin stroke and a shallow depth, each against WIN-CYC's own number",
  );
  assert.equal(warnings[0].key, "editor.manufacturing.letterStroke");

  // Null thresholds are not a pass: the checks simply can't be made.
  const blank = { name: "Roll Plating", min_feature_mm: null, min_deboss_depth_mm: null, max_deboss_depth_mm: null };
  assert.equal(hasThresholds(blank), false);
  assert.equal(hasThresholds(process), true);
  assert.deepEqual(manufacturingWarnings(measures, blank, 7.5), []);
  assert.deepEqual(manufacturingWarnings(measures, null, 7.5), []);

  // Too deep, the other way round — a recess tolerance, so engraved only (5b R3).
  const deep = [{ layer: { ...layer, relief: { type: "deboss", depth_mm: 0.8, bevel_mm: 0.05 } }, strokeMm: 0.5 }];
  assert.deepEqual(manufacturingWarnings(deep, process, 7.5).map((w) => w.kind), ["depthMax"]);
  assert.equal(manufacturingWarnings(deep, process, 7.5)[0].key, "editor.manufacturing.engraveDepthMax");
  const proud = [{ layer: { ...layer, relief: { type: "emboss", depth_mm: 0.8, bevel_mm: 0.05 } }, strokeMm: 0.5 }];
  assert.deepEqual(manufacturingWarnings(proud, process, 7.5), [], "a raised layer is not held to the maximum recess depth");

  // Edge margin is geometry, not a process tolerance: it is checked either way.
  const outward = [{ layer: { ...layer, placement: { ...layer.placement, radius_mm: 7.3 } }, strokeMm: 0.5 }];
  const margin = manufacturingWarnings(outward, blank, 7.5).find((w) => w.kind === "edgeMargin");
  assert.ok(margin, "a layer crowding the rim is warned about with no thresholds set");
  assert.equal(margin.limitMm, MIN_EDGE_MARGIN_MM);

  // An invisible layer is not manufactured.
  assert.deepEqual(manufacturingWarnings([{ layer: { ...layer, visible: false }, strokeMm: 0.14 }], process, 7.5), []);
  // The stroke check waits for a measurement rather than guessing.
  assert.deepEqual(manufacturingWarnings([{ layer, strokeMm: null }], process, 7.5).map((w) => w.kind), ["depthMin"]);
});

test("the process is named in the interface language", () => {
  const row = { name: "Roll Plating", name_zh_hant: "滾鍍", name_zh_hans: "滚镀", min_feature_mm: 0.2, min_deboss_depth_mm: null, max_deboss_depth_mm: null };
  assert.equal(processThresholds(row, "en").name, "Roll Plating");
  assert.equal(processThresholds(row, "zh-Hant").name, "滾鍍");
  assert.equal(processThresholds(row, "zh-Hans").name, "滚镀");
  assert.equal(processThresholds({ ...row, name_zh_hant: null }, "zh-Hant").name, "Roll Plating");
  assert.equal(processThresholds(null, "en"), null);
});

test("R2: raised geometry stands the depth proud, engraved geometry carves it", () => {
  const square = [{ outer: [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([x, y]) => new THREE.Vector2(x, y)), holes: [] }];
  const relief = { type: "emboss", depth_mm: 0.3, bevel_mm: 0.05 };
  const raised = raisedGeometry(square, relief);
  raised.computeBoundingBox();
  close(raised.boundingBox.max.z, 0.3, 1e-6, "the top stands 0.30 mm above the surface");
  close(raised.boundingBox.min.z, -(0.05 + RELIEF_SINK_MM), 1e-6, "and the base sinks below it");
  // The bevel insets the top rather than fattening the letter.
  close(raised.boundingBox.max.x, 1, 1e-6, "the walls stay on the outline");

  const deboss = { type: "deboss", depth_mm: 0.25, bevel_mm: 0.05 };
  const floor = recessFloorGeometry(square, deboss);
  floor.computeBoundingBox();
  close(floor.boundingBox.max.z, -0.25, 1e-6, "the floor lies 0.25 mm below the surface");
  close(floor.boundingBox.max.x, 0.95, 1e-6, "inset by the bevel, so it meets the walls");
  const walls = recessWallGeometry(square, deboss);
  walls.computeBoundingBox();
  close(walls.boundingBox.min.z, -0.25, 1e-6, "the walls reach the floor");
  close(walls.boundingBox.max.z, OPENING_LIFT_MM, 1e-6, "and the opening");
  assert.ok(walls.getAttribute("position").count >= 12, "four sides, in two profiles");

  // A bevel can never eat more than half the depth.
  close(effectiveBevel({ type: "emboss", depth_mm: 0.06, bevel_mm: 0.05 }), 0.03, 1e-9, "clamped bevel");
});

test("a ring offsets to its left, and a sharp corner's miter is capped", () => {
  const square = [new THREE.Vector2(-1, -1), new THREE.Vector2(1, -1), new THREE.Vector2(1, 1), new THREE.Vector2(-1, 1)];
  const inset = offsetRing(square, 0.1);
  close(inset[0].x, -0.9, 1e-9, "counter-clockwise: left is inward");
  close(inset[2].y, 0.9, 1e-9, "on every corner");
  const needle = offsetRing([new THREE.Vector2(0, 0), new THREE.Vector2(10, 0.2), new THREE.Vector2(10, -0.2)], 0.1);
  assert.ok(Math.hypot(needle[0].x, needle[0].y) < 1, "the miter at a needle tip is capped");
});
