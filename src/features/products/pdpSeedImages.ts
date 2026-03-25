/**
 * Temporary frontend image seed for PDP and product cards.
 * Maps product slugs to local asset paths for products
 * that don't yet have images in the database.
 *
 * Precedence: real DB images → seeded images → placeholder.
 */

import metalButton from '@/assets/products/metal-button.jpg';
import resinButtons from '@/assets/products/resin-buttons.jpg';
import brandButton from '@/assets/products/brand-button.jpg';
import engravedButton from '@/assets/products/engraved-button.jpg';
import snapButton from '@/assets/products/snap-button.jpg';
import beltBuckle from '@/assets/products/belt-buckle.jpg';
import metalClasp from '@/assets/products/metal-clasp.jpg';
import cottonLace from '@/assets/products/cotton-lace.jpg';
import brandedZipper from '@/assets/products/branded-zipper.jpg';
import metalZipper from '@/assets/products/metal-zipper.jpg';
import nylonZipper from '@/assets/products/nylon-zipper.jpg';
import wovenLabel from '@/assets/products/woven-label.jpg';
import buttonsCategory from '@/assets/products/buttons-category.jpg';
import hardwareCategory from '@/assets/products/hardware-category.jpg';
import laceCategory from '@/assets/products/lace-category.jpg';
import zippersCategory from '@/assets/products/zippers-category.jpg';
import otherCategory from '@/assets/products/other-category.jpg';

/** Each entry can have 1–4 image URLs for the PDP gallery */
const seedImages: Record<string, string[]> = {
  // Buttons
  'sample-trim-collection': [metalButton, resinButtons, brandButton, engravedButton],
  'shank-button': [metalButton, brandButton, engravedButton],
  'shank-button-metal': [metalButton, engravedButton, brandButton],
  'resin-fashion-button': [resinButtons, brandButton, buttonsCategory],
  'snap-button': [snapButton, metalButton, engravedButton],
  'snap-button-ring': [snapButton, metalButton],
  'jeans-button-antique': [engravedButton, metalButton, brandButton],
  'metal-button': [metalButton, engravedButton, brandButton, snapButton],

  // Buckles & hardware
  'plastic-side-release-buckle': [beltBuckle, metalClasp, hardwareCategory],
  'metal-d-ring-buckle': [metalClasp, beltBuckle, hardwareCategory],
  'rivet-brass': [metalClasp, hardwareCategory, engravedButton],
  'rivet-copper': [metalClasp, hardwareCategory, beltBuckle],

  // Zippers
  'nylon-cord-puller': [nylonZipper, brandedZipper, zippersCategory],
  'metal-zipper-puller': [metalZipper, brandedZipper, zippersCategory],
  'metal-zipper': [metalZipper, brandedZipper, zippersCategory],
  'nylon-zipper': [nylonZipper, brandedZipper, zippersCategory],
  'branded-zipper': [brandedZipper, metalZipper, zippersCategory],
  'invisible-zipper': [nylonZipper, zippersCategory, brandedZipper],

  // Lace & trims
  'eco-lace-trim': [cottonLace, laceCategory],

  // Labels
  'woven-label': [wovenLabel, otherCategory],

  // Catch-all category-based fallbacks for any slug containing these keywords
};

/** Exported fallback for components that need a single real image */
export function getFallbackImage(): string {
  return otherCategory;
}

/** Category-based fallback images when no slug match exists */
const categoryFallbacks: Record<string, string[]> = {
  buttons: [buttonsCategory, metalButton, resinButtons],
  buckles: [hardwareCategory, beltBuckle, metalClasp],
  hardware: [hardwareCategory, metalClasp, beltBuckle],
  zippers: [zippersCategory, metalZipper, brandedZipper],
  lace: [laceCategory, cottonLace],
  labels: [otherCategory, wovenLabel],
  trims: [otherCategory, cottonLace, wovenLabel],
};

export function getPdpSeedImages(slug: string, categorySlug?: string): string[] | undefined {
  // Direct slug match first
  const direct = seedImages[slug];
  if (direct) return direct;

  // Try partial slug matching
  for (const [key, images] of Object.entries(seedImages)) {
    if (slug.includes(key) || key.includes(slug)) return images;
  }

  // Category-based fallback
  if (categorySlug) {
    const catImages = categoryFallbacks[categorySlug];
    if (catImages) return catImages;
  }

  // Keyword matching in slug
  for (const [keyword, images] of Object.entries(categoryFallbacks)) {
    if (slug.includes(keyword) || slug.includes(keyword.slice(0, -1))) return images;
  }

  // Universal fallback — use a real product image rather than placeholder
  return [otherCategory, metalButton];
}
