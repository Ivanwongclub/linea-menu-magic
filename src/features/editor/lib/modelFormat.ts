export type ModelFormat = "obj" | "stl";

const NAME_RE = /\.(obj|stl)(?:$|[?#])/i;

/** Filename, storage path, or URL — blob URLs need the original name passed separately. */
export function modelFormatFromName(name: string | null | undefined): ModelFormat | null {
  if (!name) return null;
  const match = name.match(NAME_RE);
  return match ? (match[1].toLowerCase() as ModelFormat) : null;
}

export function isModelFilename(name: string): boolean {
  return modelFormatFromName(name) != null;
}
