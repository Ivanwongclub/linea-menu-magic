import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { decoratedFaceRotation, withSmoothNormals } from "@/features/editor/lib/prepareModel";

const FOV_DEG = 40;
// Straight on: a 3/4 view foreshortens whichever screen axis isn't facing the
// camera, which a two-point pick can't afford — it needs an undistorted
// on-screen measurement of whatever the two clicked points actually are.
const CAMERA_DIRECTION = new THREE.Vector3(0, 0, 1);
const VIEWPORT_FILL = 0.95;

/** Every mesh vertex's world position — used to fit the camera to the model's actual silhouette, not its AABB's corners (a round part reaches nowhere near its box's diagonal). */
function worldVertices(group: THREE.Object3D): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const v = new THREE.Vector3();
  group.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      points.push(v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld).clone());
    }
  });
  return points;
}

/**
 * Solves the camera distance along a fixed direction so the model's
 * projected silhouette fills `fill` of the frustum (converges in a few
 * steps — mirrors `EditorModel`'s buyer-viewport framing, independently,
 * since this preview's material/camera pipeline is deliberately not shared
 * with it).
 */
function frameToPoints(camera: THREE.PerspectiveCamera, points: THREE.Vector3[], center: THREE.Vector3, direction: THREE.Vector3, fill: number) {
  let distance = Math.max(...points.map((p) => p.distanceTo(center)), 1) * 2;
  const ndc = new THREE.Vector3();
  for (let i = 0; i < 8; i++) {
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.lookAt(center);
    camera.updateMatrixWorld();
    camera.updateProjectionMatrix();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of points) {
      ndc.copy(p).project(camera);
      minX = Math.min(minX, ndc.x);
      maxX = Math.max(maxX, ndc.x);
      minY = Math.min(minY, ndc.y);
      maxY = Math.max(maxY, ndc.y);
    }
    const currentFill = Math.max(maxX - minX, maxY - minY) / 2;
    if (currentFill <= 0) break;
    distance *= currentFill / fill;
  }
  camera.position.copy(center).addScaledVector(direction, distance);
  camera.lookAt(center);
  return distance;
}

/**
 * The CMS's own R3F view (E1 collision 14, risk R15) — lazy-loaded and
 * mounted only while the scale panel's preview is open, so the admin bundle
 * doesn't carry the 3D chunk on every page. Reuses `lib/prepareModel`'s
 * normal smoothing and decorated-face rotation only: no material, camera or
 * occlusion logic from the buyer `EditorModel`, and no scale is applied — the
 * geometry renders at raw OBJ units so two-point picks measure raw distance
 * directly (spec §17).
 */
interface ProductModelPreviewProps {
  url: string;
  picking: boolean;
  /** OBJ group indices (file order) drawn in the highlight colour — the CMS branding marks. */
  highlightIndices?: number[];
  pointA: THREE.Vector3 | null;
  pointB: THREE.Vector3 | null;
  onPick: (point: THREE.Vector3) => void;
}

function PreviewModel({
  url,
  picking,
  highlightIndices,
  onPick,
  controlsRef,
}: {
  url: string;
  picking: boolean;
  highlightIndices: number[];
  onPick: (point: THREE.Vector3) => void;
  controlsRef: React.RefObject<OrbitControlsImpl>;
}) {
  const obj = useLoader(OBJLoader, url);
  const { camera } = useThree();

  const prepared = useMemo(() => {
    const group = obj.clone(true);
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry = withSmoothNormals(mesh.geometry);
    });
    group.quaternion.copy(decoratedFaceRotation(group));
    const box = new THREE.Box3().setFromObject(group);
    group.position.sub(box.getCenter(new THREE.Vector3()));
    return group;
  }, [obj]);

  const material = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9a9a9a", roughness: 0.6, metalness: 0.1 }), []);
  const highlight = useMemo(() => new THREE.MeshStandardMaterial({ color: "#d97706", roughness: 0.5, metalness: 0.1 }), []);
  useEffect(
    () => () => {
      material.dispose();
      highlight.dispose();
    },
    [material, highlight],
  );
  const highlightKey = [...highlightIndices].sort((a, b) => a - b).join(",");
  useEffect(() => {
    const marked = new Set(highlightKey ? highlightKey.split(",").map(Number) : []);
    // Direct mesh children in file order — the same indexing as `model_branding_groups`.
    prepared.children
      .filter((child) => (child as THREE.Mesh).isMesh)
      .forEach((child, index) => {
        (child as THREE.Mesh).material = marked.has(index) ? highlight : material;
      });
  }, [prepared, material, highlight, highlightKey]);

  // Frames the model to fill most of the preview, whatever its real size —
  // a fixed camera distance would render a small button as a speck (and
  // waste most of the two-point calibration click's pixel precision).
  useEffect(() => {
    const points = worldVertices(prepared);
    const center = new THREE.Box3().setFromObject(prepared).getCenter(new THREE.Vector3());
    const distance = frameToPoints(camera as THREE.PerspectiveCamera, points, center, CAMERA_DIRECTION, VIEWPORT_FILL);
    camera.near = distance / 100;
    camera.far = distance * 100;
    camera.updateProjectionMatrix();
    const controls = controlsRef.current;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.minDistance = distance * 0.3;
      controls.maxDistance = distance * 4;
      controls.update();
    }
  }, [prepared, camera, controlsRef]);

  return (
    <primitive
      object={prepared}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (!picking) return;
        e.stopPropagation();
        onPick(e.point.clone());
      }}
    />
  );
}

function PointMarker({ point }: { point: THREE.Vector3 }) {
  return (
    <mesh position={point}>
      <sphereGeometry args={[0.15, 12, 12]} />
      <meshBasicMaterial color="#e11d48" depthTest={false} />
    </mesh>
  );
}

export default function ProductModelPreview({ url, picking, highlightIndices = [], pointA, pointB, onPick }: ProductModelPreviewProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  return (
    <div className="h-[38rem] max-w-3xl mx-auto border border-border bg-secondary" data-testid="model-preview-canvas">
      <Canvas camera={{ fov: FOV_DEG, position: [0, 0, 25] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <Suspense fallback={null}>
          <PreviewModel url={url} picking={picking} highlightIndices={highlightIndices} onPick={onPick} controlsRef={controlsRef} />
        </Suspense>
        {pointA && <PointMarker point={pointA} />}
        {pointB && <PointMarker point={pointB} />}
        <OrbitControls ref={controlsRef} makeDefault />
      </Canvas>
    </div>
  );
}
