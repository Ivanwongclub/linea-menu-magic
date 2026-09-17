// Phase 4k — logo layers from SVG (rulings R1–R4, R7).
//
// On the Polo at 10.8 mm:
//   1. Anonymous: Add logo takes the valid fixture; it renders from the
//      sessionStorage draft with no `design_assets` row anywhere. Signing in
//      claims the design: the file is uploaded, a row appears, and the
//      layer's `asset_id` points at it (read-backs), with the object's bytes
//      matching the fixture.
//   2. The rendered mesh measures the artwork's own aspect (100 × 60) within
//      1%, its hole is cut (70% of the solid area is left), and the layer row
//      shows a thumbnail.
//   3. The invalid fixture (it has <text>) is refused in one sentence naming
//      the element; no row, no layer.
//   4. A second logo uploaded while signed in writes its row and object
//      immediately.
//   5. Width edited in "Position and curve" → autosave → read-back, and the
//      mesh follows.
//   6. The ruler shows the selected logo's width, height and edge margin,
//      with no label overlapping another.
//   7. Deleting the layer removes its `design_assets` row.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { POLO_OBJ } from "../lib/calibration.mjs";
import { REPO_ROOT } from "../lib/stack.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";

const FIXTURES = path.join(REPO_ROOT, "scripts/e2e-local/fixtures");
const VALID = path.join(FIXTURES, "logo-valid.svg");
const INVALID = path.join(FIXTURES, "logo-invalid.svg");
const ARTWORK_ASPECT = 100 / 60;

export default async function ({ page, base, admin, editor, h }) {
  const { data: products } = await admin
    .from("products")
    .select(
      "id, slug, name, item_code, model_storage_path, status, is_public, brand_id, " +
        "model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id",
    )
    .like("slug", "sample-%")
    .order("slug")
    .limit(8);
  const product = products[7]; // distinct from editor-shell [0] … drag-handles [6]
  assert.ok(product, "an eighth sample product exists");

  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const modelPath = `models/${product.id}/e2e-logo-layer.obj`;
  const up = await admin.storage.from("product-models").upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (up.error) throw new Error(up.error.message);
  const variant = await admin
    .from("product_size_variants")
    .insert({ product_id: product.id, size_label: "10.8mm", size_primary_mm: 10.8, is_default: true, sort_order: 900 })
    .select("id")
    .single();
  if (variant.error) throw new Error(variant.error.message);
  const setModel = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-LOGO-001" })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);
  const confirm = await admin
    .from("products")
    .update({ model_scale_status: "confirmed", model_scale_factor: factor, model_scale_method: "unit_mm", model_scale_reference_variant_id: variant.data.id })
    .eq("id", product.id);
  if (confirm.error) throw new Error(confirm.error.message);

  const listAssets = async () => {
    const { data, error } = await admin
      .from("design_assets")
      .select("id, owner_id, brand_id, kind, storage_path, original_filename, mime_type, size_bytes")
      .eq("owner_id", editor.userId)
      .order("created_at");
    if (error) throw new Error(error.message);
    return data;
  };
  const restore = async () => {
    for (const asset of await listAssets()) await admin.storage.from("design-uploads").remove([asset.storage_path]);
    await admin.from("design_assets").delete().eq("owner_id", editor.userId);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
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
    await admin.from("product_size_variants").delete().eq("id", variant.data.id);
  };

  const viewport = () => page.getByTestId("editor-viewport");
  const url = `${base}/designer-studio/editor/new?product=${product.slug}`;
  const readRecipe = async (designId) => {
    const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (error) throw new Error(error.message);
    return data.draft_recipe;
  };
  const waitForRecipe = async (designId, predicate, label, timeout = 15000) => {
    const deadline = Date.now() + timeout;
    let recipe;
    while (Date.now() < deadline) {
      recipe = await readRecipe(designId);
      if (recipe && predicate(recipe)) return recipe;
      await page.waitForTimeout(300);
    }
    throw new Error(`${label}: read-back never matched, last ${JSON.stringify(recipe?.layers)}`);
  };
  const waitForAssets = async (count, label, timeout = 20000) => {
    const deadline = Date.now() + timeout;
    let assets = [];
    while (Date.now() < deadline) {
      assets = await listAssets();
      if (assets.length === count) return assets;
      await page.waitForTimeout(300);
    }
    throw new Error(`${label}: expected ${count} design_assets rows, got ${assets.length}`);
  };
  const logoReports = async (count) => {
    await page.waitForFunction((want) => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-logo-count") === String(want), count, {
      timeout: 20000,
    });
    return JSON.parse(await viewport().getAttribute("data-logos"));
  };
  const addLogo = async (file) => {
    await page.getByTestId("logo-input").setInputFiles(file);
  };

  const out = {};
  const validSvg = readFileSync(VALID, "utf8");
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await admin.from("design_assets").delete().eq("owner_id", editor.userId);

    /* ---- 1. anonymous: the file rides in the draft ---- */
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.evaluate(() => window.sessionStorage.clear());
    await page.goto(url, { waitUntil: "networkidle" });
    await viewport().locator("canvas").first().waitFor({ timeout: 30000 });
    await addLogo(VALID);
    const anonLogos = await logoReports(1);
    assert.equal(anonLogos.length, 1, "the anonymous logo renders from the draft");
    assert.equal((await listAssets()).length, 0, "nothing is stored for an anonymous buyer");
    assert.equal(await page.getByTestId("logo-thumbnail").getAttribute("data-loaded"), "true", "the layer row shows the artwork");
    const draftLogos = await page.evaluate(() => {
      const key = Object.keys(window.sessionStorage).find((k) => k.startsWith("designer-studio:anon-draft:"));
      return JSON.parse(window.sessionStorage.getItem(key)).logos;
    });
    assert.equal(Object.values(draftLogos).length, 1, "the draft is holding the file");
    assert.equal(Object.values(draftLogos)[0].filename, "logo-valid.svg");

    /* ---- 2. the mesh measures the artwork's aspect ---- */
    const measured = anonLogos[0].measuredWidthMm / anonLogos[0].measuredHeightMm;
    assert.ok(Math.abs(measured / ARTWORK_ASPECT - 1) <= 0.01, `rendered aspect ${measured.toFixed(4)} vs ${ARTWORK_ASPECT.toFixed(4)}`);
    assert.ok(Math.abs(anonLogos[0].measuredWidthMm - 0.4 * 10.8) <= 0.01, `default width ${anonLogos[0].measuredWidthMm} is 40% of the face`);
    assert.equal(anonLogos[0].conformed, true, "the logo sits on the surface, like text");
    assert.equal(anonLogos[0].facing, 1, "the logo's front faces out of the part, not into it");
    // The fixture's hole is 60 × 30 of its 100 × 60 plate: 30% of the area is cut away.
    const solidArea = anonLogos[0].measuredWidthMm * anonLogos[0].measuredHeightMm;
    assert.ok(
      Math.abs(anonLogos[0].areaMm2 / solidArea - 0.7) <= 0.02,
      `the hole is cut: ${anonLogos[0].areaMm2.toFixed(3)} mm² of a solid ${solidArea.toFixed(3)} mm²`,
    );
    out.anon = {
      aspect: +measured.toFixed(4),
      widthMm: +anonLogos[0].measuredWidthMm.toFixed(3),
      facing: anonLogos[0].facing,
      filledFraction: +(anonLogos[0].areaMm2 / (anonLogos[0].measuredWidthMm * anonLogos[0].measuredHeightMm)).toFixed(3),
    };

    /* ---- sign in: the claim uploads it ---- */
    await h.login(editor);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    const [claimed] = await waitForAssets(1, "claim uploads the pending logo");
    assert.equal(claimed.kind, "logo_svg");
    assert.equal(claimed.owner_id, editor.userId);
    assert.equal(claimed.original_filename, "logo-valid.svg");
    assert.equal(claimed.mime_type, "image/svg+xml");
    assert.equal(claimed.storage_path, `${editor.userId}/logos/${claimed.id}.svg`, "Phase 1 path rule: owner uid first");
    const stored = await admin.storage.from("design-uploads").download(claimed.storage_path);
    assert.ok(!stored.error, `the object is readable: ${stored.error?.message}`);
    assert.equal(await stored.data.text(), validSvg, "the stored object is the file the buyer chose");
    const claimedRecipe = await waitForRecipe(designId, (r) => r.layers?.[0]?.content?.asset_id === claimed.id, "claimed layer");
    assert.equal(claimedRecipe.recipe_version, 2, "a logo layer does not change the recipe version");
    assert.equal(claimedRecipe.layers[0].kind, "logo");
    assert.equal(claimedRecipe.layers[0].content.type, "logo");
    assert.ok(Math.abs(claimedRecipe.layers[0].content.aspect - ARTWORK_ASPECT) <= 0.01, "the stored aspect is the artwork's");
    await viewport().locator("canvas").first().waitFor({ timeout: 30000 });
    await logoReports(1);
    out.claimed = { assetId: claimed.id, path: claimed.storage_path, sizeBytes: claimed.size_bytes };

    /* ---- 3. the invalid fixture is refused ---- */
    await addLogo(INVALID);
    const error = page.getByTestId("logo-error");
    await error.waitFor({ timeout: 10000 });
    const sentence = await error.innerText();
    assert.match(sentence, /<text>/, `the rejection names the element: ${sentence}`);
    assert.equal(sentence.split(/[.!?]/).filter((part) => part.trim()).length, 1, "one plain sentence");
    await page.waitForTimeout(1000);
    assert.equal((await listAssets()).length, 1, "a refused file stores nothing");
    assert.equal((await readRecipe(designId)).layers.length, 1, "a refused file adds no layer");
    out.rejection = sentence;

    /* ---- 4. a second logo, uploaded straight away ---- */
    await addLogo(VALID);
    const assets = await waitForAssets(2, "signed-in upload");
    const second = assets.find((a) => a.id !== claimed.id);
    const secondStored = await admin.storage.from("design-uploads").download(second.storage_path);
    assert.ok(!secondStored.error, "the second object is stored");
    const twoLayers = await waitForRecipe(designId, (r) => r.layers.length === 2 && r.layers[1].content.asset_id === second.id, "second logo layer");
    assert.equal(twoLayers.layers[1].kind, "logo");
    await logoReports(2);

    /* ---- 5. width edit → autosave → read-back, and the mesh follows ---- */
    await page.getByTestId("position-and-curve-toggle").click();
    await page.getByTestId("pc-logo-width-input").fill("6.5");
    await page.getByTestId("pc-logo-width-input").blur();
    const resized = await waitForRecipe(designId, (r) => r.layers[1].content.width_mm === 6.5, "width read-back");
    assert.ok(Math.abs(resized.layers[1].content.aspect - ARTWORK_ASPECT) <= 0.01, "resizing keeps the aspect");
    await page.waitForFunction(
      () => {
        const logos = JSON.parse(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-logos") ?? "[]");
        return logos.length === 2 && Math.abs(logos[1].measuredWidthMm - 6.5) <= 0.01;
      },
      null,
      { timeout: 15000 },
    );
    out.resized = { widthMm: resized.layers[1].content.width_mm };

    /* ---- 5b. the ruler measures the selected logo (R4) ---- */
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-logo-width-label").waitFor({ timeout: 10000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="ruler-edge-margin-label"]')?.style.visibility === "visible", null, { timeout: 10000 });
    const value = async (testId) => Number(await page.getByTestId(testId).getAttribute("data-value-mm"));
    const faceRadius = Number(await viewport().getAttribute("data-model-size-mm")) / 2;
    const rulerWidth = await value("ruler-logo-width-label");
    const rulerHeight = await value("ruler-logo-height-label");
    const rulerMargin = await value("ruler-edge-margin-label");
    assert.equal(rulerWidth, 6.5, "the ruler shows the logo's width");
    assert.ok(Math.abs(rulerHeight - 6.5 / ARTWORK_ASPECT) <= 1e-6, `logo height ${rulerHeight}`);
    assert.ok(
      Math.abs(rulerMargin - (faceRadius - Math.hypot(6.5 / 2, rulerHeight / 2))) <= 1e-6,
      `edge margin ${rulerMargin} is the face radius less the farthest corner`,
    );
    assert.equal(await page.getByTestId("ruler-branding-radius-label").count(), 0, "a logo has no branding radius");
    const clashes = await page.evaluate(() => {
      const rects = [...document.querySelectorAll('[data-testid="ruler-labels"] > span')]
        .filter((el) => el.style.visibility === "visible")
        .map((el) => el.getBoundingClientRect());
      const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
      return rects.flatMap((a, i) => rects.filter((b, j) => j > i && hit(a, b)).map(() => i));
    });
    assert.deepEqual(clashes, [], "the logo's labels don't overlap the product's");
    out.ruler = { rulerWidth, rulerHeight, rulerMargin, faceRadius };
    await page.getByTestId("ruler-toggle").click();

    /* ---- 6. delete takes the asset with it ---- */
    await page.locator('[data-testid="text-layer-row"]').nth(1).getByTestId("text-layer-delete").click();
    const left = await waitForAssets(1, "delete removes the asset row");
    assert.equal(left[0].id, claimed.id, "the other logo's asset is untouched");
    await waitForRecipe(designId, (r) => r.layers.length === 1, "layer removed");
    const goneObject = await admin.storage.from("design-uploads").download(second.storage_path);
    assert.ok(goneObject.error, "the stored object went with the row");
    await logoReports(1);

    return out;
  } finally {
    await restore();
  }
}
