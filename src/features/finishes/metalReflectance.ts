/**
 * Plated-finish material model (Phases 3b and 3c).
 *
 * The database is the source of truth — `finish_plated_material()` in
 * supabase/migrations/20260917210000_phase3c_painted_antique_calibration.sql
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
  ROSE_GOLD: { metal: "gold", blend: { toward: "copper", t: 0.5 } },
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

/** Antique two-tone (R2). */
export const TWO_TONE_TONES = new Set(["ANTI", "ANCIENT", "DEEP", "DARK"]);
export const TWO_TONE_FAMILIES = new Set(["ANTI_BRASS", "ANTI_COPPER", "ANTI_SILVER", "BLACK_COPPER"]);
export const TWO_TONE_BUFFED_ROUGHNESS = 0.3;

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

export interface FamilyCalibration {
  saturation: number;
  value: number;
  offset: LinearRGB;
}

/** Fitted per family (Phase 3c R4) — see STATUS.md for rows used and residuals. */
/* BEGIN FAMILY_CALIBRATION (generated from the fit) */
export const FAMILY_CALIBRATION: Record<string, FamilyCalibration> = {
  LIGHT_GOLD: { saturation: 0.4, value: 0.1242, offset: [1, 1, 1] },
  ALLOY: { saturation: 0.9, value: 0.0609, offset: [1, 1, 1] },
  GOLD: { saturation: 0.5, value: 0.0235, offset: [1, 1, 1] },
  TIN: { saturation: 1, value: 0.1432, offset: [1, 1, 1] },
  GUN_METAL: { saturation: 1, value: 0.2786, offset: [1, 1, 1] },
  NICKEL: { saturation: 0.2, value: 0.1077, offset: [1, 1, 1] },
  ROSE_GOLD: { saturation: 0.3, value: 0.1077, offset: [1, 1, 1] },
  BRASS: { saturation: 0.25, value: 0.0934, offset: [1, 1, 1] },
  ANTI_BRASS: { saturation: 1, value: 0.0153, offset: [1, 1, 1] },
  ANTI_SILVER: { saturation: 1, value: 0.089, offset: [1, 1, 1] },
  STAINLESS_STEEL: { saturation: 1, value: 0.1816, offset: [1, 1, 1] },
  RUSTY_STEEL: { saturation: 1, value: 0.3064, offset: [1, 1, 1] },
  BLACK_COPPER: { saturation: 0, value: 0.0638, offset: [1, 1, 1.05] },
  RED_COPPER: { saturation: 0.9, value: 0.058, offset: [1, 1, 1] },
  ANTI_COPPER: { saturation: 1, value: 0.01, offset: [1, 1, 1] },
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
}

/** Linear base colour before the sRGB conversion — the calibration harness fits against this. */
export function platedLinear(axes: PlatedAxes, calibration: Record<string, FamilyCalibration> = FAMILY_CALIBRATION): LinearRGB {
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
    const d = desaturateScale(c, cal.saturation, cal.value);
    c = [d[0] * cal.offset[0], d[1] * cal.offset[1], d[2] * cal.offset[2]];
  }
  return c;
}

/** Plated finishes only (coating null). Unknown base families fall back to nickel. */
export function derivePlatedMaterial(axes: PlatedAxes, calibration?: Record<string, FamilyCalibration>): PlatedMaterial {
  const twoTone = (!!axes.tone && TWO_TONE_TONES.has(axes.tone)) || (!!axes.base_family && TWO_TONE_FAMILIES.has(axes.base_family));
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
  };
}
