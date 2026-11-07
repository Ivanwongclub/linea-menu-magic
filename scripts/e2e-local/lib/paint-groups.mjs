import assert from "node:assert/strict";
import sharp from "sharp";
import { Matrix4, Vector3 } from "three";

async function poll(check, message) {
  const until = Date.now() + 25000;
  while (Date.now() < until) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(message);
}

async function stopColour(page, stop, value) {
  await page.getByTestId(`gradient-stop-${stop}`).click();
  await page.getByTestId("gradient-stop-hex").fill(value);
  await page.getByTestId("gradient-stop-hex").press("Tab");
}

/** Creates one GP, verifies a shared span across parts + text, then undoes its changes. */
export async function verifyPaintGroups({ page, reload = false, screenshotPath }) {
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const reliefs = async () => JSON.parse(await viewport.getAttribute("data-reliefs") || "[]");
  const original = await parts();
  const geometry = original.map(part => [part.name, part.faces]);
  const size = await viewport.getAttribute("data-model-size-mm");
  assert.equal(await page.getByTestId("paint-group-row").count(), 0);
  const popup = page.getByTestId("selection-appearance-panel");
  const member = (kind, id) => page.locator(`[data-testid="paint-group-member"][data-kind="${kind}"][data-member-id="${id}"]`);
  const modifier = process.platform === "darwin" ? "Meta" : "Control";
  const partsToggle = page.getByTestId("parts-toggle");
  if (await partsToggle.getAttribute("aria-expanded") !== "true") await partsToggle.click();
  await page.getByTestId("add-paint-group").click();
  await page.getByTestId("paint-group-name").fill("GP TEST");
  await member("part", String(original[0].index)).check();
  assert.equal(await page.getByTestId("save-paint-group").isDisabled(), true, "new GP requires at least two members");
  await member("part", String(original[1].index)).check();
  await page.getByTestId("save-paint-group").click();
  await page.getByTestId("paint-group-dialog").waitFor({ state: "detached" });
  assert.equal(await popup.getAttribute("data-kind"), "group");
  const tree = page.getByTestId("paint-group-row");
  assert.equal(await tree.getByTestId("part-row").count(), 2, "group members must appear inside the folder");
  assert.equal(await page.getByTestId("parts-group").getByTestId("part-row").count(), original.length - 2, "grouped parts must leave the ungrouped list");
  await tree.getByTestId("paint-group-toggle").click();
  assert.equal(await tree.getByTestId("part-row").count(), 0, "collapsing the folder must hide its child rows");
  assert.equal(await popup.getAttribute("data-kind"), "group", "collapsing must not change selection or paint");
  await tree.getByTestId("paint-group-toggle").click();
  assert.equal(await popup.getByTestId("selection-material-control").count(), 0, "a colour GP must keep each member's material");
  await page.keyboard.press(`${modifier}+z`);
  await poll(async () => await page.getByTestId("paint-group-row").count() === 0, "undo did not remove the new GP");
  await page.keyboard.press(`${modifier}+Shift+z`);
  await page.getByTestId("paint-group-select").click();
  await tree.getByTestId("part-row").first().getByTestId("part-visibility").click();
  await poll(async () => (await parts())[0].visible === false, "nested part visibility did not hide its source mesh");
  await tree.getByTestId("part-row").first().getByTestId("part-visibility").click();
  await poll(async () => (await parts())[0].visible === true, "nested part visibility did not restore its source mesh");
  await page.getByTestId("colour-mode-gradient").click();
  await stopColour(page, "from", "#FF0000");
  await stopColour(page, "to", "#0000FF");
  await poll(async () => (await parts()).slice(0, 2).every(part => part.renderedMaterials.every(material => material.gradient?.to === "#0000FF")), "GP gradient did not cover both source parts");
  const painted = await parts();
  assert.deepEqual(painted[0].renderedMaterials[0].gradientBounds, painted[1].renderedMaterials[0].gradientBounds, "members restarted the gradient instead of sharing its span");
  assert.deepEqual(painted.slice(2).map(part => part.renderedMaterials), original.slice(2).map(part => part.renderedMaterials), "GP coloured a nonmember");
  assert.deepEqual(painted.map(part => part.materials), original.map(part => part.materials), "GP modified original MTL definitions");

  if (await partsToggle.getAttribute("aria-expanded") !== "true") await partsToggle.click();
  await page.getByTestId("part-row").nth(1).getByTestId("part-select").click();
  await page.getByTestId("colour-mode-solid").click();
  await page.getByTestId("model-colour-hex").fill("#00FF00");
  await page.getByTestId("model-colour-hex").press("Tab");
  await poll(async () => (await parts())[1].renderedMaterials[0].colour === "#00ff00" && !(await parts())[1].renderedMaterials[0].gradient, "individual override failed inside the GP");
  assert.equal((await parts())[0].renderedMaterials[0].gradient.from, "#FF0000");
  await page.getByTestId("paint-group-select").click();
  await page.getByTestId("gradient-angle-45").click();
  await poll(async () => (await parts())[1].renderedMaterials[0].gradient?.angle === 45, "editing the GP did not reunify member fills");
  await page.getByTestId("colour-mode-solid").click();
  await page.getByTestId("model-colour-hex").fill("#38A169");
  await page.getByTestId("model-colour-hex").press("Tab");
  await poll(async () => (await parts()).slice(0, 2).every(part => part.renderedMaterials.every(material => material.colour === "#38a169" && !material.gradient)), "solid GP fill did not cover its members");
  await page.getByTestId("colour-mode-gradient").click();
  await stopColour(page, "from", "#F04A7B");
  await stopColour(page, "to", "#246BFD");
  await page.getByTestId("gradient-angle-90").click();

  if (original.length > 2) {
    await popup.getByTestId("edit-paint-group").click();
    await member("part", String(original[2].index)).check();
    await page.getByTestId("save-paint-group").click();
    await poll(async () => (await parts())[2].renderedMaterials[0].gradient?.to === "#246BFD", "new GP member did not take its fill");
    await popup.getByTestId("edit-paint-group").click();
    await member("part", String(original[2].index)).uncheck();
    await page.getByTestId("save-paint-group").click();
    await poll(async () => !(await parts())[2].renderedMaterials[0].gradient, "removed GP member retained its fill");
    assert.deepEqual((await parts())[2].renderedMaterials, original[2].renderedMaterials);
  }


  await page.getByTestId("add-text").click();
  await page.getByTestId("text-layer-inline-content").fill("GP");
  await page.getByTestId("text-layer-inline-content").press("Tab");
  const layerId = await page.getByTestId("text-layer-row").getAttribute("data-layer-id");
  await page.getByTestId("paint-group-select").click();
  await popup.getByTestId("edit-paint-group").click();
  await member("layer", layerId).check();
  await page.getByTestId("paint-group-name").fill("GP PARTS + TEXT");
  await page.getByTestId("save-paint-group").click();
  await poll(async () => (await reliefs())[0]?.gradient?.to === "#246BFD" && (await reliefs())[0]?.pieces === 2, "branding layer did not inherit its GP gradient");
  assert.equal(await tree.getByTestId("text-layer-row").count(), 1, "grouped text must appear inside the GP tree");
  assert.equal(await page.getByTestId("branding-group").getByTestId("text-layer-row").count(), 0, "grouped text must leave the ungrouped list");
  assert.deepEqual((await reliefs())[0].gradientBounds, (await parts())[0].renderedMaterials[0].gradientBounds, "text and source parts did not use one shared footprint");
  if (screenshotPath) {
    await page.getByTestId("selection-appearance-name").click();
    await page.mouse.move(10, 10);
    await page.screenshot({ path: screenshotPath });
  }
  if (reload) {
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.getByTestId("paint-group-select").waitFor();
    await page.getByTestId("paint-group-select").click();
    assert.match(await page.getByTestId("selection-appearance-name").innerText(), /GP PARTS \+ TEXT/);
    await poll(async () => (await reliefs())[0]?.gradient?.to === "#246BFD", "saved GP membership/gradient did not reload");
    assert.deepEqual((await reliefs())[0].gradientBounds, (await parts())[1].renderedMaterials[0].gradientBounds);
  }
  await popup.getByTestId("dissolve-paint-group").click();
  await poll(async () => await page.getByTestId("paint-group-row").count() === 0 && (await parts()).every(part => part.renderedMaterials.every(material => !material.gradient)), "ungroup did not remove its fill");
  assert.equal((await reliefs()).length, 1, "ungroup must not delete its text layer");
  await page.keyboard.press(`${modifier}+z`);
  await page.getByTestId("paint-group-select").waitFor();
  await poll(async () => (await parts())[0].renderedMaterials[0].gradient?.to === "#246BFD", "undo did not restore GP appearance");
  await page.keyboard.press(`${modifier}+Shift+z`);
  await poll(async () => await page.getByTestId("paint-group-row").count() === 0, "redo did not dissolve GP");
  await page.getByTestId("text-layer-delete").click();
  assert.deepEqual((await parts()).map(part => [part.name, part.faces]), geometry);
  assert.equal(await viewport.getAttribute("data-model-size-mm"), size);
  assert.deepEqual((await parts()).map(part => part.renderedMaterials), original.map(part => part.renderedMaterials));
  return { grouping: true, sharedGradientSpan: true, fullMemberColour: true, nonmembersUnchanged: true, originalMtlPreserved: true, editMembership: true, partsAndText: true, anonymousReload: reload, undoRedo: true, ungroupKeepsLayers: true, geometryUnchanged: true };
}

/** Two separated rectangles distinguish one GP-wide gradient from two repeated fills. */
export async function verifyContinuousGroupGradient({ page, restore, screenshotPath }) {
  const obj = "mtllib shared.mtl\nv -10 -2 0\nv -2 -2 0\nv -2 2 0\nv -10 2 0\nv 2 -2 0\nv 10 -2 0\nv 10 2 0\nv 2 2 0\no Left\nusemtl Silver\nf 1 2 3\nf 1 3 4\no Right\nusemtl Silver\nf 5 6 7\nf 5 7 8\n";
  const mtl = "newmtl Silver\nKd 0.8 0.8 0.8\nNs 30\n";
  const file = (name, text) => ({ name, mimeType: "text/plain", buffer: Buffer.from(text) });
  const viewport = page.getByTestId("editor-viewport");
  const parts = async () => JSON.parse(await viewport.getAttribute("data-parts") || "[]");
  const canvas = viewport.locator("canvas");
  const beforeFixture = (await parts()).map(part => [part.name, part.faces]);
  const frame = async () => page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const sample = async x => {
    const matrix = new Matrix4().fromArray((await canvas.getAttribute("data-view-projection")).split(",").map(Number));
    const projected = new Vector3(x, 0, 0).applyMatrix4(matrix);
    const { data, info } = await sharp(await canvas.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const cx = Math.round((projected.x + 1) * info.width / 2), cy = Math.round((1 - projected.y) * info.height / 2);
    const rgb = [0, 0, 0];
    for (let y = cy - 2; y <= cy + 2; y++) for (let x = cx - 2; x <= cx + 2; x++) {
      const index = (y * info.width + x) * info.channels;
      for (let channel = 0; channel < 3; channel++) rgb[channel] += data[index + channel] / 25;
    }
    return rgb;
  };
  try {
    await page.getByTestId("view-open-model-input").setInputFiles([file("rectangles.obj", obj), file("shared.mtl", mtl)]);
    await poll(async () => (await parts()).length === 2 && (await parts())[0].name === "Left", "continuity fixture did not load");
    await page.getByTestId("add-paint-group").click();
    await page.getByTestId("paint-group-name").fill("Continuous GP");
    await page.locator('[data-testid="paint-group-member"][data-kind="part"][data-member-id="0"]').check();
    await page.locator('[data-testid="paint-group-member"][data-kind="part"][data-member-id="1"]').check();
    await page.getByTestId("save-paint-group").click();
    await page.getByTestId("colour-mode-gradient").click();
    await stopColour(page, "from", "#FF0000");
    await stopColour(page, "to", "#0000FF");
    await frame();
    const left = await sample(-4), right = await sample(4);
    assert.ok(left[0] > left[2] * 1.1 && right[2] > right[0] * 1.1, `one gradient must cross both meshes: ${JSON.stringify({ left, right })}`);
    const bounds = (await parts())[0].renderedMaterials[0].gradientBounds;
    assert.deepEqual(bounds, (await parts())[1].renderedMaterials[0].gradientBounds);
    await page.getByTestId("gradient-angle-90").click();
    await frame();
    const verticalLeft = await sample(-4), verticalRight = await sample(4);
    for (const rgb of [verticalLeft, verticalRight]) assert.ok(Math.abs(rgb[0] - rgb[2]) < (rgb[0] + rgb[2]) * 0.2, `same-height members should meet the same gradient midpoint: ${JSON.stringify(rgb)}`);
    await page.getByTestId("colour-mode-solid").click();
    await page.getByTestId("model-colour-hex").fill("#00AA33");
    await page.getByTestId("model-colour-hex").press("Tab");
    await page.getByTestId("view-open-model-input").setInputFiles([file("shared.mtl", mtl)]);
    await page.getByText("Materials applied to the current OBJ.", { exact: true }).waitFor({ state: "visible" });
    await frame();
    const solidLeft = await sample(-4), solidRight = await sample(4);
    for (const rgb of [solidLeft, solidRight]) assert.ok(rgb[1] > rgb[0] * 1.1 && rgb[1] > rgb[2] * 1.1, `whole member colour/MTL reimport failed: ${JSON.stringify(rgb)}`);
    if (screenshotPath) await page.screenshot({ path: screenshotPath });
    return { horizontal: { left, right }, vertical: { left: verticalLeft, right: verticalRight }, fullMemberColour: { left: solidLeft, right: solidRight }, mtlReimport: true, sharedBounds: bounds };
  } finally {
    if (restore) {
      await restore();
      await poll(async () => JSON.stringify((await parts()).map(part => [part.name, part.faces])) === JSON.stringify(beforeFixture), "original imported model did not restore after the continuity fixture");
    }
  }
}
