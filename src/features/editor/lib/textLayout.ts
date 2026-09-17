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
  advanceMm: number;
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

export function layoutText(font: TypefaceMetrics, layer: TextLayer): PlacedGlyph[] {
  const { chars, mm } = advances(font, layer.content.value, layer.style.text_size_mm);
  const spacing = layer.style.letter_spacing_mm;
  const p = layer.placement;
  const total = totalLength(mm, spacing);

  // Distance from the start of the text to each glyph's centre.
  const along: number[] = [];
  let run = 0;
  for (let i = 0; i < mm.length; i++) {
    along.push(run + mm[i] / 2);
    run += mm[i] + spacing;
  }

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
      advanceMm: mm[i],
    };
  });
}
