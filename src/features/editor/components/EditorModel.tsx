import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useLoader, useThree, type ThreeEvent } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { EditorColour } from "../hooks/useEditorProduct";
import type { PickerFinish } from "../hooks/useFinishOptions";
import { decoratedFaceRotation, withSmoothNormals } from "../lib/prepareModel";
import { MeshBVH } from "three-mesh-bvh";
import { applyBakedOcclusion, bakeOcclusion, occlusionKey, type BakeStats } from "../lib/ambientOcclusion";
import { EMPTY_ZONES, useEditorStore } from "../store/useEditorStore";
import { colourMaterial, finishMaterial } from "../lib/finishMaterial";
import type { Layer, Zone } from "../lib/recipe";
import { decodeRuns, encodeRuns, facesForGroups, facesForPlane, resolveZones, totalFaces } from "../lib/zones";
import type { ZoneStyle } from "../lib/shaderPatch";
import type { LogoSource } from "../hooks/useLogoAssets";
import { BrandingMeshes, type TextSceneReport } from "./branding/BrandingMeshes";
import { cornersOf, fitDistance, homeDirection, type BoundsMm } from "../lib/framing";

interface EditorModelProps {
  url: string;
  /** `products.model_scale_factor` — mm per raw OBJ unit at the reference variant (E1 collision 1). */
  scaleFactor: number;
  /** `variantMm / referenceMm` — a product-size change, not a unit reinterpretation (E1 collision 3). */
  variantScale: number;
  /** Real-world size of the selected variant. Kept for the ruler (Phase 4e) — not used for scaling. */
  sizePrimaryMm: number;
  isMetal: boolean;
  finish: PickerFinish | null;
  colour: EditorColour | null;
  controlsRef: RefObject<OrbitControlsImpl>;
  /** Reports the rendered primary dimension in mm, for the viewport's `data-model-size-mm`. */
  onModelSizeMm?: (mm: number) => void;
  /** Reports the model-local bounds (already × factor × variantScale, i.e. in mm) for the ruler (Phase 4e, C4). */
  onRulerMeasurements?: (measurements: RulerMeasurements) => void;
  /** The face top in the face frame, mm — the plane the on-model handles drag on (4i). */
  onFaceZ?: (z: number) => void;
  /** OBJ group indices (file order) of the product's marked branding (4d). */
  markedGroupIndices: number[];
  /** Hide the marked groups — the buyer view (4j); the Parts list toggles it (6b R1). */
  hideMarked: boolean;
  /** Phase 6b R1: OBJ groups the buyer hid in the Parts list. */
  hiddenGroups?: number[];
  /** Phase 6b R2: the zones to mask the part's material with, in order. */
  zones?: Zone[];
  zoneStyles?: ZoneStyle[];
  /** Phase 6b R1/R2: what the model is made of, and what the zones cover. */
  onPartsReport?: (report: PartsReport) => void;
  /** Phase 6b R4: whether the occlusion bake is running, and what it cost. */
  onOcclusionState?: (state: "idle" | "pending" | "ready") => void;
  onBakeStats?: (stats: BakeStats) => void;
  /** Reports how many of the model's meshes are drawn, and how many it has. */
  onMeshCount?: (drawn: number, total: number) => void;
  /** The recipe's layers, drawn on the face — siblings of the model, never inside its measured bounds. */
  layers: Layer[];
  /** The artwork behind each logo layer, by layer id (4k, 6a). */
  logoSources: Record<string, LogoSource>;
  /** Phase 6a R2: per-layer appearance materials, by layer id. */
  layerMaterials?: Record<string, THREE.MeshPhysicalMaterial>;
  onTextReport?: (report: TextSceneReport) => void;
}

/** What the Parts list and the strip read back (6b R1/R2/R7). */
export interface PartsReport {
  groups: { index: number; name: string; faces: number; visible: boolean }[];
  /** The model's own extent, mm — the plane zone's slider range. */
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  /** Faces each zone actually covers, in zone order, and the pairs that overlap. */
  zoneFaces: number[];
  overlaps: [number, number][];
  totalFaces: number;
}

export interface RulerMeasurements {
  diameterMm: number;
  thicknessMm: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

/**
 * `MeshPhysicalMaterial` straight from the finish row: the database derives
 * base colour, metalness, roughness, anisotropy and clearcoat (3b/3c). An
 * antique finish (`two_tone`) mixes buffed metal and oxide by baked occlusion.
 * A non-metal product renders its colour as a plain dielectric.
 */
export function EditorModel({
  url,
  scaleFactor,
  variantScale,
  sizePrimaryMm,
  isMetal,
  finish,
  colour,
  controlsRef,
  onModelSizeMm,
  onRulerMeasurements,
  onFaceZ,
  markedGroupIndices,
  hideMarked,
  onMeshCount,
  layers,
  logoSources,
  layerMaterials,
  hiddenGroups,
  zones,
  zoneStyles,
  onPartsReport,
  onOcclusionState,
  onBakeStats,
  onTextReport,
}: EditorModelProps) {
  const obj = useLoader(OBJLoader, url);
  const { camera, gl, size: viewport } = useThree();

  const twoTone = !!(isMetal && finish?.two_tone);

  // One builder for the part and for every layer that carries its own finish
  // (Phase 6a R2, `lib/finishMaterial.ts`).
  // The zone styles are part of the program, so a new zone rebuilds the material.
  const zoneStyleKey = JSON.stringify(zoneStyles ?? []);
  const material = useMemo(() => {
    const styles = zoneStyles?.length ? zoneStyles : null;
    return isMetal && finish ? finishMaterial(finish, styles) : colourMaterial(colour?.hex, styles);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMetal, finish, colour, zoneStyleKey]);

  useEffect(() => () => material.dispose(), [material]);

  // Geometry prep is per loaded file: smooth normals where missing, then the
  // rotation that brings the decorated face to +Z.
  const prepared = useMemo(() => {
    const group = obj.clone(true);
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      const smoothed = withSmoothNormals(mesh.geometry);
      // Zones carry a slot per face (6b R2), which an indexed geometry cannot
      // hold: one shared vertex would have to be in two zones at once.
      mesh.geometry = smoothed.getIndex() ? smoothed.toNonIndexed() : smoothed;
    });
    group.quaternion.copy(decoratedFaceRotation(group));
    return group;
  }, [obj]);

  const markedKey = [...markedGroupIndices].sort((a, b) => a - b).join(",");
  const partsKey = [...(hiddenGroups ?? [])].sort((a, b) => a - b).join(",");
  // The lettering bundle and the Parts list are one hidden set (6b R1).
  const hiddenIndices = useMemo(() => {
    const hidden = new Set(partsKey ? partsKey.split(",").map(Number) : []);
    if (hideMarked && markedKey) for (const index of markedKey.split(",").map(Number)) hidden.add(index);
    return [...hidden].sort((a, b) => a - b);
  }, [hideMarked, markedKey, partsKey]);

  // Material is assigned separately so changing the finish never rebuilds
  // the object — which would re-run framing and yank the camera.
  const { model, renderedSizeMm } = useMemo(() => {
    const clone = prepared.clone(true);

    // Stored scale, never a force-rescale (E1 collision 1): factor is mm per
    // raw unit at the reference variant, and variantScale carries any other
    // variant's product-size change (collision 3).
    const rawBox = new THREE.Box3().setFromObject(clone);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const scale = scaleFactor * variantScale;
    clone.scale.setScalar(scale);

    const scaledBox = new THREE.Box3().setFromObject(clone);
    clone.position.sub(scaledBox.getCenter(new THREE.Vector3()));
    return { model: clone, renderedSizeMm: Math.max(rawSize.x, rawSize.y) * scale };
  }, [prepared, scaleFactor, variantScale]);

  useEffect(() => {
    onModelSizeMm?.(renderedSizeMm);
  }, [renderedSizeMm, onModelSizeMm]);

  useLayoutEffect(() => {
    model.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.material = material;
    });
  }, [model, material]);

  // The buyer view (4j): marked branding groups are not drawn. The rotation
  // was already computed on the full model (collision 10), and the framing
  // and ruler bounds below stay the full model's, so showing the original
  // lettering never moves the camera.
  useLayoutEffect(() => {
    const hidden = new Set(hiddenIndices);
    const groups = model.children.filter((c) => (c as THREE.Mesh).isMesh);
    groups.forEach((mesh, index) => {
      mesh.visible = !hidden.has(index);
    });
    onMeshCount?.(groups.filter((m) => m.visible).length, groups.length);
  }, [model, hiddenIndices, onMeshCount]);

  /**
   * The model's faces, once per loaded file (6b R2): how many each group has,
   * and where each one's centroid sits in the mm frame — the plane zone
   * classifies against these, and a painted zone indexes into them.
   */
  const faceData = useMemo(() => {
    const meshes = model.children.filter((c) => (c as THREE.Mesh).isMesh) as THREE.Mesh[];
    model.updateWorldMatrix(true, true);
    const counts = meshes.map((mesh) => Math.floor((mesh.geometry.getAttribute("position")?.count ?? 0) / 3));
    const total = totalFaces(counts);
    const centroids = new Float32Array(total * 3);
    const v = new THREE.Vector3();
    let face = 0;
    for (const mesh of meshes) {
      const position = mesh.geometry.getAttribute("position");
      if (!position) continue;
      for (let i = 0; i + 2 < position.count; i += 3) {
        let x = 0;
        let y = 0;
        let z = 0;
        for (let k = 0; k < 3; k++) {
          v.fromBufferAttribute(position, i + k).applyMatrix4(mesh.matrixWorld);
          x += v.x;
          y += v.y;
          z += v.z;
        }
        centroids[face * 3] = x / 3;
        centroids[face * 3 + 1] = y / 3;
        centroids[face * 3 + 2] = z / 3;
        face++;
      }
    }
    return { meshes, counts, centroids, total };
  }, [model]);

  /** Each zone's faces, however it was defined (R2/R3). */
  const zoneRuns = useMemo(
    () =>
      (zones ?? EMPTY_ZONES).map((zone) => {
        if (zone.method === "plane" && zone.plane) return facesForPlane(faceData.centroids, zone.plane);
        if (zone.method === "groups") return facesForGroups(faceData.counts, zone.groups ?? []);
        return encodeRuns(decodeRuns(zone.faces ?? []));
      }),
    [zones, faceData],
  );

  // The slot each face renders in: a later zone wins where two overlap (R2).
  useLayoutEffect(() => {
    const { meshes, counts, total } = faceData;
    const { slots, overlaps } = resolveZones(total, zoneRuns);
    let face = 0;
    meshes.forEach((mesh, group) => {
      const count = counts[group];
      const attribute = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const slot = slots[face + i];
        attribute[i * 3] = slot;
        attribute[i * 3 + 1] = slot;
        attribute[i * 3 + 2] = slot;
      }
      face += count;
      mesh.geometry.setAttribute("zoneIndex", new THREE.BufferAttribute(attribute, 1));
    });
    const box = new THREE.Box3().setFromObject(model);
    onPartsReport?.({
      bounds: { minX: box.min.x, maxX: box.max.x, minY: box.min.y, maxY: box.max.y, minZ: box.min.z, maxZ: box.max.z },
      groups: meshes.map((mesh, index) => ({ index, name: mesh.name || `group_${index + 1}`, faces: counts[index], visible: mesh.visible })),
      zoneFaces: zoneRuns.map((runs) => decodeRuns(runs).length),
      overlaps,
      totalFaces: total,
    });
  }, [model, faceData, zoneRuns, hiddenIndices, onPartsReport]);

  /**
   * The occlusion bake, in its worker (6b R4): once per file, hidden set and
   * relief, and only where an antique finish needs it. The relief the editor
   * has carved is in the cast, so an engraved recess takes the oxide (5 Q3).
   */
  const [occlusionState, setOcclusionState] = useState<"idle" | "pending" | "ready">("idle");
  const reliefGroup = useRef<THREE.Object3D | null>(null);
  const [reliefKey, setReliefKey] = useState("");

  useEffect(() => {
    if (!twoTone) {
      setOcclusionState("idle");
      return;
    }
    const key = occlusionKey(url, hiddenIndices, reliefKey);
    if (applyBakedOcclusion(key)) {
      setOcclusionState("ready");
      return;
    }
    let live = true;
    setOcclusionState("pending");
    const groups = model.children.filter((c) => (c as THREE.Mesh).isMesh);
    void bakeOcclusion(key, {
      root: model,
      excluded: new Set(hiddenIndices.map((i) => groups[i]).filter(Boolean)),
      relief: reliefGroup.current,
    }).then((stats) => {
      if (!live) return;
      setOcclusionState("ready");
      onBakeStats?.(stats);
    });
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model, url, twoTone, hiddenIndices, reliefKey]);

  useEffect(() => {
    onOcclusionState?.(occlusionState);
  }, [occlusionState, onOcclusionState]);

  /**
   * The brush (6b R2): a pointer on the model adds every face within the
   * brush's radius of the hit — across parts, so a stroke over a seam paints
   * both sides of it. Faces, not geometry: the model is never cut.
   */
  const paintZoneId = useEditorStore((s) => s.paintZoneId);
  const brushRadiusMm = useEditorStore((s) => s.brushRadiusMm);
  const updateZone = useEditorStore((s) => s.updateZone);
  const commitZone = useEditorStore((s) => s.commit);
  const painting = useRef(false);

  const paintAt = useCallback(
    (point: THREE.Vector3) => {
      if (!paintZoneId) return;
      const zone = (zones ?? EMPTY_ZONES).find((z) => z.id === paintZoneId);
      if (!zone) return;
      const faces = new Set(decodeRuns(zone.faces ?? []));
      let offset = 0;
      faceData.meshes.forEach((mesh, group) => {
        const start = offset;
        offset += faceData.counts[group];
        if (!mesh.visible) return;
        const geometry = mesh.geometry as THREE.BufferGeometry & { boundsTree?: MeshBVH };
        if (!geometry.boundsTree) geometry.boundsTree = new MeshBVH(geometry);
        // Building the tree indexes the geometry and sorts that index for the
        // tree's own use, so a hit's triangle number is in the tree's order,
        // not the file's. Only whole faces move, so the first vertex of the
        // hit triangle says which face of the file it is — which is the number
        // the zone stores and the slot attribute below is laid out in.
        const index = geometry.getIndex();
        const local = mesh.worldToLocal(point.clone());
        const radius = brushRadiusMm / (mesh.getWorldScale(new THREE.Vector3()).x || 1);
        const sphere = new THREE.Sphere(local, radius);
        geometry.boundsTree.shapecast({
          intersectsBounds: (box: THREE.Box3) => sphere.intersectsBox(box),
          intersectsTriangle: (triangle: THREE.Triangle, triangleIndex: number) => {
            const closest = triangle.closestPointToPoint(sphere.center, new THREE.Vector3());
            if (closest.distanceTo(sphere.center) > radius) return false;
            const face = index ? Math.floor(index.getX(triangleIndex * 3) / 3) : triangleIndex;
            faces.add(start + face);
            return false;
          },
        });
      });
      updateZone(paintZoneId, { faces: encodeRuns(faces) });
    },
    [paintZoneId, zones, faceData, brushRadiusMm, updateZone],
  );

  // Where the model sits, for Add text's recovered defaults (4j, C8): the
  // raw → face transform applied above and the marked glyphs' face-frame centres.
  const setModelFrame = useEditorStore((s) => s.setModelFrame);
  useEffect(() => {
    model.updateWorldMatrix(true, true);
    const groups = model.children.filter((c) => (c as THREE.Mesh).isMesh);
    const centre = new THREE.Vector3();
    const markedGlyphCentres = (markedKey ? markedKey.split(",").map(Number) : [])
      .map((i) => groups[i])
      .filter(Boolean)
      .map((mesh) => {
        new THREE.Box3().setFromObject(mesh).getCenter(centre);
        return [centre.x, centre.y] as [number, number];
      });
    const q = model.quaternion;
    setModelFrame({
      productKey: url,
      transform: { quaternion: [q.x, q.y, q.z, q.w], scale: model.scale.x, offset: [model.position.x, model.position.y, model.position.z] },
      markedGlyphCentres,
    });
    return () => setModelFrame(null);
  }, [model, url, markedKey, setModelFrame]);

  // C4: local-model bounds only (never the world-space, camera-attached
  // scene) — `model` has its own calibrated scale/orientation baked in and
  // no ancestor transform yet, so this is the same union of local mesh
  // bounds × factor × variantScale the ruling asks for, already in mm.
  // Camera rotation never touches it (spec §22): the camera is never an
  // ancestor of `model` when this runs.
  const bounds = useMemo(() => new THREE.Box3().setFromObject(model), [model]);

  useEffect(() => {
    onFaceZ?.(bounds.max.z);
  }, [bounds, onFaceZ]);

  useEffect(() => {
    if (!onRulerMeasurements) return;
    const size = bounds.getSize(new THREE.Vector3());
    onRulerMeasurements({
      diameterMm: Math.max(size.x, size.y),
      thicknessMm: size.z,
      minX: bounds.min.x,
      maxX: bounds.max.x,
      minY: bounds.min.y,
      maxY: bounds.max.y,
      minZ: bounds.min.z,
      maxZ: bounds.max.z,
    });
  }, [bounds, onRulerMeasurements]);

  // Frame on load (R1, Phase 3): three-quarter view, distance solved so the
  // projected bounding box fills TARGET_VIEWPORT_FILL of the limiting
  // viewport dimension. saveState() makes this the double-click home.
  useEffect(() => {
    const perspective = camera as THREE.PerspectiveCamera;
    const center = bounds.getCenter(new THREE.Vector3());
    // E2 U9: the same solve the cluster's zoom-to-fit runs (`lib/framing`), so
    // "fit" and "reset view" cannot drift apart.
    const box: BoundsMm = { minX: bounds.min.x, maxX: bounds.max.x, minY: bounds.min.y, maxY: bounds.max.y, minZ: bounds.min.z, maxZ: bounds.max.z };
    const direction = homeDirection();
    const corners = cornersOf(box);

    const distance = fitDistance(perspective, center, corners, direction, Math.max(bounds.getSize(new THREE.Vector3()).length(), 1) * 2);
    camera.position.copy(center).addScaledVector(direction, distance);
    camera.lookAt(center);
    gl.domElement.dataset.cameraHome = `${direction.x.toFixed(3)},${direction.y.toFixed(3)},${direction.z.toFixed(3)}`;
    perspective.near = distance / 100;
    perspective.far = distance * 100;
    perspective.updateProjectionMatrix();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(center);
      controls.minDistance = distance * 0.35;
      controls.maxDistance = distance * 3;
      controls.update();
      controls.saveState();
    }
  }, [bounds, camera, gl, controlsRef, viewport.width, viewport.height]);

  const size = bounds.getSize(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z) * 2.5;

  return (
    <>
      <primitive
        object={model}
        onPointerDown={(event: ThreeEvent<PointerEvent>) => {
          if (!paintZoneId) return;
          event.stopPropagation();
          painting.current = true;
          paintAt(event.point);
        }}
        onPointerMove={(event: ThreeEvent<PointerEvent>) => {
          if (!paintZoneId || !painting.current) return;
          event.stopPropagation();
          paintAt(event.point);
        }}
        onPointerUp={() => {
          if (!painting.current) return;
          painting.current = false;
          commitZone();
        }}
      />
      <BrandingMeshes
        layers={layers}
        logoSources={logoSources}
        model={model}
        faceZ={bounds.max.z}
        material={material}
        layerMaterials={layerMaterials}
        onGroupReady={(group, key) => {
          reliefGroup.current = group;
          setReliefKey(key);
        }}
        onReport={onTextReport}
      />
      <ContactShadows
        key={`${renderedSizeMm}-${url}`}
        position={[0, bounds.min.y - 0.01, 0]}
        scale={footprint}
        far={size.y}
        blur={2.4}
        opacity={0.45}
        resolution={512}
        frames={1}
      />
    </>
  );
}
