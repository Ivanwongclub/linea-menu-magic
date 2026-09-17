import { useEffect, useMemo, type RefObject } from "react";
import { useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import type { EditorColour } from "../hooks/useEditorProduct";
import type { PickerFinish } from "../hooks/useFinishOptions";

interface EditorModelProps {
  url: string;
  /** Real-world size of the selected variant — scales the model so 1 scene unit = 1mm. */
  sizePrimaryMm: number;
  isMetal: boolean;
  finish: PickerFinish | null;
  colour: EditorColour | null;
  controlsRef: RefObject<OrbitControlsImpl>;
}

const TARGET_VIEWPORT_FILL = 0.6;

/**
 * BRUSHED runs linear along the model's local X axis, which is already
 * three.js's zero-rotation tangent default — no rotation needed. Every
 * other surface (including CIRCLE_BRUSHED, a radial pattern no single
 * linear angle can express without per-vertex tangent data) gets the same
 * neutral value; a true radial mapping is Phase 6+ geometry work (R6).
 */
function anisotropyRotationForSurface(_surfaceCode: string | undefined): number {
  return 0;
}

/**
 * `MeshPhysicalMaterial` driven directly by the finish row's PBR columns
 * (axis-design §4) — no hand-tuned presets. A non-metal product renders its
 * colour instead; there is no PBR data for a plain colourway, so metalness
 * is 0 and roughness a plain mid default.
 */
export function EditorModel({ url, sizePrimaryMm, isMetal, finish, colour, controlsRef }: EditorModelProps) {
  const obj = useLoader(OBJLoader, url);
  const { camera } = useThree();

  const material = useMemo(() => {
    if (isMetal && finish) {
      return new THREE.MeshPhysicalMaterial({
        color: finish.hex_approx ?? "#9a9a9a",
        metalness: finish.metalness,
        roughness: finish.roughness,
        anisotropy: finish.anisotropy,
        anisotropyRotation: anisotropyRotationForSurface(finish.surface?.code),
      });
    }
    return new THREE.MeshPhysicalMaterial({
      color: colour?.hex ?? "#9a9a9a",
      metalness: 0,
      roughness: 0.5,
    });
  }, [isMetal, finish, colour]);

  useEffect(() => () => material.dispose(), [material]);

  const model = useMemo(() => {
    const clone = obj.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = material;
      }
    });

    // 1 scene unit = 1mm: scale the loaded geometry's horizontal extent to
    // the selected variant's real measurement, regardless of the source
    // file's own units (architecture Part 6 / R6, Phase 2).
    const rawBox = new THREE.Box3().setFromObject(clone);
    const size = rawBox.getSize(new THREE.Vector3());
    const rawDiameter = Math.max(size.x, size.z);
    if (rawDiameter > 0 && sizePrimaryMm > 0) {
      clone.scale.setScalar(sizePrimaryMm / rawDiameter);
    }

    // Recenter so the bounding box sits at the origin — camera framing below
    // targets (0,0,0), and this replaces drei's <Center> so the box used for
    // framing matches the box actually rendered, with no wrapper offset.
    const scaledBox = new THREE.Box3().setFromObject(clone);
    clone.position.sub(scaledBox.getCenter(new THREE.Vector3()));

    return clone;
  }, [obj, material, sizePrimaryMm]);

  // R1: frame by bounding sphere on every new model so it fills ~60% of the
  // viewport, three-quarter view, decorated (+Z) face toward the camera.
  // `saveState()` makes this the OrbitControls "home" — double-click reset
  // returns here rather than an arbitrary earlier position.
  useEffect(() => {
    const sphere = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere());
    const perspective = camera as THREE.PerspectiveCamera;
    const fov = THREE.MathUtils.degToRad(perspective.fov ?? 35);
    const distance = sphere.radius > 0 ? sphere.radius / (TARGET_VIEWPORT_FILL * Math.tan(fov / 2)) : 60;
    const elevation = THREE.MathUtils.degToRad(30);
    const azimuth = THREE.MathUtils.degToRad(-25);

    camera.position.set(
      distance * Math.cos(elevation) * Math.sin(azimuth),
      distance * Math.sin(elevation),
      distance * Math.cos(elevation) * Math.cos(azimuth),
    );
    camera.lookAt(sphere.center);
    perspective.updateProjectionMatrix?.();

    const controls = controlsRef.current;
    if (controls) {
      controls.target.copy(sphere.center);
      controls.update();
      controls.saveState();
    }
  }, [model, camera, controlsRef]);

  return <primitive object={model} />;
}
