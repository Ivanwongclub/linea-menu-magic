import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { finishDisplayName, finishSwatchStyle, type FinishRow } from "@/features/admin/hooks/useFinishes";

interface Props {
  finishes: FinishRow[];
  attachedIds: Set<string>;
  onToggle: (finish: FinishRow) => void;
  busy?: boolean;
}

export function FinishSwatchGrid({ finishes, attachedIds, onToggle, busy }: Props) {
  if (finishes.length === 0) {
    return <p className="text-sm text-muted-foreground py-10 text-center">No finishes match.</p>;
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
      {finishes.map((f) => {
        const attached = attachedIds.has(f.id);
        return (
          <button
            key={f.id}
            type="button"
            data-testid="finish-swatch"
            data-code={f.cyc_code ?? ""}
            aria-pressed={attached}
            disabled={busy}
            onClick={() => onToggle(f)}
            title={`${f.cyc_code ?? "—"} · ${f.factory_name_en}`}
            className={cn(
              "group text-left border p-1.5 space-y-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              attached ? "border-foreground bg-secondary/40" : "border-border hover:border-foreground/50",
            )}
          >
            <div className="relative aspect-square w-full border border-border/60" style={finishSwatchStyle(f)}>
              {attached && (
                <span className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-foreground text-background">
                  <Check className="w-3 h-3" />
                </span>
              )}
            </div>
            <div className="font-mono text-[10px] text-muted-foreground truncate">{f.cyc_code ?? "no code"}</div>
            <div className="text-xs text-foreground truncate">{finishDisplayName(f)}</div>
            {f.status !== "active" && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{f.status}</div>}
          </button>
        );
      })}
    </div>
  );
}
