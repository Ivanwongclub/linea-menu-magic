import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";

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

/**
 * Reverses every triangle's winding. SVG's y runs down, so the face frame
 * needs the artwork mirrored in y — which leaves each triangle wound the
 * wrong way round and the whole logo back-face culled. Flipping the order
 * restores front faces toward +Z without a negative object scale (rulings §5).
 */
function flipWinding(geometry: THREE.BufferGeometry): void {
  const index = geometry.getIndex();
  if (index) {
    for (let i = 0; i < index.count; i += 3) {
      const b = index.getX(i + 1);
      index.setX(i + 1, index.getX(i + 2));
      index.setX(i + 2, b);
    }
    index.needsUpdate = true;
    return;
  }
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i += 3) {
    const bx = position.getX(i + 1);
    const by = position.getY(i + 1);
    const bz = position.getZ(i + 1);
    position.setXYZ(i + 1, position.getX(i + 2), position.getY(i + 2), position.getZ(i + 2));
    position.setXYZ(i + 2, bx, by, bz);
  }
  position.needsUpdate = true;
}

/** The artwork at `widthMm`, centred on the origin, y up. Caller disposes. */
export function buildLogoGeometry(artwork: LogoArtwork, widthMm: number): THREE.BufferGeometry {
  const geometry = new THREE.ShapeGeometry(artwork.shapes, 24);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox as THREE.Box3;
  const centre = box.getCenter(new THREE.Vector3());
  const scale = widthMm / (box.max.x - box.min.x || 1);
  geometry.translate(-centre.x, -centre.y, 0);
  // SVG y runs down; the face frame's runs up.
  geometry.scale(scale, -scale, 1);
  flipWinding(geometry);
  geometry.computeVertexNormals();
  return geometry;
}
