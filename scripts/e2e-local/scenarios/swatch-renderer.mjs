// Swatch renderer + derived material columns: the four nickels take four
// different branches of the model, and changing an axis through
// /admin/finishes recomputes the columns (derived-on-write, UPDATE as well
// as INSERT), while a hand-set value is respected.
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";

export default async function ({ page, admin, editor, base, h }) {
  const CODES = ["CYC-0001", "CYC-0002", "CYC-0003", "CYC-0028"];
  const { data: nickels } = await admin
    .from("finishes")
    .select("cyc_code, factory_name_en, hex_approx, metalness, roughness, anisotropy, surface_id")
    .in("cyc_code", CODES)
    .order("cyc_code");
  const byCode = Object.fromEntries(nickels.map((n) => [n.cyc_code, n]));
  assert.deepEqual(
    CODES.map((c) => [byCode[c].metalness, byCode[c].roughness, byCode[c].anisotropy]),
    [[1, 0.08, 0], [1, 0.35, 0.85], [1, 0.7, 0], [1, 0.95, 0]],
    "derived columns match the reference table",
  );

  await h.login(editor);

  /* ---- the picker renders each nickel on a different branch ---- */
  await admin.from("product_materials").update({ is_metal: true }).in("name", ["Brass", "Stainless Steel", "Zinc Alloy"]);
  const { data: metal } = await admin.from("products").select("id").eq("slug", "sample-zipper-pullers-sliders").single();
  await h.openProduct(metal.id);
  await page.getByTestId("finish-section").waitFor();
  await page.getByTestId("finish-swatch").first().waitFor();

  const surfaces = {};
  const shots = "scripts/e2e-local/.shots";
  mkdirSync(shots, { recursive: true });
  for (const code of CODES) {
    const swatch = page.locator(`[data-testid="finish-swatch"][data-code="${code}"] [data-surface]`);
    await swatch.scrollIntoViewIfNeeded();
    surfaces[code] = await swatch.getAttribute("data-surface");
    const bg = await swatch.evaluate((el) => getComputedStyle(el).backgroundImage);
    assert.match(bg, /data:image\/svg\+xml/, `${code} is a rendered SVG, not a flat colour`);
    await swatch.screenshot({ path: `${shots}/${code}.png` });
  }
  assert.deepEqual(surfaces, { "CYC-0001": "mirror", "CYC-0002": "brushed", "CYC-0003": "matt", "CYC-0028": "sand" });

  /* ---- trigger recomputes on UPDATE through the finish manager ---- */
  await page.goto(`${base}/admin/finishes`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Search code or name").fill("CYC-0003");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="finish-row"]').length === 1);
  const rowSurfaceBefore = await page.locator('[data-testid="finish-row"] [data-surface]').getAttribute("data-surface");
  assert.equal(rowSurfaceBefore, "matt");

  await page.getByTestId("finish-row").click();
  await page.getByRole("dialog").waitFor();
  await h.selectOption(page.getByTestId("finish-axis-surface"), /^Brushed$/);
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await h.waitForDialogClosed();

  let { data: after } = await admin.from("finishes").select("roughness, anisotropy, metalness").eq("cyc_code", "CYC-0003").single();
  assert.deepEqual([after.metalness, after.roughness, after.anisotropy], [1, 0.35, 0.85], "MATT → BRUSHED recomputed on UPDATE");
  await page.waitForFunction(() => document.querySelector('[data-testid="finish-row"] [data-surface]')?.getAttribute("data-surface") === "brushed");

  // and back, so the chart is left as it was
  await page.getByTestId("finish-row").click();
  await page.getByRole("dialog").waitFor();
  await h.selectOption(page.getByTestId("finish-axis-surface"), /^Matt$/);
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await h.waitForDialogClosed();
  ({ data: after } = await admin.from("finishes").select("roughness, anisotropy").eq("cyc_code", "CYC-0003").single());
  assert.deepEqual([after.roughness, after.anisotropy], [0.7, 0], "BRUSHED → MATT recomputed");

  /* ---- a hand-set value is respected; a later axis change re-derives ---- */
  await admin.from("finishes").update({ roughness: 0.5 }).eq("cyc_code", "CYC-0003");
  ({ data: after } = await admin.from("finishes").select("roughness").eq("cyc_code", "CYC-0003").single());
  assert.equal(after.roughness, 0.5, "explicit value kept");
  await admin.from("finishes").update({ surface_id: byCode["CYC-0003"].surface_id }).eq("cyc_code", "CYC-0003"); // same axis, no change → untouched
  ({ data: after } = await admin.from("finishes").select("roughness").eq("cyc_code", "CYC-0003").single());
  assert.equal(after.roughness, 0.5, "no-op axis write leaves the hand-set value");
  await admin.from("finishes").update({ surface_id: byCode["CYC-0002"].surface_id }).eq("cyc_code", "CYC-0003"); // real axis change → re-derived
  ({ data: after } = await admin.from("finishes").select("roughness, anisotropy").eq("cyc_code", "CYC-0003").single());
  assert.deepEqual([after.roughness, after.anisotropy], [0.35, 0.85], "axis change re-derives over a hand-set value");
  await admin.from("finishes").update({ surface_id: byCode["CYC-0003"].surface_id }).eq("cyc_code", "CYC-0003");
  ({ data: after } = await admin.from("finishes").select("roughness, anisotropy").eq("cyc_code", "CYC-0003").single());
  assert.deepEqual([after.roughness, after.anisotropy], [0.7, 0]);

  return { nickels: nickels.map((n) => [n.cyc_code, n.metalness, n.roughness, n.anisotropy]), surfaces, screenshots: shots };
}
