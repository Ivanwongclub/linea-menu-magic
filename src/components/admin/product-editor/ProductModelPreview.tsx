import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { decoratedFaceRotation, withSmoothNormals } from "@/features/editor/lib/prepareModel";
import type { BrandingReference } from "@/features/admin/lib/brandingRecovery";
import { useI18n } from "@/features/i18n/I18nProvider";

const FOV_DEG = 40;
// Straight on: a 3/4 view foreshortens whichever screen axis isn't facing the
// camera, which a two-point pick can't afford — it needs an undistorted
// on-screen measurement of whatever the two clicked points actually are.
const CAMERA_DIRECTION = new THREE.Vector3(0, 0, 1);
const VIEWPORT_FILL = 0.95;

/** A site colour token (`--primary: 0 0% 4%`) as a three.js colour — three's HSL parser wants commas. */
function tokenColour(name: string, fallback: string): string {
  const raw = typeof document === "undefined" ? "" : getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const parts = raw.split(/\s+/);
  return parts.length === 3 ? `hsl(${parts.join(", ")})` : fallback;
}

export interface PreviewSceneReport {
  meshes: number;
  tinted: number;
  hidden: number;
}

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
  /** "Preview as buyer": the marked groups are hidden instead of tinted (4j's buyer view, previewed). */
  hideHighlighted?: boolean;
  /** The recovered text path, drawn as a ring on the face with its start marked. */
  reference?: BrandingReference | null;
  pointA: THREE.Vector3 | null;
  pointB: THREE.Vector3 | null;
  onPick: (point: THREE.Vector3) => void;
}

function PreviewModel({
  url,
  picking,
  highlightIndices,
  hideHighlighted,
  reference,
  onPick,
  controlsRef,
  onReady,
  onReport,
}: {
  url: string;
  picking: boolean;
  highlightIndices: number[];
  hideHighlighted: boolean;
  reference: BrandingReference | null;
  onPick: (point: THREE.Vector3) => void;
  controlsRef: React.RefObject<OrbitControlsImpl>;
  onReady: () => void;
  onReport: (report: PreviewSceneReport) => void;
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
  const highlight = useMemo(() => new THREE.MeshStandardMaterial({ color: tokenColour("--primary", "#0a0a0a"), roughness: 0.5, metalness: 0.1 }), []);
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
    const meshes = prepared.children.filter((child) => (child as THREE.Mesh).isMesh) as THREE.Mesh[];
    let tinted = 0;
    let hidden = 0;
    meshes.forEach((mesh, index) => {
      const isMarked = marked.has(index);
      mesh.material = isMarked ? highlight : material;
      mesh.visible = !(isMarked && hideHighlighted);
      if (isMarked && mesh.visible) tinted++;
      if (!mesh.visible) hidden++;
    });
    onReport({ meshes: meshes.length, tinted, hidden });
  }, [prepared, material, highlight, highlightKey, hideHighlighted, onReport]);

  useEffect(() => onReady(), [prepared, onReady]);

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
    <>
      {reference && reference.radius_raw > 0 && <RecoveredRing reference={reference} prepared={prepared} />}
      <primitive
        object={prepared}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          if (!picking) return;
          e.stopPropagation();
          onPick(e.point.clone());
        }}
      />
    </>
  );
}

/**
 * The recovered text path (§3.2, raw OBJ frame) as a ring on the face: the
 * full circle faint, the lettering's arc solid, a dot where buyers' text
 * starts. Drawn in a sibling group carrying the model's own rotation and
 * recentring — never inside it, where it would shift the mesh indexing.
 */
function RecoveredRing({ reference, prepared }: { reference: BrandingReference; prepared: THREE.Group }) {
  const { circle, arc, start } = useMemo(() => {
    const normal = new THREE.Vector3(...reference.face_normal_raw).normalize();
    const up = new THREE.Vector3(...reference.angle_zero_raw).normalize();
    const right = new THREE.Vector3().crossVectors(up, normal).normalize();
    // Lifted off the relief tops so the ring isn't buried in the lettering.
    const centre = new THREE.Vector3(...reference.centre_raw).addScaledVector(normal, (reference.relief_raw ?? 0) + reference.radius_raw * 0.02);
    const at = (deg: number): [number, number, number] => {
      const a = THREE.MathUtils.degToRad(deg);
      const p = centre
        .clone()
        .addScaledVector(right, reference.radius_raw * Math.sin(a))
        .addScaledVector(up, reference.radius_raw * Math.cos(a));
      return [p.x, p.y, p.z];
    };
    // The covered arc runs clockwise from the lower-numbered reading end.
    const from = reference.direction === "cw" ? reference.start_angle_deg : reference.end_angle_deg;
    const to = reference.direction === "cw" ? reference.end_angle_deg : reference.start_angle_deg;
    const span = (((to - from) % 360) + 360) % 360;
    const circlePoints = Array.from({ length: 97 }, (_, i) => at((i / 96) * 360));
    const arcPoints = Array.from({ length: 49 }, (_, i) => at(from + (i / 48) * span));
    return { circle: circlePoints, arc: arcPoints, start: at(reference.start_angle_deg) };
  }, [reference]);
  const colour = useMemo(() => tokenColour("--background", "#ffffff"), []);
  const outline = useMemo(() => tokenColour("--primary", "#0a0a0a"), []);

  return (
    <group quaternion={prepared.quaternion} position={prepared.position} renderOrder={10}>
      <Line points={circle} color={colour} lineWidth={1} transparent opacity={0.6} depthTest={false} />
      <Line points={arc} color={outline} lineWidth={5} depthTest={false} />
      <Line points={arc} color={colour} lineWidth={3} depthTest={false} />
      <mesh position={start} renderOrder={11}>
        <sphereGeometry args={[reference.radius_raw * 0.05, 16, 16]} />
        <meshBasicMaterial color={outline} depthTest={false} />
      </mesh>
    </group>
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

export default function ProductModelPreview({
  url,
  picking,
  highlightIndices = [],
  hideHighlighted = false,
  reference = null,
  pointA,
  pointB,
  onPick,
}: ProductModelPreviewProps) {
  const { t } = useI18n();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [ready, setReady] = useState(false);
  const [report, setReport] = useState<PreviewSceneReport | null>(null);
  const markReady = useMemo(() => () => setReady(true), []);
  return (
    <div
      className="relative h-[38rem] max-w-3xl mx-auto border border-border bg-secondary"
      data-testid="model-preview-canvas"
      data-state={ready ? "ready" : "loading"}
      data-ring={reference && reference.radius_raw > 0 ? "shown" : "none"}
      data-meshes={report?.meshes}
      data-tinted={report?.tinted}
      data-hidden={report?.hidden}
    >
      <Canvas camera={{ fov: FOV_DEG, position: [0, 0, 25] }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 10, 7]} intensity={1} />
        <Suspense fallback={null}>
          <PreviewModel
            url={url}
            picking={picking}
            highlightIndices={highlightIndices}
            hideHighlighted={hideHighlighted}
            reference={reference}
            onPick={onPick}
            controlsRef={controlsRef}
            onReady={markReady}
            onReport={setReport}
          />
        </Suspense>
        {pointA && <PointMarker point={pointA} />}
        {pointB && <PointMarker point={pointB} />}
        <OrbitControls ref={controlsRef} makeDefault />
      </Canvas>
      {!ready && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground" data-testid="model-preview-model-loading">
          {t("admin.model.preview.modelLoading")}
        </div>
      )}
    </div>
  );
}
