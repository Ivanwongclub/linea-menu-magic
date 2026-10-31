// Drive the real Zustand store: importing a temporary OBJ/STL must never
// borrow another model's face indices or overwrite the catalogue draft.
// Run: node --experimental-strip-types --test scripts/e2e-local/unit/local-model-store.test.mjs
import { afterEach, beforeEach, mock, test } from "node:test";
import assert from "node:assert/strict";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";
import { emptyRecipe, newTextLayer, newZone, normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";

const state = () => useEditorStore.getState();
const logo = (name) => ({ filename: `${name}.svg`, mimeType: "image/svg+xml", svg: `<svg id="${name}"/>` });
const frame = { productKey: "catalogue.obj", transform: { quaternion: [0, 0, 0, 1], scale: 1, offset: [1, 2, 3] }, markedGlyphCentres: [[1, 2]] };
const report = { groups: [{ index: 0, name: "Body", faces: 2, visible: true }], bounds: { minX: 0, maxX: 10, minY: 0, maxY: 10, minZ: 0, maxZ: 1 }, zoneFaces: [1], overlaps: [], totalFaces: 2 };
let revoked;

test('appearance choice survives stored-recipe normalization', () => {
  for (const mode of ['source', 'finish', 'colour']) {
    const recipe = emptyRecipe();
    recipe.view.model_appearance_mode = mode;
    assert.equal(normalizeRecipe(recipe).view.model_appearance_mode, mode);
  }
});

test('source appearance can be overridden and undone, and companion URLs are released with the model', () => {
  state().setLocalModel({url:'blob:source-obj',name:'source.obj',materialText:'newmtl Red\nKd 1 0 0',resourceUrls:['blob:source-texture'],hasSourceAppearance:true});
  assert.equal(state().localModel.appearanceMode,'source');
  state().setLocalAppearanceMode('colour');
  assert.equal(state().localModel.appearanceMode,'colour');
  state().undo();
  assert.equal(state().localModel.appearanceMode,'source');
  state().setLocalModel(null);
  assert.ok(revoked.includes('blob:source-obj'));
  assert.ok(revoked.includes('blob:source-texture'));
});

beforeEach(() => {
  state().initialize(emptyRecipe(), "test:empty");
  state().setPendingLogos({});
  revoked = [];
  mock.method(URL, "revokeObjectURL", (url) => revoked.push(url));
});
afterEach(() => {
  state().initialize(emptyRecipe(), "test:cleanup");
  mock.restoreAll();
});

function catalogueState() {
  const { recipe, checkpoint, past, future, selection, pendingLogos, flushSeq } = state();
  return { recipe, checkpoint, past, future, selection, pendingLogos, flushSeq };
}

function populatedCatalogue() {
  const recipe = emptyRecipe();
  recipe.size_variant_id = "catalogue-size";
  recipe.finish_id = "catalogue-finish";
  recipe.colour_id = "catalogue-colour";
  recipe.view = { ruler: true, original_lettering: true };
  recipe.layers = [newTextLayer("catalogue-brand", 20, "Original")];
  recipe.hidden_groups = [1, 5];
  recipe.zones = [{ ...newZone("catalogue-zone", "Rim", "groups"), groups: [2], faces: [50, 10] }];
  state().initialize(recipe, "design:catalogue");
  state().beginDrag();
  state().endDrag();
  state().setFinishId("catalogue-finish-2");
  state().setColourId("catalogue-colour-2");
  state().undo();
  state().updateLayer("catalogue-brand", { content: { value: "Uncommitted original" } });
  state().setPendingLogos({ "catalogue-brand": logo("catalogue") });
  state().setPaintZone("catalogue-zone");
  state().select({ kind: "layer", id: "catalogue-brand" });
  state().setModelFrame(frame);
  state().setModelSizeMm(20);
  state().setPartsReport(report);
  state().beginDrag();
  return structuredClone(catalogueState());
}

function assertModelStateReset(expectedSelection = null) {
  assert.equal(state().modelFrame, null);
  assert.equal(state().modelSizeMm, null);
  assert.equal(state().partsReport, null);
  assert.deepEqual(state().selection, expectedSelection);
  assert.equal(state().paintZoneId, null);
  assert.equal(state().dragging, false);
}

test("first import isolates layers, source-face zones, hidden parts, appearance and undo history; only ruler carries over", () => {
  const original = populatedCatalogue();
  assert.ok(original.past.length && original.future.length, "fixture has both undo and redo history");
  assert.notDeepEqual(original.recipe, original.checkpoint, "fixture also has an uncommitted edit");
  state().setLocalModel({ url: "blob:local-a", name: "MO06.obj" });

  const expected = emptyRecipe();
  expected.view.ruler = true;
  assert.deepEqual(state().recipe, expected);
  assert.deepEqual(state().past, []);
  assert.deepEqual(state().future, []);
  assert.equal(state().checkpoint, state().recipe);
  assert.deepEqual(state().pendingLogos, {});
  assert.deepEqual(state().localModel, { url: "blob:local-a", name: "MO06.obj", appearanceMode: "finish" });
  assert.deepEqual(state().localCatalogueSnapshot, original);
  assert.equal(state().hydratedFor, "design:catalogue");
  assertModelStateReset();
  assert.deepEqual(revoked, []);
});

test("clearing a local file restores the full catalogue history, live edit, selection and pending logo files", () => {
  const original = populatedCatalogue();
  state().setLocalModel({ url: "blob:local-a", name: "new-model.obj" });
  state().addLayer(newTextLayer("local-brand", 30, "Local"), logo("local"));
  state().addZone({ ...newZone("local-zone", "Local rim", "groups"), groups: [0] });
  state().setHiddenGroups([0]);
  state().setFinishId("local-gold");
  state().setColourId("local-red");
  state().setRuler(false);
  state().endDrag();
  state().setModelFrame({ ...frame, productKey: "blob:local-a" });
  state().setModelSizeMm(30);
  state().setPartsReport(report);
  state().setPaintZone("local-zone");
  state().beginDrag();
  state().setLocalModel(null);

  assert.deepEqual(catalogueState(), original, "all local edits are discarded, including local undo/redo state");
  assert.equal(state().localModel, null);
  assert.equal(state().localCatalogueSnapshot, null);
  assert.equal(state().hydratedFor, "design:catalogue");
  assertModelStateReset(original.selection);
  assert.deepEqual(revoked, ["blob:local-a"]);
});

test("a second import retains the first catalogue snapshot and starts another clean local recipe", () => {
  const original = populatedCatalogue();
  state().setLocalModel({ url: "blob:local-a", name: "first.obj" });
  const snapshot = state().localCatalogueSnapshot;
  state().setLocalAppearanceMode("colour");
  state().setColourId("local-blue");
  state().setHiddenGroups([0]);
  state().addLayer(newTextLayer("local-brand", 10, "First local"), logo("local"));
  state().setRuler(false);
  state().setPartsReport(report);
  state().setModelFrame(frame);
  state().setModelSizeMm(10);
  state().setPaintZone("local-zone");
  state().beginDrag();
  state().setLocalModel({ url: "blob:local-b", name: "second.stl" });

  assert.equal(state().localCatalogueSnapshot, snapshot, "repeated imports never snapshot the previous local file");
  assert.deepEqual(state().localCatalogueSnapshot, original);
  assert.deepEqual(state().recipe, emptyRecipe(), "only the most recent ruler setting carries over");
  assert.deepEqual(state().localModel, { url: "blob:local-b", name: "second.stl", appearanceMode: "finish" });
  assert.deepEqual(state().past, []);
  assert.deepEqual(state().future, []);
  assert.deepEqual(state().pendingLogos, {});
  assertModelStateReset();
  assert.deepEqual(revoked, ["blob:local-a"]);
  state().setLocalModel(null);
  assert.deepEqual(catalogueState(), original);
  assert.deepEqual(revoked, ["blob:local-a", "blob:local-b"]);
});

test("local finish and colour changes undo their mode and selection in one step without touching catalogue state", () => {
  const initial = state();
  state().setLocalAppearanceMode("colour");
  assert.equal(state(), initial, "changing a local-only control outside an import is a no-op");
  populatedCatalogue();
  state().setLocalModel({ url: "blob:local-a", name: "first.obj" });
  const snapshot = state().localCatalogueSnapshot;
  state().setFinishId("nickel");
  const beforeColour = state().recipe;
  const previousSteps = state().past.length;
  state().setColourId("local-red");
  assert.equal(state().localModel.appearanceMode, "colour");
  assert.equal(state().recipe.view.local_appearance_mode, "colour");
  assert.equal(state().past.length, previousSteps + 1, "colour and mode form one edit");
  state().undo();
  assert.deepEqual(state().recipe, beforeColour);
  assert.equal(state().localModel.appearanceMode, "finish");
  state().redo();
  assert.equal(state().recipe.colour_id, "local-red");
  assert.equal(state().localModel.appearanceMode, "colour");

  state().setFinishId("nickel");
  assert.equal(state().localModel.appearanceMode, "finish", "choosing the same finish still switches mode");
  state().undo();
  assert.equal(state().localModel.appearanceMode, "colour");

  state().setLocalAppearanceMode("finish");
  state().undo();
  assert.equal(state().localModel.appearanceMode, "colour", "mode buttons participate in undo");
  state().redo();
  assert.deepEqual(state().localModel, { url: "blob:local-a", name: "first.obj", appearanceMode: "finish" });
  assert.equal(state().localCatalogueSnapshot, snapshot);
  assert.equal(snapshot.recipe.view.local_appearance_mode, undefined, "local-only mode never changes the protected recipe");
  assert.deepEqual(revoked, []);
});

test("loading a local recipe synchronizes appearance mode and retains undo to the prior mode", () => {
  state().setLocalModel({ url: "blob:local-a", name: "first.obj" });
  const loaded = emptyRecipe();
  loaded.view.local_appearance_mode = "colour";
  loaded.colour_id = "local-red";
  state().loadRecipe(loaded);
  assert.equal(state().localModel.appearanceMode, "colour");
  state().undo();
  assert.equal(state().localModel.appearanceMode, "finish", "older recipes default to finish mode");
  state().redo();
  assert.equal(state().localModel.appearanceMode, "colour");
});

test("initializing another product discards the local snapshot and all geometry state without leaking local logos", () => {
  populatedCatalogue();
  state().setLocalModel({ url: "blob:local-a", name: "first.obj" });
  state().addLayer(newTextLayer("local-brand", 10, "Temporary"), logo("local"));
  state().setPartsReport(report);
  state().setModelFrame(frame);
  state().setModelSizeMm(10);
  state().setPaintZone("local-zone");
  state().beginDrag();
  const incoming = emptyRecipe();
  incoming.layers = [newTextLayer("incoming-brand", 15, "Next product")];
  // Mirrors EditorNewPage: stage the incoming draft's files before initialize.
  state().setPendingLogos({ "local-brand": logo("local"), "incoming-brand": logo("incoming") });
  state().initialize(incoming, "design:incoming");

  assert.equal(state().recipe, incoming);
  assert.equal(state().checkpoint, incoming);
  assert.deepEqual(state().past, []);
  assert.deepEqual(state().future, []);
  assert.equal(state().localModel, null);
  assert.equal(state().localCatalogueSnapshot, null);
  assert.equal(state().hydratedFor, "design:incoming");
  assert.equal(state().flushSeq, 0);
  assert.deepEqual(state().pendingLogos, { "incoming-brand": logo("incoming") });
  assertModelStateReset();
  assert.deepEqual(revoked, ["blob:local-a"]);
  state().setLocalModel(null);
  assert.equal(state().recipe, incoming, "clear can never resurrect a previous product after initialize");
  assert.deepEqual(revoked, ["blob:local-a"]);
});

test("blob URLs are revoked only when replaced, cleared or discarded by initialize", () => {
  state().setLocalModel({ url: "blob:local-a", name: "first.obj" });
  state().setLocalModel({ url: "blob:local-a", name: "same-url.obj" });
  assert.deepEqual(revoked, [], "re-importing the same URL must not invalidate the live model");
  state().setLocalModel({ url: "blob:local-b", name: "second.obj" });
  state().setLocalModel(null);
  state().setLocalModel(null);
  state().setLocalModel({ url: "blob:local-c", name: "third.obj" });
  state().initialize(emptyRecipe(), "design:next");
  assert.deepEqual(revoked, ["blob:local-a", "blob:local-b", "blob:local-c"]);
});
