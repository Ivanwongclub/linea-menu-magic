import { useI18n } from "@/features/i18n/I18nProvider";
import { useDesignerStaffStatus } from "../hooks/useDesignerStaffStatus";
import { useLayerStrokes } from "../hooks/useLayerStrokes";
import { formatMm, hasThresholds, manufacturingWarnings, type ProcessThresholds } from "../lib/manufacturing";
import type { Layer } from "../lib/recipe";

interface ManufacturingStripProps {
  layers: Layer[];
  /** The selected finish's process and its three tolerances; null off a metal product. */
  process: ProcessThresholds | null;
  /** Half the rendered part, mm — the edge-margin check's reference. */
  faceRadiusMm: number | null;
  logoSources: Record<string, string>;
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
export function ManufacturingStrip({ layers, process, faceRadiusMm, logoSources }: ManufacturingStripProps) {
  const { t, language } = useI18n();
  const { isStaff } = useDesignerStaffStatus();
  const strokes = useLayerStrokes(layers, logoSources);

  const warnings = manufacturingWarnings(
    layers.map((layer) => ({ layer, strokeMm: strokes[layer.id] ?? null })),
    process,
    faceRadiusMm,
  );
  // "…for roll plating", in the middle of a sentence.
  const processName = process ? (language === "en" ? process.name.toLocaleLowerCase("en") : process.name) : "";
  const missing = !!process && !hasThresholds(process);

  return (
    <div
      className="shrink-0 border-t border-border bg-background px-3 py-1.5 min-h-[28px] text-[11px] leading-[1.35] text-foreground"
      data-testid="manufacturing-strip"
      data-warning-count={warnings.length}
      data-process={process?.name ?? undefined}
    >
      {warnings.map((warning) => (
        <p key={`${warning.layerId}-${warning.kind}`} data-testid="manufacturing-warning" data-kind={warning.kind} data-layer-id={warning.layerId} data-value-mm={warning.valueMm}>
          {t(warning.key, { value: formatMm(warning.valueMm), limit: formatMm(warning.limitMm), process: processName })}
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
