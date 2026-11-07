import { useEffect, useMemo, useRef, type PointerEvent as ReactPointerEvent } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html, Line } from "@react-three/drei";
import * as THREE from "three";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import { boundedZonePlane, decodeRuns, facesForGroups, facesForPlane, type ZoneBounds, type ZonePlane } from "../../lib/zones";
import type { Zone } from "../../lib/recipe";

const VERTEX = `varying vec3 vRegionWorld;
void main() { vRegionWorld = (modelMatrix * vec4(position, 1.0)).xyz; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const FRAGMENT = `varying vec3 vRegionWorld;
uniform vec3 regionAxis; uniform float regionAt, regionSide, regionPlane;
void main() {
  if (regionPlane > 0.5 && (dot(vRegionWorld, regionAxis) - regionAt) * regionSide < 0.0) discard;
  gl_FragColor = vec4(0.12, 0.42, 1.0, 0.28);
  #include <colorspace_fragment>
}`;

/** A temporary blue mask. It never enters the model's geometry, materials or exports. */
export function ZoneSelectionPreview({ zone, meshes, counts, centroids, bounds }: { zone: Zone; meshes: THREE.Mesh[]; counts: number[]; centroids: Float32Array; bounds: ZoneBounds }) {
  const { gl } = useThree();
  const visible = useEditorStore(s => s.zonePreviewVisible);
  const runs = useMemo(() => zone.method === "groups" ? facesForGroups(counts, zone.groups ?? []) : zone.method === "plane" && zone.plane ? facesForPlane(centroids, zone.plane) : zone.faces ?? [], [zone, counts, centroids]);
  const overlays = useMemo(() => {
    const selected = new Set(decodeRuns(runs));
    let offset = 0;
    return meshes.flatMap((mesh, index) => {
      const start = offset;
      offset += counts[index];
      if (!mesh.visible) return [];
      if (zone.method === "plane") return [{ mesh, geometry: mesh.geometry, owned: false }];
      const source = mesh.geometry.getAttribute("position"), positions: number[] = [];
      for (let face = 0; face < counts[index]; face++) if (selected.has(start + face)) {
        for (let vertex = 0; vertex < 3; vertex++) {
          const at = face * 3 + vertex;
          positions.push(source.getX(at), source.getY(at), source.getZ(at));
        }
      }
      if (!positions.length) return [];
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      return [{ mesh, geometry, owned: true }];
    });
  }, [meshes, counts, runs, zone.method]);
  useEffect(() => () => overlays.forEach(overlay => { if (overlay.owned) overlay.geometry.dispose(); }), [overlays]);
  const material = useMemo(() => new THREE.ShaderMaterial({ vertexShader: VERTEX, fragmentShader: FRAGMENT, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, side: THREE.DoubleSide, uniforms: {
    regionAxis: { value: new THREE.Vector3() }, regionAt: { value: 0 }, regionSide: { value: 1 }, regionPlane: { value: 0 },
  } }), []);
  useEffect(() => () => material.dispose(), [material]);
  const plane = zone.method === "plane" ? zone.plane : null;
  material.uniforms.regionAxis.value.set(plane?.axis === "x" ? 1 : 0, plane?.axis === "y" ? 1 : 0, plane?.axis === "z" ? 1 : 0);
  material.uniforms.regionAt.value = plane?.at_mm ?? 0;
  material.uniforms.regionSide.value = plane?.side === "below" ? -1 : 1;
  material.uniforms.regionPlane.value = plane ? 1 : 0;
  useEffect(() => {
    gl.domElement.dataset.zonePreview = JSON.stringify({ id: zone.id, method: zone.method, plane, faces: decodeRuns(runs).length, visible });
    return () => { delete gl.domElement.dataset.zonePreview; };
  }, [gl, zone.id, zone.method, plane, runs, visible]);
  return <group dispose={null}>
    {visible && overlays.map(({ mesh, geometry }) => <mesh key={mesh.uuid} geometry={geometry} material={material} matrix={mesh.matrixWorld} matrixAutoUpdate={false} raycast={() => null} renderOrder={900} />)}
    {visible && plane && <ZonePlaneHandle key={`${zone.id}:${plane.axis}`} zoneId={zone.id} plane={plane} bounds={bounds} />}
  </group>;
}

/** A camera-projected axis drag keeps the handle usable on an orbited model. */
function ZonePlaneHandle({ zoneId, plane, bounds }: { zoneId: string; plane: ZonePlane; bounds: ZoneBounds }) {
  const { t } = useI18n();
  const { camera, size } = useThree();
  const button = useRef<HTMLButtonElement>(null);
  const active = useRef<{ x: number; y: number; dx: number; dy: number; plane: ZonePlane } | null>(null);
  const center = new THREE.Vector3((bounds.minX + bounds.maxX) / 2, (bounds.minY + bounds.maxY) / 2, (bounds.minZ + bounds.maxZ) / 2);
  center[plane.axis] = plane.at_mm;
  const pad = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY, bounds.maxZ - bounds.minZ) * 0.08;
  const anchor = center.clone();
  if (plane.axis === "x") { anchor.y = bounds.maxY + pad; anchor.z = bounds.maxZ + pad; }
  else { anchor.x = bounds.minX - pad; if (plane.axis === "y") anchor.z = bounds.maxZ + pad; else anchor.y = bounds.minY - pad; }
  const axis = new THREE.Vector3(plane.axis === "x" ? 1 : 0, plane.axis === "y" ? 1 : 0, plane.axis === "z" ? 1 : 0);
  const projectedAxis = () => {
    const a = anchor.clone().project(camera), b = anchor.clone().add(axis).project(camera);
    const dx = (b.x - a.x) * size.width / 2, dy = -(b.y - a.y) * size.height / 2;
    return dx * dx + dy * dy < 0.01 ? { dx: 10, dy: 0 } : { dx, dy };
  };
  useFrame(() => {
    const direction = projectedAxis();
    if (button.current) { button.current.dataset.axisDx = String(direction.dx); button.current.dataset.axisDy = String(direction.dy); }
  });
  const stop = (cancel = false) => {
    if (!active.current) return;
    if (cancel) useEditorStore.getState().updateZone(zoneId, { plane: active.current.plane });
    active.current = null;
    useEditorStore.getState().endDrag();
  };
  useEffect(() => () => { if (active.current) useEditorStore.getState().endDrag(); }, []);
  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (!active.current) return;
    event.stopPropagation();
    const start = active.current;
    const mm = ((event.clientX - start.x) * start.dx + (event.clientY - start.y) * start.dy) / (start.dx * start.dx + start.dy * start.dy);
    useEditorStore.getState().updateZone(zoneId, { plane: boundedZonePlane(plane, bounds, start.plane.at_mm + mm) });
  };
  const other = plane.axis === "x" ? ["y", "z"] as const : plane.axis === "y" ? ["x", "z"] as const : ["x", "y"] as const;
  const extents = { x: [bounds.minX - pad, bounds.maxX + pad], y: [bounds.minY - pad, bounds.maxY + pad], z: [bounds.minZ - pad, bounds.maxZ + pad] };
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]].map(([a, b]) => { const point = center.clone(); point[other[0]] = extents[other[0]][a]; point[other[1]] = extents[other[1]][b]; return point; });
  return <>
    <Line points={corners} color="#2563eb" lineWidth={1.5} dashed dashSize={pad * 0.5} gapSize={pad * 0.3} depthTest={false} raycast={() => null} renderOrder={901} />
    <Line points={[center, anchor]} color="#2563eb" lineWidth={1} depthTest={false} raycast={() => null} renderOrder={901} />
    <Html position={anchor} center zIndexRange={[15, 0]}><button ref={button} type="button" data-testid="zone-plane-handle" data-axis={plane.axis} aria-label={t("editor.zones.dragPlane", { axis: plane.axis.toUpperCase() })} title={t("editor.zones.dragPlane", { axis: plane.axis.toUpperCase() })} className="flex h-8 w-8 cursor-move touch-none items-center justify-center rounded-full border-2 border-blue-600 bg-white font-mono text-xs font-bold text-blue-700 shadow" onPointerDown={event => { event.preventDefault(); event.stopPropagation(); event.currentTarget.focus({ preventScroll: true }); event.currentTarget.setPointerCapture(event.pointerId); active.current = { x: event.clientX, y: event.clientY, ...projectedAxis(), plane }; useEditorStore.getState().beginDrag(); }} onPointerMove={move} onPointerUp={event => { event.stopPropagation(); stop(); if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }} onPointerCancel={() => stop(true)} onLostPointerCapture={() => stop()} onKeyDown={event => { if (event.key === "Escape") { event.stopPropagation(); stop(true); } else if (["ArrowLeft", "ArrowDown", "ArrowRight", "ArrowUp"].includes(event.key)) { event.preventDefault(); const step = event.shiftKey ? 1 : 0.1; const sign = event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 1; const state = useEditorStore.getState(); state.updateZone(zoneId, { plane: boundedZonePlane(plane, bounds, plane.at_mm + step * sign) }); state.commit(); } }}>{plane.axis.toUpperCase()} ↔</button></Html>
  </>;
}
