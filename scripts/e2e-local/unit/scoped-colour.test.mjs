import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { MeshPhongMaterial, Texture } from "three";
import { applyScopedColour, colourOverride, hasColourOverride } from "../../../src/features/editor/lib/scopedColour.ts";
import { emptyRecipe, newTextLayer, newZone, normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";
import { materialWithColour, zoneStyleFor } from "../../../src/features/editor/lib/finishMaterial.ts";
import { sourcePhysicalMaterial } from "../../../src/features/editor/lib/modelMaterials.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const target = (kind, id) => ({ kind, id });
const state = () => useEditorStore.getState();
const recipe = () => ({ ...emptyRecipe(), finish_id: "metal", layers: [newTextLayer("a", 20, "A"), newTextLayer("b", 20, "B")], zones: [newZone("zone", "Zone", "groups")] });
beforeEach(() => state().initialize(recipe(), "scoped-colour-test"));

test("a selected OBJ part changes independently of other parts and the base colour", () => {
  const before = { ...recipe(), base_colour_hex: "#123456", part_colours: { "0": "#ABCDEF" } };
  const after = applyScopedColour(before, target("part", "1"), "#f00");
  assert.deepEqual(after.part_colours, { "0": "#ABCDEF", "1": "#FF0000" });
  assert.equal(after.base_colour_hex, before.base_colour_hex);
  assert.equal(after.layers, before.layers);
  assert.equal(after.zones, before.zones);
});

test("MTL colour clones retain texture and surface properties without recolouring shared materials", () => {
  const texture = new Texture();
  const authored = new MeshPhongMaterial({ color: "#CECFCA", shininess: 128, map: texture });
  const source = sourcePhysicalMaterial(authored, false, [{ colorHex: "#123456", metalness: 0.7, roughness: 0.2 }]);
  const red = materialWithColour(source, "#FF0000");
  const blue = materialWithColour(source, "#0000FF");
  try {
    assert.equal(source.color.getHexString(), "cecfca");
    assert.equal(red.color.getHexString(), "ff0000");
    assert.equal(blue.color.getHexString(), "0000ff");
    assert.equal(red.map, texture);
    assert.equal(red.roughness, source.roughness);
    assert.equal(red.metalness, source.metalness);
    assert.equal(red.userData.shaderPatch.zones[0].colorHex, "#FF0000");
    assert.equal(source.userData.shaderPatch.zones[0].colorHex, "#123456");
    assert.equal(red.customProgramCacheKey(), source.customProgramCacheKey());
  } finally { red.dispose(); blue.dispose(); source.dispose(); authored.dispose(); texture.dispose(); }
});

test("text and zone colour edits keep their material choices and do not touch siblings", () => {
  const before = recipe();
  before.layers[0].appearance = { mode: "plated", finish_id: "gold", custom: null };
  const text = applyScopedColour(before, target("layer", "a"), "#11AA33");
  assert.deepEqual(text.layers[0].appearance, { mode: "plated", finish_id: "gold", custom: null, colour_hex: "#11AA33" });
  assert.equal(text.layers[1], before.layers[1]);
  assert.equal(text.zones, before.zones);
  assert.equal(text.base_colour_hex, undefined);
  const region = applyScopedColour(text, target("zone", "zone"), "#456789");
  assert.equal(region.layers, text.layers);
  assert.equal(region.zones[0].appearance.colour_hex, "#456789");
  assert.equal(zoneStyleFor(region.zones[0].appearance, new Map()).preserveMaterial, true);
});

test("a whole-model colour replaces scoped tints and reset restores the original material choices", () => {
  const before = recipe();
  let edited = applyScopedColour(before, target("part", "1"), "#FF0000");
  edited = applyScopedColour(edited, target("layer", "a"), "#00FF00");
  edited = applyScopedColour(edited, target("zone", "zone"), "#0000FF");
  assert.equal(hasColourOverride(edited, null), true);
  const all = applyScopedColour(edited, null, "#ABCDEF");
  assert.equal(all.part_colours, undefined);
  assert.equal(colourOverride(all, target("layer", "a")), undefined);
  assert.equal(colourOverride(all, target("zone", "zone")), undefined);
  assert.equal(all.base_colour_hex, "#ABCDEF");
  assert.deepEqual(applyScopedColour(all, null, null), before);
});

test("selected-part reset leaves the global colour and other selections unchanged, with undo/redo", () => {
  state().setBaseColourHex("#123456");
  state().commit();
  state().select(target("part", "1"));
  state().setColourForTarget(state().selection, "#AABBCC");
  state().commit();
  state().setColourForTarget(state().selection, null);
  state().commit();
  assert.equal(state().recipe.base_colour_hex, "#123456");
  assert.equal(state().recipe.part_colours, undefined);
  state().undo();
  assert.equal(state().recipe.part_colours["1"], "#AABBCC");
  assert.deepEqual(state().selection, target("part", "1"));
  state().redo();
  assert.equal(state().recipe.part_colours, undefined);
});

test("scoped colours survive recipe read-back while malformed colours and targets are ignored", () => {
  let current = applyScopedColour(recipe(), target("part", "1"), "#f00");
  current = applyScopedColour(current, target("layer", "a"), "#abc");
  current = applyScopedColour(current, target("zone", "zone"), "#123456");
  current.part_colours["-1"] = "#000000";
  current.part_colours.other = "#FFFFFF";
  current.part_colours["2"] = "bad-colour";
  const restored = normalizeRecipe(JSON.parse(JSON.stringify(current)));
  assert.deepEqual(restored.part_colours, { "1": "#FF0000" });
  assert.equal(restored.layers[0].appearance.colour_hex, "#AABBCC");
  assert.equal(restored.zones[0].appearance.colour_hex, "#123456");
  assert.equal(applyScopedColour(restored, target("layer", "missing"), "#FF0000"), restored);
  assert.equal(applyScopedColour(restored, target("part", "wrong"), "#FF0000"), restored);
  assert.equal(applyScopedColour(restored, null, "bad-colour"), restored);
});
