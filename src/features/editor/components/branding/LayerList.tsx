import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { selectSelectedLayerId, useEditorStore } from "../../store/useEditorStore";
import { isLogoLayer, type Layer } from "../../lib/recipe";
import { deleteLogoAsset, type LogoSource } from "../../hooks/useLogoAssets";

/**
 * The layers on the part, in the order they are applied (E2 U2): the list and
 * its rows, nothing else. Selecting a row is what the Properties panel reads
 * (U6), so a row carries a name, a grip and a delete — its relief, appearance
 * and placement are shown there, for the selected layer only.
 */
export function LayerList({ layers, logoSources }: { layers: Layer[]; logoSources: Record<string, LogoSource> }) {
  const { t } = useI18n();
  const selectedLayerId = useEditorStore(selectSelectedLayerId);
  const moveLayer = useEditorStore((s) => s.moveLayer);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    moveLayer(
      layers.findIndex((l) => l.id === active.id),
      layers.findIndex((l) => l.id === over.id),
    );
  };

  if (layers.length === 0) return <p className="text-xs text-muted-foreground">{t("editor.branding.empty")}</p>;

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={layers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-1.5" aria-label={t("editor.branding.layers")} data-testid="text-layers">
          {layers.map((layer) => (
            <LayerRow key={layer.id} layer={layer} selected={layer.id === selectedLayerId} logoSource={logoSources[layer.id]} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function LayerRow({ layer, selected, logoSource }: { layer: Layer; selected: boolean; logoSource?: LogoSource }) {
  const { t } = useI18n();
  const select = useEditorStore((s) => s.select);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const onDelete = () => {
    // A logo's file goes with its layer (4k R7); an undo puts both back.
    if (isLogoLayer(layer) && layer.content.asset_id) void deleteLogoAsset(layer.content.asset_id);
    removeLayer(layer.id);
  };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid="text-layer-row"
      data-layer-id={layer.id}
      data-selected={selected}
      className={cn(
        "group flex border bg-background transition-colors",
        selected ? "border-foreground" : "border-border hover:border-foreground/40",
        isDragging && "relative z-10 shadow-sm",
      )}
    >
      <div className="flex items-center">
        <button
          type="button"
          ref={setActivatorNodeRef}
          data-testid="text-layer-handle"
          aria-label={t("editor.branding.reorder")}
          className="self-stretch px-1.5 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
        <button
          type="button"
          data-testid="text-layer-select"
          aria-pressed={selected}
          onClick={() => select({ kind: "layer", id: layer.id })}
          className="flex-1 min-w-0 py-2 pr-2 text-left"
        >
          {isLogoLayer(layer) ? (
            <span className="flex items-center gap-2">
              <LogoThumbnail source={logoSource} />
              <span className="truncate text-sm tracking-wide text-foreground">{t("editor.branding.logoLayer")}</span>
            </span>
          ) : (
            <span className={cn("block truncate text-sm tracking-wide", layer.content.value ? "text-foreground" : "text-muted-foreground italic")}>
              {layer.content.value || t("editor.branding.emptyLayer")}
            </span>
          )}
        </button>
        <button
          type="button"
          data-testid="text-layer-delete"
          aria-label={t("editor.branding.delete")}
          onClick={onDelete}
          className="self-stretch px-2 text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </li>
  );
}

/** The uploaded artwork itself, at row size (4k R4) — vector or raster (6a). */
function LogoThumbnail({ source }: { source?: LogoSource }) {
  if (!source) return <span className="h-5 w-5 shrink-0 border border-border bg-secondary" data-testid="logo-thumbnail" data-loaded="false" />;
  const src = source.kind === "raster" ? source.url : `data:image/svg+xml;utf8,${encodeURIComponent(source.svg)}`;
  return <img src={src} alt="" data-testid="logo-thumbnail" data-loaded="true" data-kind={source.kind} className="h-5 w-5 shrink-0 object-contain" />;
}
