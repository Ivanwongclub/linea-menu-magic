/**
 * Front-end taxonomy mapping layer.
 *
 * Maps the flat DB categories into the approved 3-family structure
 * and defines the Segment facet until the backend has a dedicated table.
 */

// ─── Families ───────────────────────────────────────────

export interface ProductFamily {
  slug: string;
  name: string;
  /** Category slugs that belong to this family */
  categorySlugs: string[];
}

export const PRODUCT_FAMILIES: ProductFamily[] = [
  {
    slug: 'hardware',
    name: 'Hardware',
    categorySlugs: [
      'buttons',
      'snap-buttons',
      'jeans-buttons',
      'shank-buttons',
      'beads',
      'buckles',
      'cord-ends',
      'cord-stoppers',
      'eyelets',
      'hook-eyes',
      'rivets',
      'zipper-pullers',
      'toggles',
    ],
  },
  {
    slug: 'soft-trims',
    name: 'Soft Trims',
    categorySlugs: ['drawcords', 'webbing'],
  },
  {
    slug: 'branding-trims',
    name: 'Branding Trims',
    categorySlugs: ['badges', 'patches'],
  },
];

/** Look up which family a category slug belongs to */
export function getFamilyForCategory(categorySlug: string): ProductFamily | undefined {
  return PRODUCT_FAMILIES.find((f) => f.categorySlugs.includes(categorySlug));
}

/** Get all category slugs belonging to a family */
export function getCategorySlugsForFamily(familySlug: string): string[] {
  return PRODUCT_FAMILIES.find((f) => f.slug === familySlug)?.categorySlugs ?? [];
}

// ─── Segments ───────────────────────────────────────────

export interface ProductSegment {
  slug: string;
  name: string;
}

export const PRODUCT_SEGMENTS: ProductSegment[] = [
  { slug: 'fashion', name: 'Fashion' },
  { slug: 'apparel', name: 'Apparel' },
  { slug: 'beauty', name: 'Beauty' },
];
