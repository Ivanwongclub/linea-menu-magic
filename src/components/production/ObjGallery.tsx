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

// ── Colour palette ──────────────────────────────────────────────────────────

interface HardwareColour {
  id: string;
  label: string;
  hex: string;
  materialHex: string;
}

const COLOURS: HardwareColour[] = [
  { id: "brass",    label: "Brass",      hex: "#C8A84B", materialHex: "#C8A84B" },
  { id: "silver",   label: "Silver",     hex: "#C2C2C2", materialHex: "#C2C2C2" },
  { id: "gunmetal", label: "Gunmetal",   hex: "#4A4A52", materialHex: "#4A4A52" },
  { id: "rosegold", label: "Rose Gold",  hex: "#C4836A", materialHex: "#C4836A" },
  { id: "black",    label: "Black",      hex: "#1C1C1E", materialHex: "#1C1C1E" },
  { id: "bronze",   label: "Bronze",     hex: "#8B5E3C", materialHex: "#8B5E3C" },
  { id: "ivory",    label: "Ivory",      hex: "#E8E0D0", materialHex: "#E8E0D0" },
  { id: "navy",     label: "Navy",       hex: "#1A2A3A", materialHex: "#1A2A3A" },
];

// ── Finish / surface treatment ───────────────────────────────────────────────

interface HardwareFinish {
  id: string;
  label: string;
  desc: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
}

const FINISHES: HardwareFinish[] = [
  { id: "polished", label: "Polished", desc: "Mirror finish",       metalness: 0.95, roughness: 0.04, clearcoat: 1.0,  clearcoatRoughness: 0.02, envMapIntensity: 1.8 },
  { id: "brushed",  label: "Brushed",  desc: "Directional grain",   metalness: 0.88, roughness: 0.38, clearcoat: 0.15, clearcoatRoughness: 0.3,  envMapIntensity: 1.0 },
  { id: "satin",    label: "Satin",    desc: "Soft sheen",          metalness: 0.82, roughness: 0.22, clearcoat: 0.4,  clearcoatRoughness: 0.15, envMapIntensity: 1.2 },
  { id: "matte",    label: "Matte",    desc: "No reflection",       metalness: 0.55, roughness: 0.82, clearcoat: 0.0,  clearcoatRoughness: 0.0,  envMapIntensity: 0.4 },
  { id: "antique",  label: "Antique",  desc: "Aged patina",         metalness: 0.65, roughness: 0.62, clearcoat: 0.05, clearcoatRoughness: 0.5,  envMapIntensity: 0.6 },
];

const DEFAULT_COLOUR = COLOURS[0];
const DEFAULT_FINISH = FINISHES[0];

// ── DTM (Dye to Match) finishes ─────────────────────────────────────────────

interface DtmFinish {
  id: string;
  label: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
}

const DTM_FINISHES: DtmFinish[] = [
  { id: "enamel",    label: "Enamel",    metalness: 0.05, roughness: 0.15, clearcoat: 1.0, clearcoatRoughness: 0.04, envMapIntensity: 1.4 },
  { id: "rubberize", label: "Rubberize", metalness: 0.0,  roughness: 0.95, clearcoat: 0.0, clearcoatRoughness: 0.0,  envMapIntensity: 0.3 },
  { id: "shiny",     label: "Shiny",     metalness: 0.1,  roughness: 0.08, clearcoat: 1.0, clearcoatRoughness: 0.02, envMapIntensity: 1.6 },
  { id: "matte",     label: "Matte",     metalness: 0.0,  roughness: 0.85, clearcoat: 0.0, clearcoatRoughness: 0.0,  envMapIntensity: 0.4 },
];

// ── Electroplating swatches ─────────────────────────────────────────────────

interface Plating {
  id: string;
  label: string;
  hex: string;
  materialHex: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  envMapIntensity: number;
}

const PLATINGS: Plating[] = [
  { id: "chrome",       label: "Chrome",       hex: "#D8DADC", materialHex: "#D8DADC", metalness: 1.0, roughness: 0.04, clearcoat: 1.0, clearcoatRoughness: 0.02, envMapIntensity: 2.0 },
  { id: "nickel",       label: "Nickel",       hex: "#B8B6AE", materialHex: "#B8B6AE", metalness: 1.0, roughness: 0.12, clearcoat: 0.6, clearcoatRoughness: 0.08, envMapIntensity: 1.6 },
  { id: "gold",         label: "Gold",         hex: "#D4AF37", materialHex: "#D4AF37", metalness: 1.0, roughness: 0.08, clearcoat: 0.8, clearcoatRoughness: 0.04, envMapIntensity: 1.9 },
  { id: "copper",       label: "Copper",       hex: "#B87333", materialHex: "#B87333", metalness: 1.0, roughness: 0.1,  clearcoat: 0.6, clearcoatRoughness: 0.06, envMapIntensity: 1.7 },
  { id: "rose-gold",    label: "Rose Gold",    hex: "#B76E79", materialHex: "#B76E79", metalness: 1.0, roughness: 0.1,  clearcoat: 0.7, clearcoatRoughness: 0.05, envMapIntensity: 1.7 },
  { id: "gunmetal",     label: "Gunmetal",     hex: "#3A3B3D", materialHex: "#3A3B3D", metalness: 1.0, roughness: 0.18, clearcoat: 0.4, clearcoatRoughness: 0.1,  envMapIntensity: 1.3 },
  { id: "black-chrome", label: "Black Chrome", hex: "#15161A", materialHex: "#15161A", metalness: 1.0, roughness: 0.06, clearcoat: 1.0, clearcoatRoughness: 0.03, envMapIntensity: 1.8 },
];

// ── Model catalogue ──────────────────────────────────────────────────────────

interface ObjModel {
  id: string;
  title: string;
  subtitle: string;
  file: string;
  material: { color: string; metalness: number; roughness: number };
  camera: [number, number, number];
}

const MODELS: ObjModel[] = [
  { id: "metal-buttons", title: "Metal Buttons", subtitle: "Brass alloy · Die-cast · Custom engraving available", file: "/models/Polo_Button_10.8.obj", material: { color: "#C8A84B", metalness: 0.85, roughness: 0.18 }, camera: [0, 2, 3.5] },
];

// ── Main OBJ mesh (MeshPhysicalMaterial) ─────────────────────────────────────

const ObjMesh = ({
  url,
  colour,
  finish,
  dtm,
  plating,
  autoRotate,
}: {
  url: string;
  colour: HardwareColour;
  finish: HardwareFinish;
  dtm: DtmFinish | null;
  plating: Plating | null;
  autoRotate: boolean;
}) => {
  const obj = useLoader(OBJLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const scene = useMemo(() => {
    const clone = obj.clone(true);

    // Precedence: plating > dtm > colour+finish
    let matProps: THREE.MeshPhysicalMaterialParameters;
    if (plating) {
      matProps = {
        color: new THREE.Color(plating.materialHex),
        metalness: plating.metalness,
        roughness: plating.roughness,
        clearcoat: plating.clearcoat,
        clearcoatRoughness: plating.clearcoatRoughness,
        envMapIntensity: plating.envMapIntensity,
      };
    } else if (dtm) {
      matProps = {
        color: new THREE.Color(colour.materialHex),
        metalness: dtm.metalness,
        roughness: dtm.roughness,
        clearcoat: dtm.clearcoat,
        clearcoatRoughness: dtm.clearcoatRoughness,
        envMapIntensity: dtm.envMapIntensity,
      };
    } else {
      matProps = {
        color: new THREE.Color(colour.materialHex),
        metalness: finish.metalness,
        roughness: finish.roughness,
        clearcoat: finish.clearcoat,
        clearcoatRoughness: finish.clearcoatRoughness,
        envMapIntensity: finish.envMapIntensity,
      };
    }

    const mat = new THREE.MeshPhysicalMaterial(matProps);
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
    const box2 = new THREE.Box3().setFromObject(clone);
    clone.position.sub(box2.getCenter(new THREE.Vector3()));
    return clone;
  }, [obj, colour.materialHex, finish.id, dtm?.id, plating?.id]);


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
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground/80 rounded-full animate-spin" />
        <span className="text-foreground/60 text-xs tracking-wide">Loading 3D model</span>
        <div className="w-32 h-1 bg-foreground/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground/70 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-foreground/40 text-[10px]">{Math.round(progress)}%</span>
      </div>
    </Html>
  );
};

// ── 3D Canvas scene ──────────────────────────────────────────────────────────

const ModelScene = ({
  model,
  colour,
  finish,
  dtm,
  plating,
  autoRotate,
}: {
  model: ObjModel;
  colour: HardwareColour;
  finish: HardwareFinish;
  dtm: DtmFinish | null;
  plating: Plating | null;
  autoRotate: boolean;
}) => (
  <>
    <ambientLight intensity={0.3} />
    <directionalLight position={[4, 6, 4]} intensity={1.4} castShadow />
    <directionalLight position={[-4, 2, -4]} intensity={0.5} />
    <pointLight position={[0, 4, 0]} intensity={0.5} />
    <Environment preset="studio" />
    <ObjMesh
      url={model.file}
      colour={colour}
      finish={finish}
      dtm={dtm}
      plating={plating}
      autoRotate={autoRotate}
    />
    <ContactShadows position={[0, -1.2, 0]} opacity={0.35} scale={4} blur={2.5} far={2} />
    <OrbitControls enablePan={false} minDistance={1.5} maxDistance={8} makeDefault />
  </>
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
  const [activeColour, setActiveColour] = useState<HardwareColour>(DEFAULT_COLOUR);
  const [activeFinish, setActiveFinish] = useState<HardwareFinish>(DEFAULT_FINISH);
  const [activeDtm, setActiveDtm] = useState<DtmFinish | null>(null);
  const [activePlating, setActivePlating] = useState<Plating | null>(null);

  const model = MODELS[activeIndex];

  const resetMaterial = () => {
    setActiveColour(DEFAULT_COLOUR);
    setActiveFinish(DEFAULT_FINISH);
    setActiveDtm(null);
    setActivePlating(null);
  };

  const prev = useCallback(() => {
    setActiveIndex((i) => (i - 1 + MODELS.length) % MODELS.length);
    setAutoRotate(true);
    resetMaterial();
  }, []);

  const next = useCallback(() => {
    setActiveIndex((i) => (i + 1) % MODELS.length);
    setAutoRotate(true);
    resetMaterial();
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

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      onKeyDown={handleKey}
      tabIndex={-1}
      ref={(el) => el?.focus()}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-white/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative z-10 flex flex-col bg-background border border-border shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "w-screen h-screen"
            : "w-[90vw] max-w-5xl h-[85vh]"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border">
          <div className="min-w-0">
            <span className="text-[11px] text-muted-foreground tracking-widest uppercase">
              3D Model
            </span>
            <h3 className="text-[17px] font-semibold text-foreground mt-0.5 truncate">
              {model.title}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">{model.subtitle}</p>
          </div>
          <div className="flex items-center gap-2 ml-4 flex-shrink-0">
            <button
              onClick={() => setAutoRotate((v) => !v)}
              title={autoRotate ? "Pause rotation" : "Resume rotation"}
              className={`w-8 h-8 flex items-center justify-center border transition-colors duration-150 ${
                autoRotate
                  ? "border-foreground text-foreground bg-foreground/5"
                  : "border-border text-muted-foreground hover:border-foreground/40"
              }`}
            >
              <RotateCcw size={14} />
            </button>
            <button
              onClick={() => setIsFullscreen((v) => !v)}
              title="Toggle fullscreen"
              className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors duration-150"
            >
              <Maximize2 size={14} />
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground transition-colors duration-150"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main 3D viewport */}
        <div className="flex-1 relative min-h-0 bg-secondary">
          <Canvas
            camera={{ position: model.camera, fov: 40 }}
            shadows
            gl={{ antialias: true, alpha: true }}
            className="!absolute inset-0"
          >
            <Suspense fallback={<LoadingOverlay />}>
              <ModelScene
                model={model}
                colour={activeColour}
                finish={activeFinish}
                dtm={activeDtm}
                plating={activePlating}
                autoRotate={autoRotate}
              />
            </Suspense>
          </Canvas>

          {/* Navigation arrows */}
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background border border-border text-foreground/60 hover:bg-foreground hover:text-background transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center bg-background border border-border text-foreground/60 hover:bg-foreground hover:text-background transition-colors"
          >
            <ChevronRight size={20} />
          </button>

          {/* Interaction hint */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[11px] text-muted-foreground pointer-events-none select-none">
            Drag to rotate · Scroll to zoom
          </div>
        </div>

        {/* ── Colour & Finish panel ─────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-border bg-background">
          <div className="flex flex-col sm:flex-row gap-0 divide-y sm:divide-y-0 sm:divide-x divide-border">

            {/* Colour picker */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Colour
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOURS.map((col) => (
                  <button
                    key={col.id}
                    title={col.label}
                    onClick={() => setActiveColour(col)}
                    className={`relative w-6 h-6 rounded-full transition-all duration-150 ${
                      activeColour.id === col.id
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-110 ring-1 ring-border"
                    }`}
                    style={{ backgroundColor: col.hex }}
                  >
                    <span className="sr-only">{col.label}</span>
                  </button>
                ))}
                <span className="ml-1 text-[11px] text-muted-foreground font-medium">
                  {activeColour.label}
                </span>
              </div>
            </div>

            {/* Finish picker */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Finish
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {FINISHES.map((fin) => (
                  <button
                    key={fin.id}
                    onClick={() => setActiveFinish(fin)}
                    title={fin.desc}
                    className={`px-3 py-1.5 text-[10px] font-medium tracking-wide border transition-all duration-150 ${
                      activeFinish.id === fin.id
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {fin.label}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                {activeFinish.desc}
              </p>
            </div>

            {/* DTM (Dye to Match) picker */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                DTM (Dye to Match)
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {DTM_FINISHES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setActiveDtm(d);
                      setActivePlating(null);
                    }}
                    className={`px-3 py-1.5 text-[10px] font-medium tracking-wide border transition-all duration-150 ${
                      activeDtm?.id === d.id
                        ? "bg-foreground text-background border-foreground"
                        : "bg-transparent text-muted-foreground border-border hover:border-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
                {activeDtm && (
                  <button
                    onClick={() => setActiveDtm(null)}
                    className="px-2 py-1.5 text-[10px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                {activeDtm ? `Applied · ${activeDtm.label}` : "Tints base colour with chosen finish"}
              </p>
            </div>

            {/* Electroplating picker */}
            <div className="flex-1 px-5 py-4">
              <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground mb-3">
                Electroplating
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                {PLATINGS.map((p) => (
                  <button
                    key={p.id}
                    title={p.label}
                    onClick={() => {
                      setActivePlating(p);
                      setActiveDtm(null);
                    }}
                    className={`relative w-6 h-6 rounded-full transition-all duration-150 ${
                      activePlating?.id === p.id
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background scale-110"
                        : "hover:scale-110 ring-1 ring-border"
                    }`}
                    style={{ backgroundColor: p.hex }}
                  >
                    <span className="sr-only">{p.label}</span>
                  </button>
                ))}
                {activePlating && (
                  <button
                    onClick={() => setActivePlating(null)}
                    className="ml-1 px-2 py-1 text-[10px] font-medium tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground/60 mt-2">
                {activePlating ? `Plated · ${activePlating.label}` : "Overrides colour with metal plating"}
              </p>
            </div>

          </div>
        </div>

        {/* Thumbnail strip */}
        <div className="flex-shrink-0 flex items-center gap-3 px-5 py-3 border-t border-border bg-secondary overflow-x-auto">
          {MODELS.map((m, idx) => (
            <button
              key={m.id}
              onClick={() => {
                setActiveIndex(idx);
                setAutoRotate(true);
                resetMaterial();
              }}
              className={`relative flex-shrink-0 w-[88px] h-[66px] overflow-hidden border-2 transition-all duration-200 ${
                idx === activeIndex
                  ? "border-foreground scale-105"
                  : "border-border hover:border-foreground/40 opacity-60 hover:opacity-90"
              }`}
            >
              <img
                src={`/models/thumbs/${m.id}.jpg`}
                alt={m.title}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/80 to-transparent px-1 py-0.5">
                <span className="text-[9px] text-foreground/70 leading-none truncate block">
                  {m.title}
                </span>
              </div>
            </button>
          ))}
          <div className="flex flex-col gap-0.5 ml-auto flex-shrink-0 pl-4">
            <span className="text-[10px] text-muted-foreground/50">← → to navigate</span>
            <span className="text-[10px] text-muted-foreground/50">Esc to close</span>
          </div>
        </div>
      </div>
    </div>
  , document.body);
}
