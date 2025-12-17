import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Lock, Globe, Star, Box } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";

interface LibraryItemCardProps {
  item: LibraryItem;
  onView: (item: LibraryItem) => void;
  onQuickRFQ: (item: LibraryItem) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (itemId: string) => void;
}

const LibraryItemCard = ({ item, onView, onQuickRFQ, isFavorite = false, onToggleFavorite }: LibraryItemCardProps) => {
  return (
    <div 
      className="group cursor-pointer"
      onClick={() => onView(item)}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden mb-3">
        <img
          src={item.thumbnailUrl || '/placeholder.svg'}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300" />
        
        {/* Top badges */}
        <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
          <div className="flex gap-1.5">
            {item.modelUrl && (
              <Badge className="bg-primary text-primary-foreground text-xs">
                <Box className="w-3 h-3 mr-1" />
                3D
              </Badge>
            )}
          </div>
          
          {/* Visibility badge */}
          {item.isPublic ? (
            <Badge variant="secondary" className="bg-background/90 text-xs gap-1">
              <Globe className="w-3 h-3" />
              公開
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-background/90 text-xs gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
              <Lock className="w-3 h-3" />
              專屬
            </Badge>
          )}
        </div>
        
        {/* Favorite button - always visible */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(item.id);
            }}
            className="absolute top-3 left-3 p-2 rounded-full bg-background/80 hover:bg-background transition-all opacity-0 group-hover:opacity-100 z-10"
            style={{ left: item.modelUrl ? '60px' : '12px' }}
          >
            <Star 
              className={`w-4 h-4 transition-colors ${
                isFavorite 
                  ? "fill-yellow-400 text-yellow-400" 
                  : "text-muted-foreground hover:text-yellow-400"
              }`} 
            />
          </button>
        )}
        
        {/* Hover actions */}
        <div className="absolute inset-x-0 bottom-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 bg-background/95 hover:bg-background text-foreground gap-1.5"
              onClick={(e) => {
                e.stopPropagation();
                onView(item);
              }}
            >
              <Eye className="w-4 h-4" />
              查看詳情
            </Button>
            <Button
              size="sm"
              className="flex-1 gap-1.5 btn-red-glow"
              onClick={(e) => {
                e.stopPropagation();
                onQuickRFQ(item);
              }}
            >
              <FileText className="w-4 h-4" />
              快速報價
            </Button>
          </div>
        </div>
      </div>
      
      {/* Product Info */}
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-mono">{item.itemCode}</p>
        <h3 className="font-medium text-foreground leading-tight line-clamp-1 group-hover:text-primary transition-colors">
          {item.name}
        </h3>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {categoryLabels[item.category]}
          </Badge>
          {item.teamName && !item.isPublic && (
            <span className="text-xs text-muted-foreground">{item.teamName}</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibraryItemCard;
