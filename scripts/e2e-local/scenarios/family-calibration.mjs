// Phase 3c R4: every plated base family, rendered as flat discs through the
// editor under the procedural studio, matches the median of its glare-free
// chart swatches within ΔE2000 ≤ 8. Measurement lives in the fitting harness
// (scripts/e2e-local/calibrate/fit-families.mjs); this asserts on its result
// and refreshes reports/3c-family-fit.json.
import assert from "node:assert/strict";
import measure from "../calibrate/fit-families.mjs";
import { readFileSync } from "node:fs";
import path from "node:path";
import { REPO_ROOT } from "../lib/stack.mjs";

const LIMIT = 8;

export default async function (ctx) {
  delete process.env.FIT;
  await measure(ctx);
  const families = JSON.parse(readFileSync(path.join(REPO_ROOT, "reports/3c-family-fit.json"), "utf8"));
  assert.ok(families.length >= 15, `expected every plated family, got ${families.length}`);
  const over = families.filter((f) => f.measuredDeltaE > LIMIT);
  assert.equal(over.length, 0, `families over ΔE2000 ${LIMIT}: ${over.map((f) => `${f.family} ${f.measuredDeltaE}`).join(", ")}`);
  return Object.fromEntries(families.map((f) => [f.family, { rows: f.rows, deltaE2000: f.measuredDeltaE, glareFallback: f.glareFallback }]));
}
