import { Suspense, useState, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  OrbitControls,
  Environment,
  ContactShadows,
  Center,
  useProgress,
  Html,
} from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { X, RotateCcw, Maximize2, ChevronLeft, ChevronRight } from "lucide-react";

// ── Model catalogue ──────────────────────────────────────────────────────────

interface ObjModel {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  material: {
    color: string;
    metalness: number;
    roughness: number;
  };
  camera: [number, number, number];
}

const MODELS: ObjModel[] = [
  {
    id: "button",
    title: "4-Hole Metal Button",
    subtitle: "Brass alloy · Die-cast · Custom engraving available",
    file: "/models/button-4hole.obj",
    material: { color: "#C8A84B", metalness: 0.85, roughness: 0.18 },
    camera: [0, 2, 3.5],
  },
  {
    id: "snap",
    title: "Snap Button",
    subtitle: "Zinc alloy · Polished finish · 15–25mm diameter range",
    file: "/models/snap-button.obj",
    material: { color: "#B0B0B0", metalness: 0.9, roughness: 0.12 },
    camera: [0, 1.5, 3.5],
  },
  {
    id: "buckle",
    title: "D-Ring Buckle",
    subtitle: "Cast zinc · Antique brass or nickel finish",
    file: "/models/d-ring-buckle.obj",
    material: { color: "#A08030", metalness: 0.8, roughness: 0.25 },
    camera: [0, 1.8, 4],
  },
  {
    id: "eyelet",
    title: "Eyelet / Grommet",
    subtitle: "Brass or steel · Various diameters · Setter-ready",
    file: "/models/eyelet-grommet.obj",
    material: { color: "#D4AF70", metalness: 0.88, roughness: 0.15 },
    camera: [0, 2.5, 4],
  },
];

// ── Inner OBJ mesh ───────────────────────────────────────────────────────────

const ObjMesh = ({
  url,
  color,
  metalness,
  roughness,
  autoRotate,
}: {
  url: string;
  color: string;
  metalness: number;
  roughness: number;
  autoRotate: boolean;
}) => {
  const obj = useLoader(OBJLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const clone = obj.clone(true);
    const mat = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = mat;
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) clone.scale.setScalar(1.8 / maxDim);
    box.setFromObject(clone);
    const centre = box.getCenter(new THREE.Vector3());
    clone.position.sub(centre);
    return clone;
  }, [obj, color, metalness, roughness]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.4;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={scene} />
      </Center>
    </group>
  );
};

// ── Progress bar ─────────────────────────────────────────────────────────────

const LoadingOverlay = () => {
  const { progress, active } = useProgress();
  if (!active && progress === 100) return null;
  return (
    <Html center>
      <div className="flex flex-col items-center gap-3 select-none">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
        <span className="text-white/60 text-xs tracking-wide">Loading 3D model</span>
        <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-white/70 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-white/40 text-[10px]">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
};

// ── 3D Canvas scene ──────────────────────────────────────────────────────────

const ModelScene = ({
  model,
  autoRotate,
}: {
  model: ObjModel;
  autoRotate: boolean;
}) => (
  <>
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 8, 4]} intensity={1.2} castShadow />
    <directionalLight position={[-3, 4, -2]} intensity={0.4} />
    <Environment preset="studio" />
    <ContactShadows position={[0, -1, 0]} opacity={0.35} blur={2} far={4} />
    <ObjMesh
      url={model.file}
      color={model.material.color}
      metalness={model.material.metalness}
      roughness={model.material.roughness}
      autoRotate={autoRotate}
    />
    <OrbitControls enablePan={false} minDistance={2} maxDistance={8} />
  </>
);

// ── Thumbnail card ───────────────────────────────────────────────────────────

const ThumbCanvas = ({ model }: { model: ObjModel }) => (
  <Canvas
    camera={{ position: [0, 1.5, 3], fov: 40 }}
    style={{ width: "100%", height: "100%" }}
    gl={{ antialias: true, alpha: true }}
  >
    <ambientLight intensity={0.6} />
    <directionalLight position={[3, 5, 3]} intensity={0.8} />
    <Environment preset="studio" />
    <Suspense fallback={null}>
      <ObjMesh
        url={model.file}
        color={model.material.color}
        metalness={model.material.metalness}
        roughness={model.material.roughness}
        autoRotate
      />
    </Suspense>
  </Canvas>
);

// ── Main Gallery popup ───────────────────────────────────────────────────────

interface ObjGalleryProps {
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function ObjGallery({ open, onClose, initialIndex = 0 }: ObjGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const model = MODELS[activeIndex];

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + MODELS.length) % MODELS.length);
    setAutoRotate(true);
  }, []);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % MODELS.length);
    setAutoRotate(true);
  }, []);

  const handleKey = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    },
    [onClose, prev, next]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onKeyDown={handleKey}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 flex flex-col bg-[#111] border border-white/10 rounded-lg shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "w-screen h-screen rounded-none"
            : "w-[90vw] max-w-5xl h-[85vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-white/10">
          <div className="min-w-0">
            <span className="text-[11px] text-white/40 tracking-widest uppercase">
              3D Prototype · {activeIndex + 1} / {MODELS.length}
            </span>
            <h3 className="text-[17px] font-semibold text-white mt-0.5 truncate">
              {model.title}
            </h3>
            <p className="text-[12px] text-white/50 mt-0.5">{model.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={() => setAutoRotate((v) => !v)}
              title={autoRotate ? "Pause rotation" : "Resume rotation"}
              className={`w-8 h-8 flex items-center justify-center rounded-sm border transition-colors duration-150 ${
                autoRotate
                  ? "border-white/30 text-white bg-white/10"
                  : "border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setIsFullscreen((v) => !v)}
              title="Toggle fullscreen"
              className="w-8 h-8 flex items-center justify-center rounded-sm border border-white/10 text-white/40 hover:border-white/20 hover:text-white/70 transition-colors duration-150"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-sm border border-white/10 text-white/40 hover:border-white/20 hover:text-white/70 transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main 3D viewport */}
        <div className="flex-1 relative min-h-0">
          <Canvas
            camera={{ position: model.camera, fov: 40 }}
            shadows
            gl={{ antialias: true, alpha: true }}
            className="!absolute inset-0"
          >
            <Suspense fallback={<LoadingOverlay />}>
              <ModelScene model={model} autoRotate={autoRotate} />
            </Suspense>
          </Canvas>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/60 hover:bg-black/70 hover:text-white transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 border border-white/10 text-white/60 hover:bg-black/70 hover:text-white transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          {/* Interaction hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-white/30 pointer-events-none select-none">
            Drag to rotate · Scroll to zoom
          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex items-center gap-3 px-5 py-3 border-t border-white/10 bg-black/40 overflow-x-auto">
          {MODELS.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => { setActiveIndex(idx); setAutoRotate(true); }}
              className={`relative flex-shrink-0 w-[88px] h-[66px] rounded-sm overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? "border-white/70 scale-105"
                  : "border-white/10 hover:border-white/30 opacity-60 hover:opacity-90"
              }`}
            >
              <div className="w-full h-full bg-[#1a1a1a]">
                <ThumbCanvas model={m} />
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent px-1 py-0.5">
                <span className="text-[9px] text-white/70 leading-none truncate block">
                  {m.title}
                </span>
              </div>
            </button>
          ))}
          <div className="flex flex-col gap-0.5 ml-auto flex-shrink-0 pl-4">
            <span className="text-[10px] text-white/25">← → to navigate</span>
            <span className="text-[10px] text-white/25">Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
