import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Heart, Box } from "lucide-react";
import type { UserLibraryItem } from "@/features/products/types";

interface LibraryItemCardProps {
  item: UserLibraryItem;
  onView: (item: UserLibraryItem) => void;
  onToggleFavorite?: (itemId: string) => void;
}

const LibraryItemCard = ({ item, onView, onToggleFavorite }: LibraryItemCardProps) => {
  const product = item.product;
  const displayName = item.custom_name || product?.name_en || product?.name || 'Untitled';
  const itemCode = product?.item_code ?? '';
  const thumbnailUrl = product?.thumbnail_url;
  const categoryName = product?.primary_category?.name ?? product?.categories?.[0]?.name;
  const hasModel = !!product?.model_url;

  return (
    <div
      className="group cursor-pointer"
      onClick={() => onView(item)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-secondary rounded-[var(--radius)] overflow-hidden mb-3">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={displayName}
            className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
              {itemCode || '—'}
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />

        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex gap-1.5">
            {hasModel && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                <Box className="w-3 h-3 mr-1" />
                3D
              </Badge>
            )}
            {item.custom_brand && (
              <Badge variant="secondary" className="bg-background/90 text-xs">
                {item.custom_brand}
              </Badge>
            )}
          </div>
        </div>

        {/* Favorite button - fixed bottom-left corner */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className={`absolute bottom-14 left-3 p-2 rounded-full bg-background/90 hover:bg-background shadow-sm transition-all z-10 ${
              item.is_favourite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                item.is_favourite
                  ? "fill-red-500 text-red-500"
                  : "text-muted-foreground hover:text-red-500"
              }`}
            />
          </button>
        )}

        {/* Hover action */}
        <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button
            variant="secondary"
            size="sm"
            className="w-full bg-background/95 hover:bg-background text-foreground gap-1.5"
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
          >
            <Eye className="w-4 h-4" />
            Quick View
          </Button>
        </div>
      </div>

      {/* Product Info */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">{itemCode}</p>
        <h3 className="font-medium text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {displayName}
        </h3>
        <div className="flex items-center justify-between">
          {categoryName && (
            <Badge variant="outline" className="text-xs">
              {categoryName}
            </Badge>
          )}
          {item.team_name && (
            <span className="text-xs text-muted-foreground">{item.team_name}</span>
          )}
        </div>
        {item.notes && (
          <p className="text-xs text-muted-foreground italic line-clamp-1">{item.notes}</p>
        )}
      </div>
    </div>
  );
};

export default LibraryItemCard;
