import { create } from "zustand";
import { applyLayerPatch, emptyRecipe, scaleLayers, type DraftRecipe, type LayerPatch, type TextLayer } from "../lib/recipe";

/**
 * Local editor state: one `DraftRecipe` (E1 collision 20) — the same shape
 * autosave writes and the anonymous draft stores — plus the selected layer.
 * The store is module-global, so `initialize` replaces everything
 * (collision 21): nothing from a previous design or product survives.
 */
interface EditorState {
  recipe: DraftRecipe;
  selectedLayerId: string | null;
  /** The design id (or `new:<slug>`) `initialize` last ran for — autosave hydrates only after it matches (collision 24). */
  hydratedFor: string | null;
  initialize: (recipe: DraftRecipe, hydratedFor: string) => void;
  /** `ratio` = new variant mm / old variant mm; layers scale with the product (C10). */
  setSizeVariantId: (id: string, ratio?: number) => void;
  setFinishId: (id: string) => void;
  setColourId: (id: string) => void;
  setRuler: (ruler: boolean) => void;
  addLayer: (layer: TextLayer) => void;
  updateLayer: (id: string, patch: LayerPatch) => void;
  removeLayer: (id: string) => void;
  moveLayer: (from: number, to: number) => void;
  selectLayer: (id: string | null) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  recipe: emptyRecipe(),
  selectedLayerId: null,
  hydratedFor: null,
  initialize: (recipe, hydratedFor) => set({ recipe, selectedLayerId: null, hydratedFor }),
  setSizeVariantId: (id, ratio = 1) =>
    set((s) => ({ recipe: { ...s.recipe, size_variant_id: id, layers: scaleLayers(s.recipe.layers, ratio) } })),
  setFinishId: (id) => set((s) => ({ recipe: { ...s.recipe, finish_id: id } })),
  setColourId: (id) => set((s) => ({ recipe: { ...s.recipe, colour_id: id } })),
  setRuler: (ruler) => set((s) => ({ recipe: { ...s.recipe, view: { ...s.recipe.view, ruler } } })),
  addLayer: (layer) => set((s) => ({ recipe: { ...s.recipe, layers: [...s.recipe.layers, layer] }, selectedLayerId: layer.id })),
  updateLayer: (id, patch) =>
    set((s) => ({ recipe: { ...s.recipe, layers: s.recipe.layers.map((l) => (l.id === id ? applyLayerPatch(l, patch) : l)) } })),
  removeLayer: (id) =>
    set((s) => ({
      recipe: { ...s.recipe, layers: s.recipe.layers.filter((l) => l.id !== id) },
      selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
    })),
  moveLayer: (from, to) =>
    set((s) => {
      const layers = [...s.recipe.layers];
      if (from < 0 || from >= layers.length || to < 0 || to >= layers.length || from === to) return {};
      const [moved] = layers.splice(from, 1);
      layers.splice(to, 0, moved);
      return { recipe: { ...s.recipe, layers } };
    }),
  selectLayer: (id) => set({ selectedLayerId: id }),
}));
