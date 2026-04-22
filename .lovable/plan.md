
Align the home page "Get in touch" locations with the authoritative data on `/about/factory`.

## Findings

**Home page (`src/components/home/ContactSection.tsx`)** currently lists:
- Hong Kong — HQ — 1979
- Shenzhen — Production — 2011
- Munich — Europe — 2012
- New York — Americas — 2013

**`/about/factory` (`src/pages/about/Factory.tsx`)** is the authoritative source and lists two groups:
- **Offices**: Hong Kong (HQ), plus other regional offices
- **Manufacturing**: Guangdong / Shenzhen production facilities

The home page data is partially fabricated (years and city selection don't match Factory page) and inconsistent with the rest of the site (`ContactSection`'s own copy says "Hong Kong & Guangdong"; footer/contact pages reference HK + Guangdong only).

## Plan

**1. Make `ContactSection` derive from the same source as `/about/factory`.**

- Read the actual `offices` + `factories` arrays from `Factory.tsx` and either:
  - (a) Extract a shared module `src/data/locations.ts` exporting `offices` and `factories`, then import it in both `Factory.tsx` and `ContactSection.tsx`, OR
  - (b) Hardcode the same 4 entries in `ContactSection` to match Factory exactly (simpler, no refactor risk).

Recommended: **option (a)** — single source of truth prevents future drift.

**2. Update the home `ContactSection` location grid:**
- Show the top 4 locations from the shared data (e.g. 2 offices + 2 factories, or all offices if 4).
- Use the real `role` and `since` values from Factory page.
- Add a "View all locations" link below the grid pointing to `/about/factory`.

**3. Fix the supporting copy** in `ContactSection`:
- "based in Hong Kong with offices and production facilities across Asia, Europe, and the Americas" → adjust to accurately reflect the actual Factory page footprint (likely Hong Kong HQ + Guangdong production, plus any real regional offices listed there).

## Questions before implementing

I need to confirm the exact office/factory entries currently on `/about/factory` so the home page matches. The summary I have shows the structure but not the full data. I'll read `Factory.tsx` during implementation and mirror its arrays exactly.

## Files to change
- `src/data/locations.ts` (new) — shared `offices` and `factories` arrays
- `src/pages/about/Factory.tsx` — import from shared module instead of inline arrays
- `src/components/home/ContactSection.tsx` — replace hardcoded `locations`, update copy, add link to `/about/factory`
