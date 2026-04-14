

## Plan: Redesign Designer Studio Landing Page

### New Layout

The page becomes product-library-first with a minimal header bar instead of a heavy hero. Three sections total:

```text
┌─────────────────────────────────────┐
│  Minimal header bar                 │
│  "Designer Studio" label + tagline  │
│  [Enter Studio]  [Request Access]   │
│  (single row, py-12, no bg art)     │
├─────────────────────────────────────┤
│  Product Library Grid               │
│  Search bar + category filter chips │
│  ProductCard grid (same as /products│
│  with 3D badges, read-only)         │
├─────────────────────────────────────┤
│  Compact CTA + onboarding steps     │
│  Dark band, one heading, one button │
│  3 steps inline (01, 02, 03)        │
└─────────────────────────────────────┘
```

### Changes

**`src/pages/DesignerStudio.tsx`** — Full rewrite

- **Section 1 — Minimal bar** (replaces the heavy hero): White background, no grid pattern, no StudioPreview. Just a `py-12` section with "Designer Studio" label, a short one-line tagline, and two small CTAs side by side. Clean and understated.

- **Section 2 — Product library**: Import `useProducts`, `useProductTaxonomy`, `ProductCard`. Add a search `Input`, category family chips (from taxonomy), and a `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4` grid of `ProductCard` components. Cards link to `/products/:slug`. This is the main content of the page.

- **Section 3 — Bottom CTA**: Keep the dark band with "Request Access" CTA and the 3-step onboarding, but combine into one compact section. Remove the login form and capabilities grid entirely.

**`src/components/products/ProductCard.tsx`** — Add optional `linkTo` prop so cards can navigate to product detail from this page.

### Files

| File | Change |
|------|--------|
| `src/pages/DesignerStudio.tsx` | Full rewrite: minimal bar + product grid + compact CTA |
| `src/components/products/ProductCard.tsx` | Add `linkTo` prop |

