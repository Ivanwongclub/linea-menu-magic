import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useEditorStore } from "../../store/useEditorStore";
import { BUNDLED_FONTS } from "../../lib/fonts";
import { newTextLayer, type TextLayer } from "../../lib/recipe";
import { MmField } from "./MmField";

const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

function LayerRow({ layer, selected }: { layer: TextLayer; selected: boolean }) {
  const { t } = useI18n();
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const removeLayer = useEditorStore((s) => s.removeLayer);
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: layer.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid="text-layer-row"
      data-layer-id={layer.id}
      data-selected={selected}
      className={cn(
        "group flex items-center border bg-background transition-colors",
        selected ? "border-foreground" : "border-border hover:border-foreground/40",
        isDragging && "relative z-10 shadow-sm",
      )}
    >
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
        onClick={() => selectLayer(layer.id)}
        className="flex-1 min-w-0 py-2 pr-2 text-left"
      >
        <span className={cn("block truncate text-sm tracking-wide", layer.content.value ? "text-foreground" : "text-muted-foreground italic")}>
          {layer.content.value || t("editor.branding.emptyLayer")}
        </span>
      </button>
      <button
        type="button"
        data-testid="text-layer-delete"
        aria-label={t("editor.branding.delete")}
        onClick={() => removeLayer(layer.id)}
        className="self-stretch px-2 text-muted-foreground hover:text-foreground"
      >
        <X className="w-3.5 h-3.5" strokeWidth={1.5} />
      </button>
    </li>
  );
}

function LayerEditor({ layer }: { layer: TextLayer }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);

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
          className="w-full border-b border-border bg-transparent py-1 text-base tracking-wide text-foreground outline-none focus:border-foreground transition-colors"
        />
      </div>
      <div className="grid grid-cols-[1fr_7rem] gap-4">
        <div className="space-y-1 min-w-0">
          <span id={`font-${layer.id}`} className={FIELD_LABEL}>
            {t("editor.branding.font")}
          </span>
          <Select
            value={layer.content.font.key}
            onValueChange={(key) => updateLayer(layer.id, { content: { font: { source: "bundled", key } } })}
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
        <div className="space-y-1">
          <label htmlFor={`size-${layer.id}`} className={FIELD_LABEL}>
            {t("editor.branding.textSize")}
          </label>
          <MmField
            id={`size-${layer.id}`}
            testId="text-layer-size"
            value={layer.style.text_size_mm}
            onChange={(text_size_mm) => updateLayer(layer.id, { style: { text_size_mm } })}
            className="h-8"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * BRANDING (v3-review §3): the text and its font are panel-first; spatial
 * values arrive on the model in 4h/4i. Emboss/deboss and fill are absent
 * until their phases (rulings §6) — no placeholder controls.
 */
export function BrandingGroup({ faceDiameterMm }: { faceDiameterMm: number }) {
  const { t } = useI18n();
  const layers = useEditorStore((s) => s.recipe.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const addLayer = useEditorStore((s) => s.addLayer);
  const moveLayer = useEditorStore((s) => s.moveLayer);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const selected = layers.find((l) => l.id === selectedLayerId) ?? null;

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    moveLayer(
      layers.findIndex((l) => l.id === active.id),
      layers.findIndex((l) => l.id === over.id),
    );
  };

  return (
    <div className="border border-border p-4 space-y-3" data-testid="branding-group">
      <div className="flex items-center justify-between">
        <h3 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{t("editor.panel.branding")}</h3>
        <button
          type="button"
          data-testid="add-text"
          onClick={() => addLayer(newTextLayer(crypto.randomUUID(), faceDiameterMm))}
          className="flex items-center gap-1 text-xs tracking-[0.05em] text-foreground underline-offset-4 hover:underline"
        >
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          {t("editor.branding.addText")}
        </button>
      </div>

      {layers.length === 0 ? (
        <p className="text-xs text-muted-foreground">{t("editor.branding.empty")}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={layers.map((l) => l.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-1.5" aria-label={t("editor.branding.layers")} data-testid="text-layers">
              {layers.map((layer) => (
                <LayerRow key={layer.id} layer={layer} selected={layer.id === selectedLayerId} />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      {selected && <LayerEditor key={selected.id} layer={selected} />}
    </div>
  );
}
