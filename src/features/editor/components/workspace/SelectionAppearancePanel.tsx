import { useState } from "react";
import { Palette, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/features/i18n/I18nProvider";
import { FinishSelectionPicker } from "@/features/finishes/FinishSelectionPicker";
import { FinishSwatch } from "@/features/finishes/FinishSwatch";
import { finishMarketingName } from "@/features/finishes/finishAxisLine";
import { usePublicFinishes } from "../../hooks/usePublicFinishes";
import { usePartAppearance } from "../../hooks/usePartAppearance";
import { useLogoSources } from "../../hooks/useLogoAssets";
import { DEFAULT_APPEARANCE, isLogoLayer, layerAppearance, type LayerAppearance } from "../../lib/recipe";
import { useEditorStore, type Selection } from "../../store/useEditorStore";
import { ModelColourControl } from "../ModelColourControl";
import { PaintGroupDetails } from "./PaintGroupsSection";
import { ZoneRegionControls } from "../branding/ZoneRegionControls";

interface Props {
  originalHex: string | null | undefined;
  sourceAppearance: boolean;
}

/** Non-modal: selecting another part, orbiting and typing remain available. */
export function SelectionAppearancePanel(props: Props) {
  const selection = useEditorStore(s => s.selection);
  return selection ? <SelectedAppearance key={`${selection.kind}:${selection.id}`} selection={selection} {...props} /> : null;
}

function SelectedAppearance({ selection, originalHex, sourceAppearance }: Props & { selection: Selection }) {
  const { t, language } = useI18n();
  const recipe = useEditorStore(s => s.recipe);
  const parts = useEditorStore(s => s.partsReport?.groups);
  const { data: finishes = [] } = usePublicFinishes();
  const { appearance: partAppearance, changeAppearance: changePartAppearance } = usePartAppearance(selection.kind === "part" ? Number(selection.id) : null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const layer = selection.kind === "layer" ? recipe.layers.find(layer => layer.id === selection.id) : undefined;
  const zone = selection.kind === "zone" ? recipe.zones?.find(zone => zone.id === selection.id) : undefined;
  const part = selection.kind === "part" ? parts?.find(part => String(part.index) === selection.id) : undefined;
  const group = selection.kind === "group" ? recipe.paint_groups?.find(group => group.id === selection.id) : undefined;
  const logoSources = useLogoSources(recipe.layers);
  const raster = !!layer && logoSources[layer.id]?.kind === "raster";
  const appearance = layer ? layerAppearance(layer) : zone?.appearance ?? partAppearance;
  const selectedFinish = finishes.find(finish => finish.id === appearance.finish_id);
  const name = group?.name ?? part?.name ?? zone?.name ?? (layer ? isLogoLayer(layer) ? t("editor.branding.logoLayer") : layer.content.value || t("editor.branding.emptyLayer") : "");

  if (!part && !layer && !zone && !group) return null;

  const changeAppearance = (patch: Partial<LayerAppearance>) => {
    const state = useEditorStore.getState();
    if (part) changePartAppearance(patch);
    else if (layer) {
      state.updateLayer(layer.id, { appearance: patch });
      state.commit();
    } else if (zone) {
      state.updateZone(zone.id, { appearance: { ...zone.appearance, ...patch } });
      state.commit();
    }
  };
  const clearSelection = () => {
    const state = useEditorStore.getState();
    state.setPaintZone(null);
    state.select(null);
  };
  const customMaterial = !!appearance.finish_id || !!appearance.custom;

  return (
    <aside
      aria-label={t("editor.quickAppearance.title")}
      data-testid="selection-appearance-panel"
      data-kind={selection.kind}
      data-target-id={selection.id}
      className="absolute right-3 top-14 z-20 max-h-[calc(100%_-_7rem)] w-64 max-w-[calc(100%_-_1.5rem)] overflow-y-auto border border-border bg-background p-4 shadow-lg lg:w-72"
      onPointerEnter={() => useEditorStore.getState().setHoveredPart(null)}
      onKeyDown={event => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing && !pickerOpen) {
          event.stopPropagation();
          clearSelection();
        }
      }}
    >
      <div className="mb-3 flex items-start gap-2">
        <Palette className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" strokeWidth={1.5} />
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-medium text-foreground">{t("editor.quickAppearance.title")}</h3>
          <p className="truncate text-xs text-muted-foreground" title={name} data-testid="selection-appearance-name">{name}</p>
        </div>
        <button type="button" onClick={clearSelection} data-testid="selection-appearance-close" aria-label={t("editor.quickAppearance.close")} title={t("editor.quickAppearance.close")} className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline focus-visible:outline-1">
          <X className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>

      {zone && <div className="mb-3 border-b border-border pb-3"><ZoneRegionControls zone={zone} /></div>}
      <ModelColourControl originalHex={originalHex} sourceAppearance={sourceAppearance} />

      {group ? <PaintGroupDetails group={group} /> : <>
      <div className="mt-3 space-y-2 border-t border-border pt-3" data-testid="selection-material-control" data-finish-id={appearance.finish_id ?? ""} data-mode={appearance.mode}>
        <h4 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.quickAppearance.material")}</h4>
        <div className="flex items-center gap-2">
          {selectedFinish ? <FinishSwatch finish={selectedFinish} className="h-9 w-9 shrink-0 border border-border" /> : <span className="h-9 w-9 shrink-0 border border-border bg-secondary" style={{ backgroundColor: appearance.custom?.hex ?? part?.materials?.[0]?.colour }} aria-hidden="true" />}
          <p className="min-w-0 flex-1 text-xs text-foreground" data-testid="selection-material-name">
            {selectedFinish ? finishMarketingName(selectedFinish, language) : appearance.custom?.hex ?? t(sourceAppearance && part ? "editor.panel.source" : "editor.quickAppearance.inherit")}
          </p>
        </div>
        {raster ? <p className="text-xs text-muted-foreground">{t("editor.appearance.rasterInk")}</p> : (
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" data-testid="selection-material-change" onClick={() => setPickerOpen(true)} className="border border-foreground px-3 py-1.5 text-xs text-foreground transition-colors hover:bg-secondary">
              {t("editor.quickAppearance.changeMaterial")}
            </button>
            {customMaterial && !zone && <button type="button" data-testid="selection-material-reset" onClick={() => changeAppearance({ ...DEFAULT_APPEARANCE })} className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground">{t("editor.quickAppearance.resetMaterial")}</button>}
          </div>
        )}
        <p className="text-[11px] leading-relaxed text-muted-foreground">{t("editor.quickAppearance.hint")}</p>
      </div>

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader><SheetTitle>{t("editor.quickAppearance.pickMaterial", { name })}</SheetTitle></SheetHeader>
          <div className="mt-4 min-h-0 flex-1" data-testid="selection-material-picker">
            <FinishSelectionPicker finishes={finishes} selectedId={appearance.finish_id} onSelect={finish => {
              changeAppearance({ mode: finish.process?.code === "PAINT" ? layer && layer.relief?.type === "printed" ? "printed" : "paint" : "plated", finish_id: finish.id, custom: null });
              setPickerOpen(false);
            }} />
          </div>
        </SheetContent>
      </Sheet>
      </>}
    </aside>
  );
}
