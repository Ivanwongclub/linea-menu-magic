import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Lock, Globe, Box } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";

interface LibraryItemListRowProps {
  item: LibraryItem;
  onView: (item: LibraryItem) => void;
  onQuickRFQ: (item: LibraryItem) => void;
}

const LibraryItemListRow = ({ item, onView, onQuickRFQ }: LibraryItemListRowProps) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-lg hover:shadow-md transition-all duration-200 group">
      {/* Thumbnail */}
      <div className="relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-muted">
        <img
          src={item.thumbnailUrl || '/placeholder.svg'}
          alt={item.name}
          className="w-full h-full object-cover"
        />
        {item.modelUrl && (
          <div className="absolute bottom-0.5 right-0.5">
            <Box className="w-3 h-3 text-primary" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs text-muted-foreground font-mono">{item.itemCode}</span>
          <Badge variant="outline" className="text-xs">
            {categoryLabels[item.category]}
          </Badge>
          {item.isPublic ? (
            <Badge variant="secondary" className="gap-1 text-xs">
              <Globe className="w-3 h-3" />
              公開
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 text-xs bg-background/80 border-amber-500/50 text-amber-700 dark:text-amber-400">
              <Lock className="w-3 h-3" />
              {item.teamName || '團隊專屬'}
            </Badge>
          )}
          {item.modelUrl && (
            <Badge className="bg-primary/90 text-xs">3D</Badge>
          )}
        </div>
        <h3 className="font-medium text-foreground truncate">{item.name}</h3>
        <p className="text-sm text-muted-foreground truncate">{item.description}</p>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => onView(item)}
        >
          <Eye className="w-4 h-4" />
          查看
        </Button>
        <Button
          size="sm"
          className="gap-1 btn-red-glow"
          onClick={() => onQuickRFQ(item)}
        >
          <FileText className="w-4 h-4" />
          快速報價
        </Button>
      </div>
    </div>
  );
};

export default LibraryItemListRow;
