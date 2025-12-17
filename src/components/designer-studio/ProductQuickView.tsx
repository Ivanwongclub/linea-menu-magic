import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Box, Globe, Lock, Calendar, Tag, Layers, X, 
  DollarSign, Package, Clock, Factory, Award, 
  Palette, Shirt, MapPin, TrendingDown
} from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";

interface ProductQuickViewProps {
  item: LibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductQuickView = ({ item, open, onOpenChange }: ProductQuickViewProps) => {
  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden max-h-[90vh]">
        {/* Mobile Header with Back Button */}
        <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-background border-b md:hidden">
          <button
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
            <span>關閉</span>
          </button>
          <span className="text-sm font-medium text-foreground truncate">{item.name}</span>
        </div>

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
          </div>

          {/* Details Section */}
          <ScrollArea className="h-[500px] md:h-auto md:max-h-[90vh]">
            <div className="p-6 flex flex-col">
              {/* Header */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
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
                <p className="text-sm text-muted-foreground">{item.nameEn}</p>
              </div>

              <Separator className="my-4" />

              {/* Description */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Layers className="w-4 h-4 text-muted-foreground" />
                  產品描述
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>

              <Separator className="my-4" />

              {/* Pricing Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  價格與數量
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">單價</p>
                    <p className="text-lg font-semibold text-foreground">
                      {item.pricing.currency} ${item.pricing.unitPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">最低起訂量 (MOQ)</p>
                    <p className="text-lg font-semibold text-foreground">
                      {item.pricing.moq.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Price Breaks */}
                {item.pricing.priceBreaks && item.pricing.priceBreaks.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <TrendingDown className="w-3 h-3" />
                      階梯價格
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {item.pricing.priceBreaks.map((pb, idx) => (
                        <div key={idx} className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                          <span className="text-muted-foreground">≥{pb.quantity.toLocaleString()} 件：</span>
                          <span className="font-medium text-foreground ml-1">${pb.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Separator className="my-4" />

              {/* Production Info */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Factory className="w-4 h-4 text-muted-foreground" />
                  生產資訊
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">大貨交期</p>
                      <p className="text-sm font-medium">{item.production.leadTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">樣品交期</p>
                      <p className="text-sm font-medium">{item.production.sampleTime}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">產地</p>
                      <p className="text-sm font-medium">{item.production.origin}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Factory className="w-4 h-4 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-xs text-muted-foreground">月產能</p>
                      <p className="text-sm font-medium">{item.production.capacity}</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Specifications */}
              {item.specifications && Object.keys(item.specifications).length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      產品規格
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {item.specifications.material && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">材質：</span>
                          <span className="font-medium">{item.specifications.material}</span>
                        </div>
                      )}
                      {item.specifications.size && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">尺寸：</span>
                          <span className="font-medium">{item.specifications.size}</span>
                        </div>
                      )}
                      {item.specifications.finish && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">表面處理：</span>
                          <span className="font-medium">{item.specifications.finish}</span>
                        </div>
                      )}
                      {item.specifications.weight && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">重量：</span>
                          <span className="font-medium">{item.specifications.weight}</span>
                        </div>
                      )}
                      {item.specifications.thickness && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">厚度：</span>
                          <span className="font-medium">{item.specifications.thickness}</span>
                        </div>
                      )}
                      {item.specifications.tensileStrength && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">拉力：</span>
                          <span className="font-medium">{item.specifications.tensileStrength}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* Available Colors */}
              {item.availableColors && item.availableColors.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Palette className="w-4 h-4 text-muted-foreground" />
                      可選顏色
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {item.availableColors.map((color, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {color}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* Applications */}
              {item.applications && item.applications.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Shirt className="w-4 h-4 text-muted-foreground" />
                      適用範圍
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {item.applications.map((app, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {app}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* Certifications */}
              {item.certifications && item.certifications.length > 0 && (
                <>
                  <div className="space-y-3">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      認證標準
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {item.certifications.map((cert, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-green-500/5 border-green-500/30 text-green-700 dark:text-green-400">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-4" />
                </>
              )}

              {/* Metadata */}
              <div className="grid grid-cols-2 gap-4">
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
                <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium mb-2">
                    <Box className="w-4 h-4 text-primary" />
                    3D 模型資訊
                  </div>
                  <p className="text-xs text-muted-foreground">
                    此產品提供 3D 模型檔案，可於詳細頁面中查看互動式 3D 預覽。
                  </p>
                </div>
              )}

              <Separator className="my-4" />

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  className="w-full"
                  onClick={() => onOpenChange(false)}
                >
                  關閉
                </Button>
              </div>
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickView;