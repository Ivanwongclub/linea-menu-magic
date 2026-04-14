

## Plan: Align Mega Menu Content with Nav Links

### Problem
The mega menu content starts at the left page padding (`px-10 lg:px-16 xl:px-24`), but the nav links (SEGMENTS, PRODUCTS, etc.) start further right — after the logo and its margin. This creates a visual misalignment between the menu text and the dropdown content below it.

### Approach
Use the same left padding structure as the header bar, but add an additional left offset matching the logo width + nav margin, so the mega menu content starts at the same vertical line as "SEGMENTS".

The logo block is roughly `~120px` wide, plus `ml-16 (64px)` / `xl:ml-24 (96px)` nav margin = the nav links start approximately `184px` / `216px` from the container edge. Instead of hardcoding pixels, we can add a left `padding-left` to the inner mega menu container that accounts for the logo + gap.

### Changes — `src/components/layout/Header.tsx`

1. **Segments mega menu (line 288)** — Add `pl-[200px] xl:pl-[240px]` to the inner content div to shift content rightward, aligning with the nav links. Remove the existing left padding from the `w-full px-10 lg:px-16 xl:px-24` wrapper (keep right padding).

2. **Products mega menu (line 402)** — Same treatment: shift inner content right to align with nav start.

3. **About mega menu (line 497)** — Same treatment.

Specifically, for each mega menu's inner container div (the one with `w-full px-10 lg:px-16 xl:px-24 py-10`), change to:
```
w-full pr-10 lg:pr-16 xl:pr-24 pl-[200px] xl:pl-[240px] py-10
```

This makes the mega menu content start at the same horizontal position as the "SEGMENTS" nav link.

### Files modified
- `src/components/layout/Header.tsx` — update padding on 3 mega menu inner containers

