// Per-family calibration of plated finishes against the WIN-CYC chart
// (Phase 3c R4). Run through the harness:
//
//   npm run e2e:run -- calibrate/fit-families.mjs
//
// For every plated base family it renders each chart row whose photo has no
// glare (families with none fall back to their glare rows, flagged) as a
// flat 15mm disc through the real editor route under the procedural studio,
// takes the face median, and compares the family's median Lab to the chart's
// median Lab with CIEDE2000.
//
// FIT=1 also solves each family's saturation / value / R,B offsets: the
// rendered pre-tone-map radiance is linear in the base colour, so each row's
// transfer A = inverseNeutral(rendered) / base is measured once and the
// candidate calibration is predicted without re-rendering. Writes
// reports/3c-family-fit.json; apply it with the migration generator, then run
// again without FIT to measure the real residuals.
import { writeFileSync } from "node:fs";
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
  rgb255ToLinear,
  linearToRgb255,
  linearToLab,
  deltaE2000,
  medianLab,
  neutralToneMap,
  inverseNeutralToneMap,
  rgb255ToHex,
} from "../lib/colour.mjs";
import { platedLinear, FAMILY_CALIBRATION } from "../../../src/features/finishes/metalReflectance.ts";

const OUT = path.join(REPO_ROOT, "reports/3c-family-fit.json");

export function predictLab(row, calibration) {
  const base = platedLinear(row.axes, calibration);
  const pre = row.transfer.map((a, c) => a * base[c]);
  return linearToLab(neutralToneMap(pre));
}

export function familyResidual(rows, calibration) {
  const rendered = medianLab(rows.map((r) => predictLab(r, calibration)));
  const chart = medianLab(rows.map((r) => hexToLab(r.chartHex)));
  return deltaE2000(rendered, chart);
}

/**
 * R4 asks for ΔE2000 ≤ 8, not the minimum. The chart photos are mirror
 * plates in a dark room, so an unconstrained fit reaches ΔE ≈ 1 by greying
 * gold and brass out entirely. Instead: among calibrations whose predicted
 * residual is within TARGET (margin under 8 for prediction error), keep the
 * metal's own hue — saturation and offsets as close to 1 as possible — and
 * only then prefer the smaller residual. Value is free.
 */
export const TARGET = 6;

export function fitFamily(family, rows) {
  const withCal = (s, v, or, ob) => ({ ...FAMILY_CALIBRATION, [family]: { saturation: s, value: v, offset: [or, 1, ob] } });
  const departure = (s, or, ob) => 3 * Math.abs(s - 1) + Math.abs(Math.log(or)) + Math.abs(Math.log(ob));
  let best = null;
  let fallback = null;
  const consider = (s, v, or, ob) => {
    const de = familyResidual(rows, withCal(s, v, or, ob));
    const cand = { s, v, or, ob, de, dep: departure(s, or, ob) };
    if (!fallback || de < fallback.de) fallback = cand;
    if (de <= TARGET && (!best || cand.dep < best.dep - 1e-9 || (Math.abs(cand.dep - best.dep) < 1e-9 && de < best.de))) best = cand;
  };
  const values = Array.from({ length: 121 }, (_, k) => +(0.01 * Math.pow(300, k / 120)).toFixed(4));
  for (let s = 1.0; s >= -0.0001; s -= 0.05) for (const v of values) consider(+s.toFixed(2), v, 1, 1);
  const seed = best ?? fallback;
  for (let s = seed.s; s >= -0.0001; s -= 0.05) {
    for (let or = 0.8; or <= 1.2501; or += 0.05) for (let ob = 0.8; ob <= 1.2501; ob += 0.05) for (const v of values) {
      if (Math.abs(Math.log(v / seed.v)) > 0.6) continue;
      consider(+s.toFixed(2), v, +or.toFixed(2), +ob.toFixed(2));
    }
    if (best && best.s >= s) break;
  }
  return best ?? fallback;
}

export default async function ({ page, base, admin, h }) {
  const fit = process.env.FIT === "1";
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
  for (const [family, rows] of byFamily) {
    const clean = rows.filter((f) => !measurements.get(f.cyc_code).glare);
    selection.push({ family, glareFallback: clean.length === 0, rows: clean.length ? clean : rows });
  }

  const { metal } = await pickProducts(admin);
  const all = selection.flatMap((s) => s.rows);
  const staged = await stageProduct(admin, metal, {
    modelPath: `models/${metal.id}/e2e-family-fit-disc.obj`,
    modelBody: new Blob([discObj()], { type: "model/obj" }),
    finishIds: all.map((f) => f.id),
    defaultFinishId: all[0].id,
  });

  const results = [];
  try {
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();
    const canvas = await openEditor(page, `${base}/designer-studio/editor/new?product=${metal.slug}`);

    for (const group of selection) {
      const rows = [];
      for (const f of group.rows) {
        await pickFinish(page, f.cyc_code);
        const stats = await faceStats(await canvas.screenshot());
        const renderedLin = rgb255ToLinear(stats.median);
        const pre = inverseNeutralToneMap(renderedLin);
        const baseNow = platedLinear(axesOf(f));
        rows.push({
          code: f.cyc_code,
          axes: axesOf(f),
          chartHex: measurements.get(f.cyc_code).hex_srgb,
          renderedHex: rgb255ToHex(stats.median),
          transfer: pre.map((p, c) => (baseNow[c] > 1e-6 ? p / baseNow[c] : 0)),
        });
      }
      const chartMedian = medianLab(rows.map((r) => hexToLab(r.chartHex)));
      const renderedMedian = medianLab(rows.map((r) => hexToLab(r.renderedHex)));
      const measured = deltaE2000(renderedMedian, chartMedian);
      const entry = {
        family: group.family,
        rows: rows.length,
        glareFallback: group.glareFallback,
        codes: rows.map((r) => r.code),
        measuredDeltaE: +measured.toFixed(2),
        chartMedianLab: chartMedian.map((v) => +v.toFixed(2)),
        renderedMedianLab: renderedMedian.map((v) => +v.toFixed(2)),
        current: FAMILY_CALIBRATION[group.family],
        samples: rows,
      };
      if (fit) {
        const best = fitFamily(group.family, rows);
        entry.fit = { saturation: best.s, value: best.v, offset: [best.or, 1, best.ob], predictedDeltaE: +best.de.toFixed(2), withinTarget: best.de <= TARGET };
        // sanity: the model reproduces what was measured at the current calibration
        entry.modelCheckDeltaE = +familyResidual(rows, FAMILY_CALIBRATION).toFixed(2);
      }
      results.push(entry);
      console.log("FAMILY", JSON.stringify({ family: entry.family, rows: entry.rows, measured: entry.measuredDeltaE, fit: entry.fit, modelCheck: entry.modelCheckDeltaE }));
    }
  } finally {
    await staged.restore();
  }

  writeFileSync(OUT, JSON.stringify(results, null, 2) + "\n");
  return { families: results.length, worst: Math.max(...results.map((r) => r.measuredDeltaE)), out: "reports/3c-family-fit.json" };
}
