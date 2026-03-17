import { useState, useEffect } from 'react';
import { Sparkles, Heart, Eye } from 'lucide-react';
import type { Product } from '@/features/products/types';
import { getProductPlaceholderUrl, getOptimizedImageUrl } from '@/features/products/utils/productImagePlaceholder';

type ViewMode = 'grid' | 'list';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  index?: number;
  onQuickView?: (product: Product) => void;
  onAddToLibrary?: (product: Product) => void;
  isInLibrary?: boolean;
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
  onQuickView,
  onAddToLibrary,
  isInLibrary,
}: ProductCardProps) {
  const rawUrl = resolveProductImage(product, 'thumb');
  const imageUrl = getOptimizedImageUrl(rawUrl, 400, 400, 80);
  const isAboveFold = index < 8;

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [imageUrl]);

  if (viewMode === 'list') {
    return <ProductCardList product={product} onQuickView={onQuickView} />;
  }

  const tags = product.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const extraTagCount = tags.length - 2;
  const certs = product.certifications ?? [];

  const altText = `${product.name_en ?? product.name}${product.primary_category ? ` — ${product.primary_category.name}` : ''}`;

  return (
    <div className="group bg-card border border-border rounded-[var(--radius)] overflow-hidden cursor-pointer transition-[border-color,box-shadow] duration-200 hover:border-foreground hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
      {/* Image area */}
      <div className="aspect-square relative overflow-hidden bg-secondary">
        {/* Skeleton pulse while loading */}
        {!imageLoaded && !imageError && (
          <div aria-hidden="true" className="absolute inset-0 bg-secondary animate-pulse" />
        )}

        {/* Error fallback */}
        {imageError && (
          <img
            src={getProductPlaceholderUrl(
              product.name_en ?? product.name,
              product.item_code,
              product.primary_category?.slug,
              product.primary_category?.name,
              400,
            )}
            alt={altText}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}

        {/* Main image */}
        <img
          src={imageUrl}
          alt={altText}
          width={400}
          height={400}
          loading={isAboveFold ? 'eager' : 'lazy'}
          fetchPriority={isAboveFold ? 'high' : 'low'}
          decoding="async"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.04] ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        />

        {/* Tag badges (top-left, stacked) */}
        {visibleTags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
            {visibleTags.map((tag) => (
              <span
                key={tag.id}
                className="bg-foreground text-background text-[10px] font-medium uppercase tracking-[0.06em] px-2 py-0.5 rounded-[var(--radius)]"
              >
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

        {/* Quick View button (center, on hover or keyboard focus) */}
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
            aria-label={`Quick view ${product.name_en ?? product.name}`}
            className="absolute inset-0 flex items-center justify-center
              opacity-0 group-hover:opacity-100 focus-visible:opacity-100
              translate-y-1 group-hover:translate-y-0 focus-visible:translate-y-0
              transition-all duration-200 ease-out
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-[hsl(var(--foreground))] focus-visible:ring-offset-2"
          >
            <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-foreground border border-border text-xs font-medium px-3 py-1.5 rounded-[var(--radius)]">
              <Eye className="h-3.5 w-3.5" />
              Quick View
            </span>
          </button>
        )}

        {/* Customizable badge (bottom-right) */}
        {product.is_customizable && (
          <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 bg-foreground text-background text-[10px] px-2 py-0.5 rounded-[var(--radius)]">
            <Sparkles className="h-3 w-3" />
            Custom
          </span>
        )}
      </div>

      {/* Info area */}
      <div className="p-3">
        {/* Primary category */}
        {product.primary_category && (
          <p className="text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground mb-1">
            {product.primary_category.name}
          </p>
        )}

        {/* Product name */}
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-snug">
          {product.name_en ?? product.name}
        </p>

        {/* Item code */}
        {product.item_code && (
          <p className="text-[10px] text-muted-foreground font-mono mt-1">
            {product.item_code}
          </p>
        )}

        {/* Certification pills */}
        {certs.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {certs.map((cert) => (
              <span
                key={cert.id}
                className="bg-secondary text-[9px] font-medium uppercase tracking-[0.04em] px-1.5 py-0.5 border border-border rounded-[var(--radius)]"
              >
                {cert.abbreviation}
              </span>
            ))}
          </div>
        )}

        {/* Action row (hover-revealed on desktop, always on touch) */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView?.(product);
            }}
            className="text-xs font-medium uppercase tracking-[0.06em] text-foreground hover:underline"
          >
            Enquire →
          </button>

          {onAddToLibrary && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onAddToLibrary(product);
              }}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <Heart
                className={`h-4 w-4 ${isInLibrary ? 'fill-foreground text-foreground' : ''}`}
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── List View Card ─────────────────────────────────────

function ProductCardList({
  product,
  onQuickView,
}: {
  product: Product;
  onQuickView?: (product: Product) => void;
}) {
  const tags = product.tags ?? [];
  const imageUrl = resolveProductImage(product, 'thumb');

  return (
    <div className="group flex items-center gap-4 h-20 bg-card border border-border rounded-[var(--radius)] overflow-hidden px-3 cursor-pointer transition-[border-color] duration-200 hover:border-foreground">
      {/* Image */}
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

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">
            {product.name_en ?? product.name}
          </p>
          {tags.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="shrink-0 bg-foreground text-background text-[9px] font-medium uppercase tracking-[0.04em] px-1.5 py-0.5 rounded-[var(--radius)]"
            >
              {tag.name}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {product.primary_category?.name}
          {product.item_code && ` · ${product.item_code}`}
        </p>
      </div>

      {/* Actions */}
      <div className="shrink-0 flex items-center gap-2">
        {onQuickView && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickView(product);
            }}
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
