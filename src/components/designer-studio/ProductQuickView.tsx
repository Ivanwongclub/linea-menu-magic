import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { FileText, Box, Globe, Lock, Calendar, Tag, Layers, X } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface ProductQuickViewProps {
  item: LibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onQuickRFQ: (item: LibraryItem) => void;
}

const ProductQuickView = ({ item, open, onOpenChange, onQuickRFQ }: ProductQuickViewProps) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="grid md:grid-cols-2 gap-0">
          {/* Image Section */}
          <div className="relative bg-muted aspect-square md:aspect-auto md:min-h-[500px]">
            <img
              src={item.thumbnailUrl || '/placeholder.svg'}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {item.modelUrl && (
              <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                <Box className="w-3.5 h-3.5 mr-1.5" />
                3D 模型可用
              </Badge>
            )}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-background/80 hover:bg-background transition-colors md:hidden"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Details Section */}
          <div className="p-6 flex flex-col">
            {/* Header */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {categoryLabels[item.category]}
                </Badge>
                {item.isPublic ? (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Globe className="w-3 h-3" />
                    公開
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
                    <Lock className="w-3 h-3" />
                    專屬
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground font-mono">{item.itemCode}</p>
              <h2 className="text-2xl font-semibold text-foreground">{item.name}</h2>
            </div>

            <Separator className="my-4" />

            {/* Description */}
            <div className="space-y-3 flex-1">
              <h3 className="text-sm font-medium text-foreground">產品描述</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {item.description}
              </p>

              {/* Specifications */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Tag className="w-3.5 h-3.5" />
                    類別
                  </div>
                  <p className="text-sm font-medium">{categoryLabels[item.category]}</p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Layers className="w-3.5 h-3.5" />
                    可用性
                  </div>
                  <p className="text-sm font-medium">{item.isPublic ? '公開庫存' : '專屬設計'}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    建立日期
                  </div>
                  <p className="text-sm font-medium">
                    {format(new Date(item.createdAt), 'yyyy/MM/dd', { locale: zhTW })}
                  </p>
                </div>

                {item.teamName && !item.isPublic && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Globe className="w-3.5 h-3.5" />
                      所屬團隊
                    </div>
                    <p className="text-sm font-medium">{item.teamName}</p>
                  </div>
                )}
              </div>

              {/* 3D Model Info */}
              {item.modelUrl && (
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Box className="w-4 h-4 text-primary" />
                    3D 模型資訊
                  </div>
                  <p className="text-xs text-muted-foreground">
                    此產品提供 3D 模型檔案，可於詳細頁面中查看互動式 3D 預覽。
                  </p>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onOpenChange(false)}
              >
                關閉
              </Button>
              <Button
                className="flex-1 btn-red-glow"
                onClick={() => {
                  onOpenChange(false);
                  onQuickRFQ(item);
                }}
              >
                <FileText className="w-4 h-4 mr-2" />
                快速報價
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickView;
