import * as THREE from "three";
import type { OcclusionRequest, OcclusionResponse, OcclusionTarget } from "./occlusionWorker";

/**
 * Per-vertex ambient occlusion for the antique two-tone (Phase 3c R2), baked
 * in a Web Worker since Phase 6b (R4; E1 §6 R6): the main thread gathers the
 * triangles, hands them over, and paints the result on when it arrives, so
 * toggling the original lettering or hiding a part no longer freezes the
 * viewport.
 *
 * What occludes: every mesh the buyer can see, plus the relief the editor has
 * carved — an engraved recess is a recess, and takes the oxide (Phase 5 Q3).
 * Meshes the buyer can't see (the product's marked branding, a hidden part)
 * are left out, so the blank face carries no shadow of geometry that isn't
 * drawn (4j, E1 collision 9).
 *
 * The cache is keyed by model, hidden set and relief, and each key's
 * attributes are kept: toggling back re-applies a bake instead of redoing it.
 */
const RAYS = 32;
/** Rays longer than this fraction of the part's largest dimension ignore the hit. */
const REACH = 0.08;

const baked = new Map<string, Map<THREE.BufferGeometry, THREE.BufferAttribute>>();
const pending = new Map<string, Promise<void>>();

let worker: Worker | null = null;
let nextRequestId = 1;
const inFlight = new Map<number, (response: OcclusionResponse) => void>();

function occlusionWorker(): Worker {
  if (!worker) {
    worker = new Worker(new URL("./occlusionWorker.ts", import.meta.url), { type: "module" });
    worker.onmessage = (event: MessageEvent<OcclusionResponse>) => {
      const resolve = inFlight.get(event.data.id);
      inFlight.delete(event.data.id);
      resolve?.(event.data);
    };
  }
  return worker;
}

function runInWorker(request: Omit<OcclusionRequest, "id">): Promise<OcclusionResponse> {
  const id = nextRequestId++;
  return new Promise((resolve) => {
    inFlight.set(id, resolve);
    const transfers = [request.occluders.buffer, ...request.targets.flatMap((t) => [t.positions.buffer, t.normals.buffer])];
    occlusionWorker().postMessage({ id, ...request } satisfies OcclusionRequest, transfers);
  });
}

/** The cache key for a model file with some groups hidden (collision 9) and some relief on it. */
export function occlusionKey(url: string, hiddenIndices: number[], reliefKey = ""): string {
  return `${url}|hidden:${[...hiddenIndices].sort((a, b) => a - b).join(",")}${reliefKey ? `|relief:${reliefKey}` : ""}`;
}

/** Applies a finished bake, if this key has one. */
export function applyBakedOcclusion(cacheKey: string): boolean {
  const cached = baked.get(cacheKey);
  if (!cached) return false;
  for (const [geometry, attribute] of cached) geometry.setAttribute("occlusion", attribute);
  return true;
}

interface BakeInput {
  /** Drawn meshes of the part: they occlude and they receive. */
  root: THREE.Object3D;
  excluded?: ReadonlySet<THREE.Object3D>;
  /** Relief meshes (Phase 5): they occlude, and their own faces receive too. */
  relief?: THREE.Object3D | null;
}

function collect(root: THREE.Object3D, excluded: ReadonlySet<THREE.Object3D>, toRootSpace: THREE.Matrix4, out: THREE.Mesh[]): void {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (!mesh.isMesh || excluded.has(mesh) || !mesh.visible) return;
    if (!mesh.geometry.getAttribute("position") || !mesh.geometry.getAttribute("normal")) return;
    out.push(mesh);
  });
  void toRootSpace;
}

/**
 * Bakes `cacheKey` in the worker and applies it when it lands. Resolves once
 * the attributes are on the geometries; a key already baking is awaited rather
 * than baked twice.
 */
export interface BakeStats {
  /** What the main thread spent gathering and applying, ms (6b R4/R7). */
  mainThreadMs: number;
  /** Wall time from request to applied, ms — mostly the worker's own work. */
  totalMs: number;
}

export async function bakeOcclusion(cacheKey: string, { root, excluded = new Set(), relief = null }: BakeInput): Promise<BakeStats> {
  const startedAt = performance.now();
  if (applyBakedOcclusion(cacheKey)) return { mainThreadMs: performance.now() - startedAt, totalMs: performance.now() - startedAt };
  const already = pending.get(cacheKey);
  if (already) {
    await already;
    return { mainThreadMs: 0, totalMs: performance.now() - startedAt };
  }

  root.updateWorldMatrix(true, true);
  relief?.updateWorldMatrix(true, true);
  const inverseRoot = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const meshes: THREE.Mesh[] = [];
  collect(root, excluded, inverseRoot, meshes);
  const reliefMeshes: THREE.Mesh[] = [];
  if (relief) collect(relief, new Set(), inverseRoot, reliefMeshes);
  if (meshes.length === 0) return { mainThreadMs: performance.now() - startedAt, totalMs: performance.now() - startedAt };

  const all = [...meshes, ...reliefMeshes];
  const toRoot = all.map((m) => new THREE.Matrix4().multiplyMatrices(inverseRoot, m.matrixWorld));

  // One triangle soup in root space for the BVH.
  let total = 0;
  for (const m of all) total += m.geometry.getAttribute("position").count;
  const occluders = new Float32Array(total * 3);
  const v = new THREE.Vector3();
  let offset = 0;
  all.forEach((m, mi) => {
    const position = m.geometry.getAttribute("position");
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(toRoot[mi]);
      occluders[offset++] = v.x;
      occluders[offset++] = v.y;
      occluders[offset++] = v.z;
    }
  });

  const box = new THREE.Box3().setFromArray(occluders);
  const size = box.getSize(new THREE.Vector3());
  const reach = Math.max(size.x, size.y, size.z) * REACH;

  const normalMatrix = new THREE.Matrix3();
  const normal = new THREE.Vector3();
  const targets: OcclusionTarget[] = all.map((m, mi) => {
    const position = m.geometry.getAttribute("position");
    const source = m.geometry.getAttribute("normal");
    const positions = new Float32Array(position.count * 3);
    const normals = new Float32Array(position.count * 3);
    normalMatrix.getNormalMatrix(toRoot[mi]);
    for (let i = 0; i < position.count; i++) {
      v.fromBufferAttribute(position, i).applyMatrix4(toRoot[mi]);
      normal.fromBufferAttribute(source, i).applyMatrix3(normalMatrix).normalize();
      positions[i * 3] = v.x;
      positions[i * 3 + 1] = v.y;
      positions[i * 3 + 2] = v.z;
      normals[i * 3] = normal.x;
      normals[i * 3 + 1] = normal.y;
      normals[i * 3 + 2] = normal.z;
    }
    return { id: String(mi), positions, normals };
  });

  // Everything above is the main thread's whole share of the bake: the rays
  // are the worker's (R4).
  const gatheredAt = performance.now();
  const run = runInWorker({ occluders, targets, rays: RAYS, reach }).then((response) => {
    const appliedFrom = performance.now();
    const result = new Map<THREE.BufferGeometry, THREE.BufferAttribute>();
    for (const { id, occlusion } of response.results) {
      const mesh = all[Number(id)];
      if (!mesh) continue;
      const attribute = new THREE.BufferAttribute(occlusion, 1);
      mesh.geometry.setAttribute("occlusion", attribute);
      result.set(mesh.geometry, attribute);
    }
    baked.set(cacheKey, result);
    pending.delete(cacheKey);
    return {
      mainThreadMs: gatheredAt - startedAt + (performance.now() - appliedFrom),
      totalMs: performance.now() - startedAt,
    };
  });
  pending.set(cacheKey, run.then(() => undefined));
  return run;
}
