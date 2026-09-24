import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * One section of the layers dock (E2 §3.4 item 3): a title, a count, whatever
 * that section adds, and rows that can be folded away.
 *
 * The count is the point of the sectioning — Branding, Zones and Parts answer
 * "what is on this part" at three different scales, and a buyer reading a
 * 33-row list of `object_11` could not tell which of them they were looking
 * at. It is rendered as a bare numeral and carried on `data-count`, so it needs
 * no shortened translation of its own (E2 §4.3).
 */
export function DockSection({
  testId,
  toggleTestId,
  title,
  count,
  open,
  onToggle,
  summary,
  actions,
  children,
}: {
  testId: string;
  toggleTestId: string;
  title: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  /** A section's own one-line state, beside the count (Parts' hidden tally). */
  summary?: ReactNode;
  /** What this section adds — Add text, Add logo, Add zone. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section data-testid={testId} data-count={count} data-open={open} className="border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 px-3 py-1.5">
        <button
          type="button"
          data-testid={toggleTestId}
          aria-expanded={open}
          onClick={onToggle}
          className="flex min-w-0 shrink-0 items-center gap-1 text-left text-[11px] uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")} strokeWidth={1.5} />
          <span className="truncate">{title}</span>
          <span className="tabular-nums normal-case tracking-normal" data-testid={`${testId}-count`}>
            {count}
          </span>
        </button>
        {summary}
        {actions && <div className="ml-auto flex shrink-0 items-center gap-3">{actions}</div>}
      </div>
      {open && <div className="px-3 pb-3">{children}</div>}
    </section>
  );
}
