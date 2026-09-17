// Phase 4h: C3 key steps and display precision, and the ruler's screen-space
// label layout (R2: diameter below its line, thickness beside its own, never
// overlapping).
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DISPLAY_DP, keyStep, stepValue } from "../../../src/features/editor/components/controls/precision.ts";
import { layoutRulerLabels, rectsOverlap } from "../../../src/features/editor/lib/rulerLabelLayout.ts";

test("C3 key steps: mm 0.01 / Shift 0.1 / Alt 0.001; degrees 0.1 / 1 / 0.01", () => {
  const plain = { shiftKey: false, altKey: false };
  assert.equal(keyStep("mm", plain), 0.01);
  assert.equal(keyStep("mm", { shiftKey: true, altKey: false }), 0.1);
  assert.equal(keyStep("mm", { shiftKey: false, altKey: true }), 0.001);
  assert.equal(keyStep("deg", plain), 0.1);
  assert.equal(keyStep("deg", { shiftKey: true, altKey: false }), 1);
  assert.equal(keyStep("deg", { shiftKey: false, altKey: true }), 0.01);
  assert.deepEqual(DISPLAY_DP.mm, { rest: 2, focused: 3 });
  assert.equal(DISPLAY_DP.deg.rest, 1);
});

test("a key step leaves no binary noise, and unrounded values survive", () => {
  assert.equal(stepValue(3.63, 0.01), 3.64);
  assert.equal(stepValue(4, 0.001), 4.001);
  assert.equal(stepValue(1.2345, 0.1), 1.3345);
});

const line = (a, b, width = 90, height = 20) => ({ a, b, width, height });

test("diameter label sits centred below its horizontal line", () => {
  const d = line({ x: 100, y: 300 }, { x: 300, y: 310 });
  const t = line({ x: 360, y: 180 }, { x: 350, y: 220 }, 60);
  const placed = layoutRulerLabels(d, t, { x: 200, y: 200 });
  assert.equal(placed.diameter.x + placed.diameter.width / 2, 200);
  assert.ok(placed.diameter.y > 310, "below the lower end point");
  assert.ok(placed.thickness.x > 360, "thickness label outward (right) of its line");
  assert.ok(!rectsOverlap(placed.diameter, placed.thickness));
});

test("labels that would collide are pushed apart", () => {
  // A thickness line right where the diameter label lands.
  const d = line({ x: 100, y: 300 }, { x: 300, y: 300 }, 120);
  const t = line({ x: 205, y: 300 }, { x: 205, y: 330 }, 60);
  const placed = layoutRulerLabels(d, t, { x: 150, y: 200 });
  assert.ok(!rectsOverlap(placed.diameter, placed.thickness), JSON.stringify(placed));
});
