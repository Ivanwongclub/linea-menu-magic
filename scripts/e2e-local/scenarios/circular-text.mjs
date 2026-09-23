// Phase 4g — circular layout, per-glyph placement (E1 §5 row 4g, C7, §3.3;
// rulings §5; E1 §6 R2).
//
// Signed in on the Polo at 10.8 mm: add "POLO", switch to Circular through
// the panel (read-back `layout: circle` at the 0.35 × diameter fallback
// radius). Staged at radius 3.63, cw at 0° → every rendered glyph's centre
// angle matches `layoutText` ± 0.01° and its radius ± 0.001 mm, conformed
// to the surface. ccw at 180° → glyph screen x increases in reading order
// from the home camera. Every model and glyph world matrix has determinant
// > 0 in both directions. Typing a fifth character leaves `radius_mm`
// unchanged (read-back): the span grows instead (preserve radius, C7).
//
// Radius, arc position and direction have no panel control until 4h, so
// those two states are staged into `draft_recipe` and the page reloaded;
// the layout switch and the added character are driven through the UI.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { POLO_OBJ } from "../lib/calibration.mjs";
import { onlyLayerRow } from "../lib/appearance.mjs";
import { REPO_ROOT } from "../lib/stack.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";
import { layoutText, normalizeDeg, textArc } from "../../../src/features/editor/lib/textLayout.ts";

const RADIUS = 3.63;
const ANGLE_TOL = 0.01;
const RADIUS_TOL = 0.001;

export default async function ({ page, base, admin, editor, h }) {
  const font = JSON.parse(readFileSync(path.join(REPO_ROOT, "public/fonts/poppins-semibold.typeface.json"), "utf8"));

  const { data: products } = await admin
    .from("products")
    .select(
      "id, slug, name, item_code, model_storage_path, status, is_public, brand_id, " +
        "model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id",
    )
    .like("slug", "sample-%")
    .order("slug")
    .limit(5);
  const product = products[4]; // distinct from editor-shell [0], editor-scale [1], ruler-buyer [2], text-layer [3]

  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const modelPath = `models/${product.id}/e2e-circular-text.obj`;
  const uploaded = await admin.storage
    .from("product-models")
    .upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (uploaded.error) throw new Error(uploaded.error.message);
  const variant = await admin
    .from("product_size_variants")
    .insert({ product_id: product.id, size_label: "10.8mm", size_primary_mm: 10.8, is_default: true, sort_order: 900 })
    .select("id")
    .single();
  if (variant.error) throw new Error(variant.error.message);
  const setModel = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-CIRCLE-001" })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);
  const confirm = await admin
    .from("products")
    .update({ model_scale_status: "confirmed", model_scale_factor: factor, model_scale_method: "unit_mm", model_scale_reference_variant_id: variant.data.id })
    .eq("id", product.id);
  if (confirm.error) throw new Error(confirm.error.message);

  const restore = async () => {
    await admin
      .from("products")
      .update({
        model_storage_path: product.model_storage_path,
        status: product.status,
        is_public: product.is_public,
        brand_id: product.brand_id,
        item_code: product.item_code,
        model_scale_status: product.model_scale_status ?? "unconfirmed",
        model_scale_factor: product.model_scale_factor ?? null,
        model_scale_method: product.model_scale_method ?? null,
        model_scale_reference_variant_id: product.model_scale_reference_variant_id ?? null,
      })
      .eq("id", product.id);
    await admin.storage.from("product-models").remove([modelPath]);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await admin.from("product_size_variants").delete().eq("id", variant.data.id);
  };

  const readRecipe = async (designId) => {
    const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (error) throw new Error(error.message);
    return data.draft_recipe;
  };
  const waitForRecipe = async (designId, predicate, label, timeout = 12000) => {
    const deadline = Date.now() + timeout;
    let recipe;
    while (Date.now() < deadline) {
      recipe = await readRecipe(designId);
      if (predicate(recipe)) return recipe;
      await page.waitForTimeout(400);
    }
    throw new Error(`${label}: read-back never matched, last ${JSON.stringify(recipe)}`);
  };
  const viewport = () => page.getByTestId("editor-viewport");
  const renderedGlyphs = async (count) => {
    await page.waitForFunction(
      (want) => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-glyph-count") === String(want),
      count,
      { timeout: 20000 },
    );
    return {
      glyphs: JSON.parse(await viewport().getAttribute("data-glyphs")),
      minDet: Number(await viewport().getAttribute("data-min-world-determinant")),
    };
  };
  /** Stage placement fields the panel doesn't expose until 4h, then reload onto them. */
  const stagePlacement = async (designId, placement) => {
    const recipe = await readRecipe(designId);
    recipe.layers[0].placement = { ...recipe.layers[0].placement, ...placement };
    const { error } = await admin.from("designs").update({ draft_recipe: recipe }).eq("id", designId);
    if (error) throw new Error(error.message);
    await page.reload({ waitUntil: "networkidle" });
    await viewport().locator("canvas").first().waitFor({ timeout: 20000 });
    return recipe.layers[0];
  };
  const assertOnLayout = (layer, glyphs, label) => {
    const expected = layoutText(font, layer);
    assert.equal(glyphs.length, expected.length, `${label}: one mesh per glyph`);
    return glyphs.map((g, i) => {
      const angle = normalizeDeg((Math.atan2(g.x, g.y) * 180) / Math.PI);
      const radius = Math.hypot(g.x, g.y);
      let dAngle = Math.abs(angle - expected[i].angleDeg);
      dAngle = Math.min(dAngle, 360 - dAngle);
      assert.ok(dAngle <= ANGLE_TOL, `${label} glyph ${i} (${g.char}) angle ${angle} vs layout ${expected[i].angleDeg}`);
      assert.ok(Math.abs(radius - expected[i].radiusMm) <= RADIUS_TOL, `${label} glyph ${i} radius ${radius} vs ${expected[i].radiusMm}`);
      assert.equal(g.conformed, true, `${label} glyph ${i} landed on the surface`);
      assert.ok(g.upZ > 0, `${label} glyph ${i} faces out of the face`);
      return { char: g.char, angle: +angle.toFixed(3), radius: +radius.toFixed(4) };
    });
  };

  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.goto(`${base}/designer-studio/editor/new?product=${product.slug}`, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    await viewport().locator("canvas").first().waitFor({ timeout: 20000 });

    /* ---- add "POLO" and switch to Circular through the panel ---- */
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("POLO");
    await renderedGlyphs(4);
    const layoutSwitch = page.getByTestId("text-layer-layout");
    assert.equal(await layoutSwitch.locator('[data-value="straight"]').getAttribute("aria-checked"), "true", "a new layer is straight");
    await layoutSwitch.locator('[data-value="circle"]').click();
    assert.equal(await layoutSwitch.locator('[data-value="circle"]').getAttribute("aria-checked"), "true");
    const switched = await waitForRecipe(designId, (r) => r?.layers?.[0]?.placement?.layout === "circle", "layout switch");
    assert.ok(Math.abs(switched.layers[0].placement.radius_mm - 0.35 * 10.8) < 1e-9, "fallback radius 0.35 × face diameter");
    assert.equal(switched.layers[0].placement.direction, "cw", "fallback direction cw");
    assert.equal(switched.layers[0].placement.arc_position_deg, 0, "fallback arc position 0°");
    const atFallback = await renderedGlyphs(4);
    assertOnLayout(switched.layers[0], atFallback.glyphs, "fallback");
    await page.waitForFunction(() => document.querySelector('[data-testid="autosave-status"]')?.getAttribute("data-status") === "saved", null, {
      timeout: 15000,
    });

    /* ---- radius 3.63, cw at 0° ---- */
    const cwLayer = await stagePlacement(designId, { radius_mm: RADIUS, arc_position_deg: 0, direction: "cw" });
    const cw = await renderedGlyphs(4);
    const cwMeasured = assertOnLayout(cwLayer, cw.glyphs, "cw 0°");
    assert.ok(cw.minDet > 0, `cw: every world determinant > 0 (min ${cw.minDet})`);
    const cwArc = textArc(font, cwLayer);

    /* ---- ccw at 180°: screen x increases in reading order ---- */
    const ccwLayer = await stagePlacement(designId, { radius_mm: RADIUS, arc_position_deg: 180, direction: "ccw" });
    const ccw = await renderedGlyphs(4);
    const ccwMeasured = assertOnLayout(ccwLayer, ccw.glyphs, "ccw 180°");
    assert.ok(ccw.minDet > 0, `ccw: every world determinant > 0 (min ${ccw.minDet})`);
    assert.ok(ccw.glyphs.every((g) => g.y < 0), "ccw 180° sits on the bottom arc");

    // Home view: stop the idle rotation, double-click back to the framed camera, let damping settle.
    const canvas = viewport().locator("canvas").first();
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(1800);
    const screenX = JSON.parse(await canvas.getAttribute("data-glyph-screen-x"));
    assert.equal(screenX.length, 4);
    for (let i = 1; i < screenX.length; i++) {
      assert.ok(screenX[i] > screenX[i - 1], `ccw glyph ${i} screen x ${screenX[i]} > ${screenX[i - 1]} — reads left to right, not mirrored`);
    }

    /* ---- add a character through the panel: radius unchanged, span grows ---- */
    await (await onlyLayerRow(page)).getByTestId("text-layer-select").click();
    await page.getByTestId("text-layer-content").fill("POLOS");
    const grown = await waitForRecipe(designId, (r) => r?.layers?.[0]?.content?.value === "POLOS", "added character");
    assert.equal(grown.layers[0].placement.radius_mm, RADIUS, "radius_mm unchanged after adding a character (read-back)");
    assert.equal(grown.layers[0].placement.arc_position_deg, 180, "arc position unchanged");
    const five = await renderedGlyphs(5);
    assertOnLayout(grown.layers[0], five.glyphs, "POLOS");
    assert.ok(five.minDet > 0);
    assert.ok(textArc(font, grown.layers[0]).spanDeg > textArc(font, ccwLayer).spanDeg, "the span grows instead of the radius");

    return {
      designId,
      cw: cwMeasured,
      cwSpanDeg: +cwArc.spanDeg.toFixed(3),
      ccw: ccwMeasured,
      ccwScreenX: screenX.map((x) => +x.toFixed(1)),
      minDet: Math.min(cw.minDet, ccw.minDet, five.minDet),
      radiusAfterAdd: grown.layers[0].placement.radius_mm,
    };
  } finally {
    await restore();
  }
}
