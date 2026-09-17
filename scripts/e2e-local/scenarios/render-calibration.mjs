// Phase 3b: render calibration.
//
// 1. Colour pipeline: a flat non-metal disc of #808080 and of #C0392B renders
//    with its centre pixel within ±3/255 of the input (Neutral tone mapping,
//    sRGB output, exposure calibrated once).
// 2. Six plated finishes on the lettered Polo button, rendered through the
//    real editor route and composed into reports/3b-materials.png for human
//    review; relief lettering must carry visible detail in each.
// 3. No viewport toolbar; three-quarter camera with the model filling ~60%.
// 4. The database derivation and src/features/finishes/metalReflectance.ts
//    agree on every plated row.
//
// Set RENDER_DIAG_DIR to also write every individual render there.
import assert from "node:assert/strict";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { REPO_ROOT } from "../lib/stack.mjs";
import { derivePlatedMaterial } from "../../../src/features/finishes/metalReflectance.ts";

const require = createRequire(path.join(REPO_ROOT, "package.json"));
const sharp = require("sharp");

const PLATED = [
  { code: "CYC-0001", label: "Bright nickel" },
  { code: "CYC-0002", label: "Brushed nickel" },
  { code: "CYC-0013", label: "Gold" },
  { code: "CYC-0057", label: "Anti brass" },
  { code: "CYC-0004", label: "Gun metal" },
  { code: "CYC-0071", label: "Red copper" },
];
const POLO_OBJ = path.join(REPO_ROOT, "public/models/Polo_Button_10.8.obj");
const TOLERANCE = 3;

/** A 15mm × 1mm disc with explicit flat-face normals, face on +Y. */
function discObj(segments = 96, radius = 7.5, half = 0.5) {
  const v = [];
  const n = ["vn 0 1 0", "vn 0 -1 0"];
  const f = [];
  v.push(`v 0 ${half} 0`, `v 0 ${-half} 0`);
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

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

async function pixels(buffer) {
  const { data, info } = await sharp(buffer).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const at = (x, y) => {
    const i = (y * info.width + x) * 3;
    return [data[i], data[i + 1], data[i + 2]];
  };
  return { data, info, at };
}

/** Median of a 5×5 patch at the centre — robust to one-pixel antialiasing noise. */
async function centrePixel(buffer) {
  const { info, at } = await pixels(buffer);
  const cx = Math.floor(info.width / 2);
  const cy = Math.floor(info.height / 2);
  const samples = [];
  for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) samples.push(at(cx + dx, cy + dy));
  return [0, 1, 2].map((ch) => samples.map((s) => s[ch]).sort((a, b) => a - b)[12]);
}

/** Fraction of the viewport spanned by pixels that differ from the backdrop (corner) colour. */
async function modelFill(buffer) {
  const { info, at } = await pixels(buffer);
  const bg = at(2, 2);
  let minX = info.width, maxX = -1, minY = info.height, maxY = -1;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const p = at(x, y);
      if (Math.max(Math.abs(p[0] - bg[0]), Math.abs(p[1] - bg[1]), Math.abs(p[2] - bg[2])) > 24) {
        minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      }
    }
  }
  if (maxX < 0) return 0;
  return Math.max((maxX - minX + 1) / info.width, (maxY - minY + 1) / info.height);
}

/** Mean |Laplacian| of luminance over the central 30% — relief lettering is high-frequency. */
async function centralDetail(buffer) {
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

export default async function ({ page, base, admin, h }) {
  const diagDir = process.env.RENDER_DIAG_DIR;
  if (diagDir) mkdirSync(diagDir, { recursive: true });

  /* ---- 4. database derivation == metalReflectance.ts, every plated row ---- */
  const { data: allFinishes, error: finishesError } = await admin
    .from("finishes")
    .select(
      "id, cyc_code, marketing_name, is_public, coating_id, base_color_hex, metalness, roughness, anisotropy, clearcoat, clearcoat_roughness, " +
        "base_family:finish_base_families!base_family_id(code), surface:finish_surfaces!surface_id(code), " +
        "tone:finish_tones!tone_id(code), effect:finish_effects!effect_id(code), tint:finish_tints!tint_id(code)",
    );
  if (finishesError) throw new Error(finishesError.message);
  const plated = allFinishes.filter((f) => !f.coating_id);
  const drift = plated.filter((f) => {
    const expected = derivePlatedMaterial({
      base_family: f.base_family?.code ?? null,
      surface: f.surface?.code ?? null,
      tone: f.tone?.code ?? null,
      effect: f.effect?.code ?? null,
      tint: f.tint?.code ?? null,
    });
    const stored = {
      base_color_hex: f.base_color_hex,
      metalness: f.metalness,
      roughness: f.roughness,
      anisotropy: f.anisotropy,
      clearcoat: f.clearcoat,
      clearcoat_roughness: f.clearcoat_roughness,
    };
    return JSON.stringify(expected) !== JSON.stringify(stored);
  });
  assert.equal(drift.length, 0, `DB and metalReflectance.ts disagree on: ${drift.map((f) => f.cyc_code).join(", ")}`);

  /* ---- fixtures: one metal product, one non-metal product ---- */
  const { data: products, error } = await admin
    .from("products")
    .select("id, slug, item_code, model_storage_path, status, is_public, brand_id, default_finish_id, material:product_materials!material_id(is_metal)")
    .limit(300);
  if (error) throw new Error(error.message);
  const metal = products.find((p) => p.material?.is_metal);
  const nonMetal = products.find((p) => !p.material?.is_metal);
  assert.ok(metal && nonMetal, "need a metal and a non-metal product in the seed");

  const platedRows = PLATED.map((p) => ({ ...p, row: allFinishes.find((f) => f.cyc_code === p.code) }));
  assert.ok(platedRows.every((p) => p.row), "the six reference finishes exist");

  const paths = {
    polo: `models/${metal.id}/e2e-calibration-polo.obj`,
    metalDisc: `models/${metal.id}/e2e-calibration-disc.obj`,
    disc: `models/${nonMetal.id}/e2e-calibration-disc.obj`,
  };
  const upload = async (p, body) => {
    const { error: e } = await admin.storage.from("product-models").upload(p, body, { upsert: true, contentType: "model/obj" });
    if (e) throw new Error(e.message);
  };

  const restore = async () => {
    await admin.from("products").update({ default_finish_id: metal.default_finish_id }).eq("id", metal.id);
    await admin.from("product_finishes").delete().eq("product_id", metal.id).in("finish_id", platedRows.map((p) => p.row.id));
    await Promise.all(platedRows.map((p) => admin.from("finishes").update({ is_public: p.row.is_public }).eq("id", p.row.id)));
    await admin.from("product_colours").delete().eq("product_id", nonMetal.id).eq("name", "E2E Calibration");
    await admin.from("product_size_variants").delete().in("product_id", [metal.id, nonMetal.id]).eq("sort_order", 900);
    for (const p of [metal, nonMetal]) {
      await admin
        .from("products")
        .update({ model_storage_path: p.model_storage_path, status: p.status, is_public: p.is_public, brand_id: p.brand_id, item_code: p.item_code })
        .eq("id", p.id);
    }
    await admin.storage.from("product-models").remove(Object.values(paths));
  };

  const publish = async (p, modelPath) => {
    const { error: e } = await admin
      .from("products")
      .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: p.item_code ?? `E2E-CAL-${p.id.slice(0, 6)}` })
      .eq("id", p.id);
    if (e) throw new Error(e.message);
  };

  // stop the idle rotation, return to the framed home, let damping settle
  const render = async (url, name) => {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await page.evaluate(() => window.sessionStorage.clear());
    await page.goto(url, { waitUntil: "networkidle" });
    const canvas = page.getByTestId("editor-viewport").locator("canvas");
    await canvas.waitFor({ timeout: 30000 });
    await page.waitForTimeout(2500);
    const box = await canvas.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.dblclick(cx, cy);
    await page.waitForTimeout(2000);
    const shot = await canvas.screenshot();
    if (diagDir) writeFileSync(path.join(diagDir, `${name}.png`), shot);
    return shot;
  };

  try {
    // the cookie banner is a fixed overlay that would sit over the canvas
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();

    await upload(paths.polo, readFileSync(POLO_OBJ));
    await upload(paths.metalDisc, new Blob([discObj()], { type: "model/obj" }));
    await upload(paths.disc, new Blob([discObj()], { type: "model/obj" }));

    const sizes = await admin.from("product_size_variants").insert([
      { product_id: metal.id, size_primary_mm: 15, is_default: false, sort_order: 900 },
      { product_id: nonMetal.id, size_primary_mm: 15, is_default: false, sort_order: 900 },
    ]);
    if (sizes.error) throw new Error(sizes.error.message);

    await Promise.all(platedRows.map((p) => admin.from("finishes").update({ is_public: true }).eq("id", p.row.id)));
    const attach = await admin
      .from("product_finishes")
      .insert(platedRows.map((p, i) => ({ product_id: metal.id, finish_id: p.row.id, sort_order: 900 + i })));
    if (attach.error) throw new Error(attach.error.message);

    /* ---- 1. colour pipeline ---- */
    const colour = await admin
      .from("product_colours")
      .insert({ product_id: nonMetal.id, name: "E2E Calibration", hex: "#808080", sort_order: -1 })
      .select("id")
      .single();
    if (colour.error) throw new Error(colour.error.message);
    await publish(nonMetal, paths.disc);

    const discUrl = `${base}/designer-studio/editor/new?product=${nonMetal.slug}`;
    const calibration = {};
    for (const hex of ["#808080", "#C0392B"]) {
      await admin.from("product_colours").update({ hex }).eq("id", colour.data.id);
      const shot = await render(discUrl, `disc-${hex.slice(1)}`);
      const got = await centrePixel(shot);
      const want = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      calibration[hex] = { got, want, linearGot: got.map((c) => +srgbToLinear(c / 255).toFixed(4)) };
      console.log("calibration", hex, JSON.stringify(calibration[hex]));
      if (hex === "#808080") {
        calibration.fill = await modelFill(shot);
        calibration.flatDetail = await centralDetail(shot);
        assert.equal(await page.getByTestId("viewport-toolbar").count(), 0, "no floating viewport toolbar");
      }
    }
    console.log("fill", calibration.fill, "flatDetail", calibration.flatDetail);

    /* ---- 2. six plated finishes on the lettered button ---- */
    await publish(metal, paths.metalDisc);
    await admin.from("products").update({ default_finish_id: platedRows[0].row.id }).eq("id", metal.id);
    await render(`${base}/designer-studio/editor/new?product=${metal.slug}`, "nickel-disc");

    await publish(metal, paths.polo);
    const tiles = [];
    for (const p of platedRows) {
      await admin.from("products").update({ default_finish_id: p.row.id }).eq("id", metal.id);
      const shot = await render(`${base}/designer-studio/editor/new?product=${metal.slug}`, `plated-${p.code}`);
      const detail = await centralDetail(shot);
      tiles.push({ ...p, shot, detail });
      console.log("plated", p.code, p.row.base_color_hex, "detail", detail.toFixed(2));
    }

    // Contact sheet: 3 × 2, labelled.
    const TILE_W = 640;
    const TILE_H = 480;
    const LABEL_H = 56;
    const composites = [];
    for (const [i, t] of tiles.entries()) {
      const img = await sharp(t.shot).resize(TILE_W, TILE_H, { fit: "contain", background: "#F5F5F5" }).png().toBuffer();
      const left = (i % 3) * TILE_W;
      const top = Math.floor(i / 3) * (TILE_H + LABEL_H);
      composites.push({ input: img, left, top });
      const label = `<svg width="${TILE_W}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="16" y="24" font-family="Helvetica, Arial, sans-serif" font-size="18" fill="#141414">${t.label} · ${t.code}</text><text x="16" y="46" font-family="Menlo, monospace" font-size="13" fill="#6B6B6B">base ${t.row.base_color_hex} · roughness ${t.row.roughness} · anisotropy ${t.row.anisotropy}</text></svg>`;
      composites.push({ input: Buffer.from(label), left, top: top + TILE_H });
    }
    mkdirSync(path.join(REPO_ROOT, "reports"), { recursive: true });
    const sheetPath = path.join(REPO_ROOT, "reports/3b-materials.png");
    await sharp({ create: { width: TILE_W * 3, height: (TILE_H + LABEL_H) * 2, channels: 3, background: "#FFFFFF" } })
      .composite(composites)
      .png()
      .toFile(sheetPath);

    /* ---- assertions ---- */
    for (const hex of ["#808080", "#C0392B"]) {
      const { got, want } = calibration[hex];
      for (let ch = 0; ch < 3; ch++) {
        assert.ok(Math.abs(got[ch] - want[ch]) <= TOLERANCE, `${hex} renders as rgb(${got.join(",")}), want rgb(${want.join(",")}) ±${TOLERANCE}`);
      }
    }
    assert.ok(calibration.fill >= 0.5 && calibration.fill <= 0.72, `model fills ${calibration.fill.toFixed(2)} of the viewport, want ~0.6`);
    for (const t of tiles) {
      assert.ok(t.detail > calibration.flatDetail * 3, `${t.code}: relief detail ${t.detail.toFixed(2)} vs flat disc ${calibration.flatDetail.toFixed(2)}`);
    }

    return {
      calibration: { "#808080": calibration["#808080"].got, "#C0392B": calibration["#C0392B"].got, fill: +calibration.fill.toFixed(3) },
      plated: tiles.map((t) => ({ code: t.code, base: t.row.base_color_hex, detail: +t.detail.toFixed(2) })),
      contactSheet: "reports/3b-materials.png",
      parity: `${plated.length} plated rows match metalReflectance.ts`,
    };
  } finally {
    await restore();
  }
}
