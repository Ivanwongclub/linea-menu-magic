import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileDown, Box, Send, Palette, BookmarkPlus, Download, ShieldCheck, Factory, ArrowRight } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageBreadcrumb from '@/components/ui/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/products/ProductCard';
import Model3DViewer from '@/components/designer-studio/Model3DViewer';
import { useProduct } from '@/features/products/hooks/useProduct';
import { useProducts } from '@/features/products/hooks/useProducts';
import { getProductPlaceholderUrl, getOptimizedImageUrl } from '@/features/products/utils/productImagePlaceholder';
import type { Product, ProductImage } from '@/features/products/types';

/* ─── helpers ────────────────────────────────────────── */

function resolveProductImage(product: Product, index = 0, size = 800): string {
  const ordered = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const img = ordered[index];
  if (img?.url) return img.url;
  return getProductPlaceholderUrl(
    product.name_en ?? product.name,
    `${product.item_code}-${index}`,
    product.primary_category?.slug,
    product.primary_category?.name,
    size,
  );
}

function specValue(v: unknown): string | null {
  if (v == null || v === '') return null;
  if (Array.isArray(v)) return v.join(', ');
  return String(v);
}

/* ─── Image Gallery ──────────────────────────────────── */

function ImageGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!images.length) {
    return (
      <div className="aspect-square bg-secondary border border-border rounded-lg flex items-center justify-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="aspect-square bg-secondary rounded-lg overflow-hidden">
        <img
          src={getOptimizedImageUrl(activeImage.url, 800, 800, 85)}
          alt={activeImage.alt_text ?? 'Product image'}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="w-full h-full object-contain p-6"
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-md overflow-hidden border transition-colors duration-150 ${
                i === activeIndex ? 'border-foreground' : 'border-border hover:border-muted-foreground'
              }`}
            >
              <img
                src={getOptimizedImageUrl(img.url, 120, 120, 75)}
                alt={img.alt_text ?? `View ${i + 1}`}
                className="w-full h-full object-contain bg-secondary"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Quick Spec Row ─────────────────────────────────── */

function QuickSpec({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="flex justify-between items-baseline gap-4 py-1.5">
      <dt className="text-xs text-muted-foreground uppercase tracking-wide shrink-0">{label}</dt>
      <dd className="text-sm text-foreground text-right">{value}</dd>
    </div>
  );
}

/* ─── Section wrapper ────────────────────────────────── */

function DetailSection({ title, icon: Icon, children }: { title: string; icon?: React.ElementType; children: React.ReactNode }) {
  return (
    <section className="py-8 first:pt-0">
      <div className="flex items-center gap-2 mb-5">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* ─── Spec group grid ────────────────────────────────── */

function SpecGroup({ label, entries }: { label?: string; entries: [string, string][] }) {
  if (!entries.length) return null;
  return (
    <div className="space-y-1">
      {label && <h3 className="text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground/60 mb-2">{label}</h3>}
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5">
        {entries.map(([key, val]) => (
          <div key={key} className="flex justify-between items-baseline gap-3 py-1 border-b border-border/40">
            <dt className="text-xs text-muted-foreground uppercase tracking-wide">{key.replace(/_/g, ' ')}</dt>
            <dd className="text-sm text-foreground text-right">{val}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ─── Related products ───────────────────────────────── */

function RelatedProducts({ product }: { product: Product }) {
  const categorySlug = product.primary_category?.slug ?? product.categories?.[0]?.slug;
  const { products } = useProducts({ categories: categorySlug ? [categorySlug] : undefined });
  const related = useMemo(() => products.filter((p) => p.id !== product.id).slice(0, 6), [products, product.id]);
  if (!related.length) return null;

  return (
    <section className="mt-16 lg:mt-24">
      <div className="section-inner">
        <h2 className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground mb-6">
          Related Trims
        </h2>
        <div className="flex gap-5 overflow-x-auto pb-4 -mx-2 px-2">
          {related.map((p) => (
            <div key={p.id} className="shrink-0 w-52">
              <Link to={`/products/${p.slug}`}>
                <ProductCard product={p} viewMode="grid" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Loading skeleton ───────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="section-inner py-12">
      <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-8 lg:gap-12">
        <Skeleton className="aspect-square rounded-lg" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────── */

export default function ProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { product, loading, error } = useProduct(slug ?? '');
  const [show3D, setShow3D] = useState(false);

  const galleryImages = useMemo<ProductImage[]>(() => {
    if (!product) return [];
    return Array.from({ length: 4 }, (_, i) => ({
      id: `placeholder-${product.id}-${i}`,
      url: resolveProductImage(product, i, 800),
      sort_order: i,
      is_primary: i === 0,
      alt_text: `${product.name_en ?? product.name} — view ${i + 1}`,
    }));
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <DetailSkeleton />
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="section-inner py-24 text-center">
          <h1 className="text-xl font-semibold mb-2">Product not found</h1>
          <p className="text-sm text-muted-foreground mb-6">
            The product you're looking for doesn't exist or has been removed.
          </p>
          <Button variant="outline" asChild>
            <Link to="/products">Back to Trim Library</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const tags = product.tags ?? [];
  const certs = product.certifications ?? [];
  const industries = product.industries ?? [];
  const materials = product.materials ?? [];
  const primaryCat = product.primary_category ?? product.categories?.[0];
  const specs = product.specifications ?? {};
  const production = product.production ?? {};

  // Extract key quick-specs from specs/production objects
  const materialNames = materials.length ? materials.map((m) => m.name).join(', ') : specValue(specs.material) ?? specValue(specs.Material);
  const finish = specValue(specs.finish) ?? specValue(specs.Finish) ?? specValue(specs.plating) ?? specValue(specs.Plating) ?? specValue(specs.surface_treatment);
  const size = specValue(specs.size) ?? specValue(specs.Size) ?? specValue(specs.dimensions) ?? specValue(specs.Dimensions);
  const weight = specValue(specs.weight) ?? specValue(specs.Weight);
  const thickness = specValue(specs.thickness) ?? specValue(specs.Thickness);
  const attachment = specValue(specs.attachment) ?? specValue(specs.construction) ?? specValue(specs.Construction) ?? specValue(specs.type);
  const moq = specValue(production.moq) ?? specValue(production.MOQ) ?? specValue(production.minimum_order);
  const sampleTime = specValue(production.sampleTime) ?? specValue(production.sample_time) ?? specValue(production.sample_lead_time);
  const leadTime = specValue(production.leadTime) ?? specValue(production.lead_time) ?? specValue(production.bulk_lead_time);
  const origin = specValue(production.origin) ?? specValue(production.Origin);
  const capacity = specValue(production.capacity) ?? specValue(production.Capacity);

  // Build full spec entries for the detailed section
  const allSpecEntries: [string, string][] = Object.entries(specs)
    .map(([k, v]) => [k, specValue(v)] as [string, string | null])
    .filter((e): e is [string, string] => e[1] !== null);

  const allProductionEntries: [string, string][] = Object.entries(production)
    .map(([k, v]) => [k, specValue(v)] as [string, string | null])
    .filter((e): e is [string, string] => e[1] !== null);

  const breadcrumbSegments = [
    { label: 'Home', href: '/' },
    { label: 'Trim Library', href: '/products' },
    ...(primaryCat ? [{ label: primaryCat.name, href: `/products?category=${primaryCat.slug}` }] : []),
    { label: product.name_en ?? product.name },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-16">
        <PageBreadcrumb segments={breadcrumbSegments} title={product.name_en ?? product.name} />

        {/* ── Above the fold: two-column hero ── */}
        <div className="section-inner">
          <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-8 lg:gap-12">
            {/* LEFT — Gallery */}
            <div>
              <ImageGallery images={galleryImages} />
              {product.model_url && (
                <Button variant="ghost" size="sm" className="mt-3 gap-1.5" onClick={() => setShow3D(true)}>
                  <Box className="h-4 w-4" />
                  View 3D Model
                </Button>
              )}
            </div>

            {/* RIGHT — Decision panel */}
            <div className="space-y-5">
              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <Badge key={t.id} variant="default" className="text-[10px] uppercase tracking-[0.06em]">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Category */}
              {primaryCat && (
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">{primaryCat.name}</p>
              )}

              {/* Name */}
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                {product.name_en ?? product.name}
              </h1>

              {/* Item code */}
              {product.item_code && (
                <p className="text-xs font-mono text-muted-foreground">{product.item_code}</p>
              )}

              <Separator />

              {/* Description */}
              {(product.description_en ?? product.description) && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description_en ?? product.description}
                </p>
              )}

              {/* Quick technical snapshot */}
              <div className="bg-secondary/50 rounded-lg p-4">
                <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">Key Specifications</h3>
                <dl>
                  <QuickSpec label="Material" value={materialNames} />
                  <QuickSpec label="Finish" value={finish} />
                  <QuickSpec label="Size" value={size} />
                  <QuickSpec label="Weight" value={weight} />
                  <QuickSpec label="Thickness" value={thickness} />
                  <QuickSpec label="Attachment" value={attachment} />
                </dl>
              </div>

              {/* Production snapshot */}
              {(moq || sampleTime || leadTime) && (
                <div className="bg-secondary/50 rounded-lg p-4">
                  <h3 className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-3">Production</h3>
                  <dl>
                    <QuickSpec label="MOQ" value={moq} />
                    <QuickSpec label="Sample Lead Time" value={sampleTime} />
                    <QuickSpec label="Bulk Lead Time" value={leadTime} />
                    <QuickSpec label="Origin" value={origin} />
                  </dl>
                </div>
              )}

              {/* Certifications inline */}
              {certs.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
                  {certs.map((c) => (
                    <Tooltip key={c.id}>
                      <TooltipTrigger asChild>
                        <span className="bg-secondary border border-border text-[10px] font-medium uppercase tracking-[0.04em] px-2 py-0.5 rounded cursor-default">
                          {c.abbreviation || c.name}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent><p className="text-xs">{c.name}</p></TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              )}

              {/* Customizable indicator */}
              {product.is_customizable && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Palette className="h-3.5 w-3.5" />
                  <span>Available for customization</span>
                </div>
              )}

              {/* ── CTA Section ── */}
              <div className="border-t border-border pt-6 mt-2 space-y-2">
                {/* Primary: Request Quote */}
                <Button variant="default" size="lg" className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Request Quote
                </Button>

                {/* Secondary: Customize */}
                {product.is_customizable && (
                  <Button variant="outline" size="lg" className="w-full gap-2">
                    <Palette className="h-4 w-4" />
                    Customize This Trim
                  </Button>
                )}

                {/* Tertiary row */}
                <div className="flex gap-2 pt-1">
                  <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs">
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    Add to Library
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs">
                    <FileDown className="h-3.5 w-3.5" />
                    Spec Sheet
                  </Button>
                  {product.model_url && (
                    <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => setShow3D(true)}>
                      <Box className="h-3.5 w-3.5" />
                      3D Model
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Below the fold: structured detail sections ── */}
        <div className="section-inner mt-12 lg:mt-16">
          <Separator className="mb-8" />

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 lg:gap-16">
            {/* Left: detail content */}
            <div className="divide-y divide-border">
              {/* Technical Specifications */}
              {allSpecEntries.length > 0 && (
                <DetailSection title="Technical Specifications">
                  <SpecGroup entries={allSpecEntries} />
                </DetailSection>
              )}

              {/* Production & Ordering */}
              {allProductionEntries.length > 0 && (
                <DetailSection title="Production & Ordering" icon={Factory}>
                  <SpecGroup entries={allProductionEntries} />
                  {product.is_customizable && (
                    <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5" />
                      Custom finishes, sizes, and branding available — request a quote for details.
                    </p>
                  )}
                </DetailSection>
              )}

              {/* Compliance & Certifications */}
              {certs.length > 0 && (
                <DetailSection title="Compliance & Certifications" icon={ShieldCheck}>
                  <div className="flex flex-wrap gap-3">
                    {certs.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 bg-secondary/50 border border-border rounded-lg px-3 py-2">
                        {c.logo_url && <img src={c.logo_url} alt={c.name} className="h-5 w-5 object-contain" />}
                        <div>
                          <p className="text-xs font-medium text-foreground">{c.abbreviation || c.name}</p>
                          {c.abbreviation && <p className="text-[10px] text-muted-foreground">{c.name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Applications */}
              {industries.length > 0 && (
                <DetailSection title="Applications & Segments">
                  <div className="flex flex-wrap gap-2">
                    {industries.map((ind) => (
                      <Link
                        key={ind.id}
                        to={`/products?segment=${ind.slug}`}
                        className="group flex items-center gap-1.5 bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:border-foreground transition-colors"
                      >
                        {ind.name}
                        <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </Link>
                    ))}
                  </div>
                </DetailSection>
              )}

              {/* Downloads */}
              {product.model_url && (
                <DetailSection title="Downloads & Resources" icon={Download}>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-start">
                      <FileDown className="h-4 w-4" />
                      Download Spec Sheet (PDF)
                    </Button>
                    {product.model_url && (
                      <Button variant="outline" size="sm" className="gap-2 w-full sm:w-auto justify-start" onClick={() => setShow3D(true)}>
                        <Box className="h-4 w-4" />
                        View / Download 3D Model (OBJ)
                      </Button>
                    )}
                  </div>
                </DetailSection>
              )}
            </div>

            {/* Right sidebar: sticky action recap */}
            <aside className="hidden lg:block">
              <div className="sticky top-24 space-y-6">
                <div className="bg-secondary/30 border border-border rounded-lg p-5 space-y-4">
                  <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Quick Actions</h3>
                  <Button variant="default" size="default" className="w-full gap-2">
                    <Send className="h-4 w-4" />
                    Request Quote
                  </Button>
                  {product.is_customizable && (
                    <Button variant="outline" size="default" className="w-full gap-2">
                      <Palette className="h-4 w-4" />
                      Customize
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="w-full gap-1.5">
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    Add to Library
                  </Button>
                </div>

                {/* Materials sidebar */}
                {materials.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">Materials</h3>
                    <div className="space-y-1">
                      {materials.map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-sm py-1">
                          <span className="text-foreground">{m.name}</span>
                          {m.is_sustainable && (
                            <Badge variant="secondary" className="text-[9px]">Sustainable</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Related products */}
        <RelatedProducts product={product} />
      </main>

      <Footer />

      {/* 3D Model Dialog */}
      {product.model_url && (
        <Dialog open={show3D} onOpenChange={setShow3D}>
          <DialogContent className="max-w-3xl h-[70vh]">
            <DialogTitle>3D Model — {product.name_en ?? product.name}</DialogTitle>
            <div className="flex-1 min-h-0">
              <Model3DViewer hasModel modelUrl={product.model_url} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
