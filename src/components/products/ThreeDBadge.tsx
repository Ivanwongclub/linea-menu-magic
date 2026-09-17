import { Box } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/I18nProvider";

/**
 * The one 3D mark (5b R1): the same badge on catalogue cards, the product
 * page and the trim library, shown only where `is3DReady` says the editor
 * will actually open. Site tokens only — no bare white, no brand colour.
 */
export function ThreeDBadge({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span
      data-testid="badge-3d"
      title={t("product.badge.threeDReady")}
      className={cn(
        "inline-flex items-center gap-1 border border-border bg-background/90 px-2 py-0.5",
        "text-[9px] font-medium uppercase tracking-[0.08em] text-foreground backdrop-blur-sm rounded-[var(--radius)]",
        className,
      )}
    >
      <Box className="w-2.5 h-2.5" strokeWidth={1.5} aria-hidden="true" />
      3D
      <span className="sr-only"> — {t("product.badge.threeDReady")}</span>
    </span>
  );
}

export default ThreeDBadge;
