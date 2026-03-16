import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileDown, Sparkles, Box } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PageBreadcrumb from '@/components/ui/PageBreadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import ProductCard from '@/components/products/ProductCard';
import Model3DViewer from '@/components/designer-studio/Model3DViewer';
import { useProduct } from '@/features/products/hooks/useProduct';
import { useProducts } from '@/features/products/hooks/useProducts';
import type { Product, ProductImage } from '@/features/products/types';

/* ─── Image Gallery ──────────────────────────────────── */

function ImageGallery({ images }: { images: ProductImage[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!images.length) {
    return (
      <div className="aspect-square bg-secondary border border-border rounded-[calc(var(--radius)*2)] flex items-center justify-center">
        <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">No image</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary image */}
      <div className="aspect-square bg-secondary border border-border rounded-[calc(var(--radius)*2)] overflow-hidden">
        <img
          src={activeImage.url}
          alt={activeImage.alt_text ?? 'Product image'}
          className="w-full h-full object-contain p-4"
        />
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActiveIndex(i)}
              className={`shrink-0 w-16 h-16 rounded-[var(--radius)] overflow-hidden border transition-colors duration-150 ${
                i === activeIndex
                  ? 'border-foreground'
                  : 'border-border hover:border-muted-foreground'
              }`}
            >
              <img
                src={img.url}
                alt={img.alt_text ?? `Thumbnail ${i + 1}`}
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

/* ─── Spec grid ──────────────────────────────────────── */

function SpecGrid({ label, data }: { label: string; data: Record<string, unknown> }) {
  const entries = Object.entries(data).filter(([, v]) => v != null && v !== '');
  if (!entries.length) return null;

  return (
    <div>
      <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground mb-3">{label}</h3>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2">
        {entries.map(([key, value]) => (
          <div key={key}>
            <dt className="text-xs text-muted-foreground uppercase">{key.replace(/_/g, ' ')}</dt>
            <dd className="text-sm font-medium text-foreground">
              {Array.isArray(value) ? (
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {(value as string[]).map((v) => (
                    <span key={v} className="bg-secondary border border-border text-[10px] px-1.5 py-0.5 rounded-[var(--radius)]">{v}</span>
                  ))}
                </div>
              ) : (
                String(value)
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ─── Related products ───────────────────────────────── */

function RelatedProducts({ product }: { product: Product }) {
  const categorySlug = product.primary_category?.slug ?? product.categories?.[0]?.slug;
  const { products } = useProducts({
    categories: categorySlug ? [categorySlug] : undefined,
  });

  const related = useMemo(
    () => products.filter((p) => p.id !== product.id).slice(0, 6),
    [products, product.id],
  );

  if (!related.length) return null;

  return (
    <section className="mt-16 lg:mt-24">
      <div className="section-inner">
        <h2 className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground mb-6">
          You may also like
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
        <Skeleton className="aspect-square rounded-[calc(var(--radius)*2)]" />
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
  const images = product.images ?? [];
  const primaryCat = product.primary_category ?? product.categories?.[0];

  const breadcrumbItems = [
    { label: 'Home', href: '/' },
    { label: 'Trim Library', href: '/products' },
    ...(primaryCat
      ? [{ label: primaryCat.name, href: `/products?category=${primaryCat.slug}` }]
      : []),
    { label: product.name_en ?? product.name },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pb-16">
        {/* Breadcrumb */}
        <div className="section-inner pt-6 pb-4">
          <PageBreadcrumb items={breadcrumbItems} />
        </div>

        {/* Two-column layout */}
        <div className="section-inner">
          <div className="grid grid-cols-1 md:grid-cols-[55%_45%] gap-8 lg:gap-12">
            {/* LEFT — Gallery */}
            <div>
              <ImageGallery images={images} />

              {product.model_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3 gap-1.5"
                  onClick={() => setShow3D(true)}
                >
                  <Box className="h-4 w-4" />
                  View 3D Model
                </Button>
              )}
            </div>

            {/* RIGHT — Info */}
            <div className="space-y-5">
              {/* Tags */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((t) => (
                    <span
                      key={t.id}
                      className="bg-foreground text-background text-[10px] font-medium uppercase tracking-[0.06em] px-2 py-0.5 rounded-[var(--radius)]"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Category */}
              {primaryCat && (
                <p className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground">
                  {primaryCat.name}
                </p>
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

              {/* Specifications */}
              {product.specifications && (
                <SpecGrid label="Specifications" data={product.specifications} />
              )}

              {/* Production */}
              {product.production && (
                <SpecGrid label="Production" data={product.production} />
              )}

              {/* Certifications */}
              {certs.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground mb-3">
                    Sustainability
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {certs.map((c) => (
                      <Tooltip key={c.id}>
                        <TooltipTrigger asChild>
                          <span className="bg-secondary border border-border text-[10px] font-medium uppercase tracking-[0.04em] px-2 py-1 rounded-[var(--radius)] cursor-default">
                            {c.abbreviation || c.name}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">{c.name}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </div>
              )}

              {/* Industries */}
              {industries.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium uppercase tracking-[0.1em] text-muted-foreground mb-3">
                    Applications
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {industries.map((ind) => (
                      <span
                        key={ind.id}
                        className="bg-secondary border border-border text-xs font-medium px-3 py-1 rounded-[var(--radius)]"
                      >
                        {ind.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA Section */}
              <div className="border-t border-border pt-6 mt-6 space-y-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full"
                        disabled={!product.is_customizable}
                      >
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        Request Customization
                      </Button>
                    </div>
                  </TooltipTrigger>
                  {!product.is_customizable && (
                    <TooltipContent>
                      <p className="text-xs">Contact us to discuss customization</p>
                    </TooltipContent>
                  )}
                </Tooltip>

                <Button variant="outline" size="lg" className="w-full">
                  Add to My Library
                </Button>

                <Button variant="ghost" size="sm" className="w-full gap-1.5">
                  <FileDown className="h-4 w-4" />
                  Download Spec Sheet
                </Button>
              </div>
            </div>
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
