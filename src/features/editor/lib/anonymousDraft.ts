const KEY_PREFIX = "designer-studio:anon-draft:";

export interface AnonymousDraft {
  productSlug: string;
  sizeVariantId: string | null;
  finishId: string | null;
  colourId: string | null;
}

/** Per-viewer convenience only — never read back by anything but this browser. */
export function readAnonymousDraft(productSlug: string): AnonymousDraft | null {
  try {
    const raw = window.sessionStorage.getItem(KEY_PREFIX + productSlug);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AnonymousDraft;
    return parsed.productSlug === productSlug ? parsed : null;
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
