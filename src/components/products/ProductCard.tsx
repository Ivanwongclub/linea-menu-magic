import { useState, useEffect } from 'react';
import { Sparkles, Heart, Eye, Leaf, Box } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product } from '@/features/products/types';
import { getProductPlaceholderUrl } from '@/features/products/utils/productImagePlaceholder';
import { getProductImageUrl } from '@/lib/productImage';
import { getPdpSeedImages } from '@/features/products/pdpSeedImages';

type ViewMode = 'grid' | 'list';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  index?: number;
  isHeroLayout?: boolean;
  isFeatured?: boolean;
  onQuickView?: (product: Product) => void;
  onAddToLibrary?: (product: Product) => void;
  isInLibrary?: boolean;
  linkTo?: string;
}

function resolveProductImage(
  product: Product,
  size: 'thumb' | 'full' = 'thumb',
): string {
  if (product.images?.length) {
    const primary = product.images.find((img) => img.is_primary) ?? product.images[0];
    if (primary?.url) return primary.url;
  }

  if (product.thumbnail_url) return product.thumbnail_url;

  // Use seeded images before falling back to placeholder
  const seeded = getPdpSeedImages(product.slug, product.primary_category?.slug);
  if (seeded && seeded.length > 0) return seeded[0];

  return getProductPlaceholderUrl(
    product.name_en ?? product.name,
    product.item_code,
    product.primary_category?.slug,
    product.primary_category?.name,
    size === 'thumb' ? 400 : 800,
  );
}

export default function ProductCard({
  product,
  viewMode,
  index = 99,
  isHeroLayout = false,
  isFeatured = false,
  onQuickView,
  onAddToLibrary,
  isInLibrary,
}: ProductCardProps) {
  const rawUrl = resolveProductImage(product, isHeroLayout ? 'full' : 'thumb');
  const imageUrl = getProductImageUrl(rawUrl, isHeroLayout ? 'pdp' : 'card');
  const isAboveFold = index < 2;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);

  if (viewMode === 'list') {
    return <ProductCardList product={product} onQuickView={onQuickView} isFeatured={isFeatured} />;
  }

  // Featured card — horizontal layout
  if (isHeroLayout) {
    return <ProductCardFeatured product={product} imageUrl={imageUrl} imageLoaded={imageLoaded} imageError={imageError} onImageLoad={() => setImageLoaded(true)} onImageError={() => setImageError(true)} onQuickView={onQuickView} isFeatured={isFeatured} prioritize={isFeatured} />;
  }

  const tags = product.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const extraTagCount = tags.length - 2;
  const certs = product.certifications ?? [];

  const altText = `${product.name_en ?? product.name}${product.primary_category ? ` — ${product.primary_category.name}` : ''}`;

  return (
    <div className="group bg-card border border-border rounded-[var(--radius)] overflow-hidden cursor-pointer hover-card transition-[border-color] duration-200 hover:border-foreground">
      {/* Image area */}
      <div className="aspect-square relative overflow-hidden bg-secondary hover-img-zoom">
        {!imageLoaded && !imageError && (
          <div aria-hidden="true" className="absolute inset-0 bg-secondary animate-pulse" />
        )}

        {imageError && (
          <img
            src={(getPdpSeedImages(product.slug, product.primary_category?.slug) ?? [])[0] ?? getProductPlaceholderUrl(product.name_en ?? product.name, product.item_code, product.primary_category?.slug, product.primary_category?.name, 400)}
            alt={altText}
            className="absolute inset-0 w-full h-full object-contain p-3"
          />
        )}

        <img
          src={imageUrl}
          alt={altText}
          width={400}
          height={400}
          loading={isAboveFold ? 'eager' : 'lazy'}
          fetchPriority={isAboveFold ? 'high' : undefined}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 w-full h-full object-contain p-3 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Tag badges (top-left) */}
        {visibleTags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
            {visibleTags.map((tag) => (
              <span key={tag.id} className="bg-foreground text-background text-[10px] font-medium uppercase tracking-[0.06em] px-2 py-0.5 rounded-[var(--radius)]">
                {tag.name}
              </span>
            ))}
            {extraTagCount > 0 && (
              <span className="bg-foreground text-background text-[10px] font-medium px-2 py-0.5 rounded-[var(--radius)]">
                +{extraTagCount}
              </span>
            )}
          </div>
        )}

        {/* 3D / OBJ badge (top-right) */}
        {product.model_url && (
          <div className="absolute top-2.5 right-2.5 bg-white/90 backdrop-blur-sm text-[hsl(var(--foreground))] text-[9px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-[var(--radius)] border border-[hsl(var(--border))] flex items-center gap-1 z-20">
            <Box className="w-2.5 h-2.5" />
            3D
          </div>
        )}

        {/* Sustainability leaf badge (bottom-right) */}
        {certs.length > 0 && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="bg-white/85 backdrop-blur-sm rounded-[var(--radius)] px-1.5 py-0.5 flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5 text-[hsl(var(--foreground))]" />
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--foreground))]">
                {certs[0].abbreviation}
              </span>
            </div>
          </div>
        )}

        {/* Quick View button */}
        {onQuickView && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
            aria-label={`Quick view ${product.name_en ?? product.name}`}
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 translate-y-2 group-hover:translate-y-0 focus-visible:translate-y-0 transition-[opacity,transform] duration-[420ms] ease-[cubic-bezier(0.19,1,0.22,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--foreground))] focus-visible:ring-offset-2"
          >
            <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-foreground border border-border text-xs font-medium px-3 py-1.5 rounded-[var(--radius)]">
              <Eye className="h-3.5 w-3.5" />
              Quick View
            </span>
          </button>
        )}

        {/* Customizable badge */}
        {product.is_customizable && !certs.length && (
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 bg-foreground text-background text-[10px] px-2 py-0.5 rounded-[var(--radius)]">
            <Sparkles className="h-3 w-3" />
            Custom
          </span>
        )}
      </div>

      {/* Info area with hover reveal */}
      <div className="relative overflow-hidden">
        {/* Normal info */}
        <div className="p-3 transition-transform duration-300 ease-out group-hover:-translate-y-[44px]">
          {product.primary_category && (
            <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))] mb-1 block">
              {product.primary_category.name}
            </span>
          )}
          <p className="text-sm font-medium text-[hsl(var(--foreground))] line-clamp-2 leading-snug">
            {product.name_en ?? product.name}
          </p>
          {product.item_code && (
            <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mt-1">
              {product.item_code}
            </p>
          )}
        </div>

        {/* Reveal panel — slides up on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-[44px] px-3 flex items-center justify-between bg-[hsl(var(--foreground))] translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-white/70">
            {product.materials?.[0]?.name ?? 'View details'}
          </span>
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-white flex items-center gap-1">
            Enquire
            <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Featured Card ──────────────────────────────────────

function ProductCardFeatured({
  product,
  imageUrl,
  imageLoaded,
  imageError,
  onImageLoad,
  onImageError,
  onQuickView,
  isFeatured = false,
  prioritize = false,
}: {
  product: Product;
  imageUrl: string;
  imageLoaded: boolean;
  imageError: boolean;
  onImageLoad: () => void;
  onImageError: () => void;
  onQuickView?: (product: Product) => void;
  isFeatured?: boolean;
  prioritize?: boolean;
}) {
  const altText = `${product.name_en ?? product.name}${product.primary_category ? ` — ${product.primary_category.name}` : ''}`;
  const certs = product.certifications ?? [];

  return (
    <div className="group bg-card border border-border rounded-[var(--radius)] overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-foreground hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] flex flex-col h-full">
      {/* Image (upper) */}
      <div className="relative overflow-hidden bg-secondary flex-1 min-h-0">
        {!imageLoaded && !imageError && (
          <div aria-hidden="true" className="absolute inset-0 bg-secondary animate-pulse" />
        )}
        <img
          src={imageUrl}
          alt={altText}
          width={800}
          height={800}
          loading={prioritize ? 'eager' : 'lazy'}
          fetchPriority={prioritize ? 'high' : undefined}
          decoding="async"
          onLoad={onImageLoad}
          onError={onImageError}
          className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 ease-out group-hover:scale-[1.04] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {certs.length > 0 && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="bg-white/85 backdrop-blur-sm rounded-[var(--radius)] px-1.5 py-0.5 flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5 text-[hsl(var(--foreground))]" />
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--foreground))]">
                {certs[0].abbreviation}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Info (bottom) */}
      <div className="p-5 md:p-6 flex flex-col">
        {product.primary_category && (
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))] mb-2 block">
            {product.primary_category.name}
          </span>
        )}
        <p className="text-lg font-semibold text-[hsl(var(--foreground))] leading-snug mb-1">
          {product.name_en ?? product.name}
        </p>
        {product.item_code && (
          <p className="text-[10px] text-[hsl(var(--muted-foreground))] font-mono mb-3">
            {product.item_code}
          </p>
        )}
        {(product.description_en || product.description) && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] leading-relaxed line-clamp-3 mb-3">
            {product.description_en ?? product.description}
          </p>
        )}
        {/* Material pills */}
        {product.materials && product.materials.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {product.materials.map((m) => (
              <span key={m.id} className="bg-secondary text-[9px] font-medium uppercase tracking-[0.04em] px-1.5 py-0.5 border border-border rounded-[var(--radius)]">
                {m.name}
              </span>
            ))}
          </div>
        )}
        <div className="mt-auto">
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView?.(product); }}
          >
            Enquire now →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── List View Card ─────────────────────────────────────

function ProductCardList({
  product,
  onQuickView,
  isFeatured = false,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
  isFeatured?: boolean;
}) {
  const tags = product.tags ?? [];
  const imageUrl = resolveProductImage(product, 'thumb');

  return (
    <div className="group flex items-center gap-4 h-20 bg-card border border-border rounded-[var(--radius)] overflow-hidden px-3 cursor-pointer transition-[border-color] duration-200 hover:border-foreground">
      <div className="relative h-16 w-16 shrink-0 bg-secondary rounded-[var(--radius)] overflow-hidden">
        <img
          src={imageUrl}
          alt={`${product.name_en ?? product.name}${product.primary_category ? ` — ${product.primary_category.name}` : ''}`}
          width={64}
          height={64}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {product.name_en ?? product.name}
          </p>
          {tags.slice(0, 2).map((tag) => (
            <span key={tag.id} className="shrink-0 bg-foreground text-background text-[9px] font-medium uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-[var(--radius)]">
              {tag.name}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {product.primary_category?.name}
          {product.item_code && ` · ${product.item_code}`}
        </p>
      </div>
      <div className="shrink-0 flex items-center gap-2">
        {onQuickView && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQuickView(product); }}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <Eye className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export type { ViewMode };
