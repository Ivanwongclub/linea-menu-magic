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
import type { Product } from '@/features/products/types';
import { groupBy } from '@/lib/utils';

import { useProducts } from '@/features/products/hooks/useProducts';
import { useProductTaxonomy } from '@/features/products/hooks/useProductTaxonomy';
import { useProductFiltersFromURL } from '@/features/products/hooks/useProductFiltersFromURL';

// ─── Page ───────────────────────────────────────────────

export default function Products() {
  const taxonomy = useProductTaxonomy();
  const { filters, setFilters, clearFilters } = useProductFiltersFromURL();
  const { products, loading, totalCount } = useProducts(filters);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

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

  // Detect single active category for banner
  const activeCategory = useMemo(() => {
    if (filters.categories?.length === 1) {
      return taxonomy.categories.find((c) => c.slug === filters.categories![0]) ?? null;
    }
    return null;
  }, [filters.categories, taxonomy.categories]);

  const featuredProduct = products[0] ?? null;

  // Grouped products for "By Category" sort
  const groupedProducts = useMemo(() => {
    if (filters.sort !== 'category') return null;
    return groupBy(products, (p) => p.primary_category?.name ?? 'Other');
  }, [products, filters.sort]);

  // Collect all active filter labels for chip display
  const activeChips = useMemo(() => {
    const chips: { key: string; filterKey: string; label: string; value: string }[] = [];

    filters.categories?.forEach((slug) => {
      const cat = taxonomy.categories.find((c) => c.slug === slug);
      chips.push({
        key: `cat-${slug}`,
        filterKey: 'categories',
        label: cat?.name ?? slug,
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
  }, [filters, taxonomy]);

  const activeFilterCount = activeChips.length;

  const removeChip = (chip: (typeof activeChips)[0]) => {
    if (chip.filterKey === 'search') {
      setFilters({ search: undefined });
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
  };

  // Resolve first product image for banner
  const bannerImageUrl = useMemo(() => {
    if (!featuredProduct) return null;
    const primary = featuredProduct.images?.find((img) => img.is_primary) ?? featuredProduct.images?.[0];
    return primary?.url ?? featuredProduct.thumbnail_url ?? null;
  }, [featuredProduct]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* Editorial Page Header */}
        <section
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: 'hsl(var(--background))',
            borderBottom: '1px solid hsl(var(--border))',
            paddingTop: '32px',
            paddingBottom: '0',
            minHeight: '220px',
          }}
        >
          {/* Background mosaic of product images */}
          <div
            className="hidden md:grid"
            style={{
              position: 'absolute',
              inset: 0,
              gridTemplateColumns: 'repeat(8, 1fr)',
              overflow: 'hidden',
              pointerEvents: 'none',
              userSelect: 'none',
              opacity: products.length > 0 ? 1 : 0,
              transition: 'opacity 700ms ease',
            }}
          >
            {products.slice(0, 8).map((product) => {
              const imgSrc = product.thumbnail_url;
              if (!imgSrc) return <div key={product.id} />;
              return (
                <div
                  key={product.id}
                  style={{ position: 'relative', overflow: 'hidden' }}
                >
                  <img
                    src={imgSrc}
                    alt=""
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transform: 'scale(1.1)',
                      filter: 'grayscale(100%) blur(6px)',
                      opacity: 0.09,
                    }}
                  />
                </div>
              );
            })}
          </div>

          {/* Right accent: single larger image */}
          {products[0]?.thumbnail_url && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '40%',
                height: '100%',
                overflow: 'hidden',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              <img
                src={products[0].thumbnail_url}
                alt=""
                aria-hidden="true"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  transform: 'scale(1.05)',
                  filter: 'grayscale(100%)',
                  opacity: 0.10,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background:
                    'linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background)) 15%, transparent 65%)',
                }}
              />
            </div>
          )}

          {/* Bottom fade into content below */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '80px',
              pointerEvents: 'none',
              background: 'linear-gradient(to bottom, transparent, hsl(var(--background)))',
            }}
          />

          {/* Foreground content */}
          <div className="section-inner" style={{ position: 'relative', zIndex: 10 }}>
            <PageBreadcrumb
              segments={[
                { label: 'Home', href: '/' },
                { label: 'Trim Library' },
              ]}
              title=""
            />
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                marginTop: '24px',
                paddingBottom: '32px',
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 'clamp(2.5rem, 5vw, 3.75rem)',
                    fontWeight: 600,
                    letterSpacing: '-0.03em',
                    lineHeight: 1,
                    color: 'hsl(var(--foreground))',
                    margin: 0,
                  }}
                >
                  Trim Library
                </h1>
                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'hsl(var(--muted-foreground))',
                    marginTop: '12px',
                    maxWidth: '380px',
                    lineHeight: 1.6,
                  }}
                >
                  Precision-engineered trims and accessories for the world's leading fashion brands.
                </p>
              </div>
              <div
                className="hidden lg:flex"
                style={{
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    fontSize: '6rem',
                    fontWeight: 700,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                    color: 'hsl(var(--foreground))',
                    opacity: 0.07,
                    userSelect: 'none',
                    fontVariantNumeric: 'tabular-nums',
                    transform: 'translateY(12px)',
                    display: 'block',
                  }}
                >
                  {loading ? '—' : totalCount}
                </span>
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: 'hsl(var(--muted-foreground))',
                    paddingBottom: '8px',
                  }}
                >
                  Products
                </span>
              </div>
            </div>
            <div style={{ height: '2px', width: '48px', background: 'hsl(var(--foreground))' }} />
          </div>
        </section>

        {/* Industry Filter Bar */}
        <IndustryBar
          industries={taxonomy.industries}
          active={filters.industries}
          onToggle={(slug) => {
            if (slug === '__clear__') {
              setFilters({ industries: undefined });
              return;
            }
            const current = filters.industries ?? [];
            const next = current.includes(slug)
              ? current.filter((s) => s !== slug)
              : [...current, slug];
            setFilters({ industries: next.length > 0 ? next : undefined });
          }}
          loading={taxonomy.loading}
        />

        {/* Category Hero Banner */}
        <div
          className="overflow-hidden transition-all duration-[400ms] ease-out"
          style={{
            maxHeight: activeCategory ? '200px' : '0px',
            opacity: activeCategory ? 1 : 0,
          }}
        >
          <div className="relative w-full h-[200px] overflow-hidden bg-[hsl(var(--secondary))] border-b border-[hsl(var(--border))]">
            {bannerImageUrl && (
              <img
                src={bannerImageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover grayscale blur-[1px] scale-105 opacity-30"
              />
            )}
            
            <div className="relative z-10 section-inner h-full flex items-center gap-8">
              <div>
                <span className="section-label">Category</span>
                <h2 className="text-4xl font-semibold tracking-tight mt-1">
                  {activeCategory?.name}
                </h2>
              </div>
              <div className="w-[1px] h-12 bg-[hsl(var(--border))]" />
              <div className="flex flex-col gap-1">
                <span className="text-3xl font-semibold tabular-nums">
                  {products.length}
                </span>
                <span className="section-label">Products</span>
              </div>
              <p className="hidden lg:block text-sm text-[hsl(var(--muted-foreground))] max-w-xs leading-relaxed ml-auto">
                Precision-engineered {activeCategory?.name.toLowerCase()} for leading fashion and apparel brands worldwide.
              </p>
            </div>
          </div>
        </div>

        {/* Active Filter Chips */}
        <div className="px-6 lg:px-8 min-h-[44px] flex items-center">
          <div className="max-w-[1200px] mx-auto w-full">
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
          <div className="max-w-[1200px] mx-auto flex items-start gap-10">
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
                <span className="text-sm text-muted-foreground">
                  {loading ? '…' : `${totalCount} product${totalCount !== 1 ? 's' : ''}`}
                </span>

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
                    value={filters.sort ?? 'default'}
                    onValueChange={(val) =>
                      setFilters({ sort: val === 'default' ? undefined : (val as any) })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs w-[140px]">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Featured</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="name_asc">Name A–Z</SelectItem>
                      <SelectItem value="name_desc">Name Z–A</SelectItem>
                      <SelectItem value="category">By Category</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Product Grid / List */}
              {loading ? (
                <ProductGridSkeleton viewMode={viewMode} />
              ) : products.length > 0 ? (
                groupedProducts ? (
                  // Category-grouped view with dividers
                  <div className="space-y-0">
                    {Object.entries(groupedProducts).map(([catName, catProducts]) => (
                      <div key={catName}>
                        <div className="flex items-center gap-4 mb-5 mt-8 first:mt-0">
                          <span className="text-xs font-medium uppercase tracking-[0.12em] text-[hsl(var(--muted-foreground))] whitespace-nowrap">
                            {catName}
                          </span>
                          <div className="flex-1 h-[1px] bg-[hsl(var(--border))]" />
                          <span className="text-xs text-[hsl(var(--muted-foreground))] tabular-nums">
                            {catProducts.length}
                          </span>
                        </div>
                        <div className={viewMode === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5' : 'flex flex-col gap-3'}>
                          {catProducts.map((product, idx) => (
                            <Link key={product.id} to={`/products/${product.slug}`}>
                              <ProductCard
                                product={product}
                                viewMode={viewMode}
                                index={idx}
                                onQuickView={() => setQuickViewProduct(product)}
                              />
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Default flat grid with featured first card
                  <div
                    aria-label="Product catalog"
                    className={
                      viewMode === 'grid'
                        ? 'grid grid-cols-2 md:grid-cols-4 gap-5'
                        : 'flex flex-col gap-3'
                    }
                  >
                    {products.map((product, idx) => (
                      <div
                        key={product.id}
                        className={viewMode === 'grid' && idx === 0 ? 'col-span-2 row-span-1' : ''}
                      >
                        <Link to={`/products/${product.slug}`}>
                          <ProductCard
                            product={product}
                            viewMode={viewMode}
                            index={idx}
                            featured={viewMode === 'grid' && idx === 0}
                            onQuickView={() => setQuickViewProduct(product)}
                          />
                        </Link>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div role="status" className="flex flex-col items-center justify-center py-24 text-center">
                  <PackageOpen className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm font-medium text-foreground mb-1">No products found</p>
                  <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters.</p>
                  <Button variant="outline" size="sm" onClick={clearFilters}>Clear filters</Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 lg:px-8 bg-foreground text-primary-foreground overflow-hidden">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">需要定制產品？</h2>
            <p className="text-primary-foreground/70 mb-8">我們提供專業的定制服務，滿足您的獨特需求</p>
            <Link
              to="/contact"
              className="inline-block px-12 py-4 bg-background text-foreground text-xs tracking-[0.06em] uppercase rounded-[var(--radius)] border-2 border-background hover:bg-white/90 transition-all duration-200"
            >
              聯絡我們
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

// ─── Industry Bar ───────────────────────────────────────

function IndustryBar({
  industries,
  active,
  onToggle,
  loading,
}: {
  industries: { slug: string; name: string }[];
  active?: string[];
  onToggle: (slug: string) => void;
  loading: boolean;
}) {
  const noneActive = !active?.length;

  return (
    <div className="bg-[hsl(var(--background))] border-b border-[hsl(var(--border))] py-4">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-8">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => { if (!noneActive) onToggle('__clear__'); }}
            className={`shrink-0 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.08em] rounded-[var(--radius)] border transition-all duration-150 ${
              noneActive
                ? 'bg-foreground text-background border-foreground'
                : 'bg-transparent border-border text-muted-foreground hover:border-foreground hover:text-foreground'
            }`}
          >
            All
          </button>
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-24 rounded-[var(--radius)]" />
              ))
            : industries.map((ind) => {
                const isActive = active?.includes(ind.slug) ?? false;
                return (
                  <button
                    key={ind.slug}
                    onClick={() => onToggle(ind.slug)}
                    aria-pressed={isActive}
                    className={`shrink-0 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.08em] rounded-[var(--radius)] border transition-all duration-150 ${
                      isActive
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-transparent border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                    }`}
                  >
                    {ind.name}
                  </button>
                );
              })}
        </div>
      </div>
    </div>
  );
}

// ─── Loading Skeleton ───────────────────────────────────

function ProductGridSkeleton({ viewMode = 'grid' }: { viewMode?: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="flex flex-col gap-3" aria-hidden="true">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 h-20 border border-border rounded-[var(--radius)] px-3">
            <Skeleton className="h-16 w-16 rounded-[var(--radius)]" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/2 mb-1" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="border border-border rounded-[var(--radius)] overflow-hidden">
          <Skeleton className="aspect-square w-full" />
          <div className="p-3">
            <Skeleton className="h-3 w-1/3 mb-2" />
            <Skeleton className="h-4 w-3/4 mb-1" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
