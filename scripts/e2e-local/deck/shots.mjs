// What the deck shows, in order. Every shot drives the real UI: nothing is
// mocked, nothing is cropped, and each one waits for the model, the fonts and
// any pending autosave before the shutter (R3).
import { readFileSync, readdirSync, copyFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../lib/stack.mjs";
import { POLO_OBJ, sharp } from "../lib/calibration.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";
import { analyseBranding, listModelGroups } from "../../../src/features/admin/lib/brandingRecovery.ts";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

const DESKTOP = { width: 1440, height: 900 };
const MOBILE = { width: 390, height: 844 };
const TRIMS_DIR = path.join(REPO_ROOT, "scripts/e2e-local/fixtures/trims");
const LOGO_SVG = path.join(REPO_ROOT, "scripts/e2e-local/fixtures/logo-valid.svg");
const POLO_MARKS = Array.from({ length: 28 }, (_, i) => i + 5);
const POLO_NAME = "Metal Shank Button";
/** Seven plated finishes on the button, in the order the picker shows them. */
const FINISH_CODES = ["CYC-0001", "CYC-0002", "CYC-0013", "CYC-0057", "CYC-0004", "CYC-0071", "CYC-0019"];
/** A frame with no ink in it is a failed shot, not a screenshot. */
const MIN_STDDEV = 3;

export default async function ({ page, base, admin, editor, h, outDir }) {
  const manifest = [];
  const skipped = [];
  const restores = [];

  /* ------------------------------------------------------------------ *
   * helpers
   * ------------------------------------------------------------------ */
  const viewport = () => page.getByTestId("editor-viewport");
  const canvas = () => viewport().locator("canvas").first();

  /** Fonts loaded, model drawn, autosave settled, idle rotation stopped. */
  const settle = async ({ model = true, home = true } = {}) => {
    await page.evaluate(() => document.fonts.ready);
    if (model) {
      await canvas().waitFor({ timeout: 40000 });
      await page.waitForFunction(() => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-model-size-mm") != null, null, {
        timeout: 40000,
      });
      const box = await canvas().boundingBox();
      // One click stops the idle rotation for good; the double-click puts the
      // camera back on the framed default (R3).
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.up();
      if (home) await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
      await page.waitForTimeout(1600);
    }
    const status = page.getByTestId("autosave-status");
    if (await status.count()) {
      await page
        .waitForFunction(() => document.querySelector('[data-testid="autosave-status"]')?.getAttribute("data-status") !== "saving", null, { timeout: 20000 })
        .catch(() => {});
    }
    await page.waitForTimeout(250);
  };

  const shot = async (filename, description, phase) => {
    const file = path.join(outDir, `${filename}.png`);
    await page.screenshot({ path: file });
    const stats = await sharp(file).stats();
    const stddev = Math.max(...stats.channels.map((c) => c.stdev));
    if (stddev < MIN_STDDEV) throw new Error(`${filename}.png is blank (stddev ${stddev.toFixed(2)})`);
    manifest.push({ filename: `${filename}.png`, description, phase, stddev: +stddev.toFixed(2) });
    return stddev;
  };

  const waitForLogos = (count) =>
    page.waitForFunction((want) => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-logo-count") === String(want), count, {
      timeout: 30000,
    });
  const waitForGlyphs = (count) =>
    page.waitForFunction((want) => Number(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-glyph-count")) === want, count, {
      timeout: 30000,
    });

  const facetChecked = (testId) =>
    page.evaluate((id) => {
      const el = document.querySelector(`[data-testid="${id}"] [role="checkbox"], [data-testid="${id}"] input[type="checkbox"]`);
      return !!el && (el.getAttribute("data-state") === "checked" || el.getAttribute("aria-checked") === "true" || el.checked === true);
    }, testId);

  /** Ticks one facet in the open finish picker (the label carries `facet-<axis>-<code>`) and waits for it to take. */
  const tickFacet = async (testId) => {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (await facetChecked(testId)) return true;
      const facet = page.getByTestId(testId);
      if (!(await facet.count())) return false;
      await facet.scrollIntoViewIfNeeded();
      await facet.click();
      await page.waitForTimeout(500);
    }
    return facetChecked(testId);
  };

  /* ------------------------------------------------------------------ *
   * R1 — staging
   * ------------------------------------------------------------------ */
  const { data: products } = await admin
    .from("products")
    .select("id, slug, name, item_code, model_storage_path, status, is_public, brand_id, default_finish_id, material_id, model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id")
    .like("slug", "sample-%")
    .order("slug")
    .limit(12);
  const { data: metalMaterial } = await admin.from("product_materials").select("id").eq("is_metal", true).limit(1).single();
  const { data: finishes } = await admin.from("finishes").select("id, cyc_code, is_public").in("cyc_code", FINISH_CODES);
  const finishByCode = new Map(finishes.map((f) => [f.cyc_code, f]));

  const polo = readFileSync(POLO_OBJ, "utf8");
  const poloFactor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const poloRoot = new OBJLoader().parse(polo);
  const poloGroups = listModelGroups(poloRoot);
  const poloReference = analyseBranding(poloRoot, POLO_MARKS)?.reference ?? null;

  /** Puts one OBJ on a sample product as its own metal product. */
  const stage = async ({ product, name, objText, filename, marks = [], reference = null, finishIds = [], factor, variantMm, rawBounds }) => {
    const before = { ...product };
    const modelPath = `models/${product.id}/deck-${filename}`;
    const up = await admin.storage.from("product-models").upload(modelPath, new Blob([objText], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
    if (up.error) throw new Error(up.error.message);
    // One default variant per product: stand the sample's own default down
    // while the deck's is in place, and put it back afterwards.
    const { data: existingVariants } = await admin.from("product_size_variants").select("id, is_default").eq("product_id", product.id);
    const previousDefault = (existingVariants ?? []).find((v) => v.is_default)?.id ?? null;
    if (previousDefault) await admin.from("product_size_variants").update({ is_default: false }).eq("id", previousDefault);
    const variant = await admin
      .from("product_size_variants")
      .insert({ product_id: product.id, size_primary_mm: variantMm, is_default: true, sort_order: 900 })
      .select("id")
      .single();
    if (variant.error) throw new Error(variant.error.message);
    // The product has to be metal and saved before finishes will attach (the
    // metal gate is a database trigger), and the scale and branding have to
    // land after the path change, which resets them.
    const set = await admin
      .from("products")
      .update({
        name,
        model_storage_path: modelPath,
        status: "active",
        is_public: true,
        brand_id: null,
        material_id: metalMaterial.id,
        item_code: product.item_code ?? `DECK-${filename.slice(0, 6).toUpperCase()}`,
      })
      .eq("id", product.id);
    if (set.error) throw new Error(set.error.message);

    const publicFinishes = [];
    for (const [i, finishId] of finishIds.entries()) {
      const row = finishes.find((f) => f.id === finishId);
      if (row && !row.is_public) publicFinishes.push(finishId);
      const attach = await admin.from("product_finishes").insert({ product_id: product.id, finish_id: finishId, sort_order: 900 + i });
      if (attach.error) throw new Error(attach.error.message);
    }
    if (publicFinishes.length) await admin.from("finishes").update({ is_public: true }).in("id", publicFinishes);

    const confirm = await admin
      .from("products")
      .update({
        default_finish_id: finishIds[0] ?? product.default_finish_id,
        // What the CMS upload would have parsed client-side: the scale panel
        // only appears once a product has its raw dimensions.
        model_raw_bounds: rawBounds,
        model_scale_status: "confirmed",
        model_scale_factor: factor,
        model_scale_method: "known_dimension",
        model_scale_reference_variant_id: variant.data.id,
        model_branding_groups: marks,
        model_branding_reference: reference,
      })
      .eq("id", product.id);
    if (confirm.error) throw new Error(confirm.error.message);

    restores.push(async () => {
      await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
      await admin.from("product_finishes").delete().eq("product_id", product.id).in("finish_id", finishIds.length ? finishIds : ["00000000-0000-0000-0000-000000000000"]);
      if (publicFinishes.length) await admin.from("finishes").update({ is_public: false }).in("id", publicFinishes);
      await admin.from("product_size_variants").delete().eq("id", variant.data.id);
      if (previousDefault) await admin.from("product_size_variants").update({ is_default: true }).eq("id", previousDefault);
      await admin
        .from("products")
        .update({
          name: before.name,
          model_storage_path: before.model_storage_path,
          status: before.status,
          is_public: before.is_public,
          brand_id: before.brand_id,
          material_id: before.material_id,
          default_finish_id: before.default_finish_id,
          model_scale_status: before.model_scale_status ?? "unconfirmed",
          model_scale_factor: before.model_scale_factor ?? null,
          model_scale_method: before.model_scale_method ?? null,
          model_scale_reference_variant_id: before.model_scale_reference_variant_id ?? null,
          model_raw_bounds: null,
          model_branding_groups: [],
          model_branding_reference: null,
        })
        .eq("id", product.id);
      await admin.storage.from("product-models").remove([modelPath]);
    });
    return { product, slug: product.slug };
  };

  const trimFiles = existsSync(TRIMS_DIR) ? readdirSync(TRIMS_DIR).filter((f) => f.toLowerCase().endsWith(".obj")) : [];

  try {
    await admin.from("designs").delete().eq("owner_id", editor.userId);
    await admin.from("design_assets").delete().eq("owner_id", editor.userId);

    // Phase 5's strip reads WIN-CYC's own tolerances, which the local stack
    // ships null. The deck stands them up for the shot and puts them back.
    const { data: processesBefore } = await admin.from("finish_processes").select("id, min_feature_mm, min_deboss_depth_mm, max_deboss_depth_mm");
    restores.push(async () => {
      for (const row of processesBefore ?? []) {
        await admin
          .from("finish_processes")
          .update({ min_feature_mm: row.min_feature_mm, min_deboss_depth_mm: row.min_deboss_depth_mm, max_deboss_depth_mm: row.max_deboss_depth_mm })
          .eq("id", row.id);
      }
    });

    const button = await stage({
      product: products[0],
      name: POLO_NAME,
      objText: polo,
      filename: "polo.obj",
      marks: POLO_MARKS.map((index) => ({ index, name: poloGroups[index].name })),
      reference: poloReference,
      finishIds: FINISH_CODES.map((code) => finishByCode.get(code)?.id).filter(Boolean),
      factor: poloFactor,
      variantMm: 10.8,
      rawBounds: parseObjRawBounds(polo),
    });

    const trims = [];
    for (const [i, file] of trimFiles.entries()) {
      const objText = readFileSync(path.join(TRIMS_DIR, file), "utf8");
      const name = file.replace(/\.obj$/i, "").replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      const raw = parseObjRawBounds(objText);
      trims.push({
        ...(await stage({
          product: products[i + 1],
          name,
          objText,
          filename: file,
          // 1 mm per raw unit, confirmed (R1).
          factor: 1,
          variantMm: Number(raw.primary_raw.toFixed(2)),
          rawBounds: raw,
        })),
        name,
      });
    }

    const editorUrl = (slug) => `${base}/designer-studio/editor/new?product=${slug}&calibration=0`;

    /* ---------------------------------------------------------------- *
     * anonymous
     * ---------------------------------------------------------------- */
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();
    await page.evaluate(() => window.sessionStorage.clear());
    await page.goto(editorUrl(button.slug), { waitUntil: "networkidle" });
    await settle();
    await shot("14-anonymous-banner", "Anonymous buyer: the editor works before sign-in, with the banner offering to save the design.", 2);

    /* ---------------------------------------------------------------- *
     * catalogue entry
     * ---------------------------------------------------------------- */
    await h.login(editor);
    await page.goto(`${base}/designer-studio`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1500);
    await shot("01-catalogue-entry", "Designer Studio: the way into the editor from the catalogue.", 2);

    /* ---------------------------------------------------------------- *
     * the signed-in design
     * ---------------------------------------------------------------- */
    await page.goto(editorUrl(button.slug), { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 30000 });
    await settle();
    await shot("02-editor-first-open", `${POLO_NAME}: the editor as it opens — product, finish, branding and output.`, 2);

    await page.getByRole("button", { name: /change finish/i }).click();
    await page.getByTestId("finish-swatch").first().waitFor({ timeout: 20000 });
    // The axis rail arrives with its own query, after the swatches.
    await page.getByTestId("finish-rail").waitFor({ timeout: 20000 });
    await page.waitForTimeout(600);
    const ticked = [await tickFacet("facet-surface-BRUSHED"), await tickFacet("facet-base_family-NICKEL")];
    const facetCount = await page.locator('[data-testid^="facet-"]').count();
    await page.waitForTimeout(600);
    await shot("03-finish-sheet", "The finish picker: the WIN-CYC chart filtered by axis — Brushed and Nickel ticked.", 3);
    if (ticked.some((t) => !t))
      skipped.push(`03-finish-sheet: Brushed / Nickel could not be ticked (${facetCount} facets on screen, ticked ${JSON.stringify(ticked)}); the sheet is shown unfiltered`);
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);

    const pickFinishByCode = async (code) => {
      await page.getByRole("button", { name: /change finish/i }).click();
      const swatch = page.locator(`[data-testid="finish-swatch"][data-code="${code}"]`);
      await swatch.waitFor({ timeout: 15000 });
      await swatch.click();
      await swatch.waitFor({ state: "detached", timeout: 15000 });
      await page.waitForTimeout(1800);
    };
    await pickFinishByCode("CYC-0013");
    await shot("04-finish-gold", "Gold plating rendered from the finish's measured reflectance, not a guessed colour.", 3);
    await pickFinishByCode("CYC-0057");
    await page.waitForTimeout(1500); // the antique two-tone bakes occlusion on first use
    await shot("05-finish-anti-brass", "Anti brass: an antique two-tone, oxide in the recesses from a baked occlusion pass.", 3);

    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-diameter-label").waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    await shot("06-ruler-on", "The ruler: diameter and thickness measured off the model itself, in millimetres.", 4);
    await page.getByTestId("ruler-toggle").click();

    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("BRAND");
    await page.getByTestId("text-layer-content").blur();
    await waitForGlyphs(5);
    await settle({ home: false });
    await shot("07-add-text", "Add text: the layer lands where the factory's own branding was, with its handles on the model.", 4);

    await page.getByTestId("position-and-curve-toggle").click();
    await page.waitForTimeout(400);
    await shot("08-position-curve", "Position and curve: every spatial value as a number and a slider, the number authoritative.", 4);

    await page.locator('[data-testid="pc-arc"] [data-value="bottom"]').click();
    await waitForGlyphs(5);
    await settle({ home: false });
    await shot("09-text-bottom-arc", "The bottom arc: text reads left to right along the inside of the circle, never mirrored.", 4);

    await page.locator('[data-testid="text-layer-layout"] [data-value="straight"]').click();
    await waitForGlyphs(5);
    await settle({ home: false });
    await shot("10-straight-text", "Straight layout: the same layer, laid flat across the face.", 4);

    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-letter-height-label").waitFor({ timeout: 15000 });
    await page.waitForTimeout(600);
    await shot("11-ruler-layer", "The ruler follows the selected layer: letter height and the margin left to the edge.", 4);
    await page.getByTestId("ruler-toggle").click();

    await page.getByTestId("logo-input").setInputFiles(LOGO_SVG);
    await waitForLogos(1);
    await settle({ home: false });
    await shot("12-logo-layer", "Add logo: an uploaded SVG becomes engravable outlines, holes and all.", 4);

    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("EST 1979");
    await page.getByTestId("text-layer-content").blur();
    await waitForGlyphs(12);
    await settle({ home: false });
    await shot("13-layers-list", "Three layers: reorder, delete, undo and redo — every change is one entry.", 4);

    /* ---------------------------------------------------------------- *
     * Phase 5 — relief and the manufacturing strip
     * ---------------------------------------------------------------- */
    // Back on the first text layer, which sits on the face where the
    // factory's own lettering was.
    // The logo is a sheet over the middle of the face; it has had its own
    // shot (12) and would hide the letters these three are about.
    await page.locator('[data-testid="text-layer-row"]').nth(1).getByTestId("text-layer-delete").click();
    await waitForLogos(0);
    const brandLayer = page.locator('[data-testid="text-layer-row"]').first();
    await brandLayer.getByTestId("text-layer-select").click();
    const reliefRow = () => page.locator('[data-testid="layer-relief"]').first();
    const setDepth = async (mm) => {
      const input = reliefRow().getByTestId("relief-depth-input");
      await input.fill(String(mm));
      await input.blur();
      await page.waitForTimeout(900);
    };
    await reliefRow().locator('[data-value="emboss"]').click();
    await setDepth(0.3);
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-relief-label").waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="ruler-relief-label"]')?.style.visibility === "visible", null, { timeout: 20000 });
    await settle({ home: false });
    await shot("23-relief-raised", "Raised relief: the letters stand 0.30 mm proud, with the ruler calling the height out along the surface normal.", 5);

    await reliefRow().locator('[data-value="deboss"]').click();
    await setDepth(0.25);
    await page.waitForFunction(() => {
      const reliefs = JSON.parse(document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-reliefs") ?? "[]");
      return reliefs.some((r) => r.type === "deboss" && r.floorMm != null);
    }, null, { timeout: 30000 });
    await settle({ home: false });
    await shot("24-relief-engraved", "Engraved: the same layer cut 0.25 mm into the face, floor and walls carved through a stencil — no boolean until the bake.", 5);
    await page.getByTestId("ruler-toggle").click();

    // The thresholds go in here, not earlier: the strip is silent while
    // nothing is wrong, which is what the shots before this one show. The
    // finish rows (and their process) are fetched once per page, so the
    // editor is reloaded to read them.
    await admin.from("finish_processes").update({ min_feature_mm: 0.2, min_deboss_depth_mm: 0.15, max_deboss_depth_mm: 0.5 }).not("id", "is", null);
    await page.reload({ waitUntil: "networkidle" });
    await settle();
    await page.getByTestId("text-layer-select").first().click();
    // 0.6 mm text against a 0.20 mm minimum feature: the strip says so, live.
    // The disclosure belongs to the selected layer, so it needs opening again.
    const openPositionAndCurve = async () => {
      if (await page.getByTestId("pc-text-size-input").count()) return;
      await page.getByTestId("position-and-curve-toggle").click();
      await page.getByTestId("pc-text-size-input").waitFor({ timeout: 20000 });
    };
    await openPositionAndCurve();
    await page.getByTestId("pc-text-size-input").fill("0.6");
    await page.getByTestId("pc-text-size-input").blur();
    await page.waitForFunction(() => document.querySelector('[data-testid="manufacturing-strip"]')?.getAttribute("data-warning-count") !== "0", null, { timeout: 30000 });
    await settle({ home: false });
    await shot("25-manufacturing-strip", "The manufacturing strip: 0.6 mm text is thinner than roll plating's 0.20 mm minimum, said in the buyer's own units.", 5);
    await page.getByTestId("pc-text-size-input").fill("1.3");
    await page.getByTestId("pc-text-size-input").blur();
    await page.waitForTimeout(900);

    /* ---------------------------------------------------------------- *
     * per-trim shots (R1/R2: one per OBJ in fixtures/trims)
     * ---------------------------------------------------------------- */
    let index = 21;
    for (const trim of trims) {
      await page.goto(editorUrl(trim.slug), { waitUntil: "networkidle" });
      await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 30000 });
      await settle();
      await page.getByTestId("add-text").click();
      await page.getByTestId("text-layer-content").fill("BRAND");
      await page.getByTestId("text-layer-content").blur();
      await waitForGlyphs(5);
      await page.getByTestId("ruler-toggle").click();
      await page.getByTestId("ruler-diameter-label").waitFor({ timeout: 15000 });
      await settle({ home: false });
      const slugName = trim.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      await shot(`${String(index).padStart(2, "0")}-trim-${slugName}`, `${trim.name}: the same branding tools on another trim.`, 4);
      index += 1;
    }

    /* ---------------------------------------------------------------- *
     * the CMS
     * ---------------------------------------------------------------- */
    await h.openProduct(button.product.id);
    await page.getByTestId("model-scale-panel").waitFor({ timeout: 30000 });
    await page.getByTestId("model-section").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await shot("16-cms-upload", "The CMS: one .obj per product, its raw dimensions read on upload and its scale confirmed.", 4);

    await page.getByTestId("model-scale-preview-toggle").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="model-preview-canvas"]')?.dataset.state === "ready", null, { timeout: 45000 });
    await page.getByTestId("model-preview-canvas").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await shot("17-cms-preview-ring", "The recovered text path drawn on the model: radius, arc and where buyers' text will start.", 4);

    await page.getByTestId("model-branding-buyer-preview").scrollIntoViewIfNeeded();
    await page.getByTestId("model-branding-buyer-preview").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="model-preview-canvas"]')?.dataset.hidden === "28", null, { timeout: 20000 });
    await page.getByTestId("model-preview-canvas").scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    await shot("18-cms-preview-buyer", "Preview as buyer: the factory lettering hidden, which is what the buyer starts from.", 4);
    await page.getByTestId("model-branding-buyer-preview").click();
    await page.waitForTimeout(600);

    // Two-point calibration is what an *unconfirmed* model offers, so the
    // button is put back to that state for this shot and confirmed again after.
    await admin.from("products").update({ model_scale_status: "unconfirmed", model_scale_factor: null, model_scale_method: null }).eq("id", button.product.id);
    await h.openProduct(button.product.id);
    await page.getByTestId("model-scale-panel").waitFor({ timeout: 30000 });
    await page.getByTestId("model-scale-two-point-toggle").click();
    const previewCanvas = page.getByTestId("model-preview-canvas").locator("canvas");
    await previewCanvas.waitFor({ timeout: 20000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="model-preview-canvas"]')?.dataset.state === "ready", null, { timeout: 45000 });
    const previewBox = await previewCanvas.boundingBox();
    await previewCanvas.click({ position: { x: previewBox.width * 0.22, y: previewBox.height * 0.5 } });
    await page.getByTestId("two-point-a-status").filter({ hasText: /Selected/ }).waitFor({ timeout: 10000 });
    await previewCanvas.click({ position: { x: previewBox.width * 0.78, y: previewBox.height * 0.5 } });
    await page.getByTestId("two-point-b-status").filter({ hasText: /Selected/ }).waitFor({ timeout: 10000 });
    await page.getByTestId("model-scale-panel").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await shot("19-cms-two-point", "Two-point calibration: click two points whose real distance is known and the scale follows.", 4);
    await admin
      .from("products")
      .update({ model_scale_status: "confirmed", model_scale_factor: poloFactor, model_scale_method: "known_dimension" })
      .eq("id", button.product.id);
    await h.openProduct(button.product.id);
    await page.getByTestId("model-scale-panel").waitFor({ timeout: 30000 });
    await page.getByTestId("model-branding-toggle").click();
    await page.getByTestId("model-branding-groups").waitFor({ timeout: 30000 });
    await page.getByTestId("model-branding-sentence").scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await shot("20-cms-groups", "Marking the factory lettering: 28 groups, analysed into one sentence a person can check.", 4);

    /* ---------------------------------------------------------------- *
     * mobile
     * ---------------------------------------------------------------- */
    await page.setViewportSize(MOBILE);
    await page.goto(editorUrl(button.slug), { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 30000 });
    await settle();
    await page.getByTestId("text-layer-select").first().click().catch(() => {});
    await page.getByTestId("position-and-curve-toggle").click().catch(() => {});
    await page.waitForTimeout(600);
    await shot("15-mobile", "390 px: the viewport keeps its height and the panel stacks under it, controls and all.", 4);

    await page.getByRole("button", { name: /change finish/i }).click();
    await page.getByTestId("finish-swatch").first().waitFor({ timeout: 20000 });
    await page.waitForTimeout(800);
    await shot("15b-mobile-finish-sheet", "390 px: the finish picker as a full-height sheet, the chart's axes and swatches under a thumb.", 4);
    await page.keyboard.press("Escape");
    // The sheet's overlay swallows clicks until it is really gone.
    await page.locator('[role="dialog"]').waitFor({ state: "detached", timeout: 15000 }).catch(async () => {
      await page.locator('[role="dialog"] button[aria-label], [role="dialog"] button:has(svg)').first().click().catch(() => {});
    });
    await page.waitForTimeout(600);

    // This is a fresh design (the mobile block re-enters at /editor/new), so
    // the layer the shot is about is added here.
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("BRAND");
    await page.getByTestId("text-layer-content").blur();
    await waitForGlyphs(5);
    await page.locator('[data-testid="layer-relief"]').first().scrollIntoViewIfNeeded();
    await page.waitForTimeout(800);
    await shot("15c-mobile-text-layer", "390 px: a text layer with its relief — raised or engraved and the depth — on the row itself.", 5);
    await page.setViewportSize(DESKTOP);

    /* ---------------------------------------------------------------- *
     * R4 — the contact sheet and the manifest
     * ---------------------------------------------------------------- */
    const sheets = readdirSync(path.join(REPO_ROOT, "reports"))
      .filter((f) => /-materials\.png$/.test(f))
      .sort();
    const newest = sheets[sheets.length - 1];
    if (newest) {
      copyFileSync(path.join(REPO_ROOT, "reports", newest), path.join(outDir, "00-finishes-contact-sheet.png"));
      const stats = await sharp(path.join(outDir, "00-finishes-contact-sheet.png")).stats();
      manifest.unshift({
        filename: "00-finishes-contact-sheet.png",
        description: `Twelve finishes on the same part, each beside its chart swatch (from reports/${newest}).`,
        phase: 4,
        stddev: +Math.max(...stats.channels.map((c) => c.stdev)).toFixed(2),
      });
    } else {
      skipped.push("00-finishes-contact-sheet.png: no reports/*-materials.png to copy");
    }

    if (!trimFiles.length) skipped.push("21..-trim-<name>.png: scripts/e2e-local/fixtures/trims/ has no .obj files");

    manifest.sort((a, b) => a.filename.localeCompare(b.filename));
    writeFileSync(path.join(outDir, "manifest.json"), `${JSON.stringify({ shots: manifest, skipped }, null, 2)}\n`);
    return { shots: manifest.length, skipped };
  } finally {
    for (const restore of restores.reverse()) await restore().catch(() => {});
    await admin.from("designs").delete().eq("owner_id", editor.userId);
  }
}
