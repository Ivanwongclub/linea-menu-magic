// Phase 3d R5: every plated base family, rendered as flat discs through the
// editor under the procedural studio (calibrate/fit-families.mjs measures and
// refreshes reports/3d-family-fit.json; this asserts on it):
//   - hue: rendered median hue within 8° of the R2 chart rows (families with
//     only glare rows, and the R4 exemptions, are not hue-fitted)
//   - lightness: rendered median L* within 5 of the physical L* (buffed layer),
//     and every rendered row's base colour at its metal's physical L*
//   - GOLD and LIGHT_GOLD highlight L* ≥ 70
//   - bright nickel (CYC-0001, calibrated) reaches the studio targets
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import measure, { OUT } from "../calibrate/fit-families.mjs";
import { FAMILY_CALIBRATION, linearToLab, platedLinear } from "../../../src/features/finishes/metalReflectance.ts";

const HUE_LIMIT = 8;
const L_LIMIT = 5;
const HIGHLIGHT_L = 70;

export default async function (ctx) {
  delete process.env.FIT;
  delete process.env.APPLY;
  delete process.env.ONLY;
  await measure(ctx);
  const { studio, families } = JSON.parse(readFileSync(OUT, "utf8"));
  assert.ok(families.length >= 15, `expected every plated family, got ${families.length}`);

  const hueFitted = families.filter((f) => !f.exempt && !f.glareOnly);
  const hueOver = hueFitted.filter((f) => f.hueDiff > HUE_LIMIT);
  assert.equal(hueOver.length, 0, `hue over ${HUE_LIMIT}°: ${hueOver.map((f) => `${f.family} ${f.hueDiff}`).join(", ")}`);

  const lOver = families.filter((f) => Math.abs(f.lightnessDiff) > L_LIMIT);
  assert.equal(lOver.length, 0, `L* more than ${L_LIMIT} from physical: ${lOver.map((f) => `${f.family} ${f.lightnessDiff}`).join(", ")}`);

  // R1 at the source: the calibration never moves a base colour's L* (8-bit hex rounding aside).
  const physical = Object.fromEntries(Object.entries(FAMILY_CALIBRATION).map(([k, c]) => [k, { ...c, hue_shift: 0, chroma_scale: 1 }]));
  for (const f of families) {
    for (const s of f.samples) {
      const stored = platedLinear(s.axes);
      const l = linearToLab(platedLinear(s.axes, physical))[0];
      assert.ok(Math.abs(linearToLab(stored)[0] - l) < 0.05, `${s.code}: base L* ${linearToLab(stored)[0].toFixed(2)} vs physical ${l.toFixed(2)}`);
    }
  }

  for (const family of ["GOLD", "LIGHT_GOLD"]) {
    const f = families.find((x) => x.family === family);
    assert.ok(f.highlightL >= HIGHLIGHT_L, `${family} highlight L* ${f.highlightL} should be ≥ ${HIGHLIGHT_L}`);
  }

  assert.ok(studio.surroundLum <= 0x50, `bright nickel surround ${studio.surroundLum} should be ≤ #505050`);
  assert.ok(studio.highlightLum >= 0xed, `bright nickel highlight ${studio.highlightLum} should be ≥ #EDEDED`);

  return {
    studio: { surroundLum: studio.surroundLum, highlightLum: studio.highlightLum },
    families: Object.fromEntries(
      families.map((f) => [f.family, { rows: f.rows, hueDiff: hueFitted.includes(f) ? f.hueDiff : null, lightnessDiff: f.lightnessDiff, highlightL: f.highlightL }]),
    ),
  };
}
