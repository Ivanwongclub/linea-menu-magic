import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

/**
 * `products.model_raw_bounds` — parsed client-side at CMS upload, before any
 * rotation or scale exists (E1 collision 4/12; rulings §1.1).
 *
 * `face_axis` is the thinnest raw AABB axis (the relief direction, e.g. the
 * Polo's Y). `primary_raw` is the larger of the other two extents — it
 * doesn't depend on rotation, and matches EditorModel's old
 * `max(size.x, size.y)` for the axis-aligned rotations `decoratedFaceRotation`
 * produces.
 */
export interface ModelRawBounds {
  min: [number, number, number];
  max: [number, number, number];
  face_axis: 0 | 1 | 2;
  primary_raw: number;
}

/** Parses raw OBJ text with `OBJLoader.parse` — no viewer, no DOM canvas. */
export function parseObjRawBounds(text: string): ModelRawBounds {
  const group = new OBJLoader().parse(text);
  const min: [number, number, number] = [Infinity, Infinity, Infinity];
  const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];

  group.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return;
    const position = child.geometry.getAttribute("position");
    if (!position) return;
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const z = position.getZ(i);
      if (x < min[0]) min[0] = x;
      if (y < min[1]) min[1] = y;
      if (z < min[2]) min[2] = z;
      if (x > max[0]) max[0] = x;
      if (y > max[1]) max[1] = y;
      if (z > max[2]) max[2] = z;
    }
  });

  if (!Number.isFinite(min[0])) throw new Error("OBJ file has no vertex data");

  const extent: [number, number, number] = [max[0] - min[0], max[1] - min[1], max[2] - min[2]];
  const faceAxis: 0 | 1 | 2 = extent[0] <= extent[1] && extent[0] <= extent[2] ? 0 : extent[1] <= extent[2] ? 1 : 2;
  const others = ([0, 1, 2] as const).filter((axis) => axis !== faceAxis);
  const primaryRaw = Math.max(extent[others[0]], extent[others[1]]);

  return { min, max, face_axis: faceAxis, primary_raw: primaryRaw };
}

/** Reads `file` as text and parses its raw bounds. */
export async function parseObjFileRawBounds(file: File): Promise<ModelRawBounds> {
  return parseObjRawBounds(await file.text());
}

/**
 * C2: propose `1 unit = 1mm` when the raw primary dimension is within 2% of
 * the reference variant's mm, else the factor that makes them equal
 * (spec §16: `rawUnitToMM = P_mm / R`). Never rounds — display formats.
 */
export interface ScaleProposal {
  factor: number;
  withinBand: boolean;
  /** Signed fraction (R − P) / P; only meaningful when `withinBand`. */
  residual: number;
}

export const SCALE_BAND = 0.02;

export function proposeScaleFactor(primaryRawMm: number, referenceMm: number): ScaleProposal {
  const residual = (primaryRawMm - referenceMm) / referenceMm;
  const withinBand = Math.abs(residual) <= SCALE_BAND;
  return { factor: withinBand ? 1 : referenceMm / primaryRawMm, withinBand, residual };
}
