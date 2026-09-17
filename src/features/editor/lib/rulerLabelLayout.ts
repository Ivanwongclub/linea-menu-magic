/**
 * Screen-space placement for the ruler's DOM labels (R2): the diameter label
 * centred below a horizontal dimension line (beside it if the line runs
 * vertically), the thickness label beside its line, both offset away from
 * the model, then pushed apart so no two labels overlap. Pure maths over
 * canvas pixels — no three.js, so the node tests can load it.
 */
export interface Point {
  x: number;
  y: number;
}

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DimensionLine {
  /** Projected end points, canvas px (y down). */
  a: Point;
  b: Point;
  /** The label's own size, px. */
  width: number;
  height: number;
}

export const LABEL_GAP_PX = 6;

export function rectsOverlap(p: Rect, q: Rect): boolean {
  return p.x < q.x + q.width && q.x < p.x + p.width && p.y < q.y + q.height && q.y < p.y + p.height;
}

/** Horizontal on screen if it spans more x than y. */
function runsHorizontally(line: DimensionLine): boolean {
  return Math.abs(line.a.x - line.b.x) >= Math.abs(line.a.y - line.b.y);
}

/** Below a horizontal line, centred on it. */
export function belowLine(line: DimensionLine, gap = LABEL_GAP_PX): Rect {
  const cx = (line.a.x + line.b.x) / 2;
  return { x: cx - line.width / 2, y: Math.max(line.a.y, line.b.y) + gap, width: line.width, height: line.height };
}

/** Beside a line, on the side away from `centre`, vertically centred on it. */
export function besideLine(line: DimensionLine, centre: Point, gap = LABEL_GAP_PX): Rect {
  const mid = { x: (line.a.x + line.b.x) / 2, y: (line.a.y + line.b.y) / 2 };
  const outwardLeft = mid.x < centre.x;
  const x = outwardLeft ? Math.min(line.a.x, line.b.x) - gap - line.width : Math.max(line.a.x, line.b.x) + gap;
  return { x, y: mid.y - line.height / 2, width: line.width, height: line.height };
}

/**
 * Places every label, then resolves collisions in order: each later label is
 * pushed vertically away from any earlier one it overlaps (in the direction
 * its own centre already lies), repeating until nothing overlaps.
 */
export function layoutRulerLabels(diameter: DimensionLine, thickness: DimensionLine, centre: Point): { diameter: Rect; thickness: Rect } {
  const d = runsHorizontally(diameter) ? belowLine(diameter) : besideLine(diameter, centre);
  const t = besideLine(thickness, centre);
  const placed: Rect[] = [d];
  for (const rect of [t]) {
    for (let guard = 0; guard < 8; guard++) {
      const hit = placed.find((other) => rectsOverlap(rect, other));
      if (!hit) break;
      const down = rect.y + rect.height / 2 >= hit.y + hit.height / 2;
      rect.y = down ? hit.y + hit.height + LABEL_GAP_PX : hit.y - rect.height - LABEL_GAP_PX;
    }
    placed.push(rect);
  }
  return { diameter: d, thickness: t };
}
