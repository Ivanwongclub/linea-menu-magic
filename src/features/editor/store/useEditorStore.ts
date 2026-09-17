import { create } from "zustand";
import { applyLayerPatch, emptyRecipe, scaleLayers, type DraftRecipe, type Layer, type LayerPatch } from "../lib/recipe";
import type { FaceTransform } from "../lib/recoveredPlacement";
import type { PendingLogo } from "../hooks/useLogoAssets";
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
  hydratedFor: null,
  dragging: false,
  flushSeq: 0,
  modelFrame: null,
  pendingLogos: {},
  initialize: (recipe, hydratedFor) =>
    set((s) => ({
      ...startHistory(recipe),
      dragging: false,
      selectedLayerId: null,
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
  setModelFrame: (modelFrame) => set({ modelFrame }),
  setPendingLogos: (pendingLogos) => set({ pendingLogos }),
}));

export const selectCanUndo = (s: EditorState) => canUndo(history(s));
export const selectCanRedo = (s: EditorState) => canRedo(history(s));
