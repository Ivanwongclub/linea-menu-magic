

## Prompt 2 — Types, Updated Mock Data, and Custom Hook

### Files to Create/Edit

| File | Action |
|------|--------|
| `src/types/flipbook.ts` | **Create** — HotLink, Page, Brochure interfaces |
| `src/data/brochures.ts` | **Edit** — Update mock data to use new typed Page[] with HotLinks on page 1 of first brochure |
| `src/hooks/useBrochure.ts` | **Create** — `useBrochure(id)` hook returning `{ brochure, loading, error }` |
| `src/pages/PortfolioViewer.tsx` | **Edit** — Switch from direct data lookup to `useBrochure` hook |
| `src/pages/Portfolio.tsx` | **Edit** — Update import to use new Brochure type from `src/types/flipbook.ts` |

### Details

**1. `src/types/flipbook.ts`**
```ts
interface HotLink { id, x, y, width, height, url, label } // x/y/width/height as 0-100 percentages
interface Page { id, pageNumber, imageUrl, links?: HotLink[] }
interface Brochure { id, title, description, coverImage, pages: Page[] }
```

**2. `src/data/brochures.ts`**
- Remove the old `Brochure` interface (now in types file).
- Convert `pages` from `string[]` to `Page[]` — each page gets an `id`, `pageNumber`, and `imageUrl`.
- Add 2–3 HotLink objects on page 1 of the first brochure with `x/y/width/height` as percentages, `url: "#"`, `label: "Learn more"`.

**3. `src/hooks/useBrochure.ts`**
- Simulates async loading with a brief `useState`/`useEffect` pattern.
- Returns `{ brochure: Brochure | null, loading: boolean, error: string | null }`.
- Finds brochure by id from mock data; sets error if not found.

**4. `src/pages/PortfolioViewer.tsx`**
- Replace direct `brochures.find()` with `useBrochure(id)` hook, handle loading/error states.

