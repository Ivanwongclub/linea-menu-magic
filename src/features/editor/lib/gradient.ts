import { normalizeHex } from "./pantone.ts";

export interface GradientBrightness {
  colour: string;
  /** -100 is black, 0 is the base colour, +100 is white. */
  from: number;
  to: number;
}

/** Linear colour fill in the model's face plane: 0° left→right, 90° bottom→top. */
export interface ColourGradient {
  from: string;
  to: string;
  angle: number;
  /** Position at which the two endpoint colours contribute equally. */
  midpoint: number;
  brightness?: GradientBrightness;
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
  const gradient: ColourGradient = { from, to, angle: ((raw.angle % 360) + 360) % 360, midpoint: Math.min(0.9, Math.max(0.1, midpoint)) };
  const brightness = raw.brightness as Partial<GradientBrightness> | null | undefined;
  const colour = typeof brightness?.colour === "string" ? normalizeHex(brightness.colour) : null;
  if (colour && typeof brightness?.from === "number" && Number.isFinite(brightness.from) && typeof brightness.to === "number" && Number.isFinite(brightness.to)) {
    return withGradientBrightness(gradient, { colour, from: Math.max(-100, Math.min(100, brightness.from)), to: Math.max(-100, Math.min(100, brightness.to)) });
  }
  return gradient;
}

export function gradientCss(gradient: ColourGradient): string {
  if (gradient.brightness) {
    const { from, to } = gradient.brightness;
    const zero = from === to ? -1 : -from / (to - from);
    const zeroAt = zero <= 0.5 ? zero * 2 * gradient.midpoint : gradient.midpoint + (zero - 0.5) * 2 * (1 - gradient.midpoint);
    const stops = [...new Set([0, gradient.midpoint, ...(zero > 0 && zero < 1 ? [zeroAt] : []), 1])].sort((a, b) => a - b);
    return `linear-gradient(${90 - gradient.angle}deg, ${stops.map(at => `${gradientColourAt(gradient, at)} ${at * 100}%`).join(", ")})`;
  }
  return `linear-gradient(${90 - gradient.angle}deg, ${gradient.from} 0%, ${gradient.midpoint * 100}%, ${gradient.to} 100%)`;
}

export function hexRgb(hex: string): [number, number, number] {
  return [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
}

/** An affine tint/shade preserves the base hue and crosses the exact base at 0%. */
export function brightnessColour(colour: string, brightness: number): string {
  const amount = Math.max(-100, Math.min(100, brightness)) / 100;
  return `#${hexRgb(colour).map(channel => Math.round((amount < 0 ? channel * (1 + amount) : channel + (1 - channel) * amount) * 255).toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

export function withGradientBrightness(gradient: ColourGradient, brightness: GradientBrightness): ColourGradient {
  const value = { ...brightness, from: Math.max(-100, Math.min(100, brightness.from)), to: Math.max(-100, Math.min(100, brightness.to)) };
  return { ...gradient, brightness: value, from: brightnessColour(value.colour, value.from), to: brightnessColour(value.colour, value.to) };
}

export function enableGradientBrightness(gradient: ColourGradient): ColourGradient {
  const chroma = (hex: string) => { const channels = hexRgb(hex); return Math.max(...channels) - Math.min(...channels); };
  const colour = chroma(gradient.from) > 0 ? gradient.from : chroma(gradient.to) > 0 ? gradient.to : ["#000000", "#FFFFFF"].includes(gradient.from.toUpperCase()) ? "#808080" : gradient.from;
  return withGradientBrightness(gradient, { colour, from: -50, to: 50 });
}

export function reverseGradient(gradient: ColourGradient): ColourGradient {
  const reversed = { ...gradient, from: gradient.to, to: gradient.from, midpoint: 1 - gradient.midpoint };
  return gradient.brightness ? withGradientBrightness(reversed, { ...gradient.brightness, from: gradient.brightness.to, to: gradient.brightness.from }) : reversed;
}

/** Sample the displayed HEX ramp for an evenly spaced series of solid fills. */
export function gradientColourAt(gradient: ColourGradient, position: number): string {
  const t = Math.max(0, Math.min(1, position));
  const amount = t <= gradient.midpoint ? 0.5 * t / gradient.midpoint : 0.5 + 0.5 * (t - gradient.midpoint) / (1 - gradient.midpoint);
  if (gradient.brightness) return brightnessColour(gradient.brightness.colour, gradient.brightness.from + (gradient.brightness.to - gradient.brightness.from) * amount);
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
