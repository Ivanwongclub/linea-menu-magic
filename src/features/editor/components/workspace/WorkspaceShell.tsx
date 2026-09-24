import { useCallback, useRef, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { PanelRightOpen } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useWorkspaceLayout } from "../../hooks/useWorkspaceLayout";
import { widthFromDrag } from "../../lib/workspaceLayout";
import { DocumentBar } from "./DocumentBar";
import type { AutosaveStatus } from "../../hooks/useAutosaveDraft";

interface WorkspaceShellProps {
  banner?: ReactNode;
  viewport: ReactNode;
  panel: ReactNode;
  /**
   * The manufacturing verdict (E2 U10). It sits here rather than in the
   * viewport column because it judges the design, not the view, so it spans
   * the viewport *and* the controls. Not drawn under `?calibration=1`, as it
   * never was.
   */
  strip?: ReactNode;
  /**
   * What the document bar says (E2 U7). The shell renders the bar rather than
   * taking it as a node, because the workspace menu in it drives the layout
   * this component owns — two `useWorkspaceLayout` callers would be two
   * independent layouts.
   */
  document?: { name: string; saveStatus?: AutosaveStatus; designsLink?: boolean };
}

/**
 * The workspace (E2 U4). Full height below the site header, with the model on
 * one side and the controls on the other; which side, how wide, and whether
 * the controls are collapsed is the buyer's, remembered per user
 * (`useWorkspaceLayout`) and reset from the panel's own chrome.
 *
 * Fixed zones, not free docking (E2 §3.4 item 1): the panel takes the left or
 * the right edge and nothing else. Below `lg` there are no edges to take — the
 * panel stacks under the viewport as it always has, and only collapse is
 * offered, because on a phone the one thing worth doing is getting the
 * controls out of the way of the model.
 *
 * The fixed site header's height is one token (`--site-header-height`,
 * index.css), so the viewport's bottom edge can't drift below the fold.
 */
export function WorkspaceShell({ banner, viewport, panel, strip, document }: WorkspaceShellProps) {
  const { t } = useI18n();
  // Calibration screenshots are measured in pixels: they always get the
  // default layout, and the chrome that would change it is not drawn.
  const calibration = useSearchParams()[0].get("calibration") === "1";
  const { layout, setSide, setCollapsed, setWidth, reset } = useWorkspaceLayout(calibration);
  const row = useRef<HTMLDivElement>(null);

  const onResizePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const bounds = row.current?.getBoundingClientRect();
      if (!bounds) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      const onMove = (move: PointerEvent) => setWidth(widthFromDrag(layout.side, move.clientX, bounds.left, bounds.right));
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [layout.side, setWidth],
  );

  return (
    <div className="flex flex-col h-[calc(100vh-var(--site-header-height))]">
      {banner}
      {/* Suppressed under calibration with the rest of the chrome: the bar has
          height, and every render baseline is measured in pixels. */}
      {document && !calibration && (
        <DocumentBar
          name={document.name}
          saveStatus={document.saveStatus}
          designsLink={document.designsLink}
          side={layout.side}
          onDock={() => setSide(layout.side === "right" ? "left" : "right")}
          onCollapse={() => setCollapsed(true)}
          onReset={reset}
        />
      )}
      <div
        ref={row}
        data-testid="workspace"
        data-side={layout.side}
        data-collapsed={layout.collapsed}
        data-width={layout.widthPx}
        className={cn("flex flex-1 min-h-0 flex-col", layout.side === "left" ? "lg:flex-row-reverse" : "lg:flex-row")}
      >
        {/* `min-w-0`: the canvas keeps its own width, and without this the
            viewport column refuses to shrink and pushes the panel off-screen
            when it is widened. */}
        <div className="flex flex-col flex-1 min-h-0 min-w-0">{viewport}</div>

        {layout.collapsed ? (
          <div
            data-testid="workspace-rail"
            className={cn(
              "flex shrink-0 items-center justify-center border-border bg-background",
              "border-t py-1 lg:w-10 lg:flex-col lg:border-t-0 lg:py-2",
              layout.side === "left" ? "lg:border-r" : "lg:border-l",
            )}
          >
            <button
              type="button"
              data-testid="workspace-expand"
              aria-label={t("editor.workspace.expand")}
              title={t("editor.workspace.expand")}
              onClick={() => setCollapsed(false)}
              className="flex h-7 w-7 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <PanelRightOpen className="h-4 w-4" strokeWidth={1.5} />
            </button>
          </div>
        ) : (
          <div
            data-testid="workspace-panel"
            style={{ ["--workspace-panel-width" as string]: `${layout.widthPx}px` }}
            className={cn(
              "relative flex w-full max-h-[60%] shrink-0 flex-col border-border bg-background",
              "border-t lg:max-h-none lg:border-t-0 lg:w-[var(--workspace-panel-width)]",
              layout.side === "left" ? "lg:border-r" : "lg:border-l",
            )}
          >
            {/* U7 moved the chrome buttons into the document bar's workspace
                menu, which left a bar holding one word; U5 folded that word
                into the layers dock's own header, so the panel is its content
                and nothing else. */}
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">{panel}</div>

            {!calibration && (
              // The handle sits on the panel's inner edge; a drag away from the
              // panel's own side makes it wider.
              <div
                data-testid="workspace-resize"
                role="separator"
                aria-orientation="vertical"
                aria-label={t("editor.workspace.resize")}
                onPointerDown={onResizePointerDown}
                className={cn(
                  "absolute inset-y-0 z-10 hidden w-1.5 cursor-col-resize bg-transparent hover:bg-foreground/10 lg:block",
                  layout.side === "left" ? "right-0" : "left-0",
                )}
              />
            )}
          </div>
        )}
      </div>

      {/* Full width under the viewport and the controls both (E2 §3.4 item 6).
          Its height comes off the row above it, so the canvas is exactly as
          tall as it was when the strip lived inside the viewport column. */}
      {!calibration && strip}
    </div>
  );
}
