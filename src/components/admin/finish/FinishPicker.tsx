import { useMemo } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/features/i18n/I18nProvider";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { FinishFacetRail } from "@/components/admin/finish/FinishFacetRail";
import { FinishSwatchGrid } from "@/components/admin/finish/FinishSwatchGrid";
import { AttachedFinishesList } from "@/components/admin/finish/AttachedFinishesList";
import { useFinishAxes, useFinishes, type FinishRow } from "@/features/admin/hooks/useFinishes";
import { useFinishFilter } from "@/features/admin/hooks/useFinishFilter";
import { useProductFinishes } from "@/features/admin/hooks/useProductFinishes";

type SupabaseError = { message: string; code?: string };

interface Props {
  productId: string;
  defaultFinishId: string | null;
}

/**
 * Attach finishes to a metal product.
 *
 * Layout is deliberate: the picker (rail + grid) is bounded to the viewport
 * with its own scrolling, and the attached list + default selector sit
 * BELOW it. The first cut put them above an unbounded grid — with 135
 * swatches that grid is ~4,500px tall, so anyone looking under the grid for
 * what they had picked found nothing. Toggling a swatch writes immediately;
 * the metal-gate trigger's own message is what the editor sees if the
 * database refuses.
 */
export function FinishPicker({ productId, defaultFinishId }: Props) {
  const { t } = useI18n();
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

  const filter = useFinishFilter(finishes);

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError, t));
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
    return <p className="text-sm text-destructive">{describeSupabaseError(finishesQuery.error as SupabaseError, t)}</p>;
  }

  return (
    <div className="space-y-6">
      {/* Picker: bounded height, rail and grid scroll independently */}
      <div data-testid="finish-picker" className="flex gap-6 items-start">
        <FinishFacetRail
          axes={axesQuery.data ?? ({} as never)}
          selected={filter.selected}
          onToggle={filter.toggleFacet}
          onClear={filter.clearFacets}
          countFor={filter.countFor}
          className="sticky top-4 max-h-[70vh] overflow-y-auto pr-2"
        />

        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                className="rounded-none pl-9"
                placeholder={t("admin.finish.search")}
                value={filter.search}
                onChange={(e) => filter.setSearch(e.target.value)}
              />
            </div>
            <span data-testid="finish-total" className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {t("admin.finish.total", { visible: filter.visible.length, total: finishes.length })}
            </span>
            <span
              data-testid="finish-attached-count"
              className="text-xs tabular-nums whitespace-nowrap border border-foreground px-2 py-0.5 text-foreground"
            >
              {t("admin.finish.attached", { count: attached.length })}
            </span>
          </div>
          <div data-testid="finish-grid" className="max-h-[70vh] overflow-y-auto pr-1">
            <FinishSwatchGrid finishes={filter.visible} attachedIds={attachedIds} onToggle={toggle} busy={busy} />
          </div>
        </div>
      </div>

      {/* Selection: below the picker, where the eye goes after picking */}
      <div data-testid="attached-section" className="border-t border-border pt-6">
        <AttachedFinishesList
          attached={attached}
          defaultFinishId={defaultFinishId}
          onReorder={(ids) => reorder.mutate(ids, { onError })}
          onDetach={toggle}
          onSetDefault={(id) => setDefault.mutate(id, { onError })}
          busy={busy}
        />
      </div>
    </div>
  );
}
