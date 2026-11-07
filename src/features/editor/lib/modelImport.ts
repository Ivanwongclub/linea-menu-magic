import { modelFormatFromName } from "./modelFormat.ts";
import { materialLibraries, rewriteMaterialTextures } from "./modelMaterials.ts";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader.js";

interface MaterialResources {
  materialText: string;
  resourceUrls: string[];
  uploads: { name: string; body: Blob; contentType: string }[];
  warnings: string[];
}

export interface ModelImport extends MaterialResources {
  file: File;
  model: File;
}

export interface MaterialImport extends MaterialResources {
  files: File[];
}

export class MaterialImportError extends Error {
  code: "needsMtl" | "materialMismatch";
  constructor(code: MaterialImportError["code"]) {
    super(code);
    this.code = code;
  }
}

const normalPath = (name: string) => {
  const segments: string[] = [];
  for (const segment of name.replace(/\\/g, "/").split("/")) {
    if (segment === "..") segments.pop();
    else if (segment && segment !== ".") segments.push(segment);
  }
  return segments.join("/");
};
const basename = (name: string) => normalPath(name).split("/").pop()!;

/** Directory drops need entry traversal; DataTransfer.files alone contains the directory. */
export async function modelFilesFromDrop(transfer: DataTransfer): Promise<File[]> {
  const entries = Array.from(transfer.items ?? []).map((item) => item.webkitGetAsEntry?.()).filter(Boolean);
  if (!entries.some((entry) => entry.isDirectory)) return Array.from(transfer.files);
  const files: File[] = [];
  const visit = async (entry: FileSystemEntry) => {
    if (entry.isFile) {
      const file = await new Promise<File>((resolve, reject) => (entry as FileSystemFileEntry).file(resolve, reject));
      Object.defineProperty(file, "webkitRelativePath", { value: entry.fullPath.replace(/^\//, "") });
      files.push(file);
      if (files.length > 100) throw new Error("A model may include at most 100 files.");
    } else if (entry.isDirectory) {
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      for (;;) {
        const batch = await new Promise<FileSystemEntry[]>((resolve, reject) => reader.readEntries(resolve, reject));
        if (!batch.length) break;
        for (const child of batch) await visit(child);
      }
    }
  };
  for (const entry of entries) await visit(entry);
  return files;
}

/** One geometry file, optional MTLs and their images. Original source bytes are retained. */
export async function prepareModelImport(files: File[]): Promise<ModelImport> {
  const models = files.filter((file) => modelFormatFromName(file.name));
  if (models.length !== 1) throw new Error("Choose one OBJ or STL together with its MTL and texture files.");
  if (files.length > 100) throw new Error("A model may include at most 100 files.");
  const file = models[0];
  const format = modelFormatFromName(file.name)!;
  const contentType = format === "stl" ? "model/stl" : "model/obj";
  const result: ModelImport = { file, model: file, materialText: "", resourceUrls: [], uploads: [], warnings: [] };
  if (format === "stl") {
    result.uploads.push({ name: "model.stl", body: file, contentType });
    return result;
  }
  const text = await file.text();
  let libraries = materialLibraries(text, files.map((entry) => entry.name));
  // Some exports omit mtllib but still provide a single material library.
  if (!libraries.length) libraries = files.filter((entry) => /\.mtl$/i.test(entry.name)).map((entry) => entry.name);
  const materials = await prepareMaterialResources(files, libraries, file.webkitRelativePath || file.name);
  Object.assign(result, materials);
  if (result.materialText) {
    const obj = `mtllib materials.mtl\n${text.replace(/^[\t ]*mtllib[\t ]+.*$/gim, "")}`;
    result.model = new File([obj], file.name, { type: contentType });
    result.uploads.push({ name: "source.obj", body: file, contentType });
  }
  result.uploads.push({ name: "model.obj", body: result.model, contentType });
  return result;
}

/** Supplement an existing OBJ without replacing its geometry, scale or design. */
export async function prepareMaterialImport(files: File[], materialNames: string[], previousFiles: File[] = []): Promise<MaterialImport> {
  const incomingMaterials = files.filter((file) => /\.mtl$/i.test(file.name));
  if (incomingMaterials.length) {
    const text = (await Promise.all(incomingMaterials.map((file) => file.text()))).join("\n");
    const names = new Set(Object.keys(new MTLLoader().parse(text, "").materialsInfo));
    if (!materialNames.some((name) => names.has(name))) throw new MaterialImportError("materialMismatch");
  }
  const merged = new Map(previousFiles.map((file) => [normalPath(file.webkitRelativePath || file.name).toLowerCase(), file]));
  for (const file of files) {
    const key = normalPath(file.webkitRelativePath || file.name).toLowerCase();
    const sameName = [...merged].filter(([, entry]) => basename(entry.name).toLowerCase() === basename(file.name).toLowerCase());
    if (!merged.has(key) && sameName.length === 1 && (!file.webkitRelativePath || !sameName[0][1].webkitRelativePath)) merged.delete(sameName[0][0]);
    merged.set(key, file);
  }
  const companions = [...merged.values()];
  if (companions.length > 100) throw new Error("A model may include at most 100 files.");
  const libraries = companions.filter((file) => /\.mtl$/i.test(file.name)).map((file) => file.webkitRelativePath || file.name);
  if (!libraries.length) throw new MaterialImportError("needsMtl");
  const result = await prepareMaterialResources(companions, libraries, "");
  const names = new Set(Object.keys(new MTLLoader().parse(result.materialText, "").materialsInfo));
  if (!materialNames.some((name) => names.has(name))) {
    result.resourceUrls.forEach((url) => URL.revokeObjectURL(url));
    throw new MaterialImportError("materialMismatch");
  }
  return { ...result, files: companions };
}

async function prepareMaterialResources(files: File[], libraries: string[], relativeTo: string): Promise<MaterialResources> {
  const result: MaterialResources = { materialText: "", resourceUrls: [], uploads: [], warnings: [] };
  const resolveFile = (name: string, base = relativeTo): File | undefined => {
    const parent = normalPath(base).split("/").slice(0, -1).join("/");
    const target = normalPath(parent ? `${parent}/${name}` : name);
    const exact = files.filter((candidate) => normalPath(candidate.webkitRelativePath || candidate.name) === target);
    if (exact.length === 1) return exact[0];
    let candidates = files.filter((candidate) => basename(candidate.name) === basename(name));
    if (!candidates.length) candidates = files.filter((candidate) => basename(candidate.name).toLowerCase() === basename(name).toLowerCase());
    if (candidates.length > 1) throw new Error(`Ambiguous companion filename: ${name}`);
    return candidates[0];
  };
  const localMaterials: string[] = [];
  const storedMaterials: string[] = [];
  const textures = new Map<File, { name: string; url: string }>();
  try {
    for (const library of libraries) {
      const mtl = resolveFile(library);
      if (!mtl) { result.warnings.push(`Missing MTL: ${library}`); continue; }
      const material = await mtl.text();
      result.uploads.push({ name: `source-${storedMaterials.length}.mtl`, body: mtl, contentType: "text/plain" });
      const resource = (name: string) => {
        const texture = resolveFile(name, mtl.webkitRelativePath || library);
        if (!texture || !/\.(png|jpe?g|webp|gif|bmp)$/i.test(texture.name)) {
          result.warnings.push(`Missing texture: ${name}`);
          return null;
        }
        if (!textures.has(texture)) {
          const extension = texture.name.split(".").pop()!.toLowerCase();
          const url = URL.createObjectURL(texture);
          const resourceName = `texture-${textures.size}.${extension}`;
          textures.set(texture, { name: resourceName, url });
          result.resourceUrls.push(url);
          result.uploads.push({ name: resourceName, body: texture, contentType: texture.type || (extension === "jpg" ? "image/jpeg" : `image/${extension}`) });
        }
        return textures.get(texture)!;
      };
      localMaterials.push(rewriteMaterialTextures(material, (name) => resource(name)?.url ?? null));
      storedMaterials.push(rewriteMaterialTextures(material, (name) => resource(name)?.name ?? null));
    }
    if (storedMaterials.length) {
      result.materialText = localMaterials.join("\n");
      result.uploads.push({ name: "materials.mtl", body: new Blob([storedMaterials.join("\n")]), contentType: "text/plain" });
    }
    result.warnings = [...new Set(result.warnings)];
    return result;
  } catch (error) {
    result.resourceUrls.forEach((url) => URL.revokeObjectURL(url));
    throw error;
  }
}
