import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import type { ReliefOutline } from "./reliefGeometry";

/**
 * An uploaded SVG as face geometry (4k R3): `SVGLoader` → shapes (holes
 * included) → one `ShapeGeometry`, normalised so the artwork's width is
 * `width_mm` with its aspect kept, centred on the origin and flipped into
 * the face frame (SVG's y runs down). One fill: the geometry is solid, so
 * per-path colours are ignored.
 *
 * Browser only (SVGLoader needs a DOM parser); the validator in `logoSvg.ts`
 * is what runs before an upload.
 */
export interface LogoArtwork {
  shapes: THREE.Shape[];
  /** Width / height of the artwork's own bounding box. */
  aspect: number;
  widthUnits: number;
  heightUnits: number;
}

export function parseLogoSvg(svgText: string): LogoArtwork | null {
  const parsed = new SVGLoader().parse(svgText);
  const shapes: THREE.Shape[] = [];
  for (const path of parsed.paths) {
    // Holes come from the subpaths' winding; `true` keeps them as holes.
    shapes.push(...SVGLoader.createShapes(path));
  }
  if (shapes.length === 0) return null;
  const box = new THREE.Box2(new THREE.Vector2(Infinity, Infinity), new THREE.Vector2(-Infinity, -Infinity));
  for (const shape of shapes) {
    for (const p of shape.getPoints(32)) box.expandByPoint(p);
    for (const hole of shape.holes) for (const p of hole.getPoints(32)) box.expandByPoint(p);
  }
  const size = box.getSize(new THREE.Vector2());
  if (!(size.x > 0) || !(size.y > 0)) return null;
  return { shapes, aspect: size.x / size.y, widthUnits: size.x, heightUnits: size.y };
}

/** Segments per curve when an SVG path is sampled. */
export const LOGO_CURVE_SEGMENTS = 24;

/**
 * The artwork's contours at `widthMm`, centred on the origin, in the face
 * frame (mm, y up). SVG's y runs down, so the points are mirrored — a
 * mirror of the *points*, never a negative object scale (rulings §5); every
 * builder downstream orients its own winding from these contours, so front
 * faces still come out toward +Z.
 *
 * Phase 5: outlines rather than one flat geometry — relief, the flat
 * footprint and the stroke measure are all built from the same contours.
 */
export function logoOutlines(artwork: LogoArtwork, widthMm: number): ReliefOutline[] {
  const sampled = artwork.shapes.map((shape) => shape.extractPoints(LOGO_CURVE_SEGMENTS));
  const box = new THREE.Box2(new THREE.Vector2(Infinity, Infinity), new THREE.Vector2(-Infinity, -Infinity));
  for (const { shape, holes } of sampled) {
    for (const p of shape) box.expandByPoint(p);
    for (const hole of holes) for (const p of hole) box.expandByPoint(p);
  }
  const size = box.getSize(new THREE.Vector2());
  const centre = box.getCenter(new THREE.Vector2());
  const scale = widthMm / (size.x || 1);
  const place = (points: THREE.Vector2[]) => points.map((p) => new THREE.Vector2((p.x - centre.x) * scale, -(p.y - centre.y) * scale));
  return sampled
    .map(({ shape, holes }) => ({ outer: place(shape), holes: holes.map(place) }))
    .filter((outline) => outline.outer.length >= 3);
}
