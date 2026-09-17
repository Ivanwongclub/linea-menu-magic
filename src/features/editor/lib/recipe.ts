/**
 * `draft_recipe` v2 (E1 §3.3) — also the anonymous draft's `recipe`.
 * Face frame: viewed from +Z after orientation, origin at the face centre,
 * mm. Angles: 0° = 12 o'clock, clockwise positive. Every length is stored
 * unrounded (C3); only the panel rounds for display.
 *
 * No path aliases and no React here: the node unit tests import this file.
 */

/** `free` is a logo's placement: centre, width and rotation, no curve (4k R3). */
export type TextLayout = "straight" | "circle" | "free";
/** `cw` reads along the outside of the circle (top arc), `ccw` along the inside (bottom arc). */
export type TextDirection = "cw" | "ccw";

/** One placement shape for every layer kind; a logo uses `centre_mm`, `rotation_deg` and `conform` only. */
export interface LayerPlacement {
  layout: TextLayout;
  centre_mm: { x: number; y: number };
  /** Straight only. */
  rotation_deg: number;
  /** Circle only — the radius of the text's cap-height midline. */
  radius_mm: number;
  /** Circle only — the angle of the text's midpoint (C7); start, end and span are derived. */
  arc_position_deg: number;
  direction: TextDirection;
  /** Along the glyph's own up direction. */
  baseline_offset_mm: number;
  conform: boolean;
}

interface LayerCommon {
  id: string;
  visible: boolean;
  placement: LayerPlacement;
  /**
   * Phase 5 renders and edits it. 4j fills it only from a recovered
   * reference (the factory's own relief, physical mm — C10 never scales it).
   */
  relief: TextRelief | null;
  /** Phase 6. */
  fill: null;
  /** §4.1 labels; an absent key means `user`. Keys are the field names (`radius_mm`, `depth_mm`, …). */
  provenance?: Record<string, Provenance>;
}

export interface TextLayer extends LayerCommon {
  kind: "text";
  content: { type: "text"; value: string; font: { source: "bundled"; key: string } };
  style: { text_size_mm: number; letter_spacing_mm: number };
}

/**
 * An uploaded SVG on the face (4k). `asset_id` is the `design_assets` row;
 * it is null only while an anonymous draft holds the file in sessionStorage,
 * until the claim uploads it. `aspect` is the artwork's width / height, so
 * the height follows from `width_mm`.
 */
export interface LogoLayer extends LayerCommon {
  kind: "logo";
  content: { type: "logo"; asset_id: string | null; width_mm: number; aspect: number };
  style: Record<string, never>;
}

export type Layer = TextLayer | LogoLayer;

export const isTextLayer = (layer: Layer): layer is TextLayer => layer.kind === "text";
export const isLogoLayer = (layer: Layer): layer is LogoLayer => layer.kind === "logo";

/** A logo's height follows from its width and the artwork's aspect. */
export const logoHeightMm = (layer: LogoLayer): number => (layer.content.aspect > 0 ? layer.content.width_mm / layer.content.aspect : layer.content.width_mm);

export type Provenance = "recovered" | "user";

export interface TextRelief {
  type: "emboss" | "deboss";
  depth_mm: number;
}

export interface DraftRecipe {
  recipe_version: 2;
  size_variant_id: string | null;
  finish_id: string | null;
  colour_id: string | null;
  view: { ruler: boolean };
  layers: Layer[];
}

export interface LayerPatch {
  visible?: boolean;
  content?: (Partial<Omit<TextLayer["content"], "font">> & { font?: TextLayer["content"]["font"] }) | Partial<LogoLayer["content"]>;
  style?: Partial<TextLayer["style"]>;
  placement?: Partial<Omit<LayerPlacement, "centre_mm">> & { centre_mm?: LayerPlacement["centre_mm"] };
}

export const DEFAULT_FONT_KEY = "poppins-semibold";

export function emptyRecipe(): DraftRecipe {
  return { recipe_version: 2, size_variant_id: null, finish_id: null, colour_id: null, view: { ruler: false }, layers: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Any stored shape → v2 (collision 27). An absent `recipe_version` is v1:
 * its three ids carry over, `layers` is `[]` and the ruler is off. A v2 row
 * is taken as stored; only missing containers are filled.
 */
export function normalizeRecipe(raw: unknown): DraftRecipe {
  const base = emptyRecipe();
  if (!isRecord(raw)) return base;
  const id = (v: unknown) => (typeof v === "string" ? v : null);
  const view = isRecord(raw.view) ? raw.view : {};
  return {
    recipe_version: 2,
    size_variant_id: id(raw.size_variant_id),
    finish_id: id(raw.finish_id),
    colour_id: id(raw.colour_id),
    view: { ruler: view.ruler === true },
    layers: raw.recipe_version === 2 && Array.isArray(raw.layers) ? (raw.layers as Layer[]) : [],
  };
}

/** The recovered placement a new layer starts from (4j, C8); every field it sets is labelled `recovered`. */
export interface LayerDefaults {
  centre_mm: { x: number; y: number };
  radius_mm: number;
  arc_position_deg: number;
  direction: TextDirection;
  text_size_mm: number | null;
  relief: TextRelief | null;
}

/**
 * Fallback defaults (E1 §3.3 table) — straight, centred, 12% cap height —
 * or, given recovered `defaults`, a circle where the factory lettering was.
 */
export function newTextLayer(id: string, faceDiameterMm: number, value = "", defaults: LayerDefaults | null = null): TextLayer {
  const layer: TextLayer = {
    id,
    kind: "text",
    visible: true,
    content: { type: "text", value, font: { source: "bundled", key: DEFAULT_FONT_KEY } },
    style: { text_size_mm: 0.12 * faceDiameterMm, letter_spacing_mm: 0 },
    placement: {
      layout: "straight",
      centre_mm: { x: 0, y: 0 },
      rotation_deg: 0,
      radius_mm: 0.35 * faceDiameterMm,
      arc_position_deg: 0,
      direction: "cw",
      baseline_offset_mm: 0,
      conform: true,
    },
    relief: null,
    fill: null,
  };
  if (!defaults) return layer;
  const provenance: Record<string, Provenance> = {
    centre_mm: "recovered",
    radius_mm: "recovered",
    arc_position_deg: "recovered",
    direction: "recovered",
  };
  layer.placement = {
    ...layer.placement,
    layout: "circle",
    centre_mm: defaults.centre_mm,
    radius_mm: defaults.radius_mm,
    arc_position_deg: defaults.arc_position_deg,
    direction: defaults.direction,
  };
  if (defaults.text_size_mm != null && defaults.text_size_mm > 0) {
    layer.style = { ...layer.style, text_size_mm: defaults.text_size_mm };
    provenance.text_size_mm = "recovered";
  }
  if (defaults.relief) {
    layer.relief = defaults.relief;
    provenance.depth_mm = "recovered";
  }
  layer.provenance = provenance;
  return layer;
}

/** A recovered field the buyer changes becomes `user` (§4.1); untouched ones keep their label. */
function markEdited(layer: Layer, patch: LayerPatch): Layer["provenance"] {
  if (!layer.provenance) return layer.provenance;
  let next = layer.provenance;
  const edited = (key: string, before: unknown, after: unknown) => {
    if (after === undefined || next[key] !== "recovered" || JSON.stringify(before) === JSON.stringify(after)) return;
    next = { ...next, [key]: "user" };
  };
  for (const [key, value] of Object.entries(patch.placement ?? {})) {
    edited(key, layer.placement[key as keyof LayerPlacement], value);
  }
  if (isTextLayer(layer)) {
    for (const [key, value] of Object.entries(patch.style ?? {})) {
      edited(key, layer.style[key as keyof TextLayer["style"]], value);
    }
  }
  return next;
}

export function applyLayerPatch<T extends Layer>(layer: T, patch: LayerPatch): T {
  return {
    ...layer,
    ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    content: { ...layer.content, ...patch.content },
    style: { ...layer.style, ...patch.style },
    placement: { ...layer.placement, ...patch.placement },
    ...(layer.provenance ? { provenance: markEdited(layer, patch) } : {}),
  } as T;
}

/**
 * Variant switch (C10): placement and text size scale with the product;
 * relief depth and bevel stay physical (none exist before Phase 5). Angles
 * are scale-free and untouched.
 */
export function scaleLayers(layers: Layer[], ratio: number): Layer[] {
  if (!(ratio > 0) || ratio === 1) return layers;
  const placement = (layer: Layer): LayerPlacement => ({
    ...layer.placement,
    centre_mm: { x: layer.placement.centre_mm.x * ratio, y: layer.placement.centre_mm.y * ratio },
    radius_mm: layer.placement.radius_mm * ratio,
    baseline_offset_mm: layer.placement.baseline_offset_mm * ratio,
  });
  return layers.map((layer) =>
    isTextLayer(layer)
      ? {
          ...layer,
          style: { text_size_mm: layer.style.text_size_mm * ratio, letter_spacing_mm: layer.style.letter_spacing_mm * ratio },
          placement: placement(layer),
        }
      : { ...layer, content: { ...layer.content, width_mm: layer.content.width_mm * ratio }, placement: placement(layer) },
  );
}

/** A logo's default width (4k R3): 40% of the face diameter, centred, unrotated. */
export const LOGO_WIDTH_FRACTION = 0.4;

export function newLogoLayer(id: string, faceDiameterMm: number, aspect: number, assetId: string | null = null): LogoLayer {
  return {
    id,
    kind: "logo",
    visible: true,
    content: { type: "logo", asset_id: assetId, width_mm: LOGO_WIDTH_FRACTION * faceDiameterMm, aspect },
    style: {},
    placement: {
      layout: "free",
      centre_mm: { x: 0, y: 0 },
      rotation_deg: 0,
      radius_mm: 0,
      arc_position_deg: 0,
      direction: "cw",
      baseline_offset_mm: 0,
      conform: true,
    },
    relief: null,
    fill: null,
  };
}
