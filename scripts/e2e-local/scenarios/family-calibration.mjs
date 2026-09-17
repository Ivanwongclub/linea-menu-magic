// Phase 3d R5, gated in 3e, darkening added in 4.0: every plated base family,
// rendered as flat discs through the editor under the procedural studio
// (calibrate/fit-families.mjs measures and refreshes reports/3e-family-fit.json;
// this asserts on it):
//   - hue, fitted families (chart C* ≥ 7): rendered median hue within 8° of
//     the R2 chart rows
//   - hue, physical families: no shift, chroma scale 1, and the rendered hue
//     within 1° of the physical prediction (where the render has hue at all)
//   - lightness: rendered median L* within 5 of the physical L* (buffed layer),
//     two-tone rows' base colour L* = 0.7 × physical (4.0 R2), non-two-tone
//     rows' base colour L* equal to physical, and the oxide layer's target L*
//     unaffected by the buffed darkening
//   - GOLD and LIGHT_GOLD highlight L* ≥ 70
//   - bright nickel (CYC-0001, calibrated) reaches the studio targets
//   - ROSE_GOLD blends gold→copper at t = 0.7 (4.0 R1), hex parity with the
//     stored rows
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import measure, { OUT } from "../calibrate/fit-families.mjs";
import { FINISH_AXES_SELECT, axesOf } from "../lib/calibration.mjs";
import {
  FAMILY_CALIBRATION,
  OXIDE_L_FLOOR,
  TWO_TONE_BUFFED_L_SCALE,
  BASE_FAMILY,
  linearToLab,
  platedLinear,
  physicalPlatedLinear,
  oxideLinear,
  isTwoTonePlated,
  derivePlatedMaterial,
} from "../../../src/features/finishes/metalReflectance.ts";

const HUE_LIMIT = 8;
const PHYSICAL_HUE_LIMIT = 1;
/** Below this rendered C* (tin renders C* 0) a hue angle is undefined. */
const HUE_DEFINED_C = 1;
const L_LIMIT = 5;
const HIGHLIGHT_L = 70;
const BUFFED_L_TOLERANCE = 0.05;
const OXIDE_L_TOLERANCE = 0.1;

export default async function (ctx) {
  delete process.env.FIT;
  delete process.env.APPLY;
  delete process.env.ONLY;
  await measure(ctx);
  const { studio, families } = JSON.parse(readFileSync(OUT, "utf8"));
  assert.ok(families.length >= 15, `expected every plated family, got ${families.length}`);

  const hueFitted = families.filter((f) => f.hueFitted);
  const hueOver = hueFitted.filter((f) => f.hueDiff > HUE_LIMIT);
  assert.equal(hueOver.length, 0, `hue over ${HUE_LIMIT}°: ${hueOver.map((f) => `${f.family} ${f.hueDiff}`).join(", ")}`);

  const physical = families.filter((f) => !f.hueFitted);
  for (const f of physical) {
    assert.equal(f.appliedHueShift, 0, `${f.family} (chart C* ${f.chartChroma}) should have no hue shift`);
    assert.equal(f.appliedChromaScale, 1, `${f.family} should keep physical chroma`);
  }
  const drift = physical.filter((f) => f.renderedChroma >= HUE_DEFINED_C && f.physicalHueDiff > PHYSICAL_HUE_LIMIT);
  assert.equal(drift.length, 0, `physical families off physical hue: ${drift.map((f) => `${f.family} ${f.physicalHueDiff}`).join(", ")}`);

  const lOver = families.filter((f) => Math.abs(f.lightnessDiff) > L_LIMIT);
  assert.equal(lOver.length, 0, `L* more than ${L_LIMIT} from physical: ${lOver.map((f) => `${f.family} ${f.lightnessDiff}`).join(", ")}`);

  // R1 at the source: the hue rotation never moves a base colour's L* (8-bit
  // hex rounding aside). 4.0 R2: two-tone rows darken to 0.7 × that physical
  // L*, chroma scaled in proportion; non-two-tone rows stay equal to it. The
  // oxide layer's target L* is unaffected by the buffed darkening.
  const unrotated = Object.fromEntries(Object.entries(FAMILY_CALIBRATION).map(([k, c]) => [k, { ...c, hue_shift: 0, chroma_scale: 1 }]));
  for (const f of families) {
    for (const s of f.samples) {
      const storedL = linearToLab(platedLinear(s.axes))[0];
      const physicalL = linearToLab(physicalPlatedLinear(s.axes, unrotated))[0];
      const twoTone = isTwoTonePlated(s.axes);
      const expectedL = twoTone ? physicalL * TWO_TONE_BUFFED_L_SCALE : physicalL;
      assert.ok(
        Math.abs(storedL - expectedL) < BUFFED_L_TOLERANCE,
        `${s.code}: base L* ${storedL.toFixed(2)} vs expected ${expectedL.toFixed(2)} (physical ${physicalL.toFixed(2)}, twoTone ${twoTone})`,
      );

      if (twoTone) {
        const cal = FAMILY_CALIBRATION[s.axes.base_family ?? ""];
        if (cal?.oxide_l != null) {
          const oxideL = linearToLab(oxideLinear(s.axes))[0];
          const target = Math.max(OXIDE_L_FLOOR, cal.oxide_l);
          assert.ok(
            Math.abs(oxideL - target) < OXIDE_L_TOLERANCE,
            `${s.code}: oxide L* ${oxideL.toFixed(2)} should still hit its calibration target ${target} (4.0: buffed darkening must not move it)`,
          );
        }
      }
    }
  }

  // R1: ROSE_GOLD blends gold toward copper at t = 0.7 (was 0.5), and the
  // stored rows match the TS mirror exactly.
  assert.equal(BASE_FAMILY.ROSE_GOLD.blend?.toward, "copper");
  assert.equal(BASE_FAMILY.ROSE_GOLD.blend?.t, 0.7, "ROSE_GOLD should blend toward copper at t = 0.7");
  {
    const { admin } = ctx;
    const { data: roseGold, error } = await admin.from("finishes").select(FINISH_AXES_SELECT).is("coating_id", null);
    if (error) throw new Error(error.message);
    const rows = roseGold.filter((f) => f.base_family?.code === "ROSE_GOLD");
    assert.ok(rows.length > 0, "expected at least one ROSE_GOLD row");
    for (const row of rows) {
      const expected = derivePlatedMaterial(axesOf(row));
      assert.equal(row.base_color_hex, expected.base_color_hex, `${row.cyc_code}: ROSE_GOLD base colour should match the TS mirror at t 0.7`);
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
      families.map((f) => [
        f.family,
        { fitted: f.hueFitted, chartChroma: f.chartChroma, hueDiff: f.hueFitted ? f.hueDiff : null, physicalHueDiff: f.hueFitted ? null : f.physicalHueDiff, lightnessDiff: f.lightnessDiff, highlightL: f.highlightL },
      ]),
    ),
  };
}
