import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { DOCK_ROW_PX } from "../lib/rowWindow";

export function PartRow({
  testId,
  index,
  name,
  detail,
  visible,
  selected,
  hovered,
  onHover,
  onHoverEnd,
  onSelect,
  onDoubleSelect,
  onToggle,
}: {
  testId: string;
  index?: number;
  name: string;
  detail: string;
  visible: boolean;
  selected?: boolean;
  hovered?: boolean;
  onHover?: () => void;
  onHoverEnd?: () => void;
  /** The lettering row is the recipe's, not one of the model's parts: it has nothing to select. */
  onSelect?: () => void;
  onDoubleSelect?: () => void;
  onToggle: () => void;
}) {
  const { t } = useI18n();
  return (
    // A fixed height, because past 50 rows a row's place in the list is
    // arithmetic (`lib/rowWindow`), not something the browser lays out.
    <li
      style={{ height: DOCK_ROW_PX }}
      className={cn(
        "flex items-center gap-2 border-b border-l-2 border-border px-2",
        selected ? "border-l-foreground bg-secondary" : "border-l-transparent",
        hovered && "border-l-blue-600 bg-blue-50 text-blue-700",
      )}
      data-testid={testId}
      data-index={index}
      data-visible={visible}
      data-selected={selected}
      data-hovered={hovered}
      onPointerEnter={onHover}
      onPointerLeave={onHoverEnd}
    >
      {onSelect ? (
        <button type="button" data-testid="part-select" aria-pressed={selected} onClick={onSelect} onDoubleClick={onDoubleSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{detail}</span>
        </button>
      ) : (
        <>
          <span className="min-w-0 flex-1 truncate text-xs text-foreground">{name}</span>
          <span className="shrink-0 text-[10px] text-muted-foreground">{detail}</span>
        </>
      )}
      <button
        type="button"
        data-testid="part-visibility"
        aria-pressed={visible}
        aria-label={t(visible ? "editor.parts.hide" : "editor.parts.show", { name })}
        onClick={onToggle}
        className="shrink-0 text-muted-foreground hover:text-foreground"
      >
        {visible ? <Eye className="h-3.5 w-3.5" strokeWidth={1.5} /> : <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />}
      </button>
    </li>
  );
}
