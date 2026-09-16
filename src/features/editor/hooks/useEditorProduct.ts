import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface EditorFinish {
  id: string;
  marketing_name: string;
  hex_approx: string | null;
  metalness: number;
  roughness: number;
  anisotropy: number;
  /** e.g. "Hanger plating · Nickel · Brushed" — axis-design §4/§7. */
  axis_line: string;
}

export interface EditorSizeVariant {
  id: string;
  size_label: string | null;
  size_ligne: number | null;
  size_primary_mm: number;
  is_default: boolean;
  sort_order: number;
}

export interface EditorColour {
  id: string;
  name: string;
  hex: string | null;
  sort_order: number;
}

export interface EditorProduct {
  id: string;
  slug: string;
  name: string;
  item_code: string;
  model_storage_path: string | null;
  is_metal: boolean;
  default_finish_id: string | null;
  size_variants: EditorSizeVariant[];
  colours: EditorColour[];
  finishes: EditorFinish[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/**
 * A narrower, editor-specific read than `useProduct` (storefront hook, out
 * of this phase's edit scope): just what the viewport and PRODUCT/FINISH
 * panel groups need, plus each finish's axis names (process/base_family/
 * surface) nested in one round trip so the panel can show "marketing name
 * + axis line" without a second query.
 */
const EDITOR_PRODUCT_SELECT = `
  id, slug, name, item_code, model_storage_path, default_finish_id,
  material:product_materials!material_id ( is_metal ),
  product_size_variants ( id, size_label, size_ligne, size_primary_mm, is_default, sort_order ),
  product_colours ( id, name, hex, sort_order ),
  product_finishes (
    sort_order,
    finishes (
      id, marketing_name, hex_approx, metalness, roughness, anisotropy,
      process:finish_processes!process_id ( name ),
      base_family:finish_base_families!base_family_id ( name ),
      surface:finish_surfaces!surface_id ( name )
    )
  )
`;

function axisLine(f: Row): string {
  return [f.process?.name, f.base_family?.name, f.surface?.name].filter(Boolean).join(" · ");
}

function transform(row: Row): EditorProduct {
  const finishes: EditorFinish[] = (row.product_finishes ?? [])
    .map((pf: Row) => pf.finishes as Row | null)
    .filter((f: Row | null): f is Row => !!f)
    .map((f: Row) => ({
      id: f.id as string,
      marketing_name: f.marketing_name as string,
      hex_approx: (f.hex_approx as string | null) ?? null,
      metalness: Number(f.metalness) || 0,
      roughness: Number(f.roughness) || 0,
      anisotropy: Number(f.anisotropy) || 0,
      axis_line: axisLine(f),
    }));

  const sizeVariants: EditorSizeVariant[] = (row.product_size_variants ?? [])
    .map((v: Row) => ({
      id: v.id as string,
      size_label: (v.size_label as string | null) ?? null,
      size_ligne: (v.size_ligne as number | null) ?? null,
      size_primary_mm: Number(v.size_primary_mm) || 0,
      is_default: !!v.is_default,
      sort_order: Number(v.sort_order) || 0,
    }))
    .sort((a, b) => a.sort_order - b.sort_order || a.size_primary_mm - b.size_primary_mm);

  const colours: EditorColour[] = (row.product_colours ?? [])
    .map((c: Row) => ({
      id: c.id as string,
      name: c.name as string,
      hex: (c.hex as string | null) ?? null,
      sort_order: Number(c.sort_order) || 0,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id as string,
    slug: row.slug as string,
    name: row.name as string,
    item_code: row.item_code as string,
    model_storage_path: (row.model_storage_path as string | null) ?? null,
    is_metal: !!(row.material as Row | null)?.is_metal,
    default_finish_id: (row.default_finish_id as string | null) ?? null,
    size_variants: sizeVariants,
    colours,
    finishes,
  };
}

async function fetchBySlug(slug: string): Promise<EditorProduct | null> {
  const { data, error } = await supabase.from("products").select(EDITOR_PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? transform(data as unknown as Row) : null;
}

async function fetchById(id: string): Promise<EditorProduct | null> {
  const { data, error } = await supabase.from("products").select(EDITOR_PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? transform(data as unknown as Row) : null;
}

export function useEditorProductBySlug(slug: string | null) {
  return useQuery({
    queryKey: ["editor-product-slug", slug],
    queryFn: () => fetchBySlug(slug as string),
    enabled: !!slug,
  });
}

export function useEditorProductById(productId: string | null) {
  return useQuery({
    queryKey: ["editor-product-id", productId],
    queryFn: () => fetchById(productId as string),
    enabled: !!productId,
  });
}
