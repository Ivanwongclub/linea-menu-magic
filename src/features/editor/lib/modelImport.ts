import { modelFormatFromName } from "./modelFormat.ts";
import { materialLibraries, rewriteMaterialTextures } from "./modelMaterials.ts";

export interface ModelImport {
  file: File;
  model: File;
  materialText: string;
  resourceUrls: string[];
  uploads: { name: string; body: Blob; contentType: string }[];
  warnings: string[];
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
  const resolveFile = (name: string, relativeTo = file.webkitRelativePath || file.name): File | undefined => {
    const parent = normalPath(relativeTo).split("/").slice(0, -1).join("/");
    const target = normalPath(parent ? `${parent}/${name}` : name);
    const exact = files.filter((candidate) => normalPath(candidate.webkitRelativePath || candidate.name) === target);
    if (exact.length === 1) return exact[0];
    let candidates = files.filter((candidate) => basename(candidate.name) === basename(name));
    if (!candidates.length) candidates = files.filter((candidate) => basename(candidate.name).toLowerCase() === basename(name).toLowerCase());
    if (candidates.length > 1) throw new Error(`Ambiguous companion filename: ${name}`);
    return candidates[0];
  };
  const text = await file.text();
  let libraries = materialLibraries(text, files.map((entry) => entry.name));
  // Some exports omit mtllib but still provide a single material library.
  if (!libraries.length) libraries = files.filter((entry) => /\.mtl$/i.test(entry.name)).map((entry) => entry.name);
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
      const obj = `mtllib materials.mtl\n${text.replace(/^[\t ]*mtllib[\t ]+.*$/gim, "")}`;
      result.model = new File([obj], file.name, { type: contentType });
      result.uploads.push({ name: "source.obj", body: file, contentType });
      result.uploads.push({ name: "materials.mtl", body: new Blob([storedMaterials.join("\n")]), contentType: "text/plain" });
    }
    result.uploads.push({ name: "model.obj", body: result.model, contentType });
    result.warnings = [...new Set(result.warnings)];
    return result;
  } catch (error) {
    result.resourceUrls.forEach((url) => URL.revokeObjectURL(url));
    throw error;
  }
}
