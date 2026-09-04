import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Globe, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedName } from "@/features/admin/lib/localize";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { useFlatCrudTable } from "@/features/admin/hooks/useFlatCrudTable";
import {
  useAdminProducts,
  type AdminProductRow,
  type AdminProductStatus,
} from "@/features/admin/hooks/useAdminProducts";

const ALL = "__all__";

/**
 * One column answers "can anyone see this?" — visibility depends on status
 * AND is_public together. Public/Private only appears on Active rows; drafts
 * and archived products are never public, so the word would carry nothing.
 * Solid = live, outlined = not yet, muted = retired.
 */
export function StatusBadge({ status, isPublic }: { status: string; isPublic: boolean }) {
  const { t } = useI18n();
  if (status === "active")
    return (
      <Badge className={cn("text-[10px]", !isPublic && "bg-transparent text-foreground")}>
        {t(isPublic ? "admin.status.activePublic" : "admin.status.activePrivate")}
      </Badge>
    );
  if (status === "archived")
    return (
      <Badge variant="secondary" className="text-[10px] text-muted-foreground line-through">
        {t("admin.status.archived")}
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[10px]">
      {status === "draft" ? t("admin.status.draft") : status}
    </Badge>
  );
}

type SupabaseError = { message: string; code?: string };

export default function AdminProducts() {
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const { query, setStatus, publish } = useAdminProducts();
  const { query: familiesQuery } = useFlatCrudTable("product_families", { orderBy: "sort_order" });
  const { query: categoriesQuery } = useFlatCrudTable("product_categories", { orderBy: "sort_order" });
  const { query: materialsQuery } = useFlatCrudTable("product_materials");

  const products = useMemo(() => query.data ?? [], [query.data]);
  const families = useMemo(() => familiesQuery.data ?? [], [familiesQuery.data]);
  const categories = useMemo(() => categoriesQuery.data ?? [], [categoriesQuery.data]);
  const materials = useMemo(
    () => [...(materialsQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [materialsQuery.data],
  );
  const archivedSuffix = t("admin.common.archivedSuffix");

  const [search, setSearch] = useState("");
  const [familyId, setFamilyId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [status, setStatusFilter] = useState(ALL);
  const [materialId, setMaterialId] = useState(ALL);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingArchive, setPendingArchive] = useState<AdminProductRow[] | null>(null);

  const familyName = (id: string | null) => {
    const f = families.find((x) => x.id === id);
    return f ? localizedName(f, language) : null;
  };

  // Category options narrow to the chosen family; archived categories stay
  // listed (marked) so legacy products still mapped to them remain findable.
  const categoryOptions = useMemo(
    () => categories.filter((c) => familyId === ALL || c.family_id === familyId),
    [categories, familyId],
  );

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (familyId !== ALL && p.primary_category?.family_id !== familyId) return false;
      if (categoryId !== ALL && p.primary_category?.id !== categoryId) return false;
      if (status !== ALL && p.status !== status) return false;
      if (materialId !== ALL && p.material_id !== materialId) return false;
      if (term && !p.name.toLowerCase().includes(term) && !(p.item_code ?? "").toLowerCase().includes(term)) return false;
      return true;
    });
  }, [products, search, familyId, categoryId, status, materialId]);

  const selectedRows = useMemo(() => products.filter((p) => selected.has(p.id)), [products, selected]);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const toggleAll = () =>
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visible.forEach((p) => next.delete(p.id));
        return next;
      }
      return new Set([...prev, ...visible.map((p) => p.id)]);
    });
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const clearSelection = () => setSelected(new Set());

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError, t));

  /**
   * published_needs_item_code rejects status='active' without an item_code —
   * check first and say exactly which products are missing one, rather than
   * letting the constraint fire mid-batch.
   */
  const splitByItemCode = (rows: AdminProductRow[]) => ({
    eligible: rows.filter((r) => r.item_code),
    missing: rows.filter((r) => !r.item_code),
  });

  // The 25 M2 seed products (slug 'sample-%') are placeholders that stay
  // draft. Any bulk action that could make them active skips them.
  const splitSeeds = (rows: AdminProductRow[]) => ({
    real: rows.filter((r) => !r.slug.startsWith("sample-")),
    seeds: rows.filter((r) => r.slug.startsWith("sample-")),
  });

  const describeSkipped = (rows: AdminProductRow[], reasonKey: string) =>
    t(rows.length === 1 ? "admin.products.skippedOne" : "admin.products.skippedMany", {
      count: rows.length,
      reason: t(reasonKey),
      names: rows.map((r) => r.name).slice(0, 5).join(", ") + (rows.length > 5 ? ", …" : ""),
    });

  const statusLabel = (s: AdminProductStatus) => t(`admin.status.${s}`);

  const handleSetStatus = (target: AdminProductStatus) => {
    if (selectedRows.length === 0) return;
    if (target === "archived") {
      setPendingArchive(selectedRows);
      return;
    }
    let rows = selectedRows;
    if (target === "active") {
      const { real, seeds } = splitSeeds(selectedRows);
      if (seeds.length > 0) toast.error(describeSkipped(seeds, "admin.products.reason.seedDraft"));
      const { eligible, missing } = splitByItemCode(real);
      if (missing.length > 0) toast.error(describeSkipped(missing, "admin.products.reason.noCodeActive"));
      if (eligible.length === 0) return;
      rows = eligible;
    }
    setStatus.mutate(
      { ids: rows.map((r) => r.id), status: target },
      {
        onSuccess: () => {
          toast.success(t("admin.products.setTo", { count: rows.length, status: statusLabel(target) }));
          clearSelection();
        },
        onError,
      },
    );
  };

  const confirmArchive = () => {
    if (!pendingArchive) return;
    // Standing ruling: brand-owned rows are a customer's catalogue and are
    // never archived by us. Bulk archive skips them rather than sweeping
    // them in with the house products they happen to be selected alongside.
    const brandOwned = pendingArchive.filter((r) => r.brand_id);
    const house = pendingArchive.filter((r) => !r.brand_id);
    if (brandOwned.length > 0) toast.error(describeSkipped(brandOwned, "admin.products.reason.brandOwned"));
    setPendingArchive(null);
    if (house.length === 0) return;
    setStatus.mutate(
      { ids: house.map((r) => r.id), status: "archived" },
      {
        onSuccess: () => {
          toast.success(t("admin.products.archivedN", { count: house.length }));
          clearSelection();
        },
        onError,
      },
    );
  };

  const handlePublish = () => {
    if (selectedRows.length === 0) return;
    const { real, seeds } = splitSeeds(selectedRows);
    if (seeds.length > 0) toast.error(describeSkipped(seeds, "admin.products.reason.seedDraft"));
    const { eligible, missing } = splitByItemCode(real);
    if (missing.length > 0) toast.error(describeSkipped(missing, "admin.products.reason.noCodePublish"));
    if (eligible.length === 0) return;
    publish.mutate(
      { ids: eligible.map((r) => r.id) },
      {
        onSuccess: () => {
          toast.success(t("admin.products.publishedN", { count: eligible.length }));
          clearSelection();
        },
        onError,
      },
    );
  };

  const busy = setStatus.isPending || publish.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-light tracking-wide text-foreground">{t("admin.products.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {visible.length === products.length
              ? t("admin.products.count", { count: products.length })
              : t("admin.products.countFiltered", { visible: visible.length, total: products.length })}
          </p>
        </div>
        <Button size="sm" className="rounded-none" onClick={() => navigate("/admin/products/new")}>
          <Plus className="w-3.5 h-3.5 mr-2" />
          {t("admin.products.new")}
        </Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="rounded-none pl-9"
            placeholder={t("admin.products.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select
          value={familyId}
          onValueChange={(v) => {
            setFamilyId(v);
            setCategoryId(ALL);
          }}
        >
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder={t("admin.products.filter.family")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("admin.products.allFamilies")}</SelectItem>
            {families.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {localizedName(f, language)}
                {!f.is_active ? archivedSuffix : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder={t("admin.products.filter.category")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("admin.products.allCategories")}</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {localizedName(c, language)}
                {!c.is_active ? archivedSuffix : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder={t("admin.products.filter.status")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("admin.products.allStatuses")}</SelectItem>
            <SelectItem value="draft">{t("admin.status.draft")}</SelectItem>
            <SelectItem value="active">{t("admin.status.active")}</SelectItem>
            <SelectItem value="archived">{t("admin.status.archived")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={materialId} onValueChange={setMaterialId}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder={t("admin.products.filter.material")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>{t("admin.products.allMaterials")}</SelectItem>
            {materials.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {localizedName(m, language)}
                {!m.is_active ? archivedSuffix : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border border-foreground bg-secondary/40 px-4 py-2">
          <span className="text-sm text-foreground mr-2">{t("admin.products.selected", { count: selected.size })}</span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{t("admin.products.setStatus")}</span>
          {(["draft", "active", "archived"] as AdminProductStatus[]).map((s) => (
            <Button key={s} variant="outline" size="sm" className="rounded-none" disabled={busy} onClick={() => handleSetStatus(s)}>
              {statusLabel(s)}
            </Button>
          ))}
          <span className="mx-2 h-5 w-px bg-border" />
          <Button size="sm" className="rounded-none" disabled={busy} onClick={handlePublish}>
            <Globe className="w-3.5 h-3.5 mr-2" />
            {t("admin.products.publish")}
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
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} aria-label={t("admin.products.selectAll")} />
              </TableHead>
              <TableHead>{t("admin.products.col.itemCode")}</TableHead>
              <TableHead>{t("admin.products.col.name")}</TableHead>
              <TableHead>{t("admin.products.col.category")}</TableHead>
              <TableHead>{t("admin.products.col.material")}</TableHead>
              <TableHead>{t("admin.products.col.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  {t("admin.common.loading")}
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                  {t("admin.products.empty")}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => {
                const isSelected = selected.has(p.id);
                const family = familyName(p.primary_category?.family_id ?? null);
                const category = p.primary_category ? localizedName(p.primary_category, language) : null;
                return (
                  <TableRow
                    key={p.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn("cursor-pointer", p.status === "archived" && "text-muted-foreground")}
                    onClick={() => navigate(`/admin/products/${p.id}`)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(p.id)}
                        aria-label={t("admin.products.select", { name: p.name })}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.item_code ?? <span className="text-muted-foreground italic">{t("admin.products.noCode")}</span>}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{p.name}</span>
                        {p.brand_name && (
                          <Badge variant="outline" className="text-[10px]">
                            {p.brand_name}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{category ?? "—"}</div>
                      {family && <div className="text-xs text-muted-foreground">{family}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{p.material_name ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} isPublic={p.is_public} />
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!pendingArchive} onOpenChange={(open) => !open && setPendingArchive(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("admin.products.archiveTitle", { count: pendingArchive?.length ?? 0 })}</AlertDialogTitle>
            <AlertDialogDescription>{t("admin.products.archiveBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("admin.common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>{t("admin.common.archive")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
