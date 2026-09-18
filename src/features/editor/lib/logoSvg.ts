/**
 * Logo upload validation (4k R1). Runs on the file's text *before* anything
 * is stored or parsed into geometry: the editor engraves outlines, so only
 * paths and basic shapes can be accepted, and every outline must close.
 * No raster tracing — a bitmap is refused, not traced (Phase 11).
 *
 * Deliberately text-only (no DOM): the node tests load this file, and an
 * upload is rejected before any parser touches it.
 */

/** R1: 200 KB. */
export const MAX_LOGO_BYTES = 200 * 1024;
/** Phase 6a R2: a printed layer may carry a raster, up to 2 MB. */
export const MAX_RASTER_BYTES = 2 * 1024 * 1024;
export const RASTER_MIME_TYPES = ["image/png", "image/jpeg"] as const;

/** Outlines the editor can engrave. */
const ALLOWED_ELEMENTS = new Set(["svg", "g", "path", "rect", "circle", "ellipse", "polygon", "polyline", "title", "desc", "metadata"]);
/** Named in R1 (plus their obvious relatives) so the rejection can say which one. */
const SHAPE_ELEMENTS = new Set(["path", "rect", "circle", "ellipse", "polygon", "polyline"]);

export type LogoRejection =
  | { reason: "tooLarge"; limitKb: number }
  | { reason: "notSvg" }
  | { reason: "element"; element: string }
  | { reason: "openPath" }
  | { reason: "empty" }
  | { reason: "rasterTooLarge"; limitMb: number }
  | { reason: "unsupportedType"; type: string };

export type LogoValidation = { ok: true } | ({ ok: false } & LogoRejection);

export const asRejection = (validation: LogoValidation): LogoRejection | null =>
  validation.ok ? null : ({ ...validation } as LogoRejection);

/** Element names in document order, comments and CDATA removed. */
function elementNames(svg: string): string[] {
  const stripped = svg.replace(/<!--[\s\S]*?-->/g, "").replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, "");
  return [...stripped.matchAll(/<\s*([A-Za-z_][\w.:-]*)/g)].map((m) => m[1].replace(/^.*:/, "").toLowerCase());
}

function pathData(svg: string): string[] {
  return [...svg.matchAll(/\sd\s*=\s*"([^"]*)"|\sd\s*=\s*'([^']*)'/g)].map((m) => m[1] ?? m[2]);
}

/** Every subpath (each `M`/`m` run) has to close with `Z`/`z`. */
export function pathsAreClosed(d: string): boolean {
  const subpaths = d.split(/(?=[Mm])/).filter((part) => part.trim().length > 0);
  if (subpaths.length === 0) return false;
  return subpaths.every((part) => /[Zz]\s*$/.test(part.trim()));
}

export function validateLogoSvg(text: string, sizeBytes: number): LogoValidation {
  if (sizeBytes > MAX_LOGO_BYTES) return { ok: false, reason: "tooLarge", limitKb: MAX_LOGO_BYTES / 1024 };
  const names = elementNames(text);
  if (!names.includes("svg")) return { ok: false, reason: "notSvg" };
  const forbidden = names.find((name) => !ALLOWED_ELEMENTS.has(name));
  if (forbidden) return { ok: false, reason: "element", element: forbidden };
  if (!names.some((name) => SHAPE_ELEMENTS.has(name))) return { ok: false, reason: "empty" };
  if (!pathData(text).every(pathsAreClosed)) return { ok: false, reason: "openPath" };
  return { ok: true };
}

/**
 * A raster artwork (Phase 6a R2): PNG or JPEG, 2 MB. There is nothing to
 * outline in a bitmap, so it is accepted for printing only — the caller sets
 * the layer to printed, and nothing here tries to trace it (Phase 11).
 */
export function validateRasterLogo(mimeType: string, sizeBytes: number): LogoValidation {
  if (!(RASTER_MIME_TYPES as readonly string[]).includes(mimeType)) return { ok: false, reason: "unsupportedType", type: mimeType || "unknown" };
  if (sizeBytes > MAX_RASTER_BYTES) return { ok: false, reason: "rasterTooLarge", limitMb: MAX_RASTER_BYTES / (1024 * 1024) };
  return { ok: true };
}

/** The i18n key and variables for a rejection — one plain sentence naming the reason (R1). */
export function rejectionMessage(rejection: LogoRejection): { key: string; vars: Record<string, string | number> } {
  switch (rejection.reason) {
    case "tooLarge":
      return { key: "editor.branding.logoTooLarge", vars: { limit: rejection.limitKb } };
    case "notSvg":
      return { key: "editor.branding.logoNotSvg", vars: {} };
    case "element":
      return { key: "editor.branding.logoElement", vars: { element: rejection.element } };
    case "openPath":
      return { key: "editor.branding.logoOpenPath", vars: {} };
    case "empty":
      return { key: "editor.branding.logoEmpty", vars: {} };
    case "rasterTooLarge":
      return { key: "editor.branding.logoRasterTooLarge", vars: { limit: rejection.limitMb } };
    case "unsupportedType":
      return { key: "editor.branding.logoUnsupportedType", vars: { type: rejection.type } };
  }
}
