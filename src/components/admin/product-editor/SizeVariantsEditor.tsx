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
import {
  useProductSizeVariants,
  type SizeVariantRow,
  type SizeVariantWrite,
} from "@/features/admin/hooks/useProductSizeVariants";

interface Draft {
  key: string;
  id?: string;
  size_primary_mm: string;
  size_secondary_mm: string;
  size_label: string;
  weight_g: string;
  thickness_mm: string;
  is_default: boolean;
  /** From the database for saved rows; previewed client-side once edited. */
  size_ligne: number | null;
}

const num = (v: number | null) => (v === null || v === undefined ? "" : String(v));

function fromRow(r: SizeVariantRow): Draft {
  return {
    key: r.id,
    id: r.id,
    size_primary_mm: num(r.size_primary_mm),
    size_secondary_mm: num(r.size_secondary_mm),
    size_label: r.size_label ?? "",
    weight_g: num(r.weight_g),
    thickness_mm: num(r.thickness_mm),
    is_default: r.is_default,
    size_ligne: r.size_ligne,
  };
}

/** Same expression as the generated column: round(primary / 0.635, 1). */
function previewLigne(primary: string): number | null {
  const n = Number(primary);
  if (primary.trim() === "" || !Number.isFinite(n)) return null;
  return Math.round((n / 0.635) * 10) / 10;
}

const parse = (s: string) => (s.trim() === "" ? null : Number(s));

export function SizeVariantsEditor({ productId }: { productId: string }) {
  const { t } = useI18n();
  const { query, saveAll } = useProductSizeVariants(productId);

  const initial = useMemo(() => (query.data ?? []).map(fromRow), [query.data]);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => setDrafts(initial), [initial]);
  const dirty = JSON.stringify(drafts) !== JSON.stringify(initial);

  const update = (key: string, patch: Partial<Draft>) =>
    setDrafts((prev) =>
      prev.map((d) => {
        if (d.key !== key) return d;
        const next = { ...d, ...patch };
        if ("size_primary_mm" in patch) next.size_ligne = previewLigne(next.size_primary_mm);
        return next;
      }),
    );
  const setDefault = (key: string) => setDrafts((prev) => prev.map((d) => ({ ...d, is_default: d.key === key })));
  const addRow = () =>
    setDrafts((prev) => [
      ...prev,
      {
        key: `new-${Date.now()}-${prev.length}`,
        size_primary_mm: "",
        size_secondary_mm: "",
        size_label: "",
        weight_g: "",
        thickness_mm: "",
        is_default: prev.length === 0,
        size_ligne: null,
      },
    ]);
  const removeRow = (key: string) => setDrafts((prev) => prev.filter((d) => d.key !== key));

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};
    for (const d of drafts) {
      const p = Number(d.size_primary_mm);
      if (d.size_primary_mm.trim() === "" || !Number.isFinite(p) || p <= 0) {
        nextErrors[d.key] = t("admin.sizes.validation.primary");
        continue;
      }
      for (const k of ["size_secondary_mm", "weight_g", "thickness_mm"] as const) {
        const v = parse(d[k]);
        if (v !== null && (!Number.isFinite(v) || v < 0)) {
          nextErrors[d.key] = t("admin.sizes.validation.measurements");
          break;
        }
      }
    }
    if (drafts.filter((d) => d.is_default).length > 1) nextErrors.__default = t("admin.sizes.validation.oneDefault");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      toast.error(nextErrors.__default ?? t("admin.sizes.validation.fix"));
      return;
    }
    // Only saved rows carry an `id` key at all — see the insert path in the hook.
    const rows: SizeVariantWrite[] = drafts.map((d, index) => ({
      ...(d.id ? { id: d.id } : {}),
      size_primary_mm: Number(d.size_primary_mm),
      size_secondary_mm: parse(d.size_secondary_mm),
      size_label: d.size_label.trim() || null,
      weight_g: parse(d.weight_g),
      thickness_mm: parse(d.thickness_mm),
      is_default: d.is_default,
      sort_order: index,
    }));
    const keptIds = new Set(drafts.map((d) => d.id).filter(Boolean));
    const removedIds = initial.map((d) => d.id!).filter((id) => !keptIds.has(id));

    saveAll.mutate(
      { rows, removedIds },
      {
        onSuccess: () => toast.success(t("admin.sizes.saved")),
        onError: (error) => toast.error(describeSupabaseError(error as { message: string; code?: string }, t)),
      },
    );
  };

  const numberInput = (d: Draft, k: keyof Draft & string, placeholder?: string) => (
    <Input
      className="rounded-none h-8 text-sm"
      type="number"
      min={0}
      step="0.01"
      placeholder={placeholder}
      value={String(d[k] ?? "")}
      onChange={(e) => update(d.key, { [k]: e.target.value } as Partial<Draft>)}
    />
  );

  return (
    <div className="space-y-3">
      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>{t("admin.sizes.primary")}</TableHead>
              <TableHead>{t("admin.sizes.secondary")}</TableHead>
              <TableHead>{t("admin.sizes.label")}</TableHead>
              <TableHead className="text-muted-foreground">{t("admin.sizes.ligne")}</TableHead>
              <TableHead>{t("admin.sizes.weight")}</TableHead>
              <TableHead>{t("admin.sizes.thickness")}</TableHead>
              <TableHead className="w-20">{t("admin.sizes.default")}</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-6">
                  {t("admin.common.loading")}
                </TableCell>
              </TableRow>
            ) : drafts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-6">
                  {t("admin.sizes.empty")}
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
                    <TableCell className={cn("p-2", errors[d.key] && "bg-destructive/5")}>
                      {numberInput(d, "size_primary_mm", "e.g. 15")}
                      {errors[d.key] && <p className="text-[11px] text-destructive mt-1">{errors[d.key]}</p>}
                    </TableCell>
                    <TableCell className="p-2">{numberInput(d, "size_secondary_mm", "—")}</TableCell>
                    <TableCell className="p-2">
                      <Input
                        className="rounded-none h-8 text-sm"
                        placeholder="e.g. 20 × 15"
                        value={d.size_label}
                        onChange={(e) => update(d.key, { size_label: e.target.value })}
                      />
                    </TableCell>
                    <TableCell className="p-2 pt-3 text-sm text-muted-foreground font-mono">
                      {d.size_ligne === null ? "—" : `${d.size_ligne}L`}
                    </TableCell>
                    <TableCell className="p-2">{numberInput(d, "weight_g", "—")}</TableCell>
                    <TableCell className="p-2">{numberInput(d, "thickness_mm", "—")}</TableCell>
                    <TableCell className="p-2 pt-3">
                      <input
                        type="radio"
                        name={`default-size-${productId}`}
                        checked={d.is_default}
                        onChange={() => setDefault(d.key)}
                        aria-label={t("admin.sizes.defaultAria")}
                        className="accent-foreground"
                      />
                    </TableCell>
                    <TableCell className="p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        aria-label={t("admin.common.remove")}
                        onClick={() => removeRow(d.key)}
                      >
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

      {errors.__default && <p className="text-xs text-destructive">{errors.__default}</p>}

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" className="rounded-none" onClick={addRow}>
          <Plus className="w-3.5 h-3.5 mr-2" />
          {t("admin.sizes.add")}
        </Button>
        <Button size="sm" className="rounded-none" disabled={!dirty || saveAll.isPending} onClick={handleSave}>
          {saveAll.isPending ? t("admin.common.saving") : t("admin.sizes.save")}
        </Button>
      </div>
    </div>
  );
}
