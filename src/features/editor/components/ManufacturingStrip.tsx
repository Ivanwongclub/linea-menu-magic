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
import { useWorkspace } from "./workspace/WorkspaceContext";

interface ManufacturingStripProps {
  layers: Layer[];
  /** The selected finish's process and its three tolerances; null off a metal product. */
  process: ProcessThresholds | null;
}

/**
 * What the strip has to say, computed once and rendered in one of two places:
 * the strip itself on a desk, and the sheet's Check segment on a phone (U11).
 * Never both — two copies of a verdict is two `manufacturing-warning` rows for
 * anything counting them.
 */
function useManufacturingVerdict(layers: Layer[], process: ProcessThresholds | null) {
  const { language } = useI18n();
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
  const zones = useEditorStore(selectZones);
  const overlaps = useEditorStore(selectZoneOverlaps);

  const lines = manufacturingWarnings(
    layers.map((layer) => ({ layer, strokeMm: strokes[layer.id]?.strokeMm ?? null, reachMm: strokes[layer.id]?.reachMm ?? null })),
    process,
    modelSizeMm != null ? modelSizeMm / 2 : null,
    printProcess,
  );
  const warnings = lines.filter((line) => line.severity === "warning");
  // "…for roll plating", in the middle of a sentence.
  const lower = (name: string) => (language === "en" ? name.toLocaleLowerCase("en") : name);

  return {
    lines,
    overlaps,
    zoneName: (index: number) => zones[index]?.name ?? "",
    count: warnings.length + overlaps.length,
    processName: process ? lower(process.name) : "",
    printProcessName: printProcess ? lower(printProcess.name) : "",
    // A threshold that isn't set is not a pass: the check simply can't be
    // made. A buyer sees nothing (there is no honest thing to tell them);
    // designer staff see which process is missing its numbers, because
    // filling them in is theirs to do.
    missing: !!process && !hasThresholds(process) && isStaff,
  };
}

/** The verdict's lines, wherever they are being shown. */
export function ManufacturingLines({ layers, process }: ManufacturingStripProps) {
  const { t } = useI18n();
  const verdict = useManufacturingVerdict(layers, process);

  return (
    <div className="px-3 py-1.5 min-h-[18px] text-[11px] leading-[1.35] text-foreground" data-testid="manufacturing-lines">
      {verdict.lines.map((line) => (
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
            process: line.kind === "stroke" && line.key === "editor.manufacturing.printStroke" ? verdict.printProcessName : verdict.processName,
            colour: line.colour ?? "",
          })}
        </p>
      ))}
      {verdict.overlaps.map(([first, second]) => (
        <p key={`overlap-${first}-${second}`} data-testid="manufacturing-warning" data-kind="zoneOverlap" data-severity="warning">
          {t("editor.manufacturing.zoneOverlap", { first: verdict.zoneName(first), second: verdict.zoneName(second) })}
        </p>
      ))}
      {verdict.missing && (
        <p className="text-muted-foreground" data-testid="manufacturing-no-thresholds">
          {t("editor.manufacturing.noThresholds", { process: verdict.processName })}
        </p>
      )}
    </div>
  );
}

/**
 * The manufacturing strip (v3-review §5, Phase 5 R3): WIN-CYC's own thresholds
 * for the selected finish's process, live while the buyer drags — never the
 * buyer's numbers.
 *
 * **A verdict, not a panel** (E2 §3.4 item 6). Since U10 it spans the whole
 * workspace — the viewport *and* the controls — because what it reports is the
 * design's, not the model view's, and it collapses to a single line with a
 * count. Since U11 the phone's copy is the verdict alone: its lines are the
 * sheet's Check segment, so tapping the bar takes the buyer there instead of
 * growing a strip over the model it is judging.
 */
export function ManufacturingStrip({ layers, process }: ManufacturingStripProps) {
  const { t } = useI18n();
  const { wide, setTab } = useWorkspace();
  const verdict = useManufacturingVerdict(layers, process);
  const [open, setOpen] = useState(true);
  // On a phone the lines are the sheet's Check segment, so the bar is the
  // verdict and nothing else — which is E2 §3.4 item 6's "collapsed by
  // default on small screens", made structural rather than a default anyone
  // can undo into a strip that eats the viewport.
  const showsLines = wide && open;

  return (
    <div
      className="shrink-0 border-t border-border bg-background text-[11px] leading-[1.35] text-foreground"
      data-testid="manufacturing-strip"
      data-warning-count={verdict.count}
      data-collapsed={!showsLines}
      data-process={process?.name ?? undefined}
    >
      <button
        type="button"
        data-testid="manufacturing-toggle"
        aria-expanded={showsLines}
        onClick={() => (wide ? setOpen((v) => !v) : setTab("check"))}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-secondary"
      >
        <span className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.manufacturing.check")}</span>
        <span
          data-testid="manufacturing-count"
          data-count={verdict.count}
          className={cn("flex items-center gap-1 tabular-nums", verdict.count > 0 ? "text-foreground" : "text-muted-foreground")}
        >
          {verdict.count > 0 && <TriangleAlert className="h-3 w-3" strokeWidth={1.5} />}
          {verdict.count > 0 ? verdict.count : t("editor.manufacturing.clear")}
        </span>
        <ChevronUp className={cn("ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", !showsLines && "rotate-180")} strokeWidth={1.5} />
      </button>

      {showsLines && <ManufacturingLines layers={layers} process={process} />}
    </div>
  );
}
