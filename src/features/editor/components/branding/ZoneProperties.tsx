import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useEditorStore } from "../../store/useEditorStore";
import { runsLength } from "../../lib/zones";
import type { AppearanceMode, Zone } from "../../lib/recipe";
import { ValueSlider } from "../controls/ValueSlider";
import { AppearanceControl } from "./AppearanceControl";

/** A zone is plating or paint; ink and "same as the part" are a layer's business. */
const ZONE_MODES: AppearanceMode[] = ["plated", "paint"];

/**
 * What a zone is, once it is the selection (E2 U6): where it cuts, which parts
 * it covers or how wide the brush is — and what it is made of. Split out of the
 * zone's row so the row is a name and the properties are here.
 */
export function ZoneProperties({ zone }: { zone: Zone }) {
  const { t } = useI18n();
  const updateZone = useEditorStore((s) => s.updateZone);
  const commit = useEditorStore((s) => s.commit);
  const beginDrag = useEditorStore((s) => s.beginDrag);
  const endDrag = useEditorStore((s) => s.endDrag);
  const report = useEditorStore((s) => s.partsReport);
  const paintZoneId = useEditorStore((s) => s.paintZoneId);
  const setPaintZone = useEditorStore((s) => s.setPaintZone);
  const brushRadiusMm = useEditorStore((s) => s.brushRadiusMm);
  const setBrushRadius = useEditorStore((s) => s.setBrushRadius);

  const bounds = report?.bounds;
  const painting = paintZoneId === zone.id;

  return (
    <div className="space-y-2" data-testid="zone-properties" data-zone-id={zone.id} data-method={zone.method}>
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
    </div>
  );
}
