import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { gradientColourAt } from "../../../src/features/editor/lib/gradient.ts";
import { memberGradientColour, orderedGroupMembers, moveGroupMember } from "../../../src/features/editor/lib/paintGroups.ts";
import { applyGroupGradientMode, applyScopedColour, applyScopedGradient } from "../../../src/features/editor/lib/scopedColour.ts";
import { emptyRecipe, newTextLayer, normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const ramp = { from: "#00FF00", to: "#FFFFFF", angle: 45, midpoint: 0.5 };
const part = id => ({ kind: "part", id });
const layer = id => ({ kind: "layer", id });
const group = { id: "gp", name: "GP", members: [part("0"), part("1"), part("2")] };
const recipe = () => ({ ...emptyRecipe(), layers: [newTextLayer("a", 20, "A"), newTextLayer("b", 20, "B"), newTextLayer("c", 20, "C")], paint_groups: [group] });
const state = () => useEditorStore.getState();
beforeEach(() => state().initialize(recipe(), "member-gradient"));

test("green to white produces green, pale green and white with exact endpoints", () => {
  assert.deepEqual([0, 0.5, 1].map(t => gradientColourAt(ramp, t)), ["#00FF00", "#80FF80", "#FFFFFF"]);
  assert.equal(gradientColourAt({ ...ramp, midpoint: 0.75 }, 0.5), "#55FF55");
  assert.equal(gradientColourAt(ramp, -1), "#00FF00");
  assert.equal(gradientColourAt(ramp, 2), "#FFFFFF");
});

test("each member gets one solid colour by row order, with empty and single-member folders supported", () => {
  const value = { ...group, gradient: ramp, gradient_mode: "members" };
  assert.deepEqual(group.members.map(member => memberGradientColour(value, member, [])), ["#00FF00", "#80FF80", "#FFFFFF"]);
  assert.equal(memberGradientColour({ ...value, members: [part("0")] }, part("0"), []), "#00FF00");
  assert.equal(memberGradientColour({ ...value, members: [] }, part("0"), []), undefined);
  assert.equal(memberGradientColour({ ...value, gradient_mode: undefined }, part("0"), []), undefined);
});

test("mixed groups follow the visible folder order and include hidden members without shifting their neighbours", () => {
  const layers = recipe().layers.map(layer => ({ ...layer, visible: layer.id !== "a" }));
  const value = { ...group, members: [layer("c"), part("2"), layer("a"), part("0")], gradient: ramp, gradient_mode: "members" };
  assert.deepEqual(orderedGroupMembers(value, layers), [part("2"), part("0"), layer("a"), layer("c")]);
  assert.deepEqual(orderedGroupMembers(value, layers).map(member => memberGradientColour(value, member, layers)), ["#00FF00", "#55FF55", "#AAFFAA", "#FFFFFF"]);
});

test("new distribution survives recipe JSON; old continuous gradients retain their original shape", () => {
  const saved = applyGroupGradientMode(recipe(), "gp", "members", ramp);
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(saved))).paint_groups, saved.paint_groups);
  const legacy = applyScopedGradient(recipe(), { kind: "group", id: "gp" }, ramp);
  assert.equal(normalizeRecipe(legacy).paint_groups[0].gradient_mode, undefined);
  const invalid = { ...saved, paint_groups: [{ ...saved.paint_groups[0], gradient_mode: "corrupt" }] };
  assert.equal(normalizeRecipe(invalid).paint_groups[0].gradient_mode, undefined);
});

test("switching mode replaces member fills while preserving their chosen materials and nonmembers", () => {
  const before = { ...recipe(), paint_groups: [{ ...group, members: [part("0"), layer("a")] }], part_colours: { "0": "#123456", "2": "#654321" } };
  before.layers[0].appearance = { mode: "plated", finish_id: "gold", custom: null, colour_hex: "#112233" };
  const after = applyGroupGradientMode(before, "gp", "members", ramp);
  assert.deepEqual(after.part_colours, { "2": "#654321" });
  assert.deepEqual(after.layers[0].appearance, { mode: "plated", finish_id: "gold", custom: null });
  assert.equal(after.layers[1], before.layers[1]);
  const continuous = applyGroupGradientMode(after, "gp", "continuous", ramp);
  assert.equal(continuous.paint_groups[0].gradient_mode, undefined);
  assert.deepEqual(continuous.paint_groups[0].gradient, ramp);
  for (const target of [null, { kind: "group", id: "gp" }]) assert.equal(applyScopedColour(after, target, "#123456").paint_groups[0].gradient_mode, undefined);
});

test("membership and branding sorting dynamically redistribute colours without writing per-member overrides", () => {
  const before = applyGroupGradientMode({ ...recipe(), paint_groups: [{ ...group, members: [layer("a"), layer("c")] }] }, "gp", "members", ramp);
  const added = moveGroupMember(before, layer("b"), "gp", "c");
  const value = added.paint_groups[0];
  assert.deepEqual(orderedGroupMembers(value, added.layers), [layer("a"), layer("b"), layer("c")]);
  assert.equal(memberGradientColour(value, layer("b"), added.layers), "#80FF80");
  const reordered = moveGroupMember(added, layer("c"), "gp", "a");
  assert.equal(memberGradientColour(reordered.paint_groups[0], layer("c"), reordered.layers), "#00FF00");
  assert.equal(memberGradientColour(reordered.paint_groups[0], layer("b"), reordered.layers), "#FFFFFF");
  assert.ok(reordered.layers.every(layer => !layer.appearance.colour_hex && !layer.appearance.gradient));
});

test("distribution changes are one undo entry; endpoint edits retain the mode", () => {
  state().setColourForTarget(part("0"), "#123456"); state().commit();
  const before = state().recipe;
  state().setGroupGradientMode("gp", "members", ramp);
  const after = state().recipe;
  state().undo(); assert.deepEqual(state().recipe, before);
  state().redo(); assert.deepEqual(state().recipe, after);
  state().setGradientForTarget({ kind: "group", id: "gp" }, { ...ramp, to: "#000000" }); state().commit();
  assert.equal(state().recipe.paint_groups[0].gradient_mode, "members");
  assert.equal(memberGradientColour(state().recipe.paint_groups[0], part("2"), state().recipe.layers), "#000000");
  assert.equal(applyGroupGradientMode(before, "missing", "members", ramp), before);
  assert.equal(applyGroupGradientMode(before, "gp", "members", { ...ramp, from: "invalid" }), before);
});
