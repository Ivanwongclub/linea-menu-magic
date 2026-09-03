import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Globe, Lock, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { cn } from "@/lib/utils";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { useFlatCrudTable } from "@/features/admin/hooks/useFlatCrudTable";
import {
  useAdminProducts,
  type AdminProductRow,
  type AdminProductStatus,
} from "@/features/admin/hooks/useAdminProducts";

const ALL = "__all__";

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  archived: "Archived",
};

function StatusBadge({ status }: { status: string }) {
  // Three visually distinct states: solid = live, outlined = not yet, muted = retired.
  if (status === "active") return <Badge className="text-[10px]">Active</Badge>;
  if (status === "archived")
    return (
      <Badge variant="secondary" className="text-[10px] text-muted-foreground line-through">
        Archived
      </Badge>
    );
  return (
    <Badge variant="outline" className="text-[10px]">
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}

type SupabaseError = { message: string; code?: string };

export default function AdminProducts() {
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

  const [search, setSearch] = useState("");
  const [familyId, setFamilyId] = useState(ALL);
  const [categoryId, setCategoryId] = useState(ALL);
  const [status, setStatusFilter] = useState(ALL);
  const [materialId, setMaterialId] = useState(ALL);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingArchive, setPendingArchive] = useState<AdminProductRow[] | null>(null);

  const familyName = (id: string | null) => families.find((f) => f.id === id)?.name ?? null;

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
      if (term && !p.name.toLowerCase().includes(term) && !(p.item_code ?? "").toLowerCase().includes(term))
        return false;
      return true;
    });
  }, [products, search, familyId, categoryId, status, materialId]);

  const selectedRows = useMemo(() => products.filter((p) => selected.has(p.id)), [products, selected]);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visible.forEach((p) => next.delete(p.id));
        return next;
      }
      return new Set([...prev, ...visible.map((p) => p.id)]);
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelected(new Set());

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as SupabaseError));

  /**
   * published_needs_item_code rejects status='active' without an item_code —
   * check first and say exactly which products are missing one, rather than
   * letting the constraint fire mid-batch.
   */
  const splitByItemCode = (rows: AdminProductRow[]) => ({
    eligible: rows.filter((r) => r.item_code),
    missing: rows.filter((r) => !r.item_code),
  });

  const describeSkipped = (rows: AdminProductRow[], reason: string) =>
    `${rows.length === 1 ? "1 product" : `${rows.length} products`} skipped — ${reason}: ${rows
      .map((r) => r.name)
      .slice(0, 5)
      .join(", ")}${rows.length > 5 ? ", …" : ""}`;

  const handleSetStatus = (target: AdminProductStatus) => {
    if (selectedRows.length === 0) return;

    if (target === "archived") {
      setPendingArchive(selectedRows);
      return;
    }

    let rows = selectedRows;
    if (target === "active") {
      const { eligible, missing } = splitByItemCode(selectedRows);
      if (missing.length > 0) toast.error(describeSkipped(missing, "no item code, can't be made active"));
      if (eligible.length === 0) return;
      rows = eligible;
    }

    setStatus.mutate(
      { ids: rows.map((r) => r.id), status: target },
      {
        onSuccess: () => {
          toast.success(`${rows.length} set to ${STATUS_LABEL[target]}.`);
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
    if (brandOwned.length > 0) toast.error(describeSkipped(brandOwned, "brand-owned, not archived by us"));
    setPendingArchive(null);
    if (house.length === 0) return;

    setStatus.mutate(
      { ids: house.map((r) => r.id), status: "archived" },
      {
        onSuccess: () => {
          toast.success(`${house.length} archived.`);
          clearSelection();
        },
        onError,
      },
    );
  };

  const handlePublish = () => {
    if (selectedRows.length === 0) return;
    const { eligible, missing } = splitByItemCode(selectedRows);
    if (missing.length > 0) toast.error(describeSkipped(missing, "no item code, can't be published"));
    if (eligible.length === 0) return;

    publish.mutate(
      { ids: eligible.map((r) => r.id) },
      {
        onSuccess: () => {
          toast.success(`${eligible.length} published.`);
          clearSelection();
        },
        onError,
      },
    );
  };

  const busy = setStatus.isPending || publish.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-light tracking-wide text-foreground">Products</h1>
        <p className="text-sm text-muted-foreground">
          {visible.length === products.length
            ? `${products.length} products`
            : `${visible.length} of ${products.length} products`}
        </p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            className="rounded-none pl-9"
            placeholder="Name or item code"
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
            <SelectValue placeholder="Family" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All families</SelectItem>
            {families.map((f) => (
              <SelectItem key={f.id} value={f.id}>
                {f.name}
                {!f.is_active ? " (archived)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All categories</SelectItem>
            {categoryOptions.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
                {!c.is_active ? " (archived)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatusFilter}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        <Select value={materialId} onValueChange={setMaterialId}>
          <SelectTrigger className="rounded-none">
            <SelectValue placeholder="Material" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All materials</SelectItem>
            {materials.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.name}
                {!m.is_active ? " (archived)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 border border-foreground bg-secondary/40 px-4 py-2">
          <span className="text-sm text-foreground mr-2">{selected.size} selected</span>
          <span className="text-xs uppercase tracking-wider text-muted-foreground">Set status</span>
          <Button variant="outline" size="sm" className="rounded-none" disabled={busy} onClick={() => handleSetStatus("draft")}>
            Draft
          </Button>
          <Button variant="outline" size="sm" className="rounded-none" disabled={busy} onClick={() => handleSetStatus("active")}>
            Active
          </Button>
          <Button variant="outline" size="sm" className="rounded-none" disabled={busy} onClick={() => handleSetStatus("archived")}>
            Archived
          </Button>
          <span className="mx-2 h-5 w-px bg-border" />
          <Button size="sm" className="rounded-none" disabled={busy} onClick={handlePublish}>
            <Globe className="w-3.5 h-3.5 mr-2" />
            Publish
          </Button>
          <Button variant="ghost" size="sm" className="rounded-none ml-auto" onClick={clearSelection}>
            <X className="w-3.5 h-3.5 mr-1" />
            Clear
          </Button>
        </div>
      )}

      <div className="border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={allVisibleSelected} onCheckedChange={toggleAll} aria-label="Select all" />
              </TableHead>
              <TableHead>Item code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16">Public</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  Loading…
                </TableCell>
              </TableRow>
            ) : visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                  No products match these filters.
                </TableCell>
              </TableRow>
            ) : (
              visible.map((p) => {
                const isSelected = selected.has(p.id);
                const family = familyName(p.primary_category?.family_id ?? null);
                return (
                  <TableRow
                    key={p.id}
                    data-state={isSelected ? "selected" : undefined}
                    className={cn(p.status === "archived" && "text-muted-foreground")}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleOne(p.id)}
                        aria-label={`Select ${p.name}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {p.item_code ?? <span className="text-muted-foreground italic">none</span>}
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
                      <div className="text-sm">{p.primary_category?.name ?? "—"}</div>
                      {family && <div className="text-xs text-muted-foreground">{family}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{p.material_name ?? "—"}</TableCell>
                    <TableCell>
                      <StatusBadge status={p.status} />
                    </TableCell>
                    <TableCell>
                      {p.is_public ? (
                        <Globe className="w-3.5 h-3.5 text-foreground" aria-label="Public" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" aria-label="Private" />
                      )}
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
            <AlertDialogTitle>Archive {pendingArchive?.length ?? 0} products?</AlertDialogTitle>
            <AlertDialogDescription>
              Archived products drop off the public site and the Designer Studio trim library. Nothing is
              deleted — they can be restored to Draft or Active later. Brand-owned products in the selection
              will be skipped.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
