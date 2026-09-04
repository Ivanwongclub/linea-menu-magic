// Phase 5: size variants — insert path (the id-null regression), upsert + insert batch, read-back.
import assert from "node:assert/strict";

export default async function ({ page, admin, editor, h }) {
  const { data: product } = await admin.from("products").select("id, slug").eq("slug", "sample-hook-and-loop").single();
  await admin.from("product_size_variants").delete().eq("product_id", product.id);

  await h.login(editor);
  await h.openProduct(product.id);
  await page.getByRole("heading", { name: "Size variants" }).waitFor();

  // Insert
  await page.getByRole("button", { name: "Add size" }).click();
  await page.getByPlaceholder("e.g. 15").last().fill("15");
  await page.getByRole("button", { name: "Save sizes" }).click();
  await h.waitForToast(/Sizes saved/);

  let { data: rows } = await admin.from("product_size_variants").select("*").eq("product_id", product.id).order("sort_order");
  assert.equal(rows.length, 1);
  assert.match(rows[0].id, /^[0-9a-f-]{36}$/);
  assert.equal(rows[0].size_ligne, 23.6);

  // Upsert + insert in one batch
  await page.reload({ waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Size variants" }).waitFor();
  await page.getByPlaceholder("e.g. 20 × 15").first().fill("Small");
  await page.getByRole("button", { name: "Add size" }).click();
  await page.getByPlaceholder("e.g. 15").last().fill("20");
  await page.getByRole("button", { name: "Save sizes" }).click();
  await h.waitForToast(/Sizes saved/);

  ({ data: rows } = await admin.from("product_size_variants").select("*").eq("product_id", product.id).order("sort_order"));
  assert.equal(rows.length, 2);
  assert.equal(rows[0].size_label, "Small");
  assert.equal(rows[0].is_default, true);
  assert.equal(rows[1].size_ligne, 31.5);

  return rows.map((r) => ({ primary: r.size_primary_mm, label: r.size_label, ligne: r.size_ligne, default: r.is_default }));
}
