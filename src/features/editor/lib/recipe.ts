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
  /** Phase 6a: what the layer is made of; absent on a v2 layer, read as the part's own finish. */
  appearance?: LayerAppearance | null;
  /** @deprecated superseded by `appearance` (Phase 6a R1); still written null so a v2 reader sees the shape it expects. */
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

/**
 * Raised or engraved, per layer (Phase 5 R1; E1 §3.3). `depth_mm` is the
 * magnitude along the local surface normal for both types — the UI labels it
 * "Emboss height" or "Engrave depth". `bevel_mm` is the chamfer on the top
 * edge of a raised layer / the opening edge of an engraved one.
 */
export type ReliefType = "emboss" | "deboss" | "printed";

export interface LayerRelief {
  /** `printed` is flat by definition (Phase 6a R1): the depth is kept but not rendered. */
  type: ReliefType;
  depth_mm: number;
  bevel_mm: number;
}

/**
 * What the layer is made of (Phase 6a R1): the part's own finish, a plated
 * finish of its own, a paint colour (the fill of axis-design §3), or printed
 * ink. `finish_id` is a `finishes` row — plated for `plated`, a PAINT-process
 * row for `paint` and `printed`; `custom` is a colour WIN-CYC has to confirm
 * (R3), and plating never accepts one.
 */
export type AppearanceMode = "part" | "plated" | "paint" | "printed";

export interface CustomColour {
  /** The Pantone code as typed, canonicalised; null when the buyer picked a hex directly. */
  pantone: string | null;
  hex: string;
}

export interface LayerAppearance {
  mode: AppearanceMode;
  finish_id: string | null;
  custom: CustomColour | null;
}

export const DEFAULT_APPEARANCE: LayerAppearance = { mode: "part", finish_id: null, custom: null };

export function layerAppearance(layer: Layer): LayerAppearance {
  return layer.appearance ? { ...DEFAULT_APPEARANCE, ...layer.appearance } : { ...DEFAULT_APPEARANCE };
}

/** A printed layer is flat, whatever depth it carries. */
export const isPrinted = (relief: LayerRelief): boolean => relief.type === "printed";

/** 4d/4j wrote relief without a bevel; a stored layer may still be that shape. */
export type TextRelief = LayerRelief;

/** R1: the last fallback, when neither the model nor the finish's process says otherwise. */
export const DEFAULT_RELIEF_DEPTH_MM = 0.3;
export const DEFAULT_BEVEL_MM = 0.05;

/**
 * R1: recovered relief if the model carried one, else the finish's process
 * minimum, else 0.30 mm. A new layer is raised unless the factory's own
 * lettering was engraved.
 */
export function defaultRelief(recovered: RecoveredRelief | null, processMinDepthMm?: number | null): LayerRelief {
  if (recovered) return { bevel_mm: DEFAULT_BEVEL_MM, ...recovered };
  const depth = processMinDepthMm != null && processMinDepthMm > 0 ? processMinDepthMm : DEFAULT_RELIEF_DEPTH_MM;
  return { type: "emboss", depth_mm: depth, bevel_mm: DEFAULT_BEVEL_MM };
}

/** What a layer renders and quotes with: its own relief, with any missing bevel filled in. */
export function layerRelief(layer: Layer): LayerRelief {
  return layer.relief ? { bevel_mm: DEFAULT_BEVEL_MM, ...layer.relief } : defaultRelief(null);
}

/**
 * Relief type and appearance mode are two faces of one decision (R1):
 * Printed is a relief type *and* an appearance, so setting either sets the
 * other. Leaving Printed falls back to raised, and leaving a colour behind
 * falls back to the part's own finish.
 */
export function reconcileAppearance(relief: LayerRelief, appearance: LayerAppearance, changed: "relief" | "appearance"): { relief: LayerRelief; appearance: LayerAppearance } {
  if (changed === "relief") {
    if (relief.type === "printed") return { relief, appearance: { ...appearance, mode: "printed" } };
    if (appearance.mode === "printed") {
      const mode: AppearanceMode = appearance.finish_id || appearance.custom ? "paint" : "part";
      return { relief, appearance: { ...appearance, mode } };
    }
    return { relief, appearance };
  }
  if (appearance.mode === "printed") return { relief: { ...relief, type: "printed" }, appearance };
  if (relief.type === "printed") return { relief: { ...relief, type: "emboss" }, appearance };
  return { relief, appearance };
}

/** Phase 6a R5: appearance per layer. A v2 recipe reads forward (`normalizeRecipe`). */
export const RECIPE_VERSION = 3;

export interface DraftRecipe {
  recipe_version: 3;
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
  /** Phase 5: type, depth or bevel; the layer's other relief fields are kept. */
  relief?: Partial<LayerRelief>;
  /** Phase 6a: mode, finish or custom colour; the layer's other appearance fields are kept. */
  appearance?: Partial<LayerAppearance>;
}

export const DEFAULT_FONT_KEY = "poppins-semibold";

export function emptyRecipe(): DraftRecipe {
  return { recipe_version: RECIPE_VERSION, size_variant_id: null, finish_id: null, colour_id: null, view: { ruler: false }, layers: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Any stored shape → v3 (collision 27; Phase 6a R5). An absent
 * `recipe_version` is v1: its three ids carry over, `layers` is `[]` and the
 * ruler is off. A v2 row's layers are read forward — every one of them gets
 * the appearance it implied, the part's own finish — and a v3 row is taken as
 * stored, with only missing containers filled.
 */
export function normalizeRecipe(raw: unknown): DraftRecipe {
  const base = emptyRecipe();
  if (!isRecord(raw)) return base;
  const id = (v: unknown) => (typeof v === "string" ? v : null);
  const view = isRecord(raw.view) ? raw.view : {};
  const version = raw.recipe_version;
  const stored = (version === 2 || version === 3) && Array.isArray(raw.layers) ? (raw.layers as Layer[]) : [];
  return {
    recipe_version: RECIPE_VERSION,
    size_variant_id: id(raw.size_variant_id),
    finish_id: id(raw.finish_id),
    colour_id: id(raw.colour_id),
    view: { ruler: view.ruler === true },
    layers: stored.map(upgradeLayer),
  };
}

/** A layer as v3 stores it: relief and appearance both present and agreeing. */
export function upgradeLayer(layer: Layer): Layer {
  const { relief, appearance } = reconcileAppearance(layerRelief(layer), layerAppearance(layer), "relief");
  return { ...layer, relief, appearance, fill: null };
}

/** The recovered placement a new layer starts from (4j, C8); every field it sets is labelled `recovered`. */
export interface LayerDefaults {
  centre_mm: { x: number; y: number };
  radius_mm: number;
  arc_position_deg: number;
  direction: TextDirection;
  text_size_mm: number | null;
  relief: RecoveredRelief | null;
}

/** What 4d/4j recovered from the model: a type and a depth, no bevel. */
export type RecoveredRelief = Omit<LayerRelief, "bevel_mm"> & { bevel_mm?: number };

/**
 * Fallback defaults (E1 §3.3 table) — straight, centred, 12% cap height —
 * or, given recovered `defaults`, a circle where the factory lettering was.
 * `processMinDepthMm` is the selected finish's `min_deboss_depth_mm` (R1).
 */
export function newTextLayer(
  id: string,
  faceDiameterMm: number,
  value = "",
  defaults: LayerDefaults | null = null,
  processMinDepthMm: number | null = null,
): TextLayer {
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
    relief: defaultRelief(null, processMinDepthMm),
    appearance: { ...DEFAULT_APPEARANCE },
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
  layer.relief = defaultRelief(defaults.relief, processMinDepthMm);
  if (defaults.relief) provenance.depth_mm = "recovered";
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
  // A recovered depth the buyer retypes becomes theirs (§4.1).
  for (const [key, value] of Object.entries(patch.relief ?? {})) {
    edited(key, layerRelief(layer)[key as keyof LayerRelief], value);
  }
  return next;
}

export function applyLayerPatch<T extends Layer>(layer: T, patch: LayerPatch): T {
  // Relief and appearance are reconciled together (R1): Printed is both.
  const changed = patch.appearance ? "appearance" : "relief";
  const { relief, appearance } = reconcileAppearance(
    { ...layerRelief(layer), ...patch.relief },
    { ...layerAppearance(layer), ...patch.appearance },
    changed,
  );
  return {
    ...layer,
    ...(patch.visible !== undefined ? { visible: patch.visible } : {}),
    content: { ...layer.content, ...patch.content },
    style: { ...layer.style, ...patch.style },
    placement: { ...layer.placement, ...patch.placement },
    ...(patch.relief || patch.appearance ? { relief, appearance } : {}),
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

export function newLogoLayer(
  id: string,
  faceDiameterMm: number,
  aspect: number,
  assetId: string | null = null,
  processMinDepthMm: number | null = null,
): LogoLayer {
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
    relief: defaultRelief(null, processMinDepthMm),
    appearance: { ...DEFAULT_APPEARANCE },
    fill: null,
  };
}
