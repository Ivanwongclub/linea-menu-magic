

# Enhanced Products Sidebar with Deep Filtering

## Counter-Proposal

Instead of a flat tag list, redesign the sidebar into a **multi-layered navigation system** with collapsible category groups, sorting controls, and special filter sections — all inline in the sidebar rather than hidden behind a sheet/modal.

## Sidebar Structure

```text
┌─────────────────────┐
│  PRODUCTS           │  ← Large typography title (text-4xl, font-light)
│  產品系列             │  ← Chinese subtitle
│                     │
│  ─────────────────  │
│                     │
│  ▾ FASTENERS        │  ← Collapsible group (Radix Collapsible)
│    Buttons          │
│    Jeans Buttons    │
│    Shank Buttons    │
│    Snap Buttons     │
│    Rivets           │
│    Hook & Eyes      │
│    Eyelets          │
│                     │
│  ▾ CLOSURES         │
│    Zipper Pullers   │
│    Buckles          │
│    Cord Ends        │
│    Cord Stoppers    │
│    Toggles          │
│                     │
│  ▾ TRIMS            │
│    Cotton Lace      │
│    Drawcords        │
│    Straps & Webbings│
│    Beads            │
│    Badges           │
│                     │
│  ▾ LABELING         │
│    Labels           │
│    Hangtags         │
│                     │
│  ─────────────────  │
│                     │
│  FILTER BY          │
│  ○ New Arrivals     │  ← Toggle chips
│  ○ Seasonal         │
│  ○ Best Sellers     │
│                     │
│  ─────────────────  │
│                     │
│  SORT               │
│  Featured        ▾  │  ← Inline select
│                     │
│  ─────────────────  │
│  Clear All Filters  │
└─────────────────────┘
```

## Key Design Decisions

1. **Hierarchical categories** — Tags grouped into 4 parent categories (Fasteners, Closures, Trims, Labeling) using Radix `Collapsible`. Clicking a parent shows all products in that group; clicking a child filters to that specific tag.

2. **Special filters** — "New Arrivals", "Seasonal", "Best Sellers" as toggle chips below the category tree. These add a `filter` search param alongside `tag`.

3. **Inline sort** — Move the sort dropdown into the sidebar instead of a top bar, keeping the grid area clean.

4. **Large typography** — The sidebar header uses `text-4xl font-light` for "Products" with the Chinese subtitle below, replacing the breadcrumb title.

5. **Active state** — Active parent group auto-expands; active tag gets `font-medium text-foreground` with a left accent border.

6. **Mobile** — Sidebar becomes a slide-out `Sheet` triggered by a "Filters & Categories" button above the grid. Contains the same full sidebar content.

7. **URL state** — All filters stored in search params: `?category=fasteners&tag=Buttons&filter=new&sort=newest` for shareable links.

## Product Data Enhancement
Add `category` (parent group), `isNew`, `isSeasonal`, `isBestSeller` fields to each product item.

## Files to Modify

1. **`src/pages/Products.tsx`** — Add category groups, filter/sort state, hierarchical sidebar, mobile sheet
2. **`src/components/category/FilterSortBar.tsx`** — Remove (no longer needed, functionality moves to sidebar)

## Technical Details
- Use `@radix-ui/react-collapsible` (already installed) for expandable category groups
- `useSearchParams` for all filter state (category, tag, filter, sort)
- Sidebar width: `w-64` on desktop, full `Sheet` on mobile
- Product items gain: `category: "fasteners" | "closures" | "trims" | "labeling"` plus boolean flags
- Filtering chain: category → tag → special filter → sort

