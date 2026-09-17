// Shared fixtures and measurement for render calibration (Phases 3b–3d):
// the flat disc model, the swatch-measurement CSV, a studio product set up
// for the editor route, and pixel statistics on the rendered canvas.
import { readFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { REPO_ROOT } from "./stack.mjs";
import { linearToLab, rgb255ToLinear } from "./colour.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";

const require = createRequire(path.join(REPO_ROOT, "package.json"));
export const sharp = require("sharp");

export const POLO_OBJ = path.join(REPO_ROOT, "scripts/e2e-local/fixtures/Polo_Button_10.8.obj");
export const MEASUREMENTS_CSV = path.join(REPO_ROOT, "docs/3d-editor/wincyc-swatch-measurements.csv");

/** A 15mm × 1mm disc with explicit flat-face normals, face on +Y. */
export function discObj(segments = 96, radius = 7.5, half = 0.5) {
  const v = [`v 0 ${half} 0`, `v 0 ${-half} 0`];
  const n = ["vn 0 1 0", "vn 0 -1 0"];
  const f = [];
  for (let i = 0; i < segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    const x = (Math.cos(a) * radius).toFixed(5);
    const z = (Math.sin(a) * radius).toFixed(5);
    v.push(`v ${x} ${half} ${z}`, `v ${x} ${-half} ${z}`);
    n.push(`vn ${Math.cos(a).toFixed(5)} 0 ${Math.sin(a).toFixed(5)}`);
  }
  const top = (i) => 3 + 2 * (i % segments);
  const bot = (i) => 4 + 2 * (i % segments);
  const side = (i) => 3 + (i % segments);
  for (let i = 0; i < segments; i++) {
    f.push(`f 1//1 ${top(i + 1)}//1 ${top(i)}//1`);
    f.push(`f 2//2 ${bot(i)}//2 ${bot(i + 1)}//2`);
    f.push(`f ${top(i)}//${side(i)} ${top(i + 1)}//${side(i + 1)} ${bot(i + 1)}//${side(i + 1)} ${bot(i)}//${side(i)}`);
  }
  return [...v, ...n, ...f].join("\n") + "\n";
}

/**
 * A smooth spherical cap on a disc, with vertex normals and per-face UVs — the
 * brushed facet check's subject (Phase 5 R5). It is smooth by construction and
 * carries no relief, so anything the eye can see across it is shading, not
 * geometry. The UVs are per face, as a CAD export's islands are: three.js
 * derives its anisotropy tangent from their screen-space derivatives, so a
 * per-face UV makes a per-face tangent — the fan of flat facets R5 is about.
 */
export function domeObj({ radius = 7.5, rise = 1.6, rings = 20, segments = 72, skirt = 0.6 } = {}) {
  const v = [];
  const vn = [];
  const vt = [];
  const f = [];
  // Sphere through the rim and the pole: centre on the axis, below the rim.
  const sphere = (radius * radius + rise * rise) / (2 * rise);
  const point = (r, a) => [r * Math.cos(a), Math.sqrt(Math.max(0, sphere * sphere - r * r)) - (sphere - rise), r * Math.sin(a)];
  const normal = (r, a) => {
    const [x, , z] = point(r, a);
    const y = Math.sqrt(Math.max(1e-6, sphere * sphere - r * r));
    const length = Math.hypot(x, y, z);
    return [x / length, y / length, z / length];
  };
  const index = (ring, seg) => ring * segments + (seg % segments) + 1;
  for (let ring = 0; ring <= rings; ring++) {
    const r = (ring / rings) * radius;
    for (let seg = 0; seg < segments; seg++) {
      const a = (seg / segments) * Math.PI * 2;
      const [x, y, z] = point(r, a);
      const [nx, ny, nz] = normal(r, a);
      v.push(`v ${x.toFixed(5)} ${y.toFixed(5)} ${z.toFixed(5)}`);
      vn.push(`vn ${nx.toFixed(5)} ${ny.toFixed(5)} ${nz.toFixed(5)}`);
    }
  }
  const base = (rings + 1) * segments;
  for (let seg = 0; seg < segments; seg++) {
    const a = (seg / segments) * Math.PI * 2;
    v.push(`v ${(radius * Math.cos(a)).toFixed(5)} ${(-skirt).toFixed(5)} ${(radius * Math.sin(a)).toFixed(5)}`);
    vn.push(`vn ${Math.cos(a).toFixed(5)} 0 ${Math.sin(a).toFixed(5)}`);
  }
  const rim = (seg) => base + (seg % segments) + 1;
  // Every triangle gets its own UV island, like a CAD export's.
  const face = (p, q, r) => {
    const t = vt.length + 1;
    vt.push("vt 0 0", "vt 1 0", "vt 0 1");
    f.push(`f ${p}/${t}/${p} ${q}/${t + 1}/${q} ${r}/${t + 2}/${r}`);
  };
  for (let ring = 0; ring < rings; ring++) {
    for (let seg = 0; seg < segments; seg++) {
      const a = index(ring, seg);
      const b = index(ring, seg + 1);
      const c = index(ring + 1, seg + 1);
      const d = index(ring + 1, seg);
      if (ring === 0) face(a, c, d);
      else {
        face(a, b, c);
        face(a, c, d);
      }
    }
  }
  for (let seg = 0; seg < segments; seg++) {
    face(index(rings, seg), rim(seg), rim(seg + 1));
    face(index(rings, seg), rim(seg + 1), index(rings, seg + 1));
  }
  return [...v, ...vn, ...vt, ...f].join("\n") + "\n";
}

export function readMeasurements() {
  const lines = readFileSync(MEASUREMENTS_CSV, "utf8").replace(/\r/g, "").trim().split("\n");
  const parse = (l) => {
    const out = [];
    let cur = "";
    let quoted = false;
    for (const ch of l) {
      if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out;
  };
  const header = parse(lines[0]);
  return lines.slice(1).map((l) => {
    const row = Object.fromEntries(parse(l).map((v, i) => [header[i], v]));
    return { ...row, glare: row.glare_flag === "yes" };
  });
}

export async function pixels(buffer) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (y * info.width + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  return { info, at };
}

/**
 * Bounding box of pixels that differ from the backdrop colour by more
 * than `threshold`. Scenarios open the editor with `?calibration=1`, which
 * hides all viewport chrome, so the whole screenshot is scanned.
 */
export async function subjectBox(buffer, threshold = 24) {
  const { info, at } = await pixels(buffer);
  // Left edge, mid-height: the site header's drop shadow darkens the top rows
  // once no banner sits between it and the canvas.
  const bg = at(2, Math.floor(info.height / 2));
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const p = at(x, y);
      if (Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2])) > threshold) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return { minX, maxX, minY, maxY, width: info.width, height: info.height };
}

/**
 * Pixels on the disc face: an ellipse inset to 60% of the subject box, which
 * keeps the rim band and the contact shadow out. Returns per-channel medians
 * and luminance percentiles.
 */
export async function faceStats(buffer) {
  const { at } = await pixels(buffer);
  const box = await subjectBox(buffer);
  const ex = (box.minX + box.maxX) / 2;
  const ey = (box.minY + box.maxY) / 2;
  const rx = (box.maxX - box.minX) * 0.3;
  const ry = (box.maxY - box.minY) * 0.3;
  const ch = [[], [], []];
  const lum = [];
  const lightness = [];
  for (let y = Math.floor(ey - ry); y <= ey + ry; y++) {
    for (let x = Math.floor(ex - rx); x <= ex + rx; x++) {
      if (((x - ex) / rx) ** 2 + ((y - ey) / ry) ** 2 > 1) continue;
      const p = at(x, y);
      ch[0].push(p[0]);
      ch[1].push(p[1]);
      ch[2].push(p[2]);
      lum.push(0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2]);
      lightness.push(lightnessOf(p));
    }
  }
  const pct = (arr, q) => [...arr].sort((a, b) => a - b)[Math.floor((arr.length - 1) * q)];
  const cut = pct(lum, 0.98);
  const top = lum.flatMap((l, i) => (l >= cut ? [i] : []));
  return {
    median: ch.map((a) => pct(a, 0.5)),
    /** Per-channel mean, 0–255 unrounded: finer than the median for near-neutral hue. */
    mean: ch.map((a) => a.reduce((sum, v) => sum + v, 0) / a.length),
    /** Per-channel median of the pixels at or above the p98 luminance. */
    highlight: ch.map((a) => pct(top.map((i) => a[i]), 0.5)),
    lumP02: pct(lum, 0.02),
    lumP98: pct(lum, 0.98),
    /** CIE L* of the p98 pixel lightness — the highlight. */
    lightnessP98: pct(lightness, 0.98),
  };
}

const lightnessOf = (rgb) => linearToLab(rgb255ToLinear(rgb))[0];

/** Median of a 5×5 patch at the image centre. */
export async function centrePixel(buffer) {
  const { info, at } = await pixels(buffer);
  const cx = Math.floor(info.width / 2);
  const cy = Math.floor(info.height / 2);
  const samples = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) samples.push(at(cx + dx, cy + dy));
  return [0, 1, 2].map((c) => samples.map((s) => s[c]).sort((a, b) => a - b)[12]);
}

/** Mean |Laplacian| of luminance over the central 30% — relief lettering is high-frequency. */
export async function centralDetail(buffer) {
  const { info, at } = await pixels(buffer);
  const lum = (x, y) => {
    const p = at(x, y);
    return 0.2126 * p[0] + 0.7152 * p[1] + 0.0722 * p[2];
  };
  const x0 = Math.floor(info.width * 0.35), x1 = Math.floor(info.width * 0.65);
  const y0 = Math.floor(info.height * 0.35), y1 = Math.floor(info.height * 0.65);
  let sum = 0, count = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      sum += Math.abs(4 * lum(x, y) - lum(x - 1, y) - lum(x + 1, y) - lum(x, y - 1) - lum(x, y + 1));
      count++;
    }
  }
  return sum / count;
}

/** Fraction of the viewport spanned by the subject. */
export async function subjectFill(buffer) {
  const b = await subjectBox(buffer);
  if (b.maxX < 0) return 0;
  return Math.max((b.maxX - b.minX + 1) / b.width, (b.maxY - b.minY + 1) / b.height);
}

/**
 * Loads the editor, stops the idle rotation, returns the camera to its framed
 * home and lets damping settle. Returns the canvas locator.
 */
export async function openEditor(page, url) {
  // The 3b–4.0 baselines were measured on a 920 × 599 canvas (1280 × 720 page,
  // sign-in banner showing). `?calibration=1` hides the banner, so the page
  // height is pinned to give the same canvas.
  await page.setViewportSize({ width: 1280, height: 680 });
  await page.evaluate(() => window.sessionStorage.clear()).catch(() => {});
  await page.goto(url, { waitUntil: "networkidle" });
  const canvas = page.getByTestId("editor-viewport").locator("canvas");
  await canvas.waitFor({ timeout: 30000 });
  await page.waitForTimeout(2000);
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.up();
  await page.mouse.dblclick(cx, cy);
  await page.waitForTimeout(1800);
  return canvas;
}

/** Picks a finish through the real "Change finish" sheet (no reload, camera untouched). */
export async function pickFinish(page, cycCode) {
  await page.getByRole("button", { name: /change finish/i }).click();
  const swatch = page.locator(`[data-testid="finish-swatch"][data-code="${cycCode}"]`);
  await swatch.waitFor({ timeout: 10000 });
  await swatch.click();
  await swatch.waitFor({ state: "detached", timeout: 10000 });
  await page.waitForTimeout(900);
}

/**
 * Publishes `product` with `modelPath` as its model and a 15mm size variant,
 * attaches `finishIds` (made public). Returns a restore function.
 *
 * Phase 4b (E1 collision 8): the buyer editor now refuses an unconfirmed
 * model, so every staged product also gets a confirmed scale. The factor is
 * derived from the staged file's own raw bounds (`parseObjRawBounds`) against
 * the 15mm variant, so the rendered size is exactly what the old force-rescale
 * produced — the 3b–4.0 pixel baselines hold unchanged.
 */
export async function stageProduct(admin, product, { modelPath, modelBody, finishIds = [], defaultFinishId = null, colourHex = null }) {
  const up = await admin.storage.from("product-models").upload(modelPath, modelBody, { upsert: true, contentType: "model/obj" });
  if (up.error) throw new Error(up.error.message);
  const { data: before } = await admin.from("finishes").select("id, is_public").in("id", finishIds.length ? finishIds : ["00000000-0000-0000-0000-000000000000"]);
  if (finishIds.length) {
    await admin.from("finishes").update({ is_public: true }).in("id", finishIds);
    const attach = await admin
      .from("product_finishes")
      .insert(finishIds.map((id, i) => ({ product_id: product.id, finish_id: id, sort_order: 900 + i })));
    if (attach.error) throw new Error(attach.error.message);
  }
  const variantMm = 15;
  const size = await admin.from("product_size_variants").insert({ product_id: product.id, size_primary_mm: variantMm, sort_order: 900 }).select("id").single();
  if (size.error) throw new Error(size.error.message);
  let colourId = null;
  if (colourHex) {
    const c = await admin.from("product_colours").insert({ product_id: product.id, name: "E2E Calibration", hex: colourHex, sort_order: -1 }).select("id").single();
    if (c.error) throw new Error(c.error.message);
    colourId = c.data.id;
  }

  const text = await bodyToText(modelBody);
  const rawBounds = parseObjRawBounds(text);
  const scaleFactor = variantMm / rawBounds.primary_raw;

  const pub = await admin
    .from("products")
    .update({
      model_storage_path: modelPath,
      status: "active",
      is_public: true,
      brand_id: null,
      item_code: product.item_code ?? `E2E-CAL-${product.id.slice(0, 6)}`,
      default_finish_id: defaultFinishId ?? product.default_finish_id,
    })
    .eq("id", product.id);
  if (pub.error) throw new Error(pub.error.message);

  // Separate update: `products_reset_model_scale` (Phase 4a) fires before
  // update OF `model_storage_path` and clobbers any scale fields set in the
  // *same* statement back to unconfirmed (collision 13's reset is by design)
  // — confirming has to be its own write, after the file is in place.
  const confirmScale = await admin
    .from("products")
    .update({
      model_scale_status: "confirmed",
      model_scale_factor: scaleFactor,
      model_scale_method: "known_dimension",
      model_scale_reference_variant_id: size.data.id,
    })
    .eq("id", product.id);
  if (confirmScale.error) throw new Error(confirmScale.error.message);

  const restore = async () => {
    await admin.from("products").update({ default_finish_id: product.default_finish_id }).eq("id", product.id);
    if (finishIds.length) {
      await admin.from("product_finishes").delete().eq("product_id", product.id).in("finish_id", finishIds);
      for (const f of before ?? []) await admin.from("finishes").update({ is_public: f.is_public }).eq("id", f.id);
    }
    if (colourId) await admin.from("product_colours").delete().eq("id", colourId);
    await admin.from("product_size_variants").delete().eq("product_id", product.id).eq("sort_order", 900);
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
  };
  return { restore, colourId };
}

/** Reads a storage `.upload()` body (Buffer, Blob, or string) as UTF-8 text. */
async function bodyToText(body) {
  if (typeof body === "string") return body;
  if (Buffer.isBuffer(body)) return body.toString("utf8");
  if (typeof body.text === "function") return body.text();
  throw new Error("unsupported model body type for raw-bounds parsing");
}

export async function pickProducts(admin) {
  const { data, error } = await admin
    .from("products")
    .select(
      "id, slug, item_code, model_storage_path, status, is_public, brand_id, default_finish_id, " +
        "model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id, " +
        "material:product_materials!material_id(is_metal)",
    )
    .order("slug")
    .limit(300);
  if (error) throw new Error(error.message);
  const metal = data.filter((p) => p.material?.is_metal);
  const nonMetal = data.find((p) => !p.material?.is_metal);
  return { metal: metal[0], metal2: metal[1], nonMetal };
}

export const FINISH_AXES_SELECT =
  "id, cyc_code, marketing_name, is_public, coating_id, base_color_hex, metalness, roughness, anisotropy, clearcoat, clearcoat_roughness, two_tone, oxide_color_hex, " +
  "base_family:finish_base_families!base_family_id(code), surface:finish_surfaces!surface_id(code), " +
  "tone:finish_tones!tone_id(code), effect:finish_effects!effect_id(code), tint:finish_tints!tint_id(code), coating:finish_coatings!coating_id(code)";

export const axesOf = (f) => ({
  base_family: f.base_family?.code ?? null,
  surface: f.surface?.code ?? null,
  tone: f.tone?.code ?? null,
  effect: f.effect?.code ?? null,
  tint: f.tint?.code ?? null,
});
