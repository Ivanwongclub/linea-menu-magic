import { useI18n } from "@/features/i18n/I18nProvider";
import { useDesignerStaffStatus } from "../hooks/useDesignerStaffStatus";
import { useLayerStrokes } from "../hooks/useLayerStrokes";
import { formatMm, hasThresholds, manufacturingWarnings, type ProcessThresholds } from "../lib/manufacturing";
import type { Layer } from "../lib/recipe";
import type { LogoSource } from "../hooks/useLogoAssets";

interface ManufacturingStripProps {
  layers: Layer[];
  /** The selected finish's process and its three tolerances; null off a metal product. */
  process: ProcessThresholds | null;
  /** The PAINT process's tolerances — what a printed layer is checked against (Phase 6a R4). */
  printProcess?: ProcessThresholds | null;
  /** Half the rendered part, mm — the edge-margin check's reference. */
  faceRadiusMm: number | null;
  logoSources: Record<string, LogoSource>;
}

/**
 * The manufacturing strip (v3-review §5, Phase 5 R3): a permanent line under
 * the viewport, live while the buyer drags, carrying WIN-CYC's own thresholds
 * for the selected finish's process — never the buyer's.
 *
 * A threshold that isn't set is not a pass: the check simply can't be made. A
 * buyer sees nothing (there is no honest thing to tell them); designer staff
 * see which process is missing its numbers, because filling them in is theirs
 * to do.
 */
export function ManufacturingStrip({ layers, process, printProcess = null, faceRadiusMm, logoSources }: ManufacturingStripProps) {
  const { t, language } = useI18n();
  const { isStaff } = useDesignerStaffStatus();
  const strokes = useLayerStrokes(layers, logoSources);

  const lines = manufacturingWarnings(
    layers.map((layer) => ({ layer, strokeMm: strokes[layer.id] ?? null })),
    process,
    faceRadiusMm,
    printProcess,
  );
  const warnings = lines.filter((line) => line.severity === "warning");
  // "…for roll plating", in the middle of a sentence.
  const lower = (name: string) => (language === "en" ? name.toLocaleLowerCase("en") : name);
  const processName = process ? lower(process.name) : "";
  const printProcessName = printProcess ? lower(printProcess.name) : "";
  const missing = !!process && !hasThresholds(process);

  return (
    <div
      className="shrink-0 border-t border-border bg-background px-3 py-1.5 min-h-[28px] text-[11px] leading-[1.35] text-foreground"
      data-testid="manufacturing-strip"
      data-warning-count={warnings.length}
      data-process={process?.name ?? undefined}
    >
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
      {missing && isStaff && (
        <p className="text-muted-foreground" data-testid="manufacturing-no-thresholds">
          {t("editor.manufacturing.noThresholds", { process: processName })}
        </p>
      )}
    </div>
  );
}
