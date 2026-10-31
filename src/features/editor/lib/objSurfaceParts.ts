import { BufferAttribute, BufferGeometry, Group, Mesh, type Material } from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import type { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

// Rhino can append points/curves to the same unnamed object as its faces.
// OBJLoader then changes the entire object's primitive type to Points/Lines.
// This application edits surfaces: keep every v/vt/vn index, but leave those
// auxiliary CAD primitives out of the parse input. The uploaded file is intact.
const AUXILIARY_RECORD = /^(?:p|l|vp|curv2?|surf|parm|trim|hole|scrv|sp|end|con|cstype|deg|bmat|step|bevel|c_interp|d_interp|lod|shadow_obj|trace_obj|ctech|stech)(?:\s|$)/;

function surfaceInput(text: string): string {
  return text.replace(/\\\r?\n/g, "").split(/\r?\n/).filter((line) => !AUXILIARY_RECORD.test(line.trimStart())).join("\n");
}

function meaningfulMaterialName(material: Material | undefined): string | null {
  const name = material?.name.trim();
  if (!name || /^(?:[_\s]*default(?:[_\s]*material)?[_\s]*|none|null|\(null\))$/i.test(name)) return null;
  return name;
}

interface MaterialPart {
  name: string;
  material: Material;
  start: number;
  count: number;
}

/**
 * A flat OBJ can carry source geometry segments in `usemtl`, without any o/g.
 * Expose every nonempty material draw range in its original face order, even
 * when successive segments reuse the same material. These are source segments,
 * not recovered CAD layers. Do not split
 * authored objects/groups: their existing indices are stored in recipes and
 * CMS branding marks. Ambiguous/unnamed materials also keep their original mesh.
 * Neither the input group nor its attribute arrays are mutated.
 */
export function splitFlatObjMaterialParts(root: Group, hasAuthoredGroups: boolean): Group {
  if (hasAuthoredGroups || root.children.length !== 1) return root;
  const mesh = root.children[0] as Mesh;
  if (!mesh.isMesh || !Array.isArray(mesh.material)) return root;
  const source = mesh.geometry;
  const elementCount = source.index?.count ?? source.getAttribute("position")?.count ?? 0;
  if (!elementCount || source.groups.length < 2 || source.drawRange.start !== 0 || source.drawRange.count !== Infinity) return root;
  // OBJ has ordinary vertex attributes and no morph targets. Leave any custom
  // caller's unsupported geometry intact rather than silently losing its data.
  if (Object.keys(source.morphAttributes).length || Object.values(source.attributes).some((attribute) => !(attribute instanceof BufferAttribute))) return root;

  const parts: MaterialPart[] = [];
  const nameCounts = new Map<string, number>();
  let end = 0;
  for (const range of source.groups) {
    if (range.count === 0) continue;
    const material = mesh.material[range.materialIndex ?? 0];
    const name = meaningfulMaterialName(material);
    if (!name || range.start !== end || !Number.isInteger(range.count) || range.count <= 0 || range.count % 3 !== 0) return root;
    end += range.count;
    if (end > elementCount) return root;
    parts.push({ name, material, start: range.start, count: range.count });
    nameCounts.set(name, (nameCounts.get(name) ?? 0) + 1);
  }
  if (end !== elementCount || parts.length < 2) return root;

  const expanded = source.index ? source.toNonIndexed() : source;
  const result = root.clone(false);
  const nameOccurrences = new Map<string, number>();
  const usedNames = new Set<string>();
  for (const part of parts) {
    const geometry = new BufferGeometry();
    geometry.name = source.name;
    geometry.userData = { ...source.userData };
    for (const [name, attribute] of Object.entries(expanded.attributes)) {
      const original = attribute as BufferAttribute;
      const values = new (original.array.constructor as typeof Float32Array)(part.count * original.itemSize);
      values.set(original.array.subarray(part.start * original.itemSize, (part.start + part.count) * original.itemSize));
      const copied = new BufferAttribute(values, original.itemSize, original.normalized);
      copied.name = original.name;
      copied.setUsage(original.usage);
      copied.gpuType = original.gpuType;
      geometry.setAttribute(name, copied);
    }
    const child = mesh.clone(false);
    const occurrence = (nameOccurrences.get(part.name) ?? 0) + 1;
    nameOccurrences.set(part.name, occurrence);
    let displayName = nameCounts.get(part.name) > 1 ? `${part.name} · ${occurrence}` : part.name;
    // A source name may itself contain our display suffix. Keep all names
    // distinct without changing their source material identity.
    while (usedNames.has(displayName) || (displayName !== part.name && nameCounts.has(displayName))) displayName += " · segment";
    usedNames.add(displayName);
    child.name = displayName;
    child.geometry = geometry;
    child.material = part.material;
    child.userData = { ...mesh.userData, objPartSource: "material-segment", objMaterialName: part.name, objSourceRange: { start: part.start, count: part.count } };
    result.add(child);
  }
  return result;
}

/** One surface-only OBJ parse seam for editor, CMS groups, previews and bounds. */
export function parseObjSurfaceParts(text: string, materials?: MTLLoader.MaterialCreator): Group {
  const input = surfaceInput(text);
  const loader = new OBJLoader();
  if (materials) loader.setMaterials(materials);
  const root = loader.parse(input);
  root.userData.hasSourceMaterials = !!materials && Object.keys(materials.materialsInfo).length > 0;
  if (!root.children.some((child) => (child as Mesh).isMesh && ((child as Mesh).geometry.getAttribute("position")?.count ?? 0) >= 3)) {
    throw new Error("OBJ has no surface faces; export the model as a polygon mesh.");
  }
  const hasAuthoredGroups = input.split("\n").some((line) => /^[og]\s+\S/.test(line.trimStart()));
  return splitFlatObjMaterialParts(root, hasAuthoredGroups);
}
