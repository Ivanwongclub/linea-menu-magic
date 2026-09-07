import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProductFilters } from '../types';

const PARAM_KEYS = {
  search: 'search',
  family: 'family',
  categories: 'category',
  segments: 'segment',
  materials: 'material',
  industries: 'industry',
  certifications: 'certification',
  tags: 'tag',
  finishes: 'finish',
  sort: 'sort',
  featured: 'featured',
  collection: 'collection',
  page: 'page',
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

/** `finish=surface:BRUSHED,base_family:NICKEL` → { surface: ['BRUSHED'], base_family: ['NICKEL'] } */
function parseFinishes(value: string | null): ProductFilters['finishes'] {
  if (!value) return undefined;
  const out: Record<string, string[]> = {};
  for (const entry of value.split(',')) {
    const [axis, code] = entry.split(':').map((s) => s.trim());
    if (!axis || !code) continue;
    (out[axis] ??= []).push(code);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function serializeFinishes(value: ProductFilters['finishes']): string | null {
  if (!value) return null;
  const entries = Object.entries(value).flatMap(([axis, codes]) => (codes ?? []).map((c) => `${axis}:${c}`));
  return entries.length > 0 ? entries.join(',') : null;
}

function parsePage(value: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  const int = Math.trunc(parsed);
  return int > 0 ? int : undefined;
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
      family: searchParams.get(PARAM_KEYS.family) || undefined,
      categories: parseList(searchParams.get(PARAM_KEYS.categories)),
      segments: parseList(searchParams.get(PARAM_KEYS.segments)),
      materials: parseList(searchParams.get(PARAM_KEYS.materials)),
      industries: parseList(searchParams.get(PARAM_KEYS.industries)),
      certifications: parseList(searchParams.get(PARAM_KEYS.certifications)),
      tags: parseList(searchParams.get(PARAM_KEYS.tags)),
      finishes: parseFinishes(searchParams.get(PARAM_KEYS.finishes)),
      sort:
        sort && ['name_asc', 'name_desc'].includes(sort)
          ? sort
          : undefined,
      featured: searchParams.get(PARAM_KEYS.featured) || undefined,
      collection: searchParams.get(PARAM_KEYS.collection) || undefined,
      page: parsePage(searchParams.get(PARAM_KEYS.page)),
    };
  }, [searchParams]);

  const setFilters = useCallback(
    (updates: Partial<ProductFilters>) => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        const updateKeys = Object.keys(updates);
        const onlyPageUpdate =
          updateKeys.length > 0 && updateKeys.every((key) => key === 'page');

        if (!onlyPageUpdate && updates.page === undefined) {
          next.delete(PARAM_KEYS.page);
        }

        Object.entries(updates).forEach(([key, value]) => {
          const paramKey =
            PARAM_KEYS[key as keyof typeof PARAM_KEYS] ?? key;

          if (value === undefined || value === null) {
            next.delete(paramKey);
          } else if (key === 'finishes') {
            const serialized = serializeFinishes(value as ProductFilters['finishes']);
            if (serialized) next.set(paramKey, serialized);
            else next.delete(paramKey);
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
