import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";

/**
 * Per-vertex ambient occlusion for the antique two-tone (Phase 3c R2):
 * baked once per model file at load, cached by URL, written to an
 * `occlusion` attribute (0 = open, 1 = fully enclosed). Rays are cast over
 * the cosine hemisphere around each vertex normal against one BVH of the
 * whole part, so a recess formed by two neighbouring groups still reads as
 * a recess. Vertices that share a position and normal are baked once —
 * OBJLoader emits un-indexed triangles, so this is most of the work saved.
 */
const RAYS = 32;
/** Rays longer than this fraction of the part's largest dimension ignore the hit. */
const REACH = 0.08;

const baked = new Map<string, true>();

function hemisphereDirections(count: number): THREE.Vector3[] {
  // Fibonacci spiral, cosine-weighted.
  const dirs: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const u = (i + 0.5) / count;
    const r = Math.sqrt(u);
    const phi = i * golden;
    dirs.push(new THREE.Vector3(r * Math.cos(phi), r * Math.sin(phi), Math.sqrt(1 - u)));
  }
  return dirs;
}

/** Idempotent: meshes that already carry `occlusion` are skipped, and a URL is baked once. */
export function bakeOcclusion(root: THREE.Object3D, cacheKey: string): void {
  if (baked.has(cacheKey)) return;

  root.updateWorldMatrix(true, true);
  const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const meshes: THREE.Mesh[] = [];
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh && mesh.geometry.getAttribute("position")) meshes.push(mesh);
  });
  if (meshes.length === 0) return;

  // One geometry in root space for the BVH.
  const toRoot = meshes.map((m) => new THREE.Matrix4().multiplyMatrices(inverseRoot, m.matrixWorld));
  let total = 0;
  for (const m of meshes) total += m.geometry.getIndex()?.count ?? m.geometry.getAttribute("position").count;
  const merged = new Float32Array(total * 3);
  const v = new THREE.Vector3();
  let offset = 0;
  meshes.forEach((m, mi) => {
    const pos = m.geometry.getAttribute("position");
    const idx = m.geometry.getIndex();
    const count = idx ? idx.count : pos.count;
    for (let i = 0; i < count; i++) {
      const vi = idx ? idx.getX(i) : i;
      v.fromBufferAttribute(pos, vi).applyMatrix4(toRoot[mi]);
      merged[offset++] = v.x;
      merged[offset++] = v.y;
      merged[offset++] = v.z;
    }
  });
  const bvhGeometry = new THREE.BufferGeometry();
  bvhGeometry.setAttribute("position", new THREE.BufferAttribute(merged.subarray(0, offset - (offset % 9)), 3));
  const bvh = new MeshBVH(bvhGeometry);

  const box = new THREE.Box3().setFromBufferAttribute(bvhGeometry.getAttribute("position") as THREE.BufferAttribute);
  const size = box.getSize(new THREE.Vector3());
  const reach = Math.max(size.x, size.y, size.z) * REACH;
  const epsilon = reach * 0.002;
  const local = hemisphereDirections(RAYS);
  const ray = new THREE.Ray();
  const tangent = new THREE.Vector3();
  const bitangent = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  const seen = new Map<string, number>();

  meshes.forEach((m, mi) => {
    const geometry = m.geometry;
    if (geometry.getAttribute("occlusion")) return;
    const pos = geometry.getAttribute("position");
    const nor = geometry.getAttribute("normal");
    const occlusion = new Float32Array(pos.count);
    normalMatrix.getNormalMatrix(toRoot[mi]);

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyMatrix4(toRoot[mi]);
      normal.fromBufferAttribute(nor, i).applyMatrix3(normalMatrix).normalize();
      const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)},${normal.x.toFixed(2)},${normal.y.toFixed(2)},${normal.z.toFixed(2)}`;
      const cached = seen.get(key);
      if (cached !== undefined) {
        occlusion[i] = cached;
        continue;
      }
      tangent.set(Math.abs(normal.x) > 0.9 ? 0 : 1, Math.abs(normal.x) > 0.9 ? 1 : 0, 0).cross(normal).normalize();
      bitangent.crossVectors(normal, tangent);
      let hits = 0;
      for (const d of local) {
        ray.origin.copy(v).addScaledVector(normal, epsilon);
        ray.direction.set(0, 0, 0).addScaledVector(tangent, d.x).addScaledVector(bitangent, d.y).addScaledVector(normal, d.z).normalize();
        if (bvh.raycastFirst(ray, THREE.DoubleSide, 0, reach)) hits++;
      }
      occlusion[i] = hits / RAYS;
      seen.set(key, occlusion[i]);
    }
    geometry.setAttribute("occlusion", new THREE.BufferAttribute(occlusion, 1));
  });

  bvhGeometry.dispose();
  baked.set(cacheKey, true);
}
