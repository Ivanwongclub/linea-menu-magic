import { useId, useState } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { normalizeHex } from "../lib/pantone";
import { useEditorStore } from "../store/useEditorStore";
import { colourOverride, gradientOverride, hasColourOverride } from "../lib/scopedColour";
import { isLogoLayer } from "../lib/recipe";
import { usePublicFinishes } from "../hooks/usePublicFinishes";
import { GradientColourControl } from "./GradientColourControl";
import { groupForMember } from "../lib/paintGroups";

/** The model's colour changes independently of its material and surface finish. */
export function ModelColourControl({ originalHex, sourceAppearance, global = false }: { originalHex: string | null | undefined; sourceAppearance: boolean; global?: boolean }) {
  const { t } = useI18n();
  const pickerId = useId();
  const recipe = useEditorStore((s) => s.recipe);
  const selection = useEditorStore((s) => s.selection);
  const target = global ? null : selection;
  // The global control stays mounted while selecting: removing it moves the
  // parts list between the two clicks and can put Hide under the pointer.
  const testId = (name: string) => global && selection ? undefined : name;
  const parts = useEditorStore((s) => s.partsReport?.groups);
  const setColourForTarget = useEditorStore((s) => s.setColourForTarget);
  const setGradientForTarget = useEditorStore(s => s.setGradientForTarget);
  const { data: finishes } = usePublicFinishes();
  const setColour = (hex: string | null) => setColourForTarget(target, hex);
  const override = colourOverride(recipe, target);
  const canReset = hasColourOverride(recipe, target);
  const part = target?.kind === "part" ? parts?.find(part => String(part.index) === target.id) : undefined;
  const layer = target?.kind === "layer" ? recipe.layers.find(layer => layer.id === target.id) : undefined;
  const zone = target?.kind === "zone" ? recipe.zones?.find(zone => zone.id === target.id) : undefined;
  const group = target?.kind === "group" ? recipe.paint_groups?.find(group => group.id === target.id) : undefined;
  const parentGroup = groupForMember(recipe, target);
  const partZone = target?.kind === "part" ? [...(recipe.zones ?? [])].reverse().find(zone => zone.method === "groups" && zone.groups?.length === 1 && String(zone.groups[0]) === target.id) : undefined;
  const appearance = layer?.appearance ?? zone?.appearance ?? partZone?.appearance;
  const gradient = gradientOverride(recipe, target) ?? (!override ? parentGroup?.gradient ?? (!parentGroup?.colour_hex ? appearance?.gradient ?? recipe.base_gradient : undefined) : undefined);
  const ownFinish = appearance?.finish_id ? finishes?.find(finish => finish.id === appearance.finish_id) : null;
  const inherited = recipe.base_colour_hex ?? appearance?.custom?.hex ?? ownFinish?.base_color_hex ?? ownFinish?.hex_approx ?? (sourceAppearance && part ? part.materials?.[0]?.colour : originalHex);
  const name = group?.name ?? part?.name ?? zone?.name ?? (layer ? isLogoLayer(layer) ? t("editor.branding.logoLayer") : layer.content.value || t("editor.branding.emptyLayer") : "");
  const commit = useEditorStore((s) => s.commit);
  const [draft, setDraft] = useState<string | null>(null);
  const hex = gradient?.from ?? override ?? parentGroup?.colour_hex ?? normalizeHex(inherited ?? "") ?? "#9A9A9A";

  return (
    <div className="space-y-2 border-t border-border pt-3" data-testid={testId("model-colour-control")} data-hex={hex} data-mode={gradient ? "gradient" : "solid"} data-custom={canReset} data-scope={target?.kind ?? "all"} data-target-id={target?.id}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={pickerId} className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {t("editor.panel.colour")}
        </label>
        <span className="min-w-0 truncate text-xs text-muted-foreground" data-testid={testId("model-colour-target")} title={name}>
          {target ? t("editor.colour.scopeSelected", { name }) : t("editor.colour.scopeAll")}
        </span>
      </div>
      <div role="group" aria-label={t("editor.gradient.fillType")} className="flex border border-border">
        <button type="button" data-testid={testId("colour-mode-solid")} aria-pressed={!gradient} onClick={() => { if (gradient) { setColour(gradient.from); commit(); } }} className={`flex-1 px-2 py-1.5 text-xs ${!gradient ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{t("editor.gradient.solid")}</button>
        <button type="button" data-testid={testId("colour-mode-gradient")} aria-pressed={!!gradient} onClick={() => { if (!gradient) { setGradientForTarget(target, { from: hex, to: hex.toUpperCase() === "#FFFFFF" ? "#000000" : "#FFFFFF", angle: 0, midpoint: 0.5 }); setDraft(null); commit(); } }} className={`flex-1 px-2 py-1.5 text-xs ${gradient ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"}`}>{t("editor.gradient.linear")}</button>
      </div>
      {gradient ? <GradientColourControl gradient={gradient} onChange={value => setGradientForTarget(target, value)} onCommit={commit} testIds={!global || !selection} /> : <>
      <input
        id={pickerId}
        data-testid={testId("model-colour-picker")}
        type="color"
        value={hex}
        onChange={(event) => setColour(event.currentTarget.value)}
        onBlur={commit}
        className="block h-9 w-full cursor-pointer border border-border bg-transparent p-1"
      />
      <div className="flex items-center gap-2">
        <input
          aria-label={t("editor.colour.hex")}
          data-testid={testId("model-colour-hex")}
          value={draft ?? hex}
          maxLength={7}
          autoComplete="off"
          spellCheck={false}
          onFocus={() => setDraft(hex)}
          onChange={(event) => {
            const value = event.currentTarget.value;
            setDraft(value);
            const colour = normalizeHex(value);
            if (colour) setColour(colour);
          }}
          onBlur={() => { setDraft(null); commit(); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.nativeEvent.isComposing) event.currentTarget.blur();
          }}
          className="min-w-0 flex-1 border border-border bg-transparent px-2 py-1 font-mono text-xs uppercase text-foreground outline-none focus:border-foreground"
        />
      </div>
      </>}
      <div className="flex justify-end">
        <button
          type="button"
          data-testid={testId("model-colour-reset")}
          disabled={!canReset}
          onClick={() => { setColour(null); commit(); }}
          className="shrink-0 text-xs text-foreground underline underline-offset-4 disabled:text-muted-foreground disabled:no-underline"
        >
          {t(target ? "editor.colour.resetSelected" : "editor.colour.reset")}
        </button>
      </div>
    </div>
  );
}
