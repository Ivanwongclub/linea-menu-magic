// Phase 5 — relief per layer, the manufacturing strip, the ruler callout (R7).
//
// On the Polo staged at 15 mm with a roll-plated finish, as a signed-in buyer:
//   1. A new text layer starts at the process's own minimum depth, raised.
//   2. Raised 0.30 → every glyph is an extrusion standing 0.30 mm ± 0.01 above
//      the surface along its own normal; the recipe stores {type, depth, bevel}.
//   3. Engraved 0.25 → the recess floor sits 0.25 mm ± 0.01 below the surface
//      and has walls of its own, drawn through a stencil opening.
//   4. Undo takes the relief type back (and redo returns it).
//   5. 0.6 mm text trips the stroke check against min_feature 0.20 mm, in the
//      wording of v3-review §5.
//   6. With the process's thresholds cleared, a buyer sees nothing at all and
//      designer staff see which process is missing its numbers.
//   7. The ruler carries the engrave-depth callout at 2 dp.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POLO_OBJ, stageProduct } from "../lib/calibration.mjs";
import { onlyLayerRow } from "../lib/appearance.mjs";

const PRODUCT_SLUG = "sample-eyelets-rivets";
const MIN_FEATURE_MM = 0.2;
const MIN_DEPTH_MM = 0.15;
const MAX_DEPTH_MM = 0.5;

export default async function ({ page, base, admin, editor, h }) {
  const { data: product, error: productError } = await admin
    .from("products")
    .select("id, slug, item_code, model_storage_path, status, is_public, brand_id, default_finish_id, model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id")
    .eq("slug", PRODUCT_SLUG)
    .single();
  if (productError) throw new Error(productError.message);

  const { data: process, error: processError } = await admin
    .from("finish_processes")
    .select("id, name, min_feature_mm, min_deboss_depth_mm, max_deboss_depth_mm")
    .eq("code", "ROLL")
    .single();
  if (processError) throw new Error(processError.message);

  const { data: finishes, error: finishError } = await admin
    .from("finishes")
    .select("id, cyc_code, process_id, two_tone")
    .eq("process_id", process.id)
    .eq("two_tone", false)
    .order("cyc_code")
    .limit(1);
  if (finishError) throw new Error(finishError.message);
  const finish = finishes[0];
  assert.ok(finish, "a roll-plated finish exists");

  const setThresholds = async (values) => {
    const { error } = await admin.from("finish_processes").update(values).eq("id", process.id);
    if (error) throw new Error(error.message);
  };

  const staged = await stageProduct(admin, product, {
    modelPath: `models/${product.id}/e2e-relief-layers.obj`,
    modelBody: readFileSync(POLO_OBJ),
    finishIds: [finish.id],
    defaultFinishId: finish.id,
  });
  await setThresholds({ min_feature_mm: MIN_FEATURE_MM, min_deboss_depth_mm: MIN_DEPTH_MM, max_deboss_depth_mm: MAX_DEPTH_MM });

  const viewport = () => page.getByTestId("editor-viewport");
  const url = `${base}/designer-studio/editor/new?product=${product.slug}`;
  const readRecipe = async (designId) => {
    const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (error) throw new Error(error.message);
    return data.draft_recipe;
  };
  const waitForRecipe = async (designId, predicate, label, timeout = 20000) => {
    const deadline = Date.now() + timeout;
    let recipe;
    while (Date.now() < deadline) {
      recipe = await readRecipe(designId);
      if (recipe && predicate(recipe)) return recipe;
      await page.waitForTimeout(300);
    }
    throw new Error(`${label}: read-back never matched, last ${JSON.stringify(recipe?.layers)}`);
  };
  /** What the layer's relief actually became on screen. */
  const reliefReport = async (predicate, label, timeout = 20000) => {
    const deadline = Date.now() + timeout;
    let last;
    while (Date.now() < deadline) {
      last = JSON.parse((await viewport().getAttribute("data-reliefs")) ?? "[]");
      if (last.length === 1 && predicate(last[0])) return last[0];
      await page.waitForTimeout(250);
    }
    throw new Error(`${label}: the scene never matched, last ${JSON.stringify(last)}`);
  };
  const setDepth = async (mm) => {
    const input = page.getByTestId("relief-depth-input");
    await input.fill(String(mm));
    await input.blur();
  };
  const reliefType = async () => page.getByTestId("layer-relief").getAttribute("data-type");
  const warnings = async () => {
    const lines = page.locator('[data-testid="manufacturing-warning"]');
    const count = await lines.count();
    const out = [];
    for (let i = 0; i < count; i++) {
      out.push({ kind: await lines.nth(i).getAttribute("data-kind"), text: (await lines.nth(i).innerText()).trim() });
    }
    return out;
  };

  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await admin.from("designer_staff").delete().eq("user_id", editor.userId);

    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    await viewport().locator("canvas").first().waitFor({ timeout: 30000 });

    /* ---- 1. a new layer starts at the process's own minimum, raised ---- */
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("POLO");
    await page.getByTestId("text-layer-content").blur();
    const created = await waitForRecipe(designId, (r) => r.layers?.[0]?.content?.value === "POLO", "layer created");
    assert.deepEqual(created.layers[0].relief, { type: "emboss", depth_mm: MIN_DEPTH_MM, bevel_mm: 0.05 }, "R1: default depth is the process minimum, bevel 0.05");
    assert.equal(await reliefType(), "emboss", "a new layer is raised");
    out.defaultRelief = created.layers[0].relief;

    /* ---- 2. raised 0.30 mm along the normal ---- */
    await setDepth(0.3);
    const raisedRecipe = await waitForRecipe(designId, (r) => r.layers[0].relief.depth_mm === 0.3, "raised depth stored");
    assert.deepEqual(raisedRecipe.layers[0].relief, { type: "emboss", depth_mm: 0.3, bevel_mm: 0.05 });
    const raised = await reliefReport((r) => r.type === "emboss" && r.pieces === 4 && r.heightMm != null, "raised relief");
    assert.ok(Math.abs(raised.heightMm[0] - 0.3) <= 0.01 && Math.abs(raised.heightMm[1] - 0.3) <= 0.01, `every glyph stands 0.30 mm proud, got ${JSON.stringify(raised.heightMm)}`);
    assert.equal(raised.floorMm, null, "a raised layer carves nothing");
    assert.ok(raised.anchor && Math.abs(Math.hypot(raised.anchor.nx, raised.anchor.ny, raised.anchor.nz) - 1) < 1e-6, "the relief runs along a unit surface normal");
    out.raised = { heightMm: raised.heightMm, pieces: raised.pieces };

    /* ---- 3. engraved 0.25 mm: a floor with walls, through the opening ---- */
    await page.getByTestId("relief-type").getByRole("radio", { name: /engraved/i }).click();
    await setDepth(0.25);
    const engravedRecipe = await waitForRecipe(designId, (r) => r.layers[0].relief.type === "deboss" && r.layers[0].relief.depth_mm === 0.25, "engraved depth stored");
    assert.deepEqual(engravedRecipe.layers[0].relief, { type: "deboss", depth_mm: 0.25, bevel_mm: 0.05 });
    const engraved = await reliefReport((r) => r.type === "deboss" && r.floorMm != null && r.pieces === 4, "engraved relief");
    assert.ok(
      Math.abs(engraved.floorMm[0] + 0.25) <= 0.01 && Math.abs(engraved.floorMm[1] + 0.25) <= 0.01,
      `the recess floor lies 0.25 mm below the surface, got ${JSON.stringify(engraved.floorMm)}`,
    );
    assert.equal(engraved.heightMm, null, "an engraved layer stands nothing proud");
    assert.equal(engraved.wallMeshes, 4, "every glyph's recess has its own walls");
    assert.equal(engraved.openingMeshes, 8, "every glyph has a stencil mask and a depth punch");
    assert.ok(Math.abs(engraved.wallSpanMm[0] + 0.25) <= 0.01, `the walls reach the floor, got ${JSON.stringify(engraved.wallSpanMm)}`);
    assert.ok(engraved.wallSpanMm[1] >= 0, "the walls reach the opening");
    out.engraved = { floorMm: engraved.floorMm, wallSpanMm: engraved.wallSpanMm, wallMeshes: engraved.wallMeshes };

    /* ---- 4. undo takes the relief type back ---- */
    await page.getByTestId("undo").click();
    await page.getByTestId("undo").click();
    assert.equal(await reliefType(), "emboss", "undo restores the relief type");
    const undone = await reliefReport((r) => r.type === "emboss", "undo re-raises the glyphs");
    assert.ok(Math.abs(undone.heightMm[0] - 0.3) <= 0.01, "and the depth it had before");
    await page.getByTestId("redo").click();
    await page.getByTestId("redo").click();
    assert.equal(await reliefType(), "deboss", "redo puts the engraving back");
    await reliefReport((r) => r.type === "deboss" && Math.abs(r.depthMm - 0.25) < 1e-9, "redo restores the depth");
    out.undo = "emboss → deboss → undo → emboss → redo → deboss";

    /* ---- 5. the stroke check, in the review's own wording ---- */
    assert.deepEqual(await warnings(), [], "nothing to warn about at the default text size");
    await page.getByTestId("position-and-curve-toggle").click();
    await page.getByTestId("pc-text-size-input").fill("0.6");
    await page.getByTestId("pc-text-size-input").blur();
    await page.waitForFunction(
      () => document.querySelector('[data-testid="manufacturing-strip"]')?.getAttribute("data-warning-count") !== "0",
      null,
      { timeout: 20000 },
    );
    const thin = await warnings();
    const stroke = thin.find((w) => w.kind === "stroke");
    assert.ok(stroke, `the strip names the thin stroke, got ${JSON.stringify(thin)}`);
    assert.match(stroke.text, /^⚠ Letter stroke 0\.\d{2} mm — below the 0\.20 mm minimum for roll plating$/, stroke.text);
    const measured = Number(await page.locator('[data-testid="manufacturing-warning"][data-kind="stroke"]').getAttribute("data-value-mm"));
    assert.ok(measured > 0 && measured < MIN_FEATURE_MM, `the measured stroke ${measured} is below the threshold`);
    out.stroke = { text: stroke.text, measuredMm: +measured.toFixed(4) };

    /* ---- 6. a null threshold: nothing for a buyer, a line for staff ---- */
    await setThresholds({ min_feature_mm: null, min_deboss_depth_mm: null, max_deboss_depth_mm: null });
    await page.reload({ waitUntil: "networkidle" });
    await viewport().locator("canvas").first().waitFor({ timeout: 30000 });
    await page.getByTestId("manufacturing-strip").waitFor({ timeout: 20000 });
    await page.waitForTimeout(1500);
    assert.deepEqual(await warnings(), [], "with no thresholds there is nothing a buyer can be told");
    assert.equal(await page.getByTestId("manufacturing-no-thresholds").count(), 0, "and a buyer is not shown WIN-CYC's own gap");

    const grant = await admin.from("designer_staff").upsert({ user_id: editor.userId });
    if (grant.error) throw new Error(grant.error.message);
    await page.reload({ waitUntil: "networkidle" });
    await viewport().locator("canvas").first().waitFor({ timeout: 30000 });
    const staffLine = page.getByTestId("manufacturing-no-thresholds");
    await staffLine.waitFor({ timeout: 20000 });
    const staffText = (await staffLine.innerText()).trim();
    assert.equal(staffText, `No manufacturing thresholds set for ${process.name.toLowerCase()}`, staffText);
    assert.deepEqual(await warnings(), [], "a missing threshold is never a warning");
    out.staffLine = staffText;

    /* ---- U10: the strip is a verdict, spanning the whole workspace ---- */
    const strip = page.getByTestId("manufacturing-strip");
    const stripBox = await strip.boundingBox();
    const workspaceBox = await page.getByTestId("workspace").boundingBox();
    const panelBox = await page.getByTestId("workspace-panel").boundingBox();
    assert.ok(Math.abs(stripBox.width - workspaceBox.width) <= 1, `the strip spans the workspace (${stripBox.width} vs ${workspaceBox.width})`);
    assert.ok(stripBox.width > panelBox.width + 100, "the viewport and the controls both, not one column (E2 §3.4 item 6)");
    assert.ok(stripBox.y >= workspaceBox.y + workspaceBox.height - 1, "and it sits under them");

    // A count, and the lines behind it. Expanded on a desk; the collapse is
    // what a phone gets by default, so the strip never eats the viewport it
    // is judging.
    assert.equal(await strip.getAttribute("data-collapsed"), "false", "open at this width");
    const shown = Number(await page.getByTestId("manufacturing-count").getAttribute("data-count"));
    assert.equal(shown, Number(await strip.getAttribute("data-warning-count")), "the badge is the strip's own count");
    await page.getByTestId("manufacturing-toggle").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="manufacturing-strip"]')?.getAttribute("data-collapsed") === "true", null, { timeout: 10000 });
    assert.equal(await page.getByTestId("manufacturing-lines").count(), 0, "collapsed, it is the verdict and nothing else");
    assert.equal(
      Number(await page.getByTestId("manufacturing-count").getAttribute("data-count")),
      shown,
      "and the count survives the collapse — that is what is left to read",
    );
    await page.getByTestId("manufacturing-toggle").click();
    await page.getByTestId("manufacturing-lines").waitFor({ timeout: 10000 });
    out.strip = { widthPx: Math.round(stripBox.width), workspacePx: Math.round(workspaceBox.width), count: shown };

    /* ---- 7. the ruler's relief callout (R4) ---- */
    await (await onlyLayerRow(page)).getByTestId("text-layer-select").click();
    await page.getByTestId("ruler-toggle").click();
    const callout = page.getByTestId("ruler-relief-label");
    await callout.waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="ruler-relief-label"]')?.style.visibility === "visible", null, { timeout: 20000 });
    assert.equal(await callout.getAttribute("data-relief"), "deboss");
    assert.equal(Number(await callout.getAttribute("data-value-mm")), 0.25);
    const calloutText = (await callout.innerText()).trim();
    assert.equal(calloutText, "Engrave depth 0.25 mm", calloutText);
    out.ruler = calloutText;

    return out;
  } finally {
    await admin.from("designer_staff").delete().eq("user_id", editor.userId);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await setThresholds({
      min_feature_mm: process.min_feature_mm,
      min_deboss_depth_mm: process.min_deboss_depth_mm,
      max_deboss_depth_mm: process.max_deboss_depth_mm,
    });
    await staged.restore();
  }
}
