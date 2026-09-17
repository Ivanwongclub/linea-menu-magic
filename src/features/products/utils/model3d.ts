/**
 * Whether a product can be opened in the 3D editor (unit 5b R1).
 *
 * A product is 3D-ready when it has a model *and* a scale someone confirmed:
 * `model_storage_path` set and `model_scale_status = 'confirmed'`. The editor
 * refuses an unconfirmed model (units rulings §1.2), so offering the entry
 * would be offering a dead end — the badge and the entry share this one rule
 * so no surface can drift from another.
 *
 * `model_url` is the legacy public URL from before Phase 2; it never meant the
 * scale was known, so it is not part of the rule.
 */
export interface Model3DFields {
  model_storage_path?: string | null;
  model_scale_status?: string | null;
}

/** `ready` opens the editor; `unconfirmed` has a model whose scale nobody has confirmed; `none` has no model. */
export type Model3DState = "ready" | "unconfirmed" | "none";

export function model3DState(product: Model3DFields | null | undefined): Model3DState {
  if (!product?.model_storage_path) return "none";
  return product.model_scale_status === "confirmed" ? "ready" : "unconfirmed";
}

export function is3DReady(product: Model3DFields | null | undefined): boolean {
  return model3DState(product) === "ready";
}

/** The one way into the editor from a catalogue surface (Phase 2 route). */
export const editorUrlForProduct = (slug: string): string => `/designer-studio/editor/new?product=${encodeURIComponent(slug)}`;
