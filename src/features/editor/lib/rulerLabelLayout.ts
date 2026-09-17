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

export interface LabelItem {
  line: DimensionLine;
  /** `below`: centred under a horizontal line (beside it if the line runs vertically). `beside`: away from the centre. */
  place: "below" | "beside";
}

/**
 * Places each label against its own line, then — in order — moves it to the
 * nearest free slot: stepped away along its line's normal side (down for a
 * label below, then up; up and down beside) until it overlaps neither an
 * earlier label nor an obstacle (the on-model handles, 4i). Falls back to
 * the first slot when nothing within reach is free.
 */
export function layoutLabels(items: LabelItem[], centre: Point, obstacles: Rect[] = []): Rect[] {
  const placed: Rect[] = [];
  for (const { line, place } of items) {
    const base = place === "below" && runsHorizontally(line) ? belowLine(line) : besideLine(line, centre);
    const step = base.height + LABEL_GAP_PX;
    const offsets = place === "below" ? [0, 1, 2, 3, 4, -1, -2, -3, -4] : [0, -1, 1, -2, 2, -3, 3, -4, 4];
    const blocked = (r: Rect) => placed.some((o) => rectsOverlap(r, o)) || obstacles.some((o) => rectsOverlap(r, o));
    let chosen = base;
    for (const k of offsets) {
      const candidate = { ...base, y: base.y + k * step };
      if (!blocked(candidate)) {
        chosen = candidate;
        break;
      }
    }
    placed.push(chosen);
  }
  return placed;
}

/** The product's two dimensions (4e/4h). */
export function layoutRulerLabels(
  diameter: DimensionLine,
  thickness: DimensionLine,
  centre: Point,
  obstacles: Rect[] = [],
): { diameter: Rect; thickness: Rect } {
  const [d, t] = layoutLabels(
    [
      { line: diameter, place: "below" },
      { line: thickness, place: "beside" },
    ],
    centre,
    obstacles,
  );
  return { diameter: d, thickness: t };
}
