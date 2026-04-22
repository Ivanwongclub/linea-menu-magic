
Widen milestone card images on the home page timeline without altering text, spacing, or timeline structure.

**Problem:** Images currently fill only the card's natural column width (1/9th of the timeline grid). The user wants wider images while keeping text columns and timeline alignment unchanged.

**Approach:** Let the image visually overflow its narrow grid column while the text content stays anchored to the column. The card's text/year/title/desc remain in place; only the `<img>` wrapper expands horizontally beyond the card boundary.

**Changes to `src/components/home/MilestoneTeaser.tsx`:**

1. **Highlight card image wrapper** (around line 232-242):
   - Change wrapper from `<div className="overflow-hidden rounded-t-lg">` to a wider container that breaks out of the card width using negative margins, e.g. `className="overflow-hidden rounded-t-lg -mx-4 lg:-mx-6"`.
   - Keep `h-48` height and `object-cover` unchanged.

2. **Regular card image wrapper** (around line 267-278):
   - Change wrapper from `<div className="overflow-hidden rounded-sm mb-2">` to `className="overflow-hidden rounded-sm mb-2 -mx-4 lg:-mx-6"`.
   - Keep `h-44` height and all filter/vintage classes unchanged.

3. **Card containers** — add `overflow-visible` where needed so the widened image isn't clipped:
   - Highlight card outer div: change `overflow-hidden` to `overflow-visible` (the image wrapper retains its own `overflow-hidden` for rounded corners).

**Result:** Each milestone image becomes ~32–48px wider on each side (depending on breakpoint) while year/title/description text and timeline dots stay in their original positions. No layout shift to neighboring milestones since the grid column widths are unchanged.

**Technical note:** Negative horizontal margins are the cleanest way to break an element out of its parent's width without restructuring the grid or affecting sibling alignment.
