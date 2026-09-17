/**
 * `draft_recipe` v2 (E1 §3.3) — also the anonymous draft's `recipe`.
 * Face frame: viewed from +Z after orientation, origin at the face centre,
 * mm. Angles: 0° = 12 o'clock, clockwise positive. Every length is stored
 * unrounded (C3); only the panel rounds for display.
 *
 * No path aliases and no React here: the node unit tests import this file.
 */

export type TextLayout = "straight" | "circle";
/** `cw` reads along the outside of the circle (top arc), `ccw` along the inside (bottom arc). */
export type TextDirection = "cw" | "ccw";

export interface TextLayer {
  id: string;
  kind: "text";
  visible: boolean;
  content: { type: "text"; value: string; font: { source: "bundled"; key: string } };
  style: { text_size_mm: number; letter_spacing_mm: number };
  placement: {
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
  };
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
  layers: TextLayer[];
}

export interface LayerPatch {
  visible?: boolean;
  content?: Partial<Omit<TextLayer["content"], "font">> & { font?: TextLayer["content"]["font"] };
  style?: Partial<TextLayer["style"]>;
  placement?: Partial<Omit<TextLayer["placement"], "centre_mm">> & { centre_mm?: TextLayer["placement"]["centre_mm"] };
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
    layers: raw.recipe_version === 2 && Array.isArray(raw.layers) ? (raw.layers as TextLayer[]) : [],
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
function markEdited(layer: TextLayer, patch: LayerPatch): TextLayer["provenance"] {
  if (!layer.provenance) return layer.provenance;
  let next = layer.provenance;
  const edited = (key: string, before: unknown, after: unknown) => {
    if (after === undefined || next[key] !== "recovered" || JSON.stringify(before) === JSON.stringify(after)) return;
    next = { ...next, [key]: "user" };
  };
  for (const [key, value] of Object.entries(patch.placement ?? {})) {
    edited(key, layer.placement[key as keyof TextLayer["placement"]], value);
  }
  for (const [key, value] of Object.entries(patch.style ?? {})) {
    edited(key, layer.style[key as keyof TextLayer["style"]], value);
  }
  return next;
}

export function applyLayerPatch(layer: TextLayer, patch: LayerPatch): TextLayer {
  return {
    ...layer,
    ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    content: { ...layer.content, ...patch.content },
    style: { ...layer.style, ...patch.style },
    placement: { ...layer.placement, ...patch.placement },
    ...(layer.provenance ? { provenance: markEdited(layer, patch) } : {}),
  };
}

/**
 * Variant switch (C10): placement and text size scale with the product;
 * relief depth and bevel stay physical (none exist before Phase 5). Angles
 * are scale-free and untouched.
 */
export function scaleLayers(layers: TextLayer[], ratio: number): TextLayer[] {
  if (!(ratio > 0) || ratio === 1) return layers;
  return layers.map((layer) => ({
    ...layer,
    style: { text_size_mm: layer.style.text_size_mm * ratio, letter_spacing_mm: layer.style.letter_spacing_mm * ratio },
    placement: {
      ...layer.placement,
      centre_mm: { x: layer.placement.centre_mm.x * ratio, y: layer.placement.centre_mm.y * ratio },
      radius_mm: layer.placement.radius_mm * ratio,
      baseline_offset_mm: layer.placement.baseline_offset_mm * ratio,
    },
  }));
}
