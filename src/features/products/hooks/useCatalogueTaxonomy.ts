import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * The one source of truth for the public taxonomy: `product_families` and
 * `product_categories` from the database. Replaces three hand-maintained
 * trees that disagreed with each other and with the data (taxonomy.ts,
 * Header's MEGA_FAMILIES, useProducts' SEGMENT_TO_FAMILIES).
 *
 * Only active families and their active categories are returned — a
 * category whose family is inactive or unset is not part of the public
 * structure. Names are trilingual; render them through `localizedName`.
 *
 * `families` is the full structure (filter resolution, chips). Public menus
 * render `familiesWithProducts`: categories with zero published products are
 * dropped, and a family with no remaining category is dropped with them.
 * Counts are of products the current session can see — for the anonymous
 * storefront that is active + public.
 */

export interface CatalogueCategory {
  id: string;
  slug: string;
  name: string;
  name_zh_hant: string | null;
  name_zh_hans: string | null;
  family_id: string | null;
  sort_order: number;
  icon_url: string | null;
  /** Published (active + public) products mapped to this category. */
  product_count: number;
}

export interface CatalogueFamily {
  id: string;
  slug: string;
  name: string;
  name_zh_hant: string | null;
  name_zh_hans: string | null;
  segment: string;
  sort_order: number;
  categories: CatalogueCategory[];
}

interface Raw {
  families: Omit<CatalogueFamily, "categories">[];
  categories: Omit<CatalogueCategory, "product_count">[];
}

export const CATALOGUE_TAXONOMY_KEY = ["catalogue-taxonomy"] as const;
export const CATALOGUE_COUNTS_KEY = ["catalogue-taxonomy", "counts"] as const;

/** Distinct published products per category id, as visible to this session. */
async function fetchPublishedCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from("product_category_map")
    .select("category_id, products!inner(id)")
    .eq("products.status", "active")
    .eq("products.is_public", true);
  if (error) throw error;
  const seen = new Set<string>();
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const productId = (row.products as { id: string } | null)?.id;
    if (!productId) continue;
    const key = `${row.category_id}:${productId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    counts[row.category_id] = (counts[row.category_id] ?? 0) + 1;
  }
  return counts;
}

export function useCatalogueTaxonomy() {
  const query = useQuery({
    queryKey: CATALOGUE_TAXONOMY_KEY,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<Raw> => {
      const [f, c] = await Promise.all([
        supabase
          .from("product_families")
          .select("id, slug, name, name_zh_hant, name_zh_hans, segment, sort_order")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
        supabase
          .from("product_categories")
          .select("id, slug, name, name_zh_hant, name_zh_hans, family_id, sort_order, icon_url")
          .eq("is_active", true)
          .order("sort_order", { ascending: true }),
      ]);
      if (f.error) throw f.error;
      if (c.error) throw c.error;
      return {
        families: f.data ?? [],
        categories: (c.data ?? []).filter((row) => !!row.slug),
      };
    },
  });

  const countsQuery = useQuery({
    queryKey: CATALOGUE_COUNTS_KEY,
    staleTime: 60 * 1000,
    queryFn: fetchPublishedCounts,
  });

  const families = useMemo<CatalogueFamily[]>(() => {
    const counts = countsQuery.data ?? {};
    const cats = (query.data?.categories ?? []).map((c) => ({ ...c, product_count: counts[c.id] ?? 0 }));
    return (query.data?.families ?? []).map((f) => ({
      ...f,
      categories: cats.filter((c) => c.family_id === f.id),
    }));
  }, [query.data, countsQuery.data]);

  /** Public-menu view: empty categories and then empty families dropped. Empty until counts arrive, so menus never flash the full tree. */
  const familiesWithProducts = useMemo<CatalogueFamily[]>(() => {
    if (!countsQuery.data) return [];
    return families
      .map((f) => ({ ...f, categories: f.categories.filter((c) => c.product_count > 0) }))
      .filter((f) => f.categories.length > 0);
  }, [families, countsQuery.data]);

  const categories = useMemo(() => families.flatMap((f) => f.categories), [families]);

  /** Distinct segments in family order — the values behind product_families.segment. */
  const segments = useMemo(() => [...new Set(families.map((f) => f.segment))], [families]);

  const familyBySlug = useCallback((slug: string) => families.find((f) => f.slug === slug), [families]);
  const categoryBySlug = useCallback((slug: string) => categories.find((c) => c.slug === slug), [categories]);
  const familyOf = useCallback(
    (category: { family_id?: string | null }) => families.find((f) => f.id === category.family_id),
    [families],
  );
  const categorySlugsForFamily = useCallback(
    (slug: string) => familyBySlug(slug)?.categories.map((c) => c.slug) ?? [],
    [familyBySlug],
  );
  /**
   * Marketing links (footer, home tiles, hero CTAs) target a family or a
   * category. While that target has no published products the link goes to
   * the full listing rather than an empty result; `undefined` means the
   * counts are not in yet.
   */
  const marketingHref = useCallback(
    (target: { family?: string; category?: string }): string => {
      if (!countsQuery.data) return "/products";
      if (target.category) {
        const cat = categories.find((c) => c.slug === target.category);
        return cat && cat.product_count > 0 ? `/products?category=${cat.slug}` : "/products";
      }
      if (target.family) {
        const fam = familiesWithProducts.find((f) => f.slug === target.family);
        return fam ? `/products?family=${fam.slug}` : "/products";
      }
      return "/products";
    },
    [countsQuery.data, categories, familiesWithProducts],
  );

  const categorySlugsForSegment = useCallback(
    (segment: string) => families.filter((f) => f.segment === segment).flatMap((f) => f.categories.map((c) => c.slug)),
    [families],
  );

  return {
    families,
    familiesWithProducts,
    categories,
    segments,
    loading: query.isLoading,
    countsLoading: countsQuery.isLoading,
    error: query.error ? (query.error as Error).message : null,
    familyBySlug,
    categoryBySlug,
    familyOf,
    categorySlugsForFamily,
    categorySlugsForSegment,
    marketingHref,
  };
}
