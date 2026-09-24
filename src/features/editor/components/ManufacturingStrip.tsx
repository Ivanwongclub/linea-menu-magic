import { useMemo, useState } from "react";
import { ChevronUp, TriangleAlert } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useDesignerStaffStatus } from "../hooks/useDesignerStaffStatus";
import { selectZoneOverlaps, selectZones, useEditorStore } from "../store/useEditorStore";
import { useLayerStrokes } from "../hooks/useLayerStrokes";
import { useLogoSources } from "../hooks/useLogoAssets";
import { usePublicFinishes, PAINT_PROCESS } from "../hooks/usePublicFinishes";
import { formatMm, hasThresholds, manufacturingWarnings, processThresholds, type ProcessThresholds } from "../lib/manufacturing";
import type { Layer } from "../lib/recipe";

interface ManufacturingStripProps {
  layers: Layer[];
  /** The selected finish's process and its three tolerances; null off a metal product. */
  process: ProcessThresholds | null;
}

/** The phone breakpoint: below it the verdict is one line until it is asked for. */
const WIDE = "(min-width: 1024px)";

/**
 * The manufacturing strip (v3-review §5, Phase 5 R3): WIN-CYC's own thresholds
 * for the selected finish's process, live while the buyer drags — never the
 * buyer's numbers.
 *
 * **A verdict, not a panel** (E2 §3.4 item 6). Since U10 it spans the whole
 * workspace — the viewport *and* the controls — because what it reports is the
 * design's, not the model view's, and it collapses to a single line with a
 * count. On a phone it starts collapsed, or it eats the viewport it is judging.
 *
 * A threshold that isn't set is not a pass: the check simply can't be made. A
 * buyer sees nothing (there is no honest thing to tell them); designer staff
 * see which process is missing its numbers, because filling them in is theirs
 * to do.
 */
export function ManufacturingStrip({ layers, process }: ManufacturingStripProps) {
  const { t, language } = useI18n();
  const { isStaff } = useDesignerStaffStatus();
  const logoSources = useLogoSources(layers);
  const strokes = useLayerStrokes(layers, logoSources);
  // Phase 6a R4: a printed layer is checked against the PAINT process, which
  // the strip now looks up itself rather than being handed it by the viewport.
  const { data: publicFinishes } = usePublicFinishes();
  const printProcess = useMemo(
    () => processThresholds((publicFinishes ?? []).find((f) => f.process?.code === PAINT_PROCESS)?.process, language),
    [publicFinishes, language],
  );
  const modelSizeMm = useEditorStore((s) => s.modelSizeMm);
  const faceRadiusMm = modelSizeMm != null ? modelSizeMm / 2 : null;

  const [open, setOpen] = useState(() => {
    // Collapsed by default on a small screen only. Blocked or missing
    // `matchMedia` reads as a desk, which is the safer of the two: a verdict
    // shown is never worse than a verdict hidden.
    try {
      return window.matchMedia(WIDE).matches;
    } catch {
      return true;
    }
  });

  const lines = manufacturingWarnings(
    layers.map((layer) => ({ layer, strokeMm: strokes[layer.id]?.strokeMm ?? null, reachMm: strokes[layer.id]?.reachMm ?? null })),
    process,
    faceRadiusMm,
    printProcess,
  );
  const warnings = lines.filter((line) => line.severity === "warning");
  // 6b R2: zones are exclusive, so an overlap is a decision the buyer has not
  // made — the later zone wins, and the strip says which.
  const zones = useEditorStore(selectZones);
  const overlaps = useEditorStore(selectZoneOverlaps);
  const zoneName = (index: number) => zones[index]?.name ?? "";
  // "…for roll plating", in the middle of a sentence.
  const lower = (name: string) => (language === "en" ? name.toLocaleLowerCase("en") : name);
  const processName = process ? lower(process.name) : "";
  const printProcessName = printProcess ? lower(printProcess.name) : "";
  const missing = !!process && !hasThresholds(process);
  const count = warnings.length + overlaps.length;

  return (
    <div
      className="shrink-0 border-t border-border bg-background text-[11px] leading-[1.35] text-foreground"
      data-testid="manufacturing-strip"
      data-warning-count={count}
      data-collapsed={!open}
      data-process={process?.name ?? undefined}
    >
      {/* The verdict itself: a count, and the way to the lines behind it. */}
      <button
        type="button"
        data-testid="manufacturing-toggle"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary"
      >
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.manufacturing.check")}</span>
        <span
          data-testid="manufacturing-count"
          data-count={count}
          className={cn("flex items-center gap-1 tabular-nums", count > 0 ? "text-foreground" : "text-muted-foreground")}
        >
          {count > 0 && <TriangleAlert className="h-3 w-3" strokeWidth={1.5} />}
          {count > 0 ? count : t("editor.manufacturing.clear")}
        </span>
        <ChevronUp className={cn("ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", !open && "rotate-180")} strokeWidth={1.5} />
      </button>

      {open && (
        <div className="px-3 pb-1.5 min-h-[18px]" data-testid="manufacturing-lines">
          {lines.map((line) => (
            <p
              key={`${line.layerId}-${line.kind}`}
              data-testid={line.severity === "info" ? "manufacturing-info" : "manufacturing-warning"}
              data-kind={line.kind}
              data-severity={line.severity}
              data-layer-id={line.layerId}
              data-value-mm={line.valueMm}
              className={line.severity === "info" ? "text-muted-foreground" : undefined}
            >
              {t(line.key, {
                value: formatMm(line.valueMm),
                limit: formatMm(line.limitMm),
                process: line.kind === "stroke" && line.key === "editor.manufacturing.printStroke" ? printProcessName : processName,
                colour: line.colour ?? "",
              })}
            </p>
          ))}
          {overlaps.map(([first, second]) => (
            <p key={`overlap-${first}-${second}`} data-testid="manufacturing-warning" data-kind="zoneOverlap" data-severity="warning">
              {t("editor.manufacturing.zoneOverlap", { first: zoneName(first), second: zoneName(second) })}
            </p>
          ))}
          {missing && isStaff && (
            <p className="text-muted-foreground" data-testid="manufacturing-no-thresholds">
              {t("editor.manufacturing.noThresholds", { process: processName })}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
