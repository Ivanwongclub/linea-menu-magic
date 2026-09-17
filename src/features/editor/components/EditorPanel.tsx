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
import { BrandingGroup } from "./branding/BrandingGroup";
import type { PickerFinish } from "../hooks/useFinishOptions";
import type { AutosaveStatus } from "../hooks/useAutosaveDraft";
import type { EditorColour, EditorProduct, EditorSizeVariant } from "../hooks/useEditorProduct";

interface EditorPanelProps {
  product: EditorProduct;
  sizeVariantId: string | null;
  onSizeVariantChange: (id: string) => void;
  finishOptions: PickerFinish[];
  selectedFinish: PickerFinish | null;
  onSelectFinish: (finish: PickerFinish) => void;
  colours: EditorColour[];
  selectedColour: EditorColour | null;
  onSelectColour: (colour: EditorColour) => void;
  saveStatus?: AutosaveStatus;
}

function PanelGroup({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="border border-border p-4 space-y-3">
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

/** Four groups, in the order a buyer decides (axis-design §7). */
export function EditorPanel({
  product,
  sizeVariantId,
  onSizeVariantChange,
  finishOptions,
  selectedFinish,
  onSelectFinish,
  colours,
  selectedColour,
  onSelectColour,
  saveStatus,
}: EditorPanelProps) {
  const { t, language } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className="w-full max-h-[60%] lg:max-h-none lg:w-[360px] shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-background overflow-y-auto overflow-x-hidden" data-testid="editor-panel">
      {saveStatus && saveStatus !== "idle" && (
        <div className="px-4 py-1.5 border-b border-border text-[11px] text-muted-foreground text-right" data-testid="autosave-status" data-status={saveStatus}>
          {saveStatus === "saving" ? t("editor.autosave.saving") : saveStatus === "error" ? t("editor.autosave.notSaved") : t("editor.autosave.saved")}
        </div>
      )}
      <div className="p-4 space-y-4">
        <PanelGroup title={t("editor.panel.product")}>
          <div className="space-y-0.5">
            <p className="text-sm font-medium text-foreground">{product.name}</p>
            <p className="text-xs text-muted-foreground font-mono">{product.item_code}</p>
          </div>
          {product.size_variants.length > 0 && (
            <RadioGroup value={sizeVariantId ?? undefined} onValueChange={onSizeVariantChange} className="space-y-2 pt-1">
              {product.size_variants.map((v) => (
                <div key={v.id} className="flex items-center gap-2">
                  <RadioGroupItem value={v.id} id={`size-${v.id}`} />
                  <Label htmlFor={`size-${v.id}`} className="text-sm font-normal cursor-pointer">
                    {formatSize(v)}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </PanelGroup>

        {product.is_metal ? (
          <PanelGroup title={t("editor.panel.finish")}>
            {selectedFinish ? (
              <div className="flex gap-3">
                <FinishSwatch finish={selectedFinish} className="w-14 h-14 shrink-0 border border-border" />
                <div className="space-y-0.5 min-w-0">
                  <p className="text-sm text-foreground truncate">{finishMarketingName(selectedFinish, language)}</p>
                  <p className="text-xs text-muted-foreground">{finishAxisLine(selectedFinish, language)}</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("editor.finish.noneAvailable")}</p>
            )}
            <p className="text-xs text-muted-foreground">{t("editor.finish.swatchDisclaimer")}</p>
            {finishOptions.length > 0 && (
              <Button variant="outline" size="sm" className="rounded-none text-xs tracking-[0.05em]" onClick={() => setPickerOpen(true)}>
                {t("editor.finish.changeFinish")}
              </Button>
            )}
          </PanelGroup>
        ) : (
          <PanelGroup title={t("editor.panel.colour")}>
            {colours.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {colours.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    data-testid="colour-swatch"
                    aria-pressed={c.id === selectedColour?.id}
                    onClick={() => onSelectColour(c)}
                    title={c.name}
                    className={`w-9 h-9 border ${c.id === selectedColour?.id ? "border-foreground" : "border-border"}`}
                    style={{ backgroundColor: c.hex ?? undefined }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("editor.colour.noneAvailable")}</p>
            )}
            {selectedColour && <p className="text-sm text-foreground">{selectedColour.name}</p>}
          </PanelGroup>
        )}

        <BrandingGroup
          reference={product.model_branding_reference}
          scaleFactor={product.model_scale_factor}
          faceDiameterMm={product.size_variants.find((v) => v.id === sizeVariantId)?.size_primary_mm ?? product.size_variants[0]?.size_primary_mm ?? 10} />
        <PanelGroup title={t("editor.panel.output")} />
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
