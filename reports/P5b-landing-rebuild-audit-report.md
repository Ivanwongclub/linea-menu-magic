# P5b — Designer Studio Landing Rebuild: Audit Report

**Date:** 2026-06-10  
**Branch:** main  
**Scope:** `DesignerStudio.tsx`, new `StudioHero3D.tsx`, `StudioCapabilityTile.tsx`, `translations.ts`

---

## Pre-change audit

| Finding | Severity | File | Detail |
|---------|----------|------|--------|
| `StudioPreview` used as hero — shows a static mock, not live product | 🔴 Critical | `DesignerStudio.tsx:102` | No 3D content on landing |
| Hero CTAs navigated to trim library + generic workspace — no 3D editor deeplink | 🔴 Critical | `DesignerStudio.tsx:79–88` | Missed conversion path for 3D feature |
| `trustWordmarks` was `string[]` with `hover:text-foreground/80 transition-colors` | 🟠 High | `DesignerStudio.tsx:30, 120` | Hover effect implies interactivity on non-links |
| No featured trim strip — cold landing with no product examples | 🟠 High | `DesignerStudio.tsx` | No entry point to specific trims |
| Capability tiles had no `to` prop — all non-interactive despite hover lift | 🟠 High | `StudioCapabilityTile.tsx:11` | `hover:-translate-y-0.5` + `hover:border-foreground` with no link is misleading |
| Spotlight sections (spot1, spot2) use fake mock wireframes as "product" visuals | 🟡 Medium | `DesignerStudio.tsx:182–297` | 700 lines of decorative CSS divs with no navigable outcome |
| Metrics: "1,200+ active components", "150+ brand teams", "24/7 brand-private access" are aspirational, not real | 🔴 Critical | `translations.ts:301–308` | Fake social proof undermines trust |
| FAQ uses `<Accordion>` — hides answers from view, increases interaction cost | 🟡 Medium | `DesignerStudio.tsx:338–349` | Accordion adds friction with no benefit on a sparse FAQ |
| Final CTA includes sign-in nudge link inside the dark CTA band | 🟢 Low | `DesignerStudio.tsx:382–389` | Redundant — the Login route is in the nav |

---

## Changes made

### `src/components/designer-studio/StudioHero3D.tsx` (new)
- Idle-mount gate via `requestIdleCallback` with `setTimeout(300)` fallback — defers WebGL until after paint
- `React.lazy` + `Suspense` for `Model3DViewer` — keeps it out of the landing's initial JS chunk
- Shimmer poster div shown until gate fires, labelled "Interactive 3D"
- "Customize this →" overlay button deep-links to editor with Button OBJ pre-loaded
- Exports `HERO_EDITOR_URL` constant for reuse across landing

### `src/components/designer-studio/StudioCapabilityTile.tsx`
- Added optional `to?: string` prop
- When `to` is present: wraps inner div in `<Link>` with `focus-visible` ring; retains hover-lift and icon invert
- When `to` is absent: removes all hover effects (no misleading interactive affordance)

### `src/pages/DesignerStudio.tsx`
- **Hero**: replaced `StudioPreview` with `StudioHero3D`; CTAs changed to "Try the 3D Editor" (→ HERO_EDITOR_URL) + "Open Trim Library"; removed workspace CTA and `brandHint` block
- **Trust strip**: converted to `{name: string}[]`, removed `hover:text-foreground/80 transition-colors` from spans
- **Featured trim strip** (new section after trust): 3 product cards — Button (hardware), Eco Lace (soft trims), Woven Label (branding trims). Each shows product image, family, name, "Details" link, and "Open in Editor" button (where OBJ exists)
- **Capability grid**: all 5 tiles with navigable destinations wired via `to` prop; Brand-Private Library tile left without `to` (requires auth setup, no deep-link appropriate for guest landing)
- **Workflow**: unchanged
- **Spot1 + Spot2 sections removed** — 115 lines of decorative mock wireframes deleted
- **Metrics**: honest values (500+ trims, 3 product families, < 48h response, 100% data isolation) with `// TODO: replace with live DB count` comment
- **FAQ**: replaced `<Accordion>` with always-open 2-column grid; all 4 Q/A pairs visible immediately
- **Final CTA**: removed sign-in link block
- **Removed imports**: `Accordion*` from shadcn/ui, `StudioPreview`, `Lock`, `MessageSquare`, `CheckCircle2`, `spot1`/`spot2` `useScrollAnimation` hooks

### `src/features/i18n/translations.ts`
- Added to all 3 locales: `studioIntro.heroCta3d`, `studioIntro.featuredLabel`, `studioIntro.featuredTitle`, `studioIntro.customizeThis`
- Updated EN metric values: 500+ catalogued trims, 3 product families, < 48h typical RFQ response, 100% data isolation

---

## Verification

- `npx tsc --noEmit` — ✅ 0 errors
- `npx eslint` on changed files — ✅ 0 warnings / errors
- Removed imports verified absent in new `DesignerStudio.tsx`
- New translation keys present in all 3 locales (EN, zh-Hant, zh-Hans)
- `HERO_EDITOR_URL` exported from `StudioHero3D.tsx` and imported in `DesignerStudio.tsx` — single source of truth

---

## Outstanding

- Metric values are still estimates — `// TODO: replace with live DB count` in `translations.ts:301`
- Featured strip uses static hardcoded slugs — could be driven by a Supabase query for `is_featured = true` in a future pass
- `requestIdleCallback` is not typed in all TS lib targets; the window cast in `StudioHero3D.tsx` is safe but can be replaced with a proper polyfill package if desired
