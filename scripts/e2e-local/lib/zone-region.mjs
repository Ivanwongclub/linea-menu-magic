import assert from "node:assert/strict";
import { Matrix4, Vector3 } from "three";
import sharp from "sharp";

async function poll(check, message) {
  const until = Date.now() + 20000;
  while (Date.now() < until) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(message);
}

/** UI-only setup, model drags and GPU pixels on deliberately coarse triangles. */
export async function verifyRegionEditing({ page, restore, screenshotPath }) {
  const viewport = page.getByTestId("editor-viewport"), canvas = viewport.locator("canvas");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const zones = async () => JSON.parse(await viewport.getAttribute("data-zones") || "[]");
  const preview = async () => JSON.parse(await canvas.getAttribute("data-zone-preview") || "null");
  const original = (await parts()).map(part => [part.name, part.faces]);
  const obj = "mtllib region.mtl\nv -10 -10 -2\nv 10 -10 -2\nv 10 10 -2\nv -10 10 -2\nv -10 -10 2\nv 10 -10 2\nv 10 10 2\nv -10 10 2\no Box\nusemtl White\nf 5 6 7 8\nf 1 4 3 2\nf 1 2 6 5\nf 4 8 7 3\nf 1 5 8 4\nf 2 3 7 6\n";
  const file = (name, text) => ({ name, mimeType: "text/plain", buffer: Buffer.from(text) });
  const projected = async (x, y, z = 2) => {
    const matrix = new Matrix4().fromArray((await canvas.getAttribute("data-view-projection")).split(",").map(Number));
    const point = new Vector3(x, y, z).applyMatrix4(matrix), rect = await canvas.boundingBox();
    return { x: rect.x + (point.x + 1) * rect.width / 2, y: rect.y + (1 - point.y) * rect.height / 2 };
  };
  const sample = async x => {
    const point = await projected(x, 0), rect = await canvas.boundingBox();
    const { data, info } = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const cx = Math.round((point.x - rect.x) / rect.width * info.width), cy = Math.round((point.y - rect.y) / rect.height * info.height);
    const rgb = [0, 0, 0];
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) for (let channel = 0; channel < 3; channel++) rgb[channel] += data[(y * info.width + x) * info.channels + channel] / 25;
    return rgb;
  };
  try {
    await page.getByTestId("view-open-model-input").setInputFiles([file("region.obj", obj), file("region.mtl", "newmtl White\nKd 1 1 1\nNs 20\n")]);
    await poll(async () => (await parts()).length === 1 && (await parts())[0].name === "Box", "region fixture did not load");
    const geometry = (await parts()).map(part => [part.name, part.faces, part.materials]);
    await page.getByTestId("add-zone").click();
    await poll(async () => !!await preview(), "new region has no on-model preview");
    assert.equal((await zones()).length, 0, "unconfirmed setup entered the recipe");
    for (const axis of ["x", "y", "z"]) {
      await page.getByTestId(`zone-region-axis-${axis}`).click();
      const handle = page.getByTestId("zone-plane-handle");
      await poll(async () => await handle.getAttribute("data-axis") === axis, `missing ${axis} handle`);
      const before = (await preview()).plane.at_mm;
      const rect = await handle.boundingBox(), dx = Number(await handle.getAttribute("data-axis-dx")), dy = Number(await handle.getAttribute("data-axis-dy"));
      const length = Math.hypot(dx, dy);
      assert.ok(length > 0 && rect);
      await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height / 2); await page.mouse.down();
      await page.mouse.move(rect.x + rect.width / 2 + dx / length * 25, rect.y + rect.height / 2 + dy / length * 25, { steps: 10 }); await page.mouse.up();
      await poll(async () => Math.abs((await preview()).plane.at_mm - before) > 0.05, `${axis} model handle did not change the region`);
    }
    await page.getByTestId("zone-region-axis-x").click();
    await page.getByTestId("zone-region-pick").click();
    const hit = await projected(3, 0); await page.mouse.click(hit.x, hit.y);
    await poll(async () => Math.abs((await preview()).plane.at_mm - 3) < 0.15, "surface click did not position the X split");
    if (screenshotPath) await page.screenshot({ path: screenshotPath });
    await page.getByTestId("zone-draft-cancel").click();
    assert.equal((await zones()).length, 0);
    assert.equal(await preview(), null);
    for (const method of ["groups", "paint"]) {
      await page.getByTestId("add-zone").click();
      await page.getByTestId(`add-zone-${method}`).click();
      assert.equal(await page.getByTestId("zone-draft-confirm").isEnabled(), false, "empty manual region should require surface selection");
      const hit = await projected(0, 0); await page.mouse.move(hit.x, hit.y); await page.mouse.down(); await page.mouse.up();
      await poll(async () => (await preview())?.faces > 0, `${method} surface selection did not highlight`);
      assert.equal(await page.getByTestId("zone-draft-confirm").isEnabled(), true);
      await page.getByTestId("zone-draft-cancel").click();
    }
    if (await page.getByTestId("parts-toggle").getAttribute("aria-expanded") !== "true") await page.getByTestId("parts-toggle").click();
    await page.getByTestId("part-select").click();
    await page.getByTestId("model-colour-hex").fill("#00FF00"); await page.getByTestId("model-colour-hex").press("Tab");
    await page.getByTestId("selection-appearance-close").click();
    await page.getByTestId("add-zone").click(); await page.getByTestId("zone-region-axis-x").click();
    await page.getByTestId("zone-draft-hex").fill("#FF0000"); await page.getByTestId("zone-draft-hex").press("Tab");
    await page.getByTestId("zone-draft-confirm").click();
    await poll(async () => (await zones()).length === 1, "confirmed region was not saved");
    const left = await sample(-5), right = await sample(5);
    assert.ok(left[1] > left[0] * 1.5 && right[0] > right[1] * 1.5, `region must cut a single triangle precisely and override an earlier part colour: ${JSON.stringify({ left, right })}`);
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+z`);
    await poll(async () => (await zones()).length === 0, "one undo did not remove the complete region setup");
    await page.keyboard.press(`${modifier}+Shift+z`);
    await poll(async () => (await zones())[0]?.plane?.axis === "x", "redo lost the plane definition");
    assert.deepEqual((await parts()).map(part => [part.name, part.faces, part.materials]), geometry);
    return { axisHandles: ["x", "y", "z"], surfacePick: true, partsPick: true, brushPick: true, previewBeforeConfirm: true, cancelNoRecipeChange: true, coarseTrianglePixels: { left, right }, priorPartColour: true, undoRedo: true, sourceUnchanged: true };
  } finally {
    await restore();
    await poll(async () => JSON.stringify((await parts()).map(part => [part.name, part.faces])) === JSON.stringify(original), "source did not restore after region fixture");
  }
}
