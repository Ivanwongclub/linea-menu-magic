/**
 * On-model handles for the selected text layer (4i, E1 §5 row 4i; rulings
 * §3): where each handle sits in the face frame and what a drag on the face
 * plane does to the layer. Pure maths, face-frame mm, angles 0° = 12 o'clock
 * clockwise positive — the same conventions as `textLayout`. No three.js.
 */
import { isLogoLayer, isTextLayer, logoHeightMm, type Layer, type LayerPatch, type LogoLayer, type TextLayer } from "./recipe.ts";

/** `size` is a logo's corner handle: it scales the width, aspect kept (4k R3). */
export type HandleKind = "radius" | "arc" | "move" | "size";

export interface FacePoint {
  x: number;
  y: number;
}

const RAD = Math.PI / 180;

/** Screen hit areas are at least this many CSS px across (touch, v3-review §10). */
export const HANDLE_HIT_PX = 28;
/** A drag never takes the radius or a logo's width below this. */
export const MIN_RADIUS_MM = 0.05;

export function onCircle(centre: FacePoint, radius: number, deg: number): FacePoint {
  return { x: centre.x + radius * Math.sin(deg * RAD), y: centre.y + radius * Math.cos(deg * RAD) };
}

export function angleOf(centre: FacePoint, p: FacePoint): number {
  const a = Math.atan2(p.x - centre.x, p.y - centre.y) / RAD;
  return a < 0 ? a + 360 : a;
}

/** Signed smallest turn from `from` to `to`, in (−180, 180]. */
export function turn(from: number, to: number): number {
  let d = (to - from) % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
}

/**
 * The arc knob sits on the layer's arc position, inside the text (towards the
 * centre, clear of the letters), so it never covers the glyphs it moves.
 */
export function arcKnobRadius(layer: TextLayer): number {
  const r = layer.placement.radius_mm;
  return Math.max(0.35 * r, r - 0.9 * layer.style.text_size_mm);
}

/** The logo's corner in the face frame: half its width and height, turned by its rotation. */
export function logoCorner(layer: LogoLayer): FacePoint {
  const half = { x: layer.content.width_mm / 2, y: logoHeightMm(layer) / 2 };
  const theta = -layer.placement.rotation_deg * RAD;
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return {
    x: layer.placement.centre_mm.x + half.x * cos - half.y * sin,
    y: layer.placement.centre_mm.y + half.x * sin + half.y * cos,
  };
}

export interface LayerHandles {
  centre: FacePoint;
  /** Circle only. */
  radius: number | null;
  arcKnob: FacePoint | null;
  /** The ring point the e2e drag grabs: opposite the text, clear of the knob. */
  ringGrab: FacePoint | null;
  /** Straight text and logos. */
  move: FacePoint | null;
  /** Logos only: the corner that scales the width. */
  size: FacePoint | null;
}

export function layerHandles(layer: Layer): LayerHandles {
  const p = layer.placement;
  const centre = p.centre_mm;
  if (isLogoLayer(layer)) {
    return { centre, radius: null, arcKnob: null, ringGrab: null, move: centre, size: logoCorner(layer) };
  }
  if (isTextLayer(layer) && p.layout === "circle") {
    return {
      centre,
      radius: p.radius_mm,
      arcKnob: onCircle(centre, arcKnobRadius(layer), p.arc_position_deg),
      ringGrab: onCircle(centre, p.radius_mm, p.arc_position_deg + 180),
      move: null,
      size: null,
    };
  }
  return { centre, radius: null, arcKnob: null, ringGrab: null, move: centre, size: null };
}

/** State captured at pointer-down; every move is computed from it, so a drag never accumulates rounding. */
export interface DragStart {
  kind: HandleKind;
  layer: Layer;
  at: FacePoint;
}

export interface DragProgress {
  /** Running angle for the arc knob, so a drag can go all the way round. */
  lastAngle: number;
  totalTurn: number;
}

export function startProgress(start: DragStart): DragProgress {
  return { lastAngle: angleOf(start.layer.placement.centre_mm, start.at), totalTurn: 0 };
}

/** The layer patch for the pointer now at `at` on the face plane. */
export function dragPatch(start: DragStart, progress: DragProgress, at: FacePoint): LayerPatch {
  const p = start.layer.placement;
  if (start.kind === "move") {
    return { placement: { centre_mm: { x: p.centre_mm.x + (at.x - start.at.x), y: p.centre_mm.y + (at.y - start.at.y) } } };
  }
  const c = p.centre_mm;
  if (start.kind === "size") {
    // A corner drag scales the logo about its centre; the aspect never moves.
    const layer = start.layer as LogoLayer;
    const d0 = Math.hypot(start.at.x - c.x, start.at.y - c.y);
    const d = Math.hypot(at.x - c.x, at.y - c.y);
    const ratio = d0 > 1e-6 ? d / d0 : 1;
    return { content: { width_mm: Math.max(MIN_RADIUS_MM, layer.content.width_mm * ratio) } };
  }
  if (start.kind === "radius") {
    const d0 = Math.hypot(start.at.x - c.x, start.at.y - c.y);
    const d = Math.hypot(at.x - c.x, at.y - c.y);
    return { placement: { radius_mm: Math.max(MIN_RADIUS_MM, p.radius_mm + (d - d0)) } };
  }
  const angle = angleOf(c, at);
  progress.totalTurn += turn(progress.lastAngle, angle);
  progress.lastAngle = angle;
  return { placement: { arc_position_deg: p.arc_position_deg + progress.totalTurn } };
}
