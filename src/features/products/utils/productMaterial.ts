import type { Product, ProductMaterial } from '../types';

/**
 * The material a product should display.
 *
 * Two systems exist and, on production today, they do not overlap: 25 live
 * products carry the typed `material_id` the CMS writes and the finish gate
 * enforces, a different 25 carry rows in the legacy `product_material_map`,
 * and none carries both. Reading only the typed column would blank the
 * material line on half the catalogue, so the typed one wins and the legacy
 * map fills in behind it (M5 ruling 2).
 *
 * The legacy join goes when the CMS has covered those 25 products.
 */
export function resolveProductMaterials(product: Product): ProductMaterial[] {
  if (product.material) return [product.material];
  return product.materials ?? [];
}

/**
 * Whether the product is metal, and so may carry finishes rather than
 * colours. Mirrors `check_finish_requires_metal_material` in the database:
 * the decision follows `material_id`, never the legacy map. A product with
 * no typed material is not metal, which is what the trigger enforces.
 */
export function isMetalProduct(product: Product): boolean {
  return product.material?.is_metal === true;
}
