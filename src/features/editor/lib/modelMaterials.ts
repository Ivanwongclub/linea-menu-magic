import { Mesh, MeshPhysicalMaterial, type Group, type Material, type MeshPhongMaterial } from "three";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";
import { applyShaderPatches, type ZoneStyle } from "./shaderPatch.ts";

export const TEXTURE_RECORD = /^(\s*(?:map_\w+|bump|norm|disp|decal)\s+)(.+)$/i;

export function materialLibraries(text: string, available: string[] = []): string[] {
  const names = new Set<string>();
  for (const line of text.replace(/\\\r?\n/g, "").split(/\r?\n/)) {
    const value = line.match(/^\s*mtllib\s+(.+?)\s*$/i)?.[1];
    if (!value) continue;
    const unquoted = value.replace(/^['"]|['"]$/g, "");
    const exact = available.find((name) => name.replace(/\\/g, "/").split("/").pop() === unquoted.replace(/\\/g, "/").split("/").pop());
    for (const name of exact ? [unquoted] : value.match(/"[^"]+"|'[^']+'|\S+/g) ?? []) names.add(name.replace(/^['"]|['"]$/g, ""));
  }
  return [...names];
}

/** Keep MTL texture options; only replace the resource path. Missing resources keep Kd. */
export function rewriteMaterialTextures(text: string, resolve: (name: string) => string | null): string {
  const parser = new MTLLoader().parse("", "");
  return text.split(/\r?\n/).map((line) => {
    const record = line.match(TEXTURE_RECORD);
    if (!record) return line;
    const path = parser.getTextureParams(record[2], {}).url;
    const next = resolve(path.replace(/^['"]|['"]$/g, ""));
    return next ? record[1] + record[2].replace(path, next) : "";
  }).join("\n");
}

export function hasSourceAppearance(root: Group): boolean {
  let found = root.userData.hasSourceMaterials === true;
  root.traverse((child) => {
    const mesh = child as Mesh;
    if (mesh.isMesh && mesh.geometry.getAttribute("color")) found = true;
  });
  return found;
}

export function describeSourceMaterials(material: Material | Material[]) {
  return (Array.isArray(material) ? material : [material]).map((entry) => {
    const source = entry as MeshPhongMaterial;
    return { name: source.name, colour: source.color ? `#${source.color.getHexString()}` : "#ffffff", opacity: source.opacity, textured: !!source.map };
  });
}

/** Convert the MTL preview to the editor's shader model so per-face zones still work. */
export function sourcePhysicalMaterial(source: Material, vertexColors: boolean, zones: ZoneStyle[] | null): MeshPhysicalMaterial {
  const original = source as MeshPhongMaterial;
  const material = new MeshPhysicalMaterial({
    name: source.name,
    color: original.color ?? "#ffffff",
    emissive: original.emissive ?? "#000000",
    map: original.map ?? null,
    emissiveMap: original.emissiveMap ?? null,
    specularColor: original.specular ?? "#ffffff",
    specularColorMap: original.specularMap ?? null,
    normalMap: original.normalMap ?? null,
    bumpMap: original.bumpMap ?? null,
    bumpScale: original.bumpScale ?? 1,
    alphaMap: original.alphaMap ?? null,
    opacity: source.opacity,
    transparent: source.transparent,
    side: source.side,
    vertexColors,
    metalness: 0,
    roughness: original.shininess == null ? 0.6 : Math.max(0.05, Math.sqrt(2 / (original.shininess + 2))),
  });
  if (original.normalScale) material.normalScale.copy(original.normalScale);
  applyShaderPatches(material, { zones });
  return material;
}
