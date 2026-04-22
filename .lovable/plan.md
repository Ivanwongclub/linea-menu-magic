

## Enhance `/designer-studio` page — visual richness & content depth

Transform the current text-heavy 3-section layout into a cinematic, content-rich landing experience that showcases the studio's capabilities through visual previews, real workflow imagery, metrics, and a guided tour — while keeping the strict monochrome / sharp-edge / Poppins design system.

### New page structure (top to bottom)

1. **Hero (rebuilt)** — full-bleed split with live `StudioPreview` mock on the right
   - Eyebrow + large headline + subtitle + dual CTAs (left column).
   - Right column: existing `StudioPreview.tsx` component (already in repo, currently unused) — gives an immediate visual of the workspace instead of three plain text cards.
   - Brand hint pill when authenticated.

2. **Trust strip** — thin band of brand/industry credibility
   - "Trusted by design teams at" + 5 monochrome wordmark placeholders (Polo Ralph Lauren, etc.) in a subtle row.
   - Anchors credibility right after the hero.

3. **Capability grid (replaces the 3 plain cards)** — 6 feature tiles, 3×2 grid
   - Each tile: Lucide icon, short title, 1-line body, hover lift.
   - Capabilities: Component Library · Visual Composer · 3D OBJ Preview · E-Catalogue Hotlinks · RFQ Workflow · Brand-Private Library.

4. **Workflow walkthrough (upgraded "flow" section)** — horizontal 4-step rail with mini visuals
   - Steps: Discover → Compose → Present → Quote.
   - Each step: numbered chip, title, 1-sentence body, tiny mock thumbnail (CSS-only block matching `StudioPreview` style).
   - Connecting hairline between steps on desktop; stacked vertical on mobile.

5. **Feature spotlight band** — alternating image/text rows (2 rows)
   - Row A (text-left / visual-right): "Concept boards your sourcing team can act on" — visual = composer mock card.
   - Row B (visual-left / text-right): "Private brand library, gated by RLS" — visual = lock + brand-tag mock.
   - Reuses CSS-only mock blocks; no new images required.

6. **Metrics strip** — 4 stat cells on a light band
   - e.g. "1,200+ active components", "24/7 brand-private workspaces", "< 48h RFQ response", "150+ brand teams onboarded".
   - Large numbers, tiny labels, divider lines between cells.

7. **Inline FAQ** — 4 accordion items using existing `Accordion` UI component
   - "Who can access the private library?" · "How does pricing work?" · "Can I embed E-Catalogues?" · "Do you support 3D OBJ uploads?".

8. **Final CTA (kept, polished)** — inverse band with 2 CTAs
   - Slightly tightened copy; add tiny "or sign in to your brand workspace" link.

### Design conventions (carry-over)

- Strict monochrome, `rounded-none`, Poppins, sharp 1px borders.
- Section framework: light → off-white → light → inverse pattern across bands.
- Lucide icons only (no emoji).
- Animations: respect existing exponential-ease scroll reveal hook (`use-scroll-animation`) on each new section.
- Max-width `7xl` container baseline (per alignment rule).
- All copy added to `studioIntro.*` keys in `src/features/i18n/translations.ts` (English only).

### Files

- `src/pages/DesignerStudio.tsx` — rewrite layout to 8 sections above; import existing `StudioPreview`.
- `src/features/i18n/translations.ts` — add new keys: capability tiles (6), workflow steps (4×2), spotlight rows (2×2), metrics (4×2), faq (4×2), trust label, plus minor copy refinements. Keep existing keys for backward compat.
- (Optional) `src/components/designer-studio/StudioCapabilityTile.tsx` — small presentational tile component to keep the page file readable.
- (Optional) `src/components/designer-studio/StudioWorkflowRail.tsx` — the 4-step horizontal rail.

### Out of scope

- No changes to auth, routes, RLS, or `/designer-studio/dashboard`.
- No real logo assets fetched — trust strip uses styled text wordmarks only.
- No new images uploaded; visual richness comes from CSS mocks + existing `StudioPreview`.
- No changes to mobile menu, header, or other pages.

