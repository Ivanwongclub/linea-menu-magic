import assert from "node:assert/strict";

async function poll(check, message) {
  const until = Date.now() + 20000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

/** Starts with one freshly added blank layer and leaves that layer set to finalText. */
export async function verifyTextInput({ page, finalText = "POLO" }) {
  const inline = page.getByTestId("text-layer-inline-content");
  const properties = page.getByTestId("text-layer-content");
  const focused = () => inline.evaluate(element => element === document.activeElement);
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await poll(async () => await inline.count() === 1 && await focused(), "new text did not focus its inline input");
  await inline.pressSequentially("ABC");
  await poll(async () => await properties.inputValue() === "ABC", "inline typing did not reach Properties");
  await inline.press(`${modifier}+z`);
  await poll(async () => await inline.inputValue() === "", "undo did not restore blank text");
  assert.ok(await focused(), "undo moved focus away from text");
  await inline.press(`${modifier}+Shift+z`);
  await poll(async () => await inline.inputValue() === "ABC", "redo did not restore text");
  await inline.pressSequentially("!");
  assert.equal(await properties.inputValue(), "ABC!", "typing stopped after undo/redo");

  await inline.fill("");
  await inline.evaluate(element => {
    element.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true, data: "" }));
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, "中");
    element.dispatchEvent(new InputEvent("input", { bubbles: true, data: "中", inputType: "insertCompositionText", isComposing: true }));
  });
  assert.equal(await inline.inputValue(), "中");
  assert.equal(await properties.inputValue(), "", "unconfirmed IME text leaked into the recipe");
  const prevented = await inline.evaluate(element => {
    const key = new KeyboardEvent("keydown", { key: "z", metaKey: true, ctrlKey: true, isComposing: true, bubbles: true, cancelable: true });
    element.dispatchEvent(key);
    return key.defaultPrevented;
  });
  assert.equal(prevented, false, "document undo intercepted IME composition");
  await inline.evaluate(element => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(element, "中文");
    element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: "中文" }));
  });
  await poll(async () => await properties.inputValue() === "中文", "confirmed IME text was lost");
  assert.ok(await focused());

  await properties.fill(finalText);
  await properties.press("Tab");
  await page.getByTestId("branding-toggle").click();
  await page.getByTestId("add-text").click();
  assert.equal(await page.getByTestId("branding-toggle").getAttribute("aria-expanded"), "true");
  assert.equal(await page.getByTestId("text-layer-row").count(), 2);
  await poll(focused, "adding text to a folded section did not focus the new layer");
  await inline.pressSequentially("SECOND");
  await page.getByTestId("text-layer-row").first().getByTestId("text-layer-select").click();
  assert.equal(await inline.inputValue(), finalText, "switching layers leaked the other text value");
  assert.ok(await focused());
  await inline.pressSequentially("!");
  assert.equal(await properties.inputValue(), finalText + "!");
  await page.getByTestId("text-layer-row").nth(1).getByTestId("text-layer-delete").click();
  await page.getByTestId("text-layer-row").first().getByTestId("text-layer-select").click();
  await inline.fill(finalText);
  await inline.press("Enter");
  assert.equal(await properties.inputValue(), finalText);
  return { newLayerFocus: true, inlineEditing: true, undoRedoKeepsFocus: true, imeComposition: true, foldedSection: true, layerSwitch: true };
}
