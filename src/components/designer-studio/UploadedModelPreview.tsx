import { Component, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { Html, OrbitControls } from "@react-three/drei";
import { ModelFileLoader } from "@/features/editor/lib/ModelFileLoader";
import { modelFormatFromName } from "@/features/editor/lib/modelFormat";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Grid2X2, RotateCcw, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";

class ModelErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed
      ? <div className="absolute inset-0 flex items-center justify-center text-sm text-destructive">Unable to load this model. Please reload the page.</div>
      : this.props.children;
  }
}

function Model({ url, wireframe, onReady }: { url: string; wireframe: boolean; onReady: () => void }) {
  const source = useLoader(ModelFileLoader, url, (loader) => {
    loader.formatHint = modelFormatFromName(url) ?? "obj";
  });
  const material = useMemo(() => {
    const token = getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground").trim().split(/\s+/);
    return new THREE.MeshStandardMaterial({ color: `hsl(${token.join(",")})`, metalness: 0.25, roughness: 0.45, side: THREE.DoubleSide });
  }, []);
  const model = useMemo(() => {
    const group = source.clone(true);
    group.traverse(child => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.material = material;
    });
    // Both Rhino exports have their shallow axis along Y. Face the broad
    // surface towards the camera, preserving every supplied mesh and normal.
    group.rotation.x = Math.PI / 2;
    group.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(group);
    const size = bounds.getSize(new THREE.Vector3());
    const scale = 3 / Math.max(size.x, size.y, size.z, 0.001);
    group.scale.setScalar(scale);
    group.position.copy(bounds.getCenter(new THREE.Vector3())).multiplyScalar(-scale);
    group.updateMatrixWorld(true);
    return group;
  }, [source, material]);
  useEffect(() => { material.wireframe = wireframe; }, [material, wireframe]);
  useEffect(() => { onReady(); }, [onReady, model]);
  useEffect(() => () => material.dispose(), [material]);
  return <primitive object={model} dispose={null} />;
}

export default function UploadedModelPreview({ name, url, size }: { name: string; url: string; size: string }) {
  const controls = useRef<OrbitControlsImpl>(null);
  const [rotate, setRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [ready, setReady] = useState(false);
  const markReady = useMemo(() => () => setReady(true), []);
  return (
    <section className="min-w-0" aria-label={`${name} preview`}>
      <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
        <h2 className="text-lg font-medium">{name}</h2>
        <span className="text-xs text-muted-foreground">OBJ · {size}</span>
      </div>
      <div className="relative h-[440px] lg:h-[560px] bg-secondary" data-testid={`preview-${name}`} data-state={ready ? "ready" : "loading"}>
        <ModelErrorBoundary>
          <Canvas camera={{ position: [0, 0.5, 5.5], fov: 40 }} dpr={[1, 1.5]} gl={{ antialias: true }}>
            <ambientLight intensity={1.2} />
            <directionalLight position={[3, 4, 5]} intensity={2.5} />
            <directionalLight position={[-4, 0, 3]} intensity={1.4} />
            <directionalLight position={[0, -4, -2]} intensity={0.8} />
            <Suspense fallback={<Html center><span className="text-sm text-muted-foreground whitespace-nowrap">Loading {name}…</span></Html>}>
              <Model url={url} wireframe={wireframe} onReady={markReady} />
            </Suspense>
            <OrbitControls ref={controls} makeDefault autoRotate={rotate} autoRotateSpeed={0.8} minDistance={2} maxDistance={15} enableDamping />
          </Canvas>
        </ModelErrorBoundary>
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex bg-background border border-border">
          <Button variant="ghost" size="icon" title="Reset view" aria-label={`Reset ${name} view`} onClick={() => { setRotate(false); controls.current?.reset(); }}><RotateCcw /></Button>
          <Button variant={rotate ? "secondary" : "ghost"} size="icon" title="Auto-rotate" aria-label={`Auto-rotate ${name}`} aria-pressed={rotate} onClick={() => setRotate(value => !value)}><RotateCw /></Button>
          <Button variant={wireframe ? "secondary" : "ghost"} size="icon" title="Wireframe" aria-label={`Wireframe ${name}`} aria-pressed={wireframe} onClick={() => setWireframe(value => !value)}><Grid2X2 /></Button>
        </div>
      </div>
    </section>
  );
}