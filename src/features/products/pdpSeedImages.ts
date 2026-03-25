/**
 * Temporary frontend image seed for PDP.
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

/** Each entry can have 1–4 image URLs for the PDP gallery */
const seedImages: Record<string, string[]> = {
  // Products that may lack DB images — use local assets
  'sample-trim-collection': [metalButton, resinButtons, brandButton, engravedButton],
  'plastic-side-release-buckle': [beltBuckle, metalClasp],
  'metal-d-ring-buckle': [metalClasp, beltBuckle],
  'eco-lace-trim': [cottonLace],
  'nylon-cord-puller': [nylonZipper, brandedZipper],
  'metal-zipper-puller': [metalZipper, brandedZipper],
  'shank-button': [metalButton, brandButton],
  'shank-button-metal': [metalButton, engravedButton],
  'resin-fashion-button': [resinButtons, brandButton],
  'snap-button': [snapButton, metalButton],
  'snap-button-ring': [snapButton],
  'rivet-brass': [metalClasp],
  'rivet-copper': [metalClasp],
  'jeans-button-antique': [engravedButton, metalButton],
  'woven-label': [wovenLabel],
};

export function getPdpSeedImages(slug: string): string[] | undefined {
  return seedImages[slug];
}
