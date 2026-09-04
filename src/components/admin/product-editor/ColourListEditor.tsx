import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/I18nProvider";
import { SortableList } from "@/components/admin/shared/SortableList";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { useProductColours, type ColourRow, type ColourWrite } from "@/features/admin/hooks/useProductColours";

interface Draft {
  key: string;
  id?: string;
  name: string;
  name_zh_hant: string;
  name_zh_hans: string;
  hex: string;
}

const fromRow = (r: ColourRow): Draft => ({
  key: r.id,
  id: r.id,
  name: r.name,
  name_zh_hant: r.name_zh_hant ?? "",
  name_zh_hans: r.name_zh_hans ?? "",
  hex: r.hex ?? "",
});

const HEX = /^#[0-9a-f]{6}$/i;

/** Plain colour list for non-metal products — the counterpart of the finish picker. */
export function ColourListEditor({ productId }: { productId: string }) {
  const { t } = useI18n();
  const { query, saveAll } = useProductColours(productId);
  const initial = useMemo(() => (query.data ?? []).map(fromRow), [query.data]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setDrafts(initial), [initial]);
  const dirty = JSON.stringify(drafts) !== JSON.stringify(initial);

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  const addRow = () =>
    setDrafts((prev) => [
      ...prev,
      { key: `new-${Date.now()}-${prev.length}`, name: "", name_zh_hant: "", name_zh_hans: "", hex: "" },
    ]);
  const removeRow = (key: string) => setDrafts((prev) => prev.filter((d) => d.key !== key));

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    for (const d of drafts) {
      if (!d.name.trim()) nextErrors[d.key] = t("admin.colours.validation.name");
      else if (d.hex.trim() && !HEX.test(d.hex.trim())) nextErrors[d.key] = t("admin.colours.validation.hex");
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(t("admin.colours.validation.fix"));
      return;
    }
    // Saved rows carry their id; new rows get no `id` key at all.
    const rows: ColourWrite[] = drafts.map((d, index) => ({
      ...(d.id ? { id: d.id } : {}),
      name: d.name.trim(),
      name_zh_hant: d.name_zh_hant.trim() || null,
      name_zh_hans: d.name_zh_hans.trim() || null,
      hex: d.hex.trim() ? d.hex.trim().toUpperCase() : null,
      sort_order: index,
    }));
    const kept = new Set(drafts.map((d) => d.id).filter(Boolean));
    const removedIds = initial.map((d) => d.id!).filter((id) => !kept.has(id));
    saveAll.mutate(
      { rows, removedIds },
      {
        onSuccess: () => toast.success(t("admin.colours.saved")),
        onError: (error) => toast.error(describeSupabaseError(error as { message: string; code?: string }, t)),
      },
    );
  };

  return (
    <div className="space-y-3">
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead className="w-12" />
              <TableHead>{t("admin.colours.name")}</TableHead>
              <TableHead>{t("admin.colours.hant")}</TableHead>
              <TableHead>{t("admin.colours.hans")}</TableHead>
              <TableHead className="w-32">{t("admin.colours.hex")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                  {t("admin.common.loading")}
                </TableCell>
              </TableRow>
            ) : drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-6">
                  {t("admin.colours.empty")}
                </TableCell>
              </TableRow>
            ) : (
              <SortableList
                items={drafts}
                getId={(d) => d.key}
                onReorder={setDrafts}
                as="tr"
                itemClassName="border-b transition-colors hover:bg-muted/50 align-top"
                renderItem={(d, dragHandleProps) => (
                  <>
                    <TableCell className="w-8 pt-3">
                      <button
                        type="button"
                        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                        aria-label={t("admin.common.dragToReorder")}
                        {...dragHandleProps}
                      >
                        <GripVertical className="w-4 h-4" />
                      </button>
                    </TableCell>
                    <TableCell className="p-2 pt-2.5">
                      <div
                        className="w-7 h-7 border border-border/60"
                        style={{ backgroundColor: HEX.test(d.hex.trim()) ? d.hex.trim() : "#e5e5e5" }}
                      />
                    </TableCell>
                    <TableCell data-testid="colour-row" data-name={d.name} className={cn("p-2", errors[d.key] && "bg-destructive/5")}>
                      <Input className="rounded-none h-8 text-sm" placeholder="e.g. Navy" value={d.name} onChange={(e) => update(d.key, { name: e.target.value })} />
                      {errors[d.key] && <p className="text-[11px] text-destructive mt-1">{errors[d.key]}</p>}
                    </TableCell>
                    <TableCell className="p-2">
                      <Input className="rounded-none h-8 text-sm" placeholder="繁體" value={d.name_zh_hant} onChange={(e) => update(d.key, { name_zh_hant: e.target.value })} />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input className="rounded-none h-8 text-sm" placeholder="简体" value={d.name_zh_hans} onChange={(e) => update(d.key, { name_zh_hans: e.target.value })} />
                    </TableCell>
                    <TableCell className="p-2">
                      <Input className="rounded-none h-8 text-sm font-mono" placeholder="#RRGGBB" value={d.hex} onChange={(e) => update(d.key, { hex: e.target.value })} />
                    </TableCell>
                    <TableCell className="p-2">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" aria-label={t("admin.colours.remove")} onClick={() => removeRow(d.key)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </>
                )}
              />
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="rounded-none" onClick={addRow}>
          <Plus className="w-3.5 h-3.5 mr-2" />
          {t("admin.colours.add")}
        </Button>
        <Button size="sm" className="rounded-none" disabled={!dirty || saveAll.isPending} onClick={handleSave}>
          {saveAll.isPending ? t("admin.common.saving") : t("admin.colours.save")}
        </Button>
      </div>
    </div>
  );
}
