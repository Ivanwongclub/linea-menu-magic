import type { Product } from "../types";
import type { CatalogueFamily } from "../hooks/useCatalogueTaxonomy";
import { localizedName } from "@/features/admin/lib/localize";
import type { AppLanguage } from "@/features/i18n/translations";

/**
 * Picks one product per family, preferring products that have a model_url.
 * Falls back to the first product in that family. Order matches the
 * families' sort_order in the database. Families with no product yield
 * nothing — two of the five are empty at launch.
 *
 * Used by the Designer Studio landing's Featured Trims strip. The Trim
 * Library renders every matching product instead of one per family.
 */
export function pickFamilyFeatured(products: Product[], families: CatalogueFamily[]): Product[] {
  const picked: Product[] = [];
  for (const family of families) {
    const inFamily = (p: Product) => p.categories?.some((c) => c.family_id === family.id);
    const withModel = products.find((p) => p.model_url && inFamily(p));
    const fallback = products.find(inFamily);
    const pick = withModel ?? fallback;
    if (pick && !picked.some((x) => x.id === pick.id)) picked.push(pick);
  }
  return picked;
}

export function getFamilyNameForProduct(
  product: Product,
  families: CatalogueFamily[],
  language: AppLanguage,
): string | undefined {
  const primaryFamilyId = product.primary_category?.family_id ?? product.categories?.[0]?.family_id;
  const family = families.find((f) => f.id === primaryFamilyId);
  return family ? localizedName(family, language) : undefined;
}
