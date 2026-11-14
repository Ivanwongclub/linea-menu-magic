import { Copy } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useLogoSources } from "../../hooks/useLogoAssets";
import { useEditorStore } from "../../store/useEditorStore";

/** One click sends this layer's look to every other layer. Words and position stay. */
export function CopyLayerStyleButton({ layerId }: { layerId: string }) {
  const { t } = useI18n();
  const layers = useEditorStore((s) => s.recipe.layers);
  const sources = useLogoSources(layers);
  const apply = useEditorStore((s) => s.applyLayerStyleToOthers);
  const others = layers.filter((layer) => layer.id !== layerId).length;
  const ready = others > 0;

  return (
    <div className="space-y-1.5" data-testid="copy-layer-style" data-ready={ready}>
      <button
        type="button"
        data-testid="copy-layer-style-button"
        disabled={!ready}
        onClick={() => apply(layerId, layers.filter((layer) => sources[layer.id]?.kind === "raster").map((layer) => layer.id))}
        className="flex w-full items-center justify-center gap-1.5 border border-foreground bg-foreground px-3 py-2 text-sm text-background disabled:border-border disabled:bg-secondary disabled:text-muted-foreground"
      >
        <Copy className="h-4 w-4" strokeWidth={1.5} />
        {t(ready ? "editor.branding.copyStyle" : "editor.branding.copyStyleNeedAnother")}
      </button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("editor.branding.copyStyleHint")}</p>
    </div>
  );
}
