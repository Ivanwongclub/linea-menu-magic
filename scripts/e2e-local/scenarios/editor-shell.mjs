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
    .select("id, slug, name, item_code, model_storage_path, status, is_public, brand_id")
    .like("slug", "sample-%")
    .order("slug")
    .limit(1)
    .single();

  const modelPath = `models/${product.id}/e2e-test.obj`;
  const uploaded = await admin.storage
    .from("product-models")
    .upload(modelPath, new Blob([TINY_OBJ], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (uploaded.error) throw new Error(uploaded.error.message);
  // Anonymous visibility needs a published house product with an item code —
  // the seed's "sample-%" rows are drafts (brand-scoped-product.mjs hits the same thing).
  const setModel = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-EDITOR-001" })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);
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
      })
      .eq("id", product.id);
    await admin.storage.from("product-models").remove([modelPath]);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
  };

  try {
    const url = `${base}/designer-studio/editor/new?product=${product.slug}`;

    /* ---- anonymous: canvas renders, PRODUCT group, sign-in banner ---- */
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("canvas").first().waitFor({ timeout: 20000 });
    await page.getByText("Sign in to save this design.").waitFor({ timeout: 10000 });
    const panel = page.getByTestId("editor-panel");
    await panel.waitFor({ timeout: 10000 });
    const panelText = await panel.innerText();
    assert.ok(panelText.includes(product.name), "PRODUCT group shows the product name");
    assert.ok(panelText.includes(itemCode), "PRODUCT group shows the item code");
    // Phase 3: the second group is FINISH for a metal product, COLOUR otherwise.
    assert.ok(
      /Product/i.test(panelText) && (/Finish/i.test(panelText) || /Colour/i.test(panelText)) && /Branding/i.test(panelText) && /Output/i.test(panelText),
      "all four groups render",
    );

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

    await page.locator("canvas").first().waitFor({ timeout: 20000 });
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
