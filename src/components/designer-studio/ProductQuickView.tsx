import { useState, Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls, Center } from "@react-three/drei";
import {
  Box, Globe, Lock, Calendar, Tag, Layers, X,
  Package, Clock, Factory, Award,
  Palette, Shirt, MapPin, Send,
  RotateCcw, Sun, Moon, Image, Download, File,
  FileCode, FileText
} from "lucide-react";
import type { UserLibraryItem } from "@/features/products/types";
import { format } from "date-fns";
import OBJModel from "./OBJModelLoader";
import * as THREE from "three";

interface ProductQuickViewProps {
  item: UserLibraryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Map the canonical product category slug to a 3D model-type bucket. */
function deriveModelType(categorySlug?: string): 'button' | 'zipper' | 'hardware' {
  if (!categorySlug) return 'hardware';
  if (categorySlug.includes('button')) return 'button';
  if (categorySlug.includes('zipper')) return 'zipper';
  return 'hardware';
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
  const [show3D, setShow3D] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightMode, setLightMode] = useState(true);

  if (!item) return null;

  // P17 T1: consume UserLibraryItem directly — no adapter, no synthetic data.
  const p = item.product;
  const displayName = item.custom_name || p?.name_en || p?.name || 'Untitled';
  const itemCode = p?.item_code ?? '';
  const slug = p?.slug ?? itemCode;
  const modelUrl = p?.model_url;
  const modelType = deriveModelType(p?.primary_category?.slug ?? p?.categories?.[0]?.slug);
  const description = p?.description_en || p?.description;
  const isPublic = p?.is_public ?? true;
  const teamName = item.team_name;
  const categoryName = p?.primary_category?.name ?? p?.categories?.[0]?.name;
  const specs = (item.custom_specs ?? p?.specifications ?? {}) as Record<string, unknown>;
  const production = (p?.production ?? {}) as Record<string, string>;
  const colorOptions = Array.isArray(specs.color_options) ? (specs.color_options as string[]) : [];
  const applications = p?.industries?.map(i => i.name) ?? [];
  const certifications = p?.certifications ?? [];
  const downloads = item.downloadable_files ?? [];
  const images = p?.images ?? [];
  const primaryImage = images.find(img => img.is_primary)?.url ?? images[0]?.url ?? p?.thumbnail_url;

  // P14: workspace lead capture flows through the real contact form, not a mock RFQ dialog.
  const contactQuoteHref = `/contact?product=${encodeURIComponent(slug)}&source=workspace`;

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
            <span className="text-sm font-medium text-foreground truncate">{displayName}</span>
          </div>

          <div className="grid md:grid-cols-2 gap-0">
            {/* Image/3D Section */}
            <div className="relative bg-muted aspect-square md:aspect-auto md:min-h-[500px]">
              {show3D && modelUrl ? (
                <div className="w-full h-full relative">
                  <Canvas
                    shadows
                    camera={{ position: [0, 1.5, 3], fov: 45 }}
                    gl={{ antialias: true, alpha: true }}
                  >
                    <Suspense fallback={null}>
                      <MiniScene modelType={modelType} autoRotate={autoRotate} lightMode={lightMode} modelUrl={modelUrl} />
                    </Suspense>
                  </Canvas>
                  
                  {/* 3D Controls */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border px-3 py-1.5">
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
                    src={primaryImage || '/placeholder.svg'}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                  {modelUrl && (
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
              
              {modelUrl && !show3D && (
                <Badge variant="default" className="absolute top-4 left-4">
                  <Box className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} />
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
                    {categoryName && (
                      <Badge variant="outline" className="text-xs">
                        {categoryName}
                      </Badge>
                    )}
                    {isPublic ? (
                      <Badge variant="secondary" className="text-xs gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1.5 border-foreground text-foreground">
                        <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
                        <Lock className="w-3 h-3" strokeWidth={1.5} />
                        Exclusive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground font-mono">{itemCode}</p>
                  <h2 className="text-2xl font-semibold text-foreground">{displayName}</h2>
                  {p?.name && p.name !== displayName && (
                    <p className="text-sm text-muted-foreground">{p.name}</p>
                  )}
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
                    {description || '—'}
                  </p>
                </div>

                {/* P17 T1.2: Pricing block removed entirely — no real pricing source. */}

                <Separator className="my-4" />

                {/* Production Info — only render fields the product actually has */}
                {(production.leadTime || production.sampleTime || production.origin || production.capacity) && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Factory className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        Production Info
                      </h3>
                      <div className="grid grid-cols-2 gap-3">
                        {production.leadTime && (
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground mt-0.5" strokeWidth={1.5} />
                            <div>
                              <p className="text-xs text-muted-foreground">Lead Time</p>
                              <p className="text-sm font-medium">{production.leadTime}</p>
                            </div>
                          </div>
                        )}
                        {production.sampleTime && (
                          <div className="flex items-start gap-2">
                            <Package className="w-4 h-4 text-muted-foreground mt-0.5" strokeWidth={1.5} />
                            <div>
                              <p className="text-xs text-muted-foreground">Sample Time</p>
                              <p className="text-sm font-medium">{production.sampleTime}</p>
                            </div>
                          </div>
                        )}
                        {production.origin && (
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" strokeWidth={1.5} />
                            <div>
                              <p className="text-xs text-muted-foreground">Origin</p>
                              <p className="text-sm font-medium">{production.origin}</p>
                            </div>
                          </div>
                        )}
                        {production.capacity && (
                          <div className="flex items-start gap-2">
                            <Factory className="w-4 h-4 text-muted-foreground mt-0.5" strokeWidth={1.5} />
                            <div>
                              <p className="text-xs text-muted-foreground">Monthly Capacity</p>
                              <p className="text-sm font-medium">{production.capacity}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <Separator className="my-4" />
                  </>
                )}

                {/* Specifications — render any string-valued spec, not a hardcoded whitelist */}
                {(() => {
                  const specEntries = Object.entries(specs).filter(
                    ([key, value]) =>
                      key !== 'color_options' &&
                      key !== 'size_options' &&
                      (typeof value === 'string' || typeof value === 'number') &&
                      String(value).length > 0,
                  );
                  if (specEntries.length === 0) return null;
                  return (
                    <>
                      <div className="space-y-3">
                        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                          <Tag className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                          Product Specifications
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                          {specEntries.map(([key, value]) => (
                            <div key={key} className="text-sm">
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}: </span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <Separator className="my-4" />
                    </>
                  );
                })()}

                {/* Available Colors — from product.specifications.color_options */}
                {colorOptions.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Palette className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        Available Colors
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {colorOptions.map((color, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator className="my-4" />
                  </>
                )}

                {/* Applications — from product.industries */}
                {applications.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Shirt className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        Applications
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {applications.map((app, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {app}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator className="my-4" />
                  </>
                )}

                {/* Certifications — from product.certifications */}
                {certifications.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Award className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        Certifications
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {certifications.map((cert) => (
                          <Badge key={cert.id} variant="outline" className="text-xs gap-1.5 border-foreground text-foreground">
                            <span className="w-1.5 h-1.5 bg-foreground rounded-full" />
                            {cert.abbreviation || cert.name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Separator className="my-4" />
                  </>
                )}

                {/* Downloadable Files — from UserLibraryItem.downloadable_files */}
                {downloads.length > 0 && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Download className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        Downloads
                      </h3>
                      <div className="space-y-2">
                        {downloads.map((file) => {
                          const getFileIcon = () => {
                            switch (file.type) {
                              case 'obj':
                              case 'step':
                                return <Box className="w-4 h-4 text-foreground" strokeWidth={1.5} />;
                              case 'pdf':
                                return <FileText className="w-4 h-4 text-foreground" strokeWidth={1.5} />;
                              case 'dwg':
                                return <FileCode className="w-4 h-4 text-foreground" strokeWidth={1.5} />;
                              default:
                                return <File className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />;
                            }
                          };

                          return (
                            <a
                              key={file.id}
                              href={file.url}
                              download={file.name}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-start gap-3 p-3 bg-secondary border border-border hover:border-foreground transition-colors group"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="p-2 bg-background border border-border">
                                {getFileIcon()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <Badge variant="outline" className="text-xs uppercase">
                                    {file.type}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">{file.size}</span>
                                </div>
                              </div>
                              <Download
                                className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity self-center"
                                strokeWidth={1.5}
                              />
                            </a>
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
                      <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                      Added
                    </div>
                    <p className="text-sm font-medium">
                      {format(new Date(item.added_at), 'yyyy/MM/dd')}
                    </p>
                  </div>

                  {teamName && !isPublic && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Team
                      </div>
                      <p className="text-sm font-medium">{teamName}</p>
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
                  <Button asChild className="flex-1 gap-2">
                    <Link to={contactQuoteHref} onClick={() => onOpenChange(false)}>
                      <Send className="w-4 h-4" />
                      Request Quote
                    </Link>
                  </Button>
                </div>
              </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductQuickView;