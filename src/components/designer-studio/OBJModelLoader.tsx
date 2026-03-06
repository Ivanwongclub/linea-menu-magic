import { useEffect, useState, useRef, useMemo } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import { Center } from "@react-three/drei";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";

interface OBJModelProps {
  url: string;
  autoRotate?: boolean;
  material?: {
    color?: string;
    metalness?: number;
    roughness?: number;
  };
}

const OBJModel = ({ url, autoRotate = false, material }: OBJModelProps) => {
  const obj = useLoader(OBJLoader, url);
  const groupRef = useRef<THREE.Group>(null);

  const clonedObj = useMemo(() => {
    const clone = obj.clone(true);
    const mat = new THREE.MeshStandardMaterial({
      color: material?.color || "#C4A052",
      metalness: material?.metalness ?? 0.8,
      roughness: material?.roughness ?? 0.2,
    });
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = mat;
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
    // Normalize model size to fit within ~2 units
    const box = new THREE.Box3().setFromObject(clone);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 2 / maxDim;
      clone.scale.setScalar(scale);
    }
    return clone;
  }, [obj, material?.color, material?.metalness, material?.roughness]);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group ref={groupRef}>
      <Center>
        <primitive object={clonedObj} />
      </Center>
    </group>
  );
};

export default OBJModel;
