// Phase 4h — hybrid numeric / slider controls in "Position and curve"
// (E1 §5 row 4h, C3, C7; rulings §3), plus the camera framing check (R3).
//
// Anonymous on the Polo at 10.8 mm: the framed home direction is the
// render-calibration baseline (elevation 30°, azimuth −25°) and the camera
// starts there with the decorated face (+Z) toward it. Signed in: add
// "POLO"; straight layout shows centre X/Y and rotation only; Circular
// shows the arc switch, radius, start/end, arc position. Type radius 4 →
// every rendered glyph at radius 4.000 (live) and read-back 4. ArrowUp /
// Shift / Alt on the radius field → +0.01 / +0.1 / +0.001 mm; on arc
// position → +0.1 / +1 / +0.01° (read-backs). Widen the start/end range →
// `letter_spacing_mm` increases, `radius_mm` fixed (read-back); drag the band
// → arc position moves, spacing fixed. A slider drag updates the numeric
// field to the stored value. Bottom arc → `ccw` at 180°. At 390 px the panel
// stacks under the viewport and nothing overflows horizontally.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { POLO_OBJ } from "../lib/calibration.mjs";
import { REPO_ROOT } from "../lib/stack.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";
import { layoutText, textArc } from "../../../src/features/editor/lib/textLayout.ts";

const EPS = 1e-9;
const deg = Math.PI / 180;
const HOME = [Math.cos(30 * deg) * Math.sin(-25 * deg), Math.sin(30 * deg), Math.cos(30 * deg) * Math.cos(-25 * deg)];

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
    .limit(6);
  const product = products[5]; // distinct from editor-shell [0], editor-scale [1], ruler-buyer [2], text-layer [3], circular-text [4]
  assert.ok(product, "a sixth sample product exists");

  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const modelPath = `models/${product.id}/e2e-hybrid-controls.obj`;
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
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-HYBRID-001" })
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

  const viewport = () => page.getByTestId("editor-viewport");
  const readRecipe = async (designId) => {
    const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (error) throw new Error(error.message);
    return data.draft_recipe;
  };
  const waitForRecipe = async (designId, predicate, label, timeout = 15000) => {
    const deadline = Date.now() + timeout;
    let recipe;
    while (Date.now() < deadline) {
      recipe = await readRecipe(designId);
      if (recipe?.layers?.[0] && predicate(recipe.layers[0])) return recipe.layers[0];
      await page.waitForTimeout(400);
    }
    throw new Error(`${label}: read-back never matched, last ${JSON.stringify(recipe?.layers?.[0])}`);
  };
  const glyphs = async () => JSON.parse((await viewport().getAttribute("data-glyphs")) ?? "[]");
  const vec = (text) => text.split(",").map(Number);
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const dragBy = async (locator, dx) => {
    const box = await locator.boundingBox();
    const x = box.x + box.width / 2;
    const y = box.y + box.height / 2;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 6; i++) await page.mouse.move(x + (dx * i) / 6, y);
    await page.mouse.up();
  };

  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);

    /* ---- R3: framing on load, anonymous, no interaction ---- */
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.evaluate(() => window.sessionStorage.clear());
    await page.goto(`${base}/designer-studio/editor/new?product=${product.slug}`, { waitUntil: "domcontentloaded" });
    const canvas = viewport().locator("canvas").first();
    await page.waitForFunction(
      () => {
        const c = document.querySelector('[data-testid="editor-viewport"] canvas');
        return !!(c?.dataset.cameraHome && c?.dataset.cameraDirection);
      },
      null,
      { timeout: 30000 },
    );
    const home = vec(await canvas.getAttribute("data-camera-home"));
    const initial = vec(await canvas.getAttribute("data-camera-direction"));
    for (let i = 0; i < 3; i++) assert.ok(Math.abs(home[i] - HOME[i]) <= 0.002, `home direction ${home} vs baseline ${HOME.map((v) => v.toFixed(3))}`);
    const drift = Math.acos(Math.min(1, dot(initial, HOME))) / deg;
    assert.ok(drift <= 10, `initial camera direction ${initial} is ${drift.toFixed(1)}° from the three-quarter home`);
    assert.ok(initial[2] >= 0.7, `decorated face (+Z) toward the camera on load (z ${initial[2]})`);
    out.camera = { home, initial, driftDeg: +drift.toFixed(2) };

    /* ---- signed in: a design, "POLO" ---- */
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/designer-studio/editor/new?product=${product.slug}`, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    await canvas.waitFor({ timeout: 20000 });
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("POLO");

    /* ---- straight: centre X/Y and rotation, no arc controls ---- */
    await page.getByTestId("position-and-curve-toggle").click();
    for (const id of ["pc-centre-x", "pc-centre-y", "pc-rotation", "pc-text-size", "pc-letter-spacing", "pc-baseline"]) {
      assert.equal(await page.getByTestId(id).count(), 1, `straight shows ${id}`);
    }
    for (const id of ["pc-radius", "pc-arc-range", "pc-arc-position", "pc-arc"]) {
      assert.equal(await page.getByTestId(id).count(), 0, `straight hides ${id}`);
    }
    for (const id of ["emboss", "deboss", "relief"]) {
      assert.equal(await page.locator(`[data-testid*="${id}"]`).count(), 0, `no ${id} control before Phase 5`);
    }

    /* ---- circular ---- */
    await page.locator('[data-testid="text-layer-layout"] [data-value="circle"]').click();
    for (const id of ["pc-arc", "pc-radius", "pc-arc-range", "pc-arc-position", "pc-text-size", "pc-letter-spacing", "pc-baseline"]) {
      assert.equal(await page.getByTestId(id).count(), 1, `circle shows ${id}`);
    }
    assert.equal(await page.getByTestId("pc-centre-x").count(), 0, "circle hides centre X");
    assert.equal(await page.locator('[data-testid="pc-arc"] [data-value="top"]').getAttribute("aria-checked"), "true", "a new circle is on the top arc");

    /* ---- type radius 4 → glyphs at 4.000 live, read-back ---- */
    const radiusInput = page.getByTestId("pc-radius-input");
    await radiusInput.fill("4");
    await page.waitForFunction(
      () => {
        const g = JSON.parse(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-glyphs") ?? "[]");
        return g.length === 4 && g.every((p) => Math.abs(Math.hypot(p.x, p.y) - 4) <= 0.001);
      },
      null,
      { timeout: 10000 },
    ).catch(async (e) => {
      throw new Error(`${e.message}; glyphs ${JSON.stringify(await glyphs())}; input ${await radiusInput.inputValue()}; recipe ${JSON.stringify((await readRecipe(designId))?.layers?.[0]?.placement)}`);
    });
    const live = (await glyphs()).map((g) => +Math.hypot(g.x, g.y).toFixed(4));
    let layer = await waitForRecipe(designId, (l) => l.placement.layout === "circle" && l.placement.radius_mm === 4, "radius 4");
    const expected = layoutText(font, layer);
    live.forEach((r, i) => assert.ok(Math.abs(r - expected[i].radiusMm) <= 0.001, `glyph ${i} radius ${r}`));
    out.radius4 = live;

    /* ---- key steps (C3) ---- */
    const steps = async (testId, field, cases) => {
      const input = page.getByTestId(testId);
      await input.focus();
      const got = [];
      for (const [key, delta] of cases) {
        const before = field(layer);
        await page.keyboard.press(key);
        layer = await waitForRecipe(designId, (l) => Math.abs(field(l) - (before + delta)) <= EPS, `${testId} ${key}`);
        got.push(+(field(layer) - before).toFixed(6));
      }
      await input.blur();
      return got;
    };
    out.mmSteps = await steps("pc-radius-input", (l) => l.placement.radius_mm, [
      ["ArrowUp", 0.01],
      ["Shift+ArrowUp", 0.1],
      ["Alt+ArrowUp", 0.001],
    ]);
    assert.ok(Math.abs(layer.placement.radius_mm - 4.111) <= EPS, `radius after steps ${layer.placement.radius_mm}`);
    out.degSteps = await steps("pc-arc-position-input", (l) => l.placement.arc_position_deg, [
      ["ArrowUp", 0.1],
      ["Shift+ArrowUp", 1],
      ["Alt+ArrowUp", 0.01],
    ]);
    assert.equal(await radiusInput.inputValue(), "4.11", "mm at rest shows 2 dp");

    /* ---- widen the range → letter spacing up, radius fixed ---- */
    const radiusBefore = layer.placement.radius_mm;
    const spacingBefore = layer.style.letter_spacing_mm;
    const spanBefore = textArc(font, layer).spanDeg;
    await dragBy(page.getByTestId("pc-arc-range-high-handle"), 30);
    layer = await waitForRecipe(designId, (l) => l.style.letter_spacing_mm > spacingBefore + 1e-6, "widened range");
    assert.equal(layer.placement.radius_mm, radiusBefore, "radius_mm fixed while widening (C7)");
    assert.ok(textArc(font, layer).spanDeg > spanBefore, "span widened");
    out.widen = { spacingBefore, spacingAfter: layer.style.letter_spacing_mm, radius: layer.placement.radius_mm };

    /* ---- drag the band → arc position moves, spacing fixed ---- */
    const arcBefore = layer.placement.arc_position_deg;
    const spacingKept = layer.style.letter_spacing_mm;
    await dragBy(page.getByTestId("pc-arc-range-band"), -40);
    layer = await waitForRecipe(designId, (l) => l.placement.arc_position_deg < arcBefore - 1, "band drag");
    assert.ok(Math.abs(layer.style.letter_spacing_mm - spacingKept) <= EPS, "band drag keeps letter spacing");
    assert.equal(layer.placement.radius_mm, radiusBefore, "band drag keeps radius");
    out.band = { arcBefore, arcAfter: layer.placement.arc_position_deg };

    /* ---- slider drag updates the numeric field ---- */
    const sizeBefore = layer.style.text_size_mm;
    await dragBy(page.getByTestId("pc-text-size-handle"), 40);
    layer = await waitForRecipe(designId, (l) => l.style.text_size_mm > sizeBefore + 0.01, "text size drag");
    await page.waitForTimeout(300);
    assert.equal(await page.getByTestId("pc-text-size-input").inputValue(), layer.style.text_size_mm.toFixed(2), "field shows the dragged value");
    out.sizeDrag = { before: sizeBefore, after: layer.style.text_size_mm };

    /* ---- bottom arc = ccw at 180° ---- */
    await page.locator('[data-testid="pc-arc"] [data-value="bottom"]').click();
    layer = await waitForRecipe(designId, (l) => l.placement.direction === "ccw" && l.placement.arc_position_deg === 180, "bottom arc");
    await page.waitForFunction(
      () => JSON.parse(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-glyphs") ?? "[]").every((g) => g.y < 0),
      null,
      { timeout: 10000 },
    );

    /* ---- 390 px: stacked, no horizontal overflow ---- */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(600);
    const layoutCheck = await page.evaluate(() => {
      const panel = document.querySelector('[data-testid="editor-panel"]').getBoundingClientRect();
      const view = document.querySelector('[data-testid="editor-viewport"]').getBoundingClientRect();
      const offenders = [...document.querySelectorAll('[data-testid="position-and-curve"] *')]
        .map((el) => ({ id: el.getAttribute("data-testid") ?? el.tagName, r: el.getBoundingClientRect() }))
        .filter(({ r }) => r.width > 0 && (r.left < -0.5 || r.right > window.innerWidth + 0.5))
        .map(({ id, r }) => `${id} ${r.left.toFixed(1)}–${r.right.toFixed(1)}`);
      return {
        scrollWidth: document.documentElement.scrollWidth,
        panelTop: panel.top,
        viewportBottom: view.bottom,
        viewportHeight: view.height,
        offenders,
      };
    });
    assert.ok(layoutCheck.scrollWidth <= 390, `page scroll width ${layoutCheck.scrollWidth} at 390 px`);
    assert.ok(layoutCheck.panelTop >= layoutCheck.viewportBottom - 1, `panel stacks below the viewport ${JSON.stringify(layoutCheck)}`);
    assert.ok(layoutCheck.viewportHeight >= 200, `viewport keeps height with the disclosure open (${layoutCheck.viewportHeight})`);
    assert.deepEqual(layoutCheck.offenders, [], "no control overflows horizontally");
    out.mobile = layoutCheck;

    return out;
  } finally {
    await restore();
  }
}
