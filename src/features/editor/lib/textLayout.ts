/**
 * Per-glyph text placement in the face frame (E1 §3.3; rulings §5): every
 * glyph is placed and oriented on its own. Reversed text is produced by
 * glyph order, traversal direction and rotation — never by negative scale.
 *
 * Pure maths over typeface-JSON metrics (advances only: typeface JSON has no
 * kerning, E1 §6 R1). No three.js objects here; the node unit tests and the
 * e2e scenarios import this file to compute expected placements.
 */
import type { TextLayer } from "./recipe";

export interface TypefaceMetrics {
  resolution: number;
  /** Written by the offline converter from OS/2 sCapHeight. */
  capHeight?: number;
  glyphs: Record<string, { ha: number } | undefined>;
}

export interface PlacedGlyph {
  index: number;
  char: string;
  /** Glyph centre (advance midpoint, cap-height midline) in the face frame, mm. */
  x: number;
  y: number;
  /** Rotation about the face normal in three.js convention (counter-clockwise positive), radians. */
  rotationZ: number;
  /** Circle only: the glyph centre's face angle, degrees, 0 = 12 o'clock, clockwise positive, in [0, 360). */
  angleDeg: number | null;
  /** Circle only: distance of the glyph centre from the circle centre, mm. */
  radiusMm: number | null;
  advanceMm: number;
}

export interface TextArc {
  spanDeg: number;
  startDeg: number;
  endDeg: number;
}

const DEG = Math.PI / 180;

/** Font units → mm, with `text_size_mm` as the cap height. */
export function unitScale(font: TypefaceMetrics, textSizeMm: number): number {
  const cap = font.capHeight && font.capHeight > 0 ? font.capHeight : font.resolution * 0.7;
  return textSizeMm / cap;
}

/** The character a glyph is drawn with: anything outside the bundled subset renders as "?". */
export function glyphChar(font: TypefaceMetrics, char: string): string {
  return font.glyphs[char] ? char : "?";
}

function advances(font: TypefaceMetrics, value: string, textSizeMm: number): { chars: string[]; mm: number[] } {
  const s = unitScale(font, textSizeMm);
  const chars = Array.from(value);
  return { chars, mm: chars.map((c) => (font.glyphs[glyphChar(font, c)]?.ha ?? 0) * s) };
}

function totalLength(mm: number[], letterSpacingMm: number): number {
  if (mm.length === 0) return 0;
  return mm.reduce((a, b) => a + b, 0) + (mm.length - 1) * letterSpacingMm;
}

export function normalizeDeg(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Derived, never stored (C7): span = (Σ advance + (n−1)·spacing) / radius. */
export function textArc(font: TypefaceMetrics, layer: TextLayer): TextArc {
  const { mm } = advances(font, layer.content.value, layer.style.text_size_mm);
  const radius = layer.placement.radius_mm;
  const spanDeg = radius > 0 ? totalLength(mm, layer.style.letter_spacing_mm) / radius / DEG : 0;
  const mid = layer.placement.arc_position_deg;
  // Reading order: cw runs clockwise (increasing angle), ccw counter-clockwise.
  return layer.placement.direction === "cw"
    ? { spanDeg, startDeg: mid - spanDeg / 2, endDeg: mid + spanDeg / 2 }
    : { spanDeg, startDeg: mid + spanDeg / 2, endDeg: mid - spanDeg / 2 };
}

/**
 * Letter spacing that makes the text span `spanDeg` at a fixed radius — the
 * preserve-radius fit policy (C7): widening the arc spaces letters out and
 * never moves the radius.
 */
export function letterSpacingForSpan(font: TypefaceMetrics, layer: TextLayer, spanDeg: number): number {
  const { mm } = advances(font, layer.content.value, layer.style.text_size_mm);
  if (mm.length < 2) return layer.style.letter_spacing_mm;
  const arcLength = spanDeg * DEG * layer.placement.radius_mm;
  return (arcLength - mm.reduce((a, b) => a + b, 0)) / (mm.length - 1);
}

/**
 * How far a straight layer reaches from its own centre, mm (6b R5): half the
 * set line, half the cap height, as a radius. The 4j formula measured a
 * straight layer off the circle radius it wasn't using.
 */
export function straightReachMm(font: TypefaceMetrics, layer: TextLayer): number {
  const { mm } = advances(font, layer.content.value, layer.style.text_size_mm);
  const half = totalLength(mm, layer.style.letter_spacing_mm) / 2;
  const centre = Math.hypot(layer.placement.centre_mm.x, layer.placement.centre_mm.y);
  return centre + Math.hypot(half, layer.style.text_size_mm / 2 + Math.abs(layer.placement.baseline_offset_mm));
}

export function layoutText(font: TypefaceMetrics, layer: TextLayer): PlacedGlyph[] {
  const { chars, mm } = advances(font, layer.content.value, layer.style.text_size_mm);
  const spacing = layer.style.letter_spacing_mm;
  const p = layer.placement;
  const total = totalLength(mm, spacing);

  // Arc length from the start of the text to each glyph's centre.
  const along: number[] = [];
  let run = 0;
  for (let i = 0; i < mm.length; i++) {
    along.push(run + mm[i] / 2);
    run += mm[i] + spacing;
  }

  if (p.layout === "straight") {
    const theta = -p.rotation_deg * DEG; // stored clockwise, three.js counter-clockwise
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    return chars.map((char, i) => {
      const lx = along[i] - total / 2;
      const ly = p.baseline_offset_mm;
      return {
        index: i,
        char,
        x: p.centre_mm.x + lx * cos - ly * sin,
        y: p.centre_mm.y + lx * sin + ly * cos,
        rotationZ: theta,
        angleDeg: null,
        radiusMm: null,
        advanceMm: mm[i],
      };
    });
  }

  const radius = p.radius_mm;
  const safeRadius = radius > 0 ? radius : 1e-6;
  const half = total / 2;
  return chars.map((char, i) => {
    let angle: number;
    let r: number;
    let rotationZ: number;
    if (p.direction === "cw") {
      // Tops of the letters face outward; reading runs clockwise.
      angle = p.arc_position_deg + ((along[i] - half) / safeRadius) / DEG;
      r = radius + p.baseline_offset_mm;
      rotationZ = -angle * DEG;
    } else {
      // Tops face the centre; reading runs counter-clockwise, so the glyph
      // order walks the angle down and each glyph turns half a circle.
      angle = p.arc_position_deg - ((along[i] - half) / safeRadius) / DEG;
      r = radius - p.baseline_offset_mm;
      rotationZ = Math.PI - angle * DEG;
    }
    return {
      index: i,
      char,
      x: p.centre_mm.x + r * Math.sin(angle * DEG),
      y: p.centre_mm.y + r * Math.cos(angle * DEG),
      rotationZ,
      angleDeg: normalizeDeg(angle),
      radiusMm: r,
      advanceMm: mm[i],
    };
  });
}
