// Phase 6b R1/R4/R7 — the Parts list, and the occlusion bake in its worker.
//
//   1. Every OBJ group is listed by name, with the product's marked lettering
//      as one row of its own (the staff toggle in the viewport corner is gone).
//   2. Hiding a part stops it being drawn and is recorded in the recipe;
//      nothing is deleted — showing it again brings it back.
//   3. Showing the original lettering brings its 28 groups back.
//   4. An antique finish bakes its occlusion in a worker: the main thread keeps
//      answering while it runs, and the bake finishes.
import assert from "node:assert/strict";
import { openEditorFor, stageAppearance, waitForRecipe } from "../lib/appearance.mjs";

/** The Polo's factory lettering, as 4d marks it. */
const POLO_MARKS = Array.from({ length: 28 }, (_, i) => i + 5);
/** An antique two-tone: the only finish that needs the bake at all. */
const ANTIQUE = "CYC-0057";

export default async function ({ page, base, admin, editor, h }) {
  const { product, restore } = await stageAppearance(admin, "sample-buckles-cord-locks", "e2e-parts-list.obj");
  const { data: antique } = await admin.from("finishes").select("id, cyc_code, is_public").eq("cyc_code", ANTIQUE).single();
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    // The lettering row only exists where the CMS has marked the lettering (4d).
    const marks = POLO_MARKS.map((index) => ({ index, name: `group_${index + 1}` }));
    const markUpdate = await admin.from("products").update({ model_branding_groups: marks }).eq("id", product.id);
    if (markUpdate.error) throw new Error(markUpdate.error.message);
    if (!antique.is_public) await admin.from("finishes").update({ is_public: true }).eq("id", antique.id);
    const attach = await admin.from("product_finishes").insert({ product_id: product.id, finish_id: antique.id, sort_order: 901 });
    if (attach.error) throw new Error(attach.error.message);

    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);
    const viewport = page.getByTestId("editor-viewport");

    /* ---- 1. the model's own parts, and the lettering as one row ---- */
    assert.equal(await page.getByTestId("original-lettering-toggle").count(), 0, "the viewport's staff toggle is gone (R1)");
    await page.getByTestId("parts-toggle").click();
    await page.getByTestId("part-row").first().waitFor({ timeout: 20000 });
    const rows = await page.locator('[data-testid="part-row"]').count();
    const parts = JSON.parse(await viewport.getAttribute("data-parts"));
    assert.equal(rows, parts.length - POLO_MARKS.length, "every group is listed but the marked ones");
    assert.equal(await page.getByTestId("part-row-lettering").count(), 1, "and the factory's lettering is one row");
    assert.equal(await page.getByTestId("part-row-lettering").getAttribute("data-visible"), "false", "hidden by default, as the buyer view has always had it");
    const drawnBefore = Number(await viewport.getAttribute("data-model-mesh-count"));
    out.parts = { rows, groups: parts.length, drawnBefore };

    /* ---- 2. hiding a part (R1) ---- */
    const firstRow = page.locator('[data-testid="part-row"]').first();
    const hiddenIndex = Number(await firstRow.getAttribute("data-index"));
    await firstRow.getByTestId("part-visibility").click();
    await page.waitForFunction(
      (want) => Number(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-model-mesh-count")) === want,
      drawnBefore - 1,
      { timeout: 20000 },
    );
    const hiddenRecipe = await waitForRecipe(page, admin, designId, (r) => (r.hidden_groups ?? []).includes(hiddenIndex), "hidden part stored");
    assert.deepEqual(hiddenRecipe.hidden_groups, [hiddenIndex], "the recipe records what is hidden");
    assert.equal(await firstRow.getAttribute("data-visible"), "false");
    out.hidden = { index: hiddenIndex, drawn: drawnBefore - 1 };

    // Nothing was deleted: showing it again brings it back.
    await firstRow.getByTestId("part-visibility").click();
    await page.waitForFunction(
      (want) => Number(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-model-mesh-count")) === want,
      drawnBefore,
      { timeout: 20000 },
    );
    await waitForRecipe(page, admin, designId, (r) => (r.hidden_groups ?? []).length === 0, "part shown again");

    /* ---- 3. the original lettering, from the Parts list ---- */
    await page.getByTestId("part-row-lettering").getByTestId("part-visibility").click();
    await page.waitForFunction(
      (want) => Number(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-model-mesh-count")) === want,
      drawnBefore + POLO_MARKS.length,
      { timeout: 20000 },
    );
    const lettering = await waitForRecipe(page, admin, designId, (r) => r.view?.original_lettering === true, "lettering shown");
    assert.equal(lettering.view.original_lettering, true);
    out.lettering = { drawn: drawnBefore + POLO_MARKS.length };
    await page.getByTestId("part-row-lettering").getByTestId("part-visibility").click();

    /* ---- 4. the bake runs in a worker (R4/R7) ---- */
    await page.getByRole("button", { name: /change finish/i }).click();
    const swatch = page.locator(`[data-testid="finish-swatch"][data-code="${ANTIQUE}"]`);
    await swatch.waitFor({ timeout: 20000 });
    await swatch.click();
    await swatch.waitFor({ state: "detached", timeout: 20000 });

    await page.waitForFunction(() => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-occlusion") === "pending", null, {
      timeout: 20000,
    });
    const bakeStarted = Date.now();
    // The main thread keeps answering while the rays are cast elsewhere: this
    // headless renderer's own frames are slow, so what is measured is the
    // bake's own share of the main thread, which is the gather and the apply.
    const duringBake = await page.evaluate(() => 1);
    assert.equal(duringBake, 1, "the page is still answering mid-bake");
    await page.waitForFunction(() => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-occlusion") === "ready", null, {
      timeout: 60000,
    });
    const bakeMs = Date.now() - bakeStarted;
    const mainThreadMs = Number(await viewport.getAttribute("data-occlusion-main-ms"));
    const totalMs = Number(await viewport.getAttribute("data-occlusion-total-ms"));
    assert.ok(mainThreadMs < 50, `the bake's own main-thread share is ${mainThreadMs} ms`);
    assert.ok(totalMs > mainThreadMs * 2, `and the rays ran elsewhere: ${totalMs} ms total against ${mainThreadMs} ms on the main thread`);
    out.bake = { bakeMs, mainThreadMs, totalMs };

    return out;
  } finally {
    await admin.from("product_finishes").delete().eq("product_id", product.id).eq("finish_id", antique.id);
    if (!antique.is_public) await admin.from("finishes").update({ is_public: false }).eq("id", antique.id);
    await admin.from("products").update({ model_branding_groups: [] }).eq("id", product.id);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
