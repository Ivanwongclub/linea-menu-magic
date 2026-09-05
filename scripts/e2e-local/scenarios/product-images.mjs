// Phase 8: product gallery — upload (resized client-side), reorder, primary,
// alt text, delete (file AND row), each read back; anonymous read sees it.
import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "product-assets";

async function storedObjects(admin, prefix) {
  const { data, error } = await admin.storage.from(BUCKET).list(prefix, { limit: 100 });
  if (error) throw error;
  return (data ?? []).filter((o) => o.name && !o.name.startsWith("."));
}

async function storedMeta(admin, url) {
  const objectPath = decodeURIComponent(url.split(`/object/public/${BUCKET}/`)[1].split("?")[0]);
  const { data, error } = await admin.storage.from(BUCKET).download(objectPath);
  if (error) throw error;
  return sharp(Buffer.from(await data.arrayBuffer())).metadata();
}

export default async function ({ page, admin, editor, status, h }) {
  const { data: product } = await admin.from("products").select("id, name").eq("slug", "sample-hook-and-loop").single();
  // Clean slate: rows and any objects under this product's prefix.
  await admin.from("product_images").delete().eq("product_id", product.id);
  const leftovers = await storedObjects(admin, `images/${product.id}`);
  if (leftovers.length) await admin.storage.from(BUCKET).remove(leftovers.map((o) => `images/${product.id}/${o.name}`));

  // Test files: an oversize "phone photo" and a PNG cut-out with real transparency.
  const dir = mkdtempSync(path.join(tmpdir(), "e2e-images-"));
  const big = path.join(dir, "phone-photo.jpg");
  await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#4060a0" } }).jpeg({ quality: 92 }).toFile(big);
  const cutout = path.join(dir, "cutout.png");
  await sharp({ create: { width: 800, height: 600, channels: 4, background: { r: 200, g: 40, b: 40, alpha: 0.5 } } }).png().toFile(cutout);
  const notImage = path.join(dir, "notes.txt");
  writeFileSync(notImage, "not an image");

  await h.login(editor);
  await h.openProduct(product.id);
  await page.getByTestId("images-section").waitFor();

  /* ---- upload two through the real input ---- */
  await page.getByTestId("image-input").setInputFiles([big, cutout, notImage]);
  await h.waitForToast(/2 uploaded/);
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="product-image"]').length === 2);
  let { data: rows } = await admin.from("product_images").select("*").eq("product_id", product.id).order("sort_order");
  assert.equal(rows.length, 2);
  for (const r of rows) assert.match(r.id, /^[0-9a-f-]{36}$/);
  assert.deepEqual(rows.map((r) => [r.sort_order, r.is_primary, r.alt_text]), [
    [0, true, product.name],
    [1, false, `${product.name} 2`],
  ]);
  const master = await storedMeta(admin, rows[0].url);
  assert.equal(master.format, "jpeg");
  assert.deepEqual([master.width, master.height], [1600, 1067], "3000×2000 resized to 1600 on the long edge");
  const png = await storedMeta(admin, rows[1].url);
  assert.equal(png.format, "png", "transparent PNG stays PNG");
  assert.equal(png.width, 800, "never upscaled");
  assert.equal(png.hasAlpha, true);
  const out = { master: [master.format, master.width, master.height], cutout: [png.format, png.width, png.hasAlpha] };

  /* ---- reorder (keyboard), save, read back ---- */
  // Grid layout: the second tile is to the RIGHT of the first, so move it left.
  await h.keyboardReorder(page.locator('[data-testid="product-image"]').nth(1).getByLabel("Drag to reorder"), "left");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="product-image"]')[0]?.querySelector("img")?.getAttribute("src")?.endsWith(".png"));
  await h.expectToast(/Images saved/, () => page.getByRole("button", { name: "Save images" }).click());
  ({ data: rows } = await admin.from("product_images").select("id, url, sort_order, is_primary, alt_text").eq("product_id", product.id).order("sort_order"));
  assert.match(rows[0].url, /\.png$/, "PNG is now first");
  assert.deepEqual(rows.map((r) => r.sort_order), [0, 1]);

  /* ---- primary change ---- */
  const pngId = rows[0].id;
  await h.expectToast(/Primary image updated/, () => page.locator(`[data-testid="product-image"][data-image-id="${pngId}"]`).getByRole("radio").click());
  ({ data: rows } = await admin.from("product_images").select("id, is_primary").eq("product_id", product.id));
  assert.deepEqual(rows.filter((r) => r.is_primary).map((r) => r.id), [pngId], "exactly one primary, the chosen one");

  /* ---- alt text ---- */
  await page.locator(`[data-testid="product-image"][data-image-id="${pngId}"]`).getByTestId("image-alt").fill("Front view, brass");
  await h.expectToast(/Images saved/, () => page.getByRole("button", { name: "Save images" }).click());
  const { data: altRow } = await admin.from("product_images").select("alt_text").eq("id", pngId).single();
  assert.equal(altRow.alt_text, "Front view, brass");

  /* ---- anonymous read follows the product's visibility (P21 policy) ---- */
  const anon = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
  let { data: publicRows } = await anon.from("product_images").select("url, is_primary").eq("product_id", product.id).order("sort_order");
  assert.equal(publicRows.length, 0, "a draft product's images are not readable anonymously");
  await admin.from("products").update({ status: "active", is_public: true, item_code: "E2E-IMG-001" }).eq("id", product.id);
  ({ data: publicRows } = await anon.from("product_images").select("url, is_primary").eq("product_id", product.id).order("sort_order"));
  assert.equal(publicRows.length, 2, "published product's gallery is public");
  assert.equal(publicRows[0].is_primary, true, "primary comes first for the storefront");
  await admin.from("products").update({ status: "draft", is_public: false, item_code: null }).eq("id", product.id);
  out.anonymous = { whileDraft: 0, whenPublished: publicRows.length };

  /* ---- delete: object first, then row ---- */
  const before = await storedObjects(admin, `images/${product.id}`);
  assert.equal(before.length, 2);
  const jpgRow = (await admin.from("product_images").select("id, url").eq("product_id", product.id).like("url", "%.jpg").single()).data;
  await page.locator(`[data-testid="product-image"][data-image-id="${jpgRow.id}"]`).getByLabel("Delete image").click();
  await h.expectToast(/Image deleted/, () => page.getByRole("button", { name: "Delete", exact: true }).click());
  ({ data: rows } = await admin.from("product_images").select("id").eq("product_id", product.id));
  assert.equal(rows.length, 1);
  const after = await storedObjects(admin, `images/${product.id}`);
  assert.equal(after.length, 1, "storage object removed with the row");
  assert.ok(!after.some((o) => jpgRow.url.endsWith(o.name)), "the deleted image's file is gone");
  out.delete = { rowsAfter: rows.length, objectsAfter: after.length };

  // leave the product clean
  await admin.storage.from(BUCKET).remove(after.map((o) => `images/${product.id}/${o.name}`));
  await admin.from("product_images").delete().eq("product_id", product.id);
  return out;
}
