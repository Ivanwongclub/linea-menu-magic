import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import type { ProductFilters } from '@/features/products/types';
import type {
  ProductCategory,
  ProductMaterial,
  ProductIndustry,
  ProductCertification,
  ProductTag,
} from '@/features/products/types';
import {
  PRODUCT_FAMILIES,
  PRODUCT_SEGMENTS,
} from '@/features/products/taxonomy';

interface Taxonomy {
  categories: ProductCategory[];
  materials: ProductMaterial[];
  industries: ProductIndustry[];
  certifications: ProductCertification[];
  tags: ProductTag[];
}

interface Collection {
  slug: string;
  label: string;
}

interface ProductsSidebarProps {
  filters: ProductFilters;
  setFilters: (updates: Partial<ProductFilters>) => void;
  taxonomy: Taxonomy;
  productCount: number;
  categoryCounts?: Record<string, number>;
  collections?: Collection[];
  activeCollection?: string | null;
  setActiveCollection?: (slug: string | null) => void;
}

function toggleArrayFilter(
  current: string[] | undefined,
  value: string
): string[] | undefined {
  const arr = current ?? [];
  if (arr.includes(value)) {
    const next = arr.filter((v) => v !== value);
    return next.length > 0 ? next : undefined;
  }
  return [...arr, value];
}

function useDebouncedValue(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function SectionHeading({
  children,
  isFirst = false,
}: {
  children: React.ReactNode;
  isFirst?: boolean;
}) {
  return (
    <div
      className={`text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground mb-3 pt-4 ${
        isFirst ? '' : 'border-t border-border'
      }`}
    >
      {children}
    </div>
  );
}

const hasActiveFilters = (filters: ProductFilters): boolean =>
  !!(
    filters.search ||
    filters.family ||
    filters.categories?.length ||
    filters.segments?.length ||
    filters.materials?.length ||
    filters.industries?.length ||
    filters.certifications?.length ||
    filters.tags?.length
  );

export default function ProductsSidebar({
  filters,
  setFilters,
  taxonomy,
  productCount,
  categoryCounts,
  collections,
  activeCollection,
  setActiveCollection,
}: ProductsSidebarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');
  const [openFamilies, setOpenFamilies] = useState<Record<string, boolean>>({
    hardware: true,
    'soft-trims': true,
    'branding-trims': true,
  });
  const debouncedSearch = useDebouncedValue(localSearch, 300);
  const lastPushed = useRef(filters.search ?? '');

  useEffect(() => {
    if (debouncedSearch !== lastPushed.current) {
      lastPushed.current = debouncedSearch;
      setFilters({ search: debouncedSearch || undefined });
    }
  }, [debouncedSearch, setFilters]);

  useEffect(() => {
    if ((filters.search ?? '') !== localSearch && (filters.search ?? '') !== lastPushed.current) {
      setLocalSearch(filters.search ?? '');
      lastPushed.current = filters.search ?? '';
    }
  }, [filters.search]);

  const clearAll = useCallback(() => {
    setLocalSearch('');
    lastPushed.current = '';
    setFilters({
      search: undefined,
      family: undefined,
      categories: undefined,
      segments: undefined,
      materials: undefined,
      industries: undefined,
      certifications: undefined,
      tags: undefined,
    });
    setActiveCollection?.(null);
  }, [setFilters, setActiveCollection]);

  // Group categories by family for structured display
  const familyGroups = useMemo(() => {
    return PRODUCT_FAMILIES.map((family) => ({
      ...family,
      categories: taxonomy.categories.filter((cat) =>
        family.categorySlugs.includes(cat.slug)
      ),
    }));
  }, [taxonomy.categories]);

  const selectedSegment = filters.segments?.[0];
  const handleSegmentSelect = useCallback(
    (slug: string) => {
      setFilters({
        segments: selectedSegment === slug ? undefined : [slug],
      });
    },
    [selectedSegment, setFilters]
  );

  return (
    <div className="space-y-0">

      {/* Search bar — top of sidebar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name or code..."
            className="h-9 text-sm pl-8 pr-8"
          />
          {localSearch && (
            <button
              onClick={() => {
                setLocalSearch('');
                lastPushed.current = '';
                setFilters({ search: undefined });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Segments — prominent quick filter buttons */}
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground mb-2">
          Segments
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PRODUCT_SEGMENTS.map((segment) => {
            const isActive = selectedSegment === segment.slug;
            return (
              <button
                key={segment.slug}
                onClick={() => handleSegmentSelect(segment.slug)}
                className={`h-8 rounded-[var(--radius)] text-[11px] font-semibold tracking-[0.04em] border transition-colors ${
                  isActive
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-border hover:border-foreground/40'
                }`}
              >
                {segment.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Collections — no header */}
      {collections && collections.length > 0 && (
        <div className="mb-1 pb-4">
          <div className="space-y-1">
            {collections.map((col) => (
              <button
                key={col.slug}
                onClick={() =>
                  setActiveCollection?.(activeCollection === col.slug ? null : col.slug)
                }
                className={`w-full text-left text-sm px-0 py-1.5 transition-colors duration-200 flex items-center gap-2 ${
                  activeCollection === col.slug
                    ? 'text-foreground font-medium'
                    : 'text-foreground hover:text-muted-foreground'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    activeCollection === col.slug ? 'bg-foreground' : 'bg-transparent border border-border'
                  }`}
                />
                {col.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-border pt-4">
        <div className="space-y-4">
          {familyGroups.map((group) => {
            if (group.categories.length === 0) return null;
            const isActiveFamily = filters.family === group.slug;
            const isOpen = openFamilies[group.slug] ?? true;
            return (
              <div key={group.slug}>
                <div className="flex items-center justify-between mb-1.5">
                  <button
                    onClick={() =>
                      setFilters({
                        family: isActiveFamily ? undefined : group.slug,
                        categories: undefined,
                      })
                    }
                    className={`text-sm font-semibold text-left transition-colors ${
                      isActiveFamily
                        ? 'text-foreground'
                        : 'text-foreground hover:text-muted-foreground'
                    }`}
                  >
                    {group.name}
                  </button>
                  <button
                    onClick={() =>
                      setOpenFamilies((prev) => ({
                        ...prev,
                        [group.slug]: !isOpen,
                      }))
                    }
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${group.name}`}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>
                {isOpen && (
                  <div className="space-y-1.5 pl-3 border-l border-border">
                    {group.categories.map((cat) => {
                      const count = categoryCounts?.[cat.slug] ?? 0;
                      return (
                        <div key={cat.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`cat-${cat.slug}`}
                            checked={filters.categories?.includes(cat.slug) ?? false}
                            onCheckedChange={() =>
                              setFilters({ categories: toggleArrayFilter(filters.categories, cat.slug) })
                            }
                          />
                          <label
                            htmlFor={`cat-${cat.slug}`}
                            className="text-sm text-foreground cursor-pointer flex-1"
                          >
                            {cat.name}
                          </label>
                          {count > 0 && (
                            <span className="text-xs text-muted-foreground">{count}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>




      <div className="pt-6 pb-2 text-xs text-muted-foreground text-center">
        {productCount} product{productCount !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}

export { toggleArrayFilter };
