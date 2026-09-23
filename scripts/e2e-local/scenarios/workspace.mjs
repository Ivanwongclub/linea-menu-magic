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
//   7. One Properties panel follows that selection (U6), and says so when
//      nothing is selected.
//   8. Versions / Output is a socket that renders only when it has something
//      in it (U8) — today, the design's own save state.
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

    /* ---- 4. nothing selected: Properties says so, and Output is not there ---- */
    assert.equal(await page.getByTestId("properties-panel").getAttribute("data-kind"), "none", "nothing is selected on open");
    assert.equal(await page.getByTestId("properties-empty").count(), 1, "and the panel says so rather than showing an empty frame");
    assert.equal(await page.getByTestId("output-dock").count(), 0, "an empty Versions / Output is not rendered at all (U8)");

    /* ---- 5. reset is chrome only (E2 §3.4 item 8) ---- */
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

    /* ---- 6. a layout from an older shape is ignored ---- */
    await page.evaluate(() => {
      const key = `wincyc:workspace:v1:${"stale"}`;
      void key;
      const own = Object.keys(window.localStorage).find((k) => k.startsWith("wincyc:workspace:"));
      window.localStorage.setItem(own ?? "wincyc:workspace:v1:anon", JSON.stringify({ version: 0, side: "left", collapsed: true, widthPx: 520 }));
    });
    await page.reload({ waitUntil: "networkidle" });
    await panel.waitFor({ timeout: 30000 });
    assert.deepEqual(await layoutOf(), { side: "right", collapsed: false, width: DEFAULT_WIDTH }, "a stale layout version is discarded whole");

    /* ---- 7. one selection (U1), and one panel that follows it (U6) ---- */
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

    const properties = page.getByTestId("properties-panel");
    assert.equal(await properties.getAttribute("data-kind"), "layer", "Properties follows the layer");
    assert.equal((await page.getByTestId("properties-subject").innerText()).trim(), "WORKSPACE", "and names what it is showing");
    for (const control of ["layer-relief", "layer-appearance", "text-layer-content", "position-and-curve"]) {
      assert.equal(await properties.getByTestId(control).count(), 1, `${control} is in Properties, not on the row`);
    }
    assert.equal(await page.getByTestId("text-layer-row").getByTestId("layer-relief").count(), 0, "the row carries no controls of its own (U6)");
    out.layerProperties = ["layer-relief", "layer-appearance", "text-layer-content", "position-and-curve"];

    // The save state is the one thing Versions / Output has today (U8), so the
    // socket appears with the first save and not before.
    assert.equal(await page.getByTestId("output-dock").count(), 0, "a freshly loaded design has nothing to put in the socket");
    await page.getByTestId("text-layer-content").fill("WORKSPACE II");
    await page.getByTestId("text-layer-content").blur();
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "WORKSPACE II", "an edit to save");
    const dock = page.getByTestId("output-dock");
    await dock.waitFor({ timeout: 20000 });
    assert.equal(await dock.getAttribute("data-sections"), "0", "nothing fills the socket yet");
    assert.equal(await dock.getByTestId("autosave-status").count(), 1, "the save state rides in its header");
    assert.equal(await page.getByTestId("output-toggle").isDisabled(), true, "and there is nothing to open");
    assert.equal(await page.getByTestId("output-body").count(), 0);
    out.output = { sections: 0, header: (await dock.getByTestId("autosave-status").innerText()).trim() };

    await page.getByTestId("parts-toggle").click();
    await page.getByTestId("part-row").first().waitFor({ timeout: 20000 });
    const parts = JSON.parse(await viewport.getAttribute("data-parts"));
    const partIndex = await page.locator('[data-testid="part-row"]').first().getAttribute("data-index");
    await page.locator(`[data-testid="part-row"][data-index="${partIndex}"]`).getByTestId("part-select").click();
    await page.waitForFunction(() => document.querySelectorAll('[data-testid="layer-handles"]').length === 0, null, { timeout: 20000 });
    assert.deepEqual(await selected(), { layers: 0, zones: 0, parts: 1, handles: 0 }, "selecting a part drops the layer and its handles");

    // A part has somewhere to display now (U6): what it is, how much of the
    // model it is, whether it is drawn, and which zones cover it.
    assert.equal(await properties.getAttribute("data-kind"), "part", "Properties follows the part");
    const partProps = properties.getByTestId("part-properties");
    assert.equal(await partProps.getAttribute("data-index"), partIndex);
    const faces = properties.getByTestId("part-properties-faces");
    assert.equal(Number(await faces.getAttribute("data-faces")), parts.find((g) => String(g.index) === partIndex).faces, "the face count is the part's own");
    assert.ok(Number(await faces.getAttribute("data-share")) > 0, "and it says what share of the model that is");
    assert.equal(await properties.getByTestId("part-properties-zones").getAttribute("data-count"), "0", "no zone covers it yet");

    await properties.getByTestId("part-properties-visibility").click();
    const hiddenRecipe = await waitForRecipe(page, admin, designId, (r) => (r.hidden_groups ?? []).includes(Number(partIndex)), "part hidden from Properties");
    assert.deepEqual(hiddenRecipe.hidden_groups, [Number(partIndex)], "hiding it from Properties is the same edit as hiding it from the list");
    await properties.getByTestId("part-properties-visibility").click();
    await waitForRecipe(page, admin, designId, (r) => (r.hidden_groups ?? []).length === 0, "part shown again");
    out.partProperties = { index: Number(partIndex) };

    await page.getByTestId("add-zone").click();
    await page.getByTestId("add-zone-plane").click();
    await page.getByTestId("zone-row").waitFor({ timeout: 20000 });
    assert.deepEqual(await selected(), { layers: 0, zones: 1, parts: 0, handles: 0 }, "a new zone is the one selection");
    assert.equal(await properties.getAttribute("data-kind"), "zone", "Properties follows the zone");
    assert.equal(await properties.getByTestId("zone-properties").getAttribute("data-method"), "plane");
    assert.equal(await properties.getByTestId("zone-plane").count(), 1, "the plane it cuts on is a property, not a row control");
    assert.equal(await page.getByTestId("zone-row").getByTestId("zone-plane").count(), 0, "the row is a name and a delete");
    out.selection = "layer → part → zone, one at a time";

    /* ---- 8. calibration renders the default whatever is stored ---- */
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
