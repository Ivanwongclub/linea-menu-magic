import assert from "node:assert/strict";
import { Matrix4, Vector3 } from "three";
import sharp from "sharp";

async function poll(fn, message) {
  const end = Date.now() + 25000;
  while (Date.now() < end) { if (await fn()) return; await new Promise(r => setTimeout(r, 150)); }
  throw new Error(message);
}

/** Real pointer picking of the two triangular source parts in model-import.mjs. */
export async function verifyPartHover({ page, viewport, screenshotPath }) {
  const canvas = viewport.locator("canvas");
  const body = page.getByTestId("part-row").nth(0);
  const cap = page.getByTestId("part-row").nth(1);
  const point = async (xyz) => {
    const matrix = new Matrix4().fromArray((await canvas.getAttribute("data-view-projection")).split(",").map(Number));
    const p = new Vector3(...xyz).applyMatrix4(matrix), box = await canvas.boundingBox();
    return [box.x + (p.x + 1) * box.width / 2, box.y + (1 - p.y) * box.height / 2];
  };
  const bodyPoint = () => point([10 / 3, -10 / 3, 0]);
  const capPoint = () => point([-10 / 3, 10 / 3, 0]);
  const moveOff = () => page.mouse.move(20, 20);
  const moveBody = async () => page.mouse.move(...await bodyPoint());
  const moveCap = async () => page.mouse.move(...await capPoint());
  const bluePixels = async () => {
    const rgb = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer();
    let count = 0;
    for (let i = 0; i < rgb.length; i += 3) {
      const [r, g, b] = rgb.subarray(i, i + 3);
      if (r > 20 && r < 65 && g > r * 1.7 && g < 130 && b > 200) count++;
    }
    return count;
  };
  await moveBody();
  await poll(async () => await body.getAttribute("data-hovered") === "true", "3D hover did not identify Body");
  assert.equal(await body.getAttribute("data-selected"), "false", "Hover must not commit selection");
  await poll(async () => await bluePixels() > 25, "Hovered part did not render blue");
  await moveOff();
  await poll(async () => await body.getAttribute("data-hovered") === "false", "Pointer leave did not clear hover");
  await poll(async () => await bluePixels() === 0, "Pointer leave kept the preview outline");
  await moveCap();
  await poll(async () => await cap.getAttribute("data-hovered") === "true", "Hover did not switch to Cap");
  await page.mouse.click(...await capPoint());
  assert.equal(await cap.getAttribute("data-selected"), "false", "Single click must not select the model part");
  // A non-home camera makes an accidental double-click reset observable.
  const [x, y] = await capPoint();
  await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 35, y + 10, { steps: 6 }); await page.mouse.up();
  let lastDirection = "", settled = 0;
  await poll(async () => {
    const next = await canvas.getAttribute("data-camera-direction");
    settled = next === lastDirection ? settled + 1 : 0;
    lastDirection = next;
    return settled >= 3;
  }, "Orbit damping did not settle");
  const rotated = await canvas.getAttribute("data-camera-direction");
  await moveBody();
  await poll(async () => await body.getAttribute("data-hovered") === "true", "Rotated model hover failed");
  await page.mouse.dblclick(...await bodyPoint());
  await poll(async () => await body.getAttribute("data-selected") === "true", "Double click did not select Body");
  const after = new Vector3(...(await canvas.getAttribute("data-camera-direction")).split(",").map(Number));
  assert.ok(after.distanceTo(new Vector3(...rotated.split(",").map(Number))) < 0.01, "Double click on a part must not reset the view");
  await moveOff();
  assert.equal(await body.getAttribute("data-selected"), "true");
  await poll(async () => await bluePixels() > 25, "Selected part lost its outline after pointer leave");
  await moveCap();
  await poll(async () => await cap.getAttribute("data-hovered") === "true", "Locked selection prevented another hover preview");
  assert.equal(await body.getAttribute("data-selected"), "true", "Preview changed the locked selection");
  await page.mouse.dblclick(...await capPoint());
  await poll(async () => await cap.getAttribute("data-selected") === "true", "Double click did not switch the selection");
  assert.equal(await body.getAttribute("data-selected"), "false");
  const bounds = await canvas.boundingBox();
  const blank = [bounds.x + 8, bounds.y + 8];
  await page.mouse.click(...blank);
  assert.equal(await cap.getAttribute("data-selected"), "true", "Single click outside must retain selection");
  const beforeClear = await canvas.getAttribute("data-camera-direction");
  await page.mouse.dblclick(...blank);
  await poll(async () => await cap.getAttribute("data-selected") === "false", "Empty-canvas double click did not clear selection");
  assert.equal(await canvas.getAttribute("data-camera-direction"), beforeClear, "Clearing selection must not reset the view");
  await moveOff();
  await poll(async () => await bluePixels() === 0, "Clearing selection left a blue outline");
  await page.mouse.dblclick(...await capPoint());
  await poll(async () => await cap.getAttribute("data-selected") === "true", "Part could not be selected after clearing");
  await moveOff();
  await body.getByTestId("part-select").hover();
  await poll(async () => await body.getAttribute("data-hovered") === "true", "Parts-list hover did not preview its model part");
  assert.equal(await cap.getAttribute("data-selected"), "true");
  if (screenshotPath) await page.screenshot({ path: screenshotPath });
  await body.getByTestId("part-select").dblclick();
  assert.equal(await body.getAttribute("data-selected"), "true", "Double click in the parts list must select that part");
  await body.getByTestId("part-visibility").click();
  await moveOff(); await moveBody();
  assert.equal(await body.getAttribute("data-hovered"), "false", "Hidden geometry must not capture hover");
  await page.mouse.dblclick(...await bodyPoint());
  await poll(async () => await body.getAttribute("data-selected") === "false", "Hidden geometry blocked outside-selection clearing");
  await moveOff(); await body.getByTestId("part-visibility").click();
  await moveOff();
  await page.getByTestId("view-reset").click();
  await moveOff();
  return { hover: true, leaveClearsPreview: true, singleClickDoesNotSelect: true, doubleClickSelects: true, doubleClickOutsideClearsSelection: true, outsideSingleClickKeepsSelection: true, doubleClickPreservesCamera: true, hoverKeepsLockedSelection: true, partsListHover: true, partsListDoubleClick: true, hiddenPartsNotPickable: true };
}
