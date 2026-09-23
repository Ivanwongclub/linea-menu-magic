import { useI18n } from "@/features/i18n/I18nProvider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEditorStore } from "../../store/useEditorStore";
import { BUNDLED_FONTS } from "../../lib/fonts";
import { isLogoLayer, type Layer, type TextLayout } from "../../lib/recipe";
import { cn } from "@/lib/utils";
import { PositionAndCurve } from "./PositionAndCurve";

/**
 * Everything about the *selected* layer (E2 U2): its words, its font, its
 * layout and its placement. Split out of `BrandingGroup` so the Properties
 * panel of U6 can mount it on its own, without the list coming with it.
 */
const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

const LAYOUTS: { value: TextLayout; label: string }[] = [
  { value: "straight", label: "editor.branding.layoutStraight" },
  { value: "circle", label: "editor.branding.layoutCircular" },
];

export function LayerProperties({ layer, faceDiameterMm }: { layer: Layer; faceDiameterMm: number }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);

  if (isLogoLayer(layer)) {
    // A logo has no content to type: its placement is all there is (4k R3).
    return (
      <div className="space-y-4 pt-1" data-testid="logo-layer-editor">
        <PositionAndCurve layer={layer} faceDiameterMm={faceDiameterMm} />
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1" data-testid="text-layer-editor">
      <div className="space-y-1">
        <label htmlFor={`text-${layer.id}`} className={FIELD_LABEL}>
          {t("editor.branding.text")}
        </label>
        <input
          id={`text-${layer.id}`}
          data-testid="text-layer-content"
          autoComplete="off"
          spellCheck={false}
          value={layer.content.value}
          onChange={(e) => updateLayer(layer.id, { content: { value: e.target.value } })}
          onBlur={commit}
          className="w-full border-b border-border bg-transparent py-1 text-base tracking-wide text-foreground outline-none focus:border-foreground transition-colors"
        />
      </div>
      <div className="space-y-1.5">
        <span id={`layout-${layer.id}`} className={FIELD_LABEL}>
          {t("editor.branding.layout")}
        </span>
        <div role="radiogroup" aria-labelledby={`layout-${layer.id}`} className="grid grid-cols-2 border border-border" data-testid="text-layer-layout">
          {LAYOUTS.map(({ value, label }) => {
            const active = layer.placement.layout === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                data-value={value}
                onClick={() => {
                  updateLayer(layer.id, { placement: { layout: value } });
                  commit();
                }}
                className={cn(
                  "py-1.5 text-xs tracking-[0.05em] transition-colors",
                  active ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(label)}
              </button>
            );
          })}
        </div>
      </div>
      <div className="space-y-1 min-w-0">
        <span id={`font-${layer.id}`} className={FIELD_LABEL}>
          {t("editor.branding.font")}
        </span>
        <Select
          value={layer.content.font.key}
          onValueChange={(key) => {
            updateLayer(layer.id, { content: { font: { source: "bundled", key } } });
            commit();
          }}
        >
          <SelectTrigger
            aria-labelledby={`font-${layer.id}`}
            data-testid="text-layer-font"
            className="h-8 rounded-none border-0 border-b border-border px-0 shadow-none focus:ring-0 focus:border-foreground"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-none">
            {BUNDLED_FONTS.map((f) => (
              <SelectItem key={f.key} value={f.key} className="rounded-none">
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <PositionAndCurve layer={layer} faceDiameterMm={faceDiameterMm} />
    </div>
  );
}
