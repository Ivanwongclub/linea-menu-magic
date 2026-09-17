import { Ruler as RulerIcon } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";

interface RulerToggleProps {
  active: boolean;
  onToggle: () => void;
}

/**
 * One corner control (E1 collision 17 / Phase 3 R2: a single tool, not a
 * floating toolbar), off by default. Lives over the viewport, not the panel
 * — `ruler-buyer.mjs` asserts it's absent from `editor-panel`. Positioned by
 * the viewport's bottom-right control row.
 */
export function RulerToggle({ active, onToggle }: RulerToggleProps) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      data-testid="ruler-toggle"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 text-xs tracking-wide border transition-colors",
        active ? "bg-foreground text-background border-foreground" : "bg-background/90 text-foreground border-border hover:border-foreground/50",
      )}
    >
      <RulerIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
      {t("editor.ruler.toggle")}
    </button>
  );
}
