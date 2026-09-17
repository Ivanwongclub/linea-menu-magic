// Phase 4a — CMS scale confirmation (E1 §5 unit 4a), driven through the real
// /admin UI against the local stack, with every write read back.
//
// One product, two size variants (15.00 mm default, 10.8 mm), the Polo
// fixture (raw primary ≈ 14.995973 OBJ units):
//   1. Upload → proposal is 1 (within the 2% band against the 15 mm variant)
//      → Confirm → read-back: confirmed / factor 1 / method unit_mm.
//   2. Replace the file → read-back: unconfirmed, factor null, branding
//      groups [] (collision 13's reset trigger; raw bounds re-parsed).
//   3. Switch the reference variant to 10.8 mm → proposal is outside the
//      band, shown at full precision (≈ 0.720193) → Calibrate by known
//      dimension, 10.8 → read-back: confirmed / factor 0.720193 ± 1e-6 /
//      method known_dimension / reference variant the 10.8 mm row.
//   4. Phase 4e R3: a product uploaded before 4a has a storage path but no
//      `model_raw_bounds` — simulated here by nulling it directly (not via
//      re-upload, which would just re-run 4a's own parse). "Measure file"
//      appears only then; clicking it parses the already-stored file in
//      place (no re-upload) and the scale panel appears.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POLO_OBJ } from "../lib/calibration.mjs";

const PRIMARY_RAW = 14.995973;

export default async function ({ page, admin, editor, h }) {
  const { data: product, error: productError } = await admin
    .from("products")
    .select("id")
    .order("created_at")
    .limit(1)
    .single();
  if (productError) throw new Error(productError.message);

  await admin.from("product_size_variants").delete().eq("product_id", product.id).in("sort_order", [900, 901]);
  const { data: variants, error: variantsError } = await admin
    .from("product_size_variants")
    .insert([
      { product_id: product.id, size_primary_mm: 15, size_label: "15mm", is_default: true, sort_order: 900 },
      { product_id: product.id, size_primary_mm: 10.8, size_label: "10.8mm", is_default: false, sort_order: 901 },
    ])
    .select("id, size_primary_mm");
  if (variantsError) throw new Error(variantsError.message);
  const variant15 = variants.find((v) => v.size_primary_mm === 15);
  const variant108 = variants.find((v) => v.size_primary_mm === 10.8);

  await admin
    .from("products")
    .update({ model_storage_path: null, model_scale_reference_variant_id: null })
    .eq("id", product.id);

  const cleanup = async () => {
    await admin
      .from("products")
      .update({ model_storage_path: null, model_scale_reference_variant_id: null })
      .eq("id", product.id);
    await admin.from("product_size_variants").delete().eq("product_id", product.id).in("sort_order", [900, 901]);
  };

  const readProduct = async () => {
    const { data, error } = await admin
      .from("products")
      .select(
        "model_storage_path, model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id, model_raw_bounds, model_branding_groups",
      )
      .eq("id", product.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  };

  const poloBuffer = readFileSync(POLO_OBJ);
  const modelInput = page.locator('[data-testid="model-input"]');

  try {
    await h.login(editor);
    await h.openProduct(product.id);

    /* ---- 1. upload → proposal 1 (within band) → Confirm ---- */
    await modelInput.setInputFiles({ name: "polo-10.8.obj", mimeType: "model/obj", buffer: poloBuffer });
    await h.waitForToast(/3D model uploaded/i);
    await page.getByTestId("model-scale-panel").waitFor({ timeout: 15000 });
    await page.getByTestId("model-scale-proposal").waitFor({ timeout: 10000 });

    const proposalText1 = await page.getByTestId("model-scale-proposal").innerText();
    assert.match(proposalText1, /1 OBJ unit = 1 mm/, `expected the within-band proposal, got: ${proposalText1}`);

    await page.getByTestId("model-scale-confirm-button").click();
    await h.waitForToast(/Scale confirmed/i);

    const afterConfirm = await readProduct();
    assert.equal(afterConfirm.model_scale_status, "confirmed");
    assert.equal(Number(afterConfirm.model_scale_factor), 1);
    assert.equal(afterConfirm.model_scale_method, "unit_mm");
    assert.equal(afterConfirm.model_scale_reference_variant_id, variant15.id);
    assert.ok(Math.abs(afterConfirm.model_raw_bounds.primary_raw - PRIMARY_RAW) < 1e-3, "raw primary dimension should be the Polo's");

    /* ---- 2. replace the file → reset ---- */
    // expectToast, not waitForToast: the first upload's identical toast may still be showing.
    await h.expectToast(/3D model uploaded/i, () => modelInput.setInputFiles({ name: "polo-10.8-replaced.obj", mimeType: "model/obj", buffer: poloBuffer }));

    const afterReplace = await readProduct();
    assert.equal(afterReplace.model_scale_status, "unconfirmed", "a replaced file must not inherit the old confirmation");
    assert.equal(afterReplace.model_scale_factor, null);
    assert.deepEqual(afterReplace.model_branding_groups, []);
    assert.ok(afterReplace.model_raw_bounds, "raw bounds should be re-parsed for the new upload");

    /* ---- 3. switch reference variant to 10.8 mm → calibrate by known dimension ---- */
    await page.getByTestId("model-scale-panel").waitFor({ timeout: 15000 });
    await h.selectOption(page.getByTestId("model-scale-reference-variant"), "10.8mm");
    await page.getByTestId("model-scale-proposal").waitFor({ timeout: 10000 });
    const proposalText2 = await page.getByTestId("model-scale-proposal").innerText();
    assert.match(proposalText2, /0\.720193/, `expected the full-precision out-of-band proposal, got: ${proposalText2}`);

    await page.getByTestId("model-scale-calibrate-toggle").click();
    await page.getByTestId("model-scale-known-dimension-input").fill("10.8");
    await page.getByTestId("model-scale-apply-calibration").click();
    await h.waitForToast(/Scale calibrated/i);

    const afterCalibrate = await readProduct();
    assert.equal(afterCalibrate.model_scale_status, "confirmed");
    assert.equal(afterCalibrate.model_scale_method, "known_dimension");
    assert.equal(afterCalibrate.model_scale_reference_variant_id, variant108.id);
    assert.ok(
      Math.abs(Number(afterCalibrate.model_scale_factor) - 0.720193) < 1e-6,
      `factor ${afterCalibrate.model_scale_factor} should be 0.720193 ± 1e-6`,
    );

    /* ---- 4. pre-4a upload (raw bounds null) → Measure file, no re-upload ---- */
    const pathBeforeMeasure = afterCalibrate.model_storage_path;
    const preExisting = await admin
      .from("products")
      .update({ model_raw_bounds: null, model_scale_status: "unconfirmed", model_scale_factor: null, model_scale_method: null })
      .eq("id", product.id);
    if (preExisting.error) throw new Error(preExisting.error.message);

    await h.openProduct(product.id);
    assert.equal(await page.getByTestId("model-scale-panel").count(), 0, "no scale panel while raw bounds are null (no placeholder either)");
    const measureButton = page.getByTestId("model-measure-file");
    await measureButton.waitFor({ timeout: 10000 });
    await measureButton.click();
    await h.waitForToast(/Raw dimensions read/i);

    const afterMeasure = await readProduct();
    assert.equal(afterMeasure.model_storage_path, pathBeforeMeasure, "measuring never re-uploads the file");
    assert.ok(afterMeasure.model_raw_bounds, "raw bounds parsed from the stored file");
    assert.ok(
      Math.abs(afterMeasure.model_raw_bounds.primary_raw - PRIMARY_RAW) < 1e-3,
      "raw primary dimension parsed from the stored file matches the Polo's",
    );

    await page.getByTestId("model-scale-panel").waitFor({ timeout: 10000 });
    assert.equal(await page.getByTestId("model-measure-file").count(), 0, "the action disappears once bounds exist");

    return {
      afterConfirm: { status: afterConfirm.model_scale_status, factor: Number(afterConfirm.model_scale_factor), method: afterConfirm.model_scale_method },
      afterReplace: { status: afterReplace.model_scale_status, factor: afterReplace.model_scale_factor, groups: afterReplace.model_branding_groups },
      afterCalibrate: { status: afterCalibrate.model_scale_status, factor: Number(afterCalibrate.model_scale_factor), method: afterCalibrate.model_scale_method },
      afterMeasure: { primaryRaw: afterMeasure.model_raw_bounds.primary_raw, pathUnchanged: afterMeasure.model_storage_path === pathBeforeMeasure },
    };
  } finally {
    await cleanup();
  }
}
