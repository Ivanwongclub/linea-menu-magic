import { Layers2, X } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { EMPTY_ZONES, selectSelectedZoneId, selectZones, useEditorStore } from "../../store/useEditorStore";
import { newZone, type AppearanceMode, type Zone } from "../../lib/recipe";
import type { ZoneMethod } from "../../lib/zones";
import { runsLength } from "../../lib/zones";
import { ValueSlider } from "../controls/ValueSlider";
import { AppearanceControl } from "./AppearanceControl";

/** A zone is plating or paint; ink and "same as the part" are a layer's business. */
const ZONE_MODES: AppearanceMode[] = ["plated", "paint"];

const METHODS: { value: ZoneMethod; label: string }[] = [
  { value: "plane", label: "editor.zones.methodPlane" },
  { value: "groups", label: "editor.zones.methodParts" },
  { value: "paint", label: "editor.zones.methodPaint" },
];

/**
 * Add zone (Phase 6b R2), beside Add text and Add logo: the three ways to say
 * which part of the surface a second finish covers — a plane dragged along the
 * model's height, one or more of its parts, or a brush.
 */
export function AddZoneButton({ defaultPlaneMm }: { defaultPlaneMm: number }) {
  const { t } = useI18n();
  const addZone = useEditorStore((s) => s.addZone);
  const zoneCount = useEditorStore((s) => (s.recipe.zones ?? EMPTY_ZONES).length);
  const setPaintZone = useEditorStore((s) => s.setPaintZone);

  const add = (method: ZoneMethod) => {
    const zone = newZone(crypto.randomUUID(), t("editor.zones.defaultName", { n: zoneCount + 1 }), method);
    if (zone.plane) zone.plane = { ...zone.plane, at_mm: defaultPlaneMm };
    addZone(zone);
    setPaintZone(method === "paint" ? zone.id : null);
  };

  return (
    <div className="relative" data-testid="add-zone-group">
      <details className="group">
        <summary
          data-testid="add-zone"
          className="flex cursor-pointer list-none items-center gap-1 text-xs tracking-[0.05em] text-foreground underline-offset-4 hover:underline"
        >
          <Layers2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("editor.zones.add")}
        </summary>
        <div className="absolute right-0 z-20 mt-1 w-44 border border-border bg-background p-1 shadow-sm">
          {METHODS.map((method) => (
            <button
              key={method.value}
              type="button"
              data-testid={`add-zone-${method.value}`}
              onClick={(event) => {
                add(method.value);
                (event.currentTarget.closest("details") as HTMLDetailsElement | null)?.removeAttribute("open");
              }}
              className="block w-full px-2 py-1 text-left text-[11px] text-foreground hover:bg-secondary"
            >
              {t(method.label)}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}

/** The zones on the part, each with the way it was made and what it is made of. */
export function ZoneList() {
  const zones = useEditorStore(selectZones);
  if (zones.length === 0) return null;
  return (
    <ul className="space-y-1.5" data-testid="zones">
      {zones.map((zone) => (
        <ZoneRow key={zone.id} zone={zone} />
      ))}
    </ul>
  );
}

function ZoneRow({ zone }: { zone: Zone }) {
  const { t } = useI18n();
  const updateZone = useEditorStore((s) => s.updateZone);
  const removeZone = useEditorStore((s) => s.removeZone);
  const commit = useEditorStore((s) => s.commit);
  const beginDrag = useEditorStore((s) => s.beginDrag);
  const endDrag = useEditorStore((s) => s.endDrag);
  const report = useEditorStore((s) => s.partsReport);
  const select = useEditorStore((s) => s.select);
  const selectedZoneId = useEditorStore(selectSelectedZoneId);
  const paintZoneId = useEditorStore((s) => s.paintZoneId);
  const setPaintZone = useEditorStore((s) => s.setPaintZone);
  const brushRadiusMm = useEditorStore((s) => s.brushRadiusMm);
  const setBrushRadius = useEditorStore((s) => s.setBrushRadius);

  const bounds = report?.bounds;
  const painting = paintZoneId === zone.id;

  return (
    // Touching the row is selecting it (E2 U1): one selection, so this clears
    // any selected layer or part and the on-model handles with it.
    <li
      className={cn("space-y-1.5 border p-2", selectedZoneId === zone.id ? "border-foreground" : "border-border")}
      data-testid="zone-row"
      data-zone-id={zone.id}
      data-method={zone.method}
      data-selected={selectedZoneId === zone.id}
      onPointerDownCapture={() => select({ kind: "zone", id: zone.id })}
      onFocusCapture={() => select({ kind: "zone", id: zone.id })}
    >
      <div className="flex items-center gap-2">
        <input
          data-testid="zone-name"
          value={zone.name}
          aria-label={t("editor.zones.name")}
          onChange={(e) => updateZone(zone.id, { name: e.target.value })}
          onBlur={commit}
          className="min-w-0 flex-1 border-b border-border bg-transparent py-0.5 text-sm tracking-wide text-foreground outline-none focus:border-foreground"
        />
        <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-muted-foreground">{t(`editor.zones.method.${zone.method}`)}</span>
        <button
          type="button"
          data-testid="zone-delete"
          aria-label={t("editor.zones.delete")}
          onClick={() => removeZone(zone.id)}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>

      {zone.method === "plane" && zone.plane && bounds && (
        <div className="space-y-1.5">
          <ValueSlider
            id={`zone-plane-${zone.id}`}
            testId="zone-plane"
            label={t("editor.zones.planeHeight")}
            unit="mm"
            value={zone.plane.at_mm}
            min={bounds.minY}
            max={bounds.maxY}
            onChange={(at_mm) => updateZone(zone.id, { plane: { ...zone.plane!, at_mm } })}
            onCommit={commit}
            onDragStart={beginDrag}
            onDragEnd={endDrag}
          />
          <div role="radiogroup" aria-label={t("editor.zones.side")} className="flex border border-border" data-testid="zone-side">
            {(["above", "below"] as const).map((side) => (
              <button
                key={side}
                type="button"
                role="radio"
                aria-checked={zone.plane!.side === side}
                data-value={side}
                onClick={() => {
                  updateZone(zone.id, { plane: { ...zone.plane!, side } });
                  commit();
                }}
                className={cn(
                  "px-2 py-0.5 text-[11px] tracking-[0.05em] transition-colors",
                  zone.plane!.side === side ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(`editor.zones.side.${side}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {zone.method === "groups" && (
        <ul className="max-h-40 space-y-0.5 overflow-y-auto" data-testid="zone-parts">
          {(report?.groups ?? []).map((group) => {
            const chosen = (zone.groups ?? []).includes(group.index);
            return (
              <li key={group.index}>
                <button
                  type="button"
                  data-testid="zone-part"
                  data-index={group.index}
                  aria-pressed={chosen}
                  onClick={() => {
                    const groups = new Set(zone.groups ?? []);
                    if (chosen) groups.delete(group.index);
                    else groups.add(group.index);
                    updateZone(zone.id, { groups: [...groups].sort((a, b) => a - b) });
                    commit();
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 border px-2 py-0.5 text-left text-[11px] transition-colors",
                    chosen ? "border-foreground bg-secondary text-foreground" : "border-border text-muted-foreground hover:text-foreground",
                  )}
                >
                  <span className="min-w-0 flex-1 truncate">{group.name}</span>
                  <span className="shrink-0 text-[10px]">{group.faces}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {zone.method === "paint" && (
        <div className="space-y-1.5">
          <ValueSlider
            id={`zone-brush-${zone.id}`}
            testId="zone-brush"
            label={t("editor.zones.brush")}
            unit="mm"
            value={brushRadiusMm}
            min={0.2}
            max={6}
            hardMin={0.05}
            onChange={setBrushRadius}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              data-testid="zone-paint-toggle"
              aria-pressed={painting}
              onClick={() => setPaintZone(painting ? null : zone.id)}
              className={cn(
                "border px-2 py-0.5 text-[11px] tracking-[0.05em] transition-colors",
                painting ? "border-foreground bg-foreground text-background" : "border-border text-foreground hover:border-foreground",
              )}
            >
              {t(painting ? "editor.zones.painting" : "editor.zones.paint")}
            </button>
            <span className="text-[11px] text-muted-foreground" data-testid="zone-face-count">
              {t("editor.zones.faces", { count: runsLength(zone.faces) })}
            </span>
          </div>
        </div>
      )}

      <AppearanceControl
        ownerId={zone.id}
        appearance={zone.appearance}
        modes={ZONE_MODES}
        label={t("editor.zones.appearance")}
        onChange={(patch) => {
          updateZone(zone.id, { appearance: { ...zone.appearance, ...patch } });
          commit();
        }}
      />
    </li>
  );
}
