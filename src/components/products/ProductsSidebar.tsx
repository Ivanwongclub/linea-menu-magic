import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
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
import { useCatalogueTaxonomy } from '@/features/products/hooks/useCatalogueTaxonomy';
import { useI18n } from '@/features/i18n/I18nProvider';
import { localizedName } from '@/features/admin/lib/localize';
import { FinishFacetRail } from '@/components/admin/finish/FinishFacetRail';
import type { ProductFinishFacets } from '@/features/products/hooks/useProductFinishFacets';

interface Taxonomy {
  categories: ProductCategory[];
  materials: ProductMaterial[];
  industries: ProductIndustry[];
  certifications: ProductCertification[];
  tags: ProductTag[];
}

interface ProductsSidebarProps {
  filters: ProductFilters;
  setFilters: (updates: Partial<ProductFilters>) => void;
  taxonomy: Taxonomy;
  productCount: number;
  /** Finish facets (M4 Step 4); rail shown only while the scope has metal products or a selection is active. */
  finishFacets?: ProductFinishFacets;
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

const NEWS_BADGES: Array<{
  key: 'all' | 'company' | 'product' | 'quality' | 'operations';
  label: string;
  featured?: boolean;
}> = [
  { key: 'all', label: 'All News', featured: true },
  { key: 'product', label: 'Products' },
  { key: 'company', label: 'Company' },
  { key: 'quality', label: 'Quality' },
  { key: 'operations', label: 'Operations' },
];

export default function ProductsSidebar({
  filters,
  setFilters,
  taxonomy,
  productCount,
  finishFacets,
}: ProductsSidebarProps) {
  const { t, language } = useI18n();
  const catalogue = useCatalogueTaxonomy();
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');
  // Families default open; only an explicit collapse is remembered.
  const [openFamilies, setOpenFamilies] = useState<Record<string, boolean>>({});
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
  }, [setFilters]);

  // Families and their categories from the database taxonomy — only those
  // with published products; counts are real published counts.
  const familyGroups = useMemo(
    () =>
      catalogue.familiesWithProducts.map((family) => ({
        slug: family.slug,
        name: localizedName(family, language),
        categories: family.categories.map((cat) => ({ ...cat, label: localizedName(cat, language) })),
      })),
    [catalogue.familiesWithProducts, language],
  );
  // A filter with one option is dead UI: show segments only once a second one has families.
  const showSegments = catalogue.segments.length > 1;

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

      {/* Segments — prominent quick filter buttons (hidden while only one segment has families) */}
      {showSegments && (
      <div className="mb-4" data-testid="segments-block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground mb-2">
          Segments
        </p>
        <div className="grid grid-cols-3 gap-2">
          {catalogue.segments.map((segment) => {
            const isActive = selectedSegment === segment;
            return (
              <button
                key={segment}
                onClick={() => handleSegmentSelect(segment)}
                className={`h-8 rounded-[var(--radius)] text-[11px] font-semibold tracking-[0.04em] border transition-colors ${
                  isActive
                    ? 'bg-foreground text-background border-foreground'
                    : 'bg-background text-foreground border-border hover:border-foreground/40'
                }`}
              >
                {t(`catalogue.segment.${segment}`)}
              </button>
            );
          })}
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
                      const count = cat.product_count;
                      return (
                        <div key={cat.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`cat-${cat.slug}`}
                            checked={filters.categories?.includes(cat.slug) ?? false}
                            onCheckedChange={() =>
                              setFilters({
                                categories: toggleArrayFilter(filters.categories, cat.slug),
                                // a category narrows within its family; ticking one
                                // elsewhere releases the family rather than yielding nothing
                                ...(filters.family && filters.family !== group.slug ? { family: undefined } : {}),
                              })
                            }
                          />
                          <label
                            htmlFor={`cat-${cat.slug}`}
                            className="text-sm text-foreground cursor-pointer flex-1"
                          >
                            {cat.label}
                          </label>
                          <span className="text-xs text-muted-foreground" data-testid={`cat-count-${cat.slug}`}>{count}</span>
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




      {finishFacets?.showRail && (
        <div className="border-t border-border pt-4 mt-4" data-testid="finish-facets">
          <FinishFacetRail
            axes={finishFacets.axes}
            selected={finishFacets.selected}
            onToggle={finishFacets.toggle}
            onClear={finishFacets.clear}
            countFor={finishFacets.countFor}
            className="w-full"
          />
        </div>
      )}

      <div className="pt-6 pb-2 text-xs text-muted-foreground text-center">
        {productCount} product{productCount !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}

export { toggleArrayFilter };
