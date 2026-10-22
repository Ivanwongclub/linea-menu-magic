import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import {
  SHEET_TABS,
  VIEWPORT_FLOOR_PX,
  nextSnap,
  sheetHeightPx,
  snapFromHeight,
  type SheetSnap,
  type SheetTab,
} from "../../lib/workspaceLayout";

/**
 * The phone's controls (E2 §3.3, U11): one sheet under the viewport with three
 * snap points and a segmented control, instead of the docked column a phone has
 * no room for.
 *
 * **The viewport floor is enforced here, in pixels.** `sheetHeightPx` clamps
 * every snap to whatever leaves 200 px of model, so `full` on a short phone is
 * simply "as tall as it can be" rather than its own fraction — the sheet never
 * wins an argument with the thing being designed. The row it measures is the
 * one it shares with the viewport, so expanding the manufacturing strip (which
 * sits outside that row) shrinks the sheet as well as the viewport, and the
 * floor still holds.
 */
export function BottomSheet({
  rowRef,
  snap,
  onSnap,
  tab,
  onTab,
  children,
}: {
  /** The box the viewport and the sheet divide between them. */
  rowRef: RefObject<HTMLElement | null>;
  snap: SheetSnap;
  onSnap: (snap: SheetSnap) => void;
  tab: SheetTab;
  onTab: (tab: SheetTab) => void;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const [rowHeight, setRowHeight] = useState(0);
  // Non-null only while a drag is in progress; the snap owns the height otherwise.
  const [draggedPx, setDraggedPx] = useState<number | null>(null);
  const dragged = useRef(false);

  // The row changes height when the strip opens, the address bar hides, or the
  // phone turns — and the floor is only honest if it is remeasured each time.
  useEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    const measure = () => setRowHeight(row.getBoundingClientRect().height);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(row);
    return () => observer.disconnect();
  }, [rowRef]);

  const height = draggedPx ?? sheetHeightPx(snap, rowHeight);

  const onGrabberPointerDown = useCallback(
    (event: React.PointerEvent<HTMLButtonElement>) => {
      const row = rowRef.current?.getBoundingClientRect();
      if (!row) return;
      dragged.current = false;
      event.currentTarget.setPointerCapture(event.pointerId);
      const startY = event.clientY;
      const startHeight = sheetHeightPx(snap, row.height);
      const onMove = (move: PointerEvent) => {
        if (Math.abs(move.clientY - startY) > 3) dragged.current = true;
        // Dragging up grows the sheet; it never takes the floor.
        setDraggedPx(Math.max(0, Math.min(startHeight + (startY - move.clientY), row.height - VIEWPORT_FLOOR_PX)));
      };
      const onUp = (up: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setDraggedPx(null);
        // A tap walks the snap points; a drag lands on the nearest one.
        if (!dragged.current) onSnap(nextSnap(snap));
        else onSnap(snapFromHeight(Math.max(0, startHeight + (startY - up.clientY)), row.height));
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [rowRef, snap, onSnap],
  );

  return (
    <div
      data-testid="workspace-sheet"
      data-snap={snap}
      data-tab={tab}
      data-height={Math.round(height)}
      style={{ height: `${height}px` }}
      className="flex w-full shrink-0 flex-col border-t border-border bg-background lg:hidden"
    >
      <button
        type="button"
        data-testid="sheet-grabber"
        aria-label={t("editor.workspace.sheetHandle")}
        title={t("editor.workspace.sheetHandle")}
        onPointerDown={onGrabberPointerDown}
        className="flex w-full shrink-0 touch-none items-center justify-center py-1.5"
      >
        <span className="h-1 w-10 rounded-full bg-border" />
      </button>

      <div className="flex shrink-0 border-b border-border" data-testid="sheet-tabs" role="tablist">
        {SHEET_TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            data-testid="sheet-tab"
            data-tab={value}
            data-selected={tab === value}
            aria-selected={tab === value}
            onClick={() => onTab(value)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1 border-b-2 px-2 py-1.5 text-[11px] uppercase tracking-[0.1em] transition-colors",
              tab === value ? "border-foreground text-foreground" : "border-transparent text-muted-foreground",
            )}
          >
            {t(value === "layers" ? "editor.layers.title" : value === "properties" ? "editor.properties.title" : "editor.manufacturing.check")}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden" data-testid="sheet-body">
        {children}
      </div>
    </div>
  );
}
