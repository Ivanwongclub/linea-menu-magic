import { Suspense, useRef, useState, Component, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, PresentationControls, Center, Html, useProgress } from "@react-three/drei";
import { Box, RotateCcw, Maximize2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import * as THREE from "three";
import OBJModel from "./OBJModelLoader";

// Error boundary to catch OBJ load failures gracefully
class CanvasErrorBoundary extends Component<{ children: ReactNode; onError: () => void }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch() { this.props.onError(); }
  render() { return this.state.hasError ? null : this.props.children; }
}

interface Model3DViewerProps {
  hasModel: boolean;
  modelType?: 'button' | 'zipper' | 'lace' | 'hardware';
  modelUrl?: string;
}

// Demo 3D Button Model
const ButtonModel = () => {
  const meshRef = useRef<THREE.Group>(null);
  
  return (
    <group ref={meshRef}>
      {/* Main button body */}
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.15, 64]} />
        <meshStandardMaterial 
          color="#C4A052"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
      
      {/* Raised rim */}
      <mesh position={[0, 0.08, 0]} castShadow>
        <torusGeometry args={[0.85, 0.05, 16, 64]} />
        <meshStandardMaterial 
          color="#D4B062"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Four holes */}
      {[
        [-0.3, 0, -0.3],
        [0.3, 0, -0.3],
        [-0.3, 0, 0.3],
        [0.3, 0, 0.3],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.12, 0.03, 16, 32]} />
          <meshStandardMaterial 
            color="#1a1a1a"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>
      ))}
      
      {/* Center depression */}
      <mesh position={[0, 0.05, 0]} castShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.12, 64]} />
        <meshStandardMaterial 
          color="#B89842"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
};

// Demo Zipper Pull Model
const ZipperModel = () => {
  return (
    <group>
      {/* Zipper pull body */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[0.4, 1.2, 0.1]} />
        <meshStandardMaterial 
          color="#888888"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Pull ring */}
      <mesh position={[0, 0.8, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.25, 0.05, 16, 32]} />
        <meshStandardMaterial 
          color="#999999"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Slider body */}
      <mesh position={[0, -0.3, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.15]} />
        <meshStandardMaterial 
          color="#777777"
          metalness={0.85}
          roughness={0.15}
        />
      </mesh>
    </group>
  );
};

// Demo D-Ring Hardware Model
const HardwareModel = () => {
  return (
    <group>
      {/* D-Ring */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.6, 0.08, 16, 32, Math.PI]} />
        <meshStandardMaterial 
          color="#C4A052"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
      
      {/* Straight bar */}
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 32]} />
        <meshStandardMaterial 
          color="#C4A052"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>
    </group>
  );
};

// Auto-rotating wrapper
const AutoRotate = ({ children, autoRotate }: { children: React.ReactNode; autoRotate: boolean }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });
  
  return <group ref={groupRef}>{children}</group>;
};

const Scene = ({ modelType, autoRotate, lightMode, modelUrl }: { modelType: string; autoRotate: boolean; lightMode: boolean; modelUrl?: string }) => {
  const getModel = () => {
    if (modelUrl) {
      return <OBJModel url={modelUrl} autoRotate={autoRotate} />;
    }
    switch (modelType) {
      case 'zipper':
        return <ZipperModel />;
      case 'hardware':
        return <HardwareModel />;
      default:
        return <ButtonModel />;
    }
  };

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={lightMode ? 0.6 : 0.3} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={lightMode ? 1.2 : 0.8} 
        castShadow 
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      <spotLight 
        position={[0, 5, 0]} 
        angle={0.3} 
        penumbra={1} 
        intensity={lightMode ? 0.8 : 0.5}
        castShadow
      />
      
      {/* Environment for reflections */}
      <Environment preset={lightMode ? "studio" : "night"} />
      
      {/* Model */}
      {modelUrl ? (
        <Center>
          {getModel()}
        </Center>
      ) : (
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
      )}
      
      {/* Shadow */}
      <ContactShadows 
        position={[0, -0.8, 0]} 
        opacity={0.5} 
        scale={3} 
        blur={2.5} 
        far={4}
      />
      
      {/* Orbit Controls */}
      <OrbitControls 
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={0.5}
        maxDistance={10}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 1.5}
      />
    </>
  );
};

// Loading fallback with progress
const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground whitespace-nowrap">
          載入模型中... {progress.toFixed(0)}%
        </p>
      </div>
    </Html>
  );
};

const Model3DViewer = ({ hasModel, modelType = 'button', modelUrl }: Model3DViewerProps) => {
  const [autoRotate, setAutoRotate] = useState(true);
  const [lightMode, setLightMode] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [modelError, setModelError] = useState(false);

  if (!hasModel || modelError) {
    return (
      <div className="aspect-video bg-secondary/50 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-border">
        <Box className="w-12 h-12 text-muted-foreground mb-3" />
        <p className="text-muted-foreground text-sm">
          {modelError ? '3D model could not be loaded' : '等待製造商上傳 3D 模型'}
        </p>
        <p className="text-xs text-muted-foreground/60 text-center px-4 mt-1">
          Contact us to request a 3D sample
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 3D Canvas */}
      <div 
        className={`${isFullscreen ? 'fixed inset-0 z-50' : 'aspect-video'} bg-gradient-to-br from-muted/30 to-muted/60 rounded-lg overflow-hidden relative`}
        onWheel={(e) => e.stopPropagation()}
      >
        <CanvasErrorBoundary onError={() => setModelError(true)}>
          <Canvas
            shadows
            camera={{ position: [0, 1.5, 3], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Suspense fallback={<Loader />}>
              <Scene modelType={modelType} autoRotate={autoRotate} lightMode={lightMode} modelUrl={modelUrl} />
            </Suspense>
          </Canvas>
        </CanvasErrorBoundary>

        {/* Controls Overlay */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-lg">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setAutoRotate(!autoRotate)}
            title={autoRotate ? "停止旋轉" : "自動旋轉"}
          >
            <RotateCcw className={`w-4 h-4 ${autoRotate ? 'text-primary' : ''}`} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setLightMode(!lightMode)}
            title={lightMode ? "暗色環境" : "亮色環境"}
          >
            {lightMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title="全螢幕"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>

        {/* Instructions */}
        <div className="absolute top-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
          拖曳旋轉 • 滾輪縮放 • 右鍵平移
        </div>

        {/* Close fullscreen button */}
        {isFullscreen && (
          <Button 
            variant="outline"
            className="absolute top-4 right-4 z-10"
            onClick={() => setIsFullscreen(false)}
          >
            關閉全螢幕
          </Button>
        )}
      </div>

      {/* Model Info */}
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">模型格式: OBJ</span>
        <span className="text-muted-foreground">檔案大小: 2.4 MB</span>
      </div>
    </div>
  );
};

export default Model3DViewer;
