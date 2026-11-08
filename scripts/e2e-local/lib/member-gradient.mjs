import assert from "node:assert/strict";
import { Matrix4, Vector3 } from "three";
import sharp from "sharp";

async function poll(check, message) {
  const until = Date.now() + 25000;
  while (Date.now() < until) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(message);
}

export async function verifyMemberGradient({ page, restore, reload = false, screenshotPath }) {
  if (!restore) return verifyLoaded({ page, reload, screenshotPath });
  const viewport = page.getByTestId("editor-viewport");
  const signature = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]").map(part => [part.name, part.faces]);
  const before = await signature();
  let obj = "mtllib members.mtl\n";
  for (let part = 0; part < 4; part++) {
    const x = -15 + part * 8, vertex = part * 4 + 1;
    obj += `v ${x} -3 0\nv ${x + 6} -3 0\nv ${x + 6} 3 0\nv ${x} 3 0\no Panel${part + 1}\nusemtl White\nf ${vertex} ${vertex + 1} ${vertex + 2}\nf ${vertex} ${vertex + 2} ${vertex + 3}\n`;
  }
  const file = (name, text) => ({ name, mimeType: "text/plain", buffer: Buffer.from(text) });
  try {
    await page.getByTestId("view-open-model-input").setInputFiles([file("members.obj", obj), file("members.mtl", "newmtl White\nKd 1 1 1\nNs 0\n")]);
    await poll(async () => (await signature()).length === 4, "member gradient fixture did not load");
    return await verifyLoaded({ page, pixels: true, screenshotPath });
  } finally {
    await restore();
    await poll(async () => JSON.stringify(await signature()) === JSON.stringify(before), "source did not restore after the member palette fixture");
  }
}

async function verifyLoaded({ page, reload, screenshotPath, pixels = false }) {
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const reliefs = async () => JSON.parse(await viewport.getAttribute("data-reliefs") || "[]");
  const original = await parts();
  assert.ok(original.length >= 3);
  const setStop = async (stop, hex) => { await page.getByTestId(`gradient-stop-${stop}`).click(); await page.getByTestId("gradient-stop-hex").fill(hex); await page.getByTestId("gradient-stop-hex").press("Tab"); };
  const expected = ["#00ff00", "#80ff80", "#ffffff"];
  const solid = async colours => (await parts()).slice(0, colours.length).every((part, index) => part.renderedMaterials.every(material => material.colour === colours[index] && !material.gradient));
  const palette = async () => page.getByTestId("gradient-member-colour").evaluateAll(rows => rows.map(row => row.dataset.hex.toLowerCase()));
  await page.getByTestId("add-paint-group").click();
  await page.getByTestId("paint-group-name").fill("GP · Green → White");
  for (const index of [0, 1, 2]) await page.locator(`[data-testid="paint-group-member"][data-kind="part"][data-member-id="${index}"]`).check();
  await page.getByTestId("save-paint-group").click();
  await page.getByTestId("colour-mode-members").click();
  await setStop("from", "#00FF00"); await setStop("to", "#FFFFFF");
  await poll(() => solid(expected), "members did not receive distinct uniform colours");
  assert.deepEqual(await palette(), expected);
  assert.equal(await page.getByTestId("gradient-angle").count(), 0);
  assert.deepEqual((await parts()).slice(3).map(part => part.renderedMaterials), original.slice(3).map(part => part.renderedMaterials));
  let pixelRatios;
  if (pixels) {
    const canvas = viewport.locator("canvas"), matrix = new Matrix4().fromArray((await canvas.getAttribute("data-view-projection")).split(",").map(Number));
    const { data, info } = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    pixelRatios = [-14, -10, -6, -2, 2, 6].map(x => {
      const point = new Vector3(x, 0, 0).applyMatrix4(matrix), at = (Math.round((1 - point.y) * info.height / 2) * info.width + Math.round((point.x + 1) * info.width / 2)) * info.channels;
      return data[at] / Math.max(1, data[at + 1]);
    });
    for (let i = 0; i < 6; i += 2) assert.ok(Math.abs(pixelRatios[i] - pixelRatios[i + 1]) < 0.06, `one member must not have an internal gradient: ${pixelRatios}`);
    assert.ok(pixelRatios[0] < 0.3 && pixelRatios[2] > 0.4 && pixelRatios[2] < 0.8 && pixelRatios[4] > 0.9, `green/pale green/white must render on the GPU: ${pixelRatios}`);
  }
  if (reload) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("paint-group-select").click();
    await poll(() => solid(expected), "saved per-member mode or colours did not reload");
    assert.equal(await page.getByTestId("colour-mode-members").getAttribute("aria-pressed"), "true");
  }
  if (screenshotPath) await page.screenshot({ path: screenshotPath });
  const folder = page.getByTestId("paint-group-row");
  await folder.locator('[data-testid="part-row"][data-index="1"]').getByTestId("part-select").click();
  assert.equal(await page.getByTestId("model-colour-control").getAttribute("data-mode"), "solid");
  assert.equal((await page.getByTestId("model-colour-hex").inputValue()).toLowerCase(), "#80ff80");
  await page.getByTestId("selection-appearance-close").click(); await folder.getByTestId("paint-group-select").click();
  await page.getByTestId("colour-mode-gradient").click();
  await poll(async () => (await parts()).slice(0, 3).every(part => part.renderedMaterials.every(material => material.gradient)), "continuous mode stopped working");
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+z`); await poll(() => solid(expected), "undo did not restore per-member mode");
  await page.getByTestId("gradient-reverse").click(); await poll(() => solid([...expected].reverse()), "reverse did not reverse the member palette");
  await page.keyboard.press(`${modifier}+z`); await poll(() => solid(expected), "undo did not restore the palette endpoints");
  await page.getByTestId("add-text").click();
  await page.getByTestId("text-layer-inline-content").fill("ABC"); await page.getByTestId("text-layer-inline-content").press("Tab");
  const textId = await page.getByTestId("text-layer-row").getAttribute("data-layer-id");
  await folder.getByTestId("edit-paint-group").click();
  await page.locator(`[data-testid="paint-group-member"][data-kind="layer"][data-member-id="${textId}"]`).check();
  await page.getByTestId("save-paint-group").click();
  await poll(async () => await solid(["#00ff00", "#55ff55", "#aaffaa"]) && (await reliefs()).find(layer => layer.layerId === textId)?.colourHex === "#FFFFFF", "adding text did not redistribute the palette");
  const text = (await reliefs()).find(layer => layer.layerId === textId);
  assert.ok(text.pieces > 1 && !text.gradient, "all text glyphs must share one solid fill");
  await folder.getByTestId("text-layer-delete").click(); await poll(() => solid(expected), "removing a member did not redistribute the palette");
  await page.getByTestId("selection-appearance-panel").getByTestId("dissolve-paint-group").click();
  await poll(async () => JSON.stringify((await parts()).map(part => part.renderedMaterials)) === JSON.stringify(original.map(part => part.renderedMaterials)), "ungrouping did not restore the source material colours");
  assert.deepEqual((await parts()).map(part => [part.name, part.faces, part.materials, part.renderedMaterials]), original.map(part => [part.name, part.faces, part.materials, part.renderedMaterials]));
  return { distinctSolids: expected, pixelRatios, childShowsSolid: true, reload: !!reload, continuousSwitch: true, reverse: true, undo: true, textWholeLayer: true, membershipRedistributes: true, sourceUnchanged: true };
}
