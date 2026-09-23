// E2 U4: the workspace layout's own rules — what is stored, what is refused,
// and what a drag lands on.
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_PANEL_PX,
  DEFAULT_WORKSPACE_LAYOUT,
  MAX_PANEL_PX,
  MIN_PANEL_PX,
  WORKSPACE_LAYOUT_VERSION,
  clampPanelWidth,
  layoutStorageKey,
  parseLayout,
  serializeLayout,
  widthFromDrag,
} from "../../../src/features/editor/lib/workspaceLayout.ts";

test("U4: the key is per user and per layout version", () => {
  assert.equal(layoutStorageKey("2b9d"), `wincyc:workspace:v${WORKSPACE_LAYOUT_VERSION}:2b9d`);
  assert.equal(layoutStorageKey(null), `wincyc:workspace:v${WORKSPACE_LAYOUT_VERSION}:anon`);
  assert.notEqual(layoutStorageKey("a"), layoutStorageKey("b"), "two people never share a workspace");
});

test("U4: a stored layout comes back as it went in", () => {
  const layout = { version: WORKSPACE_LAYOUT_VERSION, side: "left", collapsed: true, widthPx: 420 };
  assert.deepEqual(parseLayout(serializeLayout(layout)), layout);
});

test("U4: anything unreadable is the default, never a half-restored dock", () => {
  assert.deepEqual(parseLayout(null), DEFAULT_WORKSPACE_LAYOUT);
  assert.deepEqual(parseLayout(""), DEFAULT_WORKSPACE_LAYOUT);
  assert.deepEqual(parseLayout("{not json"), DEFAULT_WORKSPACE_LAYOUT);
  assert.deepEqual(parseLayout("null"), DEFAULT_WORKSPACE_LAYOUT);
  // A layout written by an older shape of this file is discarded whole.
  assert.deepEqual(parseLayout(JSON.stringify({ version: 0, side: "left", collapsed: true, widthPx: 500 })), DEFAULT_WORKSPACE_LAYOUT);
  // A side that isn't an edge, and a width that isn't a number.
  const odd = parseLayout(JSON.stringify({ version: WORKSPACE_LAYOUT_VERSION, side: "top", collapsed: "yes", widthPx: "wide" }));
  assert.deepEqual(odd, { version: WORKSPACE_LAYOUT_VERSION, side: "right", collapsed: false, widthPx: DEFAULT_PANEL_PX });
});

test("U4: the panel stays a column", () => {
  assert.equal(clampPanelWidth(10), MIN_PANEL_PX);
  assert.equal(clampPanelWidth(9999), MAX_PANEL_PX);
  assert.equal(clampPanelWidth(400.4), 400);
  assert.equal(clampPanelWidth(Number.NaN), DEFAULT_PANEL_PX);
});

test("U4: a drag away from the panel's own side widens it", () => {
  // A 1440-wide workspace: the handle is on the panel's inner edge.
  assert.equal(widthFromDrag("right", 1040, 0, 1440), 400, "docked right, dragging left widens");
  assert.equal(widthFromDrag("right", 1240, 0, 1440), 280, "and dragging right narrows to the floor");
  assert.equal(widthFromDrag("left", 400, 0, 1440), 400, "docked left, dragging right widens");
  assert.equal(widthFromDrag("left", 60, 0, 1440), MIN_PANEL_PX, "never below the floor");
  assert.equal(widthFromDrag("right", 100, 0, 1440), MAX_PANEL_PX, "never above the ceiling");
});
