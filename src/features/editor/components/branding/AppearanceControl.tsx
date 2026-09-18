import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { FinishSelectionPicker } from "@/features/finishes/FinishSelectionPicker";
import { finishMarketingName } from "@/features/finishes/finishAxisLine";
import { finishesForGroup, usePublicFinishes, type AppearanceFinishGroup } from "../../hooks/usePublicFinishes";
import type { PickerFinish } from "../../hooks/useFinishOptions";
import { normalizeHex, normalizePantone, pantoneHex, resolveCustomColour } from "../../lib/pantone";
import type { AppearanceMode, LayerAppearance } from "../../lib/recipe";

const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

const MODE_LABEL: Record<AppearanceMode, string> = {
  part: "editor.appearance.part",
  plated: "editor.appearance.plated",
  paint: "editor.appearance.paint",
  printed: "editor.appearance.printed",
};

/** The colour a row reads as: a finish's own swatch colour, a custom colour, or nothing. */
export function appearanceSwatchHex(appearance: LayerAppearance, finish: PickerFinish | null): string | null {
  if (appearance.custom) return appearance.custom.hex;
  if (finish) return finish.base_color_hex ?? finish.hex_approx ?? null;
  return null;
}

/**
 * One appearance control (Phase 6a R1), shared by a branding layer and a zone
 * (6b R2): the mode, a swatch of what it resolves to, the catalogue picker
 * filtered to the processes that can do the job, and "Custom…" where a custom
 * colour is allowed at all.
 */
export function AppearanceControl({
  appearance,
  onChange,
  modes,
  ownerId,
  /** R9: a raster layer prints its own pixels, so it is offered no ink. */
  colourDisabled = false,
  allowCustom = true,
  label,
}: {
  appearance: LayerAppearance;
  onChange: (patch: Partial<LayerAppearance>) => void;
  modes: AppearanceMode[];
  ownerId: string;
  colourDisabled?: boolean;
  allowCustom?: boolean;
  label?: string;
}) {
  const { t, language } = useI18n();
  const { data: finishes } = usePublicFinishes();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [customOpen, setCustomOpen] = useState(false);
  const group: AppearanceFinishGroup = appearance.mode === "plated" ? "plated" : "paint";
  const options = useMemo(() => finishesForGroup(finishes ?? [], group), [finishes, group]);
  const selected = (finishes ?? []).find((f) => f.id === appearance.finish_id) ?? null;
  const wantsColour = appearance.mode !== "part" && !colourDisabled;
  const swatchHex = appearanceSwatchHex(appearance, selected);

  const setMode = (mode: AppearanceMode) => {
    // Leaving a colour behind clears it: plating never carries a custom colour
    // (6a R3), and the part's own finish carries none either.
    const custom = mode === "paint" || mode === "printed" ? appearance.custom : null;
    const finish_id = mode === "part" ? null : appearance.finish_id;
    onChange({ mode, custom, finish_id });
  };

  const summary = selected
    ? finishMarketingName(selected, language)
    : appearance.custom
      ? t("editor.appearance.customSummary", { colour: appearance.custom.pantone ?? appearance.custom.hex })
      : t("editor.appearance.choose");

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="appearance-control"
      data-owner-id={ownerId}
      data-mode={appearance.mode}
      data-finish-id={appearance.finish_id ?? undefined}
      data-custom={appearance.custom?.hex ?? undefined}
    >
      <span className={FIELD_LABEL} id={`appearance-${ownerId}`}>
        {label ?? t("editor.appearance.label")}
      </span>
      <span
        data-testid="appearance-swatch"
        data-hex={swatchHex ?? undefined}
        aria-hidden="true"
        className={cn("h-4 w-4 shrink-0 border border-border", !swatchHex && "border-dashed bg-secondary")}
        style={swatchHex ? { backgroundColor: swatchHex } : undefined}
      />
      <Select value={appearance.mode} onValueChange={(mode) => setMode(mode as AppearanceMode)}>
        <SelectTrigger
          aria-labelledby={`appearance-${ownerId}`}
          data-testid="appearance-mode"
          className="h-7 w-[140px] rounded-none border-0 border-b border-border px-0 text-[11px] shadow-none focus:ring-0 focus:border-foreground"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-none">
          {modes.map((mode) => (
            <SelectItem key={mode} value={mode} className="rounded-none text-xs">
              {t(MODE_LABEL[mode])}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {wantsColour && (
        <button
          type="button"
          data-testid="appearance-choose"
          onClick={() => setPickerOpen(true)}
          className="max-w-[140px] truncate text-[11px] tracking-[0.05em] text-foreground underline-offset-4 hover:underline"
        >
          {summary}
        </button>
      )}
      {wantsColour && allowCustom && (appearance.mode === "paint" || appearance.mode === "printed") && (
        <button
          type="button"
          data-testid="appearance-custom-open"
          onClick={() => setCustomOpen((v) => !v)}
          className="text-[11px] tracking-[0.05em] text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          {t("editor.appearance.custom")}
        </button>
      )}
      {colourDisabled && appearance.mode === "printed" && (
        <span className="text-[11px] text-muted-foreground" data-testid="appearance-raster-note">
          {t("editor.appearance.rasterInk")}
        </span>
      )}

      {customOpen && wantsColour && allowCustom && (appearance.mode === "paint" || appearance.mode === "printed") && (
        <CustomColourPanel ownerId={ownerId} appearance={appearance} onChange={onChange} onDone={() => setCustomOpen(false)} />
      )}

      <Sheet open={pickerOpen} onOpenChange={setPickerOpen}>
        <SheetContent side="right" className="flex w-full flex-col sm:max-w-xl">
          <SheetHeader>
            <SheetTitle>{t(group === "paint" ? "editor.appearance.paintPickerTitle" : "editor.appearance.platedPickerTitle")}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 min-h-0 flex-1" data-testid="appearance-picker">
            <FinishSelectionPicker
              finishes={options}
              selectedId={appearance.finish_id}
              onSelect={(finish) => {
                onChange({ finish_id: finish.id, custom: null });
                setPickerOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * "Custom…" (6a R3): a Pantone code from the solid coated range, or a colour
 * picked on screen. An unknown code keeps the code and takes the buyer's own
 * hex beside it; either way the result is labelled "to be confirmed".
 */
function CustomColourPanel({
  ownerId,
  appearance,
  onChange,
  onDone,
}: {
  ownerId: string;
  appearance: LayerAppearance;
  onChange: (patch: Partial<LayerAppearance>) => void;
  onDone: () => void;
}) {
  const { t } = useI18n();
  const existing = appearance.custom;
  const [pantone, setPantone] = useState(existing?.pantone ?? "");
  const [hex, setHex] = useState(existing?.hex ?? "#000000");
  const resolved = resolveCustomColour({ pantone, hex });
  const known = pantone.trim() !== "" && !!pantoneHex(pantone);
  const codeInvalid = pantone.trim() !== "" && normalizePantone(pantone) === null;

  return (
    <div className="w-full space-y-2 border border-border p-2" data-testid="custom-colour-panel">
      <div className="flex items-center gap-2">
        <label className={FIELD_LABEL} htmlFor={`pantone-${ownerId}`}>
          {t("editor.appearance.pantone")}
        </label>
        <input
          id={`pantone-${ownerId}`}
          data-testid="custom-pantone"
          value={pantone}
          autoComplete="off"
          onChange={(e) => {
            setPantone(e.target.value);
            const found = pantoneHex(e.target.value);
            if (found) setHex(found);
          }}
          placeholder="185 C"
          className="w-24 border-b border-border bg-transparent py-0.5 text-sm text-foreground outline-none focus:border-foreground"
        />
        <input
          type="color"
          data-testid="custom-pick"
          aria-label={t("editor.appearance.pick")}
          value={normalizeHex(hex) ?? "#000000"}
          onChange={(e) => setHex(e.target.value)}
          className="h-6 w-8 shrink-0 border border-border bg-transparent p-0"
        />
        <input
          data-testid="custom-hex"
          aria-label={t("editor.appearance.hex")}
          value={hex}
          autoComplete="off"
          onChange={(e) => setHex(e.target.value)}
          className="w-24 border-b border-border bg-transparent py-0.5 font-mono text-xs text-foreground outline-none focus:border-foreground"
        />
      </div>
      <p className="text-[11px] text-muted-foreground" data-testid="custom-colour-hint">
        {codeInvalid
          ? t("editor.appearance.pantoneInvalid")
          : known
            ? t("editor.appearance.pantoneKnown")
            : pantone.trim()
              ? t("editor.appearance.pantoneUnknown")
              : t("editor.appearance.customHint")}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          data-testid="custom-apply"
          disabled={!resolved}
          onClick={() => {
            if (!resolved) return;
            onChange({ custom: resolved, finish_id: null });
            onDone();
          }}
          className="border border-foreground px-2 py-0.5 text-[11px] tracking-[0.05em] text-foreground disabled:border-border disabled:text-muted-foreground"
        >
          {t("editor.appearance.applyCustom")}
        </button>
        <button type="button" data-testid="custom-cancel" onClick={onDone} className="text-[11px] text-muted-foreground hover:text-foreground">
          {t("editor.common.cancel")}
        </button>
      </div>
    </div>
  );
}
