/**
 * The workspace's own state (E2 U4) — where the controls sit, not what they
 * say. Pure, so the rules it encodes are testable without a browser:
 *
 * - **Fixed zones, not free docking** (E2 §3.4 item 1). A 3D editor has two
 *   useful columns; the panel takes one side or the other, collapses, and
 *   resizes. Nothing docks to the top or the bottom.
 * - **Chrome only** (item 8). Nothing here touches the design, the selection
 *   or the camera, so restoring a layout can never change what gets made.
 * - **Versioned** (item 5). A stored layout from an older shape is discarded
 *   rather than half-restored, so a later change to these fields cannot leave
 *   someone with a dock that no longer exists.
 *
 * **Version 2 (E2 U11)** adds the phone's bottom sheet — its snap point and
 * its tab — and the dock's section state, which U5 left in component state.
 * One bump for both, as U5's open question 2 asked: a version stamp is cheap
 * to change once and expensive to change twice.
 */
export const WORKSPACE_LAYOUT_VERSION = 2;

/** The panel is a column: too narrow and the sliders stack, too wide and the model is a stamp. */
export const MIN_PANEL_PX = 280;
export const MAX_PANEL_PX = 560;
export const DEFAULT_PANEL_PX = 360;

/** Tailwind's `lg`. The workspace is two columns above it and a sheet below. */
export const WIDE_QUERY = "(min-width: 1024px)";

/**
 * What the viewport never drops below, in px (E2 §3.3). The sheet is clamped
 * to it rather than the other way round: the model is the thing being worked
 * on, and a sheet that covers it is a sheet nobody can aim at.
 */
export const VIEWPORT_FLOOR_PX = 200;

export type DockSide = "left" | "right";
export type SheetSnap = "peek" | "half" | "full";
export type SheetTab = "layers" | "properties" | "check";

export const SHEET_SNAPS: SheetSnap[] = ["peek", "half", "full"];
export const SHEET_TABS: SheetTab[] = ["layers", "properties", "check"];

/** Each snap's share of the row the viewport and the sheet divide between them. */
export const SHEET_SNAP_FRACTION: Record<SheetSnap, number> = { peek: 0.22, half: 0.5, full: 0.82 };

export interface WorkspaceSections {
  branding: boolean;
  zones: boolean;
  parts: boolean;
}

export interface WorkspaceLayout {
  version: number;
  side: DockSide;
  collapsed: boolean;
  widthPx: number;
  /** The layers dock's sections (E2 §3.4 item 3): Parts folded away by default. */
  sections: WorkspaceSections;
  snap: SheetSnap;
  tab: SheetTab;
}

export const DEFAULT_SECTIONS: WorkspaceSections = { branding: true, zones: true, parts: false };

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayout = {
  version: WORKSPACE_LAYOUT_VERSION,
  side: "right",
  collapsed: false,
  widthPx: DEFAULT_PANEL_PX,
  sections: DEFAULT_SECTIONS,
  snap: "half",
  tab: "layers",
};

/**
 * Per user, per device (E2 open question 1): a workspace is how someone has
 * arranged *this* screen, so it lives in `localStorage` and is keyed by who
 * they are. Signed out shares one key — an anonymous draft is one sitting.
 */
export function layoutStorageKey(userId: string | null | undefined): string {
  return `wincyc:workspace:v${WORKSPACE_LAYOUT_VERSION}:${userId || "anon"}`;
}

export function clampPanelWidth(px: number): number {
  if (!Number.isFinite(px)) return DEFAULT_PANEL_PX;
  return Math.min(MAX_PANEL_PX, Math.max(MIN_PANEL_PX, Math.round(px)));
}

/** A stored layout, or the default — never a partly-read one. */
export function parseLayout(raw: string | null | undefined): WorkspaceLayout {
  if (!raw) return DEFAULT_WORKSPACE_LAYOUT;
  try {
    const parsed = JSON.parse(raw) as Partial<WorkspaceLayout> | null;
    if (!parsed || parsed.version !== WORKSPACE_LAYOUT_VERSION) return DEFAULT_WORKSPACE_LAYOUT;
    const side: DockSide = parsed.side === "left" ? "left" : "right";
    const sections = parsed.sections;
    return {
      version: WORKSPACE_LAYOUT_VERSION,
      side,
      collapsed: parsed.collapsed === true,
      widthPx: clampPanelWidth(typeof parsed.widthPx === "number" ? parsed.widthPx : DEFAULT_PANEL_PX),
      sections: {
        branding: sections?.branding !== false,
        zones: sections?.zones !== false,
        parts: sections?.parts === true,
      },
      snap: SHEET_SNAPS.includes(parsed.snap as SheetSnap) ? (parsed.snap as SheetSnap) : DEFAULT_WORKSPACE_LAYOUT.snap,
      tab: SHEET_TABS.includes(parsed.tab as SheetTab) ? (parsed.tab as SheetTab) : DEFAULT_WORKSPACE_LAYOUT.tab,
    };
  } catch {
    return DEFAULT_WORKSPACE_LAYOUT;
  }
}

export function serializeLayout(layout: WorkspaceLayout): string {
  return JSON.stringify({ ...layout, version: WORKSPACE_LAYOUT_VERSION, widthPx: clampPanelWidth(layout.widthPx) });
}

/**
 * The width a drag lands on: the handle sits on the panel's inner edge, so a
 * drag away from the panel's own side makes it wider.
 */
export function widthFromDrag(side: DockSide, pointerX: number, containerLeft: number, containerRight: number): number {
  return clampPanelWidth(side === "right" ? containerRight - pointerX : pointerX - containerLeft);
}

/**
 * How tall the sheet is at a snap point, given the row it shares with the
 * viewport (E2 §3.3). The floor wins: at `full` on a short phone the sheet
 * gets whatever is left above 200 px of model, not its own fraction. Which is
 * why `full` and `half` can come out the same height on a small enough screen
 * — that is the clamp working, not a bug.
 */
export function sheetHeightPx(snap: SheetSnap, rowHeightPx: number, floorPx: number = VIEWPORT_FLOOR_PX): number {
  if (!Number.isFinite(rowHeightPx) || rowHeightPx <= 0) return 0;
  const wanted = Math.round(rowHeightPx * SHEET_SNAP_FRACTION[snap]);
  return Math.max(0, Math.min(wanted, Math.round(rowHeightPx - floorPx)));
}

/** The snap a drag lands on: whichever one the released height is nearest. */
export function snapFromHeight(heightPx: number, rowHeightPx: number, floorPx: number = VIEWPORT_FLOOR_PX): SheetSnap {
  let best: SheetSnap = SHEET_SNAPS[0];
  let bestGap = Infinity;
  for (const snap of SHEET_SNAPS) {
    const gap = Math.abs(sheetHeightPx(snap, rowHeightPx, floorPx) - heightPx);
    if (gap < bestGap) {
      bestGap = gap;
      best = snap;
    }
  }
  return best;
}

/** Tapping the grabber walks the snap points rather than opening a menu. */
export function nextSnap(snap: SheetSnap): SheetSnap {
  return SHEET_SNAPS[(SHEET_SNAPS.indexOf(snap) + 1) % SHEET_SNAPS.length];
}
