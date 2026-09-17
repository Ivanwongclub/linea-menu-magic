/**
 * Smallest stroke width of a filled outline (Phase 5 R3) — the inset test of
 * §14T, done properly: a stroke is `w` wide where a disc of radius `w / 2`
 * fits inside it and covers it.
 *
 * The shape is rasterised, every inside sample gets its exact distance to the
 * boundary, and a radius `r` "fits" when every inside sample that is at least
 * `RIDGE` of `r` away from the boundary is covered by some disc of radius `r`
 * lying inside the shape. That last clause is what keeps a convex corner —
 * whose tip no disc can cover — from reading as a hairline: a point in a
 * corner sliver is always much closer to the boundary than the disc it fails,
 * while the centre line of a thin stroke is exactly its own disc's radius from
 * the boundary. A binary search over `r` returns the largest one that fits.
 *
 * Pure maths over arrays — no three.js and no DOM, so the node unit tests and
 * the manufacturing strip share it.
 */

/** A closed ring, in whatever unit the caller measures in; the first point is not repeated. */
export type Ring = [number, number][];

/** Outer ring and its holes: a glyph, or one path of an SVG. */
export interface Outline {
  outer: Ring;
  holes: Ring[];
}

/** Grid cells across the longer side of the bounding box. */
export const STROKE_GRID = 320;
/**
 * How far from the boundary an uncovered sample must be, as a fraction of the
 * radius it failed, to count as a thin stroke rather than a corner sliver.
 * A 20° spike still counts (1 − sin 10° = 0.83); a 30° corner does not (0.74).
 */
export const RIDGE = 0.8;

interface Grid {
  width: number;
  height: number;
  cell: number;
  inside: Uint8Array;
}

function rings(outlines: Outline[]): Ring[] {
  return outlines.flatMap((o) => [o.outer, ...o.holes]).filter((ring) => ring.length >= 3);
}

/** Even-odd fill at cell centres: orientation-free, so a caller's winding never matters. */
function rasterize(outlines: Outline[], gridCells: number): Grid | null {
  const all = rings(outlines);
  if (all.length === 0) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const ring of all) {
    for (const [x, y] of ring) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  const extent = Math.max(maxX - minX, maxY - minY);
  if (!(extent > 0)) return null;
  const cell = extent / gridCells;
  // One cell of margin on every side, so the outside is always reachable.
  const width = Math.ceil((maxX - minX) / cell) + 3;
  const height = Math.ceil((maxY - minY) / cell) + 3;
  const inside = new Uint8Array(width * height);
  const x0 = minX - 1.5 * cell;
  const y0 = minY - 1.5 * cell;

  const xs: number[] = [];
  for (let row = 0; row < height; row++) {
    const y = y0 + (row + 0.5) * cell;
    xs.length = 0;
    for (const ring of all) {
      for (let i = 0; i < ring.length; i++) {
        const [ax, ay] = ring[i];
        const [bx, by] = ring[(i + 1) % ring.length];
        if (ay === by) continue;
        if (y < Math.min(ay, by) || y >= Math.max(ay, by)) continue;
        xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
      }
    }
    if (xs.length < 2) continue;
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const from = Math.max(0, Math.ceil((xs[k] - x0) / cell - 0.5));
      const to = Math.min(width - 1, Math.floor((xs[k + 1] - x0) / cell - 0.5));
      for (let col = from; col <= to; col++) inside[row * width + col] = 1;
    }
  }
  return { width, height, cell, inside };
}

const INF = 1e12;

/** Felzenszwalb & Huttenlocher: exact squared Euclidean distance transform of `f`, in cells. */
function edt(f: Float64Array, width: number, height: number): Float64Array {
  const out = Float64Array.from(f);
  const size = Math.max(width, height);
  const d = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);

  const pass = (n: number, get: (i: number) => number, set: (i: number, value: number) => void) => {
    for (let i = 0; i < n; i++) d[i] = get(i);
    let k = 0;
    v[0] = 0;
    z[0] = -INF;
    z[1] = INF;
    for (let q = 1; q < n; q++) {
      let s = (d[q] + q * q - (d[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (s <= z[k]) {
        k--;
        s = (d[q] + q * q - (d[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = s;
      z[k + 1] = INF;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      set(q, (q - v[k]) * (q - v[k]) + d[v[k]]);
    }
  };

  for (let col = 0; col < width; col++) {
    pass(
      height,
      (row) => out[row * width + col],
      (row, value) => {
        out[row * width + col] = value;
      },
    );
  }
  for (let row = 0; row < height; row++) {
    const offset = row * width;
    pass(
      width,
      (col) => out[offset + col],
      (col, value) => {
        out[offset + col] = value;
      },
    );
  }
  return out;
}

/** Distance from each inside cell to the nearest outside cell centre, in cells. */
function insideDistance(grid: Grid): Float64Array {
  const f = new Float64Array(grid.width * grid.height);
  for (let i = 0; i < f.length; i++) f[i] = grid.inside[i] ? INF : 0;
  const sq = edt(f, grid.width, grid.height);
  const out = new Float64Array(sq.length);
  // The boundary runs between the two cell centres, half a cell in.
  for (let i = 0; i < sq.length; i++) out[i] = grid.inside[i] ? Math.max(0, Math.sqrt(sq[i]) - 0.5) : 0;
  return out;
}

/** True when a disc of radius `r` (cells) fits everywhere the shape is more than `RIDGE · r` thick. */
function radiusFits(grid: Grid, distance: Float64Array, r: number): boolean {
  const seeds = new Float64Array(distance.length);
  let any = false;
  for (let i = 0; i < distance.length; i++) {
    const seed = grid.inside[i] && distance[i] >= r;
    if (seed) any = true;
    seeds[i] = seed ? 0 : INF;
  }
  if (!any) return false;
  const sq = edt(seeds, grid.width, grid.height);
  // Half a cell of slack: a disc centre can land between two sample points.
  const reach = (r + 0.5) * (r + 0.5);
  for (let i = 0; i < sq.length; i++) {
    if (!grid.inside[i]) continue;
    if (sq[i] <= reach) continue;
    if (distance[i] >= RIDGE * r) return false;
  }
  return true;
}

/** Radii are walked upward by this ratio until one stops fitting, then bracketed. */
const SCAN_RATIO = 1.12;

/**
 * The narrowest stroke in `outlines`, in the caller's own units, or null when
 * there is nothing to measure. `gridCells` trades accuracy for time — the
 * default holds ~1% on a glyph.
 *
 * The radius is walked up from one cell, never down: the *first* radius that
 * stops fitting is the narrowest feature, and a wider part of the same glyph
 * can well fit a radius that a hairline elsewhere has already failed.
 */
export function minStrokeWidth(outlines: Outline[], gridCells = STROKE_GRID): number | null {
  const grid = rasterize(outlines, gridCells);
  if (!grid) return null;
  const distance = insideDistance(grid);
  let maxD = 0;
  for (let i = 0; i < distance.length; i++) if (distance[i] > maxD) maxD = distance[i];
  if (maxD <= 0) return null;

  const fits = (r: number) => radiusFits(grid, distance, r);
  let low = 0;
  let high = 0;
  for (let r = 0.75; r <= maxD; r *= SCAN_RATIO) {
    if (!fits(r)) {
      high = r;
      break;
    }
    low = r;
  }
  // Nothing thinner than the largest disc the shape holds: a plain blob, whose
  // narrowest "stroke" is that disc's diameter.
  if (high === 0) return 2 * maxD * grid.cell;
  for (let i = 0; i < 10 && low > 0; i++) {
    const mid = (low + high) / 2;
    if (fits(mid)) low = mid;
    else high = mid;
  }
  return 2 * high * grid.cell;
}
