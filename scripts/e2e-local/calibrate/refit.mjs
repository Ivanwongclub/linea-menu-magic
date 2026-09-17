// Offline refit from the transfers recorded in reports/3c-family-fit.json —
// no rendering. Prints the calibration table the migration generator takes.
//   node scripts/e2e-local/calibrate/refit.mjs > calibration.json
import { readFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../lib/stack.mjs";
import { fitFamily } from "./fit-families.mjs";

const fit = JSON.parse(readFileSync(path.join(REPO_ROOT, "reports/3c-family-fit.json"), "utf8"));
const out = fit.map((f) => {
  const best = fitFamily(f.family, f.samples);
  process.stderr.write(`${f.family.padEnd(16)} s=${best.s} v=${best.v} off=[${best.or},1,${best.ob}] predicted ΔE=${best.de.toFixed(2)}\n`);
  return {
    family: f.family,
    saturation: best.s,
    value: best.v,
    offset: [best.or, 1, best.ob],
    rows: f.rows,
    residual: null,
    note: f.glareFallback ? "no glare-free chart rows; fitted to glare rows" : null,
  };
});
process.stdout.write(JSON.stringify(out, null, 1) + "\n");
