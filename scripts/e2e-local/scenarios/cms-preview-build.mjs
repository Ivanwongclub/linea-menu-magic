// Phase 4h (R5) — the CMS 3D preview in a production build.
// Run with E2E_BUILD=1 (vite build + vite preview); refuses to run against
// the dev server, whose unbundled modules can't show a chunk failure.
//
// 1. A product with the Polo uploaded: "Show 3D preview" leaves "Loading
//    preview…" and the canvas reaches data-state="ready" (model drawn).
// 2. The preview chunk fails (served as HTML, as a stale deploy does): the
//    section shows "The preview couldn't load." with Retry — the admin page
//    stays up (before 4h the whole page fell to the app error screen). With
//    the chunk restored, Retry reloads the page and the preview reaches ready.
// 3. The OBJ request never answers: the canvas shows "Loading model…" over
//    it instead of a blank frame.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POLO_OBJ } from "../lib/calibration.mjs";

const CHUNK = /\/assets\/ProductModelPreview-[^/]+\.js$/;

export default async function ({ page, base, admin, editor, h }) {
  const html = await (await fetch(base)).text();
  assert.ok(!html.includes("/@vite/client"), "run with E2E_BUILD=1: this scenario checks the production build");

  const { data: products, error } = await admin.from("products").select("id").order("created_at").limit(4);
  if (error) throw new Error(error.message);
  const product = products[3]; // distinct from cms-model-scale [0], cms-two-point [1], cms-branding-marks [2]

  const cleanup = async () => {
    await admin.from("products").update({ model_storage_path: null }).eq("id", product.id);
    const { data: files } = await admin.storage.from("product-models").list(`models/${product.id}`);
    if (files?.length) await admin.storage.from("product-models").remove(files.map((f) => `models/${product.id}/${f.name}`));
  };

  const preview = page.getByTestId("model-preview-canvas");
  const fallback = page.getByTestId("model-preview-fallback");
  const waitReady = () =>
    page.waitForFunction(() => document.querySelector('[data-testid="model-preview-canvas"]')?.dataset.state === "ready", null, { timeout: 45000 });

  await cleanup();
  const out = {};
  try {
    await h.login(editor);
    await h.openProduct(product.id);
    await page
      .locator('[data-testid="model-input"]')
      .setInputFiles({ name: "polo-preview.obj", mimeType: "model/obj", buffer: readFileSync(POLO_OBJ) });
    await h.waitForToast(/3D model uploaded/i);

    /* ---- 1. happy path ---- */
    await h.openProduct(product.id);
    const started = Date.now();
    await page.getByTestId("model-scale-preview-toggle").click();
    await waitReady();
    out.readyMs = Date.now() - started;
    assert.equal(await page.getByText("Loading preview…").count(), 0, "no lingering chunk fallback");

    /* ---- 2. chunk failure → message + Retry, page intact; Retry recovers ---- */
    let chunkRequests = 0;
    await page.route(CHUNK, (route) => {
      chunkRequests++;
      return route.fulfill({ status: 200, contentType: "text/html", body: "<!doctype html><html></html>" });
    });
    await h.openProduct(product.id); // fresh document: no module cached
    await page.getByTestId("model-scale-preview-toggle").click();
    await fallback.and(page.locator('[data-state="failed"]')).waitFor({ timeout: 20000 });
    assert.ok(chunkRequests > 0, "the preview chunk was requested");
    assert.equal(await page.getByRole("heading", { name: "Identity" }).count(), 1, "the product editor is still on screen");
    assert.equal(await page.getByText(/Something went wrong/i).count(), 0, "no app-level error screen");
    await page.unroute(CHUNK);
    // A failed module stays failed for the document, so Retry reloads the page.
    await Promise.all([page.waitForEvent("load", { timeout: 30000 }), page.getByTestId("model-preview-retry").click()]);
    await page.getByRole("heading", { name: "Identity" }).waitFor({ timeout: 20000 });
    await page.getByTestId("model-scale-preview-toggle").click();
    await waitReady();
    out.chunkFailure = { requests: chunkRequests, recovered: true };

    /* ---- 3. model request hangs → visible model-loading state ---- */
    await page.route(/\/product-models\/.*\.obj/, () => {
      /* never answered */
    });
    await h.openProduct(product.id);
    await page.getByTestId("model-scale-preview-toggle").click();
    await preview.waitFor({ timeout: 20000 });
    await page.getByTestId("model-preview-model-loading").waitFor({ timeout: 10000 });
    assert.equal(await preview.getAttribute("data-state"), "loading");
    assert.equal(await page.getByTestId("model-preview-model-loading").innerText(), "Loading model…");
    await page.unroute(/\/product-models\/.*\.obj/);
    out.modelHang = "loading overlay shown";

    return out;
  } finally {
    await cleanup();
  }
}
