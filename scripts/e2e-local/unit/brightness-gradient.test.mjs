import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { MeshPhongMaterial, ShaderLib, Texture } from "three";
import { brightnessColour, enableGradientBrightness, gradientColourAt, gradientCss, normalizeGradient, reverseGradient, withGradientBrightness } from "../../../src/features/editor/lib/gradient.ts";
import { memberGradientColour } from "../../../src/features/editor/lib/paintGroups.ts";
import { emptyRecipe, newTextLayer, newZone, normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";
import { sourcePhysicalMaterial } from "../../../src/features/editor/lib/modelMaterials.ts";
import { materialWithGradient } from "../../../src/features/editor/lib/finishMaterial.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const base = { from: "#0066CC", to: "#FFFFFF", angle: 0, midpoint: 0.5 };
const ramp = () => withGradientBrightness(base, { colour: "#0066CC", from: -50, to: 50 });
const state = () => useEditorStore.getState();
const part = id => ({ kind: "part", id });
beforeEach(() => state().initialize({ ...emptyRecipe(), layers: [newTextLayer("a", 20, "ABC")], zones: [newZone("z", "Zone", "groups")], paint_groups: [{ id: "gp", name: "GP", members: [part("0"), part("1"), part("2")] }] }, "brightness-unit"));

test("brightness shades the same base colour, reaching black/base/white exactly", () => {
  assert.deepEqual([-100, -50, 0, 50, 100].map(value => brightnessColour("#0066CC", value)), ["#000000", "#003366", "#0066CC", "#80B3E6", "#FFFFFF"]);
  assert.equal(brightnessColour("#0066CC", -200), "#000000");
  assert.equal(brightnessColour("#0066CC", 200), "#FFFFFF");
});

test("a dark-to-light ramp passes through the original colour rather than mixing two unrelated endpoints", () => {
  assert.deepEqual([0, 0.5, 1].map(t => gradientColourAt(ramp(), t)), ["#003366", "#0066CC", "#80B3E6"]);
  const shifted = { ...ramp(), midpoint: 0.65 };
  assert.equal(gradientColourAt(shifted, 0.65), "#0066CC");
  assert.match(gradientCss(shifted), /#0066CC 65%/);
  assert.equal(enableGradientBrightness({ ...base, from: "#000000", to: "#0066CC" }).brightness.colour, "#0066CC");
});

test("normalization freezes valid brightness parameters, derives endpoints and ignores corrupt optional settings", () => {
  const value = normalizeGradient({ ...base, brightness: { colour: "#06c", from: -500, to: 200 } });
  assert.deepEqual(value.brightness, { colour: "#0066CC", from: -100, to: 100 });
  assert.equal(value.from, "#000000"); assert.equal(value.to, "#FFFFFF");
  for (const brightness of [null, [], { colour: "invalid", from: 0, to: 50 }, { colour: "#0066CC", from: NaN, to: 50 }]) assert.deepEqual(normalizeGradient({ ...base, brightness }), base);
  const saved = { ...state().recipe, base_gradient: ramp(), part_gradients: { "3": ramp() } };
  saved.layers[0].appearance.gradient = ramp(); saved.zones[0].appearance.gradient = ramp();
  assert.deepEqual(normalizeRecipe(JSON.parse(JSON.stringify(saved))), saved);
});

test("reversing brightness swaps the amounts and midpoint without mutating the original", () => {
  const original = { ...ramp(), midpoint: 0.3 };
  const reversed = reverseGradient(original);
  assert.deepEqual(reversed.brightness, { colour: "#0066CC", from: 50, to: -50 });
  assert.equal(reversed.midpoint, 0.7);
  assert.deepEqual([0, 0.5, 1].map(t => gradientColourAt(reversed, t)), [1, 0.5, 0].map(t => gradientColourAt(original, t)));
  assert.equal(original.brightness.from, -50);
});

test("group member distribution, undo/redo and a later colour gradient retain the right variation", () => {
  state().setGroupGradientMode("gp", "members", ramp());
  const value = state().recipe.paint_groups[0];
  assert.deepEqual(value.members.map(member => memberGradientColour(value, member, state().recipe.layers)), ["#003366", "#0066CC", "#80B3E6"]);
  state().undo(); assert.equal(state().recipe.paint_groups[0].gradient, undefined);
  state().redo(); assert.deepEqual(state().recipe.paint_groups[0].gradient.brightness, ramp().brightness);
  state().setGradientForTarget({ kind: "group", id: "gp" }, base); state().commit();
  assert.equal(state().recipe.paint_groups[0].gradient_mode, "members");
  assert.equal(state().recipe.paint_groups[0].gradient.brightness, undefined);
});

test("brightness can target a part, branding or zone without changing its siblings or materials", () => {
  const before = state().recipe;
  for (const target of [part("0"), { kind: "layer", id: "a" }, { kind: "zone", id: "z" }]) { state().setGradientForTarget(target, ramp()); state().commit(); }
  assert.deepEqual(state().recipe.part_gradients["0"].brightness, ramp().brightness);
  assert.deepEqual(state().recipe.layers[0].appearance.gradient.brightness, ramp().brightness);
  assert.deepEqual(state().recipe.zones[0].appearance.gradient.brightness, ramp().brightness);
  assert.equal(state().recipe.base_gradient, undefined);
  assert.equal(state().recipe.finish_id, before.finish_id);
  assert.equal(state().recipe.layers[0].appearance.mode, before.layers[0].appearance.mode);
});

test("GPU brightness uniforms use sRGB base colour while keeping authored MTL textures and physical properties", () => {
  const map = new Texture(), authored = new MeshPhongMaterial({ color: "#ABCDEF", map, shininess: 50 });
  const source = sourcePhysicalMaterial(authored, false, null), material = materialWithGradient(source, { colour: ramp(), bounds: [-10, -2, 10, 2] });
  const shader = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader, uniforms: {} };
  material.onBeforeCompile(shader, null);
  assert.equal(shader.uniforms.wincycBaseGradientBrightnessMode.value, 1);
  assert.deepEqual(shader.uniforms.wincycBaseGradientBrightnessColour.value.toArray(), [0, 0.4, 0.8]);
  assert.deepEqual(shader.uniforms.wincycBaseGradientBrightnessRange.value.toArray(), [-0.5, 0.5]);
  assert.equal(material.map, map); assert.equal(material.roughness, source.roughness); assert.equal(material.metalness, source.metalness);
  assert.equal(authored.color.getHexString(), "abcdef");
  material.dispose(); source.dispose(); authored.dispose(); map.dispose();
});
