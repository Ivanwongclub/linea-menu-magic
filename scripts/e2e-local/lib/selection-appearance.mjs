import assert from "node:assert/strict";

async function poll(check, message) {
  const until = Date.now() + 25000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

/** Starts/ends with an imported model's original MTL and no test layers/zones. */
export async function verifySelectionAppearance({ page, screenshotPath }) {
  const viewport = page.getByTestId("editor-viewport");
  const popup = page.getByTestId("selection-appearance-panel");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const zones = async () => JSON.parse(await viewport.getAttribute("data-zones") || "[]");
  const reliefs = async () => JSON.parse(await viewport.getAttribute("data-reliefs") || "[]");
  const original = await parts();
  const geometry = original.map(part => [part.name, part.faces]);
  const size = await viewport.getAttribute("data-model-size-mm");
  assert.equal(await popup.count(), 0);
  const toggle = page.getByTestId("parts-toggle");
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
  await page.getByTestId("part-row").nth(1).getByTestId("part-select").hover();
  assert.equal(await popup.count(), 0, "hover must not open the selection editor");
  await page.getByTestId("part-row").nth(1).getByTestId("part-select").dblclick();
  assert.equal(await page.getByTestId("part-row").nth(1).getAttribute("data-visible"), "true", "double click must not change visibility when the popup opens");
  assert.equal(await popup.getAttribute("data-target-id"), String(original[1].index));
  assert.equal(await page.getByTestId("model-colour-picker").count(), 1, "only one active colour editor");
  await page.getByTestId("model-colour-hex").fill("#E84567");
  await page.getByTestId("model-colour-hex").press("Tab");
  const pickMaterial = async () => {
    await popup.getByTestId("selection-material-change").click();
    await page.getByTestId("selection-material-picker").getByTestId("finish-swatch").first().click();
    await page.getByTestId("selection-material-picker").waitFor({ state: "detached" });
    const id = await popup.getByTestId("selection-material-control").getAttribute("data-finish-id");
    assert.ok(id);
    return id;
  };
  const finishId = await pickMaterial();
  await poll(async () => (await zones()).some(zone => zone.finishId === finishId && zone.faces === original[1].faces), "part material was not masked to the selected part");
  assert.equal(await popup.getAttribute("data-kind"), "part", "material editing must keep the source part selected");
  assert.equal((await page.getByTestId("model-colour-hex").inputValue()).toUpperCase(), "#E84567", "material change lost the independent colour");
  assert.deepEqual((await parts()).filter((_, index) => index !== 1).map(part => part.renderedMaterials), original.filter((_, index) => index !== 1).map(part => part.renderedMaterials), "shared MTL was changed on another part");
  if (screenshotPath) {
    await page.mouse.move(10, 10);
    await page.screenshot({ path: screenshotPath });
  }
  await popup.getByTestId("selection-material-reset").click();
  await poll(async () => (await zones()).length === 0, "restore part material left its face mask behind");
  assert.equal((await page.getByTestId("model-colour-hex").inputValue()).toUpperCase(), "#E84567", "material restore must keep the independent colour");
  await popup.getByTestId("model-colour-reset").click();
  await page.getByTestId("part-row").nth(0).getByTestId("part-select").dblclick();
  assert.equal(await popup.getByTestId("selection-appearance-name").innerText(), original[0].name);
  assert.equal((await page.getByTestId("model-colour-hex").inputValue()).toLowerCase(), original[0].renderedMaterials[0].colour);
  await popup.getByTestId("selection-appearance-close").click();
  assert.equal(await popup.count(), 0);
  assert.equal(await page.getByTestId("model-colour-control").getAttribute("data-scope"), "all");
  assert.equal(await page.locator('[data-testid="part-row"][data-selected="true"]').count(), 0);

  await page.getByTestId("add-text").click();
  const input = page.getByTestId("text-layer-inline-content");
  assert.equal(await input.evaluate(el => el === document.activeElement), true, "opening the popup stole text input focus");
  await input.fill("QA");
  assert.equal(await popup.getAttribute("data-kind"), "layer");
  const layerFinish = await pickMaterial();
  await poll(async () => (await reliefs())[0]?.appearance.finish_id === layerFinish, "text material was not applied");
  await page.getByTestId("model-colour-hex").fill("#38A169");
  await page.getByTestId("model-colour-hex").press("Tab");
  await poll(async () => (await reliefs())[0]?.colourHex === "#38A169", "popup text colour did not render");
  await popup.getByTestId("selection-material-reset").click();
  await poll(async () => !(await reliefs())[0]?.appearance.finish_id && (await reliefs())[0]?.colourHex === "#38A169", "text material reset lost colour or retained finish");
  await page.getByTestId("text-layer-delete").click();
  assert.equal(await popup.count(), 0, "deleting the selected layer must close its popup");

  await page.getByTestId("add-zone").click();
  await page.getByTestId("add-zone-plane").click();
    await page.getByTestId("zone-draft-reset-colour").click();
    await page.getByTestId("zone-draft-confirm").click();
  assert.equal(await popup.getAttribute("data-kind"), "zone");
  const zoneFinish = await pickMaterial();
  await poll(async () => (await zones())[0]?.finishId === zoneFinish && (await zones())[0]?.faces > 0, "zone popup did not apply its material");
  await page.getByTestId("zone-delete").click();
  assert.equal(await popup.count(), 0);
  assert.deepEqual((await parts()).map(part => [part.name, part.faces]), geometry);
  assert.equal(await viewport.getAttribute("data-model-size-mm"), size);
  assert.deepEqual((await parts()).map(part => part.renderedMaterials), original.map(part => part.renderedMaterials), "cleanup must restore authored MTL materials");
  return { hoverDoesNotSelect: true, partMaterialMask: true, materialKeepsColour: true, sourceMtlUnchanged: true, switchingParts: true, closeDeselects: true, textFocus: true, textMaterial: true, zoneMaterial: true, geometryUnchanged: true };
}
