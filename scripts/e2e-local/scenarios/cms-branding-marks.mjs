// Phase 4d — CMS branding group marks and geometry recovery (E1 §5 row 4d),
// driven through the real /admin UI with every write read back.
//
//   1. Upload the Polo fixture; confirm its scale (0.720193 mm/raw) so the
//      result block shows millimetres.
//   2. Open the group list: 33 groups in file order. Click object_6, shift-
//      click object_33 → 28 marked → Analyse branding → read-back: 28 marks
//      [{index 5..32, name object_6..33}], a reference with radius_raw
//      5.04 ± 0.05, relief_raw within tolerance (see below), confidence not
//      low, origin recovered-from-geometry; the result block shows it.
//   3. Clear them (click, shift-click), mark two body groups (object_1,
//      object_3) → Analyse → read-back: 2 marks, reference null; the panel
//      shows the one-line low-confidence notice (C9).
//
// Relief: E1 lists relief_raw 0.5 ± 0.1. Measured as addendum §14 defines it
// — glyph top surface to the underlying body surface along the local normal —
// the Polo's lettering stands ≈ 0.30 raw units proud: glyph caps top out at
// ≈ 3.97 on the face axis while the face plate beneath them (object_5) is at
// ≈ 3.67. The 0.5 figure matches the glyph solids' own extrusion (caps to
// wall bottoms at ≈ 3.40), ≈ 0.27 of which is buried below the face. This
// scenario asserts the measured surface relief and STATUS.md records the
// discrepancy as an open question.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POLO_OBJ } from "../lib/calibration.mjs";

const POLO_FACTOR = 0.7201933197145993;
const SURFACE_RELIEF = 0.3;

export default async function ({ page, admin, editor, h }) {
  const { data: products, error: productsError } = await admin.from("products").select("id").order("created_at").limit(3);
  if (productsError) throw new Error(productsError.message);
  const product = products[2]; // distinct from cms-model-scale.mjs [0] and cms-two-point.mjs [1]

  const cleanup = async () => {
    // The reset trigger clears marks and reference along with the path.
    await admin.from("products").update({ model_storage_path: null }).eq("id", product.id);
    const { data: files } = await admin.storage.from("product-models").list(`models/${product.id}`);
    if (files?.length) await admin.storage.from("product-models").remove(files.map((f) => `models/${product.id}/${f.name}`));
  };

  const readBranding = async () => {
    const { data, error } = await admin
      .from("products")
      .select("model_branding_groups, model_branding_reference")
      .eq("id", product.id)
      .single();
    if (error) throw new Error(error.message);
    return data;
  };

  const panel = page.getByTestId("model-branding-panel");
  const row = (index) => panel.locator(`[data-testid="model-branding-group"][data-index="${index}"]`);

  await cleanup();
  try {
    await h.login(editor);
    await h.openProduct(product.id);

    /* ---- 1. upload, then confirm the scale so mm values show ---- */
    await page
      .locator('[data-testid="model-input"]')
      .setInputFiles({ name: "polo-branding.obj", mimeType: "model/obj", buffer: readFileSync(POLO_OBJ) });
    await h.waitForToast(/3D model uploaded/i);
    await page.getByTestId("model-scale-panel").waitFor({ timeout: 15000 });
    // Own update: the reset trigger clobbers scale fields written alongside a path change.
    const confirm = await admin
      .from("products")
      .update({ model_scale_status: "confirmed", model_scale_factor: POLO_FACTOR, model_scale_method: "known_dimension" })
      .eq("id", product.id);
    if (confirm.error) throw new Error(confirm.error.message);
    await h.openProduct(product.id);

    /* ---- 2. mark object_6–object_33 and analyse ---- */
    await panel.waitFor({ timeout: 15000 });
    await panel.getByTestId("model-branding-toggle").click();
    await panel.getByTestId("model-branding-groups").waitFor({ timeout: 30000 });
    const rows = panel.getByTestId("model-branding-group");
    assert.equal(await rows.count(), 33, "the Polo has 33 OBJ groups");
    assert.match(await row(0).innerText(), /object_1/);

    await row(5).click();
    await row(32).click({ modifiers: ["Shift"] });
    assert.match(await panel.getByTestId("model-branding-marked-count").innerText(), /28/);
    assert.equal(await row(4).getAttribute("aria-pressed"), "false");
    assert.equal(await row(5).getAttribute("aria-pressed"), "true");

    await h.expectToast(/Branding marks saved/i, () => panel.getByTestId("model-branding-analyse").click(), 30000);

    const marked = await readBranding();
    assert.equal(marked.model_branding_groups.length, 28, "28 marks saved");
    assert.deepEqual(
      marked.model_branding_groups,
      Array.from({ length: 28 }, (_, i) => ({ index: i + 5, name: `object_${i + 6}` })),
      "marks are [{index, name}] in file order",
    );
    const ref = marked.model_branding_reference;
    assert.ok(ref, "a confident analysis stores a reference");
    assert.equal(ref.algorithm, "kasa-circle-v1");
    assert.equal(ref.origin, "recovered-from-geometry");
    assert.ok(Math.abs(ref.radius_raw - 5.04) <= 0.05, `radius_raw ${ref.radius_raw} should be 5.04 ± 0.05`);
    assert.ok(Math.abs(ref.relief_raw - SURFACE_RELIEF) <= 0.1, `relief_raw ${ref.relief_raw} should be ${SURFACE_RELIEF} ± 0.1 (see header)`);
    assert.notEqual(ref.confidence, "low", `confidence ${ref.confidence}`);
    assert.ok(ref.fit_rms_raw >= 0 && ref.text_height_raw > 0, "RMS and text height recorded");
    assert.equal(ref.face_normal_raw.length, 3);
    assert.equal(ref.angle_zero_raw.length, 3);

    const result = panel.getByTestId("model-branding-result");
    await result.waitFor({ timeout: 10000 });
    assert.equal(await result.getAttribute("data-confidence"), ref.confidence);
    const radiusText = await panel.getByTestId("model-branding-radius").innerText();
    assert.match(radiusText, /raw .* mm/, `radius shows raw and mm: ${radiusText}`);
    const mm = Number(radiusText.match(/([\d.]+) mm/)[1]);
    assert.ok(Math.abs(mm - ref.radius_raw * POLO_FACTOR) < 0.001, `radius mm ${mm} at the stored factor`);
    assert.match(await result.innerText(), /Recovered from geometry/);

    /* ---- 3. two body groups → marks save, reference null ---- */
    await row(5).click();
    await row(32).click({ modifiers: ["Shift"] });
    assert.match(await panel.getByTestId("model-branding-marked-count").innerText(), /\b0\b/);
    await row(0).click();
    await row(2).click();
    await h.expectToast(/Branding marks saved/i, () => panel.getByTestId("model-branding-analyse").click(), 30000);

    const body = await readBranding();
    assert.deepEqual(body.model_branding_groups, [
      { index: 0, name: "object_1" },
      { index: 2, name: "object_3" },
    ]);
    assert.equal(body.model_branding_reference, null, "low confidence stores no reference (C9)");
    await panel.getByTestId("model-branding-low-confidence").first().waitFor({ timeout: 10000 });

    return {
      polo: {
        marks: marked.model_branding_groups.length,
        radius_raw: ref.radius_raw,
        relief_raw: ref.relief_raw,
        text_height_raw: ref.text_height_raw,
        confidence: ref.confidence,
        fit_rms_raw: ref.fit_rms_raw,
        direction: ref.direction,
      },
      body: { marks: body.model_branding_groups.length, reference: body.model_branding_reference },
    };
  } finally {
    await cleanup();
  }
}
