/**
 * Which rows a long dock section actually puts in the DOM (E2 §3.4 item 3).
 * Pure, so the arithmetic is testable without a browser and without 500 rows
 * on screen.
 *
 * Below the threshold nothing is windowed: the Polo's 33 groups are a list,
 * not a scrolling problem, and a windowed list costs a fixed row height, a
 * scroll listener and two spacers. Past it — Phase 11's uploads are the reason
 * the threshold exists at all — only the rows in view plus an overscan are
 * rendered, and the rest are two padding rows, so the scrollbar still measures
 * the whole list and a row's position on screen is its position in the list.
 */
export const VIRTUALISE_ABOVE = 50;

/** A windowed row's height in px. The window is arithmetic, so it must be fixed. */
export const DOCK_ROW_PX = 26;

/** Rows kept either side of the viewport, so a fast scroll doesn't show a gap. */
export const DOCK_OVERSCAN = 6;

/** Rows to assume before the scroller has been measured (first paint, display:none). */
const UNMEASURED_ROWS = 12;

export interface RowWindow {
  /** First rendered row. */
  start: number;
  /** One past the last rendered row. */
  end: number;
  padTopPx: number;
  padBottomPx: number;
  /** False when every row is rendered — the list is short enough to leave alone. */
  virtualised: boolean;
}

/**
 * @param count       rows in the whole list
 * @param scrollTopPx how far the list's own top is above the scroller's top
 * @param viewportPx  the scroller's visible height
 */
export function rowWindow(
  count: number,
  scrollTopPx: number,
  viewportPx: number,
  rowPx: number = DOCK_ROW_PX,
  overscan: number = DOCK_OVERSCAN,
): RowWindow {
  const rows = Math.max(0, Math.floor(count));
  if (rows <= VIRTUALISE_ABOVE || rowPx <= 0) {
    return { start: 0, end: rows, padTopPx: 0, padBottomPx: 0, virtualised: false };
  }

  // A list long enough to window is windowed even before it has been measured:
  // rendering all 500 rows once, to find out how tall the box is, is the cost
  // this exists to avoid.
  const height = viewportPx > 0 ? viewportPx : rowPx * UNMEASURED_ROWS;
  const total = rows * rowPx;
  const top = Math.min(Math.max(0, Number.isFinite(scrollTopPx) ? scrollTopPx : 0), Math.max(0, total - height));
  const first = Math.floor(top / rowPx);
  const start = Math.max(0, first - overscan);
  const end = Math.min(rows, first + Math.ceil(height / rowPx) + overscan);

  return { start, end, padTopPx: start * rowPx, padBottomPx: (rows - end) * rowPx, virtualised: true };
}
