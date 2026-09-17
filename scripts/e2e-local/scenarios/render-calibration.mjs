// Render calibration (Phase 3b, revised 3c, 3d and 3e).
//
// 1. Procedural studio: a bright nickel flat disc at reference F0 (RTR4, before
//    family calibration) reads surround ≤ #505050 and highlight ≥ #EDEDED in
//    one smooth gradient.
// 2. Colour pipeline: #808080 and #C0392B dielectric discs render centre-pixel
//    within ±3/255.
// 3. Database derivation == src/features/finishes/metalReflectance.ts on every
//    plated row; painted rows take their base colour from the chart CSV and
//    their roughness / clearcoat / metalness from the coating table and no
//    oxide colour.
// 4. Twelve finishes on the lettered Polo button → reports/3e-materials.png,
//    each beside its chart swatch, for human review; relief visible in each.
// 5. No viewport toolbar; three-quarter camera filling ~60%.
import assert from "node:assert/strict";
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../lib/stack.mjs";
import {
  sharp,
  POLO_OBJ,
  discObj,
  readMeasurements,
  faceStats,
  centrePixel,
  centralDetail,
  subjectFill,
  openEditor,
  pickFinish,
  stageProduct,
  pickProducts,
  FINISH_AXES_SELECT,
  axesOf,
} from "../lib/calibration.mjs";
import { hexToRgb255 } from "../lib/colour.mjs";
import { derivePlatedMaterial, METAL_F0, linearToSrgbHex } from "../../../src/features/finishes/metalReflectance.ts";

const TOLERANCE = 3;
const SHEET = [
  { code: "CYC-0001", label: "Bright nickel" },
  { code: "CYC-0002", label: "Brushed nickel" },
  { code: "CYC-0013", label: "Gold" },
  { code: "CYC-0057", label: "Anti brass" },
  { code: "CYC-0004", label: "Gun metal" },
  { code: "CYC-0071", label: "Red copper" },
  { code: "CYC-0076", label: "Anti copper" },
  { code: "CYC-0019", label: "Rose gold" },
  { code: "CYC-0014", label: "Brushed gold" },
  { code: "CYC-0111", label: "Gloss black enamel" },
  // The chart has no gloss red enamel; metallic red is its only red paint.
  { code: "CYC-0123", label: "Metallic red (no gloss red enamel on chart)" },
  { code: "CYC-0112", label: "Matt black enamel" },
];
const COATING = {
  GLOSS_ENAMEL: { roughness: 0.15, clearcoat: 1 },
  MATT_ENAMEL: { roughness: 0.6, clearcoat: 0 },
  RUBBER: { roughness: 0.85, clearcoat: 0 },
  PEARL: { roughness: 0.3, clearcoat: 0 },
  EP: { roughness: 0.3, clearcoat: 0 },
  GLITTER: { roughness: 0.4, clearcoat: 0 },
  VELVET: { roughness: 0.95, clearcoat: 0 },
  EPOXY: { roughness: 0.05, clearcoat: 1 },
  CERAMIC: { roughness: 0.2, clearcoat: 0 },
  METALLIC: { roughness: 0.3, clearcoat: 0 },
};

export default async function ({ page, base, admin, h }) {
  const measurements = new Map(readMeasurements().map((m) => [m.cyc_code, m]));

  /* ---- 3. derivation: plated parity, painted from the chart ---- */
  const { data: finishes, error } = await admin.from("finishes").select(FINISH_AXES_SELECT);
  if (error) throw new Error(error.message);
  const plated = finishes.filter((f) => !f.coating_id);
  const painted = finishes.filter((f) => f.coating_id);
  const drift = plated.filter((f) => {
    const expected = derivePlatedMaterial(axesOf(f));
    const stored = {
      base_color_hex: f.base_color_hex,
      metalness: f.metalness,
      roughness: f.roughness,
      anisotropy: f.anisotropy,
      clearcoat: f.clearcoat,
      clearcoat_roughness: f.clearcoat_roughness,
      two_tone: f.two_tone,
      oxide_color_hex: f.oxide_color_hex,
    };
    return JSON.stringify(expected) !== JSON.stringify(stored);
  });
  assert.equal(drift.length, 0, `DB and metalReflectance.ts disagree on: ${drift.map((f) => f.cyc_code).join(", ")}`);
  assert.equal(painted.length, 27, "27 painted rows");
  for (const f of painted) {
    const m = measurements.get(f.cyc_code);
    const c = COATING[f.coating.code];
    assert.equal(f.base_color_hex, m.hex_srgb.toUpperCase(), `${f.cyc_code} base colour is the chart measurement`);
    assert.equal(f.metalness, f.coating.code === "METALLIC" ? 0.6 : 0, `${f.cyc_code} metalness`);
    assert.equal(f.roughness, c.roughness, `${f.cyc_code} roughness from ${f.coating.code}`);
    assert.equal(f.clearcoat, c.clearcoat, `${f.cyc_code} clearcoat from ${f.coating.code}`);
    assert.equal(f.two_tone, false);
    assert.equal(f.oxide_color_hex, null, `${f.cyc_code} painted rows have no oxide layer`);
  }
  const antique = plated.filter((f) => f.two_tone).length;

  const { metal, nonMetal } = await pickProducts(admin);
  const byCode = new Map(finishes.map((f) => [f.cyc_code, f]));
  const sheetRows = SHEET.map((s) => ({ ...s, row: byCode.get(s.code) }));
  assert.ok(sheetRows.every((s) => s.row), "the twelve sheet finishes exist");

  await page.goto(base, { waitUntil: "domcontentloaded" });
  await h.dismissCookies();

  const out = { antiqueRows: antique, paintedRows: painted.length, platedParity: plated.length };

  /* ---- 1. studio on reference nickel ---- */
  const nickel = byCode.get("CYC-0001");
  const referenceNickel = linearToSrgbHex(METAL_F0.nickel);
  const stagedStudio = await stageProduct(admin, metal, {
    modelPath: `models/${metal.id}/e2e-calibration-disc.obj`,
    modelBody: new Blob([discObj()], { type: "model/obj" }),
    finishIds: [nickel.id],
    defaultFinishId: nickel.id,
  });
  try {
    // explicit values take the trigger's hand-set path; restored below
    await admin.from("finishes").update({ base_color_hex: referenceNickel }).eq("id", nickel.id);
    const canvas = await openEditor(page, `${base}/designer-studio/editor/new?product=${metal.slug}`);
    const stats = await faceStats(await canvas.screenshot());
    out.studio = { surroundLum: Math.round(stats.lumP02), highlightLum: Math.round(stats.lumP98), referenceNickel };
    assert.ok(stats.lumP02 <= 0x50, `surround-facing region ${stats.lumP02.toFixed(0)} should be ≤ #505050`);
    assert.ok(stats.lumP98 >= 0xed, `highlight ${stats.lumP98.toFixed(0)} should be ≥ #EDEDED`);
    assert.equal(await page.getByTestId("viewport-toolbar").count(), 0, "no floating viewport toolbar");
  } finally {
    await admin.from("finishes").update({ base_color_hex: nickel.base_color_hex }).eq("id", nickel.id);
    await stagedStudio.restore();
  }

  /* ---- 2. dielectric colour calibration + camera fill ---- */
  const stagedDisc = await stageProduct(admin, nonMetal, {
    modelPath: `models/${nonMetal.id}/e2e-calibration-disc.obj`,
    modelBody: new Blob([discObj()], { type: "model/obj" }),
    colourHex: "#808080",
  });
  let flatDetail = 0;
  try {
    out.calibration = {};
    for (const hex of ["#808080", "#C0392B"]) {
      await admin.from("product_colours").update({ hex }).eq("id", stagedDisc.colourId);
      const canvas = await openEditor(page, `${base}/designer-studio/editor/new?product=${nonMetal.slug}`);
      const shot = await canvas.screenshot();
      const got = await centrePixel(shot);
      const want = hexToRgb255(hex);
      out.calibration[hex] = got;
      for (let ch = 0; ch < 3; ch++) {
        assert.ok(Math.abs(got[ch] - want[ch]) <= TOLERANCE, `${hex} renders as rgb(${got.join(",")}), want rgb(${want.join(",")}) ±${TOLERANCE}`);
      }
      if (hex === "#808080") {
        out.fill = +(await subjectFill(shot)).toFixed(3);
        flatDetail = await centralDetail(shot);
        assert.ok(out.fill >= 0.5 && out.fill <= 0.72, `model fills ${out.fill} of the viewport, want ~0.6`);
      }
    }
  } finally {
    await stagedDisc.restore();
  }

  /* ---- 4. contact sheet ---- */
  const stagedPolo = await stageProduct(admin, metal, {
    modelPath: `models/${metal.id}/e2e-calibration-polo.obj`,
    modelBody: readFileSync(POLO_OBJ),
    finishIds: sheetRows.map((s) => s.row.id),
    defaultFinishId: sheetRows[0].row.id,
  });
  const tiles = [];
  try {
    const canvas = await openEditor(page, `${base}/designer-studio/editor/new?product=${metal.slug}`);
    for (const s of sheetRows) {
      await pickFinish(page, s.code);
      // antique finishes bake occlusion on first use
      if (s.row.two_tone) await page.waitForTimeout(1500);
      const shot = await canvas.screenshot();
      tiles.push({ ...s, shot, detail: await centralDetail(shot) });
    }
  } finally {
    await stagedPolo.restore();
  }

  const TILE_W = 520;
  const TILE_H = 400;
  const LABEL_H = 64;
  const COLS = 4;
  const SWATCH = 56;
  const composites = [];
  for (const [i, t] of tiles.entries()) {
    const left = (i % COLS) * TILE_W;
    const top = Math.floor(i / COLS) * (TILE_H + LABEL_H);
    const img = await sharp(t.shot).resize(TILE_W, TILE_H, { fit: "cover", position: "centre" }).png().toBuffer();
    composites.push({ input: img, left, top });
    const chart = measurements.get(t.code);
    const square = `<svg width="${SWATCH + 4}" height="${SWATCH + 22}" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="${SWATCH + 4}" height="${SWATCH + 22}" fill="#FFFFFF"/><rect x="2" y="2" width="${SWATCH}" height="${SWATCH}" fill="${chart.hex_srgb}" stroke="#141414" stroke-width="1"/><text x="2" y="${SWATCH + 16}" font-family="Menlo, monospace" font-size="11" fill="#141414">chart${chart.glare ? "*" : ""}</text></svg>`;
    composites.push({ input: Buffer.from(square), left: left + 10, top: top + 10 });
    const label = `<svg width="${TILE_W}" height="${LABEL_H}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#FFFFFF"/><text x="14" y="24" font-family="Helvetica, Arial, sans-serif" font-size="16" fill="#141414">${t.label} · ${t.code}</text><text x="14" y="46" font-family="Menlo, monospace" font-size="12" fill="#6B6B6B">chart ${chart.hex_srgb}${chart.glare ? " (glare)" : ""} · base ${t.row.base_color_hex} · r ${t.row.roughness}${t.row.two_tone ? " · two-tone" : ""}${t.row.clearcoat ? " · clearcoat" : ""}</text></svg>`;
    composites.push({ input: Buffer.from(label), left, top: top + TILE_H });
  }
  mkdirSync(path.join(REPO_ROOT, "reports"), { recursive: true });
  const rows = Math.ceil(tiles.length / COLS);
  await sharp({ create: { width: TILE_W * COLS, height: (TILE_H + LABEL_H) * rows, channels: 3, background: "#FFFFFF" } })
    .composite(composites)
    .png()
    .toFile(path.join(REPO_ROOT, "reports/3e-materials.png"));

  for (const t of tiles) {
    assert.ok(t.detail > flatDetail * 3, `${t.code}: relief detail ${t.detail.toFixed(2)} vs flat disc ${flatDetail.toFixed(2)}`);
  }
  out.sheet = { file: "reports/3e-materials.png", detail: Object.fromEntries(tiles.map((t) => [t.code, +t.detail.toFixed(1)])) };
  return out;
}
