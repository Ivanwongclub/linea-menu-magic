import { useState } from "react";
import { Layers2, X } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import { normalizeHex } from "../../lib/pantone";
import { runsLength } from "../../lib/zones";
import { ZoneRegionControls } from "../branding/ZoneRegionControls";

/** Non-modal setup: the buyer can still pick and drag directly on the model. */
export function ZoneCreationPanel() {
  const { t } = useI18n();
  const zone = useEditorStore(s => s.zoneDraft);
  const inheritedHex = useEditorStore(s => s.recipe.base_colour_hex ?? s.partsReport?.groups[0]?.materials?.[0]?.colour ?? "#9A9A9A");
  const [hexDraft, setHexDraft] = useState<string | null>(null);
  if (!zone) return null;
  const { updateZone, confirmZoneDraft, cancelZoneDraft } = useEditorStore.getState();
  const hex = zone.appearance.colour_hex ?? inheritedHex;
  const empty = zone.method === "groups" ? !zone.groups?.length : zone.method === "paint" ? !runsLength(zone.faces) : false;
  return <aside data-testid="zone-creation-panel" aria-label={t("editor.zones.createTitle")} className="absolute right-3 top-14 z-20 flex max-h-[calc(100%_-_7rem)] w-72 max-w-[calc(100%_-_1.5rem)] flex-col gap-3 border border-blue-600 bg-background p-4 shadow-lg" onKeyDown={event => { if (event.nativeEvent.isComposing) return; if (event.key === "Escape") { event.stopPropagation(); cancelZoneDraft(); } if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") event.stopPropagation(); }}>
    <div className="flex items-center gap-2"><Layers2 className="h-4 w-4 text-blue-600" /><h3 className="flex-1 text-sm font-medium">{t("editor.zones.createTitle")}</h3><button type="button" aria-label={t("editor.zones.cancel")} onClick={cancelZoneDraft}><X className="h-4 w-4" /></button></div>
    <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
    <p className="text-xs text-muted-foreground">{t("editor.zones.previewHint")}</p>
    <input aria-label={t("editor.zones.name")} data-testid="zone-draft-name" value={zone.name} onChange={event => updateZone(zone.id, { name: event.target.value })} className="w-full border border-border bg-transparent px-2 py-1 text-sm" />
    <ZoneRegionControls zone={zone} creating />
    <label className="block space-y-1 border-t border-border pt-3 text-xs">{t("editor.zones.fillColour")}<input type="color" aria-label={t("editor.zones.fillColour")} data-testid="zone-draft-colour" value={hex} onChange={event => updateZone(zone.id, { appearance: { ...zone.appearance, colour_hex: event.target.value } })} className="block h-9 w-full cursor-pointer border border-border bg-transparent p-1" /></label>
    <input aria-label={t("editor.colour.hex")} data-testid="zone-draft-hex" value={hexDraft ?? hex} maxLength={7} onFocus={() => setHexDraft(hex)} onChange={event => { setHexDraft(event.target.value); const colour = normalizeHex(event.target.value); if (colour) updateZone(zone.id, { appearance: { ...zone.appearance, colour_hex: colour } }); }} onBlur={() => setHexDraft(null)} className="w-full border border-border bg-transparent px-2 py-1 font-mono text-xs" />
    <button type="button" data-testid="zone-draft-reset-colour" disabled={!zone.appearance.colour_hex} onClick={() => { const appearance = { ...zone.appearance }; delete appearance.colour_hex; updateZone(zone.id, { appearance }); }} className="text-xs text-muted-foreground underline underline-offset-2 disabled:opacity-40">{t("editor.colour.reset")}</button>
    </div>
    <div className="flex shrink-0 justify-end gap-2 border-t border-border pt-3"><button type="button" data-testid="zone-draft-cancel" onClick={cancelZoneDraft} className="border border-border px-3 py-1.5 text-xs">{t("editor.zones.cancel")}</button><button type="button" data-testid="zone-draft-confirm" disabled={empty || !zone.name.trim()} onClick={confirmZoneDraft} className="border border-foreground bg-foreground px-3 py-1.5 text-xs text-background disabled:opacity-40">{t("editor.zones.confirm")}</button></div>
  </aside>;
}
