import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SortableList } from "@/components/admin/shared/SortableList";
import { SELECT_NONE_VALUE } from "@/components/admin/shared/flatCrudFields";
import { finishDisplayName, finishSwatchStyle, type FinishRow } from "@/features/admin/hooks/useFinishes";

interface Props {
  attached: FinishRow[];
  defaultFinishId: string | null;
  onReorder: (finishIdsInOrder: string[]) => void;
  onDetach: (finish: FinishRow) => void;
  onSetDefault: (finishId: string | null) => void;
  busy?: boolean;
}

export function AttachedFinishesList({ attached, defaultFinishId, onReorder, onDetach, onSetDefault, busy }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          Attached ({attached.length})
        </span>
      </div>

      {attached.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing attached yet — click swatches below to add finishes.</p>
      ) : (
        <div className="space-y-1">
          <SortableList
            items={attached}
            getId={(f) => f.id}
            onReorder={(items) => onReorder(items.map((f) => f.id))}
            renderItem={(f, dragHandleProps) => (
              <div
                data-testid="attached-finish"
                data-code={f.cyc_code ?? ""}
                className="flex items-center gap-3 border border-border bg-background px-2 py-1.5"
              >
                <button
                  type="button"
                  className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                  aria-label="Drag to reorder"
                  {...dragHandleProps}
                >
                  <GripVertical className="w-4 h-4" />
                </button>
                <div className="w-7 h-7 border border-border/60 shrink-0" style={finishSwatchStyle(f)} />
                <span className="font-mono text-xs text-muted-foreground w-20 shrink-0">{f.cyc_code ?? "—"}</span>
                <span className="text-sm flex-1 truncate">{finishDisplayName(f)}</span>
                {defaultFinishId === f.id && (
                  <span className="text-[10px] uppercase tracking-wider text-foreground border border-foreground px-1.5">
                    Default
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                  aria-label={`Detach ${f.cyc_code ?? finishDisplayName(f)}`}
                  disabled={busy}
                  onClick={() => onDetach(f)}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          />
        </div>
      )}

      <div className="max-w-sm space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Default finish</Label>
        <Select
          value={defaultFinishId ?? SELECT_NONE_VALUE}
          onValueChange={(v) => onSetDefault(v === SELECT_NONE_VALUE ? null : v)}
          disabled={busy || attached.length === 0}
        >
          <SelectTrigger className="rounded-none" data-testid="default-finish-select">
            <SelectValue placeholder="— No default —" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={SELECT_NONE_VALUE}>— No default —</SelectItem>
            {attached.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.cyc_code ?? "—"} · {finishDisplayName(f)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Limited to the finishes attached above.</p>
      </div>
    </div>
  );
}
