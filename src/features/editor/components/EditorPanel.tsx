import { useState, type ReactNode } from "react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/features/i18n/I18nProvider";
import { FinishSwatch } from "@/features/finishes/FinishSwatch";
import { FinishSelectionPicker } from "@/features/finishes/FinishSelectionPicker";
import { finishAxisLine, finishMarketingName } from "@/features/finishes/finishAxisLine";
import { tradeLigne } from "../lib/ligne";
import { processThresholds } from "../lib/manufacturing";
import { LayersDock } from "./workspace/LayersDock";
import { PropertiesPanel } from "./workspace/PropertiesPanel";
import { OutputDock, type OutputSection } from "./workspace/OutputDock";
import { VersionsSection } from "./workspace/VersionsSection";
import type { PickerFinish } from "../hooks/useFinishOptions";
import type { EditorColour, EditorProduct, EditorSizeVariant } from "../hooks/useEditorProduct";
import { useEditorStore } from "../store/useEditorStore";
import { ModelColourControl } from "./ModelColourControl";

interface EditorPanelProps {
  product: EditorProduct;
  sizeVariantId: string | null;
  onSizeVariantChange: (id: string) => void;
  finishOptions: PickerFinish[];
  selectedFinish: PickerFinish | null;
  onSelectFinish: (finish: PickerFinish) => void;
  selectedColour: EditorColour | null;
  localModelName?: string;
  appearanceMode?: "source" | "finish" | "colour";
  onAppearanceModeChange?: (mode: "source" | "finish" | "colour") => void;
  /** Phase 7: the design versions belong to. Null on the anonymous `/new` path, which has nothing to version yet. */
  designId?: string | null;
}

/** `group` is what a scenario looks for: the heading is copy, and copy changes (E2 U3). */
function PanelGroup({ group, title, children }: { group: string; title: string; children?: ReactNode }) {
  return (
    <div className="border border-border p-4 space-y-3" data-testid="panel-group" data-group={group}>
      <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function formatSize(v: EditorSizeVariant): string {
  if (v.size_label) return v.size_label;
  const mm = Number(v.size_primary_mm.toFixed(2));
  // Ligne is a button measurement — suppressed on labelled, non-round hardware (R3).
  const ligne = !v.size_label && v.size_ligne != null ? ` (${tradeLigne(v.size_ligne)}L)` : "";
  return `${mm}mm${ligne}`;
}

/**
 * The groups a buyer decides in order (axis-design §7). Since E2 U4 the panel
 * owns none of its own geometry — width, side, scroll and borders belong to
 * `WorkspaceShell`, which is what the buyer moves around.
 */
export function EditorPanel({
  product,
  sizeVariantId,
  onSizeVariantChange,
  finishOptions,
  selectedFinish,
  onSelectFinish,
  selectedColour,
  localModelName,
  appearanceMode,
  onAppearanceModeChange,
  designId = null,
}: EditorPanelProps) {
  const { t, language } = useI18n();
  const modelSizeMm = useEditorStore((s) => s.modelSizeMm);
  const selection = useEditorStore((s) => s.selection);
  const [pickerOpen, setPickerOpen] = useState(false);
  const selectedVariant = product.size_variants.find((v) => v.id === sizeVariantId) ?? null;
  const local = !!localModelName;
  const isMetal = appearanceMode ? appearanceMode === "finish" : product.is_metal;
  const sourceAvailable = useEditorStore((s) => !!s.partsReport?.hasSourceAppearance);
  const sourceColour = useEditorStore((s) => s.partsReport?.groups[0]?.materials?.[0]?.colour);
  const materialMode = local || product.is_metal ? "finish" : "colour";
  const originalColour = appearanceMode === "source" ? sourceColour : isMetal ? selectedFinish?.base_color_hex ?? selectedFinish?.hex_approx : selectedColour?.hex;
  const materialWarnings = useEditorStore((s) => s.partsReport?.materialWarnings);
  const materialFiles = useEditorStore((s) => s.modelMaterialOverride?.files ?? s.localModel?.companionFiles);
  const materialNames = materialFiles?.filter((file) => /\.mtl$/i.test(file.name)).map((file) => file.name).join(", ");
  const faceDiameterMm = local ? modelSizeMm ?? 10 : selectedVariant?.size_primary_mm ?? product.size_variants[0]?.size_primary_mm ?? 10;

  // E2 U8 / standing ruling 1: the dock renders only what it has, and since
  // U7 that is versions alone — the save state is the document bar's. An
  // anonymous design has nothing to version, so no dock is drawn.
  const outputSections: OutputSection[] = designId && !local
    ? [
        {
          id: "versions",
          title: t("editor.versions.title"),
          body: (
            <VersionsSection
              designId={designId}
              product={product}
              finish={selectedFinish}
              sizeVariant={selectedVariant ?? product.size_variants[0] ?? null}
              colour={selectedColour}
            />
          ),
        },
      ]
    : [];

  return (
    // No height of its own: the workspace's scroll container is the parent, and
    // a panel that filled it would leave nothing to scroll.
    <div className="min-w-0" data-testid="editor-panel">
      <div className="p-4 space-y-4">
        <PanelGroup group="product" title={t("editor.panel.product")}>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground" data-testid="active-model-name">{localModelName ?? product.name}</p>
            {local ? (
              <p className="text-xs text-muted-foreground">{t("editor.viewport.localModelUnits")}</p>
            ) : (
              <p className="text-xs text-muted-foreground font-mono">{product.item_code}</p>
            )}
          </div>
          {!local && product.size_variants.length > 0 && (
            <RadioGroup value={sizeVariantId ?? undefined} onValueChange={onSizeVariantChange} className="space-y-2 pt-1">
              {product.size_variants.map((v) => (
                <div key={v.id} className="flex items-center gap-2" data-testid="size-variant" data-variant-id={v.id}>
                  <RadioGroupItem value={v.id} id={`size-${v.id}`} />
                  <Label htmlFor={`size-${v.id}`} className="text-sm font-normal cursor-pointer">
                    {formatSize(v)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </PanelGroup>

        {sourceAvailable && (
          <div className="flex border border-border" role="group" aria-label={t("editor.appearance.label")} data-testid="local-model-appearance">
            {(["source", materialMode] as const).map((mode) => {
              const active = mode === "source" ? appearanceMode === "source" : appearanceMode !== "source";
              return (
                <button
                  key={mode}
                  type="button"
                  data-testid={mode === "source" ? "local-model-source" : "local-model-finish"}
                  aria-pressed={active}
                  onClick={() => onAppearanceModeChange?.(mode)}
                  className={`flex-1 px-3 py-2 text-xs ${active ? "bg-foreground text-background" : "text-foreground hover:bg-secondary"}`}
                >
                  {t(mode === "source" ? "editor.panel.source" : "editor.panel.finish")}
                </button>
              );
            })}
          </div>
        )}

        <PanelGroup group={appearanceMode === "source" ? "source" : "finish"} title={t(appearanceMode === "source" ? "editor.panel.source" : "editor.panel.finish")}>
          {appearanceMode === "source" ? (
            <p className="text-xs text-muted-foreground">{t("editor.panel.sourceHint")}</p>
          ) : (
            <>
              {selectedFinish ? (
                <div className="flex gap-3">
                  <FinishSwatch finish={selectedFinish} className="w-14 h-14 shrink-0 border border-border" />
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm text-foreground truncate">{finishMarketingName(selectedFinish, language)}</p>
                    <p className="text-xs text-muted-foreground">{finishAxisLine(selectedFinish, language)}</p>
                  </div>
                </div>
              ) : isMetal ? (
                <p className="text-xs text-muted-foreground">{t("editor.finish.noneAvailable")}</p>
              ) : null}
              {isMetal && <p className="text-xs text-muted-foreground">{t("editor.finish.swatchDisclaimer")}</p>}
              {finishOptions.length > 0 && (
                <Button data-testid="change-finish" variant="outline" size="sm" className="rounded-none text-xs tracking-[0.05em]" onClick={() => setPickerOpen(true)}>
                  {t("editor.finish.changeFinish")}
                </Button>
              )}
            </>
          )}
          <ModelColourControl key={selection ? `${selection.kind}:${selection.id}` : "all"} originalHex={originalColour} sourceAppearance={appearanceMode === "source"} />
        </PanelGroup>
        {sourceAvailable && materialNames && <p className="text-xs text-muted-foreground" role="status" data-testid="model-material-status">{t("editor.viewport.materialsLoaded", { names: materialNames })}</p>}
        {!!materialWarnings?.length && <p className="text-xs text-amber-700" data-testid="model-material-warnings">{materialWarnings.join(" · ")}</p>}

        {/* E2 U5: what is on the part — branding, zones and the model's own
            parts (6b R1) — in one dock with a height of its own, so what
            follows it is not what follows a 33-row list. */}
        <LayersDock
          reference={local ? null : product.model_branding_reference}
          scaleFactor={local ? 1 : product.model_scale_factor}
          process={processThresholds(selectedFinish?.process, language)}
          faceDiameterMm={faceDiameterMm}
          markedGroupIndices={local ? [] : product.model_branding_group_indices ?? []}
        />

        {/* E2 U6: one panel for whatever is selected. Since U5 it is reached
            without scrolling past the layers, which is standing ruling 3. */}
        <PropertiesPanel faceDiameterMm={faceDiameterMm} />

        {/* E2 U8: the socket, with Phase 7's versions in it. */}
        <OutputDock sections={outputSections} />
      </div>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl flex flex-col">
          <SheetHeader>
            <SheetTitle>{t("editor.finish.pickerTitle")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 mt-4">
            <FinishSelectionPicker
              finishes={finishOptions}
              selectedId={selectedFinish?.id ?? null}
              onSelect={(f) => {
                onSelectFinish(f);
                setPickerOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
