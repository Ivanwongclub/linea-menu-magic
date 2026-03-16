import { useState, useCallback, useEffect, useRef } from 'react';
import { Search, X, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import type { ProductFilters } from '@/features/products/types';
import type {
  ProductCategory,
  ProductMaterial,
  ProductIndustry,
  ProductCertification,
  ProductTag,
} from '@/features/products/types';

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
  categoryCounts?: Record<string, number>;
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
    filters.categories?.length ||
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
}: ProductsSidebarProps) {
  const [localSearch, setLocalSearch] = useState(filters.search ?? '');
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
      categories: undefined,
      materials: undefined,
      industries: undefined,
      certifications: undefined,
      tags: undefined,
    });
  }, [setFilters]);

  const sustainableMaterials = taxonomy.materials.filter((m) => m.is_sustainable);
  const standardMaterials = taxonomy.materials.filter((m) => !m.is_sustainable);

  return (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-foreground">Filters</span>
        {hasActiveFilters(filters) && (
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      <div className="relative mb-5">
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

      <FilterSection label="Category" defaultOpen isFirst>
        <div className="space-y-2">
          {taxonomy.categories.map((cat) => {
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
                  className="text-sm text-foreground cursor-pointer group-hover:text-foreground/80 flex-1"
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
      </FilterSection>

      <FilterSection label="Collection" defaultOpen>
        <div className="space-y-2">
          {taxonomy.tags.map((tag) => (
            <label key={tag.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.tags?.includes(tag.slug) ?? false}
                onCheckedChange={() =>
                  setFilters({ tags: toggleArrayFilter(filters.tags, tag.slug) })
                }
              />
              <span className="text-sm text-foreground group-hover:text-foreground/80">
                {tag.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Material" defaultOpen={false}>
        <div className="space-y-2">
          {sustainableMaterials.length > 0 && (
            <>
              <span className="text-xs italic text-muted-foreground block mb-1">Sustainable</span>
              {sustainableMaterials.map((mat) => (
                <label key={mat.id} className="flex items-center gap-2 cursor-pointer group">
                  <Checkbox
                    checked={filters.materials?.includes(mat.slug) ?? false}
                    onCheckedChange={() =>
                      setFilters({ materials: toggleArrayFilter(filters.materials, mat.slug) })
                    }
                  />
                  <span className="text-sm text-foreground group-hover:text-foreground/80">
                    {mat.name}
                  </span>
                </label>
              ))}
              <div className="h-2" />
            </>
          )}
          {standardMaterials.map((mat) => (
            <label key={mat.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.materials?.includes(mat.slug) ?? false}
                onCheckedChange={() =>
                  setFilters({ materials: toggleArrayFilter(filters.materials, mat.slug) })
                }
              />
              <span className="text-sm text-foreground group-hover:text-foreground/80">
                {mat.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Application" defaultOpen={false}>
        <div className="space-y-2">
          {taxonomy.industries.map((ind) => (
            <label key={ind.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={filters.industries?.includes(ind.slug) ?? false}
                onCheckedChange={() =>
                  setFilters({ industries: toggleArrayFilter(filters.industries, ind.slug) })
                }
              />
              <span className="text-sm text-foreground group-hover:text-foreground/80">
                {ind.name}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection label="Sustainability" defaultOpen={false}>
        <div className="space-y-2">
          {taxonomy.certifications.map((cert) => (
            <label key={cert.id} className="flex items-center gap-2 cursor-pointer group">
              <Checkbox
                checked={
                  filters.certifications?.includes(cert.abbreviation.toLowerCase()) ?? false
                }
                onCheckedChange={() =>
                  setFilters({
                    certifications: toggleArrayFilter(
                      filters.certifications,
                      cert.abbreviation.toLowerCase()
                    ),
                  })
                }
              />
              <div>
                <span className="text-sm text-foreground group-hover:text-foreground/80 block">
                  {cert.abbreviation}
                </span>
                <span className="text-xs text-muted-foreground">{cert.name}</span>
              </div>
            </label>
          ))}
        </div>
      </FilterSection>

      <div className="pt-6 pb-2 text-xs text-muted-foreground text-center">
        {productCount} product{productCount !== 1 ? 's' : ''} found
      </div>
    </div>
  );
}

function FilterSection({
  label,
  children,
  defaultOpen = true,
  isFirst = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  isFirst?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <SectionHeading isFirst={isFirst}>
        <CollapsibleTrigger className="flex items-center justify-between w-full">
          <span>{label}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </CollapsibleTrigger>
      </SectionHeading>
      <CollapsibleContent className="pb-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

export { toggleArrayFilter };
