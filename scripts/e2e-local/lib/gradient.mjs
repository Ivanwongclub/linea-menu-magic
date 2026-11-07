import assert from "node:assert/strict";
import sharp from "sharp";

async function poll(check, message) {
  const until = Date.now() + 25000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function stopColour(page, stop, hex) {
  await page.getByTestId(`gradient-stop-${stop}`).click();
  await page.getByTestId("gradient-stop-hex").fill(hex);
  await page.getByTestId("gradient-stop-hex").press("Tab");
}

async function rangeValue(page, testId, value) {
  const input = page.getByTestId(testId);
  await input.focus();
  await input.evaluate((el, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value").set.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }, String(value));
  await input.press("Tab");
}

export async function verifyWholeModelGradient({ page, reload = false }) {
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  if (await page.getByTestId("model-colour-reset").isEnabled()) {
    await page.getByTestId("model-colour-reset").click();
    await poll(async () => (await parts())[0]?.renderedMaterials[0].colour.toUpperCase() === (await page.getByTestId("model-colour-control").getAttribute("data-hex")).toUpperCase(), "initial material reset did not render");
  }
  const original = (await parts()).map(part => part.renderedMaterials);
  await page.getByTestId("colour-mode-gradient").click();
  await stopColour(page, "from", "#FF0000");
  await stopColour(page, "to", "#0000FF");
  await page.getByTestId("gradient-angle-90").click();
  await poll(async () => (await parts()).every(part => part.renderedMaterials.every(material => material.gradient?.to === "#0000FF" && material.gradient.angle === 90)), "whole-model gradient did not reach every source mesh");
  if (reload) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("gradient-control").waitFor();
    assert.equal(await page.getByTestId("gradient-control").getAttribute("data-angle"), "90");
    await poll(async () => (await parts()).every(part => part.renderedMaterials.every(material => material.gradient?.from === "#FF0000")), "anonymous draft reload lost the gradient");
  }
  await page.getByTestId("gradient-black-white").click();
  assert.equal(await page.getByTestId("gradient-control").getAttribute("data-from"), "#000000");
  assert.equal(await page.getByTestId("gradient-control").getAttribute("data-to"), "#FFFFFF");
  await page.getByTestId("colour-mode-solid").click();
  await poll(async () => (await parts()).every(part => part.renderedMaterials.every(material => material.colour === "#000000" && !material.gradient)), "solid fill retained an inherited gradient shader");
  await page.getByTestId("model-colour-reset").click();
  await poll(async () => JSON.stringify((await parts()).map(part => part.renderedMaterials)) === JSON.stringify(original), "gradient reset failed to restore original materials");
  return { allMeshes: true, anonymousReload: reload, blackWhitePreset: true, switchToSolid: true, reset: true };
}

/** An imported OBJ + MTL starts and ends without temporary test fills/layers. */
export async function verifyScopedGradient({ page, reapplyMtl, screenshotPath }) {
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const reliefs = async () => JSON.parse(await viewport.getAttribute("data-reliefs") || "[]");
  const zones = async () => JSON.parse(await viewport.getAttribute("data-zones") || "[]");
  const original = await parts();
  const size = await viewport.getAttribute("data-model-size-mm");
  const toggle = page.getByTestId("parts-toggle");
  if (await toggle.getAttribute("aria-expanded") !== "true") await toggle.click();
  await page.getByTestId("part-row").nth(1).getByTestId("part-select").dblclick();
  assert.equal(await page.getByTestId("part-row").nth(1).getAttribute("data-visible"), "true", "double click must not hit a moved visibility button");
  await page.getByTestId("colour-mode-gradient").click();
  await stopColour(page, "from", "#FF0000");
  await stopColour(page, "to", "#0000FF");
  await poll(async () => (await parts())[1].renderedMaterials.every(material => material.gradient?.to === "#0000FF"), "selected part gradient did not reach the renderer");
  assert.deepEqual((await parts()).filter((_, index) => index !== 1).map(part => part.renderedMaterials), original.filter((_, index) => index !== 1).map(part => part.renderedMaterials), "gradient changed another mesh using the same MTL");
  // Sample the canvas away from the floating UI. Seeing both hues verifies
  // actual GPU output, rather than just the recipe/read-back attributes.
  const pixels = async () => {
    const { data, info } = await sharp(await viewport.locator("canvas").screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    let red = 0, blue = 0;
    for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width * 0.7; x++) {
      const index = (y * info.width + x) * info.channels;
      const [r, g, b] = data.subarray(index, index + 3);
      if (r > 70 && r > b * 1.5 && r > g * 1.5) red++;
      if (b > 70 && b > r * 1.5 && b > g * 1.5) blue++;
    }
    return { red, blue };
  };
  const horizontal = await pixels();
  assert.ok(horizontal.red > 100 && horizontal.blue > 100, `both gradient colours must render: ${JSON.stringify(horizontal)}`);
  await page.getByTestId("gradient-angle-90").click();
  await rangeValue(page, "gradient-midpoint", 90);
  const shifted = await pixels();
  assert.ok(Math.abs(shifted.red - horizontal.red) + Math.abs(shifted.blue - horizontal.blue) > 100, "angle/midpoint changes did not change the rendered model");
  await page.getByTestId("gradient-reverse").click();
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  assert.equal(await page.getByTestId("gradient-control").getAttribute("data-from"), "#0000FF");
  await page.keyboard.press(`${modifier}+z`);
  assert.equal(await page.getByTestId("gradient-control").getAttribute("data-from"), "#FF0000");
  await page.keyboard.press(`${modifier}+Shift+z`);
  assert.equal(await page.getByTestId("gradient-control").getAttribute("data-from"), "#0000FF");
  await page.getByTestId("selection-material-change").click();
  await page.getByTestId("selection-material-picker").getByTestId("finish-swatch").first().click();
  await page.getByTestId("selection-material-picker").waitFor({ state: "detached" });
  assert.equal(await page.getByTestId("gradient-control").getAttribute("data-from"), "#0000FF", "material selection lost gradient");
  if (reapplyMtl) {
    await reapplyMtl();
    await poll(async () => (await parts())[1].renderedMaterials[0].gradient?.from === "#0000FF", "reapplying MTL lost gradient");
  }
  await stopColour(page, "from", "#F04A7B");
  await stopColour(page, "to", "#246BFD");
  await rangeValue(page, "gradient-midpoint", 50);
  if (screenshotPath) {
    const toast = page.getByText("Materials applied to the current OBJ.", { exact: true });
    if (await toast.count()) await toast.waitFor({ state: "hidden", timeout: 10000 });
    await page.getByTestId("selection-appearance-name").click();
    await page.mouse.move(10, 10);
    await page.screenshot({ path: screenshotPath });
  }
  await page.getByTestId("selection-material-reset").click();
  await page.getByTestId("model-colour-reset").click();
  await page.getByTestId("selection-appearance-close").click();

  await page.getByTestId("add-text").click();
  await page.getByTestId("text-layer-inline-content").fill("GRADIENT");
  await page.getByTestId("colour-mode-gradient").click();
  await stopColour(page, "from", "#FF0000");
  await stopColour(page, "to", "#0000FF");
  await poll(async () => (await reliefs())[0]?.gradient?.to === "#0000FF" && (await reliefs())[0]?.pieces > 1, "text gradient did not span multiple glyphs");
  const textBounds = (await reliefs())[0].gradientBounds;
  assert.ok(textBounds[2] > textBounds[0] && textBounds[3] > textBounds[1]);
  assert.deepEqual((await parts()).map(part => part.renderedMaterials), original.map(part => part.renderedMaterials), "text gradient recoloured base model");
  await page.getByTestId("text-layer-delete").click();

  await page.getByTestId("add-zone").click();
  await page.getByTestId("add-zone-plane").click();
    await page.getByTestId("zone-draft-reset-colour").click();
    await page.getByTestId("zone-draft-confirm").click();
  await page.getByTestId("colour-mode-gradient").click();
  await stopColour(page, "from", "#FF0000");
  await stopColour(page, "to", "#0000FF");
  await poll(async () => (await zones())[0]?.gradient?.to === "#0000FF" && (await zones())[0]?.faces > 0, "zone gradient did not reach its face mask");
  await page.getByTestId("zone-delete").click();
  assert.deepEqual((await parts()).map(part => [part.name, part.faces]), original.map(part => [part.name, part.faces]));
  assert.equal(await viewport.getAttribute("data-model-size-mm"), size);
  assert.deepEqual((await parts()).map(part => part.renderedMaterials), original.map(part => part.renderedMaterials));
  return { partOnly: true, gpuPixels: { horizontal, shifted }, angle: true, midpoint: true, reverse: true, undoRedo: true, sourceMtl: true, text: true, zone: true, geometryUnchanged: true };
}
