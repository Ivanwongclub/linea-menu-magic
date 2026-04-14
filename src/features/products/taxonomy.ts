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
  { slug: 'apparel', name: 'Apparel' },
  { slug: 'beauty', name: 'Beauty' },
  { slug: 'material', name: 'Material' },
];

export interface SegmentCategory {
  family: string;
  items: string[];
}

export interface ProductSegmentDetail {
  slug: string;
  name: string;
  tagline: string;
  categories: SegmentCategory[];
}

export const PRODUCT_SEGMENT_DETAILS: ProductSegmentDetail[] = [
  {
    slug: 'apparel',
    name: 'Apparel',
    tagline: 'Buttons, hardware & trims for garments, denim, outerwear & sportswear',
    categories: [
      {
        family: 'Hardware',
        items: [
          'Buttons', 'Snap Buttons', 'Jeans Buttons', 'Shank Buttons',
          'Buckles', 'Eyelets', 'Hook & Eyes', 'Rivets',
          'Zipper Pullers', 'Toggles', 'Cord Ends', 'Cord Stoppers', 'Beads',
        ],
      },
      {
        family: 'Soft Trims',
        items: ['Drawcords', 'Webbing'],
      },
      {
        family: 'Branding Trims',
        items: ['Badges', 'Patches'],
      },
    ],
  },
  {
    slug: 'beauty',
    name: 'Beauty',
    tagline: 'Closures, decorative details & branded trims for cosmetics & accessories',
    categories: [
      {
        family: 'Hardware',
        items: ['Snap Buttons', 'Zipper Pullers', 'Beads', 'Buckles'],
      },
      {
        family: 'Branding Trims',
        items: ['Badges', 'Patches'],
      },
    ],
  },
  {
    slug: 'material',
    name: 'Material',
    tagline: 'Shop by finish & composition: brass, zinc alloy, resin, cotton & recycled',
    categories: [
      {
        family: 'Brass & Bronze',
        items: ['Buttons', 'Buckles', 'Rivets', 'Eyelets', 'Hook & Eyes'],
      },
      {
        family: 'Zinc Alloy',
        items: ['Snap Buttons', 'Jeans Buttons', 'Zipper Pullers', 'Toggles', 'Cord Ends'],
      },
      {
        family: 'Resin & Plastic',
        items: ['Shank Buttons', 'Cord Stoppers', 'Beads'],
      },
      {
        family: 'Cotton & Textile',
        items: ['Drawcords', 'Webbing', 'Badges', 'Patches'],
      },
    ],
  },
];
