import { ENV } from "@/config/env";

export type ImageSize = 'thumb' | 'card' | 'pdp' | 'menu';

const SIZE_PARAMS: Record<ImageSize, string> = {
  thumb: 'width=400&height=400&quality=80&resize=contain',
  card: 'width=400&height=400&quality=80&resize=contain',
  pdp: 'width=800&height=800&quality=85&resize=contain',
  menu: 'width=320&height=320&quality=75&resize=contain',
};

/**
 * Returns an optimised Supabase Storage URL for a product image.
 * Falls back to the raw URL if it is already a local asset path.
 */
export function getProductImageUrl(
  rawUrl: string | null | undefined,
  size: ImageSize = 'card',
): string {
  if (!rawUrl) return '';
  // Local asset (already bundled by Vite — return as-is)
  if (!rawUrl.startsWith('http')) return rawUrl;

  try {
    const url = new URL(rawUrl);
    const base = `${url.origin}${url.pathname}`;

    // Non-storage URL — return as-is
    if (!url.pathname.includes('/storage/v1/')) {
      return base;
    }

    if (!ENV.SUPABASE_IMAGE_TRANSFORMS_ENABLED) {
      // Keep canonical URL when transforms are disabled.
      return base;
    }

    // Already using render endpoint; normalise query params only.
    if (url.pathname.includes('/storage/v1/render/image/public/')) {
      return `${base}?${SIZE_PARAMS[size]}`;
    }

    const marker = '/storage/v1/object/public/';
    const markerIndex = url.pathname.indexOf(marker);

    // Unrecognised storage format — return canonical base URL.
    if (markerIndex === -1) {
      return base;
    }

    // object/public/<bucket>/<path> → render/image/public/<bucket>/<path>
    const bucketAndPath = url.pathname.slice(markerIndex + marker.length);
    return `${url.origin}/storage/v1/render/image/public/${bucketAndPath}?${SIZE_PARAMS[size]}`;
  } catch {
    return rawUrl;
  }
}
