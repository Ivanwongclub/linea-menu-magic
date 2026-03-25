import { useState, useMemo } from 'react';
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
import { getPdpSeed } from '@/features/products/pdpSeedData';
import { getPdpSeedImages } from '@/features/products/pdpSeedImages';

/* ─── helpers ────────────────────────────────────────── */

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
                className="w-full h-full object-cover"
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
        <div className="aspect-[4/5] overflow-hidden relative group bg-secondary/30">
          <img
            src={getOptimizedImageUrl(activeImage.url, 800, 1000, 90)}
            alt={activeImage.alt_text ?? 'Product image'}
            loading="eager"
            fetchPriority="high"
            decoding="async"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
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
                  className="w-full h-full object-cover"
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

/* ─── Compact spec tile ──────────────────────────────── */

function SpecTile({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="py-2">
      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.1em] mb-0.5">{label}</p>
      <p className="text-[13px] font-medium text-foreground leading-snug">{value}</p>
    </div>
  );
}

/* ─── Section heading ────────────────────────────────── */

function SectionHeading({ id, title, icon: Icon }: { id: string; title: string; icon: React.ElementType }) {
  return (
    <div id={id} className="flex items-center gap-3 pt-2 mb-6 scroll-mt-24">
      <div className="w-8 h-8 bg-foreground flex items-center justify-center">
        <Icon className="h-4 w-4 text-background" />
      </div>
      <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-foreground">{title}</h2>
    </div>
  );
}

/* ─── Section nav bar ────────────────────────────────── */

function SectionNav({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(0);
  const scrollTo = (id: string, idx: number) => {
    setActive(idx);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav className="border-y border-border bg-background sticky top-[72px] z-20">
      <div className="section-inner">
        <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
          {sections.map((s, i) => (
            <button
              key={s.id}
              onClick={() => scrollTo(s.id, i)}
              className={`px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] whitespace-nowrap transition-all duration-200
                ${i === active
                  ? 'bg-foreground text-background'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}

/* ─── SpecLine for below-fold detail ─────────────────── */

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
              <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                <Layers className="h-4 w-4 text-background" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-foreground">Related Trims</h2>
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

  /* Build gallery: real DB images → seeded images → single placeholder */
  const galleryImages = useMemo<ProductImage[]>(() => {
    if (!product) return [];

    // 1. Real DB images
    const dbImages = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order);
    if (dbImages.length > 0) {
      return dbImages;
    }

    // 2. Seeded images
    const seeded = getPdpSeedImages(product.slug);
    if (seeded && seeded.length > 0) {
      return seeded.map((url, i) => ({
        id: `seed-img-${product.id}-${i}`,
        url,
        sort_order: i,
        is_primary: i === 0,
        alt_text: `${product.name_en ?? product.name} — view ${i + 1}`,
      }));
    }

    // 3. Single placeholder
    return [{
      id: `placeholder-${product.id}`,
      url: getProductPlaceholderUrl(
        product.name_en ?? product.name,
        product.item_code ?? product.slug,
        product.primary_category?.slug,
        product.primary_category?.name,
        800,
      ),
      sort_order: 0,
      is_primary: true,
      alt_text: product.name_en ?? product.name,
    }];
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

  /* ── data extraction with seed fallback ── */
  const seed = getPdpSeed(product.slug);
  const tags = product.tags ?? [];
  const primaryCat = product.primary_category ?? product.categories?.[0];
  const rawSpecs = product.specifications ?? {};
  const rawProd = product.production ?? {};

  const seedSpecs = seed?.specifications ?? {};
  const seedProd = seed?.production ?? {};

  const materials = product.materials ?? [];
  const materialNames = materials.length
    ? materials.map((m) => m.name).join(', ')
    : specValue(rawSpecs.material) ?? specValue(rawSpecs.Material) ?? seedSpecs.material ?? null;
  const finish = specValue(rawSpecs.finish) ?? specValue(rawSpecs.Finish) ?? specValue(rawSpecs.plating) ?? seedSpecs.finish ?? null;
  const size = specValue(rawSpecs.size) ?? specValue(rawSpecs.Size) ?? specValue(rawSpecs.dimensions) ?? seedSpecs.size ?? null;
  const weight = specValue(rawSpecs.weight) ?? specValue(rawSpecs.Weight) ?? seedSpecs.weight ?? null;
  const thickness = specValue(rawSpecs.thickness) ?? specValue(rawSpecs.Thickness) ?? seedSpecs.thickness ?? null;
  const attachment = specValue(rawSpecs.attachment) ?? specValue(rawSpecs.construction) ?? seedSpecs.attachment ?? null;
  const colorOptions = specValue(rawSpecs.color_options) ?? (seedSpecs.color_options ? seedSpecs.color_options.join(', ') : null);
  const tensileStrength = specValue(rawSpecs.tensileStrength) ?? seedSpecs.tensileStrength ?? null;

  const moq = specValue(rawProd.moq) ?? specValue(rawProd.MOQ) ?? specValue(rawProd.minimum_order) ?? seedProd.moq ?? null;
  const sampleTime = specValue(rawProd.sampleTime) ?? specValue(rawProd.sample_time) ?? seedProd.sample_time ?? null;
  const leadTime = specValue(rawProd.leadTime) ?? specValue(rawProd.lead_time) ?? seedProd.lead_time ?? null;
  const origin = specValue(rawProd.origin) ?? specValue(rawProd.Origin) ?? seedProd.origin ?? null;
  const capacity = specValue(rawProd.capacity) ?? specValue(rawProd.Capacity) ?? seedProd.capacity ?? null;

  const realCerts = product.certifications ?? [];
  const seedCerts = (seed?.certifications ?? [])
    .filter((sc) => !realCerts.some((rc) => rc.abbreviation === sc.abbreviation))
    .map((sc, i) => ({ id: `seed-cert-${i}`, name: sc.name, abbreviation: sc.abbreviation, logo_url: undefined }));
  const certs = [...realCerts, ...seedCerts];

  const realIndustries = product.industries ?? [];
  const seedIndustries = (seed?.applications?.industries ?? [])
    .filter((si) => !realIndustries.some((ri) => ri.name.toLowerCase() === si.toLowerCase()))
    .map((si, i) => ({ id: `seed-ind-${i}`, name: si, slug: si.toLowerCase().replace(/\s+/g, '-'), sort_order: 100 + i }));
  const industries = [...realIndustries, ...seedIndustries];

  const description = product.description_en ?? product.description ?? seed?.description ?? null;
  const isCustomizable = product.is_customizable || (seed?.is_customizable ?? false);

  // Build merged detail objects for below-fold
  const mergedSpecObj: Record<string, string> = {};
  if (materialNames) mergedSpecObj['material'] = materialNames;
  if (finish) mergedSpecObj['finish'] = finish;
  if (size) mergedSpecObj['size'] = size;
  if (weight) mergedSpecObj['weight'] = weight;
  if (thickness) mergedSpecObj['thickness'] = thickness;
  if (attachment) mergedSpecObj['attachment'] = attachment;
  if (colorOptions) mergedSpecObj['color_options'] = colorOptions;
  if (tensileStrength) mergedSpecObj['tensile_strength'] = tensileStrength;
  for (const [k, v] of Object.entries(rawSpecs)) {
    const sv = specValue(v);
    if (sv && !mergedSpecObj[k]) mergedSpecObj[k] = sv;
  }
  const allSpecEntries = Object.entries(mergedSpecObj);

  const mergedProdObj: Record<string, string> = {};
  if (moq) mergedProdObj['moq'] = moq;
  if (sampleTime) mergedProdObj['sample_time'] = sampleTime;
  if (leadTime) mergedProdObj['lead_time'] = leadTime;
  if (origin) mergedProdObj['origin'] = origin;
  if (capacity) mergedProdObj['capacity'] = capacity;
  for (const [k, v] of Object.entries(rawProd)) {
    const sv = specValue(v);
    if (sv && !mergedProdObj[k]) mergedProdObj[k] = sv;
  }
  const allProductionEntries = Object.entries(mergedProdObj);

  const breadcrumbSegments = [
    { label: 'Home', href: '/' },
    { label: 'Trim Library', href: '/products' },
    ...(primaryCat ? [{ label: primaryCat.name, href: `/products?category=${primaryCat.slug}` }] : []),
    { label: product.name_en ?? product.name },
  ];

  const hasDownloads = !!product.model_url;

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
            HERO — Above the fold (compact & balanced)
           ════════════════════════════════════════════════ */}
        <section className="section-inner py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* LEFT — Media */}
            <HeroGallery
              images={galleryImages}
              onOpen3D={() => setShow3D(true)}
              has3D={!!product.model_url}
            />

            {/* RIGHT — Compact decision panel */}
            <div className="flex flex-col">

              {/* Identity */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  {primaryCat && (
                    <Link
                      to={`/products?category=${primaryCat.slug}`}
                      className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {primaryCat.name}
                    </Link>
                  )}
                  {product.item_code && (
                    <>
                      <span className="text-muted-foreground/40">·</span>
                      <span className="text-[11px] font-mono text-muted-foreground">{product.item_code}</span>
                    </>
                  )}
                </div>
                <h1 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground leading-tight mb-2">
                  {product.name_en ?? product.name}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map((t) => (
                    <Badge key={t.id} variant="default" className="text-[10px] uppercase tracking-[0.06em]">
                      {t.name}
                    </Badge>
                  ))}
                  {isCustomizable && (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.06em] gap-1">
                      <Palette className="h-3 w-3" /> Customizable
                    </Badge>
                  )}
                </div>
              </div>

              {/* Brief description */}
              {description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-5 line-clamp-3">
                  {description}
                </p>
              )}

              {/* Compact key specs — 2-column grid tiles */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-0 border-t border-border/50 mb-4">
                <SpecTile label="Material" value={materialNames} />
                <SpecTile label="Finish" value={finish} />
                <SpecTile label="Size" value={size} />
                <SpecTile label="Attachment" value={attachment} />
                <SpecTile label="MOQ" value={moq} />
                <SpecTile label="Lead Time" value={leadTime} />
              </div>

              {/* Compliance inline */}
              {certs.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap mb-5 pb-4 border-b border-border/50">
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
              )}

              {/* CTAs */}
              <div className="space-y-3 mt-auto">
                <Button variant="default" size="lg" className="w-full gap-2 h-12 text-sm font-semibold tracking-wide">
                  <Send className="h-4 w-4" />
                  Request Quote
                </Button>

                {isCustomizable && (
                  <Button variant="outline" size="lg" className="w-full gap-2 h-11 text-sm">
                    <Palette className="h-4 w-4" />
                    Customize This Trim
                  </Button>
                )}

                <div className={`grid gap-2 ${product.model_url ? 'grid-cols-3' : 'grid-cols-2'}`}>
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
                {description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                  {[
                    { l: 'Material', v: materialNames, accent: false },
                    { l: 'Finish', v: finish, accent: true },
                    { l: 'Size', v: size, accent: false },
                    { l: 'Weight', v: weight, accent: false },
                    { l: 'MOQ', v: moq, accent: true },
                    { l: 'Lead Time', v: leadTime, accent: true },
                  ].filter(item => item.v).map(item => (
                    <div key={item.l} className={`p-3 border ${item.accent ? 'border-foreground bg-foreground/[0.03]' : 'border-border'}`}>
                      <p className="text-[10px] uppercase tracking-[0.1em] text-foreground/60 font-medium mb-1">{item.l}</p>
                      <p className="text-sm font-semibold text-foreground">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
              {materials.length > 0 && (
                <div className="border-2 border-foreground p-5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-foreground mb-4 pb-3 border-b border-foreground/20">Materials</h3>
                  <div className="space-y-2.5">
                    {materials.map((m) => (
                      <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-b-0">
                        <span className="text-sm font-medium text-foreground">{m.name}</span>
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
              <div className="border-2 border-foreground">
                <div className="grid grid-cols-1 sm:grid-cols-2">
                  {allSpecEntries.map(([key, val], idx) => (
                    <div
                      key={key}
                      className={`flex justify-between items-baseline gap-4 px-4 py-3.5 ${
                        idx < allSpecEntries.length - (allSpecEntries.length % 2 === 0 ? 2 : 1) ? 'border-b border-foreground/15' : ''
                      } ${idx % 2 === 0 && allSpecEntries.length > 1 ? 'sm:border-r sm:border-foreground/15' : ''}`}
                    >
                      <dt className="text-[11px] text-foreground/60 font-medium uppercase tracking-[0.08em]">
                        {key.replace(/_/g, ' ')}
                      </dt>
                      <dd className="text-[13px] font-semibold text-foreground text-right">{val}</dd>
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
                <div className="border-2 border-foreground">
                  <div className="grid grid-cols-1 sm:grid-cols-2">
                    {allProductionEntries.map(([key, val], idx) => (
                      <div
                        key={key}
                        className={`flex justify-between items-baseline gap-4 px-4 py-3.5 ${
                          idx < allProductionEntries.length - (allProductionEntries.length % 2 === 0 ? 2 : 1) ? 'border-b border-foreground/15' : ''
                        } ${idx % 2 === 0 && allProductionEntries.length > 1 ? 'sm:border-r sm:border-foreground/15' : ''}`}
                      >
                        <dt className="text-[11px] text-foreground/60 font-medium uppercase tracking-[0.08em]">
                          {key.replace(/_/g, ' ')}
                        </dt>
                        <dd className="text-[13px] font-semibold text-foreground text-right">{val}</dd>
                      </div>
                    ))}
                  </div>
                </div>
                {isCustomizable && (
                  <div className="bg-foreground text-primary-foreground p-6 flex flex-col justify-between">
                    <div>
                      <Palette className="h-5 w-5 mb-3 opacity-60" />
                      <h4 className="text-xs font-semibold uppercase tracking-[0.1em] mb-2">Customization Available</h4>
                      <p className="text-xs opacity-70 leading-relaxed">
                        Custom finishes, sizes, colors, and branding options available. Contact us for a tailored specification.
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" className="mt-4 gap-1.5 w-full">
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
