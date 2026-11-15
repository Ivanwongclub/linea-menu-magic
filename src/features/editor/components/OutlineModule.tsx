import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import {
  DEFAULT_OUTLINE,
  outlineForLayer,
  outlineForPart,
  selectSelectedLayerId,
  selectSelectedPartIndex,
  useEditorStore,
  type OutlineSettings,
  type WireframeLineStyle,
} from "../store/useEditorStore";
import { isLogoLayer } from "../lib/recipe";

/**
 * Outline edits the *current* part or branding layer only.
 * Finish/colour stay in appearance; this module never writes the recipe.
 */
export function OutlineModule() {
  const { t } = useI18n();
  const partIndex = useEditorStore(selectSelectedPartIndex);
  const layerId = useEditorStore(selectSelectedLayerId);
  const parts = useEditorStore((s) => s.partsReport?.groups);
  const layers = useEditorStore((s) => s.recipe.layers);
  const outlineParts = useEditorStore((s) => s.outlineParts);
  const outlineLayers = useEditorStore((s) => s.outlineLayers);
  const patchOutlinePart = useEditorStore((s) => s.patchOutlinePart);
  const patchOutlineLayer = useEditorStore((s) => s.patchOutlineLayer);
  const styles: WireframeLineStyle[] = ["solid", "dashed", "dotted"];

  const part = partIndex != null ? parts?.find((entry) => entry.index === partIndex) : undefined;
  const layer = layerId ? layers.find((entry) => entry.id === layerId) : undefined;
  const target =
    partIndex != null
      ? { kind: "part" as const, id: String(partIndex), name: part?.name ?? String(partIndex), settings: outlineForPart({ outlineParts }, partIndex) }
      : layer
        ? {
            kind: "layer" as const,
            id: layer.id,
            name: isLogoLayer(layer) ? t("editor.branding.logoLayer") : layer.content.value || t("editor.branding.emptyLayer"),
            settings: outlineForLayer({ outlineLayers }, layer.id),
          }
        : null;

  const patch = (next: Partial<OutlineSettings>) => {
    if (!target) return;
    if (target.kind === "part") patchOutlinePart(Number(target.id), next);
    else patchOutlineLayer(target.id, next);
  };

  const settings = target?.settings ?? DEFAULT_OUTLINE;

  return (
    <div data-testid="outline-module" data-target={target ? `${target.kind}:${target.id}` : undefined} className="space-y-3">
      {!target ? (
        <p className="text-xs text-muted-foreground" data-testid="outline-need-selection">{t("editor.outline.needSelection")}</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-xs text-foreground" data-testid="outline-target-name" title={target.name}>
                {t("editor.outline.editing", { name: target.name })}
              </p>
              <p className="text-[11px] text-muted-foreground">{t("editor.outline.hint")}</p>
            </div>
            <button
              type="button"
              data-testid="wireframe-toggle"
              aria-pressed={settings.enabled}
              onClick={() => patch({ enabled: !settings.enabled })}
              className={cn(
                "shrink-0 border px-2.5 py-1 text-xs tracking-wide",
                settings.enabled ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:bg-secondary",
              )}
            >
              {t(settings.enabled ? "editor.outline.on" : "editor.outline.off")}
            </button>
          </div>

          {settings.enabled && (
            <div className="space-y-3" data-testid="wireframe-controls">
              <label className="flex items-center justify-between gap-2" title={t("editor.outline.colour")}>
                <span className="text-xs text-foreground">{t("editor.outline.colour")}</span>
                <input
                  type="color"
                  data-testid="wireframe-colour"
                  aria-label={t("editor.outline.colour")}
                  value={settings.hex}
                  onChange={(event) => patch({ hex: event.currentTarget.value })}
                  className="h-7 w-10 cursor-pointer border border-border bg-transparent p-0"
                />
              </label>

              <label className="block space-y-1" title={t("editor.wireframe.width")}>
                <span className="flex items-center justify-between text-xs text-foreground">
                  <span>{t("editor.wireframe.width")}</span>
                  <span className="tabular-nums text-muted-foreground" data-testid="wireframe-width-value">{settings.widthPx}px</span>
                </span>
                <input
                  type="range"
                  data-testid="wireframe-width"
                  aria-label={t("editor.wireframe.width")}
                  min={1}
                  max={8}
                  step={0.5}
                  value={settings.widthPx}
                  onChange={(event) => patch({ widthPx: Number(event.currentTarget.value) })}
                  className="w-full accent-foreground"
                />
              </label>

              <div className="space-y-1.5">
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.wireframe.style")}</p>
                <div className="flex border border-border" role="group" aria-label={t("editor.wireframe.style")}>
                  {styles.map((entry) => (
                    <button
                      key={entry}
                      type="button"
                      data-testid={`wireframe-style-${entry}`}
                      aria-pressed={settings.style === entry}
                      title={t(`editor.wireframe.style.${entry}`)}
                      onClick={() => patch({ style: entry })}
                      className={cn(
                        "flex-1 px-2 py-1.5 text-xs",
                        settings.style === entry ? "bg-foreground text-background" : "text-foreground hover:bg-secondary",
                      )}
                    >
                      {t(`editor.wireframe.style.${entry}`)}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between gap-2 border border-border px-2 py-2" data-testid="outline-hide-fill">
                <span className="min-w-0">
                  <span className="block text-xs text-foreground">{t("editor.outline.hideFill")}</span>
                  <span className="block text-[11px] text-muted-foreground">{t("editor.outline.hideFillTip")}</span>
                </span>
                <input
                  type="checkbox"
                  data-testid="outline-hide-fill-input"
                  checked={settings.hideFill}
                  onChange={(event) => patch({ hideFill: event.currentTarget.checked })}
                  className="h-4 w-4 accent-foreground"
                />
              </label>
            </div>
          )}
        </>
      )}
    </div>
  );
}
