import type { Object3D, Mesh } from "three";

/** Branding holders stash `layerId` / `logo` on the group, not always on the mesh. */
export function brandingLayerId(object: Object3D): string | null {
  let current: Object3D | null = object;
  while (current) {
    const id = current.userData.layerId ?? current.userData.logo;
    if (typeof id === "string" && id) return id;
    current = current.parent;
  }
  return null;
}

/** Collect branding meshes, optionally limited to picked layer ids. */
export function collectBrandingWireframeMeshes(root: Object3D | null, layerIds: string[] | null): Mesh[] {
  if (!root) return [];
  const allow = layerIds ? new Set(layerIds) : null;
  const meshes: Mesh[] = [];
  root.traverse((object) => {
    const mesh = object as Mesh;
    if (!mesh.isMesh || !mesh.visible) return;
    const id = brandingLayerId(mesh);
    if (!id) return;
    if (allow && !allow.has(id)) return;
    meshes.push(mesh);
  });
  return meshes;
}
