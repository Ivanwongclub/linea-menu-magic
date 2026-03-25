import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Download, Globe, Lock, ZoomIn, Package, Clock, MapPin, Award, Palette, Layers } from "lucide-react";
import { LibraryItem, categoryLabels } from "@/features/products/legacyTypes";
import Model3DViewer from "./Model3DViewer";
import { cn } from "@/lib/utils";

interface LibraryItemDetailProps {
  item: LibraryItem;
  onBack: () => void;
}

const LibraryItemDetail = ({ item, onBack }: LibraryItemDetailProps) => {
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
      {/* Sticky navigation bar with back button + breadcrumb */}
      <div className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex items-center gap-4">
          {/* Clear back button */}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onBack} 
            className="gap-2 h-8 text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="h-4 w-px bg-border shrink-0" />
          
          {/* Breadcrumb for context */}
          <Breadcrumb className="hidden sm:block">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink onClick={onBack} className="cursor-pointer hover:text-foreground text-sm">
                  Component Library
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-sm truncate max-w-[200px]">{item.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          {/* Mobile: Just show item name */}
          <span className="sm:hidden text-sm text-foreground truncate">{item.itemCode}</span>
        </div>
      </div>

      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline">{categoryLabels[item.category]}</Badge>
                {item.isPublic ? (
                  <Badge variant="secondary" className="gap-1">
                    <Globe className="w-3 h-3" />
                    Public
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
                    <Lock className="w-3 h-3" />
                    {item.teamName || 'Team Exclusive'}
                  </Badge>
                )}
              </div>
              <h1 className="text-2xl font-semibold text-foreground">{item.name}</h1>
              <p className="text-muted-foreground font-mono">{item.itemCode}</p>
            </div>
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
                  <CardTitle className="text-lg">3D Model Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <Model3DViewer hasModel={true} modelType={getModelType(item.category)} modelUrl={item.modelUrl} />
                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" className="gap-2 flex-1">
                      <Download className="w-4 h-4" />
                      Download OBJ
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
                                alt={`${item.name} - Image ${index + 1}`}
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
                            alt={`Thumbnail ${index + 1}`}
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
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Product Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                
                {/* Applications */}
                {item.applications && item.applications.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">Applications</p>
                    <div className="flex flex-wrap gap-2">
                      {item.applications.map((app) => (
                        <Badge key={app} variant="secondary" className="text-xs">{app}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specifications */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  Specifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  {item.specifications.material && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Material</dt>
                      <dd className="font-medium text-right">{item.specifications.material}</dd>
                    </div>
                  )}
                  {item.specifications.size && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Size</dt>
                        <dd className="font-medium text-right">{item.specifications.size}</dd>
                      </div>
                    </>
                  )}
                  {item.specifications.weight && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Weight</dt>
                        <dd className="font-medium text-right">{item.specifications.weight}</dd>
                      </div>
                    </>
                  )}
                  {item.specifications.thickness && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Thickness</dt>
                        <dd className="font-medium text-right">{item.specifications.thickness}</dd>
                      </div>
                    </>
                  )}
                  {item.specifications.finish && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Finish</dt>
                        <dd className="font-medium text-right">{item.specifications.finish}</dd>
                      </div>
                    </>
                  )}
                  {item.specifications.tensileStrength && (
                    <>
                      <Separator />
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Tensile Strength</dt>
                        <dd className="font-medium text-right">{item.specifications.tensileStrength}</dd>
                      </div>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Pricing & MOQ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  價格與訂購
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground">單價</dt>
                    <dd className="font-semibold text-lg text-foreground">
                      {item.pricing.currency} ${item.pricing.unitPrice.toFixed(3)}
                    </dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">最低訂購量 (MOQ)</dt>
                    <dd className="font-medium">{item.pricing.moq.toLocaleString()} 件</dd>
                  </div>
                  {item.pricing.priceBreaks && item.pricing.priceBreaks.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <dt className="text-muted-foreground mb-2">量價階梯</dt>
                        <dd className="space-y-1">
                          {item.pricing.priceBreaks.map((pb, idx) => (
                            <div key={idx} className="flex justify-between text-sm bg-muted/50 rounded px-2 py-1">
                              <span>≥ {pb.quantity.toLocaleString()} 件</span>
                              <span className="font-medium">${pb.price.toFixed(3)}</span>
                            </div>
                          ))}
                        </dd>
                      </div>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>

            {/* Production Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  生產資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">交貨時間</dt>
                    <dd className="font-medium">{item.production.leadTime}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">樣品時間</dt>
                    <dd className="font-medium">{item.production.sampleTime}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      產地
                    </dt>
                    <dd className="font-medium">{item.production.origin}</dd>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">月產能</dt>
                    <dd className="font-medium">{item.production.capacity}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Available Colors */}
            {item.availableColors && item.availableColors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    可選顏色
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.availableColors.map((color) => (
                      <Badge key={color} variant="outline" className="text-xs">{color}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Certifications */}
            {item.certifications && item.certifications.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-4 h-4" />
                    認證與標準
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {item.certifications.map((cert) => (
                      <Badge key={cert} variant="secondary" className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Metadata */}
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
