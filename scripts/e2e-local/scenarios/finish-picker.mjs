// Phase 3: finish picker.
//
// A metal product's "Change finish" sheet lists only its attached public
// finishes (not every public finish); picking one updates
// draft_recipe.finish_id (checked signed in, where autosave writes it
// back); a non-metal product shows COLOUR instead; the ruler toggle is
// present in both cases (collision 18 — replaces the old measurement line
// assertion); no floating toolbar exists.
//
// The local seed (migrations only — see docs/3d-editor/STATUS.md's M4 note)
// carries zero public finishes, zero product_finishes attachments and no
// non-metal product with colours, so this scenario seeds all three itself.
import assert from "node:assert/strict";

const TINY_OBJ = "o cube\nv 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nf 1 2 3 4\n";

async function publish(admin, product, modelPath, referenceVariantId) {
  const uploaded = await admin.storage
    .from("product-models")
    .upload(modelPath, new Blob([TINY_OBJ], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (uploaded.error) throw new Error(uploaded.error.message);
  const itemCode = product.item_code ?? `E2E-${product.id.slice(0, 8)}`;
  const { error } = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: itemCode })
    .eq("id", product.id);
  if (error) throw new Error(error.message);
  // Separate update: `products_reset_model_scale` fires before update OF
  // `model_storage_path` and clobbers scale fields set in the same statement.
  // TINY_OBJ's primary raw dimension is 1 unit; the size variant is 15mm —
  // the buyer refusal (Phase 4b) needs a confirmed scale, and its exact
  // value is irrelevant to this scenario's assertions.
  const { error: scaleError } = await admin
    .from("products")
    .update({ model_scale_status: "confirmed", model_scale_factor: 15, model_scale_method: "unit_mm", model_scale_reference_variant_id: referenceVariantId })
    .eq("id", product.id);
  if (scaleError) throw new Error(scaleError.message);
}

async function restoreProduct(admin, product, modelPath) {
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
}

export default async function ({ page, base, admin, editor, h }) {
  const { data: products, error } = await admin
    .from("products")
    .select(
      "id, slug, item_code, model_storage_path, status, is_public, brand_id, " +
        "model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id, " +
        "material:product_materials!material_id(is_metal)",
    )
    .order("slug")
    .limit(300);
  if (error) throw new Error(error.message);

  // A product that already has a default size variant cannot take this
  // scenario's own, and the row order of an unordered query moves as other
  // scenarios update products — so choose by slug, among the ones with no
  // variants of their own.
  const { data: variantRows, error: variantError } = await admin.from("product_size_variants").select("product_id");
  if (variantError) throw new Error(variantError.message);
  const sized = new Set((variantRows ?? []).map((row) => row.product_id));
  const free = products.filter((p) => !sized.has(p.id));
  const metalProduct = free.find((p) => p.material?.is_metal);
  const colourProduct = free.find((p) => !p.material?.is_metal);
  if (!metalProduct) throw new Error("no metal product in the seed");
  if (!colourProduct) throw new Error("no non-metal product in the seed");

  const { data: allFinishes, error: finishesError } = await admin.from("finishes").select("id, cyc_code, is_public").limit(5);
  if (finishesError) throw new Error(finishesError.message);
  if (allFinishes.length < 4) throw new Error("need at least 4 finishes in the seed to seed attached vs. unattached");
  const [attachedA, attachedB, ...unattached] = allFinishes;
  const publicFinishIds = [attachedA.id, attachedB.id, ...unattached.map((f) => f.id)];

  const restoreFinishPublic = async () => {
    await Promise.all(allFinishes.map((f) => admin.from("finishes").update({ is_public: f.is_public }).eq("id", f.id)));
  };

  const metalModelPath = `models/${metalProduct.id}/e2e-finish-picker.obj`;
  const colourModelPath = `models/${colourProduct.id}/e2e-finish-picker.obj`;

  const cleanup = async () => {
    await admin.from("designs").delete().eq("product_id", metalProduct.id).eq("owner_id", editor.userId);
    await admin.from("product_finishes").delete().eq("product_id", metalProduct.id).in("finish_id", [attachedA.id, attachedB.id]);
    await admin.from("product_colours").delete().eq("product_id", colourProduct.id).eq("name", "E2E Seed Colour");
    await admin.from("product_size_variants").delete().eq("product_id", metalProduct.id).eq("size_label", "E2E Seed Size");
    await admin.from("product_size_variants").delete().eq("product_id", colourProduct.id).eq("size_label", "E2E Seed Size");
    await restoreFinishPublic();
    await restoreProduct(admin, metalProduct, metalModelPath);
    await restoreProduct(admin, colourProduct, colourModelPath);
  };

  try {
    // Seed: publish finishes, attach two of them to the metal product, leave
    // the rest public-but-unattached so "attached only" is a real filter.
    await Promise.all(publicFinishIds.map((id) => admin.from("finishes").update({ is_public: true }).eq("id", id)));
    const attach = await admin
      .from("product_finishes")
      .insert([
        { product_id: metalProduct.id, finish_id: attachedA.id, sort_order: 0 },
        { product_id: metalProduct.id, finish_id: attachedB.id, sort_order: 1 },
      ]);
    if (attach.error) throw new Error(attach.error.message);

    // Seed: a colour for the non-metal product.
    const colourInsert = await admin
      .from("product_colours")
      .insert({ product_id: colourProduct.id, name: "E2E Seed Colour", hex: "#334455", sort_order: 0 });
    if (colourInsert.error) throw new Error(colourInsert.error.message);

    // Seed: a size variant for each — the ruler needs one, and
    // Phase 4b's buyer refusal needs a confirmed scale's reference variant.
    const sizeInsert = await admin
      .from("product_size_variants")
      .insert([
        { product_id: metalProduct.id, size_label: "E2E Seed Size", size_primary_mm: 15, is_default: true, sort_order: 0 },
        { product_id: colourProduct.id, size_label: "E2E Seed Size", size_primary_mm: 15, is_default: true, sort_order: 0 },
      ])
      .select("id, product_id");
    if (sizeInsert.error) throw new Error(sizeInsert.error.message);
    const metalVariantId = sizeInsert.data.find((v) => v.product_id === metalProduct.id).id;
    const colourVariantId = sizeInsert.data.find((v) => v.product_id === colourProduct.id).id;

    await publish(admin, metalProduct, metalModelPath, metalVariantId);
    await publish(admin, colourProduct, colourModelPath, colourVariantId);

    /* ---- metal product: FINISH group, attached-only picker, ruler toggle, no toolbar ---- */
    await page.goto(`${base}/designer-studio/editor/new?product=${metalProduct.slug}`, { waitUntil: "networkidle" });
    await page.locator("canvas").first().waitFor({ timeout: 20000 });
    const panel = page.getByTestId("editor-panel");
    await panel.waitFor({ timeout: 10000 });
    assert.match(await panel.innerText(), /Finish/i);
    assert.equal(await page.getByTestId("viewport-toolbar").count(), 0, "no floating viewport toolbar");
    assert.equal(await page.getByTestId("ruler-toggle").count(), 1, "ruler toggle is present (collision 18)");

    await page.getByRole("button", { name: /change finish/i }).click();
    const grid = page.locator('[data-testid="finish-swatch"]');
    await grid.first().waitFor({ timeout: 10000 });
    const shownCodes = await grid.evaluateAll((els) => els.map((el) => el.getAttribute("data-code")));
    assert.equal(shownCodes.length, 2, "the picker lists only the product's attached public finishes");
    assert.deepEqual(
      [...shownCodes].sort(),
      [attachedA.cyc_code, attachedB.cyc_code].sort(),
      "exactly the two attached finishes, not the unattached public ones",
    );

    /* ---- non-metal product: COLOUR, not FINISH ---- */
    await page.goto(`${base}/designer-studio/editor/new?product=${colourProduct.slug}`, { waitUntil: "networkidle" });
    await page.locator("canvas").first().waitFor({ timeout: 20000 });
    const colourPanelText = await page.getByTestId("editor-panel").innerText();
    assert.match(colourPanelText, /Colour/i);
    assert.doesNotMatch(colourPanelText, /^Finish$/m);
    assert.ok(await page.getByTestId("colour-swatch").first().count(), "colour swatches render");
    assert.equal(await page.getByTestId("ruler-toggle").count(), 1, "ruler toggle is present (collision 18)");

    /* ---- signed in: selecting a finish updates draft_recipe.finish_id ---- */
    await admin.from("designs").delete().eq("product_id", metalProduct.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.goto(`${base}/designer-studio/editor/new?product=${metalProduct.slug}`, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    await page.locator("canvas").first().waitFor({ timeout: 20000 });

    await page.getByRole("button", { name: /change finish/i }).click();
    await page.locator('[data-testid="finish-swatch"]').first().waitFor({ timeout: 10000 });
    const targetCode = attachedB.cyc_code;
    await page.locator(`[data-testid="finish-swatch"][data-code="${targetCode}"]`).click();

    await page.getByTestId("autosave-status").waitFor({ timeout: 10000 });
    await page.waitForTimeout(2500); // let the 2s debounce flush

    const { data: design, error: designError } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (designError) throw new Error(designError.message);
    assert.equal(design.draft_recipe?.finish_id, attachedB.id, "draft_recipe.finish_id matches the finish that was clicked");

    return {
      metal: { attachedShown: shownCodes.length },
      colour: "COLOUR group shown for non-metal",
      autosave: { designId, finishId: design.draft_recipe?.finish_id },
    };
  } finally {
    await cleanup();
  }
}
