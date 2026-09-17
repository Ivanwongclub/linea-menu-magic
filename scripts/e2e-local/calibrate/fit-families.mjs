// Per-family calibration of plated finishes against the WIN-CYC chart
// (Phase 3d, superseding 3c's saturation/value fit). Run through the harness:
//
//   npm run e2e:run -- calibrate/fit-families.mjs
//
// Lightness is physical (R1): nothing here fits L*. For every plated base
// family it renders the R2 rows — glare-free chart rows, MATT / SAND / BRUSHED
// surfaces preferred — as flat 15mm discs through the real editor route under
// the procedural studio (a flat disc has no occlusion, so two-tone rows render
// their buffed layer), and records:
//   hue       rendered vs chart median hue angle (CIELAB); rendered colour is
//             each disc face's per-channel mean, which resolves the hue of
//             near-neutral families below one 8-bit step
//   lightness rendered median L* vs the physical L* — the same rows predicted
//             with no hue rotation, through the measured transfer
//   highlight median of each disc's p98 L*
// plus a bright-nickel (CYC-0001) disc for the studio targets.
//
// FIT=1 steps each family's hue shift on its measured hue error (stepHue),
// sets NICKEL's chroma scale from the bright-nickel highlight through the
// measured transfer A = inverseNeutral(rendered) / base, and takes the
// two-tone oxide L* from the chart (R3). APPLY=1 writes the fit to finish_family_calibration and
// recomputes the rows, so a second run measures the real residuals.
// Writes reports/3d-family-fit.json.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../lib/stack.mjs";
import {
  discObj,
  readMeasurements,
  faceStats,
  openEditor,
  pickFinish,
  stageProduct,
  pickProducts,
  FINISH_AXES_SELECT,
  axesOf,
} from "../lib/calibration.mjs";
import {
  hexToLab,
  hexToRgb255,
  rgb255ToLinear,
  linearToLab,
  linearToRgb255,
  medianLab,
  median,
  neutralToneMap,
  inverseNeutralToneMap,
  rgb255ToHex,
  hueOf,
  hueDifference,
} from "../lib/colour.mjs";
import { platedLinear, FAMILY_CALIBRATION, OXIDE_L_FLOOR, TWO_TONE_FAMILIES, TWO_TONE_TONES } from "../../../src/features/finishes/metalReflectance.ts";

export const OUT = path.join(REPO_ROOT, "reports/3d-family-fit.json");
export const STUDIO_CODE = "CYC-0001";
const PREFERRED_SURFACES = new Set(["MATT", "SAND", "BRUSHED"]);
/** R4: no fit. */
export const EXEMPT = {
  STAINLESS_STEEL: "physical iron/steel, no fit; swatch CYC-0086 needs re-photographing (R4)",
  TIN: "3c chart-derived value kept (R4)",
};

const calibrationFor = (family, patch, base = FAMILY_CALIBRATION) => ({
  ...base,
  [family]: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: null, ...base[family], ...patch },
});

export function predictLab(row, calibration) {
  const base = platedLinear(row.axes, calibration);
  const pre = row.transfer.map((a, c) => a * base[c]);
  return linearToLab(neutralToneMap(pre));
}

export const predictedMedianLab = (rows, calibration) => medianLab(rows.map((r) => predictLab(r, calibration)));

/** The rows' L* with the family's hue rotation removed — the physical lightness (R1). */
export const physicalLightness = (family, rows) => predictedMedianLab(rows, calibrationFor(family, { hue_shift: 0, chroma_scale: 1 }))[0];

/**
 * R1/R2: rotating the base hue by x moves the rendered hue by g·x, and g is
 * not 1 — PBR Neutral shares an offset and a desaturation across channels,
 * and near-neutral families (nickel, gun metal) sit close to the studio's own
 * tint, so g approaches 2 and a plain step oscillates. So: a secant step on
 * the measured error when the previous run applied a different shift, else a
 * half step. Converges in a few runs; each run re-renders.
 */
export const signedHue = (to, from) => ((to - from + 540) % 360) - 180;
export function stepHue(current, error, previous) {
  let next = current + error / 2;
  if (previous && previous.shift !== current && previous.error !== error) {
    const step = (-error * (current - previous.shift)) / (error - previous.error);
    next = current + Math.max(-30, Math.min(30, step));
  }
  return Math.round(signedHue(next, 0) * 4) / 4;
}

/** Studio target (R5): bright nickel's highlight luminance, with a margin for prediction error. */
export const STUDIO_HIGHLIGHT = 0xed;
const HIGHLIGHT_MARGIN = 3;
const luma = (rgb) => 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];

export function predictHighlight(studioRow, calibration) {
  const base = platedLinear(studioRow.axes, calibration);
  return luma(linearToRgb255(neutralToneMap(studioRow.highlightTransfer.map((a, c) => a * base[c]))));
}

/**
 * R1 lets chroma only fall. A hue rotation can move bright nickel's highlight
 * below the studio target (a blue highlight has less luma at the same L*);
 * take the largest chroma scale, in 0.05 steps, that keeps it.
 */
export function fitNickelChroma(hue_shift, studioRow) {
  for (let k = 20; k >= 0; k--) {
    const chroma_scale = k / 20;
    const predicted = predictHighlight(studioRow, calibrationFor("NICKEL", { hue_shift, chroma_scale }));
    if (predicted >= STUDIO_HIGHLIGHT + HIGHLIGHT_MARGIN || k === 0) return { chroma_scale, predictedHighlight: +predicted.toFixed(1) };
  }
}

/** R3: oxide L* = chart median L* of the family's glare-free two-tone rows, floored. */
export function fitOxide(finishRows, measurements) {
  const twoTone = finishRows.filter((f) => {
    const a = axesOf(f);
    return (a.tone && TWO_TONE_TONES.has(a.tone)) || TWO_TONE_FAMILIES.has(a.base_family);
  });
  const clean = twoTone.filter((f) => !measurements.get(f.cyc_code).glare);
  if (!clean.length) return null;
  const l = median(clean.map((f) => hexToLab(measurements.get(f.cyc_code).hex_srgb)[0]));
  return +Math.max(OXIDE_L_FLOOR, l).toFixed(2);
}

export default async function ({ page, base, admin, h }) {
  const fit = process.env.FIT === "1";
  const apply = process.env.APPLY === "1";
  const measurements = new Map(readMeasurements().map((m) => [m.cyc_code, m]));

  const { data: finishes, error } = await admin.from("finishes").select(FINISH_AXES_SELECT);
  if (error) throw new Error(error.message);
  const plated = finishes.filter((f) => !f.coating_id && measurements.has(f.cyc_code));

  const byFamily = new Map();
  for (const f of plated) {
    const fam = f.base_family?.code;
    if (!fam) continue;
    if (!byFamily.has(fam)) byFamily.set(fam, []);
    byFamily.get(fam).push(f);
  }
  const selection = [];
  // ONLY=FAMILY[,FAMILY] measures a subset (probing quantised near-neutral families); nothing is written.
  const only = process.env.ONLY ? new Set(process.env.ONLY.split(",")) : null;
  for (const [family, rows] of [...byFamily].sort(([a], [b]) => a.localeCompare(b))) {
    if (only && !only.has(family)) continue;
    const clean = rows.filter((f) => !measurements.get(f.cyc_code).glare);
    const preferred = clean.filter((f) => PREFERRED_SURFACES.has(f.surface?.code));
    // R2: glare-only families get no hue fit; their glare rows are rendered for the L* check only.
    const glareOnly = clean.length === 0;
    selection.push({ family, glareOnly, preferredSurfaces: preferred.length > 0, rows: glareOnly ? rows : preferred.length ? preferred : clean, all: rows });
  }

  const cal = await admin.from("finish_family_calibration").select("base_family_code, hue_shift_deg, chroma_scale, oxide_l");
  if (cal.error) throw new Error(cal.error.message);
  const applied = new Map(cal.data.map((c) => [c.base_family_code, c]));
  const previous = new Map();
  if (existsSync(OUT)) {
    for (const f of JSON.parse(readFileSync(OUT, "utf8")).families ?? []) {
      if (f.appliedHueShift != null) previous.set(f.family, { shift: f.appliedHueShift, error: f.hueError });
    }
  }

  const { metal } = await pickProducts(admin);
  const studioRow = plated.find((f) => f.cyc_code === STUDIO_CODE);
  const all = [...new Map([...selection.flatMap((s) => s.rows), studioRow].map((f) => [f.id, f])).values()];
  const staged = await stageProduct(admin, metal, {
    modelPath: `models/${metal.id}/e2e-family-fit-disc.obj`,
    modelBody: new Blob([discObj()], { type: "model/obj" }),
    finishIds: all.map((f) => f.id),
    defaultFinishId: all[0].id,
  });

  const results = [];
  let studio;
  try {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();
    const canvas = await openEditor(page, `${base}/designer-studio/editor/new?product=${metal.slug}`);

    await pickFinish(page, STUDIO_CODE);
    const s = await faceStats(await canvas.screenshot());
    const studioBase = rgb255ToLinear(hexToRgb255(studioRow.base_color_hex));
    studio = {
      code: STUDIO_CODE,
      axes: axesOf(studioRow),
      surroundLum: Math.round(s.lumP02),
      highlightLum: Math.round(s.lumP98),
      highlightTransfer: inverseNeutralToneMap(rgb255ToLinear(s.highlight)).map((p, c) => (studioBase[c] > 1e-6 ? p / studioBase[c] : 0)),
    };

    for (const group of selection) {
      const rows = [];
      for (const f of group.rows) {
        await pickFinish(page, f.cyc_code);
        const stats = await faceStats(await canvas.screenshot());
        const pre = inverseNeutralToneMap(rgb255ToLinear(stats.mean));
        // transfer against what the database rendered, not the TS table (they differ mid-fit)
        const baseNow = rgb255ToLinear(hexToRgb255(f.base_color_hex));
        rows.push({
          code: f.cyc_code,
          axes: axesOf(f),
          chartHex: measurements.get(f.cyc_code).hex_srgb,
          renderedHex: rgb255ToHex(stats.mean),
          renderedLab: linearToLab(rgb255ToLinear(stats.mean)).map((v) => +v.toFixed(3)),
          highlightL: +stats.lightnessP98.toFixed(2),
          transfer: pre.map((p, c) => (baseNow[c] > 1e-6 ? p / baseNow[c] : 0)),
        });
      }
      const chartMedian = medianLab(rows.map((r) => hexToLab(r.chartHex)));
      const renderedMedian = medianLab(rows.map((r) => r.renderedLab));
      const exempt = EXEMPT[group.family] ?? null;
      const entry = {
        family: group.family,
        rows: rows.length,
        glareOnly: group.glareOnly,
        preferredSurfaces: group.preferredSurfaces,
        exempt,
        codes: rows.map((r) => r.code),
        chartMedianLab: chartMedian.map((v) => +v.toFixed(2)),
        renderedMedianLab: renderedMedian.map((v) => +v.toFixed(2)),
        hueDiff: +hueDifference(hueOf(renderedMedian), hueOf(chartMedian)).toFixed(2),
        hueError: +signedHue(hueOf(chartMedian), hueOf(renderedMedian)).toFixed(3),
        appliedHueShift: Number(applied.get(group.family)?.hue_shift_deg ?? 0),
        appliedChromaScale: Number(applied.get(group.family)?.chroma_scale ?? 1),
        appliedOxideL: applied.get(group.family)?.oxide_l == null ? null : Number(applied.get(group.family).oxide_l),
        physicalL: +physicalLightness(group.family, rows).toFixed(2),
        highlightL: +median(rows.map((r) => r.highlightL)).toFixed(2),
        current: FAMILY_CALIBRATION[group.family] ?? null,
        samples: rows,
      };
      entry.lightnessDiff = +(renderedMedian[0] - entry.physicalL).toFixed(2);
      if (fit) {
        const hue = { hue_shift: 0, chroma_scale: 1 };
        if (!exempt && !group.glareOnly) {
          hue.hue_shift = stepHue(entry.appliedHueShift, entry.hueError, previous.get(group.family));
          if (group.family === "NICKEL") Object.assign(hue, fitNickelChroma(hue.hue_shift, studio));
        }
        const keep = group.family === "TIN" ? FAMILY_CALIBRATION.TIN.value : 1;
        entry.fit = { ...hue, value: keep, oxide_l: fitOxide(group.all, measurements) };
      }
      results.push(entry);
      console.log("FAMILY", JSON.stringify({ family: entry.family, rows: entry.rows, hueDiff: entry.hueDiff, dL: entry.lightnessDiff, highlightL: entry.highlightL, fit: entry.fit }));
    }
  } finally {
    await staged.restore();
  }

  if (only) return { studio: { surroundLum: studio.surroundLum, highlightLum: studio.highlightLum }, families: results.map(({ samples, ...r }) => r) };
  writeFileSync(OUT, JSON.stringify({ studio, families: results }, null, 2) + "\n");

  if (fit && apply) {
    const rows = results.map((r) => ({
      base_family_code: r.family,
      hue_shift_deg: r.fit.hue_shift,
      chroma_scale: r.fit.chroma_scale,
      value: r.fit.value,
      oxide_l: r.fit.oxide_l,
      rows_used: r.glareOnly || r.exempt ? 0 : r.rows,
      note: r.exempt ?? (r.glareOnly ? "only glare chart rows; no hue adjustment (R2)" : null),
    }));
    const up = await admin.from("finish_family_calibration").upsert(rows);
    if (up.error) throw new Error(up.error.message);
    const re = await admin.rpc("finish_recompute_materials");
    if (re.error) throw new Error(re.error.message);
  }
  return { families: results.length, studio, out: "reports/3d-family-fit.json" };
}
