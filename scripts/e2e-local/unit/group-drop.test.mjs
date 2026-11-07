import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { moveGroupMember, putPaintGroup } from "../../../src/features/editor/lib/paintGroups.ts";
import { emptyRecipe, newTextLayer } from "../../../src/features/editor/lib/recipe.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const part = id => ({ kind: "part", id });
const layer = id => ({ kind: "layer", id });
const gradient = { from: "#FF0000", to: "#0000FF", angle: 0, midpoint: 0.5 };
const state = () => useEditorStore.getState();
const recipe = () => ({ ...emptyRecipe(), layers: ["a", "b", "c", "d"].map(id => newTextLayer(id, 20, id)), paint_groups: [{ id: "g1", name: "GP 1", members: [part("0"), part("1")], gradient }, { id: "g2", name: "GP 2", members: [part("2"), part("3")], colour_hex: "#00FF00" }] });
beforeEach(() => state().initialize(recipe(), "drop-unit"));

test("drop transfers a part exactly once and takes the destination fill without changing other members", () => {
  const before = { ...recipe(), part_colours: { "1": "#123456", "3": "#654321", "4": "#ABCDEF" }, hidden_groups: [1] };
  const after = moveGroupMember(before, part("1"), "g2");
  assert.deepEqual(after.paint_groups[0].members, [part("0")]);
  assert.deepEqual(after.paint_groups[1].members, [part("2"), part("3"), part("1")]);
  assert.deepEqual(after.part_colours, { "3": "#654321", "4": "#ABCDEF" });
  assert.equal(after.hidden_groups, before.hidden_groups);
  assert.equal(after.layers, before.layers);
  assert.deepEqual(before.paint_groups[0].members, [part("0"), part("1")]);
});

test("dragging out keeps the actual part and its own paint while removing empty source folders", () => {
  const before = { ...recipe(), part_colours: { "0": "#123456" } };
  before.paint_groups[0] = { ...before.paint_groups[0], members: [part("0")] };
  const after = moveGroupMember(before, part("0"), null);
  assert.equal(after.paint_groups.length, 1);
  assert.equal(after.paint_groups[0].id, "g2");
  assert.equal(after.part_colours["0"], "#123456");
  assert.equal(after.layers, before.layers);
});

test("a new branding member takes a GP gradient without losing its material", () => {
  const before = recipe();
  before.layers[0].appearance = { mode: "plated", finish_id: "gold", custom: null, colour_hex: "#ABCDEF" };
  const after = moveGroupMember(before, layer("a"), "g1");
  assert.deepEqual(after.layers.find(layer => layer.id === "a").appearance, { mode: "plated", finish_id: "gold", custom: null });
  assert.ok(after.paint_groups[0].members.some(member => member.kind === "layer" && member.id === "a"));
  assert.equal(after.layers[1], before.layers[1]);
});

test("cross-folder layer drops insert by identity rather than subset indices", () => {
  const before = { ...recipe(), paint_groups: [{ id: "left", name: "Left", members: [layer("a"), layer("c")] }, { id: "right", name: "Right", members: [layer("b"), layer("d")] }] };
  const after = moveGroupMember(before, layer("c"), "right", "b");
  assert.deepEqual(after.layers.map(layer => layer.id), ["a", "c", "b", "d"]);
  assert.deepEqual(after.paint_groups[0].members, [layer("a")]);
  assert.equal(after.paint_groups[1].members.filter(member => member.id === "c").length, 1);
  const reorder = moveGroupMember(before, layer("c"), "left", "a");
  assert.deepEqual(reorder.layers.map(layer => layer.id), ["c", "a", "b", "d"]);
  assert.equal(reorder.paint_groups, before.paint_groups);
});

test("dropping onto a folder appends after its layers; dropping onto root appends after root layers", () => {
  const before = putPaintGroup({ ...recipe(), paint_groups: undefined }, { id: "g", name: "G", members: [layer("b"), layer("d")] });
  const moved = moveGroupMember(before, layer("a"), "g");
  assert.deepEqual(moved.layers.map(layer => layer.id), ["b", "c", "d", "a"]);
  const root = moveGroupMember(moved, layer("b"), null);
  assert.deepEqual(root.layers.map(layer => layer.id), ["c", "b", "d", "a"]);
});

test("cancelled, repeated and invalid drops do not change recipes", () => {
  const before = recipe();
  for (const [member, group] of [[part("0"), "g1"], [layer("a"), null], [part("0"), "missing"], [part("-1"), "g1"], [layer("missing"), "g1"], [{ kind: "group", id: "g1" }, "g2"]]) assert.equal(moveGroupMember(before, member, group), before);
});

test("one undo restores membership and the member's replaced fill; redo reapplies the whole drop", () => {
  state().setColourForTarget(part("0"), "#123456");
  state().commit();
  const before = state().recipe;
  state().beginDrag();
  state().movePaintGroupMember(part("0"), "g2");
  state().endDrag();
  const dropped = state().recipe;
  assert.deepEqual(state().selection, { kind: "group", id: "g2" });
  assert.equal(state().dragging, false);
  state().undo();
  assert.deepEqual(state().recipe, before);
  state().redo();
  assert.deepEqual(state().recipe, dropped);
});
