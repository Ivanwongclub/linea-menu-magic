import { normalizeHex } from "./pantone.ts";

/** Linear colour fill in the model's face plane: 0° left→right, 90° bottom→top. */
export interface ColourGradient {
  from: string;
  to: string;
  angle: number;
  /** Position at which the two endpoint colours contribute equally. */
  midpoint: number;
}

export type GradientBounds = [number, number, number, number];

export interface GradientPaint {
  colour: ColourGradient;
  bounds: GradientBounds;
  /** A selected branding layer fits the fill across all its glyphs together. */
  fitToLayer?: boolean;
}

export function gradientBoundsFor(box: { min: { x: number; y: number }; max: { x: number; y: number } }): GradientBounds {
  return [box.min.x, box.min.y, box.max.x, box.max.y];
}

export function normalizeGradient(value: unknown): ColourGradient | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  const from = typeof raw.from === "string" ? normalizeHex(raw.from) : null;
  const to = typeof raw.to === "string" ? normalizeHex(raw.to) : null;
  if (!from || !to || typeof raw.angle !== "number" || !Number.isFinite(raw.angle)) return null;
  const midpoint = raw.midpoint === undefined ? 0.5 : raw.midpoint;
  if (typeof midpoint !== "number" || !Number.isFinite(midpoint)) return null;
  return { from, to, angle: ((raw.angle % 360) + 360) % 360, midpoint: Math.min(0.9, Math.max(0.1, midpoint)) };
}

export function gradientCss(gradient: ColourGradient): string {
  return `linear-gradient(${90 - gradient.angle}deg, ${gradient.from} 0%, ${gradient.midpoint * 100}%, ${gradient.to} 100%)`;
}

/** Sample the displayed HEX ramp for an evenly spaced series of solid fills. */
export function gradientColourAt(gradient: ColourGradient, position: number): string {
  const t = Math.max(0, Math.min(1, position));
  const amount = t <= gradient.midpoint ? 0.5 * t / gradient.midpoint : 0.5 + 0.5 * (t - gradient.midpoint) / (1 - gradient.midpoint);
  const channels = [1, 3, 5].map(at => {
    const from = parseInt(gradient.from.slice(at, at + 2), 16), to = parseInt(gradient.to.slice(at, at + 2), 16);
    return Math.round(from + (to - from) * amount).toString(16).padStart(2, "0");
  });
  return `#${channels.join("")}`.toUpperCase();
}

/** The same projection used by the GPU, also useful for endpoint/angle checks. */
export function gradientAmount(x: number, y: number, bounds: GradientBounds, gradient: ColourGradient): number {
  const radians = gradient.angle * Math.PI / 180;
  const dx = Math.cos(radians), dy = Math.sin(radians);
  const extent = Math.abs(dx) * (bounds[2] - bounds[0]) + Math.abs(dy) * (bounds[3] - bounds[1]);
  const projected = (x - (bounds[0] + bounds[2]) / 2) * dx + (y - (bounds[1] + bounds[3]) / 2) * dy;
  const t = Math.min(1, Math.max(0, projected / Math.max(extent, 1e-6) + 0.5));
  return t <= gradient.midpoint ? 0.5 * t / gradient.midpoint : 0.5 + 0.5 * (t - gradient.midpoint) / (1 - gradient.midpoint);
}
