

## FlipBook Viewer — Portfolio Page Plan

### Summary
Add a new **Portfolio** section to the site with two routes: `/portfolio` (brochure grid landing) and `/portfolio/view/:id` (flipbook viewer). This is prompt 1 of 13 — setting up the foundation with mock data, landing grid, and routing. The flipbook viewer page will be a placeholder for now (prompts 2+ will build the actual flip mechanics).

### What Gets Built

**1. Mock Data — `src/data/brochures.ts`**
- Export array of 3 brochures, each with `id`, `title`, `description`, `coverImage` (placeholder.pics), and `pages` array of 10 image URLs (picsum.photos with different seeds).

**2. Portfolio Landing Page — `src/pages/Portfolio.tsx`**
- Uses existing `Header` + `Footer` layout (consistent with News, Products pages).
- Breadcrumb: Home / Portfolio.
- Hero section with title "Portfolio" and subtitle.
- Responsive grid (1/2/3 cols) of brochure cards showing cover image, title, description, and a "Read Now" button linking to `/portfolio/view/:id`.
- Card styling: subtle hover shadow/lift effect, consistent with site's design system (rounded corners, clean typography).
- Background uses the site's existing `--background` (not the dark charcoal from the prompt, since this lives within the existing site shell).

**3. FlipBook Viewer Page — `src/pages/PortfolioViewer.tsx`**
- Dark charcoal (`#1a1a2e`) background for an immersive reading experience.
- Reads `:id` from URL params, finds brochure from mock data.
- For prompt 1: displays the brochure title and a simple image gallery/placeholder. The actual flipbook interaction will come in later prompts.
- Back link to `/portfolio`.

**4. Routing — `src/App.tsx`**
- Add two routes: `/portfolio` and `/portfolio/view/:id`.

**5. Navigation Update — `src/components/layout/Header.tsx`**
- Add "Portfolio" link to the nav menu.

### Clarification Note
The prompt says to use a dark charcoal background for the whole app and Inter font. Since this integrates into an existing site with its own design system (Poppins font, light background), I'll apply the dark background **only to the flipbook viewer page** (immersive reading mode) while keeping the Portfolio landing page consistent with the rest of the site. This avoids visual conflict. The viewer page will use the site's existing font stack rather than switching to Inter.

### Files to Create/Edit
| File | Action |
|------|--------|
| `src/data/brochures.ts` | Create — mock brochure data |
| `src/pages/Portfolio.tsx` | Create — landing grid page |
| `src/pages/PortfolioViewer.tsx` | Create — viewer page (dark bg) |
| `src/App.tsx` | Edit — add 2 routes |
| `src/components/layout/Header.tsx` | Edit — add Portfolio nav link |

