import { useI18n } from "@/features/i18n/I18nProvider";
import { selectZones, useEditorStore } from "../../store/useEditorStore";
import { isLogoLayer } from "../../lib/recipe";
import { useLogoSources } from "../../hooks/useLogoAssets";
import { AppearanceRow, ReliefRow } from "../branding/LayerRowControls";
import { LayerProperties } from "../branding/LayerProperties";
import { ZoneProperties } from "../branding/ZoneProperties";
import { PartProperties } from "../PartProperties";

/**
 * One panel that follows the selection (E2 U6): a layer, a zone or one of the
 * model's parts — never all three, and never a stack of collapsed sections for
 * things that aren't selected. With nothing selected it says so rather than
 * showing an empty frame, which is the same rule as the rest of the editor: no
 * placeholder controls.
 *
 * The controls themselves are the ones the rows used to carry. They moved
 * parent, not shape, so their test ids and `data-layer-id` / `data-zone-id`
 * attributes are unchanged.
 */
export function PropertiesPanel({ faceDiameterMm }: { faceDiameterMm: number }) {
  const { t } = useI18n();
  const selection = useEditorStore((s) => s.selection);
  const layers = useEditorStore((s) => s.recipe.layers);
  const zones = useEditorStore(selectZones);
  const logoSources = useLogoSources(layers);

  const layer = selection?.kind === "layer" ? layers.find((l) => l.id === selection.id) ?? null : null;
  const zone = selection?.kind === "zone" ? zones.find((z) => z.id === selection.id) ?? null : null;
  const partIndex = selection?.kind === "part" ? Number(selection.id) : null;

  const title = layer
    ? isLogoLayer(layer)
      ? t("editor.branding.logoLayer")
      : layer.content.value || t("editor.branding.emptyLayer")
    : zone
      ? zone.name
      : partIndex != null
        ? t("editor.properties.part")
        : null;

  return (
    <div className="border border-border p-4 space-y-3" data-testid="properties-panel" data-kind={selection?.kind ?? "none"}>
      <div className="flex items-baseline gap-2">
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.properties.title")}</h3>
        {title && (
          <span className="ml-auto min-w-0 truncate text-[11px] text-foreground" data-testid="properties-subject">
            {title}
          </span>
        )}
      </div>

      {!selection && (
        <p className="text-xs text-muted-foreground" data-testid="properties-empty">
          {t("editor.properties.empty")}
        </p>
      )}

      {layer && (
        <div className="space-y-2" data-testid="layer-properties" data-layer-id={layer.id}>
          <div className="border border-border">
            <ReliefRow layer={layer} source={logoSources[layer.id]} />
            <AppearanceRow layer={layer} source={logoSources[layer.id]} />
          </div>
          <LayerProperties key={layer.id} layer={layer} faceDiameterMm={faceDiameterMm} />
        </div>
      )}

      {zone && <ZoneProperties zone={zone} />}

      {partIndex != null && <PartProperties index={partIndex} />}
    </div>
  );
}
