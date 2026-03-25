import { useState, useMemo } from "react";
import Papa from "papaparse";
import { Download, Upload, Loader2, AlertCircle, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

/* ── CSV template ────────────────────────────────────────── */

const CSV_COLUMNS = [
  "item_code", "name", "name_en", "description",
  "categories", "materials", "tags", "industries",
  "status", "is_public", "is_customizable",
] as const;

const TEMPLATE_ROW = [
  "BTN-001", "Metal Button", "Metal Button", "A description",
  "buttons,fasteners", "zinc-alloy", "new-item", "apparel",
  "active", "true", "false",
].join(",");

function downloadTemplate() {
  const csv = CSV_COLUMNS.join(",") + "\n" + TEMPLATE_ROW + "\n";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "product-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Types ───────────────────────────────────────────────── */

interface ParsedRow {
  rowIndex: number;
  item_code: string;
  name: string;
  name_en: string;
  description: string;
  categories: string[];
  materials: string[];
  tags: string[];
  industries: string[];
  status: string;
  is_public: boolean;
  is_customizable: boolean;
  errors: string[];
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* ── Main component ──────────────────────────────────────── */

export default function ImportTab() {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);

  const validRows = useMemo(() => rows.filter((r) => r.errors.length === 0), [rows]);
  const errorRows = useMemo(() => rows.filter((r) => r.errors.length > 0), [rows]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed: ParsedRow[] = (result.data as Record<string, string>[]).map((raw, i) => {
          const errors: string[] = [];
          if (!raw.name?.trim()) errors.push("Name is required");
          if (!["draft", "active", "archived", ""].includes(raw.status ?? ""))
            errors.push(`Invalid status: ${raw.status}`);

          return {
            rowIndex: i + 2,
            item_code: raw.item_code?.trim() ?? "",
            name: raw.name?.trim() ?? "",
            name_en: raw.name_en?.trim() ?? "",
            description: raw.description?.trim() ?? "",
            categories: (raw.categories ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            materials: (raw.materials ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            tags: (raw.tags ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            industries: (raw.industries ?? "").split(",").map((s) => s.trim()).filter(Boolean),
            status: raw.status?.trim() || "draft",
            is_public: raw.is_public?.toLowerCase() === "true",
            is_customizable: raw.is_customizable?.toLowerCase() === "true",
            errors,
          };
        });
        setRows(parsed);
        setImported(false);
      },
    });
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!validRows.length) return;
    setImporting(true);

    try {
      // Batch insert products in chunks of 50
      const CHUNK = 50;
      let inserted = 0;

      for (let i = 0; i < validRows.length; i += CHUNK) {
        const chunk = validRows.slice(i, i + CHUNK);
        const productRows = chunk.map((r) => ({
          item_code: r.item_code || null,
          name: r.name,
          name_en: r.name_en || null,
          slug: slugify(r.name_en || r.name),
          description: r.description || null,
          status: r.status,
          is_public: r.is_public,
          is_customizable: r.is_customizable,
        }));

        const { data, error } = await supabase
          .from("products")
          .insert(productRows)
          .select("id, slug");

        if (error) {
          toast.error(`Chunk ${Math.floor(i / CHUNK) + 1} failed: ${error.message}`);
          continue;
        }

        // Map slugs to product IDs for junction inserts
        if (data) {
          inserted += data.length;

          // Build junction rows
          const catRows: { product_id: string; category_id: string; is_primary: boolean }[] = [];
          const matRows: { product_id: string; material_id: string }[] = [];
          const tagRows: { product_id: string; tag_id: string }[] = [];
          const indRows: { product_id: string; industry_id: string }[] = [];

          for (let j = 0; j < chunk.length; j++) {
            const row = chunk[j];
            const pid = data[j]?.id;
            if (!pid) continue;

            // Resolve slugs to IDs via taxonomy lookup
            // For now, we insert category/material/tag/industry by slug matching
            if (row.categories.length) {
              const { data: cats } = await supabase
                .from("product_categories")
                .select("id, slug")
                .in("slug", row.categories);
              cats?.forEach((c, ci) => catRows.push({ product_id: pid, category_id: c.id, is_primary: ci === 0 }));
            }
            if (row.materials.length) {
              const { data: mats } = await supabase
                .from("product_materials")
                .select("id")
                .in("slug", row.materials);
              mats?.forEach((m) => matRows.push({ product_id: pid, material_id: m.id }));
            }
            if (row.tags.length) {
              const { data: tgs } = await supabase
                .from("product_tags")
                .select("id")
                .in("slug", row.tags);
              tgs?.forEach((t) => tagRows.push({ product_id: pid, tag_id: t.id }));
            }
            if (row.industries.length) {
              const { data: inds } = await supabase
                .from("product_industries")
                .select("id")
                .in("slug", row.industries);
              inds?.forEach((ind) => indRows.push({ product_id: pid, industry_id: ind.id }));
            }
          }

          // Batch insert junctions
          if (catRows.length) await supabase.from("product_category_map").insert(catRows);
          if (matRows.length) await supabase.from("product_material_map").insert(matRows);
          if (tagRows.length) await supabase.from("product_tag_map").insert(tagRows);
          if (indRows.length) await supabase.from("product_industry_map").insert(indRows);
        }
      }

      toast.success(`${inserted} products imported`);
      setImported(true);
    } catch (err) {
      toast.error(`Import failed: ${(err as Error).message}`);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={downloadTemplate}>
          <Download className="w-3.5 h-3.5" />
          Download CSV Template
        </Button>

        <label>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs" asChild>
            <span>
              <Upload className="w-3.5 h-3.5" />
              Upload CSV
            </span>
          </Button>
          <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
        </label>
      </div>

      {rows.length > 0 && (
        <>
          {/* Summary */}
          <div className="flex items-center gap-4 mb-4">
            <Badge variant="outline" className="text-xs gap-1">
              {rows.length} total rows
            </Badge>
            <Badge variant="outline" className="text-xs gap-1 bg-emerald-500/15 text-emerald-600 border-emerald-500/30">
              <Check className="w-3 h-3" />
              {validRows.length} valid
            </Badge>
            {errorRows.length > 0 && (
              <Badge variant="outline" className="text-xs gap-1 bg-red-500/15 text-red-600 border-red-500/30">
                <AlertCircle className="w-3 h-3" />
                {errorRows.length} errors
              </Badge>
            )}
          </div>

          {/* Preview table */}
          <div className="border border-border rounded-[var(--radius)] overflow-hidden mb-4">
            <div className="max-h-[400px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-xs">Row</TableHead>
                    <TableHead className="text-xs">Item Code</TableHead>
                    <TableHead className="text-xs">Name</TableHead>
                    <TableHead className="text-xs">Name EN</TableHead>
                    <TableHead className="text-xs">Categories</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs">Errors</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.rowIndex} className={r.errors.length ? "bg-red-500/5" : ""}>
                      <TableCell className="text-xs text-muted-foreground">{r.rowIndex}</TableCell>
                      <TableCell className="text-xs font-mono">{r.item_code}</TableCell>
                      <TableCell className="text-xs">{r.name}</TableCell>
                      <TableCell className="text-xs">{r.name_en}</TableCell>
                      <TableCell className="text-xs">{r.categories.join(", ")}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {r.errors.length > 0 && (
                          <span className="text-xs text-red-600">{r.errors.join("; ")}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Import button */}
          {!imported && (
            <Button
              size="sm"
              className="gap-1.5"
              disabled={validRows.length === 0 || importing}
              onClick={handleImport}
            >
              {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Import {validRows.length} products
            </Button>
          )}

          {imported && (
            <div className="flex items-center gap-2 text-sm text-emerald-600">
              <Check className="w-4 h-4" />
              Import complete
            </div>
          )}
        </>
      )}

      {rows.length === 0 && (
        <div className="text-center py-16 border border-dashed border-border rounded-[var(--radius)]">
          <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-1">Upload a CSV file to import products</p>
          <p className="text-xs text-muted-foreground">Download the template first to see the expected format</p>
        </div>
      )}
    </div>
  );
}
