import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { FinishFacetRail } from "@/components/admin/finish/FinishFacetRail";
import { FinishSwatchGrid } from "@/components/admin/finish/FinishSwatchGrid";
import { AttachedFinishesList } from "@/components/admin/finish/AttachedFinishesList";
import {
  FINISH_AXES,
  emptySelection,
  useFinishAxes,
  useFinishes,
  type FacetSelection,
  type FinishAxisKey,
  type FinishRow,
} from "@/features/admin/hooks/useFinishes";
import { useProductFinishes } from "@/features/admin/hooks/useProductFinishes";

type SupabaseError = { message: string; code?: string };

interface Props {
  productId: string;
  defaultFinishId: string | null;
}

/**
 * Attach finishes to a metal product: faceted swatch grid on the right,
 * filter rail on the left, the attached (reorderable) list and default
 * selector above. Toggling a swatch writes immediately; the metal-gate
 * trigger's own message is what the editor sees if the database refuses.
 */
export function FinishPicker({ productId, defaultFinishId }: Props) {
  const finishesQuery = useFinishes();
  const axesQuery = useFinishAxes();
  const { query: linksQuery, attach, detach, reorder, setDefault } = useProductFinishes(productId);

  const finishes = useMemo(() => finishesQuery.data ?? [], [finishesQuery.data]);
  const byId = useMemo(() => new Map(finishes.map((f) => [f.id, f])), [finishes]);
  const links = useMemo(() => linksQuery.data ?? [], [linksQuery.data]);
  const attached = useMemo(
    () => links.map((l) => byId.get(l.finish_id)).filter((f): f is FinishRow => !!f),
    [links, byId],
  );
  const attachedIds = useMemo(() => new Set(attached.map((f) => f.id)), [attached]);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FacetSelection>(emptySelection);

  const term = search.trim().toLowerCase();
  const matchesSearch = useCallback(
    (f: FinishRow) =>
      !term ||
      (f.cyc_code ?? "").toLowerCase().includes(term) ||
      f.factory_name_en.toLowerCase().includes(term) ||
      f.marketing_name.toLowerCase().includes(term),
    [term],
  );

  // Within an axis: OR. Across axes: AND.
  const matchesAxes = useCallback(
    (f: FinishRow, except?: FinishAxisKey) =>
      FINISH_AXES.every((axis) => {
        if (axis.key === except) return true;
        const chosen = selected[axis.key];
        return chosen.length === 0 || chosen.includes(f[axis.fk] ?? "");
      }),
    [selected],
  );

  const visible = useMemo(() => finishes.filter((f) => matchesSearch(f) && matchesAxes(f)), [finishes, matchesSearch, matchesAxes]);

  // Counts narrow with the other axes and the search, ignoring the axis
  // being counted (so multi-select within an axis stays discoverable).
  const countFor = useCallback(
    (axis: FinishAxisKey, valueId: string) => {
      const fk = FINISH_AXES.find((a) => a.key === axis)!.fk;
      return finishes.filter((f) => f[fk] === valueId && matchesSearch(f) && matchesAxes(f, axis)).length;
    },
    [finishes, matchesSearch, matchesAxes],
  );

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError));
  const busy = attach.isPending || detach.isPending || reorder.isPending || setDefault.isPending;

  const toggle = (finish: FinishRow) => {
    if (attachedIds.has(finish.id)) {
      detach.mutate({ finishId: finish.id, wasDefault: defaultFinishId === finish.id }, { onError });
    } else {
      attach.mutate({ finishId: finish.id, sortOrder: attached.length }, { onError });
    }
  };

  if (finishesQuery.isLoading || axesQuery.isLoading || linksQuery.isLoading) {
    return <div className="h-3 w-40 bg-secondary animate-pulse rounded" />;
  }
  if (finishesQuery.isError) {
    return <p className="text-sm text-destructive">{describeSupabaseError(finishesQuery.error as SupabaseError)}</p>;
  }

  return (
    <div className="space-y-6">
      <AttachedFinishesList
        attached={attached}
        defaultFinishId={defaultFinishId}
        onReorder={(ids) => reorder.mutate(ids, { onError })}
        onDetach={toggle}
        onSetDefault={(id) => setDefault.mutate(id, { onError })}
        busy={busy}
      />

      <div className="flex gap-6">
        <FinishFacetRail
          axes={axesQuery.data ?? ({} as never)}
          selected={selected}
          onToggle={(axis, id) =>
            setSelected((prev) => ({
              ...prev,
              [axis]: prev[axis].includes(id) ? prev[axis].filter((x) => x !== id) : [...prev[axis], id],
            }))
          }
          onClear={() => setSelected(emptySelection())}
          countFor={countFor}
        />

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="rounded-none pl-9"
                placeholder="Search code or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span data-testid="finish-total" className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {visible.length} of {finishes.length}
            </span>
          </div>
          <FinishSwatchGrid finishes={visible} attachedIds={attachedIds} onToggle={toggle} busy={busy} />
        </div>
      </div>
    </div>
  );
}
