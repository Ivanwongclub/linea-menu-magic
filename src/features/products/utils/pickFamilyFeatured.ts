import type { Product } from "../types";
import { PRODUCT_FAMILIES } from "../taxonomy";

/**
 * Picks one product per family (Hardware, Soft Trims, Branding Trims),
 * preferring products that have a model_url. Falls back to the first
 * product in that family. Order matches PRODUCT_FAMILIES.
 *
 * Single source of truth shared by the Designer Studio landing
 * (Featured Trims strip) and the Trim Library grid so the two
 * surfaces can never diverge.
 */
export function pickFamilyFeatured(products: Product[]): Product[] {
  const picked: Product[] = [];
  for (const family of PRODUCT_FAMILIES) {
    const withModel = products.find(
      (p) =>
        p.model_url &&
        p.categories?.some((c) => family.categorySlugs.includes(c.slug)),
    );
    const fallback = products.find((p) =>
      p.categories?.some((c) => family.categorySlugs.includes(c.slug)),
    );
    const pick = withModel ?? fallback;
    if (pick && !picked.some((x) => x.id === pick.id)) {
      picked.push(pick);
    }
  }
  return picked;
}

export function getFamilyNameForProduct(product: Product): string | undefined {
  for (const family of PRODUCT_FAMILIES) {
    if (product.categories?.some((c) => family.categorySlugs.includes(c.slug))) {
      return family.name;
    }
  }
  return undefined;
}
