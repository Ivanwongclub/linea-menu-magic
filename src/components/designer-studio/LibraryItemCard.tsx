import { useState } from "react";
import { Box, Eye, Download, FileDown, Leaf } from "lucide-react";
import type { UserLibraryItem } from "@/features/products/types";
import type { Product } from "@/features/products/types";
import { getProductImageUrl } from "@/lib/productImage";
import { getPdpSeedImages } from "@/features/products/pdpSeedImages";
import { getProductPlaceholderUrl } from "@/features/products/utils/productImagePlaceholder";

interface LibraryItemCardProps {
  item: UserLibraryItem;
  onView: (item: UserLibraryItem) => void;
}

/** Shared image resolver — same fallback chain as ProductCard */
function resolveLibraryImage(product: Product | undefined): string {
  if (!product) return '';

  if (product.images?.length) {
    const primary = product.images.find((img) => img.is_primary) ?? product.images[0];
    if (primary?.url) return primary.url;
  }

  if (product.thumbnail_url) return product.thumbnail_url;

  const seeded = getPdpSeedImages(product.slug, product.primary_category?.slug);
  if (seeded && seeded.length > 0) return seeded[0];

  return getProductPlaceholderUrl(
    product.name_en ?? product.name,
    product.item_code,
    product.primary_category?.slug,
    product.primary_category?.name,
    400,
  );
}

const LibraryItemCard = ({
  item,
  onView,
}: LibraryItemCardProps) => {
  const [showDownloads, setShowDownloads] = useState(false);

  const displayName =
    item.custom_name ?? item.product?.name_en ?? item.product?.name ?? "Untitled";

  const primaryCategory = item.product?.primary_category ?? item.product?.categories?.[0];

  const specs = (item.product?.specifications ?? {}) as {
    material?: string;
    size?: string;
    finish?: string;
  };

  const downloads = item.downloadable_files ?? [];
  const hasDownloads = downloads.length > 0;
  const downloadCount = downloads.length;

  // Shared image pipeline
  const rawImageUrl = resolveLibraryImage(item.product);
  const imageUrl = getProductImageUrl(rawImageUrl, 'card');

  // Tags & certifications from product (matching ProductCard)
  const tags = item.product?.tags ?? [];
  const visibleTags = tags.slice(0, 2);
  const certs = item.product?.certifications ?? [];

  return (
    <div
      className="group relative flex flex-col bg-background border border-border overflow-hidden transition-colors duration-200 hover:border-foreground cursor-pointer"
      onClick={() => onView(item)}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-[hsl(var(--secondary))] overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={displayName}
            className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider font-mono">
              {item.product?.item_code || "—"}
            </span>
          </div>
        )}

        {/* Tag badges (top-left) — matching ProductCard */}
        {visibleTags.length > 0 && (
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-20">
            {visibleTags.map((tag) => (
              <span key={tag.id} className="bg-foreground text-background text-[10px] font-medium uppercase tracking-[0.18em] px-2 py-0.5">
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Admin default badge */}
        {item.is_admin_default && !visibleTags.length && (
          <div className="absolute top-2 left-2 bg-foreground text-background text-[9px] font-medium uppercase tracking-[0.18em] px-2 py-0.5">
            Collection
          </div>
        )}

        {/* 3D / OBJ badge (top-right) */}
        {item.product?.model_url && (
          <div className="absolute top-2 right-2 bg-background/90 backdrop-blur-sm text-foreground text-[9px] font-medium uppercase tracking-[0.18em] px-2 py-0.5 border border-border flex items-center gap-1">
            <Box className="w-2.5 h-2.5" strokeWidth={1.5} />
            3D
          </div>
        )}

        {/* Sustainability cert badge (bottom-right) — matching ProductCard */}
        {certs.length > 0 && (
          <div className="absolute bottom-2 right-2 z-10">
            <div className="bg-background/85 backdrop-blur-sm border border-border px-1.5 py-0.5 flex items-center gap-1">
              <Leaf className="w-2.5 h-2.5 text-foreground" strokeWidth={1.5} />
              <span className="text-[9px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--foreground))]">
                {certs[0].abbreviation}
              </span>
            </div>
          </div>
        )}

        {/* Hover overlay — View Details only */}
        <div className="absolute inset-0 bg-[hsl(var(--foreground))]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            className="w-full flex items-center justify-center gap-2 bg-background text-foreground text-xs font-medium uppercase tracking-[0.18em] px-3 py-2 hover:bg-background/90 transition-colors"
          >
            <Eye className="w-3 h-3" strokeWidth={1.5} />
            View Details
          </button>
        </div>
      </div>

      {/* Info area */}
      <div className="p-3 flex flex-col gap-2">
        {/* Category + item code row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            {primaryCategory?.name ?? "—"}
          </span>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">
            {item.product?.item_code}
          </span>
        </div>

        {/* Product name */}
        <p className="text-sm font-medium text-[hsl(var(--foreground))] leading-snug line-clamp-2">
          {displayName}
        </p>

        {/* Key specs row */}
        {specs.material && (
          <p className="text-[11px] text-[hsl(var(--muted-foreground))] truncate">
            {specs.material}
            {specs.size ? ` · ${specs.size}` : ""}
            {specs.finish ? ` · ${specs.finish}` : ""}
          </p>
        )}

        {/* Action row — files download only (Request and Heart removed per P13 W3/W4) */}
        {hasDownloads && (
          <div className="flex items-center gap-2 mt-1 pt-2 border-t border-[hsl(var(--border))]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDownloads(!showDownloads);
              }}
              className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors"
              title="Download files"
            >
              <Download className="w-3 h-3" strokeWidth={1.5} />
              Files ({downloadCount})
            </button>
          </div>
        )}

        {/* Downloads dropdown */}
        {showDownloads && hasDownloads && (
          <div className="border border-border overflow-hidden divide-y divide-border">
            {downloads.map((file) => (
              <a
                key={file.id}
                href={file.url}
                download={file.name}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 text-[11px] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))] transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <FileDown className="w-3 h-3 flex-shrink-0 text-muted-foreground" strokeWidth={1.5} />
                <span className="flex-1 truncate">{file.name}</span>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase font-mono flex-shrink-0">
                  {file.type.toUpperCase()}
                </span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryItemCard;
