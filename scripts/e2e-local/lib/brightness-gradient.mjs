import assert from "node:assert/strict";
import { Matrix4, Vector3 } from "three";
import sharp from "sharp";

async function poll(check, message) {
  const until = Date.now() + 25000;
  while (Date.now() < until) { if (await check()) return; await new Promise(resolve => setTimeout(resolve, 100)); }
  throw new Error(message);
}

export async function verifyBrightnessGradient({ page, restore, reload = false, screenshotPath }) {
  if (!restore) return verifyLoaded({ page, reload, screenshotPath });
  const viewport = page.getByTestId("editor-viewport");
  const signature = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]").map(part => [part.name, part.faces]);
  const before = await signature();
  let obj = "mtllib brightness.mtl\n";
  for (let part = 0; part < 4; part++) {
    const x = -15 + part * 8, vertex = part * 4 + 1;
    obj += `v ${x} -3 0\nv ${x + 6} -3 0\nv ${x + 6} 3 0\nv ${x} 3 0\no Panel${part + 1}\nusemtl White\nf ${vertex} ${vertex + 1} ${vertex + 2}\nf ${vertex} ${vertex + 2} ${vertex + 3}\n`;
  }
  const file = (name, text) => ({ name, mimeType: "text/plain", buffer: Buffer.from(text) });
  try {
    await page.getByTestId("view-open-model-input").setInputFiles([file("brightness.obj", obj), file("brightness.mtl", "newmtl White\nKd 1 1 1\nNs 0\n")]);
    await poll(async () => (await signature()).length === 4, "brightness fixture did not load");
    return await verifyLoaded({ page, pixels: true, screenshotPath });
  } finally {
    await restore();
    await poll(async () => JSON.stringify(await signature()) === JSON.stringify(before), "source did not restore after brightness QA");
  }
}

async function verifyLoaded({ page, reload, screenshotPath, pixels = false }) {
  const viewport = page.getByTestId("editor-viewport"), canvas = viewport.locator("canvas");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const original = await parts(), expected = ["#003366", "#0066cc", "#80b3e6"];
  const solid = async colours => (await parts()).slice(0, 3).every((part, index) => part.renderedMaterials.every(material => material.colour === colours[index] && !material.gradient));
  const palette = async () => page.getByTestId("gradient-member-colour").evaluateAll(rows => rows.map(row => row.dataset.hex.toLowerCase()));
  const setBase = async hex => { await page.getByTestId("brightness-base-hex").fill(hex); await page.getByTestId("brightness-base-hex").press("Tab"); };
  const nativeValue = async (testId, value) => {
    await page.getByTestId(testId).evaluate((input, value) => { Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(input, value); input.dispatchEvent(new Event("input", { bubbles: true })); input.dispatchEvent(new Event("change", { bubbles: true })); }, String(value));
    await page.getByTestId(testId).press("Tab");
  };
  const pixelSamples = async xs => {
    const matrix = new Matrix4().fromArray((await canvas.getAttribute("data-view-projection")).split(",").map(Number));
    const { data, info } = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    return xs.map(x => { const p = new Vector3(x, 0, 0).applyMatrix4(matrix), at = (Math.round((1 - p.y) * info.height / 2) * info.width + Math.round((p.x + 1) * info.width / 2)) * info.channels; return [...data.subarray(at, at + 3)]; });
  };
  await page.getByTestId("add-paint-group").click(); await page.getByTestId("paint-group-name").fill("GP · 同色深淺");
  for (const index of [0, 1, 2]) await page.locator(`[data-testid="paint-group-member"][data-kind="part"][data-member-id="${index}"]`).check();
  await page.getByTestId("save-paint-group").click(); await page.getByTestId("colour-mode-members").click();
  await page.getByTestId("gradient-variation-brightness").click(); await setBase("#0066CC");
  await poll(() => solid(expected), "same-colour group did not produce dark/base/light solids");
  assert.deepEqual(await palette(), expected);
  assert.deepEqual((await parts()).slice(3).map(part => part.renderedMaterials), original.slice(3).map(part => part.renderedMaterials));
  if (reload) {
    await page.reload({ waitUntil: "domcontentloaded" }); await page.getByTestId("paint-group-select").click();
    await poll(() => solid(expected), "brightness settings or distribution did not survive reload");
    assert.equal(await page.getByTestId("brightness-control").getAttribute("data-colour"), "#0066CC");
  }
  await page.getByTestId("colour-mode-gradient").click();
  await poll(async () => (await parts()).slice(0, 3).every(part => part.renderedMaterials.every(material => material.gradient?.brightness?.colour === "#0066CC")), "linear gradient lost its brightness definition");
  let rendered;
  if (pixels) {
    const samples = await pixelSamples([-14, -10, -6, -4, -2, 2, 6]);
    const luminance = samples.map(([r, g, b]) => r * 0.2126 + g * 0.7152 + b * 0.0722);
    assert.ok(samples.every(([r, g, b]) => b > g && g > r), `brightness gradient changed the blue hue: ${JSON.stringify(samples)}`);
    assert.ok(luminance.every((value, index) => !index || value > luminance[index - 1]), `same-hue brightness must increase across the model: ${luminance}`);
    const middle = samples[3];
    await page.getByTestId("colour-mode-solid").click(); await page.getByTestId("model-colour-hex").fill("#0066CC"); await page.getByTestId("model-colour-hex").press("Tab");
    await poll(() => solid(["#0066cc", "#0066cc", "#0066cc"]), "solid base reference did not render");
    const [reference] = await pixelSamples([-4]);
    assert.ok(middle.every((value, channel) => Math.abs(value - reference[channel]) <= 2), `brightness midpoint must match the rendered base colour: ${JSON.stringify({ middle, reference })}`);
    const modifier = process.platform === "darwin" ? "Meta" : "Control";
    await page.keyboard.press(`${modifier}+z`); await page.keyboard.press(`${modifier}+z`);
    await page.getByTestId("brightness-control").waitFor();
    rendered = { samples, middle, reference };
  }
  await nativeValue("brightness-from", -80);
  await poll(async () => await page.getByTestId("brightness-control").getAttribute("data-from") === "-80", "brightness slider did not update");
  await page.getByTestId("gradient-reverse").click();
  assert.equal(await page.getByTestId("brightness-control").getAttribute("data-from"), "50");
  assert.equal(await page.getByTestId("brightness-control").getAttribute("data-to"), "-80");
  await page.getByTestId("brightness-dark-light").click(); await page.getByTestId("colour-mode-members").click();
  await poll(() => solid(expected), "distribution switch failed to retain brightness");
  await nativeValue("brightness-base-picker", "#808080");
  await poll(() => solid(["#404040", "#808080", "#c0c0c0"]), "native base colour picker did not produce grey shades");
  await setBase("#0066CC"); await poll(() => solid(expected), "base colour edit failed");
  await page.getByTestId("gradient-variation-colour").click();
  assert.equal(await page.getByTestId("brightness-control").count(), 0);
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  await page.keyboard.press(`${modifier}+z`); await poll(() => solid(expected), "undo did not restore same-hue variation");
  if (screenshotPath) await page.screenshot({ path: screenshotPath });
  await page.getByTestId("selection-appearance-panel").getByTestId("dissolve-paint-group").click();
  await poll(async () => JSON.stringify((await parts()).map(part => part.renderedMaterials)) === JSON.stringify(original.map(part => part.renderedMaterials)), "brightness edits did not release the original material colours");
  assert.deepEqual((await parts()).map(part => [part.name, part.faces, part.materials]), original.map(part => [part.name, part.faces, part.materials]));
  return { layerShades: expected, reload: !!reload, rendered, originalColourAtMidpoint: pixels, reverse: true, slider: true, nativePicker: true, greyscale: true, variationUndo: true, sourceUnchanged: true };
}
