import { useEffect, useLayoutEffect, useMemo, type RefObject } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { EditorColour } from "../hooks/useEditorProduct";
import type { PickerFinish } from "../hooks/useFinishOptions";
import { decoratedFaceRotation, withSmoothNormals } from "../lib/prepareModel";
import { bakeOcclusion, occlusionKey } from "../lib/ambientOcclusion";
import { useEditorStore } from "../store/useEditorStore";
import { applyShaderPatches, brushForSurface } from "../lib/shaderPatch";
import type { Layer } from "../lib/recipe";
import { BrandingMeshes, type TextSceneReport } from "./branding/BrandingMeshes";
import {
  CAMERA_AZIMUTH_DEG,
  CAMERA_ELEVATION_DEG,
  NON_METAL_ROUGHNESS,
  TARGET_VIEWPORT_FILL,
} from "../lib/renderSettings";

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
  /** Hide the marked groups — the buyer view (4j); staff may show them. */
  hideMarked: boolean;
  /** Reports how many of the model's meshes are drawn, and how many it has. */
  onMeshCount?: (drawn: number, total: number) => void;
  /** The recipe's layers, drawn on the face — siblings of the model, never inside its measured bounds. */
  layers: Layer[];
  /** The SVG behind each logo layer, by layer id (4k). */
  logoSources: Record<string, string>;
  onTextReport?: (report: TextSceneReport) => void;
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
 * `anisotropyRotation` stays 0: the brush direction is no longer a rotation
 * of three.js's derivative tangent but a tangent computed per fragment —
 * linear along the face frame's X for BRUSHED, radial about the face centre
 * for CIRCLE_BRUSHED (Phase 5 R5, `lib/shaderPatch.ts`).
 */
const ANISOTROPY_ROTATION = 0;

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
  onTextReport,
}: EditorModelProps) {
  const obj = useLoader(OBJLoader, url);
  const { camera, gl, size: viewport } = useThree();

  const twoTone = !!(isMetal && finish?.two_tone);

  const material = useMemo(() => {
    if (isMetal && finish) {
      const m = new THREE.MeshPhysicalMaterial({
        color: finish.base_color_hex ?? finish.hex_approx ?? "#9a9a9a",
        metalness: finish.metalness,
        roughness: finish.roughness,
        anisotropy: finish.anisotropy,
        anisotropyRotation: ANISOTROPY_ROTATION,
        clearcoat: finish.clearcoat ?? 0,
        clearcoatRoughness: finish.clearcoat_roughness ?? 0,
      });
      applyShaderPatches(m, {
        twoTone: !!finish.two_tone,
        twoToneOxideHex: finish.oxide_color_hex,
        brush: brushForSurface(finish.surface?.code, finish.anisotropy),
      });
      return m;
    }
    return new THREE.MeshPhysicalMaterial({
      color: colour?.hex ?? "#9a9a9a",
      metalness: 0,
      roughness: NON_METAL_ROUGHNESS,
    });
  }, [isMetal, finish, colour]);

  useEffect(() => () => material.dispose(), [material]);

  // Geometry prep is per loaded file: smooth normals where missing, then the
  // rotation that brings the decorated face to +Z.
  const prepared = useMemo(() => {
    const group = obj.clone(true);
    group.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.geometry = withSmoothNormals(mesh.geometry);
    });
    group.quaternion.copy(decoratedFaceRotation(group));
    return group;
  }, [obj]);

  const markedKey = [...markedGroupIndices].sort((a, b) => a - b).join(",");
  const hiddenIndices = useMemo(() => (hideMarked && markedKey ? markedKey.split(",").map(Number) : []), [hideMarked, markedKey]);

  // Baked once per file and hidden set, and only once an antique finish
  // needs it; hidden groups are out of the BVH (collision 9).
  useMemo(() => {
    if (!twoTone) return;
    const groups = prepared.children.filter((c) => (c as THREE.Mesh).isMesh);
    bakeOcclusion(prepared, occlusionKey(url, hiddenIndices), new Set(hiddenIndices.map((i) => groups[i]).filter(Boolean)));
  }, [prepared, url, twoTone, hiddenIndices]);

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
    const elevation = THREE.MathUtils.degToRad(CAMERA_ELEVATION_DEG);
    const azimuth = THREE.MathUtils.degToRad(CAMERA_AZIMUTH_DEG);
    const direction = new THREE.Vector3(
      Math.cos(elevation) * Math.sin(azimuth),
      Math.sin(elevation),
      Math.cos(elevation) * Math.cos(azimuth),
    );
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
      (i) =>
        new THREE.Vector3(
          i & 1 ? bounds.max.x : bounds.min.x,
          i & 2 ? bounds.max.y : bounds.min.y,
          i & 4 ? bounds.max.z : bounds.min.z,
        ),
    );

    let distance = Math.max(bounds.getSize(new THREE.Vector3()).length(), 1) * 2;
    const ndc = new THREE.Vector3();
    for (let i = 0; i < 6; i++) {
      camera.position.copy(center).addScaledVector(direction, distance);
      camera.lookAt(center);
      camera.updateMatrixWorld();
      perspective.updateProjectionMatrix();
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const c of corners) {
        ndc.copy(c).project(camera);
        minX = Math.min(minX, ndc.x);
        maxX = Math.max(maxX, ndc.x);
        minY = Math.min(minY, ndc.y);
        maxY = Math.max(maxY, ndc.y);
      }
      const fill = Math.max(maxX - minX, maxY - minY) / 2;
      if (fill <= 0) break;
      distance *= fill / TARGET_VIEWPORT_FILL;
    }
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
      <primitive object={model} />
      <BrandingMeshes layers={layers} logoSources={logoSources} model={model} faceZ={bounds.max.z} material={material} onReport={onTextReport} />
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
