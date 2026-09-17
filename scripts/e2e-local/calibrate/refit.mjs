// Emits the calibration as it was measured in reports/3d-family-fit.json —
// the applied values and their residuals — as the TS FAMILY_CALIBRATION block
// (metalReflectance.ts) and the SQL values list (the 3d migration). No
// rendering; run fit-families.mjs (without FIT) first so the residuals are
// measured at the applied values.
//   node scripts/e2e-local/calibrate/refit.mjs
import { readFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../lib/stack.mjs";

const { families } = JSON.parse(readFileSync(path.join(REPO_ROOT, "reports/3d-family-fit.json"), "utf8"));
const TIN_VALUE = 0.1432; // 3c chart-derived, kept (R4)

const rows = families.map((f) => {
  const hueFitted = !f.exempt && !f.glareOnly;
  return {
    family: f.family,
    hue_shift: f.appliedHueShift,
    chroma_scale: f.appliedChromaScale,
    value: f.family === "TIN" ? TIN_VALUE : 1,
    oxide_l: f.appliedOxideL,
    rows: hueFitted ? f.rows : 0,
    residual_hue: hueFitted ? f.hueDiff : null,
    residual_l: f.lightnessDiff,
    note: f.exempt ?? (f.glareOnly ? "only glare chart rows; no hue adjustment (R2)" : null),
  };
});

const sqlText = (v) => (v == null ? "null" : typeof v === "string" ? `'${v.replace(/'/g, "''")}'` : String(v));
console.log("/* BEGIN FAMILY_CALIBRATION (generated from the fit) */");
console.log("export const FAMILY_CALIBRATION: Record<string, FamilyCalibration> = {");
for (const r of rows) console.log(`  ${r.family}: { hue_shift: ${r.hue_shift}, chroma_scale: ${r.chroma_scale}, value: ${r.value}, oxide_l: ${r.oxide_l} },`);
console.log("};");
console.log("/* END FAMILY_CALIBRATION */\n");
console.log(
  rows
    .map((r) => `  (${[r.family, r.hue_shift, r.chroma_scale, r.value, r.oxide_l, r.rows, r.residual_hue, r.residual_l, r.note].map(sqlText).join(", ")})`)
    .join(",\n") + ";",
);
