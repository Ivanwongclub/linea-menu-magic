import { Maximize2, RotateCcw } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useEditorStore } from "../store/useEditorStore";
import { RulerToggle } from "./RulerToggle";

/**
 * The floating view tools (E2 U9), bottom-right over the viewport.
 *
 * **This retires Phase 3 R2, "no floating toolbar over the viewport."** R2 was
 * written when there were no view tools to put in one and a toolbar would have
 * been a box of disabled buttons; it is retired deliberately here, with the
 * cluster held to what E2 §3.4 item 4 allows — *view* tools only. Reset view,
 * zoom to fit and the ruler change where the model is looked at from; they
 * change nothing about what gets made. Undo and redo are document verbs and
 * stayed in the document bar in U7.
 *
 * The brush size joins the cluster only while a paint zone is armed, because
 * that is the one moment the pointer is on the model and the control is a
 * hand's width away in the panel. The zone's own `zone-brush` stays where it
 * is: same value, two places to reach it, like the two part-visibility
 * controls (standing ruling 5).
 *
 * `EditorViewport` does not render this under `?calibration=1`: the cluster is
 * chrome over the canvas, and every render baseline is measured in pixels.
 */
export function ViewportTools({
  ruler,
  onRulerToggle,
  onResetView,
  onZoomToFit,
  canFit,
}: {
  ruler: boolean;
  onRulerToggle: () => void;
  onResetView: () => void;
  onZoomToFit: () => void;
  /** False until the model has reported its bounds — there is nothing to fit to yet. */
  canFit: boolean;
}) {
  const { t } = useI18n();
  const paintZoneId = useEditorStore((s) => s.paintZoneId);
  const brushRadiusMm = useEditorStore((s) => s.brushRadiusMm);
  const setBrushRadius = useEditorStore((s) => s.setBrushRadius);

  return (
    <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2" data-testid="viewport-toolbar">
      {paintZoneId && (
        <label
          className="flex items-center gap-1.5 border border-border bg-background/90 px-2.5 py-1.5 text-xs tracking-wide text-foreground"
          data-testid="viewport-brush"
          data-value={brushRadiusMm}
        >
          {t("editor.zones.brush")}
          <input
            type="range"
            data-testid="viewport-brush-input"
            aria-label={t("editor.zones.brush")}
            min={0.2}
            max={5}
            step={0.1}
            value={brushRadiusMm}
            onChange={(event) => setBrushRadius(Number(event.target.value))}
            className="w-20 accent-foreground"
          />
          <span className="tabular-nums text-muted-foreground">{brushRadiusMm.toFixed(1)}</span>
        </label>
      )}

      <div className="flex items-center border border-border bg-background/90">
        <ToolButton testId="view-reset" label={t("editor.viewport.resetView")} onClick={onResetView}>
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolButton>
        <ToolButton testId="view-fit" label={t("editor.viewport.zoomToFit")} onClick={onZoomToFit} disabled={!canFit}>
          <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </ToolButton>
      </div>

      <RulerToggle active={ruler} onToggle={onRulerToggle} />
    </div>
  );
}

function ToolButton({
  testId,
  label,
  disabled,
  onClick,
  children,
}: {
  testId: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex h-[30px] w-[30px] items-center justify-center text-foreground transition-colors",
        "hover:bg-secondary disabled:text-muted-foreground disabled:hover:bg-transparent",
      )}
    >
      {children}
    </button>
  );
}
