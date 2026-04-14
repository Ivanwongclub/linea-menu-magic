

## Plan: Image File Size, Storage Strategy & Display

### Overview
Implement a comprehensive image optimization architecture: create a shared URL helper for Supabase image transforms, fix `object-cover` → `object-contain` across product image containers, and update the edge function to produce optimized JPEG thumbnails.

### Step 1 — Create `src/lib/productImage.ts`
New shared helper with `getProductImageUrl(rawUrl, size)` that appends Supabase Storage transform query params for `thumb`, `card`, `pdp`, and `menu` sizes. Passes through local asset paths unchanged.

### Step 2 — Fix `object-cover` → `object-contain` + padding

**`src/components/products/ProductCard.tsx`** (lines 95, 109):
- Change `object-cover` to `object-contain p-3` on both the main image and error fallback image.

**`src/components/category/ProductGrid.tsx`** (lines 210, 215):
- Change `object-cover` to `object-contain p-4` on both the primary and hover images.

**`src/pages/ProductDetail.tsx`**:
- Change PDP container from `aspect-[4/5]` to `aspect-square`.
- Change PDP main image from `object-cover` to `object-contain p-6`.

**Leave unchanged**: HeroSection (already `object-contain`), Header mega-menu (keep `object-cover` for editorial panels).

### Step 3 — Wire `getProductImageUrl` into components

Replace raw `thumbnail_url` / `url` usage with the helper in:
- `ProductCard.tsx` — `resolveProductImage` output passed through `getProductImageUrl(url, 'card')`
- `ProductGrid.tsx` — uses local assets, no change needed (helper passes through)
- `ProductDetail.tsx` — use `'pdp'` for main, `'thumb'` for gallery thumbnails
- `SearchProductDialog.tsx` — use `'thumb'`
- `ProductCatalogTab.tsx` — use `'thumb'`
- `ProductPickerSheet.tsx` — use `'thumb'`

### Step 4 — Update edge function `generate-product-images/index.ts`

Changes to the existing function:
- Force upload path to `.jpg` instead of `.png`
- Force content type to `image/jpeg`
- After uploading `ai-primary.jpg` (1000×1000), create a resized 400×400 thumbnail and upload as `ai-thumb.jpg`
- Set `products.thumbnail_url` to the `ai-thumb.jpg` URL
- Set `product_images` primary row to the `ai-primary.jpg` URL

Note: Server-side JPEG conversion from the AI-generated base64 image will use canvas resize in Deno (or simply re-request at smaller size). Since Deno edge functions lack native image resize, we'll upload the full-size image and rely on the Supabase transform API for serving thumbnails — the `ai-thumb.jpg` path change ensures the DB points to the right file.

### Step 5 — Deploy updated edge function

### Files modified
- `src/lib/productImage.ts` (new)
- `src/components/products/ProductCard.tsx`
- `src/components/category/ProductGrid.tsx`
- `src/pages/ProductDetail.tsx`
- `src/components/designer-studio/SearchProductDialog.tsx`
- `src/components/designer-studio/products/ProductCatalogTab.tsx`
- `src/features/designer/components/ProductPickerSheet.tsx`
- `supabase/functions/generate-product-images/index.ts`

### Assumptions
- Supabase Storage transform API is available (it may require Pro plan — the helper falls back to raw URLs gracefully)
- Track A local assets keep their current filenames and are generated separately in the image generation phase
- `srcSet` responsive loading (Part D) will be added as a follow-up after Track B images are generated

