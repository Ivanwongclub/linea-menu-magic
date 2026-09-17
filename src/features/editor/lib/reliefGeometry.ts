/**
 * Relief geometry for the live preview (Phase 5 R2; E1 §6 R4): raised layers
 * are extruded glyph/logo solids with a chamfer, engraved ones are a recess —
 * an opening mask, a depth punch and the floor and walls as their own meshes —
 * carved with the stencil buffer. No CSG anywhere: the bake is Phase 12's.
 *
 * Everything is built in the layer's own frame: x/y on the surface, +z along
 * the local surface normal, mm. The surface sits at z = 0, so a raised layer
 * measures `depth_mm` above it and an engraved floor `depth_mm` below.
 */
import * as THREE from "three";
import type { LayerRelief } from "./recipe.ts";

/** A contour and its holes, in mm, in the layer frame. */
export interface ReliefOutline {
  outer: THREE.Vector2[];
  holes: THREE.Vector2[][];
}

/** How far a raised layer's base sinks below the surface, so no two faces are coplanar (E1 §6 R3). */
export const RELIEF_SINK_MM = 0.02;
/** How far the opening mask floats above the surface, so it wins the depth test on a curved face. */
export const OPENING_LIFT_MM = 0.02;

/** A bevel can never eat the whole depth. */
export function effectiveBevel(relief: LayerRelief): number {
  return Math.max(0, Math.min(relief.bevel_mm, relief.depth_mm * 0.5));
}

export function toShapes(outlines: ReliefOutline[]): THREE.Shape[] {
  return outlines.map((o) => {
    const shape = new THREE.Shape(o.outer);
    shape.holes = o.holes.map((h) => new THREE.Path(h));
    return shape;
  });
}

/**
 * The raised solid: walls on the outline itself, the top face inset by the
 * bevel (`bevelOffset = −bevelSize`, so the letter never grows), the base sunk
 * below the surface. Its top is exactly `depth_mm` above the surface.
 */
export function raisedGeometry(outlines: ReliefOutline[], relief: LayerRelief): THREE.BufferGeometry {
  const bevel = effectiveBevel(relief);
  const geometry = new THREE.ExtrudeGeometry(toShapes(outlines), {
    curveSegments: 1,
    steps: 1,
    depth: relief.depth_mm - bevel + RELIEF_SINK_MM,
    bevelEnabled: bevel > 1e-6,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelOffset: -bevel,
    bevelSegments: 1,
  });
  geometry.translate(0, 0, -RELIEF_SINK_MM);
  return geometry;
}

/** The opening itself, flat, just above the surface: the stencil mask and the depth punch both draw it. */
export function openingGeometry(outlines: ReliefOutline[]): THREE.BufferGeometry {
  const geometry = new THREE.ShapeGeometry(toShapes(outlines), 1);
  geometry.translate(0, 0, OPENING_LIFT_MM);
  return geometry;
}

const isClockWise = (points: THREE.Vector2[]) => THREE.ShapeUtils.isClockWise(points);

/** Outer rings counter-clockwise, holes clockwise, so "left of the ring" always means "into the material". */
function orient(outline: ReliefOutline): ReliefOutline {
  const outer = isClockWise(outline.outer) ? [...outline.outer].reverse() : outline.outer;
  const holes = outline.holes.map((h) => (isClockWise(h) ? h : [...h].reverse()));
  return { outer, holes };
}

/**
 * Moves a ring `distance` to its left — into the material for an oriented
 * outer ring, away from the island for a hole — on the angle bisector, so
 * neighbouring edges stay joined. The miter is capped at 3× so a needle-sharp
 * corner can't shoot off.
 */
export function offsetRing(ring: THREE.Vector2[], distance: number): THREE.Vector2[] {
  const n = ring.length;
  const edgeNormal = (i: number) => {
    const a = ring[i];
    const b = ring[(i + 1) % n];
    const d = new THREE.Vector2(b.x - a.x, b.y - a.y);
    const length = d.length() || 1;
    return new THREE.Vector2(-d.y / length, d.x / length);
  };
  return ring.map((p, i) => {
    const n1 = edgeNormal((i - 1 + n) % n);
    const n2 = edgeNormal(i);
    const bisector = n1.clone().add(n2);
    if (bisector.lengthSq() < 1e-12) return p.clone();
    bisector.normalize();
    const scale = Math.min(3, 1 / Math.max(0.2, bisector.dot(n2)));
    return new THREE.Vector2(p.x + bisector.x * distance * scale, p.y + bisector.y * distance * scale);
  });
}

function ringProfile(ring: THREE.Vector2[], relief: LayerRelief): { ring: THREE.Vector2[]; z: number }[] {
  const bevel = effectiveBevel(relief);
  const floorZ = -relief.depth_mm;
  if (bevel <= 1e-6) {
    return [
      { ring, z: OPENING_LIFT_MM },
      { ring, z: floorZ },
    ];
  }
  const inset = offsetRing(ring, bevel);
  return [
    { ring, z: OPENING_LIFT_MM },
    { ring, z: 0 },
    { ring: inset, z: -bevel },
    { ring: inset, z: floorZ },
  ];
}

/**
 * The recess walls: every ring of the outline, skirted from the opening down
 * to the floor, with the chamfer at the top edge. Faces point into the recess
 * (the left of an oriented ring), so front-face culling alone shows the far
 * side of the recess and hides the near side.
 */
export function recessWallGeometry(outlines: ReliefOutline[], relief: LayerRelief): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  for (const outline of outlines.map(orient)) {
    for (const ring of [outline.outer, ...outline.holes]) {
      const n = ring.length;
      if (n < 3) continue;
      const profile = ringProfile(ring, relief);
      for (let level = 0; level + 1 < profile.length; level++) {
        const top = profile[level];
        const bottom = profile[level + 1];
        for (let i = 0; i < n; i++) {
          const j = (i + 1) % n;
          const a = new THREE.Vector3(top.ring[i].x, top.ring[i].y, top.z);
          const b = new THREE.Vector3(top.ring[j].x, top.ring[j].y, top.z);
          const c = new THREE.Vector3(bottom.ring[j].x, bottom.ring[j].y, bottom.z);
          const d = new THREE.Vector3(bottom.ring[i].x, bottom.ring[i].y, bottom.z);
          const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
          if (normal.lengthSq() < 1e-16) continue;
          normal.normalize();
          for (const [p, q, r] of [
            [a, b, c],
            [a, c, d],
          ]) {
            positions.push(p.x, p.y, p.z, q.x, q.y, q.z, r.x, r.y, r.z);
            for (let k = 0; k < 3; k++) normals.push(normal.x, normal.y, normal.z);
          }
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return geometry;
}

/** The recess floor, `depth_mm` below the surface, inset by the bevel so it meets the walls. */
export function recessFloorGeometry(outlines: ReliefOutline[], relief: LayerRelief): THREE.BufferGeometry {
  const bevel = effectiveBevel(relief);
  const inset = outlines
    .map(orient)
    .map((o) => ({ outer: bevel > 1e-6 ? offsetRing(o.outer, bevel) : o.outer, holes: o.holes.map((h) => (bevel > 1e-6 ? offsetRing(h, bevel) : h)) }));
  const geometry = new THREE.ShapeGeometry(toShapes(inset), 1);
  geometry.translate(0, 0, -relief.depth_mm);
  return geometry;
}
