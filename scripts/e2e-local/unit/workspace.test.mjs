// E2 U4: the workspace layout's own rules — what is stored, what is refused,
// and what a drag lands on. E2 U5: which rows a long dock section renders.
// E2 U11: the sheet's snap points, and the viewport floor they never cross.
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { DOCK_OVERSCAN, DOCK_ROW_PX, VIRTUALISE_ABOVE, rowWindow } from "../../../src/features/editor/lib/rowWindow.ts";
import {
  DEFAULT_PANEL_PX,
  DEFAULT_SECTIONS,
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_PX,
  MIN_PANEL_PX,
  SHEET_SNAPS,
  SHEET_SNAP_FRACTION,
  VIEWPORT_FLOOR_PX,
  WORKSPACE_LAYOUT_VERSION,
  clampPanelWidth,
  layoutStorageKey,
  nextSnap,
  parseLayout,
  serializeLayout,
  sheetHeightPx,
  snapFromHeight,
  widthFromDrag,
} from "../../../src/features/editor/lib/workspaceLayout.ts";

test("U4: the key is per user and per layout version", () => {
  assert.equal(layoutStorageKey("2b9d"), `wincyc:workspace:v${WORKSPACE_LAYOUT_VERSION}:2b9d`);
  assert.equal(layoutStorageKey(null), `wincyc:workspace:v${WORKSPACE_LAYOUT_VERSION}:anon`);
  assert.notEqual(layoutStorageKey("a"), layoutStorageKey("b"), "two people never share a workspace");
});

test("U4: a stored layout comes back as it went in", () => {
  const layout = {
    version: WORKSPACE_LAYOUT_VERSION,
    side: "left",
    collapsed: true,
    widthPx: 420,
    sections: { branding: false, zones: true, parts: true },
    snap: "full",
    tab: "properties",
  };
  assert.deepEqual(parseLayout(serializeLayout(layout)), layout, "sections and the sheet ride with the rest (U11)");
});

test("U4: anything unreadable is the default, never a half-restored dock", () => {
  assert.deepEqual(parseLayout(null), DEFAULT_WORKSPACE_LAYOUT);
  assert.deepEqual(parseLayout(""), DEFAULT_WORKSPACE_LAYOUT);
  assert.deepEqual(parseLayout("{not json"), DEFAULT_WORKSPACE_LAYOUT);
  assert.deepEqual(parseLayout("null"), DEFAULT_WORKSPACE_LAYOUT);
  // A layout written by an older shape of this file is discarded whole.
  assert.deepEqual(parseLayout(JSON.stringify({ version: 0, side: "left", collapsed: true, widthPx: 500 })), DEFAULT_WORKSPACE_LAYOUT);
  // A side that isn't an edge, a width that isn't a number, a snap and a tab
  // that are not among the ones that exist.
  const odd = parseLayout(
    JSON.stringify({ version: WORKSPACE_LAYOUT_VERSION, side: "top", collapsed: "yes", widthPx: "wide", snap: "enormous", tab: "everything" }),
  );
  assert.deepEqual(odd, {
    version: WORKSPACE_LAYOUT_VERSION,
    side: "right",
    collapsed: false,
    widthPx: DEFAULT_PANEL_PX,
    sections: DEFAULT_SECTIONS,
    snap: DEFAULT_WORKSPACE_LAYOUT.snap,
    tab: DEFAULT_WORKSPACE_LAYOUT.tab,
  });
  // U11 bumped the version, so every U4-era layout is discarded whole rather
  // than restored without a sheet.
  assert.deepEqual(parseLayout(JSON.stringify({ version: 1, side: "left", collapsed: true, widthPx: 500 })), DEFAULT_WORKSPACE_LAYOUT);
});

test("U11: Parts is folded away by default and the rest are not", () => {
  assert.deepEqual(DEFAULT_SECTIONS, { branding: true, zones: true, parts: false });
  // An older stored layout with no sections at all still opens sensibly.
  const partial = parseLayout(JSON.stringify({ version: WORKSPACE_LAYOUT_VERSION, sections: {} }));
  assert.deepEqual(partial.sections, DEFAULT_SECTIONS, "a section nobody stored is its default, not false");
});

test("U11: the viewport floor wins every argument with the sheet", () => {
  // 844 px phone, less the site header, the document bar and a collapsed strip.
  for (const row of [300, 420, 560, 700, 844]) {
    for (const snap of SHEET_SNAPS) {
      const sheet = sheetHeightPx(snap, row);
      assert.ok(row - sheet >= VIEWPORT_FLOOR_PX - 0.5, `${snap} at row ${row} leaves ${row - sheet}px of model`);
      assert.ok(sheet >= 0, `${snap} at row ${row} is not negative`);
    }
  }
  // A row with no room to give: the sheet takes nothing rather than going
  // negative and pushing the viewport off the bottom.
  assert.equal(sheetHeightPx("full", 180), 0);
});

test("U11: the snap points are ordered, and `full` is the fraction until the floor bites", () => {
  const roomy = 1200;
  assert.ok(sheetHeightPx("peek", roomy) < sheetHeightPx("half", roomy));
  assert.ok(sheetHeightPx("half", roomy) < sheetHeightPx("full", roomy));
  assert.equal(sheetHeightPx("full", roomy), Math.round(roomy * SHEET_SNAP_FRACTION.full), "no clamp when there is room");
  // On a phone `full` and `half` can come out the same: that is the clamp.
  const tight = 500;
  assert.equal(sheetHeightPx("full", tight), tight - VIEWPORT_FLOOR_PX);
});

test("U11: a released drag lands on the nearest snap", () => {
  const row = 700;
  for (const snap of SHEET_SNAPS) {
    assert.equal(snapFromHeight(sheetHeightPx(snap, row), row), snap, `${snap} is its own nearest`);
  }
  assert.equal(snapFromHeight(0, row), "peek", "dragged shut is peek, the smallest that exists");
  assert.equal(snapFromHeight(row, row), "full");
});

test("U11: tapping the grabber walks the snap points and comes back round", () => {
  assert.deepEqual([nextSnap("peek"), nextSnap("half"), nextSnap("full")], ["half", "full", "peek"]);
});

test("U4: the panel stays a column", () => {
  assert.equal(clampPanelWidth(10), MIN_PANEL_PX);
  assert.equal(clampPanelWidth(9999), MAX_PANEL_PX);
  assert.equal(clampPanelWidth(400.4), 400);
  assert.equal(clampPanelWidth(Number.NaN), DEFAULT_PANEL_PX);
});

/** The window as rendered: every row that is in the DOM, plus the two spacers. */
const rendered = (count, scrollTop, viewport) => {
  const w = rowWindow(count, scrollTop, viewport);
  return { ...w, rows: w.end - w.start, heightPx: w.padTopPx + (w.end - w.start) * DOCK_ROW_PX + w.padBottomPx };
};

test("U5: a short list is left alone — the Polo's 33 groups are not a scrolling problem", () => {
  for (const count of [0, 1, 33, VIRTUALISE_ABOVE]) {
    assert.deepEqual(rowWindow(count, 0, 400), { start: 0, end: count, padTopPx: 0, padBottomPx: 0, virtualised: false }, `${count} rows`);
  }
  // One row past the threshold is where it starts (E2 §3.4 item 3, "~50").
  assert.equal(rowWindow(VIRTUALISE_ABOVE + 1, 0, 400).virtualised, true);
});

test("U5: a windowed list renders what is in view, and no more", () => {
  const count = 500;
  const viewport = DOCK_ROW_PX * 20;
  const top = rendered(count, 0, viewport);
  assert.equal(top.start, 0, "at the top there is nothing above to overscan into");
  assert.equal(top.end, 20 + DOCK_OVERSCAN);
  assert.ok(top.rows < count / 5, `${top.rows} of ${count} rows are in the DOM`);

  // Scrolled to row 100: the window follows, with an overscan either side.
  const mid = rendered(count, 100 * DOCK_ROW_PX, viewport);
  assert.equal(mid.start, 100 - DOCK_OVERSCAN);
  assert.equal(mid.end, 100 + 20 + DOCK_OVERSCAN);
  assert.equal(mid.padTopPx, (100 - DOCK_OVERSCAN) * DOCK_ROW_PX, "the rows above are represented, not rendered");
});

test("U5: the list is its full height whatever is rendered — the scrollbar stays honest", () => {
  const count = 500;
  const viewport = DOCK_ROW_PX * 20;
  for (const scrollTop of [0, 13, 500, 100 * DOCK_ROW_PX, count * DOCK_ROW_PX * 2]) {
    assert.equal(rendered(count, scrollTop, viewport).heightPx, count * DOCK_ROW_PX, `scrolled to ${scrollTop}`);
  }
});

test("U5: the window is clamped to the list at both ends", () => {
  const count = 60;
  const viewport = DOCK_ROW_PX * 20;
  // Scrolled past the bottom (an over-scroll, or a list that shrank under it).
  const end = rowWindow(count, count * DOCK_ROW_PX * 3, viewport);
  assert.equal(end.end, count, "never past the last row");
  assert.equal(end.padBottomPx, 0);
  // Scrolled above the top: a section still below the fold reads negative.
  const above = rowWindow(count, -400, viewport);
  assert.deepEqual([above.start, above.padTopPx], [0, 0], "never before the first row");
});

test("U5: an unmeasured box still windows, rather than rendering 500 rows to find its height", () => {
  const w = rowWindow(500, 0, 0);
  assert.equal(w.virtualised, true);
  assert.ok(w.end - w.start < 40, `${w.end - w.start} rows on first paint`);
  assert.equal(w.padBottomPx, (500 - w.end) * DOCK_ROW_PX);
});

test("U4: a drag away from the panel's own side widens it", () => {
  // A 1440-wide workspace: the handle is on the panel's inner edge.
  assert.equal(widthFromDrag("right", 1040, 0, 1440), 400, "docked right, dragging left widens");
  assert.equal(widthFromDrag("right", 1240, 0, 1440), 280, "and dragging right narrows to the floor");
  assert.equal(widthFromDrag("left", 400, 0, 1440), 400, "docked left, dragging right widens");
  assert.equal(widthFromDrag("left", 60, 0, 1440), MIN_PANEL_PX, "never below the floor");
  assert.equal(widthFromDrag("right", 100, 0, 1440), MAX_PANEL_PX, "never above the ceiling");
});
