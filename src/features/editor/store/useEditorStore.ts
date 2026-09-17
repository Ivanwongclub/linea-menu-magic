import { create } from "zustand";

/**
 * Local, non-persisted editor state. Phase 2 only ever holds the size
 * variant and finish selections — architecture Part 8 Phase 3+ adds
 * branding layers on top of this same store.
 */
interface EditorState {
  sizeVariantId: string | null;
  finishId: string | null;
  colourId: string | null;
  /** `draft_recipe.view.ruler` (Phase 4e) — off by default, persisted per design/draft. */
  ruler: boolean;
  setSizeVariantId: (id: string) => void;
  setFinishId: (id: string) => void;
  setColourId: (id: string) => void;
  setRuler: (ruler: boolean) => void;
  initialize: (defaults: { sizeVariantId: string | null; finishId: string | null; colourId: string | null; ruler?: boolean }) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  sizeVariantId: null,
  finishId: null,
  colourId: null,
  ruler: false,
  setSizeVariantId: (id) => set({ sizeVariantId: id }),
  setFinishId: (id) => set({ finishId: id }),
  setColourId: (id) => set({ colourId: id }),
  setRuler: (ruler) => set({ ruler }),
  initialize: (defaults) =>
    set({ sizeVariantId: defaults.sizeVariantId, finishId: defaults.finishId, colourId: defaults.colourId, ruler: defaults.ruler ?? false }),
}));
