import { useState, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileDown, Box, Send, Palette, BookmarkPlus, Download,
  ShieldCheck, Factory, ArrowRight, Layers, ClipboardList,
  Package, Cpu, Globe, ChevronRight,
} from 'lucide-react';
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

/* ─── Section nav items ─────────────────────────────── */

const SECTION_IDS = {
  overview: 'pdp-overview',
  specs: 'pdp-specs',
  production: 'pdp-production',
  compliance: 'pdp-compliance',
  applications: 'pdp-applications',
  downloads: 'pdp-downloads',
  related: 'pdp-related',
} as const;

/* ─── Hero Gallery ───────────────────────────────────── */

function HeroGallery({ images, onOpen3D, has3D }: { images: ProductImage[]; onOpen3D: () => void; has3D: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!images.length) {
    return (
      <div className="aspect-[4/5] bg-secondary flex items-center justify-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">No image</span>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      {/* Thumbnail rail — vertical on desktop */}
      {images.length > 1 && (
        <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`w-16 h-16 overflow-hidden transition-all duration-200 ${
                i === activeIndex
                  ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background'
                  : 'opacity-60 hover:opacity-100'
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
          {has3D && (
            <button
              onClick={onOpen3D}
              className="w-16 h-16 flex flex-col items-center justify-center gap-1 bg-secondary text-muted-foreground hover:text-foreground transition-colors"
            >
              <Box className="h-4 w-4" />
              <span className="text-[8px] uppercase tracking-wider font-medium">3D</span>
            </button>
          )}
        </div>
      )}

      {/* Main image */}
      <div className="flex-1">
        <div className="aspect-[4/5] bg-secondary overflow-hidden relative group">
          <img
            src={getOptimizedImageUrl(activeImage.url, 800, 1000, 90)}
            alt={activeImage.alt_text ?? 'Product image'}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-contain p-8 transition-transform duration-500 group-hover:scale-[1.03]"
          />
        </div>
        {/* Horizontal thumbs on mobile */}
        {images.length > 1 && (
          <div className="flex md:hidden gap-2 mt-3 overflow-x-auto pb-1">
            {images.map((img, i) => (
              <button
                key={img.id}
                onClick={() => setActiveIndex(i)}
                className={`shrink-0 w-14 h-14 overflow-hidden transition-all duration-200 ${
                  i === activeIndex ? 'ring-2 ring-foreground' : 'opacity-60'
                }`}
              >
                <img
                  src={getOptimizedImageUrl(img.url, 100, 100, 70)}
                  alt={img.alt_text ?? `View ${i + 1}`}
                  className="w-full h-full object-contain bg-secondary"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Spec line ──────────────────────────────────────── */

function SpecLine({ label, value, icon: Icon }: { label: string; value: string | null | undefined; icon?: React.ElementType }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/30 last:border-b-0">
      {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />}
      <div className="flex-1 flex justify-between items-baseline gap-3 min-w-0">
        <dt className="text-[11px] text-muted-foreground uppercase tracking-[0.08em] shrink-0">{label}</dt>
        <dd className="text-[13px] font-medium text-foreground text-right truncate">{value}</dd>
      </div>
    </div>
  );
}

/* ─── Section heading ────────────────────────────────── */

function SectionHeading({ id, title, icon: Icon }: { id: string; title: string; icon: React.ElementType }) {
  return (
    <div id={id} className="flex items-center gap-3 pt-2 mb-6 scroll-mt-24">
      <div className="w-8 h-8 bg-foreground/5 flex items-center justify-center">
        <Icon className="h-4 w-4 text-foreground" />
      </div>
      <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-foreground">{title}</h2>
    </div>
  );
}

/* ─── Section nav bar ────────────────────────────────── */

function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="border-y border-border bg-background/95 backdrop-blur-sm sticky top-[72px] z-20">
      <div className="section-inner">
        <div className="flex gap-0 overflow-x-auto scrollbar-hide">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id)}
              className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground whitespace-nowrap transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-foreground after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200 after:origin-left"
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ─── Related products ───────────────────────────────── */

function RelatedProducts({ product }: { product: Product }) {
  const categorySlug = product.primary_category?.slug ?? product.categories?.[0]?.slug;
  const { products } = useProducts({ categories: categorySlug ? [categorySlug] : undefined });
  const related = useMemo(() => products.filter((p) => p.id !== product.id).slice(0, 6), [products, product.id]);
  if (!related.length) return null;

  return (
    <section id={SECTION_IDS.related} className="scroll-mt-24 py-16 bg-secondary/30">
      <div className="section-inner">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground/5 flex items-center justify-center">
              <Layers className="h-4 w-4 text-foreground" />
            </div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.1em] text-foreground">Related Trims</h2>
          </div>
          {categorySlug && (
            <Link
              to={`/products?category=${categorySlug}`}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {related.map((p) => (
            <Link key={p.id} to={`/products/${p.slug}`}>
              <ProductCard product={p} viewMode="grid" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Loading skeleton ───────────────────────────────── */

function DetailSkeleton() {
  return (
    <div className="section-inner py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <Skeleton className="aspect-[4/5]" />
        <div className="space-y-6">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */

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

  /* ── data extraction ── */
  const tags = product.tags ?? [];
  const certs = product.certifications ?? [];
  const industries = product.industries ?? [];
  const materials = product.materials ?? [];
  const primaryCat = product.primary_category ?? product.categories?.[0];
  const specs = product.specifications ?? {};
  const production = product.production ?? {};

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

  const hasDownloads = !!product.model_url;

  /* ── build section nav ── */
  const navSections = [
    { id: SECTION_IDS.overview, label: 'Overview' },
    ...(allSpecEntries.length > 0 ? [{ id: SECTION_IDS.specs, label: 'Specifications' }] : []),
    ...(allProductionEntries.length > 0 ? [{ id: SECTION_IDS.production, label: 'Production' }] : []),
    ...(certs.length > 0 ? [{ id: SECTION_IDS.compliance, label: 'Compliance' }] : []),
    ...(industries.length > 0 ? [{ id: SECTION_IDS.applications, label: 'Applications' }] : []),
    ...(hasDownloads ? [{ id: SECTION_IDS.downloads, label: 'Downloads' }] : []),
    { id: SECTION_IDS.related, label: 'Related' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <PageBreadcrumb segments={breadcrumbSegments} title={product.name_en ?? product.name} />

        {/* ════════════════════════════════════════════════
            HERO — Above the fold
           ════════════════════════════════════════════════ */}
        <section className="section-inner py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">

            {/* LEFT — Media */}
            <HeroGallery
              images={galleryImages}
              onOpen3D={() => setShow3D(true)}
              has3D={!!product.model_url}
            />

            {/* RIGHT — Decision panel */}
            <div className="flex flex-col border border-border bg-card">

              {/* ── Identity block ── */}
              <div className="px-6 pt-6 pb-5 border-b border-border/50">
                <div className="space-y-3">
                  {primaryCat && (
                    <Link
                      to={`/products?category=${primaryCat.slug}`}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {primaryCat.name}
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                  <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight text-foreground leading-tight">
                    {product.name_en ?? product.name}
                  </h1>
                  <div className="flex items-center gap-3 flex-wrap">
                    {product.item_code && (
                      <span className="text-xs font-mono text-muted-foreground bg-secondary px-2 py-0.5">
                        {product.item_code}
                      </span>
                    )}
                    {tags.map((t) => (
                      <Badge key={t.id} variant="default" className="text-[10px] uppercase tracking-[0.06em]">
                        {t.name}
                      </Badge>
                    ))}
                    {product.is_customizable && (
                      <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.06em] gap-1">
                        <Palette className="h-3 w-3" /> Customizable
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Description ── */}
              {(product.description_en ?? product.description) && (
                <div className="px-6 py-4 border-b border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description_en ?? product.description}
                  </p>
                </div>
              )}

              {/* ── Key Specs ── */}
              <div className="px-6 py-4 border-b border-border/50">
                <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                  Key Specifications
                </h3>
                <dl className="space-y-0">
                  <SpecLine label="Material" value={materialNames} />
                  <SpecLine label="Finish / Plating" value={finish} />
                  <SpecLine label="Size / Dimensions" value={size} />
                  <SpecLine label="Weight" value={weight} />
                  <SpecLine label="Thickness" value={thickness} />
                  <SpecLine label="Attachment" value={attachment} />
                  {industries.length > 0 && (
                    <SpecLine label="Applications" value={industries.map(i => i.name).join(', ')} />
                  )}
                </dl>
              </div>

              {/* ── Production snapshot ── */}
              {(moq || sampleTime || leadTime || origin) && (
                <div className="px-6 py-4 border-b border-border/50">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-3">
                    Production & Lead Times
                  </h3>
                  <dl className="space-y-0">
                    <SpecLine label="MOQ" value={moq} icon={Package} />
                    <SpecLine label="Sample Time" value={sampleTime} />
                    <SpecLine label="Bulk Lead Time" value={leadTime} />
                    <SpecLine label="Origin" value={origin} icon={Globe} />
                    <SpecLine label="Capacity" value={capacity} />
                  </dl>
                </div>
              )}

              {/* ── Compliance inline ── */}
              {certs.length > 0 && (
                <div className="px-6 py-4 border-b border-border/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {certs.map((c) => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground border border-border px-2 py-0.5 cursor-default hover:text-foreground hover:border-foreground transition-colors">
                            {c.abbreviation || c.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent><p className="text-xs">{c.name}</p></TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* ── CTA Block ── */}
              <div className="px-6 py-5 mt-auto space-y-3 bg-secondary/20">
                <Button variant="default" size="lg" className="w-full gap-2 h-12 text-sm font-semibold tracking-wide">
                  <Send className="h-4 w-4" />
                  Request Quote
                </Button>

                {product.is_customizable && (
                  <Button variant="outline" size="lg" className="w-full gap-2 h-11 text-sm">
                    <Palette className="h-4 w-4" />
                    Customize This Trim
                  </Button>
                )}

                <div className={`grid gap-2 pt-1 ${product.model_url ? 'grid-cols-3' : 'grid-cols-2'}`}>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9">
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    Add to My Library
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9">
                    <FileDown className="h-3.5 w-3.5" />
                    Download Spec Sheet
                  </Button>
                  {product.model_url && (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" onClick={() => setShow3D(true)}>
                      <Box className="h-3.5 w-3.5" />
                      View 3D Model
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════
            SECTION NAVIGATION
           ════════════════════════════════════════════════ */}
        <SectionNav sections={navSections} />

        {/* ════════════════════════════════════════════════
            BELOW THE FOLD — Detailed sections
           ════════════════════════════════════════════════ */}
        <div className="section-inner py-12 lg:py-16">

          {/* ── Overview ── */}
          <section id={SECTION_IDS.overview} className="scroll-mt-24 mb-16">
            <SectionHeading id="" title="Overview" icon={ClipboardList} />
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
              <div className="space-y-4">
                {(product.description_en ?? product.description) && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {product.description_en ?? product.description}
                  </p>
                )}
                {/* Overview spec summary table */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                  {[
                    { l: 'Material', v: materialNames },
                    { l: 'Finish', v: finish },
                    { l: 'Size', v: size },
                    { l: 'Weight', v: weight },
                    { l: 'MOQ', v: moq },
                    { l: 'Lead Time', v: leadTime },
                  ].filter(item => item.v).map(item => (
                    <div key={item.l} className="bg-secondary/50 p-3">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-1">{item.l}</p>
                      <p className="text-sm font-medium text-foreground">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Materials sidebar */}
              {materials.length > 0 && (
                <div className="border border-border p-5">
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground mb-4">Materials</h3>
                  <div className="space-y-2.5">
                    {materials.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-b-0">
                        <span className="text-sm text-foreground">{m.name}</span>
                        {m.is_sustainable && (
                          <Badge variant="secondary" className="text-[9px]">Eco</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ── Technical Specifications ── */}
          {allSpecEntries.length > 0 && (
            <section id={SECTION_IDS.specs} className="scroll-mt-24 mb-16">
              <SectionHeading id="" title="Technical Specifications" icon={Cpu} />
              <div className="border border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {allSpecEntries.map(([key, val], idx) => (
                    <div
                      key={key}
                      className={`flex justify-between items-baseline gap-4 px-4 py-3 ${
                        idx < allSpecEntries.length - (allSpecEntries.length % 2 === 0 ? 2 : 1) ? 'border-b border-border/40' : ''
                      } ${idx % 2 === 0 && allSpecEntries.length > 1 ? 'sm:border-r sm:border-border/40' : ''}`}
                    >
                      <dt className="text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">{val}</dd>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── Production & Ordering ── */}
          {allProductionEntries.length > 0 && (
            <section id={SECTION_IDS.production} className="scroll-mt-24 mb-16">
              <SectionHeading id="" title="Production & Ordering" icon={Factory} />
              <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
                <div className="border border-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {allProductionEntries.map(([key, val], idx) => (
                      <div
                        key={key}
                        className={`flex justify-between items-baseline gap-4 px-4 py-3 ${
                          idx < allProductionEntries.length - (allProductionEntries.length % 2 === 0 ? 2 : 1) ? 'border-b border-border/40' : ''
                        } ${idx % 2 === 0 && allProductionEntries.length > 1 ? 'sm:border-r sm:border-border/40' : ''}`}
                      >
                        <dt className="text-[11px] text-muted-foreground uppercase tracking-[0.08em]">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-[13px] font-medium text-foreground text-right">{val}</dd>
                      </div>
                    ))}
                  </div>
                </div>
                {product.is_customizable && (
                  <div className="bg-foreground text-primary-foreground p-6 flex flex-col justify-between">
                    <div>
                      <Palette className="h-5 w-5 mb-3 opacity-60" />
                      <h4 className="text-xs font-semibold uppercase tracking-[0.1em] mb-2">Customization Available</h4>
                      <p className="text-xs opacity-70 leading-relaxed">
                        Custom finishes, sizes, colors, and branding options available. Contact us for a tailored specification.
                      </p>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-4 gap-1.5 w-full"
                    >
                      <Send className="h-3.5 w-3.5" />
                      Request Custom Quote
                    </Button>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Compliance & Certifications ── */}
          {certs.length > 0 && (
            <section id={SECTION_IDS.compliance} className="scroll-mt-24 mb-16">
              <SectionHeading id="" title="Compliance & Certifications" icon={ShieldCheck} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {certs.map((c) => (
                  <div key={c.id} className="border border-border p-4 flex items-start gap-3">
                    {c.logo_url ? (
                      <img src={c.logo_url} alt={c.name} className="h-8 w-8 object-contain shrink-0 mt-0.5" />
                    ) : (
                      <ShieldCheck className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{c.abbreviation || c.name}</p>
                      {c.abbreviation && <p className="text-xs text-muted-foreground mt-0.5">{c.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Applications & Segments ── */}
          {industries.length > 0 && (
            <section id={SECTION_IDS.applications} className="scroll-mt-24 mb-16">
              <SectionHeading id="" title="Applications & End Uses" icon={Layers} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {industries.map((ind) => (
                  <Link
                    key={ind.id}
                    to={`/products?segment=${ind.slug}`}
                    className="group flex items-center justify-between border border-border p-4 hover:border-foreground hover:bg-secondary/30 transition-all duration-200"
                  >
                    <span className="text-sm font-medium text-foreground">{ind.name}</span>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── Downloads & Resources ── */}
          {hasDownloads && (
            <section id={SECTION_IDS.downloads} className="scroll-mt-24 mb-16">
              <SectionHeading id="" title="Downloads & Resources" icon={Download} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="border border-border p-5 text-left hover:border-foreground hover:bg-secondary/30 transition-all duration-200 group">
                  <FileDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-3 transition-colors" />
                  <p className="text-sm font-medium text-foreground">Spec Sheet</p>
                  <p className="text-xs text-muted-foreground mt-1">Technical specification PDF</p>
                </button>
                {product.model_url && (
                  <button
                    onClick={() => setShow3D(true)}
                    className="border border-border p-5 text-left hover:border-foreground hover:bg-secondary/30 transition-all duration-200 group"
                  >
                    <Box className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-3 transition-colors" />
                    <p className="text-sm font-medium text-foreground">3D Model</p>
                    <p className="text-xs text-muted-foreground mt-1">View or download OBJ file</p>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Related Trims ── */}
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
