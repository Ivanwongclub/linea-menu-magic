import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedName } from "@/features/admin/lib/localize";
import { SortableList } from "@/components/admin/shared/SortableList";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import {
  nameGroupKeys,
  SELECT_NONE_VALUE,
  type FlatCrudField,
  type FlatCrudFormValues,
} from "@/components/admin/shared/flatCrudFields";
import {
  useFlatCrudTable,
  type TaxonomyRow,
  type TaxonomyTableName,
} from "@/features/admin/hooks/useFlatCrudTable";

interface RowWithLifecycle {
  id: string;
  is_active: boolean;
  sort_order?: number;
}

interface FlatCrudTableProps<T extends TaxonomyTableName> {
  table: T;
  /** Singular display name, already translated, e.g. "family" / "系列". */
  itemLabel: string;
  /** Explicit plural, already translated — "families", not "familys". */
  itemLabelPlural: string;
  fields: FlatCrudField[];
  hasSortOrder?: boolean;
  extraColumnLabel?: string;
  renderExtraCell?: (row: TaxonomyRow<T>) => ReactNode;
  /**
   * When provided, a Delete action appears alongside Deactivate. Called
   * before attempting the delete; returning a count > 0 blocks the delete
   * client-side with a specific message instead of surfacing the raw
   * ON DELETE RESTRICT error. Tables without this only offer Deactivate,
   * per the ruling that materials/attachments/compliance standards are
   * archive-only.
   */
  checkUsageBeforeDelete?: (id: string) => Promise<number>;
  /** Translated noun for the in-use message, e.g. "finishes". */
  usageNoun?: string;
}

type SupabaseError = { message: string; code?: string };

function emptyValues(fields: FlatCrudField[]): FlatCrudFormValues {
  const values: FlatCrudFormValues = {};
  for (const field of fields) {
    if (field.type === "nameGroup") {
      const [en, hant, hans] = nameGroupKeys(field.key);
      values[en] = "";
      values[hant] = "";
      values[hans] = "";
    } else if (field.type === "switch") {
      values[field.key] = false;
    } else if (field.type === "select" && field.allowNone) {
      values[field.key] = SELECT_NONE_VALUE;
    } else {
      values[field.key] = "";
    }
  }
  return values;
}

function valuesFromRow<T extends TaxonomyTableName>(fields: FlatCrudField[], row: TaxonomyRow<T>): FlatCrudFormValues {
  const values: FlatCrudFormValues = {};
  const record = row as unknown as Record<string, unknown>;
  for (const field of fields) {
    if (field.type === "nameGroup") {
      const [en, hant, hans] = nameGroupKeys(field.key);
      values[en] = (record[en] as string) ?? "";
      values[hant] = (record[hant] as string) ?? "";
      values[hans] = (record[hans] as string) ?? "";
    } else if (field.type === "switch") {
      values[field.key] = Boolean(record[field.key]);
    } else if (field.type === "select" && field.allowNone) {
      values[field.key] = (record[field.key] as string) || SELECT_NONE_VALUE;
    } else {
      values[field.key] = (record[field.key] as string) ?? "";
    }
  }
  return values;
}

export function FlatCrudTable<T extends TaxonomyTableName>({
  table,
  itemLabel,
  itemLabelPlural,
  fields,
  hasSortOrder = false,
  extraColumnLabel,
  renderExtraCell,
  checkUsageBeforeDelete,
  usageNoun,
}: FlatCrudTableProps<T>) {
  const { t, language } = useI18n();
  const { query, create, update, setActive, reorder, remove } = useFlatCrudTable(table, {
    orderBy: hasSortOrder ? "sort_order" : undefined,
  });

  const allRows = (query.data ?? []) as unknown as (TaxonomyRow<T> & RowWithLifecycle)[];

  // Archived rows are hidden by default — M2 deactivated the old categories
  // rather than deleting them, so unfiltered lists are mostly dead weight.
  const [activeOnly, setActiveOnly] = useState(true);
  const rows = activeOnly ? allRows.filter((row) => row.is_active) : allRows;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<(TaxonomyRow<T> & RowWithLifecycle) | null>(null);
  const [values, setValues] = useState<FlatCrudFormValues>(() => emptyValues(fields));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [pendingDelete, setPendingDelete] = useState<(TaxonomyRow<T> & RowWithLifecycle) | null>(null);
  const [checkingDeleteId, setCheckingDeleteId] = useState<string | null>(null);

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError, t));
  const vars = { item: itemLabel, plural: itemLabelPlural };

  const openCreate = () => {
    setEditingRow(null);
    setValues(emptyValues(fields));
    setFieldErrors({});
    setDialogOpen(true);
  };

  const openEdit = (row: TaxonomyRow<T> & RowWithLifecycle) => {
    setEditingRow(row);
    setValues(valuesFromRow(fields, row));
    setFieldErrors({});
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    const errors: Record<string, string> = {};
    const required = t("admin.validation.required");
    for (const field of fields) {
      if (field.type === "nameGroup" && field.required !== false) {
        if (!String(values[field.key] ?? "").trim()) errors[field.key] = required;
      }
      if ((field.type === "code" || field.type === "text") && field.required) {
        if (!String(values[field.key] ?? "").trim()) errors[field.key] = required;
      }
      if (field.type === "select" && field.required) {
        if (!values[field.key] || values[field.key] === SELECT_NONE_VALUE) errors[field.key] = required;
      }
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    // Trim to the exact set of DB columns this form owns; select fields with
    // the "none" sentinel mean "unset" (nullable FK columns like family_id).
    const payload: Record<string, string | boolean | null> = {};
    for (const field of fields) {
      if (field.type === "nameGroup") {
        const [en, hant, hans] = nameGroupKeys(field.key);
        payload[en] = String(values[en] ?? "").trim();
        payload[hant] = String(values[hant] ?? "").trim() || null;
        payload[hans] = String(values[hans] ?? "").trim() || null;
      } else if (field.type === "switch") {
        payload[field.key] = Boolean(values[field.key]);
      } else if (field.type === "select") {
        const raw = values[field.key] as string;
        payload[field.key] = raw && raw !== SELECT_NONE_VALUE ? raw : null;
      } else {
        const trimmed = String(values[field.key] ?? "").trim();
        payload[field.key] = trimmed || (field.required ? trimmed : null);
      }
    }

    if (editingRow) {
      // Immutable/locked fields are never part of the edit payload, even if
      // somehow present in `values` — belt and suspenders alongside the
      // read-only rendering.
      for (const field of fields) {
        const locked = field.type === "code" || (field.type === "text" && field.lockAfterCreate);
        if (locked) delete payload[field.key];
      }
      update.mutate(
        { id: editingRow.id, values: payload as never },
        {
          onSuccess: () => {
            toast.success(t("admin.crud.updated", vars));
            setDialogOpen(false);
          },
          onError,
        },
      );
    } else {
      create.mutate(payload as never, {
        onSuccess: () => {
          toast.success(t("admin.crud.created", vars));
          setDialogOpen(false);
        },
        onError,
      });
    }
  };

  const handleToggleActive = (row: TaxonomyRow<T> & RowWithLifecycle, nextActive: boolean) => {
    setActive.mutate(
      { id: row.id, isActive: nextActive },
      {
        onSuccess: () => toast.success(t(nextActive ? "admin.crud.restored" : "admin.crud.archivedToast", vars)),
        onError,
      },
    );
  };

  const handleReorder = (reordered: (TaxonomyRow<T> & RowWithLifecycle)[]) => {
    // The drag list may be the active-only subset. Re-number across the full
    // table — reordered visible rows first, hidden (archived) rows after in
    // their existing order — so sort_order stays unique and archived rows
    // never interleave with the live ones. Only rows whose value actually
    // changes are written.
    const visibleIds = new Set(reordered.map((row) => row.id));
    const hidden = allRows.filter((row) => !visibleIds.has(row.id));
    const updates = [...reordered, ...hidden]
      .map((row, index) => ({ id: row.id, sort_order: index, current: row.sort_order }))
      .filter((u) => u.current !== u.sort_order)
      .map(({ id, sort_order }) => ({ id, sort_order }));
    if (updates.length === 0) return;
    reorder.mutate(updates, { onError });
  };

  const handleDeleteClick = async (row: TaxonomyRow<T> & RowWithLifecycle) => {
    if (!checkUsageBeforeDelete) return;
    setCheckingDeleteId(row.id);
    try {
      const count = await checkUsageBeforeDelete(row.id);
      if (count > 0) {
        toast.error(t("admin.crud.inUse", { count, noun: usageNoun ?? t("admin.item.finishes") }));
        return;
      }
      setPendingDelete(row);
    } catch (error) {
      onError(error);
    } finally {
      setCheckingDeleteId(null);
    }
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    remove.mutate(pendingDelete.id, {
      onSuccess: () => {
        toast.success(t("admin.crud.deleted", vars));
        setPendingDelete(null);
      },
      onError: (error) => {
        onError(error);
        setPendingDelete(null);
      },
    });
  };

  const codeField = fields.find((f) => f.type === "code");
  const nameField = fields.find((f) => f.type === "nameGroup");

  const renderRowCells = (row: TaxonomyRow<T> & RowWithLifecycle, dragHandleProps?: Record<string, unknown>) => {
    const record = row as unknown as Record<string, unknown>;
    const zh = nameField
      ? [record[`${nameField.key}_zh_hant`], record[`${nameField.key}_zh_hans`]].filter(Boolean).join(" / ")
      : "";
    const primary = nameField ? localizedName(row as unknown as { name: string; name_zh_hant?: string | null; name_zh_hans?: string | null }, language) : "";
    // Show the other names beneath the localised one, without repeating it.
    const secondary = nameField
      ? [record[nameField.key], record[`${nameField.key}_zh_hant`], record[`${nameField.key}_zh_hans`]]
          .filter((v) => v && v !== primary)
          .join(" / ")
      : zh;

    return (
      <>
        {hasSortOrder && (
          <TableCell className="w-8">
            <button
              type="button"
              className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              aria-label={t("admin.common.dragToReorder")}
              {...(dragHandleProps ?? {})}
            >
              <GripVertical className="w-4 h-4" />
            </button>
          </TableCell>
        )}
        {codeField && (
          <TableCell className="font-mono text-xs text-muted-foreground">{String(record[codeField.key] ?? "—")}</TableCell>
        )}
        <TableCell>
          <div className="text-sm text-foreground">{primary}</div>
          {secondary && <div className="text-xs text-muted-foreground">{secondary}</div>}
        </TableCell>
        {renderExtraCell && <TableCell>{renderExtraCell(row)}</TableCell>}
        <TableCell>
          <div className="flex items-center gap-2">
            <Switch
              checked={row.is_active}
              onCheckedChange={(checked) => handleToggleActive(row, checked)}
              aria-label={t(row.is_active ? "admin.crud.toggleToArchive" : "admin.crud.toggleToRestore")}
            />
            <Badge variant={row.is_active ? "default" : "secondary"} className="text-[10px]">
              {t(row.is_active ? "admin.crud.active" : "admin.crud.archived")}
            </Badge>
          </div>
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(row)}>
              <Pencil className="w-3.5 h-3.5" />
              <span className="sr-only">{t("admin.common.edit")}</span>
            </Button>
            {checkUsageBeforeDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                disabled={checkingDeleteId === row.id}
                onClick={() => handleDeleteClick(row)}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="sr-only">{t("admin.common.delete")}</span>
              </Button>
            )}
          </div>
        </TableCell>
      </>
    );
  };

  const columnCount = (hasSortOrder ? 1 : 0) + (codeField ? 1 : 0) + 1 + (renderExtraCell ? 1 : 0) + 2;

  const countLabel =
    activeOnly && allRows.length !== rows.length
      ? t("admin.crud.activeOf", { active: rows.length, total: allRows.length, plural: itemLabelPlural })
      : t(rows.length === 1 ? "admin.crud.countOne" : "admin.crud.countMany", { count: rows.length, ...vars });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <p className="text-sm text-muted-foreground">{countLabel}</p>
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <Switch checked={activeOnly} onCheckedChange={setActiveOnly} aria-label={t("admin.crud.activeOnly")} />
            {t("admin.crud.activeOnly")}
          </label>
        </div>
        <Button size="sm" className="rounded-none" onClick={openCreate}>
          <Plus className="w-3.5 h-3.5 mr-2" />
          {t("admin.crud.new", vars)}
        </Button>
      </div>

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              {hasSortOrder && <TableHead className="w-8" />}
              {codeField && <TableHead>{t("admin.crud.col.code")}</TableHead>}
              <TableHead>{t("admin.crud.col.name")}</TableHead>
              {extraColumnLabel && <TableHead>{extraColumnLabel}</TableHead>}
              <TableHead>{t("admin.crud.col.status")}</TableHead>
              <TableHead className="text-right">{t("admin.crud.col.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center text-sm text-muted-foreground py-8">
                  {t("admin.common.loading")}
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-center text-sm text-muted-foreground py-8">
                  {activeOnly && allRows.length > 0
                    ? t("admin.crud.noneActive", { plural: itemLabelPlural, count: allRows.length })
                    : t("admin.crud.none", { plural: itemLabelPlural })}
                </TableCell>
              </TableRow>
            ) : hasSortOrder ? (
              <SortableList
                items={rows}
                getId={(row) => row.id}
                onReorder={handleReorder}
                as="tr"
                itemClassName="border-b transition-colors hover:bg-muted/50"
                renderItem={(row, dragHandleProps) => renderRowCells(row, dragHandleProps)}
              />
            ) : (
              rows.map((row) => <TableRow key={row.id}>{renderRowCells(row)}</TableRow>)
            )}
          </TableBody>
        </Table>
      </div>

      <FlatCrudFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={t(editingRow ? "admin.crud.editTitle" : "admin.crud.newTitle", vars)}
        fields={fields}
        mode={editingRow ? "edit" : "create"}
        values={values}
        onChange={setValues}
        fieldErrors={fieldErrors}
        submitting={create.isPending || update.isPending}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.crud.deleteTitle", vars)}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.crud.deleteBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>{t("admin.common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface FlatCrudFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FlatCrudField[];
  mode: "create" | "edit";
  values: FlatCrudFormValues;
  onChange: (values: FlatCrudFormValues) => void;
  fieldErrors: Record<string, string>;
  submitting: boolean;
  onSubmit: () => void;
}

function FlatCrudFormDialog({
  open,
  onOpenChange,
  title,
  fields,
  mode,
  values,
  onChange,
  fieldErrors,
  submitting,
  onSubmit,
}: FlatCrudFormDialogProps) {
  const { t } = useI18n();
  const setField = (key: string, value: string | boolean) => onChange({ ...values, [key]: value });
  const labelClass = "text-xs uppercase tracking-wider text-muted-foreground";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-none max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {fields.map((field) => {
            if (field.type === "nameGroup") {
              const [en, hant, hans] = nameGroupKeys(field.key);
              return (
                <div key={field.key} className="space-y-2">
                  <Label className={labelClass}>{field.label}</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      [en, t("admin.crud.english")],
                      [hant, t("admin.crud.hant")],
                      [hans, t("admin.crud.hans")],
                    ].map(([key, sub]) => (
                      <div key={key} className="space-y-1">
                        <span className="text-[10px] text-muted-foreground">{sub}</span>
                        <Input
                          className="rounded-none"
                          value={String(values[key] ?? "")}
                          onChange={(e) => setField(key, e.target.value)}
                        />
                      </div>
                    ))}
                  </div>
                  {fieldErrors[field.key] && <p className="text-xs text-destructive">{fieldErrors[field.key]}</p>}
                </div>
              );
            }

            if (field.type === "code" || field.type === "text") {
              const locked = mode === "edit" && (field.type === "code" || field.lockAfterCreate);
              return (
                <div key={field.key} className="space-y-2">
                  <Label className={labelClass}>{field.label}</Label>
                  {locked ? (
                    <div className={`text-sm px-3 py-2 border border-border bg-secondary/50 text-muted-foreground ${field.type === "code" ? "font-mono" : ""}`}>
                      {String(values[field.key] ?? "—")}
                      {field.type === "code" && (
                        <span className="ml-2 text-[10px] uppercase tracking-wider">{t("admin.crud.immutable")}</span>
                      )}
                    </div>
                  ) : (
                    <Input
                      className={`rounded-none ${field.type === "code" ? "font-mono" : ""}`}
                      value={String(values[field.key] ?? "")}
                      onChange={(e) => setField(field.key, e.target.value)}
                    />
                  )}
                  {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
                  {fieldErrors[field.key] && <p className="text-xs text-destructive">{fieldErrors[field.key]}</p>}
                </div>
              );
            }

            if (field.type === "select") {
              return (
                <div key={field.key} className="space-y-2">
                  <Label className={labelClass}>{field.label}</Label>
                  <Select value={String(values[field.key] ?? "")} onValueChange={(v) => setField(field.key, v)}>
                    <SelectTrigger className="rounded-none">
                      <SelectValue placeholder={field.placeholder ?? t("admin.crud.select")} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.allowNone && (
                        <SelectItem value={SELECT_NONE_VALUE}>{field.noneLabel ?? t("admin.crud.noneOption")}</SelectItem>
                      )}
                      {field.options.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
                  {fieldErrors[field.key] && <p className="text-xs text-destructive">{fieldErrors[field.key]}</p>}
                </div>
              );
            }

            // switch
            return (
              <div key={field.key} className="flex items-start gap-3 border border-border p-3">
                <Switch checked={Boolean(values[field.key])} onCheckedChange={(checked) => setField(field.key, checked)} />
                <div className="space-y-1">
                  <Label className="text-sm text-foreground">{field.label}</Label>
                  {field.helperText && <p className="text-xs text-muted-foreground">{field.helperText}</p>}
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" className="rounded-none" onClick={() => onOpenChange(false)}>
            {t("admin.common.cancel")}
          </Button>
          <Button className="rounded-none" disabled={submitting} onClick={onSubmit}>
            {submitting ? t("admin.common.saving") : t("admin.common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
