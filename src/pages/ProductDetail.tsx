import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '@/features/auth/AuthProvider';
import { useI18n } from '@/features/i18n/I18nProvider';
import { localizedName, localizedDescription } from '@/features/admin/lib/localize';
import { resolveProductMaterials } from '@/features/products/utils/productMaterial';
import { buildSpecRows, formatLeadTime, formatMoq } from '@/features/products/utils/productSpecs';
import { supabase } from '@/integrations/supabase/client';
import {
  FileDown, Box, Send, Palette, BookmarkPlus, Download,
  ShieldCheck, ArrowRight, Layers, ClipboardList,
  Package, Cpu, Globe, ChevronRight,
} from 'lucide-react';
import PageBreadcrumb from '@/components/ui/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/products/ProductCard';
import ProductGallery from '@/components/product/ProductGallery';
import SizeSelector from '@/components/product/SizeSelector';
import ProductColourFinish from '@/components/product/ProductColourFinish';
import Model3DViewer from '@/components/designer-studio/Model3DViewer';
import { useProduct } from '@/features/products/hooks/useProduct';
import { useProducts } from '@/features/products/hooks/useProducts';
import { getProductImageUrl } from '@/lib/productImage';
import type { Product, ProductImage } from '@/features/products/types';

/* ─── Section nav items ─────────────────────────────── */

const SECTION_IDS = {
  overview: 'pdp-overview',
  specs: 'pdp-specs',
  applications: 'pdp-applications',
  downloads: 'pdp-downloads',
  related: 'pdp-related',
} as const;

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
    <div id={id} className="pt-2 mb-6 scroll-mt-24">
      <div className="w-8 h-8 bg-foreground flex items-center justify-center mb-3">
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

/* ─── Related products ───────────────────────────────── */

function RelatedProducts({ product }: { product: Product }) {
  const { t } = useI18n();
  const categorySlug = product.primary_category?.slug ?? product.categories?.[0]?.slug;
  const { products } = useProducts({ categories: categorySlug ? [categorySlug] : undefined });
  const related = useMemo(() => products.filter((p) => p.id !== product.id).slice(0, 6), [products, product.id]);
  if (!related.length) return null;

  return (
    <section id={SECTION_IDS.related} className="scroll-mt-24 py-16 bg-secondary/30">
      <div className="section-inner">
        <div className="flex items-end justify-between mb-8 gap-4">
            <div>
              <div className="w-8 h-8 bg-foreground flex items-center justify-center mb-3">
                <Layers className="h-4 w-4 text-background" />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-foreground">{t('product.section.related')}</h2>
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
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { session, primaryBrand } = useAuth();
  const { t, language } = useI18n();
  const isStudioContext = location.pathname.startsWith('/designer-studio');
  const { product, loading, error } = useProduct(slug ?? '');
  const [show3D, setShow3D] = useState(false);
  const [sizeId, setSizeId] = useState<string | null>(null);
  // `name` is the English base; the zh columns carry the translations.
  const displayName = product ? localizedName(product, language) : '';

  /* The gallery is the database, and nothing else. A product with no
     images renders a deliberate empty state inside ProductGallery, never a
     photograph belonging to another product. */
  const galleryImages = useMemo<ProductImage[]>(
    () => [...(product?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    [product],
  );

  const addToLibrary = useCallback(async () => {
    if (!product) return;
    if (!session || !primaryBrand) {
      const next = encodeURIComponent(`${location.pathname}?intent=add-library`);
      navigate(`/designer-studio/login?next=${next}`);
      return;
    }
    const { data: existing } = await supabase
      .from('user_library_items')
      .select('id')
      .eq('team_id', primaryBrand.id)
      .eq('product_id', product.id)
      .maybeSingle();
    if (existing) {
      toast.info(t('product.toast.alreadyInLibrary'));
      return;
    }
    const { error: insertError } = await supabase
      .from('user_library_items')
      .insert({ team_id: primaryBrand.id, product_id: product.id });
    if (insertError) {
      toast.error(t('product.toast.couldNotAdd'));
      return;
    }
    toast.success(t('product.toast.added', { name: localizedName(product, language) }));
  }, [product, session, primaryBrand, navigate, location.pathname, t, language]);

  // Complete a pending add-library intent after login
  useEffect(() => {
    if (searchParams.get('intent') !== 'add-library') return;
    if (!product || !session || !primaryBrand) return;
    addToLibrary();
    const params = new URLSearchParams(searchParams);
    params.delete('intent');
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, session, primaryBrand]);

  if (loading) {
    return (
      <DetailSkeleton />
    );
  }

  if (error || !product) {
    return (
      <div className="section-inner py-24 text-center">
        <h1 className="text-xl font-semibold mb-2">{t('product.notFound.title')}</h1>
        <p className="text-sm text-muted-foreground mb-6">{t('product.notFound.body')}</p>
        <Button variant="outline" asChild>
          <Link to={isStudioContext ? '/designer-studio/trim-library' : '/products'}>
            {t('product.notFound.back', {
              place: isStudioContext ? t('header.nav.designerStudio') : t('product.breadcrumb.trimLibrary'),
            })}
          </Link>
        </Button>
      </div>
    );
  }

  /* ── data extraction — the typed columns, nothing else ──
     The JSON `specifications` / `production` blobs are no longer read.
     Their contents were exported to reports/M5-legacy-spec-blobs.csv
     before item 3; re-entering them through the CMS is a content task. */
  const tags = product.tags ?? [];
  const primaryCat = product.primary_category ?? product.categories?.[0];

  const materials = resolveProductMaterials(product);
  const materialNames = materials.length ? materials.map((m) => localizedName(m, language)).join(', ') : null;
  const attachmentName = product.attachment ? localizedName(product.attachment, language) : null;
  const moq = formatMoq(product);
  const leadTime = formatLeadTime(product, t);

  const specRows = buildSpecRows(product, language, t);
  const standards = product.compliance_standards ?? [];
  const certs = product.certifications ?? [];
  const hasCompliance = standards.length > 0 || certs.length > 0;
  const industries = product.industries ?? [];

  const description = localizedDescription(product, language) ?? null;
  const isCustomizable = product.is_customizable;

  // Derived, not stored in an effect: the chosen size, else the default the
  // CMS flagged, else the first. Weight and thickness follow this variant.
  const sizeVariants = product.size_variants ?? [];
  const selectedSize =
    sizeVariants.find((v) => v.id === sizeId) ??
    sizeVariants.find((v) => v.is_default) ??
    sizeVariants[0] ??
    null;

  const libraryHref = isStudioContext ? '/designer-studio/trim-library' : '/products';
  const libraryLabel = isStudioContext ? t('header.nav.designerStudio') : t('product.breadcrumb.trimLibrary');

  const breadcrumbSegments = [
    { label: t('footer.nav.home'), href: '/' },
    { label: libraryLabel, href: libraryHref },
    ...(primaryCat ? [{ label: primaryCat.name, href: `${libraryHref}${isStudioContext ? '' : `?category=${primaryCat.slug}`}` }] : []),
    { label: displayName },
  ];

  const hasDownloads = !!product.model_url;

  const navSections = [
    { id: SECTION_IDS.overview, label: t('product.nav.overview') },
    ...(specRows.length > 0 || hasCompliance ? [{ id: SECTION_IDS.specs, label: t('product.nav.specifications') }] : []),
    ...(industries.length > 0 ? [{ id: SECTION_IDS.applications, label: t('product.nav.applications') }] : []),
    ...(hasDownloads ? [{ id: SECTION_IDS.downloads, label: t('product.nav.downloads') }] : []),
    { id: SECTION_IDS.related, label: t('product.nav.related') },
  ];

  return (
    <>
        <PageBreadcrumb segments={breadcrumbSegments} title={displayName} />

        {/* ════════════════════════════════════════════════
            HERO — Above the fold (compact & balanced)
           ════════════════════════════════════════════════ */}
        <section className="section-inner py-8 lg:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

            {/* LEFT — Media */}
            <ProductGallery
              images={galleryImages}
              productName={displayName}
              itemCode={product.item_code}
              categoryName={primaryCat?.name}
              has3D={!!product.model_url}
              onOpen3D={() => setShow3D(true)}
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
                  {displayName}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  {tags.map((t) => (
                    <Badge key={t.id} variant="default" className="text-[10px] uppercase tracking-[0.06em]">
                      {t.name}
                    </Badge>
                  ))}
                  {isCustomizable && (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.06em] gap-1">
                      <Palette className="h-3 w-3" /> {t('product.badge.customizable')}
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
              {/* Above-fold scan. Size and finish are omitted: they get their
                  own controls in items 5 and 6, where a value belongs to a
                  chosen variant rather than to the product. */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-0 border-t border-border/50 mb-4">
                <SpecTile label={t('product.spec.material')} value={materialNames} />
                <SpecTile label={t('product.spec.attachment')} value={attachmentName} />
                <SpecTile label={t('product.spec.moq')} value={moq} />
                <SpecTile label={t('product.spec.leadTime')} value={leadTime} />
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

              <SizeSelector variants={sizeVariants} selected={selectedSize} onSelect={setSizeId} />

              <ProductColourFinish product={product} />

              {/* CTAs */}
              <div className="space-y-3 mt-auto">
                <Button
                  variant="default"
                  size="lg"
                  className="w-full gap-2 h-12 text-sm font-semibold tracking-wide"
                  asChild
                >
                  <Link to={`/contact?product=${encodeURIComponent(product.slug)}`}>
                    <Send className="h-4 w-4" />
                    {t('product.cta.requestQuote')}
                  </Link>
                </Button>

                {product.model_url && (
                  <Button variant="outline" size="lg" className="w-full gap-2 h-11 text-sm" asChild>
                    <Link
                      to={`/designer-studio/editor?model=${encodeURIComponent(product.model_url)}&name=${encodeURIComponent(product.item_code || product.name)}&slug=${encodeURIComponent(product.slug)}`}
                    >
                      <Palette className="h-4 w-4" />
                      {t('product.cta.customise3D')}
                    </Link>
                  </Button>
                )}

                <div className="grid gap-2 grid-cols-2">
                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" onClick={addToLibrary}>
                    <BookmarkPlus className="h-3.5 w-3.5" />
                    {t('product.cta.addToLibrary')}
                  </Button>
                  {product.model_url ? (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" onClick={() => setShow3D(true)}>
                      <Box className="h-3.5 w-3.5" />
                      {t('product.cta.view3D')}
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" asChild>
                      <Link to={`/contact?product=${encodeURIComponent(product.slug)}`}>
                        <Send className="h-3.5 w-3.5" />
                        {t('product.cta.enquire')}
                      </Link>
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
            <SectionHeading id="" title={t('product.section.overview')} icon={ClipboardList} />
            <div>
              <div className="space-y-4">
                {description && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {description}
                  </p>
                )}
                {/* Item code, MOQ and lead time only: everything else lives in
                    the specification table below and is not repeated here. */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-6">
                  {[
                    { l: t('product.spec.itemCode'), v: product.item_code },
                    { l: t('product.spec.moq'), v: moq },
                    { l: t('product.spec.leadTime'), v: leadTime },
                  ].filter(item => item.v).map(item => (
                    <div key={item.l} className="bg-background border border-border p-3">
                      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground font-medium mb-1">{item.l}</p>
                      <p className="text-sm font-bold text-foreground">{item.v}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Technical Specifications ── */}
          {(specRows.length > 0 || hasCompliance) && (
            <section id={SECTION_IDS.specs} className="scroll-mt-24 mb-16">
              <SectionHeading id="" title={t('product.section.specifications')} icon={Cpu} />
              {specRows.length > 0 && (
                <dl data-testid="spec-table" className="border-2 border-foreground grid grid-cols-1 sm:grid-cols-2">
                  {specRows.map((row, idx) => (
                    <div
                      key={row.key}
                      data-testid={`spec-row-${row.key}`}
                      className={`flex justify-between items-baseline gap-4 px-4 py-3.5 ${
                        idx < specRows.length - (specRows.length % 2 === 0 ? 2 : 1) ? 'border-b border-foreground/15' : ''
                      } ${idx % 2 === 0 && specRows.length > 1 ? 'sm:border-r sm:border-foreground/15' : ''}`}
                    >
                      <dt className="text-[11px] text-foreground/60 font-medium uppercase tracking-[0.08em]">{row.label}</dt>
                      <dd className="text-[13px] font-medium text-foreground text-right">{row.value}</dd>
                    </div>
                  ))}
                </dl>
              )}

              {/* Two systems, labelled apart: M1 compliance standards, and the
                  older certifications six products still carry (ruling 3). */}
              {hasCompliance && (
                <div className={`space-y-3 ${specRows.length > 0 ? 'mt-6' : ''}`}>
                  {standards.length > 0 && (
                    <div className="flex items-start gap-3 flex-wrap">
                      <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground pt-1 shrink-0">
                        {t('product.spec.standards')}
                      </span>
                      <div data-testid="spec-standards" className="flex gap-2 flex-wrap">
                        {standards.map((std) => (
                          <Badge key={std.id} variant="outline" className="text-[10px] uppercase tracking-[0.06em]">
                            {localizedName(std, language)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {certs.length > 0 && (
                    <div className="flex items-start gap-3 flex-wrap">
                      <span className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground pt-1 shrink-0">
                        {t('product.spec.certifications')}
                      </span>
                      <div data-testid="spec-certifications" className="flex gap-2 flex-wrap">
                        {certs.map((c) => (
                          <Tooltip key={c.id}>
                            <TooltipTrigger asChild>
                              <span className="text-[10px] font-medium uppercase tracking-[0.06em] text-muted-foreground border border-border px-2 py-1 cursor-default hover:text-foreground hover:border-foreground transition-colors">
                                {c.abbreviation || c.name}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent><p className="text-xs">{c.name}</p></TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>
          )}

          {/* ── Applications & Segments ── */}
          {industries.length > 0 && (
            <section id={SECTION_IDS.applications} className="scroll-mt-24 mb-16">
              <SectionHeading id="" title={t('product.section.applications')} icon={Layers} />
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
              <SectionHeading id="" title={t('product.section.downloads')} icon={Download} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <button className="border border-border p-5 text-left hover:border-foreground hover:bg-secondary/30 transition-all duration-200 group">
                  <FileDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-3 transition-colors" />
                  <p className="text-sm font-medium text-foreground">{t('product.downloads.specSheet')}</p>
                  <p className="text-xs text-muted-foreground mt-1">{t('product.downloads.specSheetHint')}</p>
                </button>
                {product.model_url && (
                  <button
                    onClick={() => setShow3D(true)}
                    className="border border-border p-5 text-left hover:border-foreground hover:bg-secondary/30 transition-all duration-200 group"
                  >
                    <Box className="h-5 w-5 text-muted-foreground group-hover:text-foreground mb-3 transition-colors" />
                    <p className="text-sm font-medium text-foreground">{t('product.downloads.model3d')}</p>
                    <p className="text-xs text-muted-foreground mt-1">{t('product.downloads.model3dHint')}</p>
                  </button>
                )}
              </div>
            </section>
          )}
        </div>

        {/* ── Related Trims ── */}
        <RelatedProducts product={product} />
      {/* 3D Model Dialog */}
      {product.model_url && (
        <Dialog open={show3D} onOpenChange={setShow3D}>
          <DialogContent className="max-w-3xl h-[70vh]">
            <DialogTitle>{t('product.dialog.model3d', { name: displayName })}</DialogTitle>
            <div className="flex-1 min-h-0">
              <Model3DViewer hasModel modelUrl={product.model_url} />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
