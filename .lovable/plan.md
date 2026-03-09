

# Redesign Products Page with Sidebar + Tag Filtering

## Overview
Replace the current vertically-stacked Products page layout with a sidebar + grid layout inspired by the Frameless reference. Left sidebar shows "CATEGORY" tag links for filtering; right side shows a grid of product cards with images and labels.

## Layout Structure

```text
┌──────────────────────────────────────────────┐
│  Header                                      │
├──────────────────────────────────────────────┤
│  Breadcrumb: Home > Products                 │
├────────────┬─────────────────────────────────┤
│  CATEGORY  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌───┐│
│            │  │ img │ │ img │ │ img │ │img││
│  • Beads   │  │     │ │     │ │     │ │   ││
│  • Badges  │  │label│ │label│ │label│ │lbl││
│  • Buttons │  ├─────┤ ├─────┤ ├─────┤ ├───┤│
│  • Buckles │  │ img │ │ img │ │ img │ │img││
│  • ...     │  │     │ │     │ │     │ │   ││
│  (all tags)│  │label│ │label│ │label│ │lbl││
│            │  └─────┘ └─────┘ └─────┘ └───┘│
├────────────┴─────────────────────────────────┤
│  CTA Section                                 │
├──────────────────────────────────────────────┤
│  Footer                                      │
└──────────────────────────────────────────────┘
```

## Tag Data
Expand subcategories into individual "tags" (matching the reference style):
- Beads, Badges, Buttons, Buckles, Cord Ends, Cord Stoppers, Drawcords/Drawstrings, Eyelets, Hook & Eyes, Jeans Buttons, Rivets, Shank Buttons, Snap Buttons, Straps/Webbings, Zipper Pullers, Toggles, Cotton Lace, Labels, Hangtags

Each tag links to a filtered view. Clicking a tag filters the product grid to show only items matching that tag. An "All" option shows everything.

## Product Grid Items
Flatten the existing 5 categories + their sub-items into individual product cards, each with:
- Image (reuse existing category images, mapped per parent category)
- Label text below the image
- Hover zoom effect (consistent with existing site style)

## Sidebar Behavior
- Desktop: sticky left sidebar (~220px wide) with "CATEGORY" heading and tag list as text links
- Active tag highlighted (underline or bold)
- Mobile: sidebar collapses — show tags as horizontal scrollable chips above the grid
- URL state via `?tag=buttons` search param for shareable filtered views

## Files to Modify
1. **`src/pages/Products.tsx`** — Complete redesign: sidebar + grid layout with tag filtering state
2. No new components needed — keep it self-contained in the page file

## Technical Details
- Use `useState` for active tag, or `useSearchParams` for URL-driven filtering
- Product data array with `tag` field and `image` mapping
- Sidebar is a simple `<aside>` with `sticky top-32`, not the Shadcn Sidebar component (overkill for a simple tag list)
- Mobile: render tags as a horizontal scroll row with `overflow-x-auto flex gap-2`
- Keep the CTA section at the bottom
- Keep the `PageBreadcrumb` at top

