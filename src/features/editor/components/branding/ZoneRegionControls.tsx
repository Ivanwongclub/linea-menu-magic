import { MousePointer2 } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import { zoneAxisRange, runsLength, type ZoneMethod, type ZonePlane } from "../../lib/zones";
import type { Zone } from "../../lib/recipe";
import { ValueSlider } from "../controls/ValueSlider";

const METHODS: ZoneMethod[] = ["plane", "groups", "paint"];
const METHOD_LABELS = { plane: "editor.zones.methodPlane", groups: "editor.zones.methodParts", paint: "editor.zones.methodPaint" };

/** The same region definition drives the popup, properties and on-model handle. */
export function ZoneRegionControls({ zone, prefix = "zone-region", creating = false }: { zone: Zone; prefix?: string; creating?: boolean }) {
  const { t } = useI18n();
  const report = useEditorStore(s => s.partsReport);
  const picking = useEditorStore(s => s.zonePicking);
  const paintZoneId = useEditorStore(s => s.paintZoneId);
  const previewVisible = useEditorStore(s => s.zonePreviewVisible);
  const brushRadiusMm = useEditorStore(s => s.brushRadiusMm);
  const { updateZone, commit, beginDrag, endDrag, setPaintZone, setZonePicking, setBrushRadius } = useEditorStore.getState();
  const bounds = report?.bounds;
  const plane = zone.plane;
  const range = bounds && plane ? zoneAxisRange(bounds, plane.axis) : [0, 1];
  const changeMethod = (method: ZoneMethod) => {
    updateZone(zone.id, { method, plane: plane ?? { axis: "y", at_mm: bounds ? (bounds.minY + bounds.maxY) / 2 : 0, side: "above" }, groups: zone.groups ?? [], faces: zone.faces ?? [] });
    setPaintZone(method === "paint" ? zone.id : null);
    setZonePicking(method === "groups");
    if (!creating) commit();
  };
  const changePlane = (patch: Partial<ZonePlane>) => { updateZone(zone.id, { plane: { ...plane!, ...patch } }); if (!creating) commit(); };

  return <div className="space-y-3" data-testid={`${prefix}-controls`}>
    <div>
      <h4 className="mb-1 text-xs font-medium">{t("editor.zones.where")}</h4>
      <div className="grid grid-cols-3 border border-border" role="group" aria-label={t("editor.zones.where")}>
        {METHODS.map(method => <button type="button" key={method} data-testid={creating ? `add-zone-${method}` : `${prefix}-method-${method}`} aria-pressed={zone.method === method} onClick={() => changeMethod(method)} className={`px-1 py-2 text-[11px] ${zone.method === method ? "bg-foreground text-background" : "text-muted-foreground hover:bg-secondary"}`}>{t(METHOD_LABELS[method])}</button>)}
      </div>
    </div>
    {zone.method === "plane" && plane && bounds && <>
      <div className="grid grid-cols-3 gap-1" role="group" aria-label={t("editor.zones.axis")}>
        {(["x", "y", "z"] as const).map(axis => <button type="button" key={axis} data-testid={`${prefix}-axis-${axis}`} aria-pressed={plane.axis === axis} onClick={() => { const [min, max] = zoneAxisRange(bounds, axis); changePlane({ axis, at_mm: (min + max) / 2 }); }} className={`border px-1 py-2 text-xs ${plane.axis === axis ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border text-muted-foreground"}`}>{axis.toUpperCase()} <span className="text-[10px]">{t(`editor.zones.axis.${axis}`)}</span></button>)}
      </div>
      <ValueSlider id={`${prefix}-plane-${zone.id}`} testId={prefix === "zone" ? "zone-plane" : `${prefix}-position`} label={t("editor.zones.planeHeight")} unit="mm" value={plane.at_mm} min={range[0]} max={range[1]} hardMin={range[0]} hardMax={range[1]} onChange={at_mm => updateZone(zone.id, { plane: { ...plane, at_mm } })} onCommit={commit} onDragStart={beginDrag} onDragEnd={endDrag} />
      <div className="flex border border-border" role="radiogroup" aria-label={t("editor.zones.side")} data-testid={prefix === "zone" ? "zone-side" : `${prefix}-side`}>
        {(["below", "above"] as const).map(side => <button type="button" role="radio" key={side} data-value={side} aria-checked={plane.side === side} onClick={() => changePlane({ side })} className={`flex-1 px-2 py-1.5 text-xs ${plane.side === side ? "bg-foreground text-background" : "text-muted-foreground"}`}>{t(`editor.zones.side.${plane.axis}.${side}`)}</button>)}
      </div>
      <button type="button" data-testid={`${prefix}-pick`} aria-pressed={picking} onClick={() => setZonePicking(!picking)} className={`flex w-full items-center justify-center gap-1 border px-2 py-1.5 text-xs ${picking ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border"}`}><MousePointer2 className="h-3.5 w-3.5" />{t(picking ? "editor.zones.pickActive" : "editor.zones.pickPosition")}</button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">{t("editor.zones.planeHint")}</p>
    </>}
    {zone.method === "groups" && <>
      <button type="button" data-testid={`${prefix}-pick`} aria-pressed={picking} onClick={() => setZonePicking(!picking)} className={`w-full border px-2 py-1.5 text-xs ${picking ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border"}`}>{t(picking ? "editor.zones.pickPartsActive" : "editor.zones.pickParts")}</button>
      <ul className="max-h-32 space-y-1 overflow-y-auto" data-testid={prefix === "zone" ? "zone-parts" : `${prefix}-parts`}>
        {(report?.groups ?? []).map(group => { const chosen = zone.groups?.includes(group.index); return <li key={group.index}><button type="button" data-testid={prefix === "zone" ? "zone-part" : `${prefix}-part`} data-index={group.index} aria-pressed={!!chosen} onClick={() => { updateZone(zone.id, { groups: chosen ? zone.groups!.filter(index => index !== group.index) : [...(zone.groups ?? []), group.index] }); commit(); }} className={`flex w-full items-center justify-between gap-1 border px-2 py-1 text-xs ${chosen ? "border-blue-600 bg-blue-50 text-blue-700" : "border-border text-muted-foreground"}`}><span className="truncate">{group.name}</span><span className="shrink-0">{group.faces}</span></button></li>; })}
      </ul>
      <p className="text-[11px] text-muted-foreground">{t("editor.zones.partsHint")}</p>
    </>}
    {zone.method === "paint" && <>
      <ValueSlider id={`${prefix}-brush-${zone.id}`} testId={prefix === "zone" ? "zone-brush" : `${prefix}-brush`} label={t("editor.zones.brush")} unit="mm" value={brushRadiusMm} min={0.2} max={6} hardMin={0.05} onChange={setBrushRadius} />
      <button type="button" data-testid={prefix === "zone" ? "zone-paint-toggle" : `${prefix}-paint-toggle`} aria-pressed={paintZoneId === zone.id} onClick={() => setPaintZone(paintZoneId === zone.id ? null : zone.id)} className="w-full border border-border px-2 py-1.5 text-xs">{t(paintZoneId === zone.id ? "editor.zones.painting" : "editor.zones.paint")}</button>
      <p className="text-[11px] text-muted-foreground" data-testid={prefix === "zone" ? "zone-face-count" : `${prefix}-face-count`}>{t("editor.zones.faces", { count: runsLength(zone.faces) })} · {t("editor.zones.brushHint")}</p>
    </>}
    {!creating && <button type="button" data-testid={`${prefix}-preview-toggle`} aria-pressed={previewVisible} onClick={() => useEditorStore.getState().setZonePreviewVisible(!previewVisible)} className="w-full border border-border px-2 py-1.5 text-xs text-blue-700">{t(previewVisible ? "editor.zones.hidePreview" : "editor.zones.showPreview")}</button>}
  </div>;
}
