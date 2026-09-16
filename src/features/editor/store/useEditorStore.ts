import { create } from "zustand";

/**
 * Local, non-persisted editor state. Phase 2 only ever holds the size
 * variant and finish selections — architecture Part 8 Phase 3+ adds
 * branding layers on top of this same store.
 */
interface EditorState {
  sizeVariantId: string | null;
  finishId: string | null;
  setSizeVariantId: (id: string) => void;
  setFinishId: (id: string) => void;
  initialize: (defaults: { sizeVariantId: string | null; finishId: string | null }) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  sizeVariantId: null,
  finishId: null,
  setSizeVariantId: (id) => set({ sizeVariantId: id }),
  setFinishId: (id) => set({ finishId: id }),
  initialize: (defaults) => set({ sizeVariantId: defaults.sizeVariantId, finishId: defaults.finishId }),
}));
