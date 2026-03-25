/**
 * Maps material keywords to macro surface texture images.
 * Used in the PDP Materials card for a premium visual cue.
 */

import metalSurface from '@/assets/materials/metal-surface.jpg';
import brassSurface from '@/assets/materials/brass-surface.jpg';
import resinSurface from '@/assets/materials/resin-surface.jpg';
import cottonSurface from '@/assets/materials/cotton-surface.jpg';

const materialKeywordMap: [string[], string][] = [
  [['brass', 'bronze', 'copper', 'gold', 'antique'], brassSurface],
  [['metal', 'steel', 'zinc', 'alloy', 'iron', 'nickel', 'chrome', 'aluminum'], metalSurface],
  [['resin', 'plastic', 'nylon', 'polyester', 'acrylic', 'abs'], resinSurface],
  [['cotton', 'fabric', 'woven', 'lace', 'thread', 'textile', 'linen'], cottonSurface],
];

/**
 * Returns a macro surface texture image URL based on material name keywords.
 * Falls back to the generic metal surface if no match.
 */
export function getMaterialSurfaceImage(materialName?: string | null): string {
  if (!materialName) return metalSurface;

  const lower = materialName.toLowerCase();
  for (const [keywords, image] of materialKeywordMap) {
    if (keywords.some((k) => lower.includes(k))) return image;
  }

  return metalSurface;
}
