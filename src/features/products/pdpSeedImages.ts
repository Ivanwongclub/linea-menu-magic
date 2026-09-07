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
const BUTTONS = [buttonsCategory, metalButton, resinButtons];
const BUCKLES = [hardwareCategory, beltBuckle, metalClasp];
const HARDWARE = [hardwareCategory, metalClasp, beltBuckle];
const ZIPPERS = [zippersCategory, metalZipper, brandedZipper];
const LACE = [laceCategory, cottonLace];
const LABELS = [otherCategory, wovenLabel];
const TRIMS = [otherCategory, cottonLace, wovenLabel];

/**
 * Keyed on the product's PRIMARY category slug. M4 re-keyed this to the
 * 25 new categories (same images — nothing regresses); the old keys stay
 * for anything still on an old slug. M5 removes this layer entirely.
 */
const categoryFallbacks: Record<string, string[]> = {
  // Buttons
  'metal-shank-buttons': BUTTONS,
  'polyester-buttons': BUTTONS,
  'horn-shell-buttons': BUTTONS,
  'snap-fasteners-jeans-buttons': BUTTONS,
  // Metal & Hardware Accessories
  'buckles-cord-locks': BUCKLES,
  'd-rings-o-rings': HARDWARE,
  'eyelets-rivets': HARDWARE,
  'metal-pendants-brand-badges': HARDWARE,
  // Zippers
  'metal-zippers': ZIPPERS,
  'nylon-coil-zippers': ZIPPERS,
  'plastic-vislon-zippers': ZIPPERS,
  'waterproof-invisible-zippers': ZIPPERS,
  'zipper-pullers-sliders': ZIPPERS,
  // Laces & Ribbons
  'cotton-nylon-lace': LACE,
  'elastic-lace-embroidered-net': LACE,
  'satin-grosgrain-velvet-ribbons': LACE,
  'bows-trimmings': LACE,
  // Soft Trims — Webbing & Tape
  'trousers-waistband-labels': LABELS,
  'hook-and-loop': TRIMS,
  'elastic-tape-braided-elastic': TRIMS,
  'bias-mattress-tape': TRIMS,
  'pp-cotton-poly-tc-webbing': TRIMS,
  'bag-case-sofa-webbing': TRIMS,
  'camouflage-reflective-webbing': TRIMS,
  'traditional-jacquard-tape': TRIMS,
  // Old slugs, kept for anything not yet remapped
  buttons: BUTTONS,
  buckles: BUCKLES,
  hardware: HARDWARE,
  zippers: ZIPPERS,
  lace: LACE,
  labels: LABELS,
  trims: TRIMS,
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
