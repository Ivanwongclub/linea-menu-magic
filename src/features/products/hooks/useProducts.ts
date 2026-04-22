import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Product, ProductFilters } from '../types';
import { getCategorySlugsForFamily, PRODUCT_FAMILIES } from '../taxonomy';

/**
 * Temporary segment -> category-family mapping.
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

interface QueryPayload {
  products: Product[];
  totalCount: number;
}

interface FilterScope {
  values?: string[];
  dimensionTable:
    | 'product_categories'
    | 'product_materials'
    | 'product_tags'
    | 'product_industries'
    | 'product_certifications';
  dimensionIdColumn: 'id';
  dimensionFilterColumn: 'slug' | 'abbreviation';
  mapTable:
    | 'product_category_map'
    | 'product_material_map'
    | 'product_tag_map'
    | 'product_industry_map'
    | 'product_certification_map';
  mapDimensionColumn:
    | 'category_id'
    | 'material_id'
    | 'tag_id'
    | 'industry_id'
    | 'certification_id';
  caseInsensitive?: boolean;
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

function normalizeList(values?: string[]): string[] | undefined {
  if (!values?.length) return undefined;
  const normalized = [...new Set(values.map((v) => v.trim()).filter(Boolean))];
  return normalized.length > 0 ? normalized : undefined;
}

function intersectSets(sets: Set<string>[]): string[] {
  if (sets.length === 0) return [];
  const [first, ...rest] = sets;
  const intersection = new Set(first);

  rest.forEach((set) => {
    for (const value of [...intersection]) {
      if (!set.has(value)) {
        intersection.delete(value);
      }
    }
  });

  return [...intersection];
}

async function resolveProductSetByDimension(scope: FilterScope): Promise<Set<string>> {
  const values = normalizeList(scope.values);
  if (!values?.length) return new Set();

  const isCaseInsensitive = scope.caseInsensitive === true;

  let dimensionRows: Record<string, unknown>[] = [];

  if (isCaseInsensitive) {
    const { data, error } = await supabase
      .from(scope.dimensionTable)
      .select(`${scope.dimensionIdColumn}, ${scope.dimensionFilterColumn}`);

    if (error) throw new Error(error.message);

    const wanted = new Set(values.map((value) => value.toLowerCase()));
    dimensionRows = ((data ?? []) as Record<string, unknown>[]).filter((row) => {
      const raw = row[scope.dimensionFilterColumn];
      return typeof raw === 'string' && wanted.has(raw.toLowerCase());
    });
  } else {
    const { data, error } = await supabase
      .from(scope.dimensionTable)
      .select(scope.dimensionIdColumn)
      .in(scope.dimensionFilterColumn, values);

    if (error) throw new Error(error.message);
    dimensionRows = (data ?? []) as Record<string, unknown>[];
  }

  const dimensionIds = dimensionRows
    .map((row) => row[scope.dimensionIdColumn] as string | undefined)
    .filter((value): value is string => Boolean(value));

  if (dimensionIds.length === 0) return new Set();

  const { data: mapRows, error: mapError } = await supabase
    .from(scope.mapTable)
    .select('product_id')
    .in(scope.mapDimensionColumn, dimensionIds);

  if (mapError) throw new Error(mapError.message);

  return new Set(
    ((mapRows ?? []) as Record<string, unknown>[])
      .map((row) => row.product_id as string | undefined)
      .filter((value): value is string => Boolean(value))
  );
}

function getEffectiveCategorySlugs(filters: ProductFilters): string[] | undefined {
  const categories = normalizeList(filters.categories) ?? [];
  const familyCategories = filters.family
    ? getCategorySlugsForFamily(filters.family)
    : [];

  const segmentCategories =
    normalizeList(filters.segments)?.flatMap((segment) => {
      const familySlugs = SEGMENT_TO_FAMILIES[segment] ?? [];
      return familySlugs.flatMap((familySlug) => {
        return PRODUCT_FAMILIES.find((family) => family.slug === familySlug)?.categorySlugs ?? [];
      });
    }) ?? [];

  const merged = [...new Set([...categories, ...familyCategories, ...segmentCategories])];
  return merged.length > 0 ? merged : undefined;
}

async function fetchProducts(filters: ProductFilters): Promise<QueryPayload> {
  const brandScoped = filters.visibility === 'brand';

  const filterScopes: FilterScope[] = [
    {
      values: getEffectiveCategorySlugs(filters),
      dimensionTable: 'product_categories',
      dimensionIdColumn: 'id',
      dimensionFilterColumn: 'slug',
      mapTable: 'product_category_map',
      mapDimensionColumn: 'category_id',
    },
    {
      values: normalizeList(filters.materials),
      dimensionTable: 'product_materials',
      dimensionIdColumn: 'id',
      dimensionFilterColumn: 'slug',
      mapTable: 'product_material_map',
      mapDimensionColumn: 'material_id',
    },
    {
      values: normalizeList(filters.tags),
      dimensionTable: 'product_tags',
      dimensionIdColumn: 'id',
      dimensionFilterColumn: 'slug',
      mapTable: 'product_tag_map',
      mapDimensionColumn: 'tag_id',
    },
    {
      values: normalizeList(filters.industries),
      dimensionTable: 'product_industries',
      dimensionIdColumn: 'id',
      dimensionFilterColumn: 'slug',
      mapTable: 'product_industry_map',
      mapDimensionColumn: 'industry_id',
    },
    {
      values: normalizeList(filters.certifications),
      dimensionTable: 'product_certifications',
      dimensionIdColumn: 'id',
      dimensionFilterColumn: 'abbreviation',
      mapTable: 'product_certification_map',
      mapDimensionColumn: 'certification_id',
      caseInsensitive: true,
    },
  ];

  const activeScopes = filterScopes.filter((scope) => scope.values?.length);
  const sets: Set<string>[] = [];

  for (const scope of activeScopes) {
    const set = await resolveProductSetByDimension(scope);
    if (set.size === 0) {
      return { products: [], totalCount: 0 };
    }
    sets.push(set);
  }

  const intersectedIds = sets.length > 0 ? intersectSets(sets) : null;
  if (intersectedIds && intersectedIds.length === 0) {
    return { products: [], totalCount: 0 };
  }

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
    .eq('status', 'active');

  if (!brandScoped) {
    query = query.eq('is_public', true);
  }

  if (intersectedIds && intersectedIds.length > 0) {
    query = query.in('id', intersectedIds);
  }

  if (filters.search) {
    const term = `%${filters.search}%`;
    query = query.or(`name.ilike.${term},name_en.ilike.${term},item_code.ilike.${term}`);
  }

  if (filters.is_customizable !== undefined) {
    query = query.eq('is_customizable', filters.is_customizable);
  }

  switch (filters.sort) {
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    case 'name_desc':
      query = query.order('name', { ascending: false });
      break;
    default:
      query = query.order('sort_order', { ascending: true });
      break;
  }

  const hasPagination =
    typeof filters.page === 'number' &&
    typeof filters.pageSize === 'number' &&
    filters.page > 0 &&
    filters.pageSize > 0;

  if (hasPagination) {
    const from = (filters.page! - 1) * filters.pageSize!;
    const to = from + filters.pageSize! - 1;
    query = query.range(from, to);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const transformed = (data ?? []).map((row) =>
    transformProduct(row as unknown as Record<string, unknown>)
  );

  return {
    products: transformed,
    totalCount: count ?? transformed.length,
  };
}

export function useProducts(filters: ProductFilters): UseProductsResult {
  const normalizedFilters = useMemo<ProductFilters>(
    () => ({
      visibility: filters.visibility,
      family: filters.family,
      is_customizable: filters.is_customizable,
      sort: filters.sort,
      search: filters.search?.trim() || undefined,
      categories: normalizeList(filters.categories),
      segments: normalizeList(filters.segments),
      materials: normalizeList(filters.materials),
      industries: normalizeList(filters.industries),
      certifications: normalizeList(filters.certifications),
      tags: normalizeList(filters.tags),
      page:
        typeof filters.page === 'number' && Number.isFinite(filters.page)
          ? Math.max(1, Math.trunc(filters.page))
          : undefined,
      pageSize:
        typeof filters.pageSize === 'number' && Number.isFinite(filters.pageSize)
          ? Math.max(1, Math.trunc(filters.pageSize))
          : undefined,
    }),
    [
      filters.visibility,
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
      filters.page,
      filters.pageSize,
    ]
  );

  const query = useQuery<QueryPayload, Error>({
    queryKey: ['products', normalizedFilters],
    queryFn: () => fetchProducts(normalizedFilters),
    placeholderData: (previous) => previous,
  });

  return {
    products: query.data?.products ?? [],
    loading: query.isLoading,
    error: query.error?.message ?? null,
    totalCount: query.data?.totalCount ?? 0,
  };
}
