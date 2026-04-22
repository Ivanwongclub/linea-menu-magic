

## Revamp: Section 03 — "Service & Delivery" → "Service & Customization"

Reframe the third workflow step from a logistics blurb into a **customer-service & customization promise**, aligned with competitor positioning ("from idea to finished trim … in-house design team … customization"), while keeping the existing two-column workflow layout intact.

### Competitor positioning takeaways
- One continuous narrative: **idea → design → in-house production → finished trim**
- Emphasis on **in-house creative team** and **stylish trimming solutions**
- **Customization** as a headline service (not buried)
- Cost-effective + fashion-forward as twin value props

### Proposed new content (Section 03)

| Field | New value |
|---|---|
| number | `03` (unchanged) |
| title | **Service & Customization** |
| body | "From first sketch to finished trim. Our in-house design team partners with brands to develop bespoke hardware, components and finishes — combining cost-effective vertically integrated production with a fashion-forward perspective. Local offices in key markets keep every project moving, from sample to bulk." |
| bullets | • Bespoke Design Service<br>• In-House Creative Team<br>• Regional Office Support<br>• Sample-to-Bulk Continuity |
| CTA | **"Start a Custom Project"** → `/designer-studio` (existing arrow style, label refined) |

### Layout changes
- **No structural changes** to the two-column workflow component — keeps the existing alternating left/right rhythm, oversized `03` watermark, image, headline, body, bullets, CTA.
- Bullets list expands from 2 → 4 items (the existing `space-y-2` `<ul>` already handles this cleanly).
- CTA label changes from "Custom via Designer Studio" to "Start a Custom Project" — clearer call-to-action verb, drops internal product name from public copy.

### Optional polish (low risk, recommended)
- Swap `valuePartnershipImg` for a more "creative atelier / design-in-progress" image if one exists in `src/assets/`. I'll grep for candidates and propose 1–2 options before swapping; if nothing fits, keep current image.

### Files to change
- `src/pages/Production.tsx` — update the `workflowSteps[2]` object (`title`, `body`, `bullets`, CTA label on line 298). Roughly 6 lines edited, no new components, no new imports.

### Intentionally NOT changing
- Section 01, 02, materials, sustainability, hero, modals.
- Workflow row layout, animations, image aspect ratio.
- Routing — CTA still points at `/designer-studio`.
- Adding new icons or sub-sections (keeps diff minimal and consistent with site's restrained editorial tone).

