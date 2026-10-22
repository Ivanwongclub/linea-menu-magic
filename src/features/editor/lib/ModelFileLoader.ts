import { FileLoader, Group, Loader, Mesh, type LoadingManager } from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { modelFormatFromName, type ModelFormat } from "./modelFormat";
import { parseObjSurfaceParts } from "./objSurfaceParts";

/** STL is one mesh with no `o`/`g` groups — the Parts list will show a single row. */
export function groupFromModelData(data: string | ArrayBuffer, format: ModelFormat): Group {
  if (format === "stl") {
    const geometry = new STLLoader().parse(data as ArrayBuffer);
    const mesh = new Mesh(geometry);
    mesh.name = "STL";
    const group = new Group();
    group.name = "STL";
    group.add(mesh);
    return group;
  }
  return parseObjSurfaceParts(data as string);
}

/**
 * `useLoader` entry for catalogue OBJ and client STL. `formatHint` is required
 * for blob: URLs, which have no extension.
 */
export class ModelFileLoader extends Loader<Group> {
  formatHint: ModelFormat | null = null;

  constructor(manager?: LoadingManager) {
    super(manager);
  }

  load(
    url: string,
    onLoad: (group: Group) => void,
    onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void,
  ) {
    const format = this.formatHint ?? modelFormatFromName(url) ?? "obj";
    const fileLoader = new FileLoader(this.manager);
    fileLoader.setPath(this.path);
    fileLoader.setRequestHeader(this.requestHeader);
    fileLoader.setWithCredentials(this.withCredentials);
    fileLoader.setResponseType(format === "stl" ? "arraybuffer" : "text");
    fileLoader.load(
      url,
      (data) => {
        try {
          onLoad(groupFromModelData(data as string | ArrayBuffer, format));
        } catch (err) {
          onError?.(err);
        }
      },
      onProgress,
      onError,
    );
  }
}
