import { useState, Suspense, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls, Center } from "@react-three/drei";
import { 
  Box, Globe, Lock, Calendar, Tag, Layers, X, 
  DollarSign, Package, Clock, Factory, Award, 
  Palette, Shirt, MapPin, TrendingDown, FileText,
  RotateCcw, Sun, Moon, Image, Download, File,
  FileType, FileCode
} from "lucide-react";
import { LibraryItem, categoryLabels } from "@/features/products/legacyTypes";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import QuickRFQDialog from "./QuickRFQDialog";
import OBJModel from "./OBJModelLoader";
import * as THREE from "three";

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

const MiniScene = ({ modelType, autoRotate, lightMode, modelUrl }: { modelType: string; autoRotate: boolean; lightMode: boolean; modelUrl?: string }) => {
  const getModel = () => {
    if (modelUrl) {
      return <OBJModel url={modelUrl} autoRotate={autoRotate} />;
    }
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
        {modelUrl ? (
          getModel()
        ) : (
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
        )}
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
        <DialogContent className="max-w-6xl p-0 overflow-hidden max-h-[95vh] md:max-h-[90vh]">
          {/* Mobile Header with Back Button */}
          <div className="sticky top-0 z-10 flex items-center gap-3 p-4 bg-background border-b md:hidden">
            <button
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
              <span>Close</span>
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
                      <MiniScene modelType={item.category} autoRotate={autoRotate} lightMode={lightMode} modelUrl={item.modelUrl} />
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
                    Drag to rotate · Scroll to zoom
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
                      View 3D Model
                    </Button>
                  )}
                </>
              )}
              
              {item.modelUrl && !show3D && (
                <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                  <Box className="w-3.5 h-3.5 mr-1.5" />
                  3D Model Available
                </Badge>
              )}
            </div>

            {/* Details Section */}
            <div className="flex-1 md:h-[85vh] overflow-hidden flex flex-col min-h-0 max-h-[60vh] md:max-h-none">
              {/* Sticky Header */}
              <div className="bg-background p-6 pb-4 border-b flex-shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {categoryLabels[item.category]}
                    </Badge>
                    {item.isPublic ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1 border-amber-500/50 text-amber-700 dark:text-amber-400">
                        <Lock className="w-3 h-3" />
                        Exclusive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{item.itemCode}</p>
                  <h2 className="text-2xl font-semibold text-foreground">{item.name}</h2>
                  <p className="text-sm text-muted-foreground">{item.nameEn}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 min-h-0">
                <div className="p-6 pt-4 flex flex-col">

                {/* Description */}
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                    <Layers className="w-4 h-4 text-muted-foreground" />
                    Product Description
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
                    Pricing & Quantity
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Unit Price</p>
                      <p className="text-lg font-semibold text-foreground">
                        {item.pricing.currency} ${item.pricing.unitPrice.toFixed(2)}
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">MOQ</p>
                      <p className="text-lg font-semibold text-foreground">
                        {item.pricing.moq.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {item.pricing.priceBreaks && item.pricing.priceBreaks.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <TrendingDown className="w-3 h-3" />
                        Volume Pricing
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {item.pricing.priceBreaks.map((pb, idx) => (
                          <div key={idx} className="px-3 py-1.5 bg-primary/5 border border-primary/20 rounded-md text-xs">
                            <span className="text-muted-foreground">≥{pb.quantity.toLocaleString()} pcs:</span>
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
                    Production Info
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Lead Time</p>
                        <p className="text-sm font-medium">{item.production.leadTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Package className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Sample Time</p>
                        <p className="text-sm font-medium">{item.production.sampleTime}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Origin</p>
                        <p className="text-sm font-medium">{item.production.origin}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <Factory className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-xs text-muted-foreground">Monthly Capacity</p>
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
                        Product Specifications
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {item.specifications.material && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Material: </span>
                            <span className="font-medium">{item.specifications.material}</span>
                          </div>
                        )}
                        {item.specifications.size && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Size: </span>
                            <span className="font-medium">{item.specifications.size}</span>
                          </div>
                        )}
                        {item.specifications.finish && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Finish: </span>
                            <span className="font-medium">{item.specifications.finish}</span>
                          </div>
                        )}
                        {item.specifications.weight && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Weight: </span>
                            <span className="font-medium">{item.specifications.weight}</span>
                          </div>
                        )}
                        {item.specifications.thickness && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Thickness: </span>
                            <span className="font-medium">{item.specifications.thickness}</span>
                          </div>
                        )}
                        {item.specifications.tensileStrength && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Tensile: </span>
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
                        Available Colors
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
                        Applications
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
                        Certifications
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

                {/* Downloadable Files */}
                {item.downloadableFiles && item.downloadableFiles.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Download className="w-4 h-4 text-muted-foreground" />
                        Downloads
                      </h3>
                      <div className="space-y-2">
                        {item.downloadableFiles.map((file) => {
                          const getFileIcon = () => {
                            switch (file.fileType) {
                              case 'obj':
                              case 'stl':
                              case 'step':
                                return <Box className="w-4 h-4 text-blue-500" />;
                              case 'pdf':
                                return <FileText className="w-4 h-4 text-red-500" />;
                              case 'ai':
                              case 'dwg':
                                return <FileCode className="w-4 h-4 text-orange-500" />;
                              default:
                                return <File className="w-4 h-4 text-muted-foreground" />;
                            }
                          };
                          
                          return (
                            <div 
                              key={file.id}
                              className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg hover:bg-muted/80 transition-colors group"
                            >
                              <div className="p-2 bg-background rounded-md shadow-sm">
                                {getFileIcon()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                  {file.description}
                                </p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge variant="outline" className="text-xs uppercase">
                                    {file.fileType}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{file.fileSize}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Mock download - in real app would trigger actual download
                                  window.open(file.url, '_blank');
                                }}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </div>
                          );
                        })}
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
                      Created
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(item.createdAt), 'yyyy/MM/dd')}
                    </p>
                  </div>

                  {item.teamName && !item.isPublic && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" />
                        Team
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
                    Close
                  </Button>
                  <Button
                    className="flex-1 gap-2"
                    onClick={() => setShowRFQDialog(true)}
                  >
                    <FileText className="w-4 h-4" />
                    Request Quote
                  </Button>
                </div>
              </div>
              </ScrollArea>
            </div>
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