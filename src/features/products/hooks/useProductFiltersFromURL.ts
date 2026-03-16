import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters } from '../types';

const PARAM_KEYS = {
  search: 'search',
  categories: 'category',
  materials: 'material',
  industries: 'industry',
  certifications: 'certification',
  tags: 'tag',
  sort: 'sort',
} as const;

function parseList(value: string | null): string[] | undefined {
  if (!value) return undefined;
  const items = value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return items.length > 0 ? items : undefined;
}

function serializeList(items: string[] | undefined): string | null {
  if (!items?.length) return null;
  return items.join(',');
}

interface UseProductFiltersFromURLResult {
  filters: ProductFilters;
  setFilters: (updates: Partial<ProductFilters>) => void;
  clearFilters: () => void;
}

export function useProductFiltersFromURL(): UseProductFiltersFromURLResult {
  const [searchParams, setSearchParams] = useSearchParams();

  const filters = useMemo<ProductFilters>(() => {
    const sort = searchParams.get(PARAM_KEYS.sort) as ProductFilters['sort'];
    return {
      search: searchParams.get(PARAM_KEYS.search) || undefined,
      categories: parseList(searchParams.get(PARAM_KEYS.categories)),
      materials: parseList(searchParams.get(PARAM_KEYS.materials)),
      industries: parseList(searchParams.get(PARAM_KEYS.industries)),
      certifications: parseList(searchParams.get(PARAM_KEYS.certifications)),
      tags: parseList(searchParams.get(PARAM_KEYS.tags)),
      sort:
        sort &&
        ['newest', 'name_asc', 'name_desc', 'category'].includes(sort)
          ? sort
          : undefined,
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (updates: Partial<ProductFilters>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);

        Object.entries(updates).forEach(([key, value]) => {
          const paramKey =
            PARAM_KEYS[key as keyof typeof PARAM_KEYS] ?? key;

          if (value === undefined || value === null) {
            next.delete(paramKey);
          } else if (Array.isArray(value)) {
            const serialized = serializeList(value);
            if (serialized) {
              next.set(paramKey, serialized);
            } else {
              next.delete(paramKey);
            }
          } else {
            next.set(paramKey, String(value));
          }
        });

        return next;
      });
    },
    [setSearchParams]
  );

  const clearFilters = useCallback(() => {
    setSearchParams({});
  }, [setSearchParams]);

  return { filters, setFilters, clearFilters };
}
