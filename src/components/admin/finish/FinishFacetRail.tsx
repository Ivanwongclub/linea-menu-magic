import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  FINISH_AXES,
  type AxisValues,
  type FacetSelection,
  type FinishAxisKey,
} from "@/features/admin/hooks/useFinishes";

interface Props {
  axes: AxisValues;
  selected: FacetSelection;
  onToggle: (axis: FinishAxisKey, valueId: string) => void;
  onClear: () => void;
  /** Finishes that would match if this value were (also) selected — standard faceted counting. */
  countFor: (axis: FinishAxisKey, valueId: string) => number;
}

/**
 * Filter rail for the finish picker. Rendered entirely from the axis tables;
 * nothing here knows any axis value by name.
 */
export function FinishFacetRail({ axes, selected, onToggle, onClear, countFor }: Props) {
  const anySelected = FINISH_AXES.some((a) => selected[a.key].length > 0);

  return (
    <aside className="w-56 shrink-0 space-y-5 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">Filter</span>
        {anySelected && (
          <Button variant="ghost" size="sm" className="h-6 px-2 text-xs rounded-none" onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {FINISH_AXES.map((axis) => {
        const values = (axes[axis.key] ?? []).filter((v) => v.is_active || selected[axis.key].includes(v.id));
        if (values.length === 0) return null;
        return (
          <div key={axis.key} className="space-y-1.5">
            <div className="text-xs font-medium tracking-wide text-foreground">{axis.label}</div>
            <ul className="space-y-1">
              {values.map((v) => {
                const checked = selected[axis.key].includes(v.id);
                const count = countFor(axis.key, v.id);
                return (
                  <li key={v.id}>
                    <label
                      data-testid={`facet-${axis.key}-${v.code}`}
                      className={cn(
                        "flex items-center gap-2 cursor-pointer",
                        count === 0 && !checked && "text-muted-foreground/60",
                      )}
                    >
                      <Checkbox checked={checked} onCheckedChange={() => onToggle(axis.key, v.id)} />
                      <span className="flex-1 truncate">{v.name}</span>
                      <span data-testid="facet-count" className="text-xs tabular-nums text-muted-foreground">
                        {count}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}
