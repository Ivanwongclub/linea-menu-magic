import { useState, useMemo, useEffect } from "react";
import { format } from "date-fns";
import {
  Search, Plus, Pencil, Archive, Trash2, Check,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { useProducts } from "@/features/products/hooks/useProducts";
import { useProductTaxonomy } from "@/features/products/hooks/useProductTaxonomy";
import type { Product } from "@/features/products/types";

/* ── Status helpers ─────────────────────────────────────── */

type StatusFilter = "all" | "active" | "draft" | "archived";

const statusConfig: Record<string, { label: string; className: string }> = {
  active:   { label: "Active",   className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  draft:    { label: "Draft",    className: "bg-muted text-muted-foreground" },
  archived: { label: "Archived", className: "bg-orange-500/15 text-orange-600 border-orange-500/30" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? statusConfig.draft;
  return <Badge variant="outline" className={cfg.className}>{cfg.label}</Badge>;
}

/* ── Main component ─────────────────────────────────────── */

interface ProductCatalogTabProps {
  onOpenEditor?: (productId?: string) => void;
}

export default function ProductCatalogTab({ onOpenEditor }: ProductCatalogTabProps) {
  const taxonomy = useProductTaxonomy();

  // We fetch ALL products (not just active/public) for admin view
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select(`
        *,
        product_category_map(
          is_primary,
          product_categories(id, name, slug, sort_order, icon_url)
        ),
        product_tag_map(
          product_tags(id, name, slug, color)
        )
      `)
      .order("sort_order", { ascending: false });

    if (!error && data) {
      setAllProducts(
        (data as unknown as Record<string, unknown>[]).map((row) => {
          const catMaps = (row.product_category_map as Record<string, unknown>[]) ?? [];
          const categories = catMaps
            .map((m) => m.product_categories as Record<string, unknown> | null)
            .filter(Boolean)
            .map((c) => ({
              id: c!.id as string,
              name: c!.name as string,
              slug: (c!.slug as string) ?? "",
              sort_order: (c!.sort_order as number) ?? 0,
            }));
          const primaryMap = catMaps.find((m) => m.is_primary === true);
          const primaryCategory = primaryMap
            ? categories.find(
                (c) =>
                  c.id ===
                  ((primaryMap.product_categories as Record<string, unknown> | null)?.id as string)
              )
            : categories[0];

          const tagMaps = (row.product_tag_map as Record<string, unknown>[]) ?? [];
          const tags = tagMaps
            .map((m) => m.product_tags as Record<string, unknown> | null)
            .filter(Boolean)
            .map((t) => ({
              id: t!.id as string,
              name: t!.name as string,
              slug: (t!.slug as string) ?? "",
              color: (t!.color as "black" | "gray" | "white") ?? "black",
            }));

          return {
            id: row.id as string,
            item_code: (row.item_code as string) ?? "",
            name: row.name as string,
            name_en: row.name_en as string | undefined,
            slug: row.slug as string,
            status: row.status as Product["status"],
            is_public: row.is_public as boolean,
            is_customizable: row.is_customizable as boolean,
            thumbnail_url: row.thumbnail_url as string | undefined,
            model_url: row.model_url as string | undefined,
            sort_order: row.sort_order as number,
            created_at: row.created_at as string,
            updated_at: row.updated_at as string,
            categories,
            primary_category: primaryCategory,
            tags,
          } as Product;
        })
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [archiveTarget, setArchiveTarget] = useState<Product | null>(null);

  const filtered = useMemo(() => {
    return allProducts.filter((p) => {
      const matchesSearch =
        !searchQuery ||
        (p.name ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name_en ?? "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.item_code ?? "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" ||
        p.categories?.some((c) => c.slug === categoryFilter) ||
        p.primary_category?.slug === categoryFilter;
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [allProducts, searchQuery, statusFilter, categoryFilter]);

  const counts = useMemo(() => {
    const m = { all: allProducts.length, active: 0, draft: 0, archived: 0 };
    allProducts.forEach((p) => {
      if (p.status in m) m[p.status as keyof typeof m]++;
    });
    return m;
  }, [allProducts]);

  // Toggle is_public
  const handleTogglePublic = async (product: Product) => {
    const next = !product.is_public;
    const { error } = await supabase
      .from("products")
      .update({ is_public: next })
      .eq("id", product.id);
    if (error) {
      toast.error("Failed to update visibility");
    } else {
      setAllProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_public: next } : p))
      );
    }
  };

  // Archive product
  const handleArchive = async () => {
    if (!archiveTarget) return;
    const { error } = await supabase
      .from("products")
      .update({ status: "archived" })
      .eq("id", archiveTarget.id);
    if (error) {
      toast.error("Failed to archive");
    } else {
      toast.success("Product archived");
      setAllProducts((prev) =>
        prev.map((p) =>
          p.id === archiveTarget.id ? { ...p, status: "archived" as const } : p
        )
      );
    }
    setArchiveTarget(null);
  };

  // Bulk status change
  const handleBulkStatus = async (status: "active" | "draft" | "archived") => {
    const ids = [...selected];
    if (!ids.length) return;
    const { error } = await supabase
      .from("products")
      .update({ status })
      .in("id", ids);
    if (error) {
      toast.error("Bulk update failed");
    } else {
      toast.success(`${ids.length} products updated`);
      setAllProducts((prev) =>
        prev.map((p) => (ids.includes(p.id) ? { ...p, status } : p))
      );
      setSelected(new Set());
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p.id)));
    }
  };

  return (
    <div>
      {/* Top bar */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-shrink-0 w-48 lg:w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search products…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>

        <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs px-2.5 h-6">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="active" className="text-xs px-2.5 h-6">Active ({counts.active})</TabsTrigger>
            <TabsTrigger value="draft" className="text-xs px-2.5 h-6">Draft ({counts.draft})</TabsTrigger>
            <TabsTrigger value="archived" className="text-xs px-2.5 h-6">Archived ({counts.archived})</TabsTrigger>
          </TabsList>
        </Tabs>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[140px] h-8 text-sm flex-shrink-0">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {taxonomy.categories.map((c) => (
              <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex-1" />

        {/* Bulk actions */}
        {selected.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{selected.size} selected</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulkStatus("active")}>
              Set Active
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulkStatus("draft")}>
              Set Draft
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleBulkStatus("archived")}>
              Archive
            </Button>
          </div>
        )}

        <Button size="sm" className="gap-1.5 h-8" onClick={() => onOpenEditor?.()}>
          <Plus className="w-3.5 h-3.5" />
          New Product
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-12 bg-muted animate-pulse rounded" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-sm">No products found</p>
        </div>
      ) : (
        <div className="border border-border rounded-[var(--radius)] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-12">Image</TableHead>
                <TableHead className="w-28">Item Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead className="w-28">Category</TableHead>
                <TableHead className="w-32">Tags</TableHead>
                <TableHead className="w-24">Status</TableHead>
                <TableHead className="w-16 text-center">Public</TableHead>
                <TableHead className="w-36 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="group">
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="w-10 h-10 rounded bg-secondary overflow-hidden">
                      {p.thumbnail_url ? (
                        <img src={p.thumbnail_url} alt="" className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[7px] text-muted-foreground font-mono">
                          {p.item_code?.slice(0, 5)}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs">{p.item_code}</span>
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => onOpenEditor?.(p.id)}
                      className="text-sm font-medium text-foreground hover:text-primary hover:underline underline-offset-2 text-left transition-colors"
                    >
                      {p.name_en || p.name}
                    </button>
                    {p.name_en && p.name !== p.name_en && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-[200px]">{p.name}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.primary_category && (
                      <Badge variant="outline" className="text-xs">{p.primary_category.name}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(p.tags ?? []).slice(0, 2).map((t) => (
                        <span
                          key={t.id}
                          className="bg-foreground text-background text-[9px] font-medium uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-[var(--radius)]"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                    <Switch
                      checked={p.is_public}
                      onCheckedChange={() => handleTogglePublic(p)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => onOpenEditor?.(p.id)}>
                        <Pencil className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 text-destructive hover:text-destructive"
                        onClick={() => setArchiveTarget(p)}
                      >
                        <Archive className="w-3 h-3" />
                        Archive
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Archive confirmation */}
      <AlertDialog open={!!archiveTarget} onOpenChange={(open) => !open && setArchiveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive product</AlertDialogTitle>
            <AlertDialogDescription>
              Archive "{archiveTarget?.name_en || archiveTarget?.name}"? It will no longer appear in the public catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>Archive</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
