import type { Product } from '@/features/products/types';
import { getPdpSeedImages } from '@/features/products/pdpSeedImages';
import { getProductPlaceholderUrl } from '@/features/products/utils/productImagePlaceholder';

/** Shared resolver — the fallback chain used by ProductCard (trim library) and the
 *  /designer-studio Featured Trims strip (P18 C3). Keeps card visuals in lockstep
 *  between the two surfaces.
 *
 *  Order:
 *    1. `product.images` — primary (or first) row from the products_images join
 *    2. `product.thumbnail_url` — the explicit thumbnail column
 *    3. seeded image map keyed by slug / category slug
 *    4. generated SVG placeholder
 */
export function resolveProductImage(
  product: Product,
  size: 'thumb' | 'full' = 'thumb',
): string {
  if (product.images?.length) {
    const primary = product.images.find((img) => img.is_primary) ?? product.images[0];
    if (primary?.url) return primary.url;
  }

  if (product.thumbnail_url) return product.thumbnail_url;

  const seeded = getPdpSeedImages(product.slug, product.primary_category?.slug);
  if (seeded && seeded.length > 0) return seeded[0];

  return getProductPlaceholderUrl(
    product.name_en ?? product.name,
    product.item_code,
    product.primary_category?.slug,
    product.primary_category?.name,
    size === 'thumb' ? 400 : 800,
  );
}
