const SUPABASE_STORAGE =
  import.meta.env.VITE_SUPABASE_URL + '/storage/v1/object/public/product-assets';

export type ImageSize = 'thumb' | 'card' | 'pdp' | 'menu';

const SIZE_PARAMS: Record<ImageSize, string> = {
  thumb: 'width=400&height=400&quality=80&resize=cover',
  card: 'width=400&height=400&quality=80&resize=cover',
  pdp: 'width=800&height=800&quality=85&resize=contain',
  menu: 'width=320&height=320&quality=75&resize=cover',
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
    return `${base}?${SIZE_PARAMS[size]}`;
  }
  return rawUrl;
}
