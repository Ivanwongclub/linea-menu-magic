import { Type } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";

/**
 * Staff only (catalogue editors and designer staff, 4j R3): draws the
 * product's marked branding groups that the buyer view hides. A view
 * setting, never saved to the recipe. Sits beside the ruler toggle.
 */
export function OriginalLetteringToggle({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  const { t } = useI18n();
  return (
    <button
      type="button"
      data-testid="original-lettering-toggle"
      aria-pressed={active}
      onClick={onToggle}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 text-xs tracking-wide border transition-colors",
        active ? "bg-foreground text-background border-foreground" : "bg-background/90 text-foreground border-border hover:border-foreground/50",
      )}
    >
      <Type className="w-3.5 h-3.5" strokeWidth={1.5} />
      {t("editor.viewport.showOriginal")}
    </button>
  );
}
