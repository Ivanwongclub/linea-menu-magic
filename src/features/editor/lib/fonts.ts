import { Font, FontLoader } from "three/examples/jsm/loaders/FontLoader.js";

/**
 * The bundled fonts (E1 open question 9): two OFL families, converted
 * offline to typeface JSON and subset to Latin-1, served from
 * `public/fonts/` with their licence files beside them. Fetched on demand —
 * never in the JS bundle.
 */
export const BUNDLED_FONTS = [
  { key: "poppins-semibold", label: "Poppins SemiBold" },
  { key: "dm-serif-display", label: "DM Serif Display" },
] as const;

const cache = new Map<string, Promise<Font>>();

export function loadBundledFont(key: string): Promise<Font> {
  const known = BUNDLED_FONTS.some((f) => f.key === key) ? key : BUNDLED_FONTS[0].key;
  let pending = cache.get(known);
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}fonts/${known}.typeface.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`font ${known}: ${r.status}`);
        return r.json();
      })
      .then((json) => new FontLoader().parse(json));
    pending.catch(() => cache.delete(known));
    cache.set(known, pending);
  }
  return pending;
}
