// Phase 4b: the editor reads the stored scale instead of force-rescaling.
//
// An unconfirmed model shows the same awaiting-setup copy to anonymous and
// signed-in buyers, with no canvas and — critically — no `designs` row
// inserted for the signed-in visit. Once confirmed, the rendered model's
// primary dimension follows `factor * variantMm / referenceMm` (E1 §5 unit
// 4b): at the reference variant it equals the reference's own mm, and
// switching to another variant rescales to that variant's mm.
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
    .limit(2);
  const product = products[1]; // distinct from editor-shell.mjs's first row

  const polo = readFileSync(POLO_OBJ, "utf8");
  const rawBounds = parseObjRawBounds(polo);
  const referenceMm = 10.8;
  const factor = referenceMm / rawBounds.primary_raw;

  const modelPath = `models/${product.id}/e2e-editor-scale.obj`;
  const uploaded = await admin.storage
    .from("product-models")
    .upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const sizeInsert = await admin
    .from("product_size_variants")
    .insert([
      { product_id: product.id, size_label: "10.8mm", size_primary_mm: 10.8, is_default: true, sort_order: 900 },
      { product_id: product.id, size_label: "15mm", size_primary_mm: 15, is_default: false, sort_order: 901 },
    ])
    .select("id, size_primary_mm");
  if (sizeInsert.error) throw new Error(sizeInsert.error.message);
  const referenceVariantId = sizeInsert.data.find((v) => v.size_primary_mm === 10.8).id;
  const fifteenVariantId = sizeInsert.data.find((v) => v.size_primary_mm === 15).id;

  // Uploading the model resets scale to unconfirmed (the `products_reset_model_scale`
  // trigger) — this is the state the buyer refusal proof needs.
  const setModel = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-SCALE-001" })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);

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
    await admin.from("product_size_variants").delete().in("id", [referenceVariantId, fifteenVariantId]);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
  };

  try {
    const url = `${base}/designer-studio/editor/new?product=${product.slug}`;

    /* ---- unconfirmed: anonymous sees the awaiting-setup copy, no canvas ---- */
    await page.goto(url, { waitUntil: "networkidle" });
    await h.dismissCookies();
    await page.getByTestId("editor-awaiting-setup").waitFor({ timeout: 10000 });
    assert.equal(await page.locator("canvas").count(), 0, "no canvas while unconfirmed (anonymous)");

    /* ---- unconfirmed, signed in: same copy, no designs row inserted ---- */
    await page.evaluate(() => window.sessionStorage.clear());
    await h.login(editor);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByTestId("editor-awaiting-setup").waitFor({ timeout: 10000 });
    assert.equal(await page.locator("canvas").count(), 0, "no canvas while unconfirmed (signed in)");
    assert.ok(page.url().includes("/designer-studio/editor/new"), "signed-in stays on /new — no design was created");
    const { data: noDesigns, error: noDesignsError } = await admin.from("designs").select("id").eq("product_id", product.id).eq("owner_id", editor.userId);
    if (noDesignsError) throw new Error(noDesignsError.message);
    assert.equal(noDesigns.length, 0, "an unconfirmed product never gets a designs row");

    /* ---- confirm the scale ---- */
    const confirm = await admin
      .from("products")
      .update({
        model_scale_status: "confirmed",
        model_scale_factor: factor,
        model_scale_method: "unit_mm",
        model_scale_reference_variant_id: referenceVariantId,
        model_scale_confirmed_at: new Date().toISOString(),
      })
      .eq("id", product.id);
    if (confirm.error) throw new Error(confirm.error.message);

    /* ---- confirmed, signed in: a designs row is created, canvas renders at the reference size ---- */
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();

    const viewport = page.getByTestId("editor-viewport");
    await viewport.locator("canvas").first().waitFor({ timeout: 20000 });
    await page.waitForFunction(
      () => {
        const el = document.querySelector('[data-testid="editor-viewport"]');
        return el && el.getAttribute("data-model-size-mm") != null;
      },
      { timeout: 15000 },
    );
    const atReference = Number(await viewport.getAttribute("data-model-size-mm"));
    assert.ok(Math.abs(atReference - 10.8) <= 0.01, `at the reference variant, rendered size ${atReference} should be 10.80 ± 0.01`);

    /* ---- switching variant rescales to the new variant's mm ---- */
    await page.locator(`#size-${fifteenVariantId}`).click();
    await page.waitForFunction(
      (expected) => {
        const el = document.querySelector('[data-testid="editor-viewport"]');
        return el && Math.abs(Number(el.getAttribute("data-model-size-mm")) - expected) <= 0.01;
      },
      15,
      { timeout: 15000 },
    );
    const atFifteen = Number(await viewport.getAttribute("data-model-size-mm"));
    assert.ok(Math.abs(atFifteen - 15) <= 0.01, `after switching to the 15mm variant, rendered size ${atFifteen} should be 15.00 ± 0.01`);

    return { designId, atReference, atFifteen, factor };
  } finally {
    await restore();
  }
}
