import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { ShaderLib } from "three";
import { emptyRecipe, newZone } from "../../../src/features/editor/lib/recipe.ts";
import { boundedZonePlane, zoneAxisRange } from "../../../src/features/editor/lib/zones.ts";
import { colourMaterial, materialWithColour, materialWithGradient } from "../../../src/features/editor/lib/finishMaterial.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";

const state = () => useEditorStore.getState();
const draft = () => ({ ...newZone("draft", "Surface", "plane"), appearance: { mode: "paint", finish_id: null, custom: null, colour_hex: "#E63355" } });
const bounds = { minX: -10, maxX: 10, minY: -4, maxY: 8, minZ: -1, maxZ: 2 };
beforeEach(() => state().initialize(emptyRecipe(), "zone-region-unit"));

test("region setup and cancellation never enter the saved recipe or undo history", () => {
  const before = state().recipe;
  state().startZoneDraft(draft());
  state().updateZone("draft", { plane: { axis: "x", side: "below", at_mm: 4 } });
  state().commit();
  assert.equal(state().recipe, before);
  assert.equal(state().past.length, 0);
  assert.equal(state().zoneDraft.plane.axis, "x");
  state().cancelZoneDraft();
  assert.equal(state().zoneDraft, null);
  assert.equal(state().recipe, before);
});

test("confirm is a single undoable edit including the chosen axis, location, side and colour", () => {
  state().startZoneDraft(draft());
  state().beginDrag();
  state().updateZone("draft", { plane: { axis: "z", side: "below", at_mm: 1.2 } });
  state().endDrag();
  assert.equal(state().past.length, 0);
  state().confirmZoneDraft();
  const saved = state().recipe;
  assert.deepEqual(saved.zones[0].plane, { axis: "z", side: "below", at_mm: 1.2 });
  assert.equal(saved.zones[0].appearance.colour_hex, "#E63355");
  assert.deepEqual(state().selection, { kind: "zone", id: "draft" });
  assert.equal(state().zoneDraft, null);
  state().undo();
  assert.equal(state().recipe.zones.length, 0);
  state().redo();
  assert.deepEqual(state().recipe, saved);
});

test("a painted draft uses temporary faces and exits painting when confirmed", () => {
  state().startZoneDraft(newZone("brush", "Brush", "paint"));
  assert.equal(state().paintZoneId, "brush");
  state().setPaintZone("brush");
  assert.equal(state().selection, null);
  state().updateZone("brush", { faces: [2, 5] });
  assert.equal(state().recipe.zones.length, 0);
  state().confirmZoneDraft();
  assert.deepEqual(state().recipe.zones[0].faces, [2, 5]);
  assert.equal(state().paintZoneId, null);
  assert.equal(state().past.length, 1);
});

test("undo cancels an unfinished region before touching earlier design edits", () => {
  state().setBaseColourHex("#123456"); state().commit();
  state().startZoneDraft(draft()); state().setZonePicking(true);
  state().undo();
  assert.equal(state().zoneDraft, null);
  assert.equal(state().zonePicking, false);
  assert.equal(state().recipe.base_colour_hex, "#123456");
  state().undo();
  assert.equal(state().recipe.base_colour_hex, undefined);
});

test("undoing or deleting a picked region releases model interaction", () => {
  state().startZoneDraft(draft()); state().confirmZoneDraft(); state().setZonePicking(true);
  state().undo();
  assert.equal(state().zonePicking, false);
  state().redo(); state().select({ kind: "zone", id: "draft" }); state().setZonePicking(true); state().removeZone("draft");
  assert.equal(state().zonePicking, false);
  state().startZoneDraft(draft()); state().loadRecipe(emptyRecipe());
  assert.equal(state().zoneDraft, null);
});

test("each axis uses its own physical extent and cannot drag outside the model", () => {
  for (const [axis, range] of [["x", [-10, 10]], ["y", [-4, 8]], ["z", [-1, 2]]]) {
    assert.deepEqual(zoneAxisRange(bounds, axis), range);
    const plane = { axis, side: "above", at_mm: 0 };
    assert.equal(boundedZonePlane(plane, bounds, -100).at_mm, range[0]);
    assert.equal(boundedZonePlane(plane, bounds, 100).at_mm, range[1]);
    assert.equal(boundedZonePlane(plane, bounds, NaN).at_mm, (range[0] + range[1]) / 2);
  }
});

test("plane uniforms encode both sides of all three model axes without modifying the source material", () => {
  for (const [axis, vector] of [["x", [1, 0, 0]], ["y", [0, 1, 0]], ["z", [0, 0, 1]]]) for (const side of ["above", "below"]) {
    const sign = side === "above" ? 1 : -1;
    const zones = [{ colorHex: "#FF0000", metalness: 0, roughness: 0.4, plane: { axis, side, at_mm: 1.5 } }];
    const source = colourMaterial("#00FF00", zones);
    const owned = materialWithColour(source, "#123456", false);
    const shader = { vertexShader: ShaderLib.physical.vertexShader, fragmentShader: ShaderLib.physical.fragmentShader, uniforms: {} };
    owned.onBeforeCompile(shader, {});
    assert.deepEqual(shader.uniforms.zonePlane.value[0].toArray(), [...vector.map(v => v ? v * sign : 0), -1.5 * sign]);
    assert.equal(owned.userData.shaderPatch.zones[0].colorHex, "#FF0000");
    assert.equal(source.color.getHexString(), "00ff00");
    const gradient = materialWithGradient(owned, { colour: { from: "#000000", to: "#FFFFFF", angle: 0, midpoint: 0.5 }, bounds: [-10, -4, 10, 8] });
    assert.equal(gradient.userData.shaderPatch.zones[0].colorHex, "#FF0000");
    gradient.dispose(); owned.dispose(); source.dispose();
  }
});
