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
  categories: CatalogueCategory[];
}

export const CATALOGUE_TAXONOMY_KEY = ["catalogue-taxonomy"] as const;

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
        categories: (c.data ?? []).filter((row): row is CatalogueCategory => !!row.slug) as CatalogueCategory[],
      };
    },
  });

  const families = useMemo<CatalogueFamily[]>(() => {
    const cats = query.data?.categories ?? [];
    return (query.data?.families ?? []).map((f) => ({
      ...f,
      categories: cats.filter((c) => c.family_id === f.id),
    }));
  }, [query.data]);

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
  const categorySlugsForSegment = useCallback(
    (segment: string) => families.filter((f) => f.segment === segment).flatMap((f) => f.categories.map((c) => c.slug)),
    [families],
  );

  return {
    families,
    categories,
    segments,
    loading: query.isLoading,
    error: query.error ? (query.error as Error).message : null,
    familyBySlug,
    categoryBySlug,
    familyOf,
    categorySlugsForFamily,
    categorySlugsForSegment,
  };
}
