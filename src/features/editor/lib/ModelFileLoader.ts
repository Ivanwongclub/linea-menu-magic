import { FileLoader, Group, Loader, Mesh, MeshPhongMaterial, type LoadingManager } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { modelFormatFromName, type ModelFormat } from "./modelFormat.ts";
import { parseObjSurfaceParts } from "./objSurfaceParts.ts";
import { materialLibraries, rewriteMaterialTextures } from "./modelMaterials.ts";

/** STL is one mesh with no `o`/`g` groups — the Parts list will show a single row. */
export function groupFromModelData(data: string | ArrayBuffer, format: ModelFormat, materialText = ""): Group {
  if (format === "stl") {
    const geometry = new STLLoader().parse(data as ArrayBuffer);
    const alpha = (geometry as typeof geometry & { alpha?: number }).alpha ?? 1;
    const mesh = new Mesh(geometry, new MeshPhongMaterial({ vertexColors: !!geometry.getAttribute("color"), opacity: alpha, transparent: alpha < 1 }));
    mesh.name = "STL";
    const group = new Group();
    group.name = "STL";
    group.add(mesh);
    validateModelSurfaces(group);
    return group;
  }
  const group = parseObjSurfaceParts(data as string, materialText ? new MTLLoader().parse(materialText, "") : undefined);
  validateModelSurfaces(group);
  return group;
}

/**
 * `useLoader` entry for catalogue OBJ and client STL. `formatHint` is required
 * for blob: URLs, which have no extension.
 */
export class ModelFileLoader extends Loader<Group> {
  formatHint: ModelFormat | null = null;
  /** Empty string intentionally disables network sidecar lookup for local files. */
  materialTextHint: string | null = null;

  constructor(manager?: LoadingManager) {
    super(manager);
  }

  load(
    url: string,
    onLoad: (group: Group) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void,
  ) {
    const format = modelFormatFromName(url) ?? this.formatHint ?? "obj";
    const materialTextHint = url.startsWith("blob:") ? this.materialTextHint : null;
    const fileLoader = new FileLoader(this.manager);
    fileLoader.setPath(this.path);
    fileLoader.setRequestHeader(this.requestHeader);
    fileLoader.setWithCredentials(this.withCredentials);
    fileLoader.setResponseType(format === "stl" ? "arraybuffer" : "text");
    fileLoader.load(
      url,
      async (data) => {
        try {
          let materialText = materialTextHint ?? "";
          const warnings: string[] = [];
          if (format === "obj" && materialTextHint === null) {
            const texts = await Promise.all(materialLibraries(data as string).map(async (library) => {
              try {
                const materialUrl = new URL(library.replace(/\\/g, "/"), new URL(url, this.path || globalThis.location?.href)).href;
                const response = await fetch(materialUrl, { headers: this.requestHeader, credentials: this.withCredentials ? "include" : "same-origin" });
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return rewriteMaterialTextures(await response.text(), (name) => new URL(name.replace(/\\/g, "/"), materialUrl).href);
              } catch {
                warnings.push(`Missing MTL: ${library}`);
                return "";
              }
            }));
            materialText = texts.join("\n");
          }
          const group = groupFromModelData(data as string | ArrayBuffer, format, materialText);
          group.userData.materialWarnings = warnings;
          onLoad(group);
        } catch (err) {
          onError?.(err);
        }
      },
      onProgress,
      onError,
    );
  }
}

/** Reject empty, non-finite or wholly degenerate meshes before replacing a usable model. */
export function validateModelSurfaces(group: Group) {
  let hasSurface = false;
  group.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh) return;
    const positions = mesh.geometry.getAttribute("position");
    if (!positions || positions.count === 0) return;
    const index = mesh.geometry.getIndex();
    const count = index?.count ?? positions.count;
    if (positions.itemSize !== 3 || count % 3 !== 0) throw new Error("Invalid surface geometry");
    for (let i = 0; i < positions.count; i++) {
      if (!Number.isFinite(positions.getX(i)) || !Number.isFinite(positions.getY(i)) || !Number.isFinite(positions.getZ(i))) {
        throw new Error("Invalid surface coordinates");
      }
    }
    for (let i = 0; i < count; i += 3) {
      const vertices = index ? [index.getX(i), index.getX(i + 1), index.getX(i + 2)] : [i, i + 1, i + 2];
      if (vertices.some((vertex) => !Number.isInteger(vertex) || vertex < 0 || vertex >= positions.count)) {
        throw new Error("Invalid surface indices");
      }
      if (hasSurface) {
        if (!index) break;
        continue;
      }
      const [a, b, c] = vertices;
      const abX = positions.getX(b) - positions.getX(a);
      const abY = positions.getY(b) - positions.getY(a);
      const abZ = positions.getZ(b) - positions.getZ(a);
      const acX = positions.getX(c) - positions.getX(a);
      const acY = positions.getY(c) - positions.getY(a);
      const acZ = positions.getZ(c) - positions.getZ(a);
      hasSurface = abY * acZ - abZ * acY !== 0 || abZ * acX - abX * acZ !== 0 || abX * acY - abY * acX !== 0;
    }
  });
  if (!hasSurface) throw new Error("Model has no surface faces");
}
