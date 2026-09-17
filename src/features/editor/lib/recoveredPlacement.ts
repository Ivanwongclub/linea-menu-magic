/**
 * Catalogue branding defaults (4j, E1 §5 row 4j, C8): the product's recovered
 * reference is stored in raw OBJ units and frame; a buyer's new text layer
 * gets it in face-frame mm at the stored factor. Pure maths — no three.js —
 * so the node tests and the e2e scenarios load it.
 */
import type { LayerDefaults, TextDirection } from "./recipe";

type Vec3 = [number, number, number];

/** The subset of `model_branding_reference` (E1 §3.2) the editor reads. */
export interface BrandingReferenceRaw {
  centre_raw: Vec3;
  radius_raw: number;
  start_angle_deg: number;
  end_angle_deg: number;
  direction: TextDirection;
  text_height_raw: number | null;
  relief_raw: number | null;
  confidence: "high" | "medium" | "low";
}

/**
 * Raw OBJ point → face frame, exactly as `EditorModel` places the model:
 * rotate (the decorated-face quaternion, computed on the full model —
 * collision 10), scale by factor × variant scale, translate by the recentring.
 */
export interface FaceTransform {
  quaternion: [number, number, number, number];
  scale: number;
  offset: Vec3;
}

/** A recovered arc wider than this covers "most of the circle" (4d ruling): top and bottom lettering were fitted as one. */
export const MOST_OF_CIRCLE_DEG = 180;
/** Marked glyphs further apart than this, angularly, belong to different clusters. */
export const CLUSTER_GAP_DEG = 25;

export function toFace(t: FaceTransform, [x, y, z]: Vec3): Vec3 {
  const [qx, qy, qz, qw] = t.quaternion;
  // v' = q v q*, expanded.
  const ix = qw * x + qy * z - qz * y;
  const iy = qw * y + qz * x - qx * z;
  const iz = qw * z + qx * y - qy * x;
  const iw = -qx * x - qy * y - qz * z;
  const rx = ix * qw + iw * -qx + iy * -qz - iz * -qy;
  const ry = iy * qw + iw * -qy + iz * -qx - ix * -qz;
  const rz = iz * qw + iw * -qz + ix * -qy - iy * -qx;
  return [rx * t.scale + t.offset[0], ry * t.scale + t.offset[1], rz * t.scale + t.offset[2]];
}

const DEG = 180 / Math.PI;

/** 0° = 12 o'clock (+Y), clockwise positive, in [0, 360). */
export function faceAngle(dx: number, dy: number): number {
  const a = Math.atan2(dx, dy) * DEG;
  return a < 0 ? a + 360 : a;
}

/** Clockwise extent of the recovered arc between its two reading ends. */
export function recoveredSpanDeg(ref: Pick<BrandingReferenceRaw, "start_angle_deg" | "end_angle_deg" | "direction">): number {
  const from = ref.direction === "cw" ? ref.start_angle_deg : ref.end_angle_deg;
  const to = ref.direction === "cw" ? ref.end_angle_deg : ref.start_angle_deg;
  return (((to - from) % 360) + 360) % 360;
}

export interface AngularCluster {
  startDeg: number;
  extentDeg: number;
  count: number;
  midDeg: number;
}

/** Glyph angles split at gaps wider than `gapDeg`, wrapping round 0°. */
export function angularClusters(anglesDeg: number[], gapDeg = CLUSTER_GAP_DEG): AngularCluster[] {
  const sorted = anglesDeg.map((a) => ((a % 360) + 360) % 360).sort((a, b) => a - b);
  if (sorted.length === 0) return [];
  const gaps = sorted.map((a, i) => ((i + 1 < sorted.length ? sorted[i + 1] : sorted[0] + 360) - a));
  // Start walking just after the widest gap so no cluster is split by 0°.
  let widest = 0;
  gaps.forEach((g, i) => {
    if (g > gaps[widest]) widest = i;
  });
  const clusters: AngularCluster[] = [];
  let start = sorted[(widest + 1) % sorted.length];
  let run = 0;
  let count = 1;
  for (let k = 1; k <= sorted.length; k++) {
    const i = (widest + k) % sorted.length;
    const gap = gaps[i];
    if (k === sorted.length || gap > gapDeg) {
      clusters.push({ startDeg: start, extentDeg: run, count, midDeg: (start + run / 2) % 360 });
      start = sorted[(i + 1) % sorted.length];
      run = 0;
      count = 1;
    } else {
      run += gap;
      count++;
    }
  }
  return clusters;
}

/** Two clusters this close in angular extent are a tie (4k R5). */
export const CLUSTER_TIE_DEG = 20;

/** Distance from 12 o'clock, either way round. */
function fromTop(deg: number): number {
  const d = ((deg % 360) + 360) % 360;
  return Math.min(d, 360 - d);
}

/**
 * The widest cluster — but when two are within `CLUSTER_TIE_DEG` of each
 * other in extent, the one nearest 0° wins (4k R5, closing 4j Q1: the top
 * lettering is what a buyer expects, and a few degrees of extra extent on the
 * bottom arc shouldn't take it).
 */
export function largestCluster(clusters: AngularCluster[]): AngularCluster | null {
  return clusters.reduce<AngularCluster | null>((best, c) => {
    if (!best) return c;
    const gap = c.extentDeg - best.extentDeg;
    if (Math.abs(gap) <= CLUSTER_TIE_DEG) return fromTop(c.midDeg) < fromTop(best.midDeg) ? c : best;
    return gap > 0 ? c : best;
  }, null);
}

/**
 * The layer defaults for Add text. Centre, radius and text size convert at
 * factor × variant scale (placement scales with the product, C10); relief
 * converts at the factor alone (physical, C10). Direction and arc position
 * come from the reference, unless its arc covers most of the circle — then
 * `cw` at the midpoint of the widest cluster of marked glyphs (4d ruling).
 */
export function recoveredDefaults(
  ref: BrandingReferenceRaw | null,
  transform: FaceTransform | null,
  factor: number | null,
  markedGlyphCentres: [number, number][],
): LayerDefaults | null {
  if (!ref || !transform || !(factor && factor > 0) || !(ref.radius_raw > 0) || ref.confidence === "low") return null;
  const [cx, cy] = toFace(transform, ref.centre_raw);
  let direction: TextDirection = ref.direction;
  let arcPosition: number;
  const span = recoveredSpanDeg(ref);
  if (span > MOST_OF_CIRCLE_DEG) {
    direction = "cw";
    const cluster = largestCluster(angularClusters(markedGlyphCentres.map(([x, y]) => faceAngle(x - cx, y - cy))));
    arcPosition = cluster ? cluster.midDeg : 0;
  } else {
    const from = ref.direction === "cw" ? ref.start_angle_deg : ref.end_angle_deg;
    arcPosition = (from + span / 2) % 360;
  }
  return {
    centre_mm: { x: cx, y: cy },
    radius_mm: ref.radius_raw * transform.scale,
    arc_position_deg: arcPosition,
    direction,
    text_size_mm: ref.text_height_raw != null ? ref.text_height_raw * transform.scale : null,
    relief:
      ref.relief_raw != null && Math.abs(ref.relief_raw) > 0
        ? { type: ref.relief_raw > 0 ? "emboss" : "deboss", depth_mm: Math.abs(ref.relief_raw) * factor }
        : null,
  };
}
