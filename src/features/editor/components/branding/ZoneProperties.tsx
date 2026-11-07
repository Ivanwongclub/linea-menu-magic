import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import type { Zone } from "../../lib/recipe";
import { AppearanceControl } from "./AppearanceControl";
import { ZoneRegionControls } from "./ZoneRegionControls";

export function ZoneProperties({ zone }: { zone: Zone }) {
  const { t } = useI18n();
  return <div className="space-y-3" data-testid="zone-properties" data-zone-id={zone.id} data-method={zone.method}>
    <ZoneRegionControls zone={zone} prefix="zone" />
    <AppearanceControl ownerId={zone.id} appearance={zone.appearance} modes={["plated", "paint"]} label={t("editor.zones.appearance")} onChange={patch => { const state = useEditorStore.getState(); state.updateZone(zone.id, { appearance: { ...zone.appearance, ...patch } }); state.commit(); }} />
  </div>;
}
