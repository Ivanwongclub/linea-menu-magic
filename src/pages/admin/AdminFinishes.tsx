import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedFinishName } from "@/features/admin/lib/localize";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { FinishFacetRail } from "@/components/admin/finish/FinishFacetRail";
import { FinishEditDialog } from "@/components/admin/finish/FinishEditDialog";
import { useFinishAxes, useFinishes, type FinishRow } from "@/features/admin/hooks/useFinishes";
import { FinishSwatch } from "@/features/finishes/FinishSwatch";
import { useFinishFilter } from "@/features/admin/hooks/useFinishFilter";
import { useFinishMutations } from "@/features/admin/hooks/useFinishMutations";

type SupabaseError = { message: string; code?: string };

/**
 * Maintain the 135 chart records themselves. Same rail and filtering as the
 * product editor's picker (one hook), but rows instead of swatches because
 * the job here is editing, and a bulk is_public toggle across the filtered
 * selection — WIN-CYC marks their sellable range, not 135 individual edits.
 */
export default function AdminFinishes() {
  const { t, language } = useI18n();
  const finishesQuery = useFinishes();
  const axesQuery = useFinishAxes();
  const { bulkSetPublic } = useFinishMutations();

  const finishes = useMemo(() => finishesQuery.data ?? [], [finishesQuery.data]);
  const filter = useFinishFilter(finishes);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<FinishRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const visibleIds = useMemo(() => new Set(filter.visible.map((f) => f.id)), [filter.visible]);
  const selectedVisible = useMemo(() => [...selected].filter((id) => visibleIds.has(id)), [selected, visibleIds]);
  const allVisibleSelected = filter.visible.length > 0 && filter.visible.every((f) => selected.has(f.id));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const selectAllFiltered = () => setSelected(new Set([...selected, ...filter.visible.map((f) => f.id)]));
  const clearSelection = () => setSelected(new Set());

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError, t));
  const setPublic = (isPublic: boolean) => {
    if (selectedVisible.length === 0) return;
    bulkSetPublic.mutate(
      { ids: selectedVisible, isPublic },
      {
        onSuccess: () => {
          toast.success(t(isPublic ? "admin.finishes.publicN" : "admin.finishes.privateN", { count: selectedVisible.length }));
          clearSelection();
        },
        onError,
      },
    );
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };
  const openEdit = (f: FinishRow) => {
    setEditing(f);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-light tracking-wide text-foreground">{t("admin.finishes.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("admin.finishes.subtitle")}</p>
        </div>
        <Button size="sm" className="rounded-none" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-2" />
          {t("admin.finishes.new")}
        </Button>
      </div>

      <div className="flex gap-6 items-start">
        <FinishFacetRail
          axes={axesQuery.data ?? ({} as never)}
          selected={filter.selected}
          onToggle={filter.toggleFacet}
          onClear={filter.clearFacets}
          countFor={filter.countFor}
          className="sticky top-4 max-h-[80vh] overflow-y-auto pr-2"
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
            <span data-testid="finishes-count" className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
              {t("admin.finishes.count", { visible: filter.visible.length, total: finishes.length })}
            </span>
            {!allVisibleSelected && filter.visible.length > 0 && (
              <Button variant="outline" size="sm" className="rounded-none" data-testid="select-all-filtered" onClick={selectAllFiltered}>
                {t("admin.finishes.selectAllFiltered", { count: filter.visible.length })}
              </Button>
            )}
          </div>

          {selectedVisible.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 border border-foreground bg-secondary/40 px-4 py-2">
              <span className="text-sm text-foreground mr-2">{t("admin.finishes.selected", { count: selectedVisible.length })}</span>
              <Button size="sm" className="rounded-none" disabled={bulkSetPublic.isPending} onClick={() => setPublic(true)}>
                <Eye className="w-3.5 h-3.5 mr-2" />
                {t("admin.finishes.makePublic")}
              </Button>
              <Button variant="outline" size="sm" className="rounded-none" disabled={bulkSetPublic.isPending} onClick={() => setPublic(false)}>
                <EyeOff className="w-3.5 h-3.5 mr-2" />
                {t("admin.finishes.makePrivate")}
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none ml-auto" onClick={clearSelection}>
                <X className="w-3.5 h-3.5 mr-1" />
                {t("admin.common.clear")}
              </Button>
            </div>
          )}

          <div className="border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={(v) => (v ? selectAllFiltered() : clearSelection())}
                      aria-label={t("admin.products.selectAll")}
                    />
                  </TableHead>
                  <TableHead className="w-12" />
                  <TableHead>{t("admin.finishes.col.code")}</TableHead>
                  <TableHead>{t("admin.finishes.col.name")}</TableHead>
                  <TableHead>{t("admin.finishes.col.factory")}</TableHead>
                  <TableHead>{t("admin.finishes.col.status")}</TableHead>
                  <TableHead className="w-16">{t("admin.finishes.col.public")}</TableHead>
                  <TableHead className="w-14 text-right">{t("admin.finishes.col.sort")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finishesQuery.isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      {t("admin.common.loading")}
                    </TableCell>
                  </TableRow>
                ) : filter.visible.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      {t("admin.finishes.empty")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filter.visible.map((f) => {
                    const isSelected = selected.has(f.id);
                    return (
                      <TableRow
                        key={f.id}
                        data-testid="finish-row"
                        data-code={f.cyc_code ?? ""}
                        data-state={isSelected ? "selected" : undefined}
                        className={cn("cursor-pointer", f.status !== "active" && "text-muted-foreground")}
                        onClick={() => openEdit(f)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox checked={isSelected} onCheckedChange={() => toggleOne(f.id)} aria-label={f.cyc_code ?? f.factory_name_en} />
                        </TableCell>
                        <TableCell className="p-2">
                          <FinishSwatch finish={f} className="w-8 h-8 border border-border/60" />
                        </TableCell>
                        <TableCell className="font-mono text-xs">{f.cyc_code ?? <span className="italic text-muted-foreground">{t("admin.finish.noCode")}</span>}</TableCell>
                        <TableCell className="text-sm">{localizedFinishName(f, language)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{f.factory_name_en}</TableCell>
                        <TableCell>
                          <Badge variant={f.status === "active" ? "outline" : "secondary"} className="text-[10px]">
                            {t(f.status === "active" ? "admin.finishes.status.active" : "admin.finishes.status.discontinued")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {f.is_public ? <Eye className="w-3.5 h-3.5 text-foreground" /> : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/60" />}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-muted-foreground">{f.sort_order}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <FinishEditDialog open={dialogOpen} onOpenChange={setDialogOpen} finish={editing} axes={axesQuery.data ?? ({} as never)} />
    </div>
  );
}
