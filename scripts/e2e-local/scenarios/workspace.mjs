// E2 U1/U4/U5 — the workspace, and the one selection it shows.
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
//   8. Versions / Output is a socket that renders what it has (U8): Phase 7a's
//      versions in the body, and nothing else since U7 took the save state.
//   9. The document bar (U7) is the home for what is not a selection: the
//      design's name, its save state, undo / redo, the workspace menu, and the
//      way back to the design list. None of it is drawn under ?calibration=1.
//  10. The layers dock (U5) is three sections with a count each — Branding,
//      Zones, Parts — with Parts collapsed, a height of its own, and the
//      panel's heading folded into its header.
import assert from "node:assert/strict";
import { openEditorFor, stageAppearance, waitForRecipe } from "../lib/appearance.mjs";

const DEFAULT_WIDTH = 360;

/** U7 moved dock / collapse / reset into the document bar's workspace menu. */
async function menuItem(page, testId) {
  await page.getByTestId("workspace-menu").click();
  await page.getByTestId("workspace-menu-items").waitFor({ timeout: 10000 });
  await page.getByTestId(testId).click();
}

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
    await menuItem(page, "workspace-dock");
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
    await menuItem(page, "workspace-collapse");
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
    // U8's "an empty socket is not rendered" is proved on the anonymous /new
    // path in design-versions.mjs; a saved design has had versions in the
    // socket since Phase 7a, so here it is present and closed.
    assert.equal(await page.getByTestId("output-body").count(), 0, "Versions / Output opens on request, not on load (U8)");

    /* ---- 5. reset is chrome only (E2 §3.4 item 8) ---- */
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("WORKSPACE");
    await page.getByTestId("text-layer-content").blur();
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "WORKSPACE", "a layer to leave alone");

    await menuItem(page, "workspace-reset");
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

    // What the socket carries (U8): Phase 7a's versions in the body, and the
    // design's own save state on the header — the buyer sees "Saved" without
    // opening a drawer.
    const dock = page.getByTestId("output-dock");
    await dock.waitFor({ timeout: 20000 });
    assert.equal(await dock.getAttribute("data-sections"), "1", "versions fill the socket (Phase 7a)");
    await page.getByTestId("text-layer-content").fill("WORKSPACE II");
    await page.getByTestId("text-layer-content").blur();
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "WORKSPACE II", "an edit to save");
    assert.equal(await dock.getByTestId("autosave-status").count(), 0, "the save state is no longer the dock's (U7)");
    const bar = page.getByTestId("document-bar");
    assert.equal(await bar.getByTestId("autosave-status").count(), 1, "it rides in the document bar");
    assert.equal(await page.getByTestId("output-toggle").isDisabled(), false, "and the body opens");
    assert.equal(await page.getByTestId("output-body").count(), 0, "closed until it is asked for");
    out.output = { sections: 1, save: (await bar.getByTestId("autosave-status").innerText()).trim() };

    /* ---- 10. the layers dock (U5): three sections, and a height of its own ---- */
    const layersDock = page.getByTestId("layers-dock");
    const dockBody = page.getByTestId("layers-dock-body");
    await layersDock.waitFor({ timeout: 20000 });
    assert.equal(await page.getByTestId("workspace-chrome").count(), 0, "the panel's chrome bar is gone — its heading is the dock's now (U5)");
    assert.equal(await layersDock.getByTestId("layers-dock-header").count(), 1, "and the dock is what heads the panel");

    // One section per kind, each saying how many it holds — which is the point
    // of the sectioning: 1 layer and 1 zone next to 33 OBJ groups.
    const sectionCounts = async () =>
      Object.fromEntries(
        await Promise.all(
          ["branding-group", "zones-section", "parts-group"].map(async (id) => [id, Number(await page.getByTestId(id).getAttribute("data-count"))]),
        ),
      );
    const modelGroups = JSON.parse(await viewport.getAttribute("data-parts")).length;
    assert.deepEqual(await sectionCounts(), { "branding-group": 1, "zones-section": 0, "parts-group": modelGroups }, "each section counts what it holds");

    // Parts is collapsed on open (E2 §3.4 item 3): a buyer branding a button is
    // not shopping for `object_11`.
    assert.equal(await page.getByTestId("parts-group").getAttribute("data-open"), "false", "Parts starts collapsed");
    assert.equal(await page.getByTestId("part-row").count(), 0, "so none of its rows are even rendered");
    assert.equal(await page.getByTestId("branding-group").getAttribute("data-open"), "true", "Branding does not");

    // Standing ruling 3, retired: the list scrolls inside the dock instead of
    // pushing Properties down the panel.
    await page.getByTestId("parts-toggle").click();
    await page.getByTestId("part-row").first().waitFor({ timeout: 20000 });
    const dockBox = await dockBody.evaluate((el) => ({ client: el.clientHeight, scroll: el.scrollHeight, windowHeight: window.innerHeight }));
    assert.ok(dockBox.client <= dockBox.windowHeight * 0.4 + 2, `the dock is capped at 40vh (${dockBox.client}px of ${dockBox.windowHeight})`);
    assert.ok(dockBox.scroll > dockBox.client + 300, `and the list is ${dockBox.scroll - dockBox.client}px longer than the box it scrolls in`);
    const panelBox = await panel.boundingBox();
    const propsBox = await page.getByTestId("properties-panel").boundingBox();
    assert.ok(propsBox.y < panelBox.y + panelBox.height, "Properties is on screen with 33 parts open — it no longer sits under the layer list");

    // Virtualisation (E2 §3.4 item 3) past ~50 rows. The Polo is 33, so what
    // this proves is the other half: a short list is left whole, every row in
    // the DOM. The arithmetic past the threshold is unit-tested — no model on
    // the local stack has more than 50 groups.
    const partsList = page.getByTestId("parts-list");
    assert.equal(await partsList.getAttribute("data-rows"), String(modelGroups));
    assert.equal(await partsList.getAttribute("data-virtualised"), "false", "33 rows is a list, not a scrolling problem");
    assert.equal(await partsList.getAttribute("data-window"), `0-${modelGroups}`, "so the window is the whole list");
    out.layersDock = { counts: await sectionCounts(), dockPx: dockBox.client, listPx: dockBox.scroll, virtualised: false };

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

    /* ---- 9. the document bar: everything that is not a selection (U7) ---- */
    const docBar = page.getByTestId("document-bar");
    await docBar.waitFor({ timeout: 20000 });
    const { data: designRow } = await admin.from("designs").select("name").eq("id", designId).single();
    assert.equal((await docBar.getByTestId("document-name").innerText()).trim(), designRow.name, "the bar names the design");
    assert.equal(await docBar.getByTestId("undo").count(), 1, "undo is a document verb, not a layer group's (E2 §3.4 item 4)");
    assert.equal(await docBar.getByTestId("redo").count(), 1);
    assert.equal(await page.getByTestId("branding-group").getByTestId("undo").count(), 0, "and it has left BrandingGroup");
    assert.equal(await page.getByTestId("undo").count(), 1, "exactly one undo on the page — the suite's bare selectors stay unambiguous");

    // The history still works from its new home, on the layer added in step 5.
    assert.equal(await page.getByTestId("undo").isDisabled(), false, "there is something to undo");
    await page.getByTestId("undo").click();
    await waitForRecipe(page, admin, designId, (r) => (r.zones?.length ?? 0) === 0, "undo from the document bar");
    await page.getByTestId("redo").click();
    await waitForRecipe(page, admin, designId, (r) => (r.zones?.length ?? 0) === 1, "and redo");

    // The way back to the design list, which is what 7a left owed.
    const link = docBar.getByTestId("document-designs-link");
    assert.equal(await link.count(), 1, "the bar is the way back to the design list");
    await link.click();
    await page.waitForURL((u) => u.pathname === "/designer-studio/designs", { timeout: 30000 });
    await page.locator(`[data-testid="design-row"][data-design-id="${designId}"]`).waitFor({ timeout: 30000 });
    out.documentBar = { name: designRow.name, history: "undo/redo in the bar", link: "/designer-studio/designs" };

    await page.goto(`${base}/designer-studio/editor/${designId}`, { waitUntil: "networkidle" });
    await panel.waitFor({ timeout: 30000 });

    /* ---- 8. calibration renders the default whatever is stored ---- */
    await menuItem(page, "workspace-dock");
    await page.waitForFunction(() => document.querySelector('[data-testid="workspace"]')?.getAttribute("data-side") === "left", null, { timeout: 10000 });
    await page.goto(`${base}/designer-studio/editor/${designId}?calibration=1`, { waitUntil: "networkidle" });
    await panel.waitFor({ timeout: 30000 });
    assert.deepEqual(await layoutOf(), { side: "right", collapsed: false, width: DEFAULT_WIDTH }, "calibration ignores a stored layout");
    assert.equal(await page.getByTestId("workspace-resize").count(), 0, "and draws none of the workspace chrome");
    assert.equal(await page.getByTestId("layers-dock").count(), 1, "the layers dock is content, not chrome, so it is drawn (U5)");
    assert.equal(await page.getByTestId("document-bar").count(), 0, "nor the document bar, which has height (U7)");
    assert.equal((await storedLayout()).value.side, "left", "without forgetting what the buyer chose");
    out.calibration = "default layout, no chrome, no document bar";

    return out;
  } finally {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
