import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ArrowLeft, FileText, Download, Globe, Lock, ZoomIn } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import Model3DViewer from "./Model3DViewer";
import { cn } from "@/lib/utils";

interface LibraryItemDetailProps {
  item: LibraryItem;
  onBack: () => void;
  onQuickRFQ: (item: LibraryItem) => void;
}

const LibraryItemDetail = ({ item, onBack, onQuickRFQ }: LibraryItemDetailProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  // Generate gallery images from item thumbnail (in real app, these would come from backend)
  const galleryImages = [
    item.thumbnailUrl || '/placeholder.svg',
    item.thumbnailUrl || '/placeholder.svg', // Detail angle
    item.thumbnailUrl || '/placeholder.svg', // Close-up
    item.thumbnailUrl || '/placeholder.svg', // Usage context
  ];

  const getModelType = (category: string): 'button' | 'zipper' | 'hardware' => {
    if (category === 'buttons') return 'button';
    if (category === 'zippers') return 'zipper';
    return 'hardware';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            返回素材庫
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{categoryLabels[item.category]}</Badge>
                {item.isPublic ? (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    公開
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
                    <Lock className="w-3 h-3" />
                    {item.teamName || '團隊專屬'}
                  </Badge>
                )}
              </div>
              <h1 className="font-serif text-2xl font-light text-foreground">{item.name}</h1>
              <p className="text-muted-foreground font-mono">{item.itemCode}</p>
            </div>
            <Button className="btn-red-glow gap-2" onClick={() => onQuickRFQ(item)}>
              <FileText className="w-4 h-4" />
              快速報價請求
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 3D Model Viewer or Image */}
          <div>
            {item.modelUrl ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">3D 模型預覽</CardTitle>
                </CardHeader>
                <CardContent>
                  <Model3DViewer hasModel={true} modelType={getModelType(item.category)} />
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="gap-2 flex-1">
                      <Download className="w-4 h-4" />
                      下載 OBJ 檔案
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="overflow-hidden">
                <CardContent className="p-0">
                  {/* Main Image with Carousel */}
                  <div className="relative">
                    <Carousel className="w-full">
                      <CarouselContent>
                        {galleryImages.map((image, index) => (
                          <CarouselItem key={index}>
                            <div className="aspect-square bg-muted relative group">
                              <img
                                src={image}
                                alt={`${item.name} - 圖片 ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <button className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors">
                                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <CarouselPrevious className="left-4" />
                      <CarouselNext className="right-4" />
                    </Carousel>
                  </div>
                  
                  {/* Thumbnail Strip */}
                  <div className="p-4 border-t border-border">
                    <div className="flex gap-2 overflow-x-auto">
                      {galleryImages.map((image, index) => (
                        <button
                          key={index}
                          onClick={() => setSelectedImageIndex(index)}
                          className={cn(
                            "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all",
                            selectedImageIndex === index
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-muted-foreground/30"
                          )}
                        >
                          <img
                            src={image}
                            alt={`縮圖 ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Item Details */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">產品描述</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">規格參數</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  {item.specifications.material && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">材質</dt>
                      <dd className="font-medium">{item.specifications.material}</dd>
                    </div>
                  )}
                  {item.specifications.size && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">尺寸</dt>
                        <dd className="font-medium">{item.specifications.size}</dd>
                      </div>
                    </>
                  )}
                  {item.specifications.color && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">顏色</dt>
                        <dd className="font-medium">{item.specifications.color}</dd>
                      </div>
                    </>
                  )}
                  {item.specifications.finish && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">表面處理</dt>
                        <dd className="font-medium">{item.specifications.finish}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">其他資訊</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">建立日期</dt>
                    <dd className="font-medium">
                      {new Date(item.createdAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">最後更新</dt>
                    <dd className="font-medium">
                      {new Date(item.updatedAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LibraryItemDetail;
