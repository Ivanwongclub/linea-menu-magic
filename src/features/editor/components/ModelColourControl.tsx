import { useId, useState } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { normalizeHex } from "../lib/pantone";
import { useEditorStore } from "../store/useEditorStore";
import { colourOverride, hasColourOverride } from "../lib/scopedColour";
import { isLogoLayer } from "../lib/recipe";
import { usePublicFinishes } from "../hooks/usePublicFinishes";

/** The model's colour changes independently of its material and surface finish. */
export function ModelColourControl({ originalHex, sourceAppearance }: { originalHex: string | null | undefined; sourceAppearance: boolean }) {
  const { t } = useI18n();
  const pickerId = useId();
  const recipe = useEditorStore((s) => s.recipe);
  const target = useEditorStore((s) => s.selection);
  const parts = useEditorStore((s) => s.partsReport?.groups);
  const setColourForTarget = useEditorStore((s) => s.setColourForTarget);
  const { data: finishes } = usePublicFinishes();
  const setColour = (hex: string | null) => setColourForTarget(target, hex);
  const override = colourOverride(recipe, target);
  const canReset = hasColourOverride(recipe, target);
  const part = target?.kind === "part" ? parts?.find(part => String(part.index) === target.id) : undefined;
  const layer = target?.kind === "layer" ? recipe.layers.find(layer => layer.id === target.id) : undefined;
  const zone = target?.kind === "zone" ? recipe.zones?.find(zone => zone.id === target.id) : undefined;
  const partZone = target?.kind === "part" ? [...(recipe.zones ?? [])].reverse().find(zone => zone.method === "groups" && zone.groups?.length === 1 && String(zone.groups[0]) === target.id) : undefined;
  const appearance = layer?.appearance ?? zone?.appearance ?? partZone?.appearance;
  const ownFinish = appearance?.finish_id ? finishes?.find(finish => finish.id === appearance.finish_id) : null;
  const inherited = recipe.base_colour_hex ?? appearance?.custom?.hex ?? ownFinish?.base_color_hex ?? ownFinish?.hex_approx ?? (sourceAppearance && part ? part.materials?.[0]?.colour : originalHex);
  const name = part?.name ?? zone?.name ?? (layer ? isLogoLayer(layer) ? t("editor.branding.logoLayer") : layer.content.value || t("editor.branding.emptyLayer") : "");
  const commit = useEditorStore((s) => s.commit);
  const [draft, setDraft] = useState<string | null>(null);
  const hex = override ?? normalizeHex(inherited ?? "") ?? "#9A9A9A";

  return (
    <div className="space-y-2 border-t border-border pt-3" data-testid="model-colour-control" data-hex={hex} data-custom={canReset} data-scope={target?.kind ?? "all"} data-target-id={target?.id}>
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={pickerId} className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
          {t("editor.panel.colour")}
        </label>
        <span className="min-w-0 truncate text-xs text-muted-foreground" data-testid="model-colour-target" title={name}>
          {target ? t("editor.colour.scopeSelected", { name }) : t("editor.colour.scopeAll")}
        </span>
      </div>
      <input
        id={pickerId}
        data-testid="model-colour-picker"
        type="color"
        value={hex}
        onChange={(event) => setColour(event.currentTarget.value)}
        onBlur={commit}
        className="block h-9 w-full cursor-pointer border border-border bg-transparent p-1"
      />
      <div className="flex items-center gap-2">
        <input
          aria-label={t("editor.colour.hex")}
          data-testid="model-colour-hex"
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
        <button
          type="button"
          data-testid="model-colour-reset"
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
