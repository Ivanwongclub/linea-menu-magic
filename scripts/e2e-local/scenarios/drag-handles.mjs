// Phase 4i — drag handles on the model and undo / redo (E1 §5 row 4i;
// rulings §3; v3-review §1, §10).
//
// Signed in on the Polo at 10.8 mm with "POLO" on a circle:
//   1. Handles belong to the selected layer only; every hit area ≥ 24 px.
//   2. Drag the radius ring outward 40 px (mouse) → the numeric field grows
//      live during the drag, glyphs move, no write while dragging, exactly
//      one `designs` PATCH after pointer-up; read-back radius_mm matches the
//      field's stored value to 1e-6.
//   3. Drag the arc knob → arc_position_deg changes (read-back = field).
//   4. Undo (Cmd/Ctrl+Z) → the arc drag reverts (read-back); undo button →
//      the radius drag reverts; redo (Shift+Cmd/Ctrl+Z) and the redo button →
//      both return (read-backs). Buttons are disabled when there is nothing
//      to undo / redo; a typed field edit is one entry.
//   5. Touch: a finger drag on the radius ring (CDP touch events, pointer
//      type touch) → radius grows, one write (read-back).
//   6. Straight layout: the move handle drags `centre_mm` (read-back).
//   7. Ruler on: no ruler label overlaps a handle's hit area.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POLO_OBJ } from "../lib/calibration.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";

export default async function ({ page, base, admin, editor, h }) {
  const { data: products } = await admin
    .from("products")
    .select(
      "id, slug, name, item_code, model_storage_path, status, is_public, brand_id, " +
        "model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id",
    )
    .like("slug", "sample-%")
    .order("slug")
    .limit(7);
  const product = products[6]; // distinct from editor-shell [0] … hybrid-controls [5]
  assert.ok(product, "a seventh sample product exists");

  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const modelPath = `models/${product.id}/e2e-drag-handles.obj`;
  const up = await admin.storage.from("product-models").upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (up.error) throw new Error(up.error.message);
  const variant = await admin
    .from("product_size_variants")
    .insert({ product_id: product.id, size_label: "10.8mm", size_primary_mm: 10.8, is_default: true, sort_order: 900 })
    .select("id")
    .single();
  if (variant.error) throw new Error(variant.error.message);
  const setModel = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-DRAG-001" })
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
  const readLayer = async (designId) => {
    const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (error) throw new Error(error.message);
    return data.draft_recipe?.layers?.[0];
  };
  const waitForLayer = async (designId, predicate, label, timeout = 15000) => {
    const deadline = Date.now() + timeout;
    let layer;
    while (Date.now() < deadline) {
      layer = await readLayer(designId);
      if (layer && predicate(layer)) return layer;
      await page.waitForTimeout(300);
    }
    throw new Error(`${label}: read-back never matched, last ${JSON.stringify(layer?.placement)}`);
  };
  const fieldValue = async (testId) => Number(await page.getByTestId(testId).getAttribute("data-value"));
  const settled = () =>
    page.waitForFunction(() => document.querySelector('[data-testid="autosave-status"]')?.getAttribute("data-status") === "saved", null, { timeout: 15000 });

  // Count the autosave writes: PATCH /rest/v1/designs.
  let writes = 0;
  page.on("request", (req) => {
    if (req.method() === "PATCH" && /\/rest\/v1\/designs\b/.test(req.url())) writes++;
  });

  const handleCentre = async (testId) => {
    const g = page.getByTestId(testId);
    return { x: Number(await g.getAttribute("data-x")), y: Number(await g.getAttribute("data-y")) };
  };
  const overlayOrigin = async () => {
    const box = await page.getByTestId("layer-handles").boundingBox();
    return { x: box.x, y: box.y };
  };
  const mouseDrag = async (from, delta, steps = 8, midCheck) => {
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    for (let i = 1; i <= steps; i++) {
      await page.mouse.move(from.x + (delta.x * i) / steps, from.y + (delta.y * i) / steps);
      if (i === Math.floor(steps / 2) && midCheck) await midCheck();
    }
    await page.mouse.up();
  };

  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(`${base}/designer-studio/editor/new?product=${product.slug}`, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    await viewport().locator("canvas").first().waitFor({ timeout: 20000 });

    assert.equal(await page.getByTestId("undo").isDisabled(), true, "undo disabled on a fresh design");
    assert.equal(await page.getByTestId("redo").isDisabled(), true, "redo disabled on a fresh design");
    assert.equal(await page.getByTestId("layer-handles").count(), 0, "no handles without a selected layer");

    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("POLO");
    await page.getByTestId("text-layer-content").blur();
    await page.getByTestId("text-layer-layout").locator('[data-value="circle"]').click();
    await page.getByTestId("position-and-curve-toggle").click();
    await waitForLayer(designId, (l) => l.placement.layout === "circle" && l.content.value === "POLO", "circle POLO");
    await settled();
    await page.getByTestId("layer-handles").waitFor({ timeout: 10000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="layer-handles"]')?.style.visibility === "visible", null, { timeout: 10000 });
    assert.equal(await page.getByTestId("layer-handles").getAttribute("data-layer-id"), (await readLayer(designId)).id, "handles are the selected layer's");
    assert.equal(await page.getByTestId("handle-move").evaluate((el) => getComputedStyle(el).display), "none", "no move handle on a circle");

    /* ---- 1. hit areas ≥ 24 px ---- */
    const arcBox = await page.getByTestId("handle-arc").boundingBox();
    assert.ok(arcBox.width >= 24 && arcBox.height >= 24, `arc knob hit area ${arcBox.width}×${arcBox.height}`);
    const ringStroke = Number(await page.getByTestId("handle-radius").locator("path").first().getAttribute("stroke-width"));
    assert.ok(ringStroke >= 24, `ring hit stroke ${ringStroke}px`);
    out.hitAreas = { arc: [arcBox.width, arcBox.height], ringStroke };

    /* ---- 2. radius ring drag, mouse ---- */
    const origin = await overlayOrigin();
    const grab = JSON.parse(await page.getByTestId("handle-radius").getAttribute("data-grab"));
    const radiusBefore = await fieldValue("pc-radius-input");
    const glyphsBefore = await viewport().getAttribute("data-glyphs");
    writes = 0;
    let midRadius = null;
    let midWrites = null;
    await mouseDrag({ x: origin.x + grab.x, y: origin.y + grab.y }, { x: grab.dx * 40, y: grab.dy * 40 }, 8, async () => {
      midRadius = await fieldValue("pc-radius-input");
      midWrites = writes;
    });
    assert.ok(midRadius > radiusBefore, `the field grows live during the drag (${radiusBefore} → ${midRadius})`);
    assert.equal(midWrites, 0, "no autosave write while dragging");
    const radiusAfter = await fieldValue("pc-radius-input");
    assert.ok(radiusAfter > midRadius, `radius field after the drag ${radiusAfter}`);
    const dragged = await waitForLayer(designId, (l) => Math.abs(l.placement.radius_mm - radiusAfter) <= 1e-6, "radius drag read-back");
    await settled();
    await page.waitForTimeout(2600); // longer than the debounce: nothing else may follow
    assert.equal(writes, 1, `exactly one autosave write after pointer-up (got ${writes})`);
    assert.notEqual(await viewport().getAttribute("data-glyphs"), glyphsBefore, "glyphs moved");
    out.radiusDrag = { before: radiusBefore, mid: midRadius, after: dragged.placement.radius_mm, writes };

    /* ---- 3. arc knob drag ---- */
    const arcBefore = await fieldValue("pc-arc-position-input");
    const knob = await handleCentre("handle-arc");
    const o2 = await overlayOrigin();
    writes = 0;
    await mouseDrag({ x: o2.x + knob.x, y: o2.y + knob.y }, { x: 60, y: 25 });
    const arcAfter = await fieldValue("pc-arc-position-input");
    assert.ok(Math.abs(arcAfter - arcBefore) > 1, `arc position moved ${arcBefore} → ${arcAfter}`);
    const arced = await waitForLayer(designId, (l) => Math.abs(l.placement.arc_position_deg - arcAfter) <= 1e-6, "arc drag read-back");
    await settled();
    assert.equal(arced.placement.radius_mm, dragged.placement.radius_mm, "arc drag leaves the radius");
    assert.equal(writes, 1, `one write for the arc drag (got ${writes})`);
    out.arcDrag = { before: arcBefore, after: arcAfter };

    /* ---- 4. undo / redo ---- */
    assert.equal(await page.getByTestId("undo").isDisabled(), false, "undo enabled after drags");
    assert.equal(await page.getByTestId("redo").isDisabled(), true, "redo disabled before any undo");
    await page.locator("body").click({ position: { x: 5, y: 5 } }).catch(() => {});
    await page.keyboard.press("ControlOrMeta+z");
    const undoneArc = await waitForLayer(designId, (l) => Math.abs(l.placement.arc_position_deg - arcBefore) <= 1e-6, "undo arc drag");
    assert.equal(undoneArc.placement.radius_mm, dragged.placement.radius_mm, "undoing the arc drag keeps the radius drag");
    assert.equal(await page.getByTestId("redo").isDisabled(), false, "redo enabled after undo");
    await page.getByTestId("undo").click();
    await waitForLayer(designId, (l) => Math.abs(l.placement.radius_mm - radiusBefore) <= 1e-6, "undo radius drag");
    assert.equal(await page.getByTestId("redo").isDisabled(), false, "redo enabled after two undos");
    await page.keyboard.press("ControlOrMeta+Shift+z");
    await waitForLayer(designId, (l) => Math.abs(l.placement.radius_mm - radiusAfter) <= 1e-6 && Math.abs(l.placement.arc_position_deg - arcBefore) <= 1e-6, "redo radius");
    await page.getByTestId("redo").click();
    await waitForLayer(designId, (l) => Math.abs(l.placement.arc_position_deg - arcAfter) <= 1e-6, "redo arc");
    assert.equal(await page.getByTestId("redo").isDisabled(), true, "redo disabled at the newest entry");
    // A typed edit is one entry: type a radius, blur, undo → back to the dragged radius.
    await page.getByTestId("pc-radius-input").fill("3.5");
    await page.getByTestId("pc-radius-input").blur();
    await waitForLayer(designId, (l) => l.placement.radius_mm === 3.5, "typed radius");
    await page.getByTestId("undo").click();
    await waitForLayer(designId, (l) => Math.abs(l.placement.radius_mm - radiusAfter) <= 1e-6, "undo typed radius");
    await page.getByTestId("redo").click();
    await waitForLayer(designId, (l) => l.placement.radius_mm === 3.5, "redo typed radius");
    await settled();
    out.undoRedo = "arc, radius, typed edit: undone and redone (read-backs)";

    /* ---- 5. touch drag on the ring ---- */
    const cdp = await page.context().newCDPSession(page);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 1 });
    const touchGrab = JSON.parse(await page.getByTestId("handle-radius").getAttribute("data-grab"));
    const o3 = await overlayOrigin();
    const touchStart = { x: o3.x + touchGrab.x, y: o3.y + touchGrab.y };
    const touchRadiusBefore = await fieldValue("pc-radius-input");
    let pointerTypes = [];
    await page.evaluate(() => {
      window.__pointerTypes = [];
      document.querySelector('[data-testid="handle-radius"]').addEventListener("pointerdown", (e) => window.__pointerTypes.push(e.pointerType));
    });
    writes = 0;
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: touchStart.x, y: touchStart.y }] });
    for (let i = 1; i <= 8; i++) {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: touchStart.x + (touchGrab.dx * 30 * i) / 8, y: touchStart.y + (touchGrab.dy * 30 * i) / 8 }],
      });
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    pointerTypes = await page.evaluate(() => window.__pointerTypes);
    assert.deepEqual(pointerTypes, ["touch"], "the drag arrived as a touch pointer");
    const touchRadiusAfter = await fieldValue("pc-radius-input");
    assert.ok(touchRadiusAfter > touchRadiusBefore, `touch drag grows the radius ${touchRadiusBefore} → ${touchRadiusAfter}`);
    await waitForLayer(designId, (l) => Math.abs(l.placement.radius_mm - touchRadiusAfter) <= 1e-6, "touch drag read-back");
    await settled();
    assert.equal(writes, 1, `one write for the touch drag (got ${writes})`);
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    out.touch = { before: touchRadiusBefore, after: touchRadiusAfter, pointerTypes };

    /* ---- 7. ruler on: labels clear of the handles ---- */
    await page.getByTestId("ruler-toggle").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="ruler-thickness-label"]')?.style.visibility === "visible", null, { timeout: 10000 });
    await page.waitForTimeout(400);
    const clashes = await page.evaluate(() => {
      const rects = (sel) => [...document.querySelectorAll(sel)].filter((el) => getComputedStyle(el).display !== "none").map((el) => el.getBoundingClientRect());
      const labels = rects('[data-testid="ruler-labels"] > span');
      const handles = rects('[data-testid="handle-arc"], [data-testid="handle-move"]');
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return labels.flatMap((l, i) => handles.filter((hd) => hit(l, hd)).map(() => i));
    });
    assert.deepEqual(clashes, [], "no ruler label overlaps a handle");
    await page.getByTestId("ruler-toggle").click();

    /* ---- 6. straight: move handle ---- */
    await page.getByTestId("text-layer-layout").locator('[data-value="straight"]').click();
    await waitForLayer(designId, (l) => l.placement.layout === "straight", "straight");
    await settled();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-testid="handle-move"]')).display !== "none", null, { timeout: 10000 });
    const moveBox = await page.getByTestId("handle-move").boundingBox();
    assert.ok(moveBox.width >= 24 && moveBox.height >= 24, `move handle hit area ${moveBox.width}×${moveBox.height}`);
    const move = await handleCentre("handle-move");
    const o4 = await overlayOrigin();
    await mouseDrag({ x: o4.x + move.x, y: o4.y + move.y }, { x: 35, y: -20 });
    const moved = await waitForLayer(designId, (l) => l.placement.centre_mm.x > 0.2 && l.placement.centre_mm.y > 0.1, "move read-back");
    assert.ok(Math.abs(moved.placement.centre_mm.x - (await fieldValue("pc-centre-x-input"))) <= 1e-6, "centre X field = read-back");
    assert.ok(Math.abs(moved.placement.centre_mm.y - (await fieldValue("pc-centre-y-input"))) <= 1e-6, "centre Y field = read-back");
    out.move = moved.placement.centre_mm;

    return out;
  } finally {
    await restore();
  }
}
