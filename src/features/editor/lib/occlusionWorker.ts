/// <reference lib="webworker" />
/**
 * The ambient-occlusion bake, off the main thread (Phase 6b R4; E1 §6 R6).
 *
 * Everything crosses as plain arrays: the occluders' triangles in root space,
 * and one entry per geometry that needs an `occlusion` attribute. Rays are
 * cast over the cosine hemisphere around each vertex normal against one BVH of
 * the whole part — the relief the editor has carved included (Phase 5 Q3), so
 * an engraved recess reads as a recess and takes the oxide.
 */
import * as THREE from "three";
import { MeshBVH } from "three-mesh-bvh";

export interface OcclusionTarget {
  id: string;
  /** Vertex positions and normals, already in root space. */
  positions: Float32Array;
  normals: Float32Array;
}

export interface OcclusionRequest {
  id: number;
  /** Triangle soup in root space: every occluder, whether or not it is also a target. */
  occluders: Float32Array;
  targets: OcclusionTarget[];
  rays: number;
  /** Rays longer than this ignore the hit. */
  reach: number;
}

export interface OcclusionResponse {
  id: number;
  results: { id: string; occlusion: Float32Array }[];
}

/** Fibonacci spiral, cosine-weighted. */
export function hemisphereDirections(count: number): THREE.Vector3[] {
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

export function bake({ occluders, targets, rays, reach }: Omit<OcclusionRequest, "id">): { id: string; occlusion: Float32Array }[] {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(occluders, 3));
  const bvh = new MeshBVH(geometry);
  const directions = hemisphereDirections(rays);
  const epsilon = reach * 0.002;

  const ray = new THREE.Ray();
  const v = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const tangent = new THREE.Vector3();
  const bitangent = new THREE.Vector3();
  const results: { id: string; occlusion: Float32Array }[] = [];

  for (const target of targets) {
    const count = Math.floor(target.positions.length / 3);
    const occlusion = new Float32Array(count);
    // Vertices that share a position and a normal are baked once — OBJLoader
    // emits un-indexed triangles, so this is most of the work saved.
    const seen = new Map<string, number>();
    for (let i = 0; i < count; i++) {
      v.set(target.positions[i * 3], target.positions[i * 3 + 1], target.positions[i * 3 + 2]);
      normal.set(target.normals[i * 3], target.normals[i * 3 + 1], target.normals[i * 3 + 2]).normalize();
      const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)},${normal.x.toFixed(2)},${normal.y.toFixed(2)},${normal.z.toFixed(2)}`;
      const cached = seen.get(key);
      if (cached !== undefined) {
        occlusion[i] = cached;
        continue;
      }
      tangent.set(Math.abs(normal.x) > 0.9 ? 0 : 1, Math.abs(normal.x) > 0.9 ? 1 : 0, 0).cross(normal).normalize();
      bitangent.crossVectors(normal, tangent);
      let hits = 0;
      for (const d of directions) {
        ray.origin.copy(v).addScaledVector(normal, epsilon);
        ray.direction.set(0, 0, 0).addScaledVector(tangent, d.x).addScaledVector(bitangent, d.y).addScaledVector(normal, d.z).normalize();
        if (bvh.raycastFirst(ray, THREE.DoubleSide, 0, reach)) hits++;
      }
      occlusion[i] = hits / rays;
      seen.set(key, occlusion[i]);
    }
    results.push({ id: target.id, occlusion });
  }
  geometry.dispose();
  return results;
}

// The worker entry point. (Imported for its types on the main thread too, which
// is why the listener is guarded: a window has no `onmessage` contract here.)
if (typeof self !== "undefined" && typeof (self as unknown as DedicatedWorkerGlobalScope).postMessage === "function" && typeof window === "undefined") {
  self.onmessage = (event: MessageEvent<OcclusionRequest>) => {
    const { id, ...request } = event.data;
    const results = bake(request);
    const response: OcclusionResponse = { id, results };
    (self as unknown as DedicatedWorkerGlobalScope).postMessage(response, results.map((r) => r.occlusion.buffer));
  };
}
