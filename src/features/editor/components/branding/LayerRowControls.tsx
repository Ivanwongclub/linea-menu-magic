import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useEditorStore } from "../../store/useEditorStore";
import { layerAppearance, layerRelief, type AppearanceMode, type Layer } from "../../lib/recipe";
import { PrecisionNumberInput } from "../controls/PrecisionNumberInput";
import { AppearanceControl } from "./AppearanceControl";
import type { LogoSource } from "../../hooks/useLogoAssets";

/**
 * The two decisions that ride a layer wherever it is shown (E2 U2): what it is
 * made of, and whether it stands up or is cut in. They live on the layer's row
 * today and move into the Properties panel in U6 — one component either way,
 * so the move is a change of parent, not a rewrite.
 */
const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

const RELIEF_TYPES = [
  { value: "emboss", label: "editor.branding.raised" },
  { value: "deboss", label: "editor.branding.engraved" },
  // Phase 6a R1: printed is a relief type of its own — flat, no depth.
  { value: "printed", label: "editor.branding.printed" },
] as const;

/**
 * R1: raised or engraved, and the depth (v3-review §3, MVP item 8/9). Typed,
 * because the factory quotes from it; the bevel sits behind "Position and
 * curve".
 */
export function ReliefRow({ layer, source }: { layer: Layer; source?: LogoSource }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);
  const relief = layerRelief(layer);
  // 6b R9: a bitmap has no outline to extrude or carve, so those two choices
  // are offered but disabled, with the reason beside them.
  const rasterOnly = source?.kind === "raster";

  return (
    <div className="flex items-center gap-2 border-t border-border px-1.5 py-1.5" data-testid="layer-relief" data-layer-id={layer.id} data-type={relief.type}>
      <div role="radiogroup" aria-label={t("editor.branding.relief")} className="flex border border-border" data-testid="relief-type">
        {RELIEF_TYPES.map((option) => {
          const active = relief.type === option.value;
          const disabled = rasterOnly && option.value !== "printed";
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              aria-disabled={disabled}
              disabled={disabled}
              title={disabled ? t("editor.branding.rasterReliefReason") : undefined}
              data-value={option.value}
              onClick={() => {
                if (disabled) return;
                updateLayer(layer.id, { relief: { type: option.value } });
                commit();
              }}
              className={cn(
                "px-2 py-0.5 text-[11px] tracking-[0.05em] transition-colors",
                active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed text-muted-foreground/40 hover:text-muted-foreground/40",
              )}
            >
              {t(option.label)}
            </button>
          );
        })}
        {rasterOnly && (
          <span className="px-2 py-0.5 text-[10px] text-muted-foreground" data-testid="relief-raster-reason">
            {t("editor.branding.rasterReliefReason")}
          </span>
        )}
      </div>
      {/* Printed ink has no depth to quote. */}
      {relief.type !== "printed" && (
        <>
          <span className={cn(FIELD_LABEL, "ml-auto")} id={`depth-label-${layer.id}`}>
            {t("editor.branding.depth")}
          </span>
          <PrecisionNumberInput
            value={relief.depth_mm}
            unit="mm"
            min={0}
            exclusiveMin
            max={5}
            ariaLabelledBy={`depth-label-${layer.id}`}
            testId="relief-depth-input"
            className="w-20 shrink-0"
            onChange={(depth_mm) => updateLayer(layer.id, { relief: { depth_mm } })}
            onCommit={commit}
          />
        </>
      )}
    </div>
  );
}

const LAYER_MODES: AppearanceMode[] = ["part", "plated", "paint", "printed"];

/**
 * Appearance, per layer (6a R1), through the shared control. A raster logo
 * prints its own pixels, so it is offered no ink colour (6b R5).
 */
export function AppearanceRow({ layer, source }: { layer: Layer; source?: LogoSource }) {
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);
  const raster = source?.kind === "raster";

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-t border-border px-1.5 py-1.5"
      data-testid="layer-appearance"
      data-layer-id={layer.id}
      data-mode={layerAppearance(layer).mode}
    >
      <AppearanceControl
        ownerId={layer.id}
        appearance={layerAppearance(layer)}
        modes={LAYER_MODES}
        colourDisabled={raster}
        onChange={(patch) => {
          updateLayer(layer.id, { appearance: patch });
          commit();
        }}
      />
    </div>
  );
}
