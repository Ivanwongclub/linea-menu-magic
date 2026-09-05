// Phase 8: photographed swatch on a finish — upload sets swatch_url and
// replaces the rendered material; remove clears it and deletes the object.
import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import sharp from "sharp";

const BUCKET = "product-assets";

export default async function ({ page, admin, editor, base, h }) {
  const { data: finish } = await admin.from("finishes").select("id, cyc_code, swatch_url").eq("cyc_code", "CYC-0001").single();
  await admin.from("finishes").update({ swatch_url: null }).eq("id", finish.id);
  const { data: old } = await admin.storage.from(BUCKET).list(`finishes/${finish.id}`);
  if (old?.length) await admin.storage.from(BUCKET).remove(old.map((o) => `finishes/${finish.id}/${o.name}`));

  const dir = mkdtempSync(path.join(tmpdir(), "e2e-swatch-"));
  const photo = path.join(dir, "swatch.jpg");
  await sharp({ create: { width: 2400, height: 2400, channels: 3, background: "#8a8f94" } }).jpeg().toFile(photo);

  await h.login(editor);
  await page.goto(`${base}/admin/finishes`, { waitUntil: "networkidle" });
  await page.getByPlaceholder("Search code or name").fill("CYC-0001");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="finish-row"]').length === 1);
  const before = await page.locator('[data-testid="finish-row"] [data-surface]').evaluate((el) => getComputedStyle(el).backgroundImage);
  assert.match(before, /data:image\/svg\+xml/, "rendered material before any photo");

  await page.getByTestId("finish-row").click();
  await page.getByRole("dialog").waitFor();
  await page.getByTestId("swatch-file").setInputFiles(photo);
  await h.waitForToast(/Swatch photo uploaded/);
  let { data: row } = await admin.from("finishes").select("swatch_url").eq("id", finish.id).single();
  assert.match(row.swatch_url, new RegExp(`/${BUCKET}/finishes/${finish.id}/.+\\.jpg$`), "swatch_url points at our bucket");
  const objectPath = row.swatch_url.split(`/object/public/${BUCKET}/`)[1];
  const { data: blob } = await admin.storage.from(BUCKET).download(objectPath);
  const meta = await sharp(Buffer.from(await blob.arrayBuffer())).metadata();
  assert.deepEqual([meta.width, meta.height], [1600, 1600], "resized master");

  // The manager row (and therefore the picker) now shows the photo, not the render.
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="finish-row"] [data-surface]');
    return el && !getComputedStyle(el).backgroundImage.includes("data:image/svg+xml");
  });
  const after = await page.locator('[data-testid="finish-row"] [data-surface]').evaluate((el) => getComputedStyle(el).backgroundImage);
  assert.match(after, /finishes\//, "photo served instead of the render");

  // Remove: column cleared, object gone, render back.
  await page.getByTestId("finish-row").click();
  await page.getByRole("dialog").waitFor();
  await page.getByTestId("swatch-remove").click();
  await h.waitForToast(/Swatch photo removed/);
  ({ data: row } = await admin.from("finishes").select("swatch_url").eq("id", finish.id).single());
  assert.equal(row.swatch_url, null);
  const { data: remaining } = await admin.storage.from(BUCKET).list(`finishes/${finish.id}`);
  assert.equal((remaining ?? []).filter((o) => !o.name.startsWith(".")).length, 0, "object deleted");

  return { uploaded: [meta.format, meta.width, meta.height], servedPhoto: /finishes\//.test(after), removed: row.swatch_url === null };
}
