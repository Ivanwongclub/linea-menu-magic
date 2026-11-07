import assert from "node:assert/strict";

async function poll(check, message) {
  const until = Date.now() + 20000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

/** Folder contents are real editable rows, with one location per layer. */
export async function verifyGroupTree({ page }) {
  const original = await page.getByTestId("editor-viewport").getAttribute("data-parts");
  const root = page.getByTestId("branding-group");
  const ids = {};
  for (const name of ["A", "B", "C"]) {
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-inline-content").fill(name);
    await page.getByTestId("text-layer-inline-content").press("Tab");
    ids[name] = await page.locator('[data-testid="text-layer-row"][data-selected="true"]').getAttribute("data-layer-id");
  }
  await page.getByTestId("add-paint-group").click();
  await page.getByTestId("paint-group-name").fill("Folder GP");
  // C is preselected by the creation dialog. Add A and leave B outside.
  await page.locator(`[data-testid="paint-group-member"][data-kind="layer"][data-member-id="${ids.A}"]`).check();
  await page.getByTestId("save-paint-group").click();
  const folder = page.getByTestId("paint-group-row");
  const childIds = async () => folder.getByTestId("text-layer-row").evaluateAll(rows => rows.map(row => row.dataset.layerId));
  assert.deepEqual(await childIds(), [ids.A, ids.C]);
  assert.equal(await root.getByTestId("text-layer-row").count(), 1);
  assert.equal(await root.getByTestId("text-layer-row").getAttribute("data-layer-id"), ids.B);
  assert.equal(await page.getByTestId("text-layer-row").count(), 3, "folder view must not duplicate the actual rows");
  await folder.getByTestId("paint-group-toggle").click();
  assert.equal(await folder.getByTestId("text-layer-row").count(), 0);
  assert.equal(await root.getByTestId("text-layer-row").count(), 1);
  await folder.getByTestId("paint-group-toggle").click();
  await folder.locator(`[data-testid="text-layer-row"][data-layer-id="${ids.A}"]`).getByTestId("text-layer-select").click();
  await page.getByTestId("text-layer-inline-content").fill("A EDIT");
  await page.getByTestId("text-layer-inline-content").press("Tab");
  assert.match(await folder.innerText(), /A EDIT/);
  assert.equal(await page.getByTestId("selection-appearance-panel").getAttribute("data-kind"), "layer");

  const handle = folder.locator(`[data-testid="text-layer-row"][data-layer-id="${ids.C}"]`).getByTestId("text-layer-handle");
  await handle.scrollIntoViewIfNeeded();
  const start = await handle.boundingBox();
  const destination = await folder.locator(`[data-testid="text-layer-row"][data-layer-id="${ids.A}"]`).getByTestId("text-layer-handle").boundingBox();
  assert.ok(start && destination);
  await page.mouse.move(start.x + start.width / 2, start.y + start.height / 2);
  await page.mouse.down();
  await page.mouse.move(start.x + start.width / 2 + 8, start.y + start.height / 2, { steps: 4 });
  await poll(async () => await handle.getAttribute("aria-pressed") === "true", "pointer sorting did not activate");
  await page.mouse.move(destination.x + destination.width / 2, destination.y + destination.height / 2, { steps: 10 });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await page.mouse.up();
  await poll(async () => JSON.stringify(await childIds()) === JSON.stringify([ids.C, ids.A]), "reordering GP children used subset indices and moved the wrong layer");
  assert.equal(await root.getByTestId("text-layer-row").getAttribute("data-layer-id"), ids.B);
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+z`);
  await poll(async () => JSON.stringify(await childIds()) === JSON.stringify([ids.A, ids.C]), "undo failed to restore child ordering");

  await folder.getByTestId("paint-group-select").click();
  await page.getByTestId("selection-appearance-panel").getByTestId("edit-paint-group").click();
  await page.locator(`[data-testid="paint-group-member"][data-kind="layer"][data-member-id="${ids.A}"]`).uncheck();
  await page.getByTestId("save-paint-group").click();
  assert.deepEqual(await childIds(), [ids.C]);
  assert.equal(await root.getByTestId("text-layer-row").count(), 2, "moving out must return the actual row to the root");
  assert.equal(await page.getByTestId("text-layer-row").count(), 3);
  await page.getByTestId("selection-appearance-panel").getByTestId("dissolve-paint-group").click();
  assert.equal(await root.getByTestId("text-layer-row").count(), 3);
  await page.keyboard.press(`${modifier}+z`);
  await folder.waitFor();
  assert.deepEqual(await childIds(), [ids.C]);
  await page.keyboard.press(`${modifier}+Shift+z`);
  await folder.waitFor({ state: "detached" });
  for (let index = 0; index < 3; index++) await page.getByTestId("text-layer-delete").first().click();
  assert.equal(await page.getByTestId("text-layer-row").count(), 0);
  assert.equal(await page.getByTestId("editor-viewport").getAttribute("data-parts"), original, "tree operations must not change source geometry or MTLs");
  return { nestedRows: true, collapse: true, noDuplicateRows: true, editChildText: true, reorderChildWithRootLayer: true, moveOut: true, ungroup: true, undoRedo: true };
}
