import { Layers2, X } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { EMPTY_ZONES, selectSelectedZoneId, selectZones, useEditorStore } from "../../store/useEditorStore";
import { newZone, type Zone } from "../../lib/recipe";
import type { ZoneMethod } from "../../lib/zones";

const METHODS: { value: ZoneMethod; label: string }[] = [
  { value: "plane", label: "editor.zones.methodPlane" },
  { value: "groups", label: "editor.zones.methodParts" },
  { value: "paint", label: "editor.zones.methodPaint" },
];

/**
 * Add zone (Phase 6b R2), in the dock's Zones section since E2 U5: the three
 * ways to say which part of the surface a second finish covers — a plane
 * dragged along the model's height, one or more of its parts, or a brush.
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
  const { t } = useI18n();
  const zones = useEditorStore(selectZones);
  // Since E2 U5 this is a section of the dock with a count of its own, so an
  // empty one says what it is empty of rather than leaving a blank box.
  if (zones.length === 0) return <p className="text-xs text-muted-foreground">{t("editor.zones.empty")}</p>;
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
  const select = useEditorStore((s) => s.select);
  const selectedZoneId = useEditorStore(selectSelectedZoneId);

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

    </li>
  );
}
