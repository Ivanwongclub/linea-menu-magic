import { create } from "zustand";
import { applyLayerPatch, emptyRecipe, scaleLayers, type DraftRecipe, type Layer, type LayerPatch, type Zone } from "../lib/recipe";
import type { FaceTransform } from "../lib/recoveredPlacement";
import type { PendingLogo } from "../hooks/useLogoAssets";
import type { PartsReport } from "../components/EditorModel";
import { applyDiscrete, canRedo, canUndo, commitHistory, redoHistory, startHistory, undoHistory, type History } from "../lib/recipeHistory";

/**
 * Where the loaded model sits (4j): the raw → face transform `EditorModel`
 * applied and the face-frame centres of the marked branding glyphs. Runtime
 * only, never saved; null until a model is on screen.
 */
export interface ModelFrame {
  productKey: string;
  transform: FaceTransform;
  markedGlyphCentres: [number, number][];
}

/**
 * Local editor state: one `DraftRecipe` (E1 collision 20) — the same shape
 * autosave writes and the anonymous draft stores — plus the selected layer.
 * The store is module-global, so `initialize` replaces everything
 * (collision 21): nothing from a previous design or product survives.
 *
 * History (4i R2): whole-recipe snapshots (`lib/recipeHistory`). Live edits
 * (typing, dragging) change `recipe` only; `commit` turns everything since
 * the last checkpoint into one undo entry — called on pointer-up and on a
 * committed field edit. Discrete actions (add, delete, reorder, switches,
 * variant/finish/colour, ruler) commit themselves. The numeric controls and
 * the on-model handles write through the same `updateLayer`, so there is one
 * state (rulings §3).
 */
interface EditorState {
  recipe: DraftRecipe;
  selectedLayerId: string | null;
  /** The zone being edited, if any — the painter and the plane handle follow it. */
  selectedZoneId: string | null;
  /** The design id (or `new:<slug>`) `initialize` last ran for — autosave hydrates only after it matches (collision 24). */
  hydratedFor: string | null;
  past: DraftRecipe[];
  future: DraftRecipe[];
  /** The recipe as of the last commit. */
  checkpoint: DraftRecipe;
  /** A drag is in progress: autosave holds its writes. */
  dragging: boolean;
  /** Bumped on pointer-up: autosave writes at once instead of debouncing. */
  flushSeq: number;
  modelFrame: ModelFrame | null;
  /** Phase 6b R1: the model's own parts, as the scene reports them. Runtime only. */
  partsReport: PartsReport | null;
  /** Phase 6b R2: the zone the brush is painting into, and how wide the brush is. */
  paintZoneId: string | null;
  brushRadiusMm: number;
  /**
   * An anonymous buyer's uploaded SVGs, by layer id (4k R2): they live in the
   * sessionStorage draft until a sign-in claims the design and uploads them.
   */
  pendingLogos: Record<string, PendingLogo>;
  initialize: (recipe: DraftRecipe, hydratedFor: string) => void;
  /** `ratio` = new variant mm / old variant mm; layers scale with the product (C10). */
  setSizeVariantId: (id: string, ratio?: number) => void;
  setFinishId: (id: string) => void;
  setColourId: (id: string) => void;
  setRuler: (ruler: boolean) => void;
  /** Phase 6b R1: the factory's own lettering, as a Parts row rather than a staff toggle. */
  setOriginalLettering: (visible: boolean) => void;
  addLayer: (layer: Layer, pendingLogo?: PendingLogo) => void;
  /** A live edit; call `commit` when it is done. */
  updateLayer: (id: string, patch: LayerPatch) => void;
  removeLayer: (id: string) => void;
  moveLayer: (from: number, to: number) => void;
  selectLayer: (id: string | null) => void;
  commit: () => void;
  beginDrag: () => void;
  endDrag: () => void;
  undo: () => void;
  redo: () => void;
  setModelFrame: (frame: ModelFrame | null) => void;
  setPartsReport: (report: PartsReport | null) => void;
  setPaintZone: (zoneId: string | null) => void;
  setBrushRadius: (mm: number) => void;
  /** Phase 6b R1: which OBJ groups the buyer has hidden. */
  setHiddenGroups: (indices: number[]) => void;
  toggleHiddenGroup: (index: number) => void;
  /** Phase 6b R2: zones are edited like layers — live while dragging, one undo entry per change. */
  addZone: (zone: Zone) => void;
  updateZone: (id: string, patch: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  selectZone: (id: string | null) => void;
  /** Replaces the pending files wholesale — used when a draft is read back. */
  setPendingLogos: (logos: Record<string, PendingLogo>) => void;
}

const history = (s: EditorState): History => ({ recipe: s.recipe, past: s.past, future: s.future, checkpoint: s.checkpoint });
const discrete = (s: EditorState, next: (recipe: DraftRecipe) => DraftRecipe) => applyDiscrete(history(s), next);
/** Keeps the selection only if the restored recipe still has that layer. */
const keepSelection = (s: EditorState, recipe: DraftRecipe) => (recipe.layers.some((l) => l.id === s.selectedLayerId) ? s.selectedLayerId : null);

export const useEditorStore = create<EditorState>((set) => ({
  ...startHistory(emptyRecipe()),
  selectedLayerId: null,
  selectedZoneId: null,
  hydratedFor: null,
  dragging: false,
  flushSeq: 0,
  modelFrame: null,
  partsReport: null,
  paintZoneId: null,
  brushRadiusMm: 1,
  pendingLogos: {},
  initialize: (recipe, hydratedFor) =>
    set((s) => ({
      ...startHistory(recipe),
      dragging: false,
      selectedLayerId: null,
      selectedZoneId: null,
      hydratedFor,
      // Files an anonymous draft is still holding belong to the layers it is
      // being initialised with; anything else is from a previous product.
      pendingLogos: Object.fromEntries(Object.entries(s.pendingLogos).filter(([layerId]) => recipe.layers.some((l) => l.id === layerId))),
    })),
  setSizeVariantId: (id, ratio = 1) =>
    set((s) => discrete(s, (r) => ({ ...r, size_variant_id: id, layers: scaleLayers(r.layers, ratio) }))),
  setFinishId: (id) => set((s) => discrete(s, (r) => (r.finish_id === id ? r : { ...r, finish_id: id }))),
  setColourId: (id) => set((s) => discrete(s, (r) => (r.colour_id === id ? r : { ...r, colour_id: id }))),
  setRuler: (ruler) => set((s) => discrete(s, (r) => ({ ...r, view: { ...r.view, ruler } }))),
  setOriginalLettering: (visible) => set((s) => discrete(s, (r) => ({ ...r, view: { ...r.view, original_lettering: visible } }))),
  addLayer: (layer, pendingLogo) =>
    set((s) => ({
      ...discrete(s, (r) => ({ ...r, layers: [...r.layers, layer] })),
      selectedLayerId: layer.id,
      ...(pendingLogo ? { pendingLogos: { ...s.pendingLogos, [layer.id]: pendingLogo } } : {}),
    })),
  updateLayer: (id, patch) =>
    set((s) => ({ recipe: { ...s.recipe, layers: s.recipe.layers.map((l) => (l.id === id ? applyLayerPatch(l, patch) : l)) } })),
  removeLayer: (id) =>
    set((s) => ({
      ...discrete(s, (r) => ({ ...r, layers: r.layers.filter((l) => l.id !== id) })),
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    })),
  moveLayer: (from, to) =>
    set((s) =>
      discrete(s, (r) => {
        const layers = [...r.layers];
        if (from < 0 || from >= layers.length || to < 0 || to >= layers.length || from === to) return r;
        const [moved] = layers.splice(from, 1);
        layers.splice(to, 0, moved);
        return { ...r, layers };
      }),
    ),
  selectLayer: (id) => set({ selectedLayerId: id }),
  commit: () => set((s) => commitHistory(history(s))),
  beginDrag: () => set({ dragging: true }),
  endDrag: () => set((s) => ({ ...commitHistory(history(s)), dragging: false, flushSeq: s.flushSeq + 1 })),
  undo: () =>
    set((s) => {
      const h = undoHistory(history(s));
      return { ...h, selectedLayerId: keepSelection(s, h.recipe) };
    }),
  redo: () =>
    set((s) => {
      const h = redoHistory(history(s));
      return { ...h, selectedLayerId: keepSelection(s, h.recipe) };
    }),
  setHiddenGroups: (indices) =>
    set((s) => discrete(s, (r) => ({ ...r, hidden_groups: [...new Set(indices)].sort((a, b) => a - b) }))),
  toggleHiddenGroup: (index) =>
    set((s) =>
      discrete(s, (r) => {
        const hidden = new Set(r.hidden_groups ?? []);
        if (hidden.has(index)) hidden.delete(index);
        else hidden.add(index);
        return { ...r, hidden_groups: [...hidden].sort((a, b) => a - b) };
      }),
    ),
  addZone: (zone) =>
    set((s) => ({ ...discrete(s, (r) => ({ ...r, zones: [...(r.zones ?? []), zone] })), selectedZoneId: zone.id })),
  // A zone's plane and brush are live edits, like a layer's placement: the
  // pointer-up commits one undo entry.
  updateZone: (id, patch) =>
    set((s) => ({ recipe: { ...s.recipe, zones: (s.recipe.zones ?? []).map((z) => (z.id === id ? { ...z, ...patch } : z)) } })),
  removeZone: (id) =>
    set((s) => ({
      ...discrete(s, (r) => ({ ...r, zones: (r.zones ?? []).filter((z) => z.id !== id) })),
      selectedZoneId: s.selectedZoneId === id ? null : s.selectedZoneId,
      paintZoneId: s.paintZoneId === id ? null : s.paintZoneId,
    })),
  selectZone: (selectedZoneId) => set({ selectedZoneId }),
  setModelFrame: (modelFrame) => set({ modelFrame }),
  setPartsReport: (partsReport) => set({ partsReport }),
  setPaintZone: (paintZoneId) => set({ paintZoneId }),
  setBrushRadius: (brushRadiusMm) => set({ brushRadiusMm }),
  setPendingLogos: (pendingLogos) => set({ pendingLogos }),
}));

/**
 * Stable empties for the optional recipe fields: a selector that returns a new
 * `[]` every call re-renders for ever (zustand compares by reference).
 */
export const EMPTY_NUMBERS: number[] = [];
export const EMPTY_ZONES: Zone[] = [];
export const EMPTY_OVERLAPS: [number, number][] = [];

export const selectZones = (s: EditorState): Zone[] => s.recipe.zones ?? EMPTY_ZONES;
export const selectHiddenGroups = (s: EditorState): number[] => s.recipe.hidden_groups ?? EMPTY_NUMBERS;
export const selectZoneOverlaps = (s: EditorState): [number, number][] => s.partsReport?.overlaps ?? EMPTY_OVERLAPS;

export const selectCanUndo = (s: EditorState) => canUndo(history(s));
export const selectCanRedo = (s: EditorState) => canRedo(history(s));
