import { useState } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { normalizeHex } from "../lib/pantone";
import { useEditorStore } from "../store/useEditorStore";

/** The model's colour changes independently of its material and surface finish. */
export function ModelColourControl({ originalHex }: { originalHex: string | null | undefined }) {
  const { t } = useI18n();
  const override = useEditorStore((s) => s.recipe.base_colour_hex);
  const setColour = useEditorStore((s) => s.setBaseColourHex);
  const commit = useEditorStore((s) => s.commit);
  const [draft, setDraft] = useState<string | null>(null);
  const hex = override ?? normalizeHex(originalHex ?? "") ?? "#9A9A9A";

  return (
    <div className="space-y-2 border-t border-border pt-3" data-testid="model-colour-control" data-hex={hex} data-custom={!!override}>
      <label htmlFor="model-colour-picker" className="block text-[11px] uppercase tracking-[0.12em] text-muted-foreground">
        {t("editor.panel.colour")}
      </label>
      <input
        id="model-colour-picker"
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
          disabled={!override}
          onClick={() => { setColour(null); commit(); }}
          className="shrink-0 text-xs text-foreground underline underline-offset-4 disabled:text-muted-foreground disabled:no-underline"
        >
          {t("editor.colour.reset")}
        </button>
      </div>
    </div>
  );
}
