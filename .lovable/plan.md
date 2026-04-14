

## Plan: Align Designer Studio Product Library with Public Catalog

### Problem

The Designer Studio's "Component Library" (tab `library` in the dashboard) uses its own card component (`LibraryItemCard`) and data pipeline (`useUserLibrary` → `user_library_items` table), which is disconnected from the public `/products` catalog. The user wants:

1. The library in Designer Studio to show **the same products** as `/products` (using the same images, card style, and data source)
2. Every product to indicate it contains **OBJ files** (3D model availability)
3. A cohesive UX between the two views

### Current Architecture

```text
/products page                          Designer Studio Library
─────────────                           ──────────────────────
useProducts() hook                      useUserLibrary(teamId) hook
  → products table                        → user_library_items table
  → ProductCard component                 → LibraryItemCard component
  → resolveProductImage()                 → raw thumbnail_url only
  → ProductsSidebar filters               → category dropdown + favourites
```

**Key gaps:**
- `LibraryItemCard` doesn't use `resolveProductImage()` or `getProductImageUrl()` — so regenerated product images don't appear
- Library only shows items manually added to `user_library_items`, not the full catalog
- Card design differs (no tags, no cert badges, no hover info panel matching `/products`)
- No OBJ/3D file indicator in the public catalog cards

### Design & UX

The Designer Studio library will become a **browsable catalog view** (like `/products`) with additional studio actions (Add to Composition, Favourite, Request). The card will reuse the same image resolution pipeline so regenerated images appear consistently.

**Card layout (unified):**
- Square image area with same `resolveProductImage()` fallback chain
- Tag badges top-left (New, Best Seller, etc.)
- 3D/OBJ badge top-right when `model_url` exists
- Category + item code row below image
- Product name
- Studio actions bar: Add to Composition | Download Files | Favourite

### Changes

#### 1. `src/components/designer-studio/LibraryItemCard.tsx` (lines 44-49)
- Import and use `resolveProductImage` + `getProductImageUrl` from the same pipeline as `ProductCard`
- Replace raw `item.product.thumbnail_url` with `resolveProductImage(item.product)` 
- Add tag badges (top-left) matching `ProductCard` style
- Keep studio-specific hover overlay (Add to Composition, View Details)

#### 2. `src/pages/DesignerStudioDashboard.tsx` (lines 459-620, Library section)
- Replace the library data source: instead of only `useUserLibrary(teamId)` items, **also fetch all products** via `useProducts({})` to show the full catalog
- Add a toggle/tab: "All Products" vs "My Library" (favourited/saved items)
- Reuse `ProductsSidebar` or its filter logic (category families: Hardware, Soft Trims, Branding Trims) for consistency with `/products`

#### 3. `src/components/products/ProductCard.tsx` (lines 77-85)
- Add a 3D/OBJ badge (top-right) when `product.model_url` exists — same style as `LibraryItemCard`'s existing "3D" badge
- This makes the public catalog also indicate OBJ availability

#### 4. `src/components/designer-studio/LibraryItemCard.tsx` (lines 37-70, image + badges)
- Use `resolveProductImage(item.product as Product)` for the image `src`
- Show `product.tags` as badge chips (matching ProductCard)
- Show cert badge if certifications exist

#### 5. `src/pages/DesignerStudioDashboard.tsx` (lines 580)
- Update grid columns to match `/products` grid: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` (currently goes up to `6xl:grid-cols-6` which is too dense)

### Files to Edit

| File | What changes |
|------|-------------|
| `src/components/designer-studio/LibraryItemCard.tsx` | Use shared image resolver; add tag/cert/3D badges matching ProductCard |
| `src/components/products/ProductCard.tsx` | Add 3D/OBJ badge when `model_url` present |
| `src/pages/DesignerStudioDashboard.tsx` | Add full catalog browsing (useProducts), "All Products / My Library" toggle, align grid density |
| `src/lib/productImage.ts` | No changes needed (already shared) |

### Summary

- **5 files touched**, 3 with significant edits
- Library becomes a full catalog browser with studio actions layered on top
- Image pipeline unified so regenerated images appear everywhere
- 3D/OBJ badge added to both public and studio cards
- Grid density and filter UX aligned between the two views

