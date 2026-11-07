import { toast } from "sonner";
import { randomUUID } from "@/lib/uuid";
import { useI18n } from "@/features/i18n/I18nProvider";
import { selectZones, useEditorStore } from "../store/useEditorStore";
import { DEFAULT_APPEARANCE, newZone, type LayerAppearance } from "../lib/recipe";
import { MAX_ZONES } from "../lib/shaderPatch";

/** Both the quick editor and detailed properties edit the same source-part mask. */
export function usePartAppearance(index: number | null) {
  const { t } = useI18n();
  const zones = useEditorStore(selectZones);
  const group = useEditorStore(s => s.partsReport?.groups.find(group => group.index === index));
  const covering = zones.filter(zone => index !== null && zone.method === "groups" && zone.groups?.includes(index));
  const partZone = [...covering].reverse().find(zone => zone.groups?.length === 1);
  const appearance = partZone?.appearance ?? DEFAULT_APPEARANCE;

  const changeAppearance = (patch: Partial<LayerAppearance>) => {
    if (!group || index === null) return;
    const state = useEditorStore.getState();
    const next = { ...appearance, ...patch };
    if (next.mode === "part") {
      if (partZone) state.removeZone(partZone.id);
    } else if (partZone) {
      state.updateZone(partZone.id, { appearance: next });
      state.commit();
    } else {
      // Shader masks have a fixed capacity: never offer a successful-looking
      // edit which would be silently dropped by the renderer.
      if ((state.recipe.zones?.length ?? 0) >= MAX_ZONES) {
        toast.error(t("editor.quickAppearance.zoneLimit", { count: MAX_ZONES }));
        return;
      }
      const zone = newZone(randomUUID(), group.name, "groups");
      state.addZone({ ...zone, groups: [index], appearance: next });
    }
    state.select({ kind: "part", id: String(index) });
  };

  return { appearance, changeAppearance, covering, partZone };
}
