

## Compact, wider-content timeline for `/about/our-story`

Refactor the "Our Journey" timeline so each row is shorter, year text is smaller, descriptions get much more width (fewer wrapped lines), and milestone images render in full color. Surgical edit — only the timeline section of `src/pages/about/OurStory.tsx`.

### What changes

**Layout — drop alternating columns, use a left-rail year + wide content row**

- Replace the `md:grid-cols-2` alternating layout with a single row: narrow year rail (left) → spine dot → wide content (right).
- Approx. column widths: year rail `w-20` (80px) + dot column + content `flex-1`. Container widens from `max-w-3xl` → `max-w-4xl` so descriptions get noticeably more horizontal room.
- Spine moves from center to `left-20` to match the new structure.
- Result: a description like the 1979 founding line collapses from ~4 lines to ~2 lines on desktop.

**Spacing — tighter rows**

- Row spacing: `mb-8` → `mb-5`.
- Year-to-rule gap and rule-to-title gap reduced (`mb-3` → `mb-2`, `mb-4` → `mb-3`).
- Body top margin: `mt-2.5` → `mt-2`.
- Header bottom margin: `mb-12` → `mb-10`.

**Typography — smaller year**

- Year: `text-[22px] lg:text-[26px]` → `text-[15px] lg:text-[16px]`, kept bold/tracking-tight, color stays muted.
- Drop the "Est." prefix label (visual noise at smaller size).
- Title and body sizes unchanged.

**Imagery — full color**

- Remove `grayscale sepia-[0.15] brightness-90` from vintage milestone images.
- Remove `opacity-70` overlay on the highlighted "May 2026" hero image so it also renders in full color.
- Slightly enlarge inline image cap from `max-w-[260px]` → `max-w-[320px]` since content column is wider.

**Mobile**

- Year rail collapses to a small inline year above content (existing mobile pattern, kept intact, just smaller font to match).

### Out of scope (not changing)

- Intro, Heritage & Growth, Core Values sections — untouched.
- Highlight card structure for "May 2026" stays (only the image opacity is removed).
- Animations, scroll reveals, breadcrumb, page header.
- Milestone copy/data.

### Files to change

- `src/pages/about/OurStory.tsx` — timeline section + `CenteredMilestoneItem` + `MilestoneContent` only. ~25 lines edited, no new imports, no new components.

