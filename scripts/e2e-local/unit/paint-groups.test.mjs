import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { MeshPhongMaterial, ShaderLib, Texture } from "three";
import { normalizePaintGroups, putPaintGroup, removePaintGroup, unionGradientBounds } from "../../../src/features/editor/lib/paintGroups.ts";
import { applyScopedColour, applyScopedGradient } from "../../../src/features/editor/lib/scopedColour.ts";
import { emptyRecipe, newTextLayer, normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";
import { gradientAmount } from "../../../src/features/editor/lib/gradient.ts";
import { updateGradientBounds } from "../../../src/features/editor/lib/gradientShader.ts";
import { materialWithGradient } from "../../../src/features/editor/lib/finishMaterial.ts";
import { sourcePhysicalMaterial } from "../../../src/features/editor/lib/modelMaterials.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const gradient = { from: "#FF0000", to: "#0000FF", angle: 0, midpoint: 0.5 };
const part = id => ({ kind: "part", id });
const layer = id => ({ kind: "layer", id });
const group = { id: "gp", name: "GP 1", members: [part("0"), part("1"), layer("a")] };
const target = { kind: "group", id: "gp" };
const recipe = () => ({ ...emptyRecipe(), layers: [newTextLayer("a", 20, "A"), newTextLayer("b", 20, "B")] });
const state = () => useEditorStore.getState();
beforeEach(() => state().initialize(recipe(), "group-unit"));

test("groups validate flat, unique memberships and keep only existing branding layers", () => {
  const groups = normalizePaintGroups([
    { ...group, members: [part("0"), part("0"), part("-1"), layer("a"), layer("missing"), { kind: "group", id: "nested" }] },
    { id: "second", name: "Second", members: [part("0"), part("2")] },
    { ...group, members: [part("3")] },
  ], new Set(["a"]));
  assert.deepEqual(groups.map(group => group.members), [[part("0"), layer("a")], [part("2")]]);
  assert.equal(groups.length, 2);
});

test("creating and dissolving a GP keeps source-part identities and the recipe's layers/materials", () => {
  const before = recipe();
  const created = putPaintGroup(before, group);
  assert.equal(created.layers, before.layers);
  assert.equal(created.finish_id, before.finish_id);
  assert.deepEqual(created.paint_groups[0].members, group.members);
  assert.deepEqual(removePaintGroup(created, "gp"), before);
  assert.equal(removePaintGroup(created, "missing"), created);
});

test("a GP fill replaces only its members' individual fills and leaves their chosen materials", () => {
  const before = putPaintGroup(recipe(), group);
  before.layers[0].appearance = { mode: "plated", finish_id: "gold", custom: null, gradient };
  before.layers[1].appearance = { mode: "paint", finish_id: "ink", custom: null, colour_hex: "#00FF00" };
  before.part_colours = { "0": "#123456", "2": "#654321" };
  before.part_gradients = { "1": gradient };
  const changed = applyScopedGradient(before, target, gradient);
  assert.deepEqual(changed.paint_groups[0].gradient, gradient);
  assert.deepEqual(changed.part_colours, { "2": "#654321" });
  assert.equal(changed.part_gradients, undefined);
  assert.deepEqual(changed.layers[0].appearance, { mode: "plated", finish_id: "gold", custom: null });
  assert.equal(changed.layers[1], before.layers[1]);
  assert.equal(before.layers[0].appearance.gradient, gradient);
  const solid = applyScopedColour(changed, target, "#FFFF00");
  assert.equal(solid.paint_groups[0].gradient, undefined);
  assert.equal(solid.paint_groups[0].colour_hex, "#FFFF00");
});

test("individual overrides stay local; reapplying the same GP fill reunifies its members", () => {
  let edited = applyScopedGradient(putPaintGroup(recipe(), group), target, gradient);
  edited = applyScopedColour(edited, part("0"), "#00FF00");
  assert.deepEqual(edited.paint_groups[0].gradient, gradient);
  assert.equal(edited.part_colours["0"], "#00FF00");
  const reunified = applyScopedGradient(edited, target, gradient);
  assert.equal(reunified.part_colours, undefined);
  assert.deepEqual(reunified.paint_groups[0].gradient, gradient);
});

test("whole-model changes clear GP fill overrides while preserving names and membership", () => {
  const before = applyScopedGradient(putPaintGroup(recipe(), group), target, gradient);
  const changed = applyScopedColour(before, null, "#112233");
  assert.equal(changed.base_colour_hex, "#112233");
  assert.deepEqual(changed.paint_groups, [group]);
  assert.equal(applyScopedGradient(changed, { kind: "group", id: "missing" }, gradient), changed);
});

test("editing membership prevents sharing a member between two GPs", () => {
  const before = putPaintGroup(recipe(), group);
  const changed = putPaintGroup(before, { id: "second", name: "GP 2", members: [part("1"), part("3")] });
  assert.deepEqual(changed.paint_groups[1].members, [part("3")]);
  const edited = putPaintGroup(changed, { ...changed.paint_groups[0], name: "Renamed", members: [part("0"), layer("b")] });
  assert.equal(edited.paint_groups[0].name, "Renamed");
  assert.deepEqual(edited.paint_groups[1].members, [part("3")]);
});

test("renaming a GP keeps deliberate individual overrides, while newly added members take its fill", () => {
  let before = applyScopedGradient(putPaintGroup(recipe(), group), target, gradient);
  before = applyScopedColour(before, part("0"), "#00FF00");
  before = applyScopedColour(before, part("2"), "#FFFF00");
  const changed = putPaintGroup(before, { ...before.paint_groups[0], name: "New name", members: [...group.members, part("2")] });
  assert.deepEqual(changed.part_colours, { "0": "#00FF00" });
});

test("deleting branding prunes memberships and empty GPs; undo restores everything", () => {
  state().savePaintGroup({ ...group, members: [layer("a")] });
  state().setGradientForTarget(target, gradient);
  state().commit();
  state().removeLayer("a");
  assert.equal(state().recipe.paint_groups, undefined);
  assert.equal(state().selection, null);
  state().undo();
  assert.deepEqual(state().recipe.paint_groups[0].gradient, gradient);
  assert.equal(state().recipe.layers[0].id, "a");
  state().redo();
  assert.equal(state().recipe.paint_groups, undefined);
});

test("GP membership and gradients survive recipe JSON and restoring old recipes", () => {
  const saved = applyScopedGradient(putPaintGroup(recipe(), group), target, gradient);
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(saved))).paint_groups, saved.paint_groups);
  assert.equal(normalizeRecipe(emptyRecipe()).paint_groups, undefined);
  state().savePaintGroup(group);
  state().undo();
  assert.equal(state().recipe.paint_groups, undefined);
  assert.equal(state().selection, null);
  state().redo();
  assert.deepEqual(state().recipe.paint_groups, [group]);
});

test("separated parts and text share a single gradient span instead of restarting at each member", () => {
  const bounds = unionGradientBounds([[-10, -2, -2, 2], [2, -2, 10, 2], [-4, 4, 4, 6]], [0, 0, 1, 1]);
  assert.deepEqual(bounds, [-10, -2, 10, 6]);
  assert.equal(gradientAmount(-5, 0, bounds, gradient), 0.25);
  assert.equal(gradientAmount(5, 0, bounds, gradient), 0.75);
  assert.deepEqual(unionGradientBounds([undefined], [-1, -1, 1, 1]), [-1, -1, 1, 1]);
});

test("late text geometry updates every compiled group shader's shared bounds without changing MTLs", () => {
  const texture = new Texture();
  const source = new MeshPhongMaterial({ color: "#AABBCC", map: texture, shininess: 80 });
  const original = sourcePhysicalMaterial(source, false, null);
  const bounds = [-10, -2, 10, 2];
  const paint = { colour: gradient, bounds };
  const left = materialWithGradient(original, paint), right = materialWithGradient(original, paint);
  const compile = material => {
    const shader = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader, uniforms: {} };
    material.onBeforeCompile(shader, null);
    return shader;
  };
  try {
    const a = compile(left), b = compile(right);
    assert.equal(a.uniforms.wincycBaseGradientBounds.value, b.uniforms.wincycBaseGradientBounds.value);
    updateGradientBounds(bounds, [-10, -2, 12, 8]);
    assert.deepEqual(a.uniforms.wincycBaseGradientBounds.value.toArray(), [-10, -2, 12, 8]);
    assert.deepEqual(b.uniforms.wincycBaseGradientBounds.value.toArray(), [-10, -2, 12, 8]);
    assert.equal(left.map, texture);
    assert.equal(right.roughness, original.roughness);
    assert.equal(source.color.getHexString(), "aabbcc");
  } finally { left.dispose(); right.dispose(); original.dispose(); source.dispose(); texture.dispose(); }
});
