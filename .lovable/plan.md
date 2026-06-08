# Integrate OBJ Studio 3D Editor

## Approach

The uploaded `online3DEditor` is a self-contained vanilla JS app (Three.js via CDN import map, no build step). Per the project's pragmatism rule, the cleanest integration is to **drop it into `public/` and host it inside a React route via an `<iframe>`**, instead of rewriting ~940 lines into React/R3F.

The editor reads an optional `?model=<encoded-url>` query parameter on load — when present, it fetches and imports that OBJ automatically; otherwise it opens with a blank canvas.

## Changes

### 1. Vendor the editor under `public/3d-editor/`
- Copy `index.html`, `app.js`, `style.css`, `sample.obj` to `public/3d-editor/`.
- **Patch `index.html`**: remove the top brand bar text ("OBJ Studio — online 3D editor") so the iframe blends with the host page, OR keep but restyle minimally. Keep all controls.
- **Patch `app.js`** (small additions, ~30 lines near the file-load section):
  - On startup, read `new URLSearchParams(location.search).get('model')` and, if set, `fetch()` the OBJ, parse it through the existing OBJLoader, and add to the scene using the same code path as drag-and-drop import.
  - Also read `?name=<label>` to use as the object name in the outliner.
  - Add a `postMessage({type:'editor-ready'})` to the parent window when loaded (for future hooks; harmless if no parent listens).

### 2. New React route `/designer-studio/editor`
- New file `src/pages/DesignerStudioEditor.tsx`:
  - Pulls `model` and `name` from `useSearchParams`.
  - Renders a full-viewport `<iframe src={`/3d-editor/index.html?model=...&name=...`} />` (no `model` param → blank canvas).
  - Layout: page header strip with breadcrumb back to Trim Library + product name; iframe fills remaining height (`h-[calc(100vh-Xpx)]`).
  - Iframe attributes: `allow="fullscreen"`, `sandbox="allow-scripts allow-same-origin allow-downloads"`.
- Register the route in `src/App.tsx` (lazy-loaded, alongside the other `designer-studio/*` routes).

### 3. Entry points

**From Trim Library** (`src/pages/DesignerStudioTrimLibrary.tsx`):
- Change the existing "Enter Studio" button (line ~75) so it links to `/designer-studio/editor` (blank canvas) instead of `/designer-studio/dashboard?tab=library`. Keep label as "Enter Studio".
- *(Or, if "Enter Studio" should still go to the dashboard, add a second button "Open 3D Editor" pointing to `/designer-studio/editor`.)* — I'll go with replacing, since the user phrased it as the entry point. Confirm if you'd prefer a second button.

**From Product Detail** (`src/pages/ProductDetail.tsx`, around line 535–550):
- Inside the existing action grid that already conditionally shows "View 3D Model" when `product.model_url` is set, add a fourth button **"Open in Editor"** (icon: `Pencil` or `Edit3` from lucide).
- `onClick` navigates to `/designer-studio/editor?model=${encodeURIComponent(product.model_url)}&name=${encodeURIComponent(product.item_code)}`.
- Adjust the grid column count (`grid-cols-3` → `grid-cols-4`) when `model_url` exists.

### 4. Styling touch-ups inside the editor (optional, light)
- Override the editor's dark background and accent color in `public/3d-editor/style.css` to align with the site's monochrome palette (off-white background, black accents, `rounded-none`). Keep this minimal — full restyle is out of scope; only the top bar and buttons.

## Files touched

- `public/3d-editor/index.html` (new, copied + patched)
- `public/3d-editor/app.js` (new, copied + ~30-line patch for `?model=` autoload)
- `public/3d-editor/style.css` (new, copied + small palette overrides)
- `public/3d-editor/sample.obj` (new, copied)
- `src/pages/DesignerStudioEditor.tsx` (new, ~50 lines)
- `src/App.tsx` (add lazy route)
- `src/pages/DesignerStudioTrimLibrary.tsx` (rewire "Enter Studio" CTA)
- `src/pages/ProductDetail.tsx` (add "Open in Editor" button in action grid)

## Technical notes

- The editor uses an ES-module import map pointing at `cdn.jsdelivr.net` for `three@0.160`. This continues to work inside an iframe served from the same origin. No bundler interaction; Vite leaves `public/` files untouched.
- No changes to the existing React `Model3DViewer` / `OBJModelLoader` (they remain the lightweight read-only viewer used on the PDP "View 3D Model" modal). The new editor is the editable counterpart.
- No backend/database changes. Saving edits back to the catalog is out of scope; this PR is read-in only. Export-to-OBJ download already works inside the editor.

## Open question

Should the Trim Library's existing **"Enter Studio"** button be **replaced** to point at the new editor, or should I **add a second** button (e.g. "Open 3D Editor") and keep "Enter Studio" pointing at the dashboard? The plan above assumes replacement — confirm before I build.
