import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Save, Loader2, Pencil, X, Check, GripVertical } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/* ── Generic inline-editable taxonomy table ──────────────── */

interface TaxonomyItem {
  id: string;
  [key: string]: unknown;
}

interface ColumnDef {
  key: string;
  label: string;
  type: "text" | "number" | "boolean" | "select";
  options?: { value: string; label: string }[];
  mono?: boolean;
}

function TaxonomyTable<T extends TaxonomyItem>({
  title,
  tableName,
  columns,
  items,
  onRefresh,
  defaultValues,
}: {
  title: string;
  tableName: string;
  columns: ColumnDef[];
  items: T[];
  onRefresh: () => void;
  defaultValues: Partial<T>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, unknown>>({});
  const [addingNew, setAddingNew] = useState(false);
  const [newValues, setNewValues] = useState<Record<string, unknown>>(defaultValues);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);

  const startEdit = (item: T) => {
    setEditingId(item.id);
    const vals: Record<string, unknown> = {};
    columns.forEach((c) => { vals[c.key] = item[c.key]; });
    setEditValues(vals);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValues({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    const { error } = await (supabase.from(tableName as any) as any).update(editValues).eq("id", editingId);
    if (error) {
      toast.error(`Save failed: ${error.message}`);
    } else {
      toast.success("Updated");
      onRefresh();
    }
    setSaving(false);
    setEditingId(null);
  };

  const handleAdd = async () => {
    setSaving(true);
    const { error } = await (supabase.from(tableName as any) as any).insert(newValues);
    if (error) {
      toast.error(`Add failed: ${error.message}`);
    } else {
      toast.success("Added");
      setNewValues(defaultValues);
      setAddingNew(false);
      onRefresh();
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await (supabase.from(tableName as any) as any).delete().eq("id", deleteTarget.id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`);
    } else {
      toast.success("Deleted");
      onRefresh();
    }
    setDeleteTarget(null);
  };

  const renderCell = (col: ColumnDef, value: unknown, onChange: (v: unknown) => void, editable: boolean) => {
    if (!editable) {
      if (col.type === "boolean") return <Switch checked={!!value} disabled />;
      if (col.type === "select") {
        const opt = col.options?.find((o) => o.value === value);
        return <Badge variant="outline" className="text-xs">{opt?.label ?? String(value ?? "")}</Badge>;
      }
      return <span className={`text-sm ${col.mono ? "font-mono" : ""}`}>{String(value ?? "")}</span>;
    }

    if (col.type === "boolean") return <Switch checked={!!value} onCheckedChange={onChange} />;
    if (col.type === "number") return <Input type="number" value={String(value ?? "")} onChange={(e) => onChange(Number(e.target.value))} className="h-7 text-sm w-20" />;
    if (col.type === "select") {
      return (
        <Select value={String(value ?? "")} onValueChange={onChange}>
          <SelectTrigger className="h-7 text-xs w-24"><SelectValue /></SelectTrigger>
          <SelectContent>
            {col.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      );
    }
    return <Input value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} className={`h-7 text-sm ${col.mono ? "font-mono" : ""}`} />;
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <Button variant="outline" size="sm" className="gap-1 text-xs h-7" onClick={() => setAddingNew(true)}>
          <Plus className="w-3 h-3" /> Add
        </Button>
      </div>

      <div className="border border-border rounded-[var(--radius)] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((c) => (
                <TableHead key={c.key} className="text-xs">{c.label}</TableHead>
              ))}
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const isEditing = editingId === item.id;
              return (
                <TableRow key={item.id}>
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {renderCell(
                        col,
                        isEditing ? editValues[col.key] : item[col.key],
                        (v) => setEditValues((prev) => ({ ...prev, [col.key]: v })),
                        isEditing
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {isEditing ? (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={saveEdit} disabled={saving}>
                            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={cancelEdit}>
                            <X className="w-3 h-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => startEdit(item)}>
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => setDeleteTarget(item)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}

            {/* New row */}
            {addingNew && (
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {renderCell(
                      col,
                      newValues[col.key],
                      (v) => setNewValues((prev) => ({ ...prev, [col.key]: v })),
                      true
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleAdd} disabled={saving}>
                      {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setAddingNew(false); setNewValues(defaultValues); }}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete item</AlertDialogTitle>
            <AlertDialogDescription>
              This may affect products linked to this item. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Main taxonomy tab ───────────────────────────────────── */

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface TaxRow { id: string; [k: string]: unknown }

export default function TaxonomyTab() {
  const [categories, setCategories] = useState<TaxRow[]>([]);
  const [tags, setTags] = useState<TaxRow[]>([]);
  const [materials, setMaterials] = useState<TaxRow[]>([]);
  const [industries, setIndustries] = useState<TaxRow[]>([]);
  const [certifications, setCertifications] = useState<TaxRow[]>([]);

  const fetchAll = async () => {
    const [c, t, m, i, cert] = await Promise.all([
      supabase.from("product_categories").select("*").order("sort_order"),
      supabase.from("product_tags").select("*").order("name"),
      supabase.from("product_materials").select("*").order("name"),
      supabase.from("product_industries").select("*").order("sort_order"),
      supabase.from("product_certifications").select("*").order("name"),
    ]);
    if (c.data) setCategories(c.data as TaxRow[]);
    if (t.data) setTags(t.data as TaxRow[]);
    if (m.data) setMaterials(m.data as TaxRow[]);
    if (i.data) setIndustries(i.data as TaxRow[]);
    if (cert.data) setCertifications(cert.data as TaxRow[]);
  };

  useEffect(() => { fetchAll(); }, []);

  return (
    <div>
      <TaxonomyTable
        title="Categories"
        tableName="product_categories"
        columns={[
          { key: "name", label: "Name", type: "text" },
          { key: "slug", label: "Slug", type: "text", mono: true },
          { key: "sort_order", label: "Order", type: "number" },
        ]}
        items={categories}
        onRefresh={fetchAll}
        defaultValues={{ name: "", slug: "", sort_order: 0 }}
      />

      <TaxonomyTable
        title="Tags"
        tableName="product_tags"
        columns={[
          { key: "name", label: "Name", type: "text" },
          { key: "slug", label: "Slug", type: "text", mono: true },
          { key: "color", label: "Color", type: "select", options: [
            { value: "black", label: "Black" },
            { value: "gray", label: "Gray" },
            { value: "white", label: "White" },
          ]},
        ]}
        items={tags}
        onRefresh={fetchAll}
        defaultValues={{ name: "", slug: "", color: "black" }}
      />

      <TaxonomyTable
        title="Materials"
        tableName="product_materials"
        columns={[
          { key: "name", label: "Name", type: "text" },
          { key: "slug", label: "Slug", type: "text", mono: true },
          { key: "is_sustainable", label: "Sustainable", type: "boolean" },
        ]}
        items={materials}
        onRefresh={fetchAll}
        defaultValues={{ name: "", slug: "", is_sustainable: false }}
      />

      <TaxonomyTable
        title="Industries"
        tableName="product_industries"
        columns={[
          { key: "name", label: "Name", type: "text" },
          { key: "slug", label: "Slug", type: "text", mono: true },
          { key: "sort_order", label: "Order", type: "number" },
        ]}
        items={industries}
        onRefresh={fetchAll}
        defaultValues={{ name: "", slug: "", sort_order: 0 }}
      />

      <TaxonomyTable
        title="Certifications"
        tableName="product_certifications"
        columns={[
          { key: "name", label: "Name", type: "text" },
          { key: "abbreviation", label: "Abbreviation", type: "text" },
        ]}
        items={certifications}
        onRefresh={fetchAll}
        defaultValues={{ name: "", abbreviation: "" }}
      />
    </div>
  );
}
