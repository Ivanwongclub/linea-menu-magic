/**
 * Plated-finish material model from measured metal reflectance (Phase 3b).
 *
 * The database is the source of truth — `finish_plated_material()` in
 * supabase/migrations/20260917180000_phase3b_metal_reflectance.sql holds the
 * same tables and writes `finishes.base_color_hex` / roughness / anisotropy /
 * clearcoat. This module mirrors it so the numbers are readable in one place
 * and so `render-calibration.mjs` can assert the two agree row for row.
 * Change both together.
 *
 * F0 source: Real-Time Rendering, 4th ed. (Akenine-Möller et al., 2018),
 * Table 9.2 "Specular colors (F0) of metals", linear RGB — itself from
 * N. Hoffman, "Physics and Math of Shading", SIGGRAPH 2015 course notes.
 * Tin is not in that table: its value below is a placeholder (platinum's F0,
 * a neutral grey of comparable brightness) until a measured value is sourced.
 */

export type LinearRGB = readonly [number, number, number];

export const METAL_F0 = {
  gold: [1.0, 0.782, 0.344],
  silver: [0.972, 0.96, 0.915],
  copper: [0.955, 0.638, 0.538],
  nickel: [0.66, 0.609, 0.526],
  brass: [0.91, 0.778, 0.423], // brass C260
  iron: [0.562, 0.565, 0.578], // iron / steel
  tin: [0.673, 0.637, 0.585], // PLACEHOLDER — platinum's F0, see header
  zinc: [0.664, 0.824, 0.85],
  aluminium: [0.913, 0.922, 0.924],
} as const satisfies Record<string, LinearRGB>;

export type Metal = keyof typeof METAL_F0;

/**
 * Darkened-and-desaturated variants: desaturate toward Rec.709 luminance,
 * then scale. Factors set against the chart's photographed hex_approx for a
 * bright-surface reference of each: anti brass CYC-0057 #6B6247 (≈ 0.18 ×
 * brass F0, near-full saturation), gun metal CYC-0004 #4C5155 (≈ 0.13 ×
 * nickel F0, neutral). Provisional until Phase 3c's measured swatches.
 */
export const VARIANT = {
  anti: { saturation: 0.9, value: 0.18 },
  black: { saturation: 0, value: 0.13 },
} as const;

type Variant = keyof typeof VARIANT;

interface BaseRecipe {
  metal: Metal;
  /** Blend toward a second metal in linear RGB, `t` of the way. */
  blend?: { toward: Metal; t: number };
  variant?: Variant;
}

export const BASE_FAMILY: Record<string, BaseRecipe> = {
  NICKEL: { metal: "nickel" },
  GUN_METAL: { metal: "nickel", variant: "black" }, // gun metal = black nickel plating
  GOLD: { metal: "gold" },
  LIGHT_GOLD: { metal: "gold", blend: { toward: "silver", t: 0.35 } },
  ROSE_GOLD: { metal: "gold", blend: { toward: "copper", t: 0.5 } },
  BRASS: { metal: "brass" },
  ANTI_BRASS: { metal: "brass", variant: "anti" },
  RED_COPPER: { metal: "copper" },
  ANTI_COPPER: { metal: "copper", variant: "anti" },
  BLACK_COPPER: { metal: "copper", variant: "black" },
  TIN: { metal: "tin" },
  ANTI_SILVER: { metal: "silver", variant: "anti" },
  ALLOY: { metal: "zinc" }, // zinc die-cast alloy
  STAINLESS_STEEL: { metal: "iron" },
  RUSTY_STEEL: { metal: "iron", variant: "anti" }, // rust hue not modelled
};

/**
 * Tone and tint: fixed per-channel multipliers on linear RGB, applied after
 * the base. ANTI / ANCIENT tones sit on the same scale as the anti variant.
 * Provisional until Phase 3c.
 */
export const OFFSETS: Record<string, LinearRGB> = {
  // tone
  IMT: [0.95, 0.95, 0.92],
  DARK: [0.4, 0.4, 0.4],
  LIGHT: [1.1, 1.1, 1.1],
  MEDIUM: [0.7, 0.7, 0.7],
  DEEP: [0.55, 0.55, 0.55],
  ANTI: [0.2, 0.19, 0.17],
  ANCIENT: [0.17, 0.15, 0.12],
  // tint
  JAPAN: [0.92, 0.88, 0.8],
  COFFEE: [0.88, 0.72, 0.56],
  CHOCOLATE: [0.78, 0.6, 0.46],
  PINK: [1.06, 0.86, 0.9],
  ORANGE: [1.1, 0.84, 0.6],
  GUN_METAL: [0.72, 0.74, 0.78],
};

export const SURFACE: Record<string, { roughness: number; anisotropy: number }> = {
  BRIGHT: { roughness: 0.06, anisotropy: 0 },
  BRUSHED: { roughness: 0.35, anisotropy: 0.8 },
  CIRCLE_BRUSHED: { roughness: 0.35, anisotropy: 0.8 },
  MATT: { roughness: 0.55, anisotropy: 0 },
  SAND: { roughness: 0.7, anisotropy: 0 },
};

/** Effects that put a clear lacquer / enamel layer over the plating. */
export const CLEARCOAT_EFFECTS = new Set(["ENAMEL_DIP"]);
export const CLEARCOAT = { clearcoat: 1, clearcoatRoughness: 0.1 };

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

function applyVariant(c: LinearRGB, v: Variant): LinearRGB {
  const { saturation, value } = VARIANT[v];
  const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  return [0, 1, 2].map((i) => (y + (c[i] - y) * saturation) * value) as unknown as LinearRGB;
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
}

/** Plated finishes only (coating null). Unknown base families fall back to nickel. */
export function derivePlatedMaterial(axes: PlatedAxes): PlatedMaterial {
  const recipe = BASE_FAMILY[axes.base_family ?? ""] ?? { metal: "nickel" };
  let c: LinearRGB = METAL_F0[recipe.metal];
  if (recipe.blend) {
    const b = METAL_F0[recipe.blend.toward];
    const t = recipe.blend.t;
    c = [0, 1, 2].map((i) => c[i] + (b[i] - c[i]) * t) as unknown as LinearRGB;
  }
  if (recipe.variant) c = applyVariant(c, recipe.variant);
  for (const code of [axes.tone, axes.tint]) {
    const o = code ? OFFSETS[code] : undefined;
    if (o) c = [c[0] * o[0], c[1] * o[1], c[2] * o[2]];
  }
  const surface = SURFACE[axes.surface ?? "BRIGHT"] ?? SURFACE.BRIGHT;
  const coated = !!axes.effect && CLEARCOAT_EFFECTS.has(axes.effect);
  return {
    base_color_hex: linearToSrgbHex(c),
    metalness: 1,
    roughness: surface.roughness,
    anisotropy: surface.anisotropy,
    clearcoat: coated ? CLEARCOAT.clearcoat : 0,
    clearcoat_roughness: coated ? CLEARCOAT.clearcoatRoughness : 0,
  };
}
