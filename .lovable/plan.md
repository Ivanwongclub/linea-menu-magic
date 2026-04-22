

## Restore alternating left/right timeline on `/about/our-story`

Bring back the zig-zag layout for "Our Journey" while keeping the recent improvements (smaller year, tighter spacing, full-color images, wider content).

### What changes

**Layout — center spine + alternating sides**

- Container: keep `max-w-4xl` (wider than original `max-w-3xl` so descriptions still get more room than before).
- Spine: move back to horizontal center (`left-1/2 -translate-x-1/2`).
- Each milestone row uses a 2-column grid (`md:grid-cols-2`):
  - Even index (0, 2, 4…) → content on **left** column, right column empty.
  - Odd index (1, 3, 5…) → content on **right** column, left column empty.
- Year sits inline with the milestone content (above title), aligned to the spine side: right-aligned on left-side rows, left-aligned on right-side rows.
- Dot stays centered on the spine for every row.

**Keep from previous edit (do NOT revert)**

- Year font size: `text-[15px] lg:text-[16px]`, no "Est." prefix.
- Row spacing: `mb-5`.
- Header bottom margin: `mb-10`.
- Body/title margins: `mb-2`, `mb-3`, `mt-2`.
- Inline image cap: `max-w-[320px]`.
- Full-color images (no `grayscale`/`sepia`/`opacity-70`).

**Mobile**

- Below `md`: collapse to single column, year + content stacked left-aligned (existing mobile pattern).

### Out of scope

- Intro, Heritage & Growth, Core Values, breadcrumb, page header.
- Highlight card structure for "May 2026".
- Animations and scroll reveals.
- Milestone copy/data.

### Files to change

- `src/pages/about/OurStory.tsx` — timeline section + `CenteredMilestoneItem` only. ~20 lines edited, no new imports, no new components.

