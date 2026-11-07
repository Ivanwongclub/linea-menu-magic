import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { handleUndoShortcut } from "../../../src/features/editor/hooks/useUndoShortcuts.ts";
import { useEditorStore } from "../../../src/features/editor/store/useEditorStore.ts";
import { emptyRecipe, newTextLayer } from "../../../src/features/editor/lib/recipe.ts";

const state = () => useEditorStore.getState();
const event = (patch = {}) => ({ key: "z", metaKey: true, ctrlKey: false, altKey: false, shiftKey: false, isComposing: false, keyCode: 90, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...patch });

beforeEach(() => {
  state().initialize(emptyRecipe(), "text-input-test");
  state().addLayer(newTextLayer("text", 20, ""));
  state().updateLayer("text", { content: { value: "WINCYC" } });
});

test("undo and redo keep the layer's text field focused so typing can continue", () => {
  let blurred = false;
  const input = { tagName: "INPUT", hasAttribute: name => name === "data-layer-text-input", blur() { blurred = true; } };
  const undo = event();
  handleUndoShortcut(undo, input);
  assert.equal(undo.defaultPrevented, true);
  assert.equal(state().recipe.layers[0].content.value, "");
  assert.equal(blurred, false);
  handleUndoShortcut(event({ shiftKey: true }), input);
  assert.equal(state().recipe.layers[0].content.value, "WINCYC");
  assert.equal(blurred, false);
  state().updateLayer("text", { content: { value: "WINCYC!" } });
  assert.equal(state().recipe.layers[0].content.value, "WINCYC!");
});

test("IME undo and the browser's 229 composition key never reach document history", () => {
  const before = state().recipe;
  for (const patch of [{ isComposing: true }, { keyCode: 229 }, { defaultPrevented: true }]) {
    const key = event(patch);
    handleUndoShortcut(key, null);
    assert.equal(state().recipe, before);
    assert.equal(key.defaultPrevented, patch.defaultPrevented ?? false);
  }
});

test("numeric drafts retain their existing blur-and-commit behavior", () => {
  let blurred = false;
  const input = { tagName: "INPUT", hasAttribute: () => false, blur() { blurred = true; state().commit(); } };
  handleUndoShortcut(event(), input);
  assert.equal(blurred, true);
  assert.equal(state().recipe.layers[0].content.value, "");
});
