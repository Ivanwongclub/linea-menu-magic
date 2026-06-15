import type { Product } from '@/features/products/types';
import { getPdpSeedImages } from '@/features/products/pdpSeedImages';

/** Shared resolver — the fallback chain used by ProductCard (trim library) and the
 *  /designer-studio Featured Trims strip (P18 C3). Keeps card visuals in lockstep
 *  between the two surfaces.
 *
 *  Order:
 *    1. `product.images` — primary (or first) row from the products_images join
 *    2. `product.thumbnail_url` — the explicit thumbnail column
 *    3. seeded image map keyed by slug / category slug (curated per-product photos)
 *    4. `null` — caller should render a neutral placeholder block. We deliberately
 *       do NOT fall back to a generated placeholder or a representative
 *       photo from another category, which would mislead the user about what
 *       the product looks like.
 */
export function resolveProductImage(
  product: Product,
  _size: 'thumb' | 'full' = 'thumb',
): string | null {
  if (product.images?.length) {
    const primary = product.images.find((img) => img.is_primary) ?? product.images[0];
    if (primary?.url) return primary.url;
  }

  if (product.thumbnail_url) return product.thumbnail_url;

  const seeded = getPdpSeedImages(product.slug, product.primary_category?.slug);
  if (seeded && seeded.length > 0) return seeded[0];

  return null;
}
