/**
 * The selected layer's ruler dimensions (4j R5; E1 §5 row 4j): branding
 * radius, letter height and edge margin (face radius − radius − text size / 2)
 * as face-frame segments. Pure maths, no three.js.
 */
import type { TextLayer } from "./recipe";

export interface LayerDimension {
  kind: "brandingRadius" | "letterHeight" | "edgeMargin";
  valueMm: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const RAD = Math.PI / 180;
/** The letter-height tick sits this far round from the radius line so the two never share a line. */
const HEIGHT_OFFSET_DEG = 14;

export function edgeMarginMm(layer: TextLayer, faceRadiusMm: number): number {
  return faceRadiusMm - layer.placement.radius_mm - layer.style.text_size_mm / 2;
}

export function layerDimensions(layer: TextLayer, faceRadiusMm: number): LayerDimension[] {
  const p = layer.placement;
  const size = layer.style.text_size_mm;
  const c = p.centre_mm;
  if (p.layout !== "circle") {
    // Straight text: its letter height, drawn just left of the text centre.
    const x = c.x - size * 0.9;
    return [{ kind: "letterHeight", valueMm: size, from: { x, y: c.y - size / 2 }, to: { x, y: c.y + size / 2 } }];
  }
  const at = (deg: number, r: number) => ({ x: c.x + r * Math.sin(deg * RAD), y: c.y + r * Math.cos(deg * RAD) });
  // Opposite the text, so the lines never cross the letters they measure.
  const free = p.arc_position_deg + 180;
  const r = p.radius_mm;
  return [
    { kind: "brandingRadius", valueMm: r, from: at(free, 0), to: at(free, r) },
    { kind: "letterHeight", valueMm: size, from: at(free + HEIGHT_OFFSET_DEG, r - size / 2), to: at(free + HEIGHT_OFFSET_DEG, r + size / 2) },
    { kind: "edgeMargin", valueMm: edgeMarginMm(layer, faceRadiusMm), from: at(free, r + size / 2), to: at(free, faceRadiusMm) },
  ];
}
