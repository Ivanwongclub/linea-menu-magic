import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { SlidersHorizontal, X, LayoutGrid, List, PackageOpen } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageBreadcrumb from '@/components/ui/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import ProductsSidebar from '@/components/products/ProductsSidebar';
import ProductCard from '@/components/products/ProductCard';
import type { ViewMode } from '@/components/products/ProductCard';
import type { Product, ProductFilters } from '@/features/products/types';
import { PRODUCT_FAMILIES } from '@/features/products/taxonomy';

import { useProducts } from '@/features/products/hooks/useProducts';
import { useProductTaxonomy } from '@/features/products/hooks/useProductTaxonomy';
import { useProductFiltersFromURL } from '@/features/products/hooks/useProductFiltersFromURL';

// ─── Curated Browse Data (seeded, CMS-ready) ────────────

const FEATURED_OPTIONS = [
  { value: 'all', label: 'All Products' },
  { value: 'new-arrivals', label: 'New Arrivals' },
  { value: 'best-sellers', label: 'Best Sellers' },
  { value: 'sustainable-picks', label: 'Sustainable Picks' },
  { value: 'logo-ready', label: 'Logo-Ready' },
];

const COLLECTIONS = [
  { slug: 'ss-2026', label: 'Spring Summer 2026' },
  { slug: 'denim-hardware', label: 'Denim Hardware Edit' },
  { slug: 'beauty-packaging', label: 'Beauty Packaging Details' },
  { slug: 'signature-branding', label: 'Signature Branding Trims' },
];

// ─── Featured filtering logic (temporary front-end mapping) ─
function matchesFeatured(product: Product, featured: string): boolean {
  switch (featured) {
    case 'all':
      return true;
    case 'new-arrivals':
      return product.tags?.some((t) => t.slug === 'new-item') ?? false;
    case 'best-sellers':
      return product.tags?.some((t) => t.slug === 'best-seller') ?? false;
    case 'sustainable-picks':
      return product.materials?.some((m) => m.is_sustainable) ?? false;
    case 'logo-ready':
      return product.is_customizable === true;
    default:
      return true;
  }
}

// ─── Collection filtering logic (temporary front-end mapping) ─
function matchesCollection(product: Product, collection: string): boolean {
  switch (collection) {
    case 'ss-2026':
      return product.tags?.some((t) => t.slug === 'seasonal') ?? false;
    case 'denim-hardware':
      return product.categories?.some((c) =>
        ['jeans-buttons', 'rivets', 'eyelets', 'hook-eyes'].includes(c.slug)
      ) ?? false;
    case 'beauty-packaging':
      return product.categories?.some((c) =>
        ['beads', 'cord-ends', 'cord-stoppers', 'toggles'].includes(c.slug)
      ) ?? false;
    case 'signature-branding':
      // Badges and patches only — webbing removed (it's a soft trim, not branding)
      return product.categories?.some((c) =>
        ['badges', 'patches'].includes(c.slug)
      ) ?? false;
    default:
      return true;
  }
}

// ─── Page ───────────────────────────────────────────────

export default function Products() {
  const taxonomy = useProductTaxonomy();
  const { filters, setFilters, clearFilters } = useProductFiltersFromURL();
  const { products: allProducts, loading } = useProducts(filters);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Derive featured/collection from URL state
  const activeFeatured = filters.featured ?? 'all';
  const activeCollection = filters.collection ?? null;

  const setActiveFeatured = (value: string) => {
    setFilters({ featured: value === 'all' ? undefined : value });
  };
  const setActiveCollection = (slug: string | null) => {
    setFilters({ collection: slug ?? undefined });
  };

  // Apply Featured + Collection filtering on top of backend/sidebar results
  const products = useMemo(() => {
    let result = allProducts;
    if (activeFeatured !== 'all') {
      result = result.filter((p) => matchesFeatured(p, activeFeatured));
    }
    if (activeCollection) {
      result = result.filter((p) => matchesCollection(p, activeCollection));
    }
    return result;
  }, [allProducts, activeFeatured, activeCollection]);

  const totalCount = products.length;

  // Count products per category (from current result set)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      p.categories?.forEach((c) => {
        counts[c.slug] = (counts[c.slug] ?? 0) + 1;
      });
    });
    return counts;
  }, [products]);

  // Collect all active filter/browse labels for chip display
  const activeChips = useMemo(() => {
    const chips: { key: string; filterKey: string; label: string; value: string }[] = [];

    // Browse controls as chips
    if (activeFeatured !== 'all') {
      const opt = FEATURED_OPTIONS.find((o) => o.value === activeFeatured);
      chips.push({
        key: `featured-${activeFeatured}`,
        filterKey: 'featured',
        label: opt?.label ?? activeFeatured,
        value: activeFeatured,
      });
    }

    if (activeCollection) {
      const col = COLLECTIONS.find((c) => c.slug === activeCollection);
      chips.push({
        key: `collection-${activeCollection}`,
        filterKey: 'collection',
        label: col?.label ?? activeCollection,
        value: activeCollection,
      });
    }

    // Sidebar filters as chips
    if (filters.family) {
      const fam = PRODUCT_FAMILIES.find((f) => f.slug === filters.family);
      chips.push({
        key: `fam-${filters.family}`,
        filterKey: 'family',
        label: fam?.name ?? filters.family,
        value: filters.family,
      });
    }

    filters.categories?.forEach((slug) => {
      const cat = taxonomy.categories.find((c) => c.slug === slug);
      chips.push({
        key: `cat-${slug}`,
        filterKey: 'categories',
        label: cat?.name ?? slug,
        value: slug,
      });
    });

    filters.segments?.forEach((slug) => {
      chips.push({
        key: `seg-${slug}`,
        filterKey: 'segments',
        label: slug,
        value: slug,
      });
    });

    filters.tags?.forEach((slug) => {
      const tag = taxonomy.tags.find((t) => t.slug === slug);
      chips.push({
        key: `tag-${slug}`,
        filterKey: 'tags',
        label: tag?.name ?? slug,
        value: slug,
      });
    });

    filters.materials?.forEach((slug) => {
      const mat = taxonomy.materials.find((m) => m.slug === slug);
      chips.push({
        key: `mat-${slug}`,
        filterKey: 'materials',
        label: mat?.name ?? slug,
        value: slug,
      });
    });

    filters.industries?.forEach((slug) => {
      const ind = taxonomy.industries.find((i) => i.slug === slug);
      chips.push({
        key: `ind-${slug}`,
        filterKey: 'industries',
        label: ind?.name ?? slug,
        value: slug,
      });
    });

    filters.certifications?.forEach((abbr) => {
      const cert = taxonomy.certifications.find(
        (c) => c.abbreviation.toLowerCase() === abbr
      );
      chips.push({
        key: `cert-${abbr}`,
        filterKey: 'certifications',
        label: cert?.abbreviation ?? abbr,
        value: abbr,
      });
    });

    if (filters.search) {
      chips.push({
        key: 'search',
        filterKey: 'search',
        label: `"${filters.search}"`,
        value: filters.search,
      });
    }

    return chips;
  }, [filters, taxonomy, activeFeatured, activeCollection]);

  const activeFilterCount = activeChips.length;

  const removeChip = (chip: (typeof activeChips)[0]) => {
    if (chip.filterKey === 'featured') {
      setActiveFeatured('all');
      return;
    }
    if (chip.filterKey === 'collection') {
      setActiveCollection(null);
      return;
    }
    if (chip.filterKey === 'search' || chip.filterKey === 'family') {
      setFilters({ [chip.filterKey]: undefined });
      return;
    }
    const key = chip.filterKey as keyof typeof filters;
    const current = (filters[key] as string[] | undefined) ?? [];
    const next = current.filter((v) => v !== chip.value);
    setFilters({ [key]: next.length > 0 ? next : undefined });
  };

  const sidebarProps = {
    filters,
    setFilters,
    taxonomy,
    productCount: totalCount,
    categoryCounts,
    collections: COLLECTIONS,
    activeCollection,
    setActiveCollection,
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Breadcrumb */}
        <PageBreadcrumb
          segments={[
            { label: 'Home', href: '/' },
            { label: 'Products' },
          ]}
        />




        {/* Active chips */}
        <div className="px-6 lg:px-8 min-h-[44px] flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            {activeChips.length > 0 ? (
              <div className="flex flex-wrap gap-2 items-center py-2">
                {activeChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 bg-secondary border border-border text-xs font-medium px-3 py-1 rounded-[var(--radius)] animate-fade-in"
                  >
                    {chip.label}
                    <button onClick={() => removeChip(chip)}>
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </span>
                ))}
                {activeChips.length >= 2 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors ml-1"
                  >
                    Clear all
                  </button>
                )}
              </div>
            ) : (
              <span className="invisible">&#8203;</span>
            )}
          </div>
        </div>

        {/* Body: Sidebar + Grid */}
        <section className="px-6 lg:px-8 pb-24">
          <div className="max-w-7xl mx-auto flex items-start gap-10">
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex lg:flex-col w-[240px] flex-shrink-0 sticky top-[80px] self-start max-h-[calc(100vh-96px)] overflow-y-auto overscroll-contain scrollbar-hide pb-8">
              <ProductsSidebar {...sidebarProps} />
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              {/* Mobile filter trigger */}
              <div className="lg:hidden mb-6">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-[var(--radius)] border-border text-xs tracking-wider uppercase gap-2"
                    >
                      <SlidersHorizontal className="h-3.5 w-3.5" />
                      Filters
                      {activeFilterCount > 0 && (
                        <span className="ml-1 bg-foreground text-background text-[10px] h-4 w-4 rounded-full inline-flex items-center justify-center">
                          {activeFilterCount}
                        </span>
                      )}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 bg-background p-0 flex flex-col">
                    <SheetTitle className="sr-only">Filters</SheetTitle>
                    <div className="flex-1 overflow-y-auto overscroll-contain p-6 pb-24">
                      <ProductsSidebar {...sidebarProps} />
                    </div>
                  </SheetContent>
                </Sheet>
              </div>

              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    {loading ? '…' : `${totalCount} product${totalCount !== 1 ? 's' : ''}`}
                  </span>
                  <span className="text-border">|</span>
                  <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
                    {FEATURED_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setActiveFeatured(opt.value)}
                        className={`whitespace-nowrap text-[11px] px-2.5 py-1 rounded-none border transition-all duration-200 ${
                          activeFeatured === opt.value
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background text-foreground border-border hover:border-foreground/40'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1 transition-colors ${viewMode === 'grid' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-label="Grid view"
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1 transition-colors ${viewMode === 'list' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                      aria-label="List view"
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>
                  <span className="text-border">|</span>
                  <Select
                    value={filters.sort ?? ''}
                    onValueChange={(v) => setFilters({ sort: (v || undefined) as ProductFilters['sort'] })}
                  >
                    <SelectTrigger className="h-7 text-xs w-[120px] border-border">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name_asc">Name A–Z</SelectItem>
                      <SelectItem value="name_desc">Name Z–A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Grid / List */}
              {loading ? (
                <ProductGridSkeleton viewMode={viewMode} />
              ) : products.length > 0 ? (
                <div
                  aria-label="Product catalog"
                  className={
                    viewMode === 'grid'
                      ? 'grid grid-cols-2 md:grid-cols-4 gap-5 auto-rows-[1fr]'
                      : 'flex flex-col gap-3'
                  }
                >
                  {products.map((product, idx) => (
                    <div
                      key={product.id}
                      className={`${viewMode === 'grid' && idx === 0 ? 'col-span-2 row-span-2' : ''}`}
                    >
                      <Link to={`/products/${product.slug}`} className={viewMode === 'grid' && idx === 0 ? 'block h-full' : ''}>
                        <ProductCard
                          product={product}
                          viewMode={viewMode}
                          index={idx}
                          isHeroLayout={viewMode === 'grid' && idx === 0}
                          onQuickView={() => setQuickViewProduct(product)}
                        />
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div role="status" className="flex flex-col items-center justify-center py-24 text-center">
                  <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium text-foreground mb-1">No products found</p>
                  <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or browse selection.</p>
                  <div className="flex gap-2">
                    {(activeFeatured !== 'all' || activeCollection !== null) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveFeatured('all');
                          setActiveCollection(null);
                        }}
                      >
                        Reset browse
                      </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Need Custom Products?</h2>
            <p className="text-primary-foreground/70 mb-8 max-w-2xl">We offer professional customisation services tailored to your unique requirements.</p>
            <Link
              to="/contact"
              className="inline-block px-12 py-4 bg-background text-foreground text-xs tracking-[0.06em] uppercase rounded-none border-2 border-background hover:bg-white/90 transition-all duration-200"
            >
              Contact Us
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────

function ProductGridSkeleton({ viewMode = 'grid' }: { viewMode?: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className={i === 0 ? 'col-span-2 row-span-1' : ''}>
          <div className="space-y-3">
            <Skeleton className={`w-full ${i === 0 ? 'aspect-[2/1]' : 'aspect-square'}`} />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
