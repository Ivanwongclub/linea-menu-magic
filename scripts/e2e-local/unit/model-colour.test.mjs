import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { MeshPhongMaterial, Texture } from "three";
import { finishMaterial } from "../../../src/features/editor/lib/finishMaterial.ts";
import { sourcePhysicalMaterial } from "../../../src/features/editor/lib/modelMaterials.ts";
import { emptyRecipe, normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const state = () => useEditorStore.getState();
beforeEach(() => state().initialize(emptyRecipe(), "model-colour-test"));

test("arbitrary colour changes preserve the finish's physical material settings", () => {
  const finish = { base_color_hex: "#A07451", metalness: 1, roughness: 0.32, anisotropy: 0.7, clearcoat: 0.2, clearcoat_roughness: 0.1, two_tone: true, oxide_color_hex: "#302820", surface: { code: "BRUSHED" } };
  const original = finishMaterial(finish);
  const tinted = finishMaterial(finish, null, "#167AC6");
  try {
    assert.equal(tinted.color.getHexString(), "167ac6");
    for (const key of ["metalness", "roughness", "anisotropy", "clearcoat", "clearcoatRoughness"]) assert.equal(tinted[key], original[key], key);
    assert.equal(finish.base_color_hex, "#A07451", "changing a design must not mutate its catalogue finish");
    assert.equal(tinted.customProgramCacheKey(), original.customProgramCacheKey(), "brush/two-tone shader settings remain intact");
  } finally { original.dispose(); tinted.dispose(); }
});

test("colour edits retain imported MTL texture and surface maps", () => {
  const texture = new Texture();
  const source = new MeshPhongMaterial({ color: "#FFFFFF", map: texture, shininess: 90, opacity: 0.8, transparent: true });
  const original = sourcePhysicalMaterial(source, false, null);
  const tinted = sourcePhysicalMaterial(source, false, null, "#E84567");
  try {
    assert.equal(tinted.color.getHexString(), "e84567");
    assert.equal(tinted.map, texture);
    assert.equal(tinted.roughness, original.roughness);
    assert.equal(tinted.opacity, original.opacity);
    assert.equal(source.color.getHexString(), "ffffff");
  } finally { original.dispose(); tinted.dispose(); source.dispose(); texture.dispose(); }
});

test("colour persists through recipe read-back while legacy drafts keep the material's default", () => {
  const recipe = { ...emptyRecipe(), finish_id: "rose-gold", base_colour_hex: "#abc" };
  const restored = normalizeRecipe(JSON.parse(JSON.stringify(recipe)));
  assert.equal(restored.base_colour_hex, "#AABBCC");
  assert.equal(restored.finish_id, "rose-gold");
  assert.equal(normalizeRecipe(emptyRecipe()).base_colour_hex, undefined);
  assert.equal(normalizeRecipe({ ...recipe, base_colour_hex: "invalid" }).base_colour_hex, undefined);
});

test("colour edits do not switch appearance mode or finish and undo as one continuous edit", () => {
  state().setFinishId("rose-gold");
  state().setModelAppearanceMode("finish");
  const before = state();
  state().setBaseColourHex("#f00");
  state().setBaseColourHex("#123456");
  assert.equal(state().past.length, before.past.length, "live colour changes must not fill undo history");
  assert.equal(state().recipe.finish_id, "rose-gold");
  assert.equal(state().recipe.view.model_appearance_mode, "finish");
  state().commit();
  state().undo();
  assert.equal(state().recipe.base_colour_hex, undefined);
  state().redo();
  assert.equal(state().recipe.base_colour_hex, "#123456");
  state().setBaseColourHex(null);
  state().commit();
  assert.equal(state().recipe.base_colour_hex, undefined);
  state().undo();
  assert.equal(state().recipe.base_colour_hex, "#123456");
});

test("temporary OBJ colour edits preserve source mode and restore the catalogue colour on return", () => {
  state().setBaseColourHex("#102030");
  state().commit();
  state().setLocalModel({ url: "blob:local-obj", name: "MO06.obj", hasSourceAppearance: true });
  state().setBaseColourHex("#E84567");
  assert.equal(state().localModel.appearanceMode, "source");
  assert.equal(state().recipe.base_colour_hex, "#E84567");
  state().setLocalModel(null);
  assert.equal(state().recipe.base_colour_hex, "#102030");
});
