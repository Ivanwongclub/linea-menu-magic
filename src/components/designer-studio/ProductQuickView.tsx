import { useState, Suspense } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls, Center } from "@react-three/drei";
import { 
  Box, Globe, Lock, Calendar, Tag, Layers, X, 
  DollarSign, Package, Clock, Factory, Award, 
  Palette, Shirt, MapPin, TrendingDown, FileText,
  RotateCcw, Sun, Moon, Image
} from "lucide-react";
import { LibraryItem, categoryLabels } from "@/data/mockLibraryData";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import QuickRFQDialog from "./QuickRFQDialog";
import * as THREE from "three";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";

interface ProductQuickViewProps {
  item: LibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// 3D Models for preview
const ButtonModel = () => (
  <group>
    <mesh position={[0, 0, 0]} castShadow>
      <cylinderGeometry args={[0.9, 0.9, 0.15, 64]} />
      <meshStandardMaterial color="#C4A052" metalness={0.8} roughness={0.2} />
    </mesh>
    <mesh position={[0, 0.08, 0]} castShadow>
      <torusGeometry args={[0.85, 0.05, 16, 64]} />
      <meshStandardMaterial color="#D4B062" metalness={0.9} roughness={0.1} />
    </mesh>
    {[[-0.3, 0, -0.3], [0.3, 0, -0.3], [-0.3, 0, 0.3], [0.3, 0, 0.3]].map((pos, i) => (
      <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.12, 0.03, 16, 32]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>
    ))}
  </group>
);

const ZipperModel = () => (
  <group>
    <mesh position={[0, 0, 0]} castShadow>
      <boxGeometry args={[0.4, 1.2, 0.1]} />
      <meshStandardMaterial color="#888888" metalness={0.9} roughness={0.1} />
    </mesh>
    <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <torusGeometry args={[0.25, 0.05, 16, 32]} />
      <meshStandardMaterial color="#999999" metalness={0.9} roughness={0.1} />
    </mesh>
    <mesh position={[0, -0.3, 0]} castShadow>
      <boxGeometry args={[0.6, 0.5, 0.15]} />
      <meshStandardMaterial color="#777777" metalness={0.85} roughness={0.15} />
    </mesh>
  </group>
);

const HardwareModel = () => (
  <group>
    <mesh rotation={[0, 0, Math.PI / 2]}>
      <torusGeometry args={[0.6, 0.08, 16, 32, Math.PI]} />
      <meshStandardMaterial color="#C4A052" metalness={0.9} roughness={0.1} />
    </mesh>
    <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.08, 0.08, 1.2, 32]} />
      <meshStandardMaterial color="#C4A052" metalness={0.9} roughness={0.1} />
    </mesh>
  </group>
);

const AutoRotate = ({ children, autoRotate }: { children: React.ReactNode; autoRotate: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });
  return <group ref={groupRef}>{children}</group>;
};

const MiniScene = ({ modelType, autoRotate, lightMode }: { modelType: string; autoRotate: boolean; lightMode: boolean }) => {
  const getModel = () => {
    switch (modelType) {
      case 'zippers': return <ZipperModel />;
      case 'hardware': return <HardwareModel />;
      default: return <ButtonModel />;
    }
  };

  return (
    <>
      <ambientLight intensity={lightMode ? 0.6 : 0.3} />
      <directionalLight position={[5, 5, 5]} intensity={lightMode ? 1.2 : 0.8} castShadow />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      <Environment preset={lightMode ? "studio" : "night"} />
      <Center>
        <AutoRotate autoRotate={autoRotate}>
          <PresentationControls
            global
            config={{ mass: 2, tension: 500 }}
            snap={{ mass: 4, tension: 1500 }}
            polar={[-Math.PI / 3, Math.PI / 3]}
            azimuth={[-Math.PI / 1.4, Math.PI / 2]}
          >
            {getModel()}
          </PresentationControls>
        </AutoRotate>
      </Center>
      <ContactShadows position={[0, -0.8, 0]} opacity={0.5} scale={3} blur={2.5} far={4} />
      <OrbitControls enablePan enableZoom enableRotate minDistance={1.5} maxDistance={6} />
    </>
  );
};

const ProductQuickView = ({ item, open, onOpenChange }: ProductQuickViewProps) => {
  const [showRFQDialog, setShowRFQDialog] = useState(false);
  const [show3D, setShow3D] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightMode, setLightMode] = useState(true);

  if (!item) return null;

  return (
    <>
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
            {/* Image/3D Section */}
            <div className="relative bg-muted aspect-square md:aspect-auto md:min-h-[500px]">
              {show3D && item.modelUrl ? (
                <div className="w-full h-full relative">
                  <Canvas
                    shadows
                    camera={{ position: [0, 1.5, 3], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                  >
                    <Suspense fallback={null}>
                      <MiniScene modelType={item.category} autoRotate={autoRotate} lightMode={lightMode} />
                    </Suspense>
                  </Canvas>
                  
                  {/* 3D Controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => setAutoRotate(!autoRotate)}
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${autoRotate ? 'text-primary' : ''}`} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => setLightMode(!lightMode)}
                    >
                      {lightMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={() => setShow3D(false)}
                    >
                      <Image className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  
                  <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
                    拖曳旋轉 • 滾輪縮放
                  </div>
                </div>
              ) : (
                <>
                  <img
                    src={item.thumbnailUrl || '/placeholder.svg'}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.modelUrl && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-4 left-4 gap-2"
                      onClick={() => setShow3D(true)}
                    >
                      <Box className="w-4 h-4" />
                      查看 3D 模型
                    </Button>
                  )}
                </>
              )}
              
              {item.modelUrl && !show3D && (
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
                    className="flex-1 btn-red-glow gap-2"
                    onClick={() => setShowRFQDialog(true)}
                  >
                    <FileText className="w-4 h-4" />
                    建立報價請求
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* RFQ Dialog */}
      <QuickRFQDialog
        open={showRFQDialog}
        onOpenChange={setShowRFQDialog}
        item={item}
      />
    </>
  );
};

export default ProductQuickView;