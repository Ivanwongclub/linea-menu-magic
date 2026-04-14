import { ENV } from "@/config/env";

const SUPABASE_STORAGE = `${ENV.STORAGE_URL}/product-assets`;

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
  // Supabase URL — append transform params
  if (rawUrl.includes('supabase.co')) {
    const base = rawUrl.split('?')[0]; // strip any existing params
    if (!ENV.SUPABASE_IMAGE_TRANSFORMS_ENABLED) {
      // Avoid multiple cache keys when transforms are disabled.
      return base;
    }
    return `${base}?${SIZE_PARAMS[size]}`;
  }
  return rawUrl;
}
