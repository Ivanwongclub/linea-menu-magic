

## Problem

From the screenshot and database query: only 14 out of 54 products have AI-generated images (`thumbnail_url`). The remaining 40 show SVG placeholders. The edge function exists and works but was only partially run or timed out.

## Plan

### 1. Fix the edge function to process all 54 products reliably

The current function processes products where `thumbnail_url IS NULL`. It needs two fixes:
- **Increase delay** between products from 500ms to 2000ms to avoid rate limiting
- **Add batch support**: accept an optional `batchSize` + `offset` parameter so we can process in smaller batches (e.g., 10 at a time) if the function times out on 40+ products
- **Also insert into `product_images`**: currently the `ON CONFLICT` clause references `product_id,sort_order` but there may not be a unique constraint — use upsert logic that works

### 2. Trigger the function to process remaining products

After deploying the updated function, invoke it to generate images for the ~40 products still missing thumbnails. Process in batches of 10 to stay within edge function timeout limits.

### 3. No component changes needed

The `resolveProductImage` in ProductCard.tsx already correctly falls through: DB images → thumbnail_url → SVG placeholder. Once thumbnails are populated in the DB, cards will show AI images automatically.

### Technical details

**Edge function changes** (`supabase/functions/generate-product-images/index.ts`):
- Add `batchSize` and `offset` body params (default: batchSize=10, offset=0)
- Add `.limit(batchSize).range(offset, offset + batchSize - 1)` to the query
- Increase inter-product delay to 1500ms
- Return `{ remaining: totalWithoutImages - processed }` so the caller knows if more batches are needed

**CMS UI changes** (`ProductCatalogTab.tsx`):
- Update the generate button handler to call the function in a loop, batch by batch (10 at a time), updating progress between batches
- Show progress as "Generated X of Y..."

**No other files touched.**

