import { normalizeRecipe, type DraftRecipe } from "./recipe";

const KEY_PREFIX = "designer-studio:anon-draft:";

/** The recipe is the same snake_case v2 shape as `designs.draft_recipe`, so a claim inserts it verbatim (collision 22–23). */
export interface AnonymousDraft {
  productSlug: string;
  recipe: DraftRecipe;
}

/** Pre-4f drafts held three camelCase ids and an optional ruler flag. */
interface LegacyDraft {
  productSlug: string;
  sizeVariantId?: string | null;
  finishId?: string | null;
  colourId?: string | null;
  ruler?: boolean;
}

/** Per-viewer convenience only — never read back by anything but this browser. */
export function readAnonymousDraft(productSlug: string): AnonymousDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY_PREFIX + productSlug);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AnonymousDraft> & LegacyDraft;
    if (parsed.productSlug !== productSlug) return null;
    if (parsed.recipe) return { productSlug, recipe: normalizeRecipe(parsed.recipe) };
    return {
      productSlug,
      recipe: {
        ...normalizeRecipe({
          size_variant_id: parsed.sizeVariantId,
          finish_id: parsed.finishId,
          colour_id: parsed.colourId,
        }),
        view: { ruler: parsed.ruler === true },
      },
    };
  } catch {
    return null;
  }
}

export function writeAnonymousDraft(draft: AnonymousDraft): void {
  try {
    window.sessionStorage.setItem(KEY_PREFIX + draft.productSlug, JSON.stringify(draft));
  } catch {
    /* sessionStorage unavailable (private mode, etc.) — draft just doesn't persist */
  }
}

export function clearAnonymousDraft(productSlug: string): void {
  try {
    window.sessionStorage.removeItem(KEY_PREFIX + productSlug);
  } catch {
    /* no-op */
  }
}
