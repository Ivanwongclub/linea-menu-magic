import * as THREE from "three";
import type { Font } from "three/examples/jsm/loaders/FontLoader.js";
import type { TypefaceMetrics } from "./textLayout";
import type { ReliefOutline } from "./reliefGeometry";

/** Segments per curve in a glyph outline — the 4f preview's value, kept. */
export const GLYPH_CURVE_SEGMENTS = 6;

/**
 * One glyph's outline in mm, with its origin at the advance midpoint and the
 * cap-height midline (Phase 4f's convention), so a piece's position is the
 * layout's glyph centre. `sizeMm` is the cap height, as the recipe stores it.
 *
 * Outlines, not geometry: relief, the flat footprint and the stroke measure
 * are all built from the same contours.
 */
export function glyphOutlines(font: Font, char: string, sizeMm: number): ReliefOutline[] {
  const data = font.data as unknown as TypefaceMetrics;
  const cap = data.capHeight && data.capHeight > 0 ? data.capHeight : data.resolution * 0.7;
  const unit = sizeMm / cap;
  const dx = -((data.glyphs[char]?.ha ?? 0) * unit) / 2;
  const dy = -sizeMm / 2;
  const shapes = font.generateShapes(char, data.resolution * unit);
  const move = (points: THREE.Vector2[]) => points.map((p) => new THREE.Vector2(p.x + dx, p.y + dy));
  return shapes
    .map((shape) => {
      const { shape: outer, holes } = shape.extractPoints(GLYPH_CURVE_SEGMENTS);
      return { outer: move(outer), holes: holes.map(move) };
    })
    .filter((outline) => outline.outer.length >= 3);
}
