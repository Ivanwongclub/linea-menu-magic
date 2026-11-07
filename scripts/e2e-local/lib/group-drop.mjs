import assert from "node:assert/strict";

async function poll(check, message) {
  const until = Date.now() + 20000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function drag({ page, source, target, hover, cancel = false, screenshotPath }) {
  await target.scrollIntoViewIfNeeded();
  await source.scrollIntoViewIfNeeded();
  const a = await source.boundingBox(), b = await target.boundingBox();
  assert.ok(a && b);
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 10, a.y + a.height / 2, { steps: 5 });
  await page.getByTestId("layer-drag-overlay").waitFor();
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 16 });
  if (hover) await poll(async () => await hover.getAttribute("data-drop-over") === "true", "drop target did not highlight");
  if (screenshotPath) await page.screenshot({ path: screenshotPath });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  if (cancel) await page.keyboard.press("Escape");
  await page.mouse.up();
  await page.getByTestId("layer-drag-overlay").waitFor({ state: "detached" });
}

/** Use the current three-part model, or a tiny disposable fixture with restore. */
export async function verifyGroupDrop({ page, screenshotPath, restore }) {
  if (!restore) return verifyLoadedGroupDrop({ page, screenshotPath });
  const viewport = page.getByTestId("editor-viewport");
  const signature = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]").map(part => [part.name, part.faces]);
  const before = await signature();
  const obj = "mtllib drop.mtl\nv -10 -4 0\nv -4 -4 0\nv -7 4 0\nv -3 -4 0\nv 3 -4 0\nv 0 4 0\nv 4 -4 0\nv 10 -4 0\nv 7 4 0\no Left\nusemtl Silver\nf 1 2 3\no Centre\nusemtl Silver\nf 4 5 6\no Right\nusemtl Silver\nf 7 8 9\n";
  const file = (name, text) => ({ name, mimeType: "text/plain", buffer: Buffer.from(text) });
  try {
    await page.getByTestId("view-open-model-input").setInputFiles([file("drop.obj", obj), file("drop.mtl", "newmtl Silver\nKd 0.8 0.8 0.8\nNs 30\n")]);
    await poll(async () => JSON.stringify(await signature()) === JSON.stringify([["Left", 1], ["Centre", 1], ["Right", 1]]), "drag fixture did not load");
    return await verifyLoadedGroupDrop({ page, screenshotPath });
  } finally {
    await restore();
    await poll(async () => JSON.stringify(await signature()) === JSON.stringify(before), "original imported model did not restore after the drag fixture");
  }
}

async function verifyLoadedGroupDrop({ page, screenshotPath }) {
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const reliefs = async () => JSON.parse(await viewport.getAttribute("data-reliefs") || "[]");
  const before = await parts();
  assert.ok(before.length >= 3);
  const popup = page.getByTestId("selection-appearance-panel");
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  const rootParts = page.getByTestId("parts-group");
  if (await page.getByTestId("parts-toggle").getAttribute("aria-expanded") !== "true") await page.getByTestId("parts-toggle").click();
  await page.getByTestId("add-paint-group").click();
  await page.getByTestId("paint-group-name").fill("GP 1");
  for (const id of ["0", "1"]) await page.locator(`[data-testid="paint-group-member"][data-kind="part"][data-member-id="${id}"]`).check();
  await page.getByTestId("save-paint-group").click();
  const g1 = page.getByTestId("paint-group-row").first();
  const g1id = await g1.getAttribute("data-group-id");
  await page.getByTestId("colour-mode-gradient").click();
  for (const [stop, hex] of [["from", "#F04A7B"], ["to", "#246BFD"]]) {
    await page.getByTestId(`gradient-stop-${stop}`).click();
    await page.getByTestId("gradient-stop-hex").fill(hex);
    await page.getByTestId("gradient-stop-hex").press("Tab");
  }
  await rootParts.locator('[data-testid="part-row"][data-index="2"]').getByTestId("part-select").click();
  await page.getByTestId("model-colour-hex").fill("#00FF00");
  await page.getByTestId("model-colour-hex").press("Tab");
  await popup.getByTestId("selection-appearance-close").click();
  await g1.getByTestId("paint-group-toggle").click();
  await drag({ page, source: rootParts.locator('[data-testid="part-row"][data-index="2"]').getByTestId("part-select"), target: g1.getByTestId("paint-group-select"), hover: g1, screenshotPath });
  await poll(async () => await g1.getByTestId("part-row").count() === 3 && (await parts())[2].renderedMaterials[0].gradient?.to === "#246BFD", "part name drag did not join the GP and take its gradient");
  assert.equal(await rootParts.getByTestId("part-row").count(), 0);
  assert.equal(await page.getByTestId("part-row").count(), 3);
  assert.equal(await popup.getAttribute("data-target-id"), g1id);
  await page.keyboard.press(`${modifier}+z`);
  await poll(async () => await rootParts.getByTestId("part-row").count() === 1 && (await parts())[2].renderedMaterials[0].colour === "#00ff00", "one undo did not restore membership and the overridden colour");
  await page.keyboard.press(`${modifier}+Shift+z`);
  await poll(async () => await g1.getByTestId("part-row").count() === 3, "redo failed to reapply the drop");

  const ids = [];
  for (const text of ["A", "B"]) {
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-inline-content").fill(text);
    await page.getByTestId("text-layer-inline-content").press("Tab");
    ids.push(await page.locator('[data-testid="text-layer-row"][data-selected="true"]').getAttribute("data-layer-id"));
  }
  await page.getByTestId("add-paint-group").click();
  await page.getByTestId("paint-group-name").fill("GP 2");
  await page.locator(`[data-testid="paint-group-member"][data-kind="layer"][data-member-id="${ids[0]}"]`).check();
  await page.getByTestId("save-paint-group").click();
  const g2id = await popup.getAttribute("data-target-id");
  const g2 = page.locator(`[data-testid="paint-group-row"][data-group-id="${g2id}"]`);
  await page.getByTestId("model-colour-hex").fill("#38A169");
  await page.getByTestId("model-colour-hex").press("Tab");
  await g2.getByTestId("paint-group-toggle").click();
  await drag({ page, source: g1.locator('[data-testid="part-row"][data-index="2"]').getByTestId("part-drag-handle"), target: g2.getByTestId("paint-group-select"), hover: g2 });
  await poll(async () => await g2.getByTestId("part-row").count() === 1 && (await parts())[2].renderedMaterials[0].colour === "#38a169", "part handle drag did not move between GPs");
  assert.equal(await g1.getByTestId("part-row").count(), 2);
  await g1.getByTestId("paint-group-toggle").click();
  await drag({ page, source: g2.locator(`[data-testid="text-layer-row"][data-layer-id="${ids[0]}"]`).getByTestId("text-layer-handle"), target: g1.getByTestId("paint-group-select"), hover: g1 });
  await poll(async () => await g1.getByTestId("text-layer-row").count() === 1 && (await reliefs()).find(layer => layer.layerId === ids[0])?.gradient?.to === "#246BFD", "text drag did not enter the GP gradient");
  assert.equal(await g2.getByTestId("text-layer-row").count(), 1);
  const rootPartDrop = page.getByTestId("ungrouped-drop-part");
  await drag({ page, source: g2.getByTestId("part-drag-handle"), target: rootPartDrop, hover: rootPartDrop });
  await poll(async () => await rootParts.getByTestId("part-row").count() === 1, "part did not drag back to ungrouped");
  assert.deepEqual((await parts())[2].renderedMaterials, before[2].renderedMaterials);
  const rootLayerDrop = page.getByTestId("ungrouped-drop-layer");
  await drag({ page, source: g1.getByTestId("text-layer-handle"), target: rootLayerDrop, hover: rootLayerDrop });
  await poll(async () => await page.getByTestId("branding-group").getByTestId("text-layer-row").count() === 1, "text did not drag back to ungrouped");
  assert.equal(await page.getByTestId("text-layer-row").count(), 2);
  await drag({ page, source: rootParts.getByTestId("part-drag-handle"), target: g1.getByTestId("paint-group-select"), hover: g1, cancel: true });
  assert.equal(await rootParts.getByTestId("part-row").count(), 1, "Escape committed the cancelled drop");
  await drag({ page, source: rootParts.getByTestId("part-drag-handle"), target: rootLayerDrop });
  assert.equal(await rootParts.getByTestId("part-row").count(), 1, "wrong-kind root accepted a part");
  while (await page.getByTestId("paint-group-row").count()) {
    await page.getByTestId("paint-group-select").first().click();
    await popup.getByTestId("dissolve-paint-group").click();
  }
  for (let index = 0; index < 2; index++) await page.getByTestId("text-layer-delete").first().click();
  assert.deepEqual((await parts()).map(part => [part.name, part.faces, part.materials, part.renderedMaterials]), before.map(part => [part.name, part.faces, part.materials, part.renderedMaterials]));
  return { partNameDrag: true, partHandleDrag: true, collapsedFolder: true, betweenGroups: true, layerDrag: true, dragBackToRoot: true, gradientInheritance: true, undoRedo: true, escapeCancels: true, wrongRootRejected: true, sourceMtlUnchanged: true };
}
