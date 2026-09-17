import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Smooth normals where the OBJ carries none (R5). OBJLoader emits
 * non-indexed triangles, so `computeVertexNormals` alone would give flat
 * facets — vertices are welded first so shared corners average.
 * Returns a new geometry; the loader's cached one is left alone.
 */
export function withSmoothNormals(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  if (geometry.getAttribute("normal")) return geometry;
  const bare = geometry.clone();
  bare.deleteAttribute("uv");
  const welded = mergeVertices(bare);
  welded.computeVertexNormals();
  return welded;
}

/**
 * Rotation — never a negative scale (R5) — that turns the decorated face
 * toward +Z. The face axis is the part's thinnest dimension; the decorated
 * side of it is the one carrying more geometry (relief lettering is dense).
 */
export function decoratedFaceRotation(object: THREE.Object3D): THREE.Quaternion {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const axis = size.x <= size.y && size.x <= size.z ? 0 : size.y <= size.z ? 1 : 2;
  const min = box.min.getComponent(axis);
  const extent = size.getComponent(axis);
  if (extent <= 0) return new THREE.Quaternion();

  let high = 0;
  let low = 0;
  const v = new THREE.Vector3();
  object.updateWorldMatrix(true, true);
  object.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    const position = mesh.geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(mesh.matrixWorld);
      const t = (v.getComponent(axis) - min) / extent;
      if (t >= 0.7) high++;
      else if (t <= 0.3) low++;
    }
  });

  const face = new THREE.Vector3().setComponent(axis, low > high * 1.1 ? -1 : 1);
  return new THREE.Quaternion().setFromUnitVectors(face, new THREE.Vector3(0, 0, 1));
}
