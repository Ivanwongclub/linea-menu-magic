

## Problem

The `featuredSlugs` set uses `product.slug` as the key, but product slugs may be empty, undefined, or inconsistent — causing the `Set.has()` check to fail silently. Switching to `product.id` (UUID, always present) as the canonical key fixes this.

## Changes

### 1. `src/pages/Products.tsx`

- Rename `featuredSlugs` to `featuredProductIds` — a `Set<string>` keyed by `product.id`
- Seed explicit matches first using normalized comparisons against `product.id`, `product.slug`, `product.item_code`, and `product.tags[].slug`
- If fewer than 4 matches, top up from the **final displayed** `products` array (the same one rendered in the grid) until count reaches 4
- Update all render paths to pass `isFeatured={featuredProductIds.has(product.id)}`:
  - Default flat grid (line ~406)
  - Hero/first-card variant (line ~410)
  - Grouped rendering (line ~381)

### 2. `src/components/products/ProductCard.tsx`

- No structural changes needed — badge rendering and prop separation (`isHeroLayout` vs `isFeatured`) are already correct
- All three variants (grid, hero, list) already render the badge when `isFeatured` is true

### Key fix

The root cause is using `slug` as the Set key. Product `slug` can be empty/undefined for some rows, while `id` is always a valid UUID. The fallback `products.slice(0, 4).map(p => p.slug)` would insert `undefined` into the Set, and `featuredSlugs.has(undefined)` returns false — badges never render.

### Validation

After implementation, will verify via browser screenshot that badges are visibly rendered on product cards.

