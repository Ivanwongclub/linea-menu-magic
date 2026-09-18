// Shared staging and measurement for the Phase 6a appearance scenarios: one
// metal product with the Polo on it, a plated finish, a paint finish, and a
// way to read the colour a layer actually rendered in.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { POLO_OBJ, pixels } from "./calibration.mjs";
import { linearToLab, rgb255ToLinear } from "./colour.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";

/** Nickel for the button, gold for a plated layer, blue ceramic for a painted one. */
export const BUTTON_FINISH = "CYC-0001";
export const LAYER_PLATED = "CYC-0013";
export const LAYER_PAINT = "CYC-0131";

/**
 * Publishes `slug` with the Polo at 15 mm and the three finishes public, and
 * returns what the scenario needs plus the restore. Every finish the layer
 * picker offers has to be public (R2), so the ones this staging uses are made
 * public and put back afterwards.
 */
export async function stageAppearance(admin, slug, filename) {
  const { data: product, error } = await admin
    .from("products")
    .select("id, slug, name, item_code, status, is_public, brand_id, material_id, default_finish_id, model_storage_path, model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id")
    .eq("slug", slug)
    .single();
  if (error) throw new Error(error.message);

  const { data: metalMaterial } = await admin.from("product_materials").select("id").eq("is_metal", true).limit(1).single();
  const { data: finishRows, error: finishError } = await admin
    .from("finishes")
    .select("id, cyc_code, is_public, base_color_hex, metalness, roughness, clearcoat, two_tone")
    .in("cyc_code", [BUTTON_FINISH, LAYER_PLATED, LAYER_PAINT]);
  if (finishError) throw new Error(finishError.message);
  const finishes = Object.fromEntries(finishRows.map((f) => [f.cyc_code, f]));
  assert.ok(finishes[BUTTON_FINISH] && finishes[LAYER_PLATED] && finishes[LAYER_PAINT], "the three staged finishes exist");

  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 15 / parseObjRawBounds(polo).primary_raw;
  const modelPath = `models/${product.id}/${filename}`;
  const before = { ...product };
  const wasPublic = finishRows.filter((f) => !f.is_public).map((f) => f.id);

  // Staging is not transactional, so every step registers its own undo: a
  // failure half way through still leaves the stack as it was found.
  const undo = [];
  const restore = async () => {
    // Supabase builders are thenables, not promises: `await` works, `.catch` does not.
    for (const step of undo.reverse()) {
      try {
        await step();
      } catch {
        /* leave the rest of the restore to run */
      }
    }
    undo.length = 0;
  };

  try {
  const up = await admin.storage.from("product-models").upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (up.error) throw new Error(up.error.message);
  undo.push(() => admin.storage.from("product-models").remove([modelPath]));
  // One default variant per product: the sample's own steps aside while this
  // one is in place, and comes back with the restore (the deck does the same).
  const { data: existingVariants } = await admin.from("product_size_variants").select("id, is_default").eq("product_id", product.id);
  const previousDefault = (existingVariants ?? []).find((v) => v.is_default)?.id ?? null;
  if (previousDefault) {
    await admin.from("product_size_variants").update({ is_default: false }).eq("id", previousDefault);
    undo.push(() => admin.from("product_size_variants").update({ is_default: true }).eq("id", previousDefault));
  }
  const variant = await admin
    .from("product_size_variants")
    .insert({ product_id: product.id, size_primary_mm: 15, is_default: true, sort_order: 900 })
    .select("id")
    .single();
  if (variant.error) throw new Error(variant.error.message);
  undo.push(() => admin.from("product_size_variants").delete().eq("id", variant.data.id));
  if (wasPublic.length) {
    await admin.from("finishes").update({ is_public: true }).in("id", wasPublic);
    undo.push(() => admin.from("finishes").update({ is_public: false }).in("id", wasPublic));
  }

  const publish = await admin
    .from("products")
    .update({
      model_storage_path: modelPath,
      status: "active",
      is_public: true,
      brand_id: null,
      material_id: metalMaterial.id,
      // Unique per product: `products.item_code` is unique, and four scenarios
      // stage four products in one suite run.
      item_code: product.item_code ?? `E2E-APP-${product.id.slice(0, 6).toUpperCase()}`,
    })
    .eq("id", product.id);
  if (publish.error) throw new Error(publish.error.message);
  undo.push(() =>
    admin
      .from("products")
      .update({
        model_storage_path: before.model_storage_path,
        status: before.status,
        is_public: before.is_public,
        brand_id: before.brand_id,
        material_id: before.material_id,
        item_code: before.item_code,
        default_finish_id: before.default_finish_id,
        model_scale_status: before.model_scale_status ?? "unconfirmed",
        model_scale_factor: before.model_scale_factor ?? null,
        model_scale_method: before.model_scale_method ?? null,
        model_scale_reference_variant_id: before.model_scale_reference_variant_id ?? null,
      })
      .eq("id", product.id),
  );

  // A sample product may already carry this finish; only what we attach is detached.
  const { data: already } = await admin.from("product_finishes").select("finish_id").eq("product_id", product.id).eq("finish_id", finishes[BUTTON_FINISH].id).maybeSingle();
  const attached = !already;
  if (attached) {
    const attach = await admin.from("product_finishes").insert({ product_id: product.id, finish_id: finishes[BUTTON_FINISH].id, sort_order: 900 });
    if (attach.error) throw new Error(attach.error.message);
    undo.push(() => admin.from("product_finishes").delete().eq("product_id", product.id).eq("finish_id", finishes[BUTTON_FINISH].id));
  }

  // The scale reset trigger fires on the path change, so confirming is its own write.
  const confirm = await admin
    .from("products")
    .update({
      default_finish_id: finishes[BUTTON_FINISH].id,
      model_scale_status: "confirmed",
      model_scale_factor: factor,
      model_scale_method: "known_dimension",
      model_scale_reference_variant_id: variant.data.id,
    })
    .eq("id", product.id);
  if (confirm.error) throw new Error(confirm.error.message);

    return { product, finishes, restore };
  } catch (error) {
    await restore();
    throw error;
  }
}

/** Opens the editor on a fresh design and returns its id (signed in). */
export async function openEditorFor(page, base, product) {
  await page.goto(`${base}/designer-studio/editor/new?product=${product.slug}`, { waitUntil: "networkidle" });
  await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 30000 });
  await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 40000 });
  return page.url().split("/").pop();
}

/**
 * One straight text layer, big enough for its colour to be read off the
 * screen. "II" by default: a plain stem through the glyph's own centre, so a
 * sample at that centre lands on the letter rather than through its counter.
 */
export async function addSampleText(page, value = "II", sizeMm = 3.6) {
  await page.getByTestId("add-text").click();
  await page.getByTestId("text-layer-content").fill(value);
  await page.getByTestId("text-layer-content").blur();
  await page.getByTestId("position-and-curve-toggle").click();
  await page.locator('[data-testid="text-layer-layout"] [data-value="straight"]').click();
  await page.getByTestId("pc-text-size-input").fill(String(sizeMm));
  await page.getByTestId("pc-text-size-input").blur();
  await page.waitForTimeout(1200);
}

/** Sets the appearance mode on the selected layer's row. */
export async function setMode(page, mode) {
  await page.getByTestId("appearance-mode").click();
  await page.getByRole("option", { name: new RegExp(mode, "i") }).click();
  await page.waitForTimeout(600);
}

/** Picks a finish in the layer's own picker sheet. */
export async function pickLayerFinish(page, cycCode) {
  await page.getByTestId("appearance-choose").click();
  const swatch = page.locator(`[data-testid="appearance-picker"] [data-testid="finish-swatch"][data-code="${cycCode}"]`);
  await swatch.waitFor({ timeout: 20000 });
  await swatch.click();
  await swatch.waitFor({ state: "detached", timeout: 20000 });
  await page.waitForTimeout(1200);
}

export async function readRecipe(admin, designId) {
  const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
  if (error) throw new Error(error.message);
  return data.draft_recipe;
}

export async function waitForRecipe(page, admin, designId, predicate, label, timeout = 20000) {
  const deadline = Date.now() + timeout;
  let recipe;
  while (Date.now() < deadline) {
    recipe = await readRecipe(admin, designId);
    if (recipe && predicate(recipe)) return recipe;
    await page.waitForTimeout(300);
  }
  throw new Error(`${label}: read-back never matched, last ${JSON.stringify(recipe?.layers?.map((l) => ({ relief: l.relief, appearance: l.appearance })))}`);
}

/** What the scene says each layer became. */
export async function reliefReports(page) {
  const raw = await page.getByTestId("editor-viewport").getAttribute("data-reliefs");
  return JSON.parse(raw ?? "[]");
}

export async function glyphReports(page) {
  const raw = await page.getByTestId("editor-viewport").getAttribute("data-glyphs");
  return JSON.parse(raw ?? "[]");
}

/**
 * The colour on screen at a point in the face frame (R7): the projection the
 * buyer is looking at, a 3 × 3 median so one specular pixel cannot decide it,
 * and CIE Lab so hue and lightness can be compared rather than raw RGB.
 */
export async function colourAt(page, canvas, { x, y, z }) {
  await page.waitForFunction(() => document.querySelector('[data-testid="editor-viewport"] canvas')?.dataset.viewProjection != null, null, { timeout: 20000 });
  const vp = (await canvas.getAttribute("data-view-projection")).split(",").map(Number);
  const shot = await canvas.screenshot();
  const { info, at } = await pixels(shot);
  const p = new THREE.Vector3(x, y, z).applyMatrix4(new THREE.Matrix4().fromArray(vp));
  const px = Math.round(((p.x + 1) / 2) * info.width);
  const py = Math.round(((1 - p.y) / 2) * info.height);
  if (px < 2 || py < 2 || px >= info.width - 2 || py >= info.height - 2) throw new Error(`sample point ${x},${y},${z} is off screen`);
  const samples = [];
  for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) samples.push(at(px + dx, py + dy));
  const rgb = [0, 1, 2].map((c) => samples.map((s) => s[c]).sort((a, b) => a - b)[4]);
  const lab = linearToLab(rgb255ToLinear(rgb));
  return { rgb, lab, screen: { x: px, y: py } };
}

/**
 * Where to read a layer's colour: the top face of a raised letter, the floor
 * of an engraved one, the surface itself for printed ink — the face the
 * appearance is actually on.
 */
export function samplePoint(glyph, relief) {
  if (relief.type === "deboss") return { x: glyph.x, y: glyph.y, z: glyph.z - relief.depthMm };
  if (relief.type === "printed") return { x: glyph.x, y: glyph.y, z: glyph.z + 0.02 };
  return { x: glyph.x, y: glyph.y, z: glyph.z + relief.depthMm };
}

/** Lab of a stored hex, to compare a render against what was asked for. */
export function labOfHex(hex) {
  const value = hex.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16));
  return linearToLab(rgb255ToLinear(rgb));
}

/** Hue angles are circular: 350° and 10° are 20° apart. */
export function hueDistance(a, b) {
  const angle = (lab) => (Math.atan2(lab[2], lab[1]) * 180) / Math.PI;
  const diff = Math.abs(angle(a) - angle(b)) % 360;
  return diff > 180 ? 360 - diff : diff;
}

export const chroma = (lab) => Math.hypot(lab[1], lab[2]);
