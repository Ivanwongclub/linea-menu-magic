

## Make sidebar full-height visible without scrolling

**Problem**: The product grid area can be shorter than the sidebar, causing the sidebar content to be cut off or require scrolling.

**Solution**: Set a minimum height on the main content area (the flex container holding sidebar + grid) so the page stretches tall enough to display the full sidebar without scrolling.

### Changes

**File: `src/pages/Products.tsx`** (line ~315)

- On the flex container (`div` with `max-w-7xl mx-auto flex items-start gap-10`), add a `min-h` style that ensures the container is at least as tall as needed for the sidebar.
- Remove `max-h-[calc(100vh-96px)] overflow-y-auto` from the sidebar `<aside>` (line ~317) so the sidebar naturally takes its full content height instead of being scroll-constrained.
- Keep `sticky top-[80px]` on the aside so it still sticks while scrolling long product grids, but remove the scroll/overflow constraints that clip it.

This way:
- When the grid is short, the page extends to show the full sidebar
- When the grid is long, the sidebar sticks as you scroll

