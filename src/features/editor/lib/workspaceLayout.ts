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
 */
export const WORKSPACE_LAYOUT_VERSION = 1;

/** The panel is a column: too narrow and the sliders stack, too wide and the model is a stamp. */
export const MIN_PANEL_PX = 280;
export const MAX_PANEL_PX = 560;
export const DEFAULT_PANEL_PX = 360;

export type DockSide = "left" | "right";

export interface WorkspaceLayout {
  version: number;
  side: DockSide;
  collapsed: boolean;
  widthPx: number;
}

export const DEFAULT_WORKSPACE_LAYOUT: WorkspaceLayout = {
  version: WORKSPACE_LAYOUT_VERSION,
  side: "right",
  collapsed: false,
  widthPx: DEFAULT_PANEL_PX,
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
    return {
      version: WORKSPACE_LAYOUT_VERSION,
      side,
      collapsed: parsed.collapsed === true,
      widthPx: clampPanelWidth(typeof parsed.widthPx === "number" ? parsed.widthPx : DEFAULT_PANEL_PX),
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
