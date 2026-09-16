import { useEffect, useMemo } from "react";
import { useLoader } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { EditorColour, EditorFinish } from "../hooks/useEditorProduct";

interface EditorModelProps {
  url: string;
  /** Real-world size of the selected variant — scales the model so 1 scene unit = 1mm. */
  sizePrimaryMm: number;
  isMetal: boolean;
  finish: EditorFinish | null;
  colour: EditorColour | null;
}

/**
 * `MeshPhysicalMaterial` driven directly by the finish row's three PBR
 * columns (axis-design §4) — no hand-tuned presets. A non-metal product
 * renders its colour instead; there is no PBR data for a plain colourway,
 * so metalness is 0 and roughness a plain mid default.
 */
export function EditorModel({ url, sizePrimaryMm, isMetal, finish, colour }: EditorModelProps) {
  const obj = useLoader(OBJLoader, url);

  const material = useMemo(() => {
    if (isMetal && finish) {
      return new THREE.MeshPhysicalMaterial({
        color: finish.hex_approx ?? "#9a9a9a",
        metalness: finish.metalness,
        roughness: finish.roughness,
        anisotropy: finish.anisotropy,
        anisotropyRotation: 0,
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
    // file's own units (architecture Part 6 / R6).
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const rawDiameter = Math.max(size.x, size.z);
    if (rawDiameter > 0 && sizePrimaryMm > 0) {
      clone.scale.setScalar(sizePrimaryMm / rawDiameter);
    }
    return clone;
  }, [obj, material, sizePrimaryMm]);

  return (
    <Center>
      <primitive object={model} />
    </Center>
  );
}
