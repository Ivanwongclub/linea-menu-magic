import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { MeshPhongMaterial, ShaderLib, Texture } from "three";
import { gradientAmount, normalizeGradient } from "../../../src/features/editor/lib/gradient.ts";
import { applyScopedColour, applyScopedGradient, hasColourOverride } from "../../../src/features/editor/lib/scopedColour.ts";
import { emptyRecipe, newTextLayer, newZone, normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";
import { applyMaterialGradient, materialWithColour, materialWithGradient, zoneStyleFor } from "../../../src/features/editor/lib/finishMaterial.ts";
import { sourcePhysicalMaterial } from "../../../src/features/editor/lib/modelMaterials.ts";
import { clonePatched } from "../../../src/features/editor/lib/shaderPatch.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const gradient = { from: "#FF0000", to: "#0000FF", angle: 0, midpoint: 0.5 };
const bounds = [-10, -5, 10, 5];
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-12, `${actual} ≈ ${expected}`);
const target = (kind, id) => ({ kind, id });
const recipe = () => ({ ...emptyRecipe(), layers: [newTextLayer("a", 20, "AB"), newTextLayer("b", 20, "C")], zones: [newZone("z", "Zone", "groups")] });
const state = () => useEditorStore.getState();
beforeEach(() => state().initialize(recipe(), "gradient-unit"));

test("gradient input normalizes colours and angles and rejects corrupt saved data", () => {
  assert.deepEqual(normalizeGradient({ from: "#f00", to: "abc", angle: -90, midpoint: 4 }), { from: "#FF0000", to: "#AABBCC", angle: 270, midpoint: 0.9 });
  for (const value of [null, [], {}, { ...gradient, from: "red" }, { ...gradient, angle: Infinity }, { ...gradient, midpoint: NaN }]) assert.equal(normalizeGradient(value), null);
});

test("linear fills reach both edges in every direction and place the 50/50 colour at the midpoint", () => {
  near(gradientAmount(-10, 0, bounds, gradient), 0);
  near(gradientAmount(10, 0, bounds, gradient), 1);
  near(gradientAmount(0, -5, bounds, { ...gradient, angle: 90 }), 0);
  near(gradientAmount(0, 5, bounds, { ...gradient, angle: 90 }), 1);
  near(gradientAmount(-10, -5, bounds, { ...gradient, angle: 45 }), 0);
  near(gradientAmount(10, 5, bounds, { ...gradient, angle: 45 }), 1);
  near(gradientAmount(-6, 0, bounds, { ...gradient, midpoint: 0.2 }), 0.5);
  near(gradientAmount(0, 0, [0, 0, 0, 0], gradient), 0.5);
});

test("a selected source part's gradient leaves shared MTLs, other fills and material choices alone", () => {
  const before = { ...recipe(), base_colour_hex: "#112233", part_colours: { "0": "#ABCDEF", "1": "#123456" } };
  const after = applyScopedGradient(before, target("part", "1"), gradient);
  assert.deepEqual(after.part_colours, { "0": "#ABCDEF" });
  assert.deepEqual(after.part_gradients, { "1": gradient });
  assert.equal(after.base_colour_hex, before.base_colour_hex);
  assert.equal(after.layers, before.layers);
  assert.equal(after.zones, before.zones);
  assert.equal(before.part_colours["1"], "#123456");
  assert.deepEqual(applyScopedColour(after, target("part", "1"), "#FFEE00").part_colours, { "0": "#ABCDEF", "1": "#FFEE00" });
});

test("text and zone gradients preserve their own finishes and invalid selections never recolour the model", () => {
  const before = recipe();
  before.layers[0].appearance = { mode: "plated", finish_id: "gold", custom: null, colour_hex: "#ABCDEF" };
  const after = applyScopedGradient(before, target("layer", "a"), gradient);
  assert.deepEqual(after.layers[0].appearance, { mode: "plated", finish_id: "gold", custom: null, gradient });
  assert.equal(after.layers[1], before.layers[1]);
  const zone = applyScopedGradient(after, target("zone", "z"), gradient);
  assert.deepEqual(zone.zones[0].appearance.gradient, gradient);
  for (const selection of [target("layer", "missing"), target("zone", "missing"), target("part", "-1")]) assert.equal(applyScopedGradient(before, selection, gradient), before);
});

test("whole-model fill replaces old scoped solid/gradient overrides, and reset restores authored materials", () => {
  let edited = applyScopedGradient(recipe(), target("part", "1"), gradient);
  edited = applyScopedGradient(edited, target("layer", "a"), gradient);
  edited = applyScopedColour(edited, target("zone", "z"), "#ABCDEF");
  const all = applyScopedGradient(edited, null, gradient);
  assert.equal(all.part_colours, undefined);
  assert.equal(all.part_gradients, undefined);
  assert.equal(all.layers[0].appearance.gradient, undefined);
  assert.equal(all.zones[0].appearance.colour_hex, undefined);
  assert.deepEqual(all.base_gradient, gradient);
  assert.ok(hasColourOverride(all, null));
  assert.deepEqual(applyScopedColour(all, null, null), recipe());
});

test("gradients survive recipe JSON, normalization and undo/redo without a database schema change", () => {
  state().setGradientForTarget(null, gradient);
  state().commit();
  state().setGradientForTarget(target("part", "1"), { ...gradient, angle: 45 });
  state().commit();
  const saved = normalizeRecipe(JSON.parse(JSON.stringify(state().recipe)));
  assert.deepEqual(saved.base_gradient, gradient);
  assert.equal(saved.part_gradients["1"].angle, 45);
  state().undo();
  assert.equal(state().recipe.part_gradients, undefined);
  assert.deepEqual(state().recipe.base_gradient, gradient);
  state().redo();
  assert.deepEqual(state().recipe, saved);
  const invalid = normalizeRecipe({ ...saved, base_gradient: { ...gradient, angle: "bad" }, part_gradients: { bad: gradient, "2": null }, layers: [{ ...saved.layers[0], appearance: { ...saved.layers[0].appearance, gradient: { ...gradient, to: "badcolour" } } }] });
  assert.equal(invalid.base_gradient, undefined);
  assert.deepEqual(invalid.part_gradients, {});
  assert.equal(invalid.layers[0].appearance.gradient, undefined);
});

test("gradient shaders keep MTL maps and surface settings; solid overrides clear inherited gradients", () => {
  const texture = new Texture();
  const authored = new MeshPhongMaterial({ color: "#CECFCA", map: texture, shininess: 128 });
  const original = sourcePhysicalMaterial(authored, false, null);
  const coloured = materialWithGradient(original, { colour: gradient, bounds });
  const derived = clonePatched(coloured);
  const solid = materialWithColour(coloured, "#123456");
  try {
    for (const material of [coloured, derived, solid]) {
      assert.equal(material.map, texture);
      assert.equal(material.roughness, original.roughness);
      assert.equal(material.metalness, original.metalness);
    }
    assert.equal(authored.color.getHexString(), "cecfca");
    assert.equal(original.userData.shaderPatch.gradient, undefined);
    assert.equal(solid.userData.shaderPatch.gradient, undefined);
    const shader = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader, uniforms: {} };
    derived.onBeforeCompile(shader, null);
    assert.deepEqual(shader.uniforms.wincycBaseGradientBounds.value.toArray(), bounds);
    assert.equal(shader.uniforms.wincycBaseGradientFrom.value.getHexString(), "ff0000");
    assert.equal(shader.uniforms.wincycBaseGradientMidpoint.value, 0.5);
    assert.match(derived.customProgramCacheKey(), /gradient/);
    assert.doesNotMatch(solid.customProgramCacheKey(), /gradient/);
  } finally { solid.dispose(); derived.dispose(); coloured.dispose(); original.dispose(); authored.dispose(); texture.dispose(); }
});

test("zones can inherit the global gradient or override it, retaining their physical finish", () => {
  const own = { mode: "plated", finish_id: "gold", custom: null };
  const finishes = new Map([["gold", { metalness: 1, roughness: 0.21, base_color_hex: "#DDCC00" }]]);
  const inherited = zoneStyleFor(own, finishes, undefined, gradient);
  assert.equal(inherited.preserveColour, true);
  assert.equal(inherited.metalness, 1);
  const selected = zoneStyleFor({ ...own, gradient }, finishes, undefined, gradient);
  assert.deepEqual(selected.gradient, gradient);
  assert.equal(selected.preserveColour, undefined);
  const source = new MeshPhongMaterial();
  const material = sourcePhysicalMaterial(source, false, [inherited, selected]);
  applyMaterialGradient(material, { colour: gradient, bounds }, bounds);
  try {
    const shader = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader, uniforms: {} };
    material.onBeforeCompile(shader, null);
    assert.deepEqual(shader.uniforms.zonePreserveColour.value, [1, 0]);
    assert.equal(shader.uniforms.wincycZoneGradient1Midpoint.value, 0.5);
  } finally { material.dispose(); source.dispose(); }
});
