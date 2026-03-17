import { useState } from "react";
import { Box, Layers, Eye, Download, FileDown, Heart } from "lucide-react";
import type { UserLibraryItem } from "@/features/products/types";

interface LibraryItemCardProps {
  item: UserLibraryItem;
  onView: (item: UserLibraryItem) => void;
  onToggleFavourite: (id: string) => void;
  onAddToComposition: (item: UserLibraryItem) => void;
  onRequestSample: (item: UserLibraryItem) => void;
}

const LibraryItemCard = ({
  item,
  onView,
  onToggleFavourite,
  onAddToComposition,
  onRequestSample,
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

  return (
    <div
      className="group relative flex flex-col bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-[calc(var(--radius)*2)] overflow-hidden transition-all duration-200 hover:border-[hsl(var(--foreground))] hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)] cursor-pointer"
      onClick={() => onView(item)}
    >
      {/* Image area */}
      <div className="relative aspect-square bg-[hsl(var(--secondary))] overflow-hidden">
        {item.product?.thumbnail_url ? (
          <img
            src={item.product.thumbnail_url}
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

        {/* Admin default badge */}
        {item.is_admin_default && (
          <div className="absolute top-2 left-2 bg-[hsl(var(--foreground))] text-[hsl(var(--background))] text-[9px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-[var(--radius)]">
            Collection
          </div>
        )}

        {/* 3D model badge */}
        {item.product?.model_url && (
          <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-[hsl(var(--foreground))] text-[9px] font-medium uppercase tracking-[0.08em] px-2 py-0.5 rounded-[var(--radius)] border border-[hsl(var(--border))] flex items-center gap-1">
            <Box className="w-2.5 h-2.5" />
            3D
          </div>
        )}

        {/* Hover overlay with quick actions */}
        <div className="absolute inset-0 bg-[hsl(var(--foreground))]/80 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2 p-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToComposition(item);
            }}
            className="w-full flex items-center justify-center gap-2 bg-white text-black text-xs font-medium uppercase tracking-[0.06em] px-3 py-2 rounded-[var(--radius)] hover:bg-white/90 transition-colors"
          >
            <Layers className="w-3 h-3" />
            Add to Canvas
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            className="w-full flex items-center justify-center gap-2 bg-white/20 text-white text-xs font-medium uppercase tracking-[0.06em] px-3 py-2 rounded-[var(--radius)] hover:bg-white/30 transition-colors border border-white/30"
          >
            <Eye className="w-3 h-3" />
            View Details
          </button>
        </div>
      </div>

      {/* Info area */}
      <div className="p-3 flex flex-col gap-2">
        {/* Category + item code row */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[hsl(var(--muted-foreground))]">
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

        {/* Action row */}
        <div className="flex items-center gap-2 mt-1 pt-2 border-t border-[hsl(var(--border))]">
          {/* Download files */}
          {hasDownloads && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDownloads(!showDownloads);
              }}
              className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors"
              title="Download files"
            >
              <Download className="w-3 h-3" />
              Files ({downloadCount})
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* RFQ button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRequestSample(item);
            }}
            className="text-[10px] font-medium uppercase tracking-[0.06em] text-[hsl(var(--foreground))] hover:underline underline-offset-2 transition-colors"
          >
            Request →
          </button>

          {/* Favourite */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavourite(item.id);
            }}
            className="p-1 rounded text-[hsl(var(--muted-foreground))] hover:text-foreground transition-colors"
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                item.is_favourite ? "fill-current text-foreground" : ""
              }`}
            />
          </button>
        </div>

        {/* Downloads dropdown */}
        {showDownloads && hasDownloads && (
          <div className="border border-[hsl(var(--border))] rounded-[var(--radius)] overflow-hidden divide-y divide-[hsl(var(--border))]">
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
                <FileDown className="w-3 h-3 flex-shrink-0 text-[hsl(var(--muted-foreground))]" />
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
