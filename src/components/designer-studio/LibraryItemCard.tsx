import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Lock, Globe } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";

interface LibraryItemCardProps {
  item: LibraryItem;
  onView: (item: LibraryItem) => void;
  onQuickRFQ: (item: LibraryItem) => void;
}

const LibraryItemCard = ({ item, onView, onQuickRFQ }: LibraryItemCardProps) => {
  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className="relative aspect-square bg-muted">
        <img
          src={item.thumbnailUrl || '/placeholder.svg'}
          alt={item.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-2 right-2">
          {item.isPublic ? (
            <Badge variant="secondary" className="gap-1">
              <Globe className="w-3 h-3" />
              公開
            </Badge>
          ) : (
            <Badge variant="outline" className="gap-1 bg-background/80 border-amber-500/50 text-amber-700 dark:text-amber-400">
              <Lock className="w-3 h-3" />
              {item.teamName || '團隊專屬'}
            </Badge>
          )}
        </div>
        {item.modelUrl && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-primary/90">3D</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="mb-2">
          <Badge variant="outline" className="text-xs">
            {categoryLabels[item.category]}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground font-mono mb-1">{item.itemCode}</p>
        <h3 className="font-medium text-foreground mb-1 line-clamp-1">{item.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{item.description}</p>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => onView(item)}
          >
            <Eye className="w-4 h-4" />
            查看
          </Button>
          <Button
            size="sm"
            className="flex-1 gap-1 btn-red-glow"
            onClick={() => onQuickRFQ(item)}
          >
            <FileText className="w-4 h-4" />
            快速報價
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default LibraryItemCard;
