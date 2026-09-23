// Phase 2: editor shell, route, lazy load, catalogue entry.
//
// /new with a product renders the canvas and the PRODUCT panel group;
// anonymous sees the sign-in banner; signed-in gets a `designs` row and
// lands on /:designId; bare /editor redirects, mapping legacy ?slug= to
// ?product=.
import assert from "node:assert/strict";

const TINY_OBJ = "o cube\nv 0 0 0\nv 1 0 0\nv 1 1 0\nv 0 1 0\nf 1 2 3 4\n";

export default async function ({ page, base, admin, editor, h }) {
  const { data: product } = await admin
    .from("products")
    .select(
      "id, slug, name, item_code, model_storage_path, status, is_public, brand_id, " +
        "model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id",
    )
    .like("slug", "sample-%")
    .order("slug")
    .limit(1)
    .single();

  const modelPath = `models/${product.id}/e2e-test.obj`;
  const uploaded = await admin.storage
    .from("product-models")
    .upload(modelPath, new Blob([TINY_OBJ], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (uploaded.error) throw new Error(uploaded.error.message);
  // A size variant so the buyer refusal (Phase 4b) doesn't block this smoke
  // test on an unconfirmed scale — its factor doesn't matter here.
  const size = await admin.from("product_size_variants").insert({ product_id: product.id, size_primary_mm: 15, sort_order: 900 }).select("id").single();
  if (size.error) throw new Error(size.error.message);
  // Anonymous visibility needs a published house product with an item code —
  // the seed's "sample-%" rows are drafts (brand-scoped-product.mjs hits the same thing).
  const setModel = await admin
    .from("products")
    .update({
      model_storage_path: modelPath,
      status: "active",
      is_public: true,
      brand_id: null,
      item_code: product.item_code ?? "E2E-EDITOR-001",
    })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);
  // Separate update: `products_reset_model_scale` fires before update OF
  // `model_storage_path` and clobbers scale fields set in the same statement.
  const confirmScale = await admin
    .from("products")
    .update({ model_scale_status: "confirmed", model_scale_factor: 1, model_scale_method: "unit_mm", model_scale_reference_variant_id: size.data.id })
    .eq("id", product.id);
  if (confirmScale.error) throw new Error(confirmScale.error.message);
  const itemCode = product.item_code ?? "E2E-EDITOR-001";

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
    await admin.from("product_size_variants").delete().eq("id", size.data.id);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
  };

  try {
    const url = `${base}/designer-studio/editor/new?product=${product.slug}`;

    /* ---- anonymous: canvas renders, PRODUCT group, sign-in banner ---- */
    await page.goto(url, { waitUntil: "networkidle" });
    await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 20000 });
    await page.getByText("Sign in to save this design.").waitFor({ timeout: 10000 });
    const panel = page.getByTestId("editor-panel");
    await panel.waitFor({ timeout: 10000 });
    const panelText = await panel.innerText();
    assert.ok(panelText.includes(product.name), "PRODUCT group shows the product name");
    assert.ok(panelText.includes(itemCode), "PRODUCT group shows the item code");
    // Phase 3: the second group is FINISH for a metal product, COLOUR otherwise.
    // E2 U3: groups are read by `data-group`, not by their heading copy; E2
    // ruling 3 deleted the empty Output group rather than carry a placeholder.
    const groups = await page.locator('[data-testid="panel-group"]').evaluateAll((els) => els.map((el) => el.getAttribute("data-group")));
    assert.ok(groups.includes("product"), "the PRODUCT group renders");
    assert.ok(groups.includes("finish") || groups.includes("colour"), "a finish or a colour group renders");
    assert.equal(await page.getByTestId("branding-group").count(), 1, "the BRANDING group renders");
    assert.ok(!groups.includes("output"), "and no empty Output placeholder");

    /* ---- bare /editor redirects, mapping legacy ?slug= to ?product= ---- */
    await page.goto(`${base}/designer-studio/editor?slug=${product.slug}`, { waitUntil: "networkidle" });
    await page.waitForURL((u) => u.pathname === "/designer-studio/editor/new" && u.searchParams.get("product") === product.slug, { timeout: 10000 });

    /* ---- signed in: a designs row is created, lands on /:designId ---- */
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await page.evaluate(() => window.sessionStorage.clear());

    await h.login(editor);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();

    const { data: design, error: designError } = await admin
      .from("designs")
      .select("id, product_id, owner_id, status")
      .eq("id", designId)
      .single();
    if (designError) throw new Error(designError.message);
    assert.equal(design.product_id, product.id, "the design is linked to the right product");
    assert.equal(design.status, "draft");

    await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 20000 });
    await page.getByTestId("editor-panel").waitFor({ timeout: 10000 });

    return {
      anonymous: "canvas + PRODUCT group + sign-in banner",
      bareRedirect: "?slug= mapped to /new?product=",
      signedIn: { designId, productId: design.product_id, status: design.status },
    };
  } finally {
    await restore();
  }
}
