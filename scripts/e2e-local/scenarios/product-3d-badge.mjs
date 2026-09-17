// Unit 5b R1/R2 — a product is 3D-ready when it has a model *and* a confirmed
// scale, and every surface says so with the same mark.
//
//   1. Catalogue card, trim-library card and product page carry the 3D badge
//      on a ready product, and the product page offers "Design in 3D" pointing
//      at the Phase 2 editor route.
//   2. The same product with its scale unconfirmed: no badge anywhere, and no
//      editor entry at all (not a disabled one).
//   3. A product with no model at all: no badge, no entry.
//   4. Admin: the 3D column reads Ready / Unconfirmed / None and the filter
//      narrows the list to each.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POLO_OBJ } from "../lib/calibration.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";

export default async function ({ page, base, admin, editor, h }) {
  const { data: products } = await admin
    .from("products")
    .select("id, slug, name, item_code, status, is_public, brand_id, model_storage_path, model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id")
    .like("slug", "sample-%")
    .order("slug")
    .limit(12);
  // Distinct from the products the editor scenarios stage (0..7).
  const ready = products[9];
  const bare = products[10];
  assert.ok(ready && bare, "two more sample products exist");

  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const modelPath = `models/${ready.id}/e2e-3d-badge.obj`;
  const before = { ...ready };

  const restore = async () => {
    await admin
      .from("products")
      .update({
        model_storage_path: before.model_storage_path,
        status: before.status,
        is_public: before.is_public,
        brand_id: before.brand_id,
        model_scale_status: before.model_scale_status ?? "unconfirmed",
        model_scale_factor: before.model_scale_factor ?? null,
        model_scale_method: before.model_scale_method ?? null,
        model_scale_reference_variant_id: before.model_scale_reference_variant_id ?? null,
        item_code: before.item_code,
      })
      .eq("id", ready.id);
    await admin.from("products").update({ status: bare.status, is_public: bare.is_public, item_code: bare.item_code }).eq("id", bare.id);
    await admin.storage.from("product-models").remove([modelPath]);
    await admin.from("product_size_variants").delete().eq("product_id", ready.id).eq("sort_order", 900);
  };

  const badges = async () => page.getByTestId("badge-3d").count();
  const cardBadge = async (slug) =>
    page.evaluate((s) => {
      const link = document.querySelector(`a[href$="/${s}"], a[href*="/${s}?"]`);
      const card = link?.closest("a") ?? link;
      return !!card?.querySelector('[data-testid="badge-3d"]');
    }, slug);

  const out = {};
  try {
    const up = await admin.storage.from("product-models").upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
    if (up.error) throw new Error(up.error.message);
    const variant = await admin
      .from("product_size_variants")
      .insert({ product_id: ready.id, size_primary_mm: 10.8, is_default: true, sort_order: 900 })
      .select("id")
      .single();
    if (variant.error) throw new Error(variant.error.message);
    const publish = await admin
      .from("products")
      .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: ready.item_code ?? "E2E-3D-READY" })
      .eq("id", ready.id);
    if (publish.error) throw new Error(publish.error.message);
    // The scale reset trigger fires on the path change, so confirming is its own write.
    const confirm = await admin
      .from("products")
      .update({ model_scale_status: "confirmed", model_scale_factor: factor, model_scale_method: "unit_mm", model_scale_reference_variant_id: variant.data.id })
      .eq("id", ready.id);
    if (confirm.error) throw new Error(confirm.error.message);
    await admin
      .from("products")
      .update({ status: "active", is_public: true, brand_id: null, item_code: bare.item_code ?? "E2E-3D-NONE" })
      .eq("id", bare.id);

    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();

    /* ---- 1. the badge on every catalogue surface, and the editor entry ---- */
    await page.goto(`${base}/products?search=${encodeURIComponent(ready.name)}`, { waitUntil: "networkidle" });
    await page.getByTestId("badge-3d").first().waitFor({ timeout: 20000 });
    assert.ok(await cardBadge(ready.slug), "the catalogue card carries the badge");
    out.catalogue = await badges();

    await page.goto(`${base}/designer-studio/trim-library`, { waitUntil: "networkidle" });
    await page.getByTestId("badge-3d").first().waitFor({ timeout: 20000 });
    assert.ok(await cardBadge(ready.slug), "the trim-library card carries the same badge");
    out.trimLibrary = await badges();

    await page.goto(`${base}/products/${ready.slug}`, { waitUntil: "networkidle" });
    await page.getByTestId("badge-3d").first().waitFor({ timeout: 20000 });
    const entry = page.getByTestId("product-design-3d");
    await entry.waitFor({ timeout: 20000 });
    // `asChild` puts the test id on the anchor itself.
    const href = await entry.getAttribute("href");
    assert.equal(href, `/designer-studio/editor/new?product=${ready.slug}`, `the entry points at the editor: ${href}`);
    out.entry = href;
    // And it opens: the editor renders the model rather than the awaiting-setup screen.
    await entry.click();
    await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 40000 });
    assert.equal(await page.getByTestId("editor-awaiting-setup").count(), 0, "the entry leads to a working editor");

    /* ---- 2. unconfirmed scale: no badge, no entry ---- */
    const unconfirm = await admin.from("products").update({ model_scale_status: "unconfirmed", model_scale_factor: null }).eq("id", ready.id);
    if (unconfirm.error) throw new Error(unconfirm.error.message);
    await page.goto(`${base}/products/${ready.slug}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 20000 });
    assert.equal(await badges(), 0, "a model with an unconfirmed scale is not 3D-ready");
    assert.equal(await page.getByTestId("product-design-3d").count(), 0, "and offers no editor entry, disabled or otherwise");
    await page.goto(`${base}/products?search=${encodeURIComponent(ready.name)}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    assert.equal(await cardBadge(ready.slug), false, "nor a badge on its card");

    /* ---- 3. no model at all ---- */
    await page.goto(`${base}/products/${bare.slug}`, { waitUntil: "networkidle" });
    await page.getByRole("heading", { level: 1 }).first().waitFor({ timeout: 20000 });
    assert.equal(await badges(), 0, "a product with no model shows nothing");
    assert.equal(await page.getByTestId("product-design-3d").count(), 0, "and no entry");

    /* ---- 4. the admin column and its filter (R2) ---- */
    await h.login(editor);
    await page.goto(`${base}/admin/products`, { waitUntil: "networkidle" });
    const stateOf = async (name) =>
      page.evaluate((productName) => {
        const row = [...document.querySelectorAll("tbody tr")].find((tr) => tr.textContent?.includes(productName));
        return row?.querySelector('[data-testid="admin-3d-state"]')?.getAttribute("data-state") ?? null;
      }, name);
    await page.locator("tbody tr").first().waitFor({ timeout: 20000 });
    assert.equal(await stateOf(ready.name), "unconfirmed", "the uploaded-but-unconfirmed product reads Unconfirmed");
    assert.equal(await stateOf(bare.name), "none", "a product with no model reads None");

    await admin.from("products").update({ model_scale_status: "confirmed", model_scale_factor: factor }).eq("id", ready.id);
    await page.reload({ waitUntil: "networkidle" });
    await page.locator("tbody tr").first().waitFor({ timeout: 20000 });
    assert.equal(await stateOf(ready.name), "ready", "confirming the scale makes it Ready");

    await h.selectOption(page.getByTestId("admin-filter-3d"), "Ready");
    await page.waitForTimeout(600);
    const readyRows = await page.evaluate(() =>
      [...document.querySelectorAll("tbody tr")].map((tr) => tr.querySelector('[data-testid="admin-3d-state"]')?.getAttribute("data-state")),
    );
    assert.ok(readyRows.length > 0 && readyRows.every((s) => s === "ready"), `the filter narrows to Ready: ${JSON.stringify(readyRows)}`);
    assert.ok(await stateOf(ready.name), "and the ready product is in it");

    await h.selectOption(page.getByTestId("admin-filter-3d"), "None");
    await page.waitForTimeout(600);
    const noneRows = await page.evaluate(() =>
      [...document.querySelectorAll("tbody tr")].map((tr) => tr.querySelector('[data-testid="admin-3d-state"]')?.getAttribute("data-state")),
    );
    assert.ok(noneRows.length > 0 && noneRows.every((s) => s === "none"), "and to None");
    assert.equal(await stateOf(ready.name), null, "the ready product is filtered out");
    out.admin = { ready: readyRows.length, none: noneRows.length };

    return out;
  } finally {
    await restore();
  }
}
