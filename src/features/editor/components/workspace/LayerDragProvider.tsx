import { useState, type ReactNode } from "react";
import { DndContext, DragOverlay, KeyboardSensor, PointerSensor, closestCenter, defaultKeyboardCoordinateGetter, pointerWithin, useDroppable, useSensor, useSensors, type CollisionDetection, type DragEndEvent, type Over } from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { groupForMember, type PaintGroupMember } from "../../lib/paintGroups";
import { useEditorStore } from "../../store/useEditorStore";
import { LayerDragContext, useLayerDrag, type LayerDropDestination as Destination } from "../../hooks/useLayerDrag";

export interface MemberDragData { kind: "member"; member: PaintGroupMember; name: string }
type DropData = MemberDragData | { kind: "group"; groupId: string } | { kind: "root"; memberKind: PaintGroupMember["kind"] };

function destinationFor(over: Over | null, member: PaintGroupMember): Destination | null {
  const data = over?.data.current as DropData | undefined;
  if (!data) return null;
  if (data.kind === "group") return { groupId: data.groupId };
  if (data.kind === "root") return data.memberKind === member.kind ? { groupId: null } : null;
  if (data.member.kind === "layer" && member.kind === "layer") return { groupId: groupForMember(useEditorStore.getState().recipe, data.member)?.id ?? null, overLayerId: data.member.id };
  return null;
}

const collisions: CollisionDetection = args => {
  const active = args.active.data.current as MemberDragData | undefined;
  if (!active?.member) return [];
  const droppableContainers = args.droppableContainers.filter(container => {
    const data = container.data.current as DropData | undefined;
    return data?.kind === "group" || (data?.kind === "root" && data.memberKind === active.member.kind) || (data?.kind === "member" && active.member.kind === "layer" && data.member.kind === "layer");
  });
  const found = args.pointerCoordinates ? pointerWithin({ ...args, droppableContainers }) : closestCenter({ ...args, droppableContainers });
  // Prefer a child layer's insertion position over its containing folder.
  return found.sort((a, b) => {
    const score = (id: typeof a.id) => droppableContainers.find(container => container.id === id)?.data.current?.kind === "member" ? 0 : 1;
    return score(a.id) - score(b.id);
  });
};

export function LayerDragProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [active, setActive] = useState<MemberDragData | null>(null);
  const [destination, setDestination] = useState<Destination | null>(null);
  const groups = useEditorStore(s => s.recipe.paint_groups);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }), useSensor(KeyboardSensor, { coordinateGetter: (event, args) => (args.context.active?.data.current as MemberDragData | undefined)?.member.kind === "layer" ? sortableKeyboardCoordinates(event, args) ?? defaultKeyboardCoordinateGetter(event, args) : defaultKeyboardCoordinateGetter(event, args) }));
  const done = () => { setActive(null); setDestination(null); useEditorStore.getState().endDrag(); };
  const drop = ({ active, over }: DragEndEvent) => {
    const data = active.data.current as MemberDragData | undefined;
    const target = data?.member ? destinationFor(over, data.member) : null;
    if (data?.member && target) useEditorStore.getState().movePaintGroupMember(data.member, target.groupId, target.overLayerId);
    done();
  };
  const name = destination?.groupId ? groups?.find(group => group.id === destination.groupId)?.name : null;
  return <DndContext sensors={sensors} collisionDetection={collisions} onDragStart={({ active }) => {
    setActive(active.data.current as MemberDragData);
    useEditorStore.getState().setHoveredPart(null);
    useEditorStore.getState().beginDrag();
  }} onDragOver={({ over, active }) => setDestination(destinationFor(over, (active.data.current as MemberDragData).member))} onDragEnd={drop} onDragCancel={done}>
    <LayerDragContext.Provider value={{ member: active?.member ?? null, destination }}>{children}</LayerDragContext.Provider>
    <DragOverlay dropAnimation={null}>{active && <div className="pointer-events-none max-w-64 border border-blue-600 bg-background px-3 py-2 text-xs shadow-lg" data-testid="layer-drag-overlay"><div className="flex items-center gap-2"><GripVertical className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{active.name}</span></div><p className="mt-1 text-[11px] text-blue-600">{name ? t("editor.groups.dropInto", { name }) : destination ? t("editor.groups.dropRoot") : t("editor.groups.dragHint")}</p></div>}</DragOverlay>
  </DndContext>;
}

export function UngroupedDropTarget({ kind, children }: { kind: PaintGroupMember["kind"]; children: ReactNode }) {
  const { setNodeRef } = useDroppable({ id: `root:${kind}`, data: { kind: "root", memberKind: kind } });
  const drag = useLayerDrag();
  const over = drag.member?.kind === kind && drag.destination?.groupId === null;
  return <div ref={setNodeRef} data-testid={`ungrouped-drop-${kind}`} data-drop-over={over || undefined} className={over ? "bg-blue-50 ring-2 ring-inset ring-blue-600" : undefined}>{children}</div>;
}
