// E2 U1/U4 — the workspace, and the one selection it shows.
//
//   1. The controls start on the right, 360 px wide, and the model has the rest.
//   2. They move to the other edge, collapse, and resize — and every one of
//      those survives a reload, because the layout is remembered per user.
//   3. "Reset workspace" puts the chrome back and leaves the design alone.
//   4. A layout written by an older version of the shape is ignored, not
//      half-restored.
//   5. One selection: a layer, a zone or a part — selecting any of them clears
//      the others, and the on-model handles follow the layer.
//   6. `?calibration=1` renders the default layout whatever is stored, so the
//      render baselines are measured on the same canvas as ever.
import assert from "node:assert/strict";
import { openEditorFor, stageAppearance, waitForRecipe } from "../lib/appearance.mjs";

const DEFAULT_WIDTH = 360;

export default async function ({ page, base, admin, editor, h }) {
  const { product, restore } = await stageAppearance(admin, "sample-buckles-cord-locks", "e2e-workspace.obj");
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);

    const workspace = page.getByTestId("workspace");
    const panel = page.getByTestId("workspace-panel");
    const viewport = page.getByTestId("editor-viewport");
    const layoutOf = async () => ({
      side: await workspace.getAttribute("data-side"),
      collapsed: (await workspace.getAttribute("data-collapsed")) === "true",
      width: Number(await workspace.getAttribute("data-width")),
    });
    const storedLayout = () =>
      page.evaluate(() => {
        const key = Object.keys(window.localStorage).find((k) => k.startsWith("wincyc:workspace:"));
        return key ? { key, value: JSON.parse(window.localStorage.getItem(key)) } : null;
      });

    /* ---- 1. the default: controls on the right, model on the left ---- */
    await panel.waitFor({ timeout: 30000 });
    assert.deepEqual(await layoutOf(), { side: "right", collapsed: false, width: DEFAULT_WIDTH }, "the workspace opens on the default layout");
    const firstBoxes = { panel: await panel.boundingBox(), viewport: await viewport.boundingBox() };
    assert.ok(firstBoxes.panel.x > firstBoxes.viewport.x, "the controls start on the right");
    assert.ok(Math.abs(firstBoxes.panel.width - DEFAULT_WIDTH) <= 1, `the panel is ${firstBoxes.panel.width}px`);
    assert.equal(await storedLayout(), null, "nothing is stored until something is moved");
    out.opened = { panelWidth: Math.round(firstBoxes.panel.width), side: "right" };

    /* ---- 2. the other edge, and it is remembered ---- */
    await page.getByTestId("workspace-dock").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="workspace"]')?.getAttribute("data-side") === "left", null, { timeout: 10000 });
    const docked = { panel: await panel.boundingBox(), viewport: await viewport.boundingBox() };
    assert.ok(docked.panel.x < docked.viewport.x, "the controls moved to the left edge");
    assert.equal((await storedLayout()).value.side, "left", "and the move is remembered");

    // Resize: the handle is on the panel's inner edge, so dragging into the
    // viewport makes the panel wider.
    const handle = page.getByTestId("workspace-resize");
    const handleBox = await handle.boundingBox();
    await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + 200);
    await page.mouse.down();
    await page.mouse.move(handleBox.x + 120, handleBox.y + 200, { steps: 8 });
    await page.mouse.up();
    await page.waitForFunction(() => Number(document.querySelector('[data-testid="workspace"]')?.getAttribute("data-width")) > 400, null, { timeout: 10000 });
    const widened = await layoutOf();
    assert.ok(widened.width > DEFAULT_WIDTH, `the panel widened to ${widened.width}px`);
    assert.ok(Math.abs((await panel.boundingBox()).width - widened.width) <= 1, "and the panel is the width it says");

    await page.reload({ waitUntil: "networkidle" });
    await panel.waitFor({ timeout: 30000 });
    assert.deepEqual(await layoutOf(), { side: "left", collapsed: false, width: widened.width }, "a reload restores the workspace");
    out.remembered = widened;

    /* ---- 3. collapsed, the model gets the room ---- */
    const beforeCollapse = (await viewport.boundingBox()).width;
    await page.getByTestId("workspace-collapse").click();
    await page.getByTestId("workspace-rail").waitFor({ timeout: 10000 });
    assert.equal(await panel.count(), 0, "the controls are out of the way");
    assert.ok((await viewport.boundingBox()).width > beforeCollapse + 200, "and the model has the room");
    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("workspace-rail").waitFor({ timeout: 30000 });
    assert.equal((await layoutOf()).collapsed, true, "collapsed survives a reload too");
    await page.getByTestId("workspace-expand").click();
    await panel.waitFor({ timeout: 10000 });

    /* ---- 4. reset is chrome only (E2 §3.4 item 8) ---- */
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("WORKSPACE");
    await page.getByTestId("text-layer-content").blur();
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "WORKSPACE", "a layer to leave alone");

    await page.getByTestId("workspace-reset").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="workspace"]')?.getAttribute("data-side") === "right", null, { timeout: 10000 });
    assert.deepEqual(await layoutOf(), { side: "right", collapsed: false, width: DEFAULT_WIDTH }, "reset restores the default layout");
    assert.equal(await storedLayout(), null, "and forgets what was stored");
    assert.equal(await page.getByTestId("text-layer-content").inputValue(), "WORKSPACE", "the design is untouched");
    const afterReset = await waitForRecipe(page, admin, designId, (r) => r.layers?.length === 1, "the design survives a reset");
    assert.equal(afterReset.layers[0].content.value, "WORKSPACE");
    out.reset = "layout back to default, design untouched";

    /* ---- 5. a layout from an older shape is ignored ---- */
    await page.evaluate(() => {
      const key = `wincyc:workspace:v1:${"stale"}`;
      void key;
      const own = Object.keys(window.localStorage).find((k) => k.startsWith("wincyc:workspace:"));
      window.localStorage.setItem(own ?? "wincyc:workspace:v1:anon", JSON.stringify({ version: 0, side: "left", collapsed: true, widthPx: 520 }));
    });
    await page.reload({ waitUntil: "networkidle" });
    await panel.waitFor({ timeout: 30000 });
    assert.deepEqual(await layoutOf(), { side: "right", collapsed: false, width: DEFAULT_WIDTH }, "a stale layout version is discarded whole");

    /* ---- 6. one selection (U1) ---- */
    const selected = () =>
      page.evaluate(() => ({
        layers: document.querySelectorAll('[data-testid="text-layer-row"][data-selected="true"]').length,
        zones: document.querySelectorAll('[data-testid="zone-row"][data-selected="true"]').length,
        parts: document.querySelectorAll('[data-testid="part-row"][data-selected="true"]').length,
        handles: document.querySelectorAll('[data-testid="layer-handles"]').length,
      }));

    await page.getByTestId("text-layer-select").click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="layer-handles"]').length === 1, null, { timeout: 20000 });
    assert.deepEqual(await selected(), { layers: 1, zones: 0, parts: 0, handles: 1 }, "a selected layer, and its handles on the model");

    await page.getByTestId("parts-toggle").click();
    await page.getByTestId("part-row").first().waitFor({ timeout: 20000 });
    const partIndex = await page.locator('[data-testid="part-row"]').first().getAttribute("data-index");
    await page.locator(`[data-testid="part-row"][data-index="${partIndex}"]`).getByTestId("part-select").click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="layer-handles"]').length === 0, null, { timeout: 20000 });
    assert.deepEqual(await selected(), { layers: 0, zones: 0, parts: 1, handles: 0 }, "selecting a part drops the layer and its handles");

    await page.getByTestId("add-zone").click();
    await page.getByTestId("add-zone-plane").click();
    await page.getByTestId("zone-row").waitFor({ timeout: 20000 });
    assert.deepEqual(await selected(), { layers: 0, zones: 1, parts: 0, handles: 0 }, "a new zone is the one selection");
    out.selection = "layer → part → zone, one at a time";

    /* ---- 7. calibration renders the default whatever is stored ---- */
    await page.getByTestId("workspace-dock").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="workspace"]')?.getAttribute("data-side") === "left", null, { timeout: 10000 });
    await page.goto(`${base}/designer-studio/editor/${designId}?calibration=1`, { waitUntil: "networkidle" });
    await panel.waitFor({ timeout: 30000 });
    assert.deepEqual(await layoutOf(), { side: "right", collapsed: false, width: DEFAULT_WIDTH }, "calibration ignores a stored layout");
    assert.equal(await page.getByTestId("workspace-chrome").count(), 0, "and draws none of the workspace chrome");
    assert.equal((await storedLayout()).value.side, "left", "without forgetting what the buyer chose");
    out.calibration = "default layout, no chrome";

    return out;
  } finally {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
