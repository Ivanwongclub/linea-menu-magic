/**
 * The selected layer's ruler dimensions (4j R5; E1 §5 row 4j): branding
 * radius, letter height and edge margin (face radius − radius − text size / 2)
 * as face-frame segments. Pure maths, no three.js.
 */
import { isLogoLayer, logoHeightMm, type Layer } from "./recipe.ts";
import { logoCorner } from "./handleGeometry.ts";

export interface LayerDimension {
  kind: "brandingRadius" | "letterHeight" | "edgeMargin" | "logoWidth" | "logoHeight";
  valueMm: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

const RAD = Math.PI / 180;
/** The letter-height tick sits this far round from the radius line so the two never share a line. */
const HEIGHT_OFFSET_DEG = 14;

/**
 * How much bare face is left outside the branding: for text, the face radius
 * less the arc and half a letter; for a logo, the face radius less the
 * distance to its farthest corner.
 */
export function edgeMarginMm(layer: Layer, faceRadiusMm: number): number {
  if (isLogoLayer(layer)) {
    const corner = logoCorner(layer);
    return faceRadiusMm - Math.hypot(corner.x, corner.y);
  }
  return faceRadiusMm - layer.placement.radius_mm - layer.style.text_size_mm / 2;
}

export function layerDimensions(layer: Layer, faceRadiusMm: number): LayerDimension[] {
  const p = layer.placement;
  if (isLogoLayer(layer)) {
    // Width and height across the logo's own axes, and the margin from its
    // farthest corner out to the face edge (4k R4).
    const w = layer.content.width_mm;
    const h = logoHeightMm(layer);
    const theta = -p.rotation_deg * RAD;
    const cos = Math.cos(theta);
    const sin = Math.sin(theta);
    const at = (lx: number, ly: number) => ({ x: p.centre_mm.x + lx * cos - ly * sin, y: p.centre_mm.y + lx * sin + ly * cos });
    const corner = logoCorner(layer);
    const reach = Math.hypot(corner.x, corner.y) || 1;
    return [
      { kind: "logoWidth", valueMm: w, from: at(-w / 2, -h / 2 - 0.3), to: at(w / 2, -h / 2 - 0.3) },
      { kind: "logoHeight", valueMm: h, from: at(-w / 2 - 0.3, -h / 2), to: at(-w / 2 - 0.3, h / 2) },
      {
        kind: "edgeMargin",
        valueMm: edgeMarginMm(layer, faceRadiusMm),
        from: corner,
        to: { x: (corner.x / reach) * faceRadiusMm, y: (corner.y / reach) * faceRadiusMm },
      },
    ];
  }
  const size = layer.kind === "text" ? layer.style.text_size_mm : 0;
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
