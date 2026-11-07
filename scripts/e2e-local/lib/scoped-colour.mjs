import assert from "node:assert/strict";

async function poll(check, message) {
  const until = Date.now() + 25000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

/** An imported OBJ/MTL starts and ends with its original colours and no test layers. */
export async function verifyScopedColour({ page, reapplyMtl, screenshotPath }) {
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const colours = async () => (await parts()).map(part => part.renderedMaterials.map(material => material.colour));
  const original = await colours();
  assert.ok(original.length >= 2);
  const geometry = (await parts()).map(part => [part.name, part.faces]);
  const size = await viewport.getAttribute("data-model-size-mm");
  const setHex = async hex => {
    await page.getByTestId("model-colour-hex").fill(hex);
    await page.getByTestId("model-colour-hex").press("Tab");
  };
  const clearSelection = async () => {
    await viewport.locator("canvas").dblclick({ position: { x: 5, y: 5 } });
    assert.equal(await page.getByTestId("model-colour-control").getAttribute("data-scope"), "all");
  };
  const toggle = page.getByTestId("parts-toggle");
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
  await page.getByTestId("part-row").nth(1).getByTestId("part-select").dblclick();
  assert.equal(await page.getByTestId("model-colour-control").getAttribute("data-scope"), "part");
  assert.equal(await page.getByTestId("model-colour-control").getAttribute("data-target-id"), "1");
  await setHex("#E84567");
  await poll(async () => (await colours())[1].every(hex => hex === "#e84567"), "selected part did not change colour");
  assert.deepEqual((await colours()).filter((_, index) => index !== 1), original.filter((_, index) => index !== 1), "shared MTL recoloured another part");
  if (screenshotPath) await page.screenshot({ path: screenshotPath });
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+z`);
  await poll(async () => JSON.stringify(await colours()) === JSON.stringify(original), "part undo did not restore MTL colours");
  await page.keyboard.press(`${modifier}+Shift+z`);
  await poll(async () => (await colours())[1][0] === "#e84567", "part redo failed");
  await page.getByTestId("part-row").nth(0).getByTestId("part-select").dblclick();
  assert.equal((await page.getByTestId("model-colour-hex").inputValue()).toLowerCase(), original[0][0], "changing selection retained the previous colour draft");
  await setHex("#167AC6");
  await poll(async () => (await colours())[0][0] === "#167ac6", "second part did not recolour");
  assert.equal((await colours())[1][0], "#e84567");
  if (reapplyMtl) {
    await reapplyMtl();
    await poll(async () => (await colours())[0][0] === "#167ac6" && (await colours())[1][0] === "#e84567", "MTL reimport lost individual colours");
  }
  await clearSelection();
  await setHex("#38A169");
  await poll(async () => (await colours()).every(part => part.every(hex => hex === "#38a169")), "no selection must recolour all parts");
  await page.getByTestId("model-colour-reset").click();
  await poll(async () => JSON.stringify(await colours()) === JSON.stringify(original), "whole-model reset did not restore authored MTL colours");

  const reliefs = async () => JSON.parse(await viewport.getAttribute("data-reliefs") || "[]");
  await page.getByTestId("add-text").click();
  await page.getByTestId("text-layer-inline-content").fill("QA");
  await setHex("#A12BCC");
  await poll(async () => (await reliefs())[0]?.colourHex === "#A12BCC", "selected text colour did not render");
  assert.deepEqual(await colours(), original, "text colour changed the underlying model");
  await page.getByTestId("add-text").click();
  await page.getByTestId("text-layer-inline-content").fill("B");
  await setHex("#DD7722");
  await poll(async () => (await reliefs()).some(layer => layer.colourHex === "#DD7722"), "second text colour did not render");
  assert.equal((await reliefs())[0].colourHex, "#A12BCC", "second text edit recoloured the first layer");
  await clearSelection();
  await setHex("#167AC6");
  await poll(async () => (await reliefs()).length === 2 && (await reliefs()).every(layer => layer.colourHex === "#167AC6"), "whole-model colour did not reach text layers");
  await page.getByTestId("model-colour-reset").click();
  await page.getByTestId("text-layer-row").nth(1).getByTestId("text-layer-delete").click();
  await page.getByTestId("text-layer-row").nth(0).getByTestId("text-layer-delete").click();

  await page.getByTestId("add-zone").click();
  await page.getByTestId("add-zone-plane").click();
    await page.getByTestId("zone-draft-reset-colour").click();
    await page.getByTestId("zone-draft-confirm").click();
  assert.equal(await page.getByTestId("model-colour-control").getAttribute("data-scope"), "zone");
  await setHex("#C62653");
  await poll(async () => JSON.parse(await viewport.getAttribute("data-zones") || "[]")[0]?.colourHex === "#C62653", "selected zone did not accept its colour");
  assert.deepEqual(await colours(), original, "zone colour replaced the model's base materials");
  await page.getByTestId("zone-delete").click();
  await poll(async () => JSON.stringify(await colours()) === JSON.stringify(original), "zone cleanup did not restore the preview");
  assert.deepEqual((await parts()).map(part => [part.name, part.faces]), geometry);
  assert.equal(await viewport.getAttribute("data-model-size-mm"), size);
  return { selectedPart: true, sharedMtlIsolated: true, sourceMtlReimport: !!reapplyMtl, textLayers: true, zone: true, noneMeansAll: true, undoRedo: true, geometryUnchanged: true };
}
