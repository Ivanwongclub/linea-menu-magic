// Phase 4i: handle placement and drag maths on the face plane, the label
// layout's obstacle avoidance, and the 50-entry undo history.
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { newTextLayer } from "../../../src/features/editor/lib/recipe.ts";
import { angleOf, dragPatch, layerHandles, onCircle, startProgress, turn } from "../../../src/features/editor/lib/handleGeometry.ts";
import { layoutLabels, rectsOverlap } from "../../../src/features/editor/lib/rulerLabelLayout.ts";
import { HISTORY_LIMIT, applyDiscrete, canRedo, canUndo, commitHistory, redoHistory, startHistory, undoHistory } from "../../../src/features/editor/lib/recipeHistory.ts";
import { applyLayerPatch, emptyRecipe } from "../../../src/features/editor/lib/recipe.ts";

const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

const circleLayer = () => {
  const layer = newTextLayer("l1", 10.8, "POLO");
  layer.placement = { ...layer.placement, layout: "circle", radius_mm: 3.63, arc_position_deg: 0 };
  return layer;
};

test("circle handles: knob on the arc position inside the text, ring grab opposite", () => {
  const layer = circleLayer();
  const h = layerHandles(layer);
  assert.equal(h.move, null);
  close(h.arcKnob.x, 0, 1e-9, "knob x at 0°");
  assert.ok(h.arcKnob.y < 3.63 && h.arcKnob.y > 0, "knob inside the radius");
  close(h.ringGrab.y, -3.63, 1e-9, "grab at 180°");
  const straight = layerHandles(newTextLayer("s", 10.8, "A"));
  assert.deepEqual(straight.move, { x: 0, y: 0 });
  assert.equal(straight.radius, null);
});

test("radius drag adds the change in distance from the centre; never below the minimum", () => {
  const layer = circleLayer();
  const start = { kind: "radius", layer, at: { x: 0, y: -3.63 } };
  const patch = dragPatch(start, startProgress(start), { x: 0, y: -4.13 });
  close(patch.placement.radius_mm, 4.13, 1e-9, "radius");
  const shrink = dragPatch(start, startProgress(start), { x: 0, y: 0 });
  assert.ok(shrink.placement.radius_mm >= 0.05);
});

test("arc drag follows the pointer's angle, continuously past 360°", () => {
  const layer = circleLayer();
  const centre = layer.placement.centre_mm;
  const start = { kind: "arc", layer, at: onCircle(centre, 2, 0) };
  const progress = startProgress(start);
  let patch;
  for (let deg = 30; deg <= 390; deg += 30) patch = dragPatch(start, progress, onCircle(centre, 2, deg));
  close(patch.placement.arc_position_deg, 390, 1e-6, "arc after a full turn and a bit");
  close(angleOf(centre, { x: 1, y: 0 }), 90, 1e-9, "3 o'clock is 90°");
  close(turn(350, 10), 20, 1e-9, "shortest turn across 0°");
});

test("move drag offsets the centre by the pointer's travel", () => {
  const layer = newTextLayer("s", 10.8, "A");
  const start = { kind: "move", layer, at: { x: 1, y: 1 } };
  const patch = dragPatch(start, startProgress(start), { x: 1.5, y: 0.25 });
  assert.deepEqual(patch.placement.centre_mm, { x: 0.5, y: -0.75 });
});

test("labels step clear of obstacles (the handles) and of each other", () => {
  const line = (a, b) => ({ a, b, width: 80, height: 20 });
  const obstacle = { x: 150, y: 300, width: 28, height: 28 };
  const [d, t] = layoutLabels(
    [
      { line: line({ x: 100, y: 290 }, { x: 300, y: 290 }), place: "below" },
      { line: line({ x: 320, y: 280 }, { x: 320, y: 320 }), place: "beside" },
    ],
    { x: 200, y: 200 },
    [obstacle],
  );
  assert.ok(!rectsOverlap(d, obstacle), JSON.stringify(d));
  assert.ok(!rectsOverlap(d, t));
});

test("history: one entry per commit, undo / redo, 50 deep, a no-op edit adds nothing", () => {
  const edit = (h, patch) => ({ ...h, recipe: { ...h.recipe, layers: h.recipe.layers.map((l) => applyLayerPatch(l, patch)) } });
  let h = startHistory(emptyRecipe());
  assert.equal(canUndo(h), false);
  h = applyDiscrete(h, (r) => ({ ...r, layers: [circleLayer()] }));
  for (let i = 1; i <= 5; i++) h = edit(h, { placement: { radius_mm: 3.63 + i * 0.1 } });
  assert.equal(canUndo(h), true, "an uncommitted drag is undoable");
  h = commitHistory(h);
  assert.equal(h.past.length, 2, "add + one committed drag");
  h = commitHistory(edit(h, { placement: { radius_mm: h.recipe.layers[0].placement.radius_mm } }));
  assert.equal(h.past.length, 2, "an edit back to the same value is no entry");
  h = undoHistory(h);
  close(h.recipe.layers[0].placement.radius_mm, 3.63, 1e-9, "undo restores");
  assert.equal(canRedo(h), true);
  h = redoHistory(h);
  close(h.recipe.layers[0].placement.radius_mm, 4.13, 1e-9, "redo returns");
  for (let i = 0; i < 80; i++) h = commitHistory(edit(h, { placement: { arc_position_deg: i + 1 } }));
  assert.equal(h.past.length, HISTORY_LIMIT);
  h = undoHistory(h);
  h = commitHistory(edit(h, { placement: { arc_position_deg: 999 } }));
  assert.equal(canRedo(h), false, "a new edit clears redo");
});
