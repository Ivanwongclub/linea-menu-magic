

## Rename "E-Collections" → "E-Catalogue" across the public site

Surgical UI-copy rename. Internal code identifiers (routes, tables, file paths, props, component names like `Brochures`, `BrochureViewer`, `BrochuresPanel`) stay as-is to avoid breaking Supabase, bookmarks, embed links, and the admin workflow. Only **user-facing strings** change.

### Scope decision

- **Keep URL `/ecollections/...`** — changing it breaks every published embed iframe, shared link, and existing bookmarks. Backend tables/slugs unchanged.
- **Keep file & component names** (`Brochures.tsx`, `BrochureEditor.tsx`, `useBrochures`, etc.) — purely internal.
- **Rename only visible labels** wherever they appear to end users.

### Visible copy changes

| Location | Before | After |
|---|---|---|
| Header nav (desktop + mobile) | E-Collections | E-Catalogue |
| Footer link | E-Collections | E-Catalogue |
| Breadcrumb on `/ecollections` | E-Collections | E-Catalogue |
| Empty state on `/ecollections` | "No e-collections published yet" | "No catalogues published yet" |
| `Production.tsx` CTA | "View in E-Collections" | "View in E-Catalogue" |
| Admin dashboard tab + card | "Brochures", "Brochures & Content" | "E-Catalogue", "E-Catalogue & Content" |
| Admin editor headings/labels referring to "Brochure" in user-facing text within `BrochureEditor.tsx` / `BrochuresPanel.tsx` | "Brochure" | "Catalogue" (only visible strings — keep variable/prop names) |
| Page `<title>` / meta in `Brochures.tsx` if present | E-Collections | E-Catalogue |

### Files to change (UI-text only)

- `src/components/layout/Header.tsx` — `NAV_LINKS` label
- `src/components/header/Navigation.tsx` — `name: "E-Collections"`
- `src/components/layout/Footer.tsx` — link label
- `src/pages/Brochures.tsx` — breadcrumb, empty state, intro copy, any title
- `src/pages/Production.tsx` — "View in E-Collections" CTA
- `src/pages/DesignerStudioDashboard.tsx` — visible tab label "Brochures" → "E-Catalogue", card title "Brochures & Content" → "E-Catalogue & Content"
- `src/components/designer-studio/BrochureEditor.tsx` — visible headings/labels/toasts only
- `src/components/designer-studio/BrochuresPanel.tsx` — visible headings/empty states only

### Memory updates

- Update `mem://branding/ecollections-renaming` → reflect new term "E-Catalogue" (replaces both "Brochures" and "E-Collections" in user-facing copy).
- Update Core rule in `mem://index.md` from `Strictly use "E-Collections", never "Brochures"` → `Strictly use "E-Catalogue" in all user-facing copy. Internal code may keep "brochure"/"ecollections" identifiers for stability.`

### Intentionally NOT changing

- URL paths (`/ecollections`, `/ecollections/:slug`), embed iframe URLs, copy-link behavior.
- Supabase table names, columns, slugs.
- Component / hook / file names.
- Admin internal variable names (`editingBrochureId`, `BrochuresPanel`, etc.).
- Any logic, layout, styling, or routing.

