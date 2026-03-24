import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters } from '../types';
import { getCategorySlugsForFamily, PRODUCT_FAMILIES } from '../taxonomy';

/**
 * Temporary segment → category-family mapping.
 * Maps approved Segment slugs to product family slugs so that
 * selecting "Fashion" shows Hardware products, etc.
 */
const SEGMENT_TO_FAMILIES: Record<string, string[]> = {
  fashion: ['hardware'],
  apparel: ['soft-trims'],
  beauty: ['branding-trims'],
};

interface UseProductsResult {
  products: Product[];
  loading: boolean;
  error: string | null;
  totalCount: number;
}

/**
 * Transforms raw Supabase row with nested junction data
 * into a clean Product shape.
 */
function transformProduct(row: Record<string, unknown>): Product {
  const categoryMaps = (row.product_category_map as Record<string, unknown>[] | null) ?? [];
  const materialMaps = (row.product_material_map as Record<string, unknown>[] | null) ?? [];
  const tagMaps = (row.product_tag_map as Record<string, unknown>[] | null) ?? [];
  const industryMaps = (row.product_industry_map as Record<string, unknown>[] | null) ?? [];
  const certificationMaps = (row.product_certification_map as Record<string, unknown>[] | null) ?? [];

  const categories = categoryMaps
    .map((m) => m.product_categories as Record<string, unknown> | null)
    .filter(Boolean)
    .map((c) => ({
      id: c!.id as string,
      name: c!.name as string,
      slug: c!.slug as string,
      sort_order: (c!.sort_order as number) ?? 0,
      icon_url: c!.icon_url as string | undefined,
    }));

  const primaryMap = categoryMaps.find((m) => m.is_primary === true);
  const primaryCategory = primaryMap
    ? categories.find(
        (c) =>
          c.id ===
          ((primaryMap.product_categories as Record<string, unknown> | null)?.id as string)
      )
    : categories[0];

  const materials = materialMaps
    .map((m) => m.product_materials as Record<string, unknown> | null)
    .filter(Boolean)
    .map((m) => ({
      id: m!.id as string,
      name: m!.name as string,
      slug: m!.slug as string,
      is_sustainable: (m!.is_sustainable as boolean) ?? false,
    }));

  const tags = tagMaps
    .map((m) => m.product_tags as Record<string, unknown> | null)
    .filter(Boolean)
    .map((t) => ({
      id: t!.id as string,
      name: t!.name as string,
      slug: t!.slug as string,
      color: (t!.color as 'black' | 'gray' | 'white') ?? 'black',
    }));

  return {
    id: row.id as string,
    item_code: row.item_code as string,
    name: row.name as string,
    name_en: row.name_en as string | undefined,
    slug: row.slug as string,
    description: row.description as string | undefined,
    description_en: row.description_en as string | undefined,
    status: row.status as Product['status'],
    is_public: row.is_public as boolean,
    is_customizable: row.is_customizable as boolean,
    specifications: row.specifications as Record<string, unknown> | undefined,
    production: row.production as Record<string, unknown> | undefined,
    thumbnail_url: row.thumbnail_url as string | undefined,
    model_url: row.model_url as string | undefined,
    sort_order: row.sort_order as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
    categories,
    primary_category: primaryCategory,
    materials,
    tags,
    industries: industryMaps
      .map((m) => m.product_industries as Record<string, unknown> | null)
      .filter(Boolean)
      .map((i) => ({
        id: i!.id as string,
        name: i!.name as string,
        slug: i!.slug as string,
        sort_order: (i!.sort_order as number) ?? 0,
      })),
    certifications: certificationMaps
      .map((m) => m.product_certifications as Record<string, unknown> | null)
      .filter(Boolean)
      .map((c) => ({
        id: c!.id as string,
        name: c!.name as string,
        abbreviation: (c!.abbreviation as string) ?? '',
        logo_url: c!.logo_url as string | undefined,
      })),
  };
}

export function useProducts(filters: ProductFilters): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const fetchProducts = async () => {
      setLoading(true);
      setError(null);

      try {
        // Build the base query with joined relations
        let query = supabase
          .from('products')
          .select(
            `
            *,
            product_category_map(
              is_primary,
              product_categories(id, name, slug, sort_order, icon_url)
            ),
            product_material_map(
              product_materials(id, name, slug, is_sustainable)
            ),
            product_tag_map(
              product_tags(id, name, slug, color)
            ),
            product_industry_map(
              product_industries(id, name, slug, sort_order)
            ),
            product_certification_map(
              product_certifications(id, name, abbreviation, logo_url)
            )
          `,
            { count: 'exact' }
          )
          .eq('status', 'active')
          .eq('is_public', true);

        // Text search across name, name_en, item_code
        if (filters.search) {
          const term = `%${filters.search}%`;
          query = query.or(
            `name.ilike.${term},name_en.ilike.${term},item_code.ilike.${term}`
          );
        }

        // Sort (only name_asc / name_desc exposed in UI)
        switch (filters.sort) {
          case 'name_asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name_desc':
            query = query.order('name', { ascending: false });
            break;
          default:
            query = query.order('sort_order', { ascending: true });
        }

        const { data, error: queryError, count } = await query;

        if (controller.signal.aborted) return;

        if (queryError) {
          setError(queryError.message);
          setProducts([]);
          setTotalCount(0);
          return;
        }

        let transformed = (data ?? []).map((row) =>
          transformProduct(row as unknown as Record<string, unknown>)
        );

        // Client-side junction filtering
        // Merge family filter into effective category list
        const effectiveCategories = (() => {
          const cats = filters.categories ?? [];
          const familyCats = filters.family
            ? getCategorySlugsForFamily(filters.family)
            : [];
          const merged = [...new Set([...cats, ...familyCats])];
          return merged.length > 0 ? merged : undefined;
        })();

        if (effectiveCategories?.length) {
          transformed = transformed.filter((p) =>
            p.categories?.some((c) => effectiveCategories.includes(c.slug))
          );
        }

        if (filters.materials?.length) {
          transformed = transformed.filter((p) =>
            p.materials?.some((m) => filters.materials!.includes(m.slug))
          );
        }

        if (filters.tags?.length) {
          transformed = transformed.filter((p) =>
            p.tags?.some((t) => filters.tags!.includes(t.slug))
          );
        }

        if (filters.is_customizable !== undefined) {
          transformed = transformed.filter(
            (p) => p.is_customizable === filters.is_customizable
          );
        }

        setProducts(transformed);
        setTotalCount(
          filters.categories?.length ||
            filters.materials?.length ||
            filters.tags?.length
            ? transformed.length
            : (count ?? transformed.length)
        );
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => controller.abort();
  }, [
    filters.search,
    filters.family,
    filters.categories?.join(','),
    filters.segments?.join(','),
    filters.materials?.join(','),
    filters.industries?.join(','),
    filters.certifications?.join(','),
    filters.tags?.join(','),
    filters.is_customizable,
    filters.sort,
  ]);

  return { products, loading, error, totalCount };
}
