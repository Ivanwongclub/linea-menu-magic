/**
 * Finish swatch renderer — a standalone module.
 *
 * Renders a finish from the three-parameter material model on `finishes`
 * (metalness, roughness, anisotropy — derived from the chart axes by
 * 20260904150000_finish_material_params.sql) plus `hex_approx`, as a
 * deterministic SVG. Used by the admin picker and finish manager; M4/M5 and
 * the 3D editor's PBR presets read the same three columns.
 *
 * What it is NOT: a flat hex block, or a "shiny gradient". Measured against
 * the real chart photos, polished nickel reads #41403E — near-black —
 * because a mirror reflects the room; only its one hard highlight is bright.
 * What separates finishes is contrast behaviour, not average brightness:
 *
 *   mirror   roughness <= 0.15, metal     dark body, one narrow hard highlight
 *   brushed  anisotropy >= 0.5            highlight smeared into a directional band + streaks
 *   matt     roughness >= 0.6             near-flat field, no highlight point
 *   sand     roughness >= 0.9, metal      fine stochastic grain, no highlight
 *   soft     everything between           broad soft highlight sized by roughness
 *   gloss    roughness <= 0.15, non-metal painted body with a white highlight
 *
 * hex_approx is the material's colour (albedo), not the photographed value;
 * the body tone is derived from it through the model above.
 */

export interface FinishMaterial {
  hex_approx: string | null;
  metalness: number;
  roughness: number;
  anisotropy: number;
  /** A photographed swatch wins over the render when present. */
  swatch_url?: string | null;
}

export type SurfaceKind = "mirror" | "brushed" | "matt" | "sand" | "soft" | "gloss";

type RGB = [number, number, number];

const clamp01 = (n: number) => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};

function hexToRgb(hex: string | null): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return [154, 154, 154]; // neutral when no colour is recorded
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgbToHex = ([r, g, b]: RGB) =>
  "#" + [r, g, b].map((c) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, "0")).join("");
const scale = ([r, g, b]: RGB, k: number): RGB => [r * k, g * k, b * k];
const mix = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const WHITE: RGB = [255, 255, 255];

/** Which branch of the renderer contract a material falls into. */
export function describeFinishSurface(m: FinishMaterial): SurfaceKind {
  const metal = clamp01(m.metalness);
  const rough = clamp01(m.roughness);
  const aniso = clamp01(m.anisotropy);
  if (rough >= 0.9 && metal >= 0.5) return "sand";
  if (aniso >= 0.5) return "brushed";
  if (rough <= 0.15) return metal >= 0.5 ? "mirror" : "gloss";
  if (rough >= 0.6) return "matt";
  return "soft";
}

/** Small deterministic hash so grain is stable per colour, not random per render. */
function seedFrom(hex: string | null): number {
  let h = 7;
  for (const ch of hex ?? "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return (h % 997) + 1;
}

/**
 * The SVG. 100×100 viewBox, scales to any size. Ids are local to the SVG
 * document, so it is safe to embed as a data URI any number of times.
 */
export function finishSwatchSvg(m: FinishMaterial): string {
  const metal = clamp01(m.metalness);
  const rough = clamp01(m.roughness);
  const aniso = clamp01(m.anisotropy);
  const base = hexToRgb(m.hex_approx);
  const kind = describeFinishSurface(m);

  // --- body: what the field of the sample looks like away from the highlight
  // A mirror reflects a dark studio (0.30 of albedo); as roughness rises the
  // reflection blurs toward the room's average (0.65). A dielectric is lit
  // diffusely, so its body is close to its own colour.
  const envBright = 0.3 + 0.35 * smoothstep(0.05, 0.75, rough);
  const metalBody = scale(base, envBright);
  const dielectricBody = scale(base, 0.92);
  const body = mix(dielectricBody, metalBody, metal);
  // Slight curvature: lighter toward the top-left light, darker at the bottom.
  const bodyTop = rgbToHex(mix(body, WHITE, 0.08 + 0.08 * (1 - rough)));
  const bodyMid = rgbToHex(body);
  const bodyBottom = rgbToHex(scale(body, 0.8));

  // --- highlight: the one thing that tells finishes apart
  // Intensity falls with roughness; radius grows with it. Metals tint the
  // specular with their own colour; dielectrics reflect white.
  const intensity = kind === "sand" ? 0 : Math.pow(1 - rough, 1.3);
  const radius = 9 + 42 * rough;
  const specColour = rgbToHex(mix(WHITE, mix(base, WHITE, 0.55), metal * 0.6));
  // A hard edge for mirrors (most of the energy inside the disc), a soft
  // falloff otherwise.
  const hardness = 1 - rough; // 0.92 mirror → 0.05 matt
  const stops = [
    `<stop offset="0" stop-color="${specColour}" stop-opacity="${(intensity * 0.95).toFixed(3)}"/>`,
    `<stop offset="${(0.15 + 0.45 * hardness).toFixed(3)}" stop-color="${specColour}" stop-opacity="${(intensity * (0.35 + 0.55 * hardness)).toFixed(3)}"/>`,
    `<stop offset="1" stop-color="${specColour}" stop-opacity="0"/>`,
  ].join("");
  // Anisotropy stretches the highlight into a band along the brushing direction.
  const cx = 38;
  const cy = 32;
  const sx = 1 + 7 * aniso;
  const sy = 1 - 0.55 * aniso;
  const angle = -28;
  const specTransform = `translate(${cx} ${cy}) rotate(${angle}) scale(${sx.toFixed(3)} ${sy.toFixed(3)}) translate(${-cx} ${-cy})`;

  const defs: string[] = [
    `<linearGradient id="b" x1="0" y1="0" x2="0.35" y2="1"><stop offset="0" stop-color="${bodyTop}"/><stop offset="0.5" stop-color="${bodyMid}"/><stop offset="1" stop-color="${bodyBottom}"/></linearGradient>`,
    `<radialGradient id="s" cx="${cx}" cy="${cy}" r="${radius.toFixed(1)}" gradientUnits="userSpaceOnUse" gradientTransform="${specTransform}">${stops}</radialGradient>`,
    `<radialGradient id="v" cx="50" cy="50" r="70" gradientUnits="userSpaceOnUse"><stop offset="0.55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.22"/></radialGradient>`,
  ];
  const layers: string[] = [`<rect width="100" height="100" fill="url(#b)"/>`];

  if (kind === "sand") {
    // Fine stochastic grain, no specular point.
    const seed = seedFrom(m.hex_approx);
    defs.push(
      `<filter id="g" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="${seed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.9"/></feComponentTransfer></filter>`,
    );
    layers.push(`<rect width="100" height="100" fill="#fff" filter="url(#g)" opacity="0.32"/>`);
    layers.push(`<rect width="100" height="100" fill="#000" filter="url(#g)" opacity="0.22"/>`);
  } else {
    layers.push(`<rect width="100" height="100" fill="url(#s)"/>`);
  }

  if (aniso >= 0.5) {
    // Brush streaks along the same direction as the band.
    const streak = rgbToHex(mix(body, WHITE, 0.5));
    defs.push(
      `<pattern id="k" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(${angle})"><rect width="3" height="0.7" fill="${streak}"/></pattern>`,
    );
    layers.push(`<rect width="100" height="100" fill="url(#k)" opacity="${(0.10 + 0.16 * aniso).toFixed(3)}"/>`);
  }

  layers.push(`<rect width="100" height="100" fill="url(#v)"/>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none" shape-rendering="geometricPrecision"><defs>${defs.join("")}</defs>${layers.join("")}</svg>`;
}

export function finishSwatchDataUri(m: FinishMaterial): string {
  return `data:image/svg+xml;utf8,${encodeURIComponent(finishSwatchSvg(m))}`;
}

/**
 * CSS for a swatch element. A photographed swatch (swatch_url) wins;
 * otherwise the rendered material.
 */
export function finishSwatchStyle(m: FinishMaterial): { backgroundImage: string; backgroundSize: string } {
  const url = m.swatch_url?.trim();
  return {
    backgroundImage: url ? `url(${url})` : `url("${finishSwatchDataUri(m)}")`,
    backgroundSize: "cover",
  };
}
