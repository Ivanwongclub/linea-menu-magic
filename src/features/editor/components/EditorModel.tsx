import { useEffect, useLayoutEffect, useMemo, type RefObject } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { EditorColour } from "../hooks/useEditorProduct";
import type { PickerFinish } from "../hooks/useFinishOptions";
import { decoratedFaceRotation, withSmoothNormals } from "../lib/prepareModel";
import {
  CAMERA_AZIMUTH_DEG,
  CAMERA_ELEVATION_DEG,
  NON_METAL_ROUGHNESS,
  TARGET_VIEWPORT_FILL,
} from "../lib/renderSettings";

interface EditorModelProps {
  url: string;
  /** Real-world size of the selected variant — scales the model so 1 scene unit = 1mm. */
  sizePrimaryMm: number;
  isMetal: boolean;
  finish: PickerFinish | null;
  colour: EditorColour | null;
  controlsRef: RefObject<OrbitControlsImpl>;
}

/**
 * BRUSHED runs linear along the model's local X axis, which is three.js's
 * zero-rotation tangent default. CIRCLE_BRUSHED is radial — no single
 * angle expresses it without per-vertex tangents — and every other surface
 * is isotropic, so all resolve to 0 today (R6, Phase 3).
 */
function anisotropyRotationForSurface(_surfaceCode: string | undefined): number {
  return 0;
}

/**
 * `MeshPhysicalMaterial` straight from the finish row (Phase 3b R3/R4): the
 * database derives base colour from measured metal F0, roughness and
 * anisotropy from the surface, clearcoat from enamel-dip. A non-metal
 * product renders its colour as a plain dielectric.
 */
export function EditorModel({ url, sizePrimaryMm, isMetal, finish, colour, controlsRef }: EditorModelProps) {
  const obj = useLoader(OBJLoader, url);
  const { camera, size: viewport } = useThree();

  const material = useMemo(() => {
    if (isMetal && finish) {
      return new THREE.MeshPhysicalMaterial({
        color: finish.base_color_hex ?? finish.hex_approx ?? "#9a9a9a",
        metalness: finish.metalness,
        roughness: finish.roughness,
        anisotropy: finish.anisotropy,
        anisotropyRotation: anisotropyRotationForSurface(finish.surface?.code),
        clearcoat: finish.clearcoat ?? 0,
        clearcoatRoughness: finish.clearcoat_roughness ?? 0,
      });
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

  // Material is assigned separately so changing the finish never rebuilds
  // the object — which would re-run framing and yank the camera.
  const model = useMemo(() => {
    const clone = prepared.clone(true);

    // 1 scene unit = 1mm: the face (now in XY) spans the variant's real size.
    const rawBox = new THREE.Box3().setFromObject(clone);
    const rawSize = rawBox.getSize(new THREE.Vector3());
    const rawDiameter = Math.max(rawSize.x, rawSize.y);
    if (rawDiameter > 0 && sizePrimaryMm > 0) {
      clone.scale.setScalar(sizePrimaryMm / rawDiameter);
    }

    const scaledBox = new THREE.Box3().setFromObject(clone);
    clone.position.sub(scaledBox.getCenter(new THREE.Vector3()));
    return clone;
  }, [prepared, sizePrimaryMm]);

  useLayoutEffect(() => {
    model.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (mesh.isMesh) mesh.material = material;
    });
  }, [model, material]);

  const bounds = useMemo(() => new THREE.Box3().setFromObject(model), [model]);

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
  }, [bounds, camera, controlsRef, viewport.width, viewport.height]);

  const size = bounds.getSize(new THREE.Vector3());
  const footprint = Math.max(size.x, size.z) * 2.5;

  return (
    <>
      <primitive object={model} />
      <ContactShadows
        key={`${sizePrimaryMm}-${url}`}
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
