import { useCallback, type ElementType, type ReactNode } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableItemProps {
  id: string;
  as?: ElementType;
  className?: string;
  children: (dragHandleProps: Record<string, unknown>, isDragging: boolean) => ReactNode;
}

function SortableItem({ id, as: Component = "div", className, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  return (
    <Component ref={setNodeRef} style={style} className={className}>
      {children({ ...attributes, ...listeners }, isDragging)}
    </Component>
  );
}

interface SortableListProps<T> {
  items: T[];
  getId: (item: T) => string;
  onReorder: (reordered: T[]) => void;
  renderItem: (item: T, dragHandleProps: Record<string, unknown>) => ReactNode;
  /** Element each item renders as — "tr" for a table body, "div" (default) for a plain list. */
  as?: ElementType;
  itemClassName?: string;
  /** "grid" for items laid out in a CSS grid (image galleries); default is a vertical list. */
  layout?: "vertical" | "grid";
}

/**
 * Thin, generic dnd-kit wrapper — same mechanics as PageManager.tsx's
 * working sortable-page-list (sensors, closestCenter, arrayMove), extracted
 * so every reorderable list in the admin CMS (taxonomy rows, attached
 * finishes, ...) shares one implementation instead of re-copying it.
 * Persisting the new order is the caller's job — onReorder hands back the
 * reordered array, index position implies sort_order.
 */
export function SortableList<T>({ items, getId, onReorder, renderItem, as, itemClassName, layout = "vertical" }: SortableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = items.findIndex((item) => getId(item) === active.id);
      const newIndex = items.findIndex((item) => getId(item) === over.id);
      if (oldIndex === -1 || newIndex === -1) return;
      onReorder(arrayMove(items, oldIndex, newIndex));
    },
    [items, getId, onReorder],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      // dnd-kit renders its screen-reader live region as a <div> next to the
      // items; when the items are <tr>s that div lands inside <tbody>, which
      // is invalid DOM. Portal it to <body> instead.
      accessibility={{ container: typeof document !== "undefined" ? document.body : undefined }}
    >
      <SortableContext items={items.map(getId)} strategy={layout === "grid" ? rectSortingStrategy : verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={getId(item)} id={getId(item)} as={as} className={itemClassName}>
            {(dragHandleProps) => renderItem(item, dragHandleProps)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  );
}
