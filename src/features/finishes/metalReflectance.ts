/**
 * Plated-finish material model (Phases 3b, 3c, 3d and 4.0).
 *
 * The database is the source of truth — `finish_plated_material()` in
 * supabase/migrations/20260917230000_phase3d_hue_only_calibration.sql
 * (values: 20260918090000_phase3e_chroma_gated_calibration.sql; carried
 * finish items: 20260918100000_phase4_0_carried_finish_items.sql)
 * — and this module mirrors it so the numbers are readable in one place and
 * `render-calibration.mjs` can assert the two agree row for row. Change both
 * together; FAMILY_CALIBRATION must equal the `finish_family_calibration` seed.
 *
 * F0 source: Real-Time Rendering, 4th ed. (Akenine-Möller et al., 2018),
 * Table 9.2, linear RGB — itself from N. Hoffman, "Physics and Math of
 * Shading", SIGGRAPH 2015. Two references have no published F0:
 *   tin          no visible-range n,k for Sn in refractiveindex.info (its
 *                sets start at 730 nm) or physicallybased.info; neutral,
 *                with brightness taken from the WIN-CYC chart's own TIN
 *                swatch (CYC-0046, wincyc-swatch-measurements.csv) through
 *                the family calibration.
 *   black_nickel gun-metal plating: nickel's luminance × 0.18, neutral.
 */

export type LinearRGB = readonly [number, number, number];

export const METAL_F0 = {
  gold: [1.0, 0.782, 0.344],
  silver: [0.972, 0.96, 0.915],
  copper: [0.955, 0.638, 0.538],
  nickel: [0.66, 0.609, 0.526],
  brass: [0.91, 0.778, 0.423], // brass C260
  iron: [0.562, 0.565, 0.578], // iron / steel
  tin: [0.6, 0.6, 0.6], // chart-referenced, see header
  zinc: [0.664, 0.824, 0.85],
  aluminium: [0.913, 0.922, 0.924],
  black_nickel: [0.1105, 0.1105, 0.1105], // reference, see header
} as const satisfies Record<string, LinearRGB>;

export type Metal = keyof typeof METAL_F0;

/** The one remaining darkened variant (RUSTY_STEEL); antique families now use the oxide mix. */
export const ANTI_VARIANT = { saturation: 0.9, value: 0.18 } as const;

interface BaseRecipe {
  metal: Metal;
  blend?: { toward: Metal; t: number };
  anti?: boolean;
}

export const BASE_FAMILY: Record<string, BaseRecipe> = {
  NICKEL: { metal: "nickel" },
  GUN_METAL: { metal: "black_nickel" },
  GOLD: { metal: "gold" },
  LIGHT_GOLD: { metal: "gold", blend: { toward: "silver", t: 0.35 } },
  ROSE_GOLD: { metal: "gold", blend: { toward: "copper", t: 0.7 } }, // 4.0 R1: was 0.5
  BRASS: { metal: "brass" },
  ANTI_BRASS: { metal: "brass" },
  RED_COPPER: { metal: "copper" },
  ANTI_COPPER: { metal: "copper" },
  BLACK_COPPER: { metal: "copper" },
  TIN: { metal: "tin" },
  ANTI_SILVER: { metal: "silver" },
  ALLOY: { metal: "zinc" },
  STAINLESS_STEEL: { metal: "iron" },
  RUSTY_STEEL: { metal: "iron", anti: true }, // rust hue not modelled
};

/** Gun metal (R3): a slight cool bias on the black-nickel reference, and a roughness floor. */
export const GUN_METAL_COOL_BIAS: LinearRGB = [0.96, 1.0, 1.08];
export const GUN_METAL_ROUGHNESS_FLOOR = 0.15;

/** Antique two-tone (3c R2; oxide lightness 3d R3; buffed darkening 4.0 R2). */
export const TWO_TONE_TONES = new Set(["ANTI", "ANCIENT", "DEEP", "DARK"]);
export const TWO_TONE_FAMILIES = new Set(["ANTI_BRASS", "ANTI_COPPER", "ANTI_SILVER", "BLACK_COPPER"]);
export const TWO_TONE_BUFFED_ROUGHNESS = 0.3;
/** 4.0 R2: the two-tone buffed layer's L* (and chroma, in proportion) relative to its physical value. */
export const TWO_TONE_BUFFED_L_SCALE = 0.7;

export function isTwoTonePlated(axes: PlatedAxes): boolean {
  return (!!axes.tone && TWO_TONE_TONES.has(axes.tone)) || (!!axes.base_family && TWO_TONE_FAMILIES.has(axes.base_family));
}

/** Tone (non-antique) and tint: per-channel multipliers on linear RGB, tone then tint. */
export const OFFSETS: Record<string, LinearRGB> = {
  IMT: [0.95, 0.95, 0.92],
  LIGHT: [1.1, 1.1, 1.1],
  MEDIUM: [0.7, 0.7, 0.7],
  JAPAN: [0.92, 0.88, 0.8],
  COFFEE: [0.88, 0.72, 0.56],
  CHOCOLATE: [0.78, 0.6, 0.46],
  PINK: [1.06, 0.86, 0.9],
  ORANGE: [1.1, 0.84, 0.6],
  GUN_METAL: [0.72, 0.74, 0.78],
};

/**
 * Per-family calibration (Phase 3d, superseding 3c's saturation/value fit;
 * 3e: hue fitted only where the chart's median C* ≥ 7, otherwise physical).
 *
 *   hue_shift  degrees added to the CIELAB hue angle of the linear base
 *              colour (D65). L* is untouched, so the metal's reflectance —
 *              and its lightness under the studio — stays physical (R1).
 *   chroma_scale ≤ 1: chroma is never raised (R1); 1 for every family since
 *              3e. A rotation that leaves the sRGB gamut is pulled back by
 *              reducing chroma only.
 *   value      a linear scale before the rotation. 1 for every family except
 *              TIN, whose brightness is 3c's chart-derived reference (R4).
 *   oxide_l    two-tone rows: the oxide layer's L*, from the chart, floored at
 *              OXIDE_L_FLOOR (R3). Null → the 3c oxide (buffed × 0.25).
 */
export interface FamilyCalibration {
  hue_shift: number;
  chroma_scale: number;
  value: number;
  oxide_l: number | null;
}

export const OXIDE_L_FLOOR = 15;
/** 3c's oxide: buffed base × this, used where a family has no chart oxide L*. */
export const OXIDE_FACTOR = 0.25;

/** Per family (Phase 3d, chroma-gated in 3e) — see STATUS.md for which families are fitted. */
/* BEGIN FAMILY_CALIBRATION (generated from the fit) */
export const FAMILY_CALIBRATION: Record<string, FamilyCalibration> = {
  ALLOY: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: 15 },
  ANTI_BRASS: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: 15 },
  ANTI_COPPER: { hue_shift: -12.5, chroma_scale: 1, value: 1, oxide_l: 15 },
  ANTI_SILVER: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: 20.74 },
  BLACK_COPPER: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: 15 },
  BRASS: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: null },
  GOLD: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: 15 },
  GUN_METAL: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: 15 },
  LIGHT_GOLD: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: null },
  NICKEL: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: 15 },
  RED_COPPER: { hue_shift: -1.5, chroma_scale: 1, value: 1, oxide_l: null },
  ROSE_GOLD: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: null },
  RUSTY_STEEL: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: null },
  STAINLESS_STEEL: { hue_shift: 0, chroma_scale: 1, value: 1, oxide_l: null },
  TIN: { hue_shift: 0, chroma_scale: 1, value: 0.1432, oxide_l: 17.81 },
};
/* END FAMILY_CALIBRATION */

export const SURFACE: Record<string, { roughness: number; anisotropy: number }> = {
  BRIGHT: { roughness: 0.06, anisotropy: 0 },
  BRUSHED: { roughness: 0.35, anisotropy: 0.8 },
  CIRCLE_BRUSHED: { roughness: 0.35, anisotropy: 0.8 },
  MATT: { roughness: 0.55, anisotropy: 0 },
  SAND: { roughness: 0.7, anisotropy: 0 },
};

export const CLEARCOAT_EFFECTS = new Set(["ENAMEL_DIP"]);
export const CLEARCOAT = { clearcoat: 1, clearcoatRoughness: 0.1 };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function desaturateScale(c: LinearRGB, saturation: number, value: number): LinearRGB {
  const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return [(y + (c[0] - y) * saturation) * value, (y + (c[1] - y) * saturation) * value, (y + (c[2] - y) * saturation) * value];
}

export function linearToSrgbHex(c: LinearRGB): string {
  return (
    "#" +
    c
      .map((x) => {
        const v = clamp01(x);
        const s = v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
        return Math.round(s * 255)
          .toString(16)
          .padStart(2, "0");
      })
      .join("")
  ).toUpperCase();
}

export interface PlatedAxes {
  base_family: string | null;
  surface: string | null;
  tone: string | null;
  effect: string | null;
  tint: string | null;
}

export interface PlatedMaterial {
  base_color_hex: string;
  metalness: number;
  roughness: number;
  anisotropy: number;
  clearcoat: number;
  clearcoat_roughness: number;
  two_tone: boolean;
  /** Two-tone rows only; null otherwise. */
  oxide_color_hex: string | null;
}

/**
 * Physical linear base colour before the sRGB conversion, before the 4.0 R2
 * two-tone buffed darkening — the calibration harness fits against this, and
 * it's the reference `platedLinear` darkens from.
 */
export function physicalPlatedLinear(axes: PlatedAxes, calibration: Record<string, FamilyCalibration> = FAMILY_CALIBRATION): LinearRGB {
  const recipe = BASE_FAMILY[axes.base_family ?? ""] ?? { metal: "nickel" as Metal };
  let c: LinearRGB = METAL_F0[recipe.metal];
  if (recipe.blend) {
    const b = METAL_F0[recipe.blend.toward];
    const t = recipe.blend.t;
    c = [c[0] + (b[0] - c[0]) * t, c[1] + (b[1] - c[1]) * t, c[2] + (b[2] - c[2]) * t];
  }
  if (recipe.anti) c = desaturateScale(c, ANTI_VARIANT.saturation, ANTI_VARIANT.value);
  if (axes.base_family === "GUN_METAL") c = [c[0] * GUN_METAL_COOL_BIAS[0], c[1] * GUN_METAL_COOL_BIAS[1], c[2] * GUN_METAL_COOL_BIAS[2]];
  const tone = axes.tone && !TWO_TONE_TONES.has(axes.tone) ? axes.tone : null;
  for (const code of [tone, axes.tint]) {
    const o = code ? OFFSETS[code] : undefined;
    if (o) c = [c[0] * o[0], c[1] * o[1], c[2] * o[2]];
  }
  const cal = calibration[axes.base_family ?? ""];
  if (cal) {
    if (cal.value !== 1) c = [c[0] * cal.value, c[1] * cal.value, c[2] * cal.value];
    if (cal.hue_shift !== 0 || cal.chroma_scale !== 1) {
      const [l, a, b] = linearToLab(c);
      const h = Math.atan2(b, a) + (cal.hue_shift * Math.PI) / 180;
      const chroma = Math.sqrt(a * a + b * b) * cal.chroma_scale;
      c = inGamutAtChroma(l, chroma, h);
    }
  }
  return c;
}

/**
 * Linear base colour before the sRGB conversion (stored `base_color_hex`).
 * Two-tone rows darken to `TWO_TONE_BUFFED_L_SCALE` × their physical L*, with
 * chroma scaled in the same proportion and hue kept (4.0 R2).
 */
export function platedLinear(axes: PlatedAxes, calibration: Record<string, FamilyCalibration> = FAMILY_CALIBRATION): LinearRGB {
  const c = physicalPlatedLinear(axes, calibration);
  if (!isTwoTonePlated(axes)) return c;
  const [l, a, b] = linearToLab(c);
  return inGamutAtChroma(l * TWO_TONE_BUFFED_L_SCALE, Math.sqrt(a * a + b * b) * TWO_TONE_BUFFED_L_SCALE, Math.atan2(b, a));
}

/** Linear base colour of the oxide layer of a two-tone row (R3). */
export function oxideLinear(axes: PlatedAxes, calibration: Record<string, FamilyCalibration> = FAMILY_CALIBRATION): LinearRGB {
  const buffed = platedLinear(axes, calibration);
  const oxideL = calibration[axes.base_family ?? ""]?.oxide_l;
  if (oxideL == null) return [buffed[0] * OXIDE_FACTOR, buffed[1] * OXIDE_FACTOR, buffed[2] * OXIDE_FACTOR];
  const [l, a, b] = linearToLab(buffed);
  const target = Math.max(OXIDE_L_FLOOR, oxideL);
  // Chroma scales with lightness, as the 3c oxide (a linear scale) did.
  const chroma = l > 0 ? (Math.sqrt(a * a + b * b) * target) / l : 0;
  return inGamutAtChroma(target, chroma, Math.atan2(b, a));
}

/* CIELAB (D65), the same matrices as scripts/e2e-local/lib/colour.mjs and the SQL mirror. */
const labF = (t: number) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
const labFInv = (f: number) => (f > 6 / 29 ? f * f * f : (116 * f - 16) / (24389 / 27));

export function linearToLab(c: LinearRGB): LinearRGB {
  const x = 0.4124564 * c[0] + 0.3575761 * c[1] + 0.1804375 * c[2];
  const y = 0.2126729 * c[0] + 0.7151522 * c[1] + 0.072175 * c[2];
  const z = 0.0193339 * c[0] + 0.119192 * c[1] + 0.9503041 * c[2];
  const fx = labF(x / 0.95047);
  const fy = labF(y);
  const fz = labF(z / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function labToLinear([l, a, b]: LinearRGB): LinearRGB {
  const fy = (l + 16) / 116;
  const x = labFInv(fy + a / 500) * 0.95047;
  const y = labFInv(fy);
  const z = labFInv(fy - b / 200) * 1.08883;
  return [
    3.2404542 * x - 1.5371385 * y - 0.4985314 * z,
    -0.969266 * x + 1.8760108 * y + 0.041556 * z,
    0.0556434 * x - 0.2040259 * y + 1.0572252 * z,
  ];
}

const inGamut = (c: LinearRGB) => c.every((v) => v >= 0 && v <= 1);

/** L*, hue fixed; the largest chroma ≤ `chroma` that stays in gamut (20-step bisection). */
function inGamutAtChroma(l: number, chroma: number, h: number): LinearRGB {
  const at = (k: number) => labToLinear([l, chroma * k * Math.cos(h), chroma * k * Math.sin(h)]);
  const full = at(1);
  if (inGamut(full)) return full;
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 20; i++) {
    const mid = (lo + hi) / 2;
    if (inGamut(at(mid))) lo = mid;
    else hi = mid;
  }
  return at(lo);
}

/** Plated finishes only (coating null). Unknown base families fall back to nickel. */
export function derivePlatedMaterial(axes: PlatedAxes, calibration?: Record<string, FamilyCalibration>): PlatedMaterial {
  const twoTone = isTwoTonePlated(axes);
  const surface = SURFACE[axes.surface ?? "BRIGHT"] ?? SURFACE.BRIGHT;
  let roughness = surface.roughness;
  if (twoTone && axes.surface == null) roughness = TWO_TONE_BUFFED_ROUGHNESS;
  if (axes.base_family === "GUN_METAL") roughness = Math.max(roughness, GUN_METAL_ROUGHNESS_FLOOR);
  const coated = !!axes.effect && CLEARCOAT_EFFECTS.has(axes.effect);
  return {
    base_color_hex: linearToSrgbHex(platedLinear(axes, calibration)),
    metalness: 1,
    roughness,
    anisotropy: surface.anisotropy,
    clearcoat: coated ? CLEARCOAT.clearcoat : 0,
    clearcoat_roughness: coated ? CLEARCOAT.clearcoatRoughness : 0,
    two_tone: twoTone,
    oxide_color_hex: twoTone ? linearToSrgbHex(oxideLinear(axes, calibration)) : null,
  };
}
