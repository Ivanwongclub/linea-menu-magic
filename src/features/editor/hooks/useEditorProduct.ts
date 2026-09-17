import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/features/i18n/I18nProvider";
import type { AppLanguage } from "@/features/i18n/translations";

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
  model_scale_status: "confirmed" | "unconfirmed";
  model_scale_factor: number | null;
  model_scale_reference_variant_id: string | null;
  is_metal: boolean;
  default_finish_id: string | null;
  size_variants: EditorSizeVariant[];
  colours: EditorColour[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;

/** Picks the current-language column, falling back to English — same rule the storefront uses. */
export function localized(language: AppLanguage, en: string, hant: string | null | undefined, hans: string | null | undefined): string {
  if (language === "zh-Hant") return hant || en;
  if (language === "zh-Hans") return hans || en;
  return en;
}

/**
 * A narrower, editor-specific read than `useProduct` (storefront hook, out
 * of this phase's edit scope): just what the viewport and PRODUCT/COLOUR
 * panel groups need. Finish options are fetched separately by
 * `useFinishOptions` — they need the raw `finishes` row shape for the
 * extracted picker, not this hook's display-only shape.
 */
const EDITOR_PRODUCT_SELECT = `
  id, slug, name, name_zh_hant, name_zh_hans, item_code, model_storage_path, default_finish_id,
  model_scale_status, model_scale_factor, model_scale_reference_variant_id,
  material:product_materials!material_id ( is_metal ),
  product_size_variants ( id, size_label, size_ligne, size_primary_mm, is_default, sort_order ),
  product_colours ( id, name, name_zh_hant, name_zh_hans, hex, sort_order )
`;

function transform(row: Row, language: AppLanguage): EditorProduct {
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
      name: localized(language, c.name as string, c.name_zh_hant, c.name_zh_hans),
      hex: (c.hex as string | null) ?? null,
      sort_order: Number(c.sort_order) || 0,
    }))
    .sort((a, b) => a.sort_order - b.sort_order);

  return {
    id: row.id as string,
    slug: row.slug as string,
    name: localized(language, row.name as string, row.name_zh_hant, row.name_zh_hans),
    item_code: row.item_code as string,
    model_storage_path: (row.model_storage_path as string | null) ?? null,
    model_scale_status: (row.model_scale_status as "confirmed" | "unconfirmed" | null) ?? "unconfirmed",
    model_scale_factor: row.model_scale_factor != null ? Number(row.model_scale_factor) : null,
    model_scale_reference_variant_id: (row.model_scale_reference_variant_id as string | null) ?? null,
    is_metal: !!(row.material as Row | null)?.is_metal,
    default_finish_id: (row.default_finish_id as string | null) ?? null,
    size_variants: sizeVariants,
    colours,
  };
}

async function fetchBySlug(slug: string): Promise<Row | null> {
  const { data, error } = await supabase.from("products").select(EDITOR_PRODUCT_SELECT).eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

async function fetchById(id: string): Promise<Row | null> {
  const { data, error } = await supabase.from("products").select(EDITOR_PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Row | null;
}

export function useEditorProductBySlug(slug: string | null) {
  const { language } = useI18n();
  const query = useQuery({
    queryKey: ["editor-product-slug", slug],
    queryFn: () => fetchBySlug(slug as string),
    enabled: !!slug,
  });
  return { ...query, data: query.data ? transform(query.data, language) : query.data };
}

export function useEditorProductById(productId: string | null) {
  const { language } = useI18n();
  const query = useQuery({
    queryKey: ["editor-product-id", productId],
    queryFn: () => fetchById(productId as string),
    enabled: !!productId,
  });
  return { ...query, data: query.data ? transform(query.data, language) : query.data };
}

/** Variant switch ratio for layer scaling (C10): new variant mm / current variant mm, 1 when either is unknown. */
export function variantRatio(product: EditorProduct, fromId: string | null, toId: string): number {
  const from = product.size_variants.find((v) => v.id === fromId)?.size_primary_mm ?? 0;
  const to = product.size_variants.find((v) => v.id === toId)?.size_primary_mm ?? 0;
  return from > 0 && to > 0 ? to / from : 1;
}
