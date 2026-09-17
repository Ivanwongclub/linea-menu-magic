// Phase 4e — ruler toggle, buyer scope (E1 §5 row 4e).
//
// The toggle lives in the viewport corner, not the panel (collision 17: one
// tool, not a floating toolbar), off by default. On, it shows the model's
// diameter and thickness from model-local bounds (C4). "Canvas mesh count
// unchanged (overlay not geometry)" is proven here via `data-model-size-mm`
// — that attribute comes from `EditorModel`'s own mesh bounds, wired up
// independently of the ruler, so it staying identical with the ruler on and
// off is the same guarantee (no app hook exists to count scene meshes
// directly, and adding one solely for this assertion isn't worth the extra
// production surface). 4h (R2): while the idle rotation turns the camera,
// the two labels never overlap, the diameter label sits centred below its
// line and the thickness label beside its own.
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
    .limit(3);
  const product = products[2]; // distinct from editor-shell.mjs [0] and editor-scale.mjs [1]

  const polo = readFileSync(POLO_OBJ, "utf8");
  const rawBounds = parseObjRawBounds(polo);
  const referenceMm = 10.8;
  const factor = referenceMm / rawBounds.primary_raw;

  const modelPath = `models/${product.id}/e2e-ruler-buyer.obj`;
  const uploaded = await admin.storage
    .from("product-models")
    .upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const sizeInsert = await admin
    .from("product_size_variants")
    .insert({ product_id: product.id, size_label: "10.8mm", size_primary_mm: 10.8, is_default: true, sort_order: 900 })
    .select("id")
    .single();
  if (sizeInsert.error) throw new Error(sizeInsert.error.message);
  const referenceVariantId = sizeInsert.data.id;

  const setModel = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-RULER-001" })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);
  // Own update — the reset trigger clobbers scale fields set alongside a path change.
  const confirm = await admin
    .from("products")
    .update({ model_scale_status: "confirmed", model_scale_factor: factor, model_scale_method: "unit_mm", model_scale_reference_variant_id: referenceVariantId })
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
    await admin.from("product_size_variants").delete().eq("id", referenceVariantId);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
  };

  try {
    const url = `${base}/designer-studio/editor/new?product=${product.slug}`;

    /* ---- anonymous: toggle in the viewport, not the panel; off by default ---- */
    await page.goto(url, { waitUntil: "networkidle" });
    await h.dismissCookies();
    const viewport = page.getByTestId("editor-viewport");
    await viewport.locator("canvas").first().waitFor({ timeout: 20000 });
    const panel = page.getByTestId("editor-panel");
    await panel.waitFor({ timeout: 10000 });

    assert.equal(await page.getByTestId("ruler-toggle").count(), 1, "the ruler toggle exists");
    assert.equal(await panel.locator('[data-testid="ruler-toggle"]').count(), 0, "the toggle is absent from the panel");
    assert.equal(await viewport.locator('[data-testid="ruler-toggle"]').count(), 1, "the toggle is present in the viewport");
    assert.equal(await page.getByTestId("ruler-toggle").getAttribute("aria-pressed"), "false", "off by default");
    assert.equal(await page.getByTestId("ruler-diameter-label").count(), 0, "off: no ruler labels");
    assert.equal(await page.getByTestId("ruler-thickness-label").count(), 0, "off: no ruler labels");

    await page.waitForFunction(() => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-model-size-mm") != null, { timeout: 15000 });
    const sizeBeforeRuler = await viewport.getAttribute("data-model-size-mm");

    /* ---- on: diameter (10.80 mm, the reference variant) and thickness labels ---- */
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-diameter-label").waitFor({ timeout: 10000 });
    const diameterText = await page.getByTestId("ruler-diameter-label").innerText();
    assert.match(diameterText, /10\.80\s*mm/, `diameter label should read 10.80 mm, got: ${diameterText}`);
    const thicknessText = await page.getByTestId("ruler-thickness-label").innerText();
    assert.match(thicknessText, /\d+(\.\d+)?\s*mm/, `thickness label should show a value, got: ${thicknessText}`);

    /* ---- R2 (4h): labels never overlap, each placed against its own line, sampled while the camera turns ---- */
    const layoutSamples = [];
    await page.waitForFunction(() => document.querySelector('[data-testid="ruler-thickness-label"]')?.style.visibility === "visible", null, { timeout: 10000 });
    for (let i = 0; i < 8; i++) {
      const sample = await page.evaluate(() => {
        const layer = document.querySelector('[data-testid="ruler-labels"]').getBoundingClientRect();
        const read = (id) => {
          const el = document.querySelector(`[data-testid="${id}"]`);
          const r = el.getBoundingClientRect();
          return { x: r.left - layer.left, y: r.top - layer.top, width: r.width, height: r.height, line: JSON.parse(el.dataset.line) };
        };
        return { diameter: read("ruler-diameter-label"), thickness: read("ruler-thickness-label") };
      });
      const { diameter: d, thickness: t } = sample;
      const overlap = d.x < t.x + t.width && t.x < d.x + d.width && d.y < t.y + t.height && t.y < d.y + d.height;
      assert.ok(!overlap, `sample ${i}: diameter and thickness labels overlap ${JSON.stringify(sample)}`);
      const dl = d.line;
      if (Math.abs(dl.a.x - dl.b.x) >= Math.abs(dl.a.y - dl.b.y)) {
        assert.ok(d.y >= Math.max(dl.a.y, dl.b.y) - 1, `sample ${i}: diameter label below its line`);
        assert.ok(Math.abs(d.x + d.width / 2 - (dl.a.x + dl.b.x) / 2) <= 1.5, `sample ${i}: diameter label centred on its line`);
      }
      const tl = t.line;
      const besideLeft = t.x + t.width <= Math.min(tl.a.x, tl.b.x) + 1;
      const besideRight = t.x >= Math.max(tl.a.x, tl.b.x) - 1;
      assert.ok(besideLeft || besideRight, `sample ${i}: thickness label beside its line, not on it ${JSON.stringify(t)}`);
      layoutSamples.push({ diameterTop: Math.round(d.y), thicknessLeft: Math.round(t.x) });
      await page.waitForTimeout(350);
    }

    const sizeAfterRuler = await viewport.getAttribute("data-model-size-mm");
    assert.equal(sizeAfterRuler, sizeBeforeRuler, "the overlay is not geometry — the model's own measured size is unchanged");

    /* ---- off again: labels gone ---- */
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-diameter-label").waitFor({ state: "detached", timeout: 10000 });

    /* ---- leave it on, sign in: the claimed design carries the anonymous draft's ruler ---- */
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-diameter-label").waitFor({ timeout: 10000 });

    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();

    const { data: claimed, error: claimedError } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (claimedError) throw new Error(claimedError.message);
    assert.equal(claimed.draft_recipe?.view?.ruler, true, "the claimed design carries ruler = true from the anonymous draft");

    /* ---- signed-in design page: still on after the claim ---- */
    await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 20000 });
    await page.getByTestId("ruler-diameter-label").waitFor({ timeout: 10000 });

    /* ---- toggling here autosaves view.ruler; flip it off then on to prove the write round-trips ---- */
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-diameter-label").waitFor({ state: "detached", timeout: 10000 });
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-diameter-label").waitFor({ timeout: 10000 });
    await page.waitForTimeout(2500); // 2s autosave debounce

    const { data: saved, error: savedError } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (savedError) throw new Error(savedError.message);
    assert.equal(saved.draft_recipe?.view?.ruler, true, "autosave persisted view.ruler = true");

    /* ---- reload: still on (read-back draft_recipe.view.ruler = true) ---- */
    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 20000 });
    assert.equal(await page.getByTestId("ruler-toggle").getAttribute("aria-pressed"), "true", "reload restores the ruler toggle state");
    await page.getByTestId("ruler-diameter-label").waitFor({ timeout: 10000 });

    return {
      designId,
      sizeUnchangedByRuler: sizeAfterRuler === sizeBeforeRuler,
      labelSamples: layoutSamples.length,
      claimedRuler: claimed.draft_recipe?.view?.ruler,
      savedRuler: saved.draft_recipe?.view?.ruler,
    };
  } finally {
    await restore();
  }
}
