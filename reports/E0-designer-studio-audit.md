# E0 — Designer Studio Audit

Audit of the existing Designer Studio against `docs/3d-editor/*.md`. Precedence used throughout: `wincyc-designer-studio-architecture.md` governs; `wincyc-3d-editor-v3-review.md` wins on UX; `web_based_obj_editor_capabilities_summary_v3.md` wins on technique. `wincyc-3d-editor-axis-design.md` and `wincyc-finish-taxonomy.md` are read as the source for the finish/axis facts in §6.

---

## 1. Inventory

### Routes (`src/App.tsx`)

| Path | Component | Lazy | Guard |
|---|---|---|---|
| `/designer-studio` | `DesignerStudio` (`src/pages/DesignerStudio.tsx`) | yes | none |
| `/designer-studio/trim-library` | `DesignerStudioTrimLibrary` | yes | none |
| `/designer-studio/login` | `DesignerStudioLogin` | yes | none |
| `/designer-studio/editor` | `DesignerStudioEditor` | yes | none (anon-friendly) |
| `/designer-studio/products/:slug` | `ProductDetail` (shared with public catalogue) | yes | none |
| `/designer-studio/workspace` | `DesignerStudioWorkspace` | yes | `RequireBrandAuth` |
| `/designer-studio/dashboard` | `WorkspaceRedirect` → `/designer-studio/workspace` | n/a | none (legacy alias) |
| `/designer-studio/compose/:sessionId` | `ComposerPage` (`src/features/designer/pages/ComposerPage.tsx`) | yes | `RequireBrandAuth` |
| `/designer-studio/present/:sessionId` | `PresentationPage` | yes | `RequireBrandAuth` |

### Pages (`src/pages/DesignerStudio*.tsx`)

- `DesignerStudio.tsx` — public landing/marketing page for the studio; embeds `StudioHero3D`.
- `DesignerStudioLogin.tsx` — brand-member sign-in, uses `useAuth`.
- `DesignerStudioTrimLibrary.tsx` — public trim/product browsing surface, uses `useAuth` for personalization only.
- `DesignerStudioEditor.tsx` — **the current "3D editor" route.** Wraps `public/3d-editor/index.html` in an `<iframe>` (`src="/3d-editor/index.html?…"`), passes `model`/`name`/`color` via query string and `postMessage`. Writes to `editor_sessions` (insert on model load, `DesignerStudioEditor.tsx:34-44`) and reads it for a session-history dropdown (`DesignerStudioEditor.tsx:48-60`).
- `DesignerStudioWorkspace.tsx` — brand-gated staff/customer workspace shell; hosts library, products (CMS) and brochures panels; writes `design_layers` directly in one path (`DesignerStudioWorkspace.tsx:295`).

### Components (`src/components/designer-studio/`)

- `Model3DViewer.tsx` — R3F `<Canvas>` viewer; demo hard-coded button/zipper/hardware meshes, or an uploaded OBJ via `OBJModelLoader`. No table access.
- `OBJModelLoader.tsx` — loads an OBJ via `OBJLoader`, applies one fixed `MeshStandardMaterial`, normalizes scale. No table access.
- `StudioHero3D.tsx` — marketing hero; lazy-mounts `Model3DViewer` with `/models/Polo_Button_10.8.obj`; links to `/designer-studio/editor?model=…` (the iframe route). No table access.
- `SearchProductDialog.tsx` — search `products`, insert into `user_library_items` (add-to-library).
- `CompositionPickerDialog.tsx` — reads/writes `design_layers` (adds a product image as a composer layer).
- `LibraryItemCard.tsx`, `LibraryTable.tsx` — presentational, render `UserLibraryItem` props from `useUserLibrary`.
- `HotlinkEditorModal.tsx`, `ProductQuickView.tsx`, `StudioCapabilityTile.tsx`, `StudioWorkflowRail.tsx`, `WorkflowTimeline.tsx` — presentational, no direct table access.
- `BrochureEditor.tsx` — reads/writes `flipbook_brochures`.
- `BrochuresPanel.tsx`, `PageManager.tsx` — `flipbook_pages`, via `useFlipbook`/`usePages` hooks.
- `CreateRFQDialog.tsx`, `QuickRFQDialog.tsx`, `RFQDetail.tsx`, `RFQList.tsx` — **dead code.** No `.from()` calls of their own; the RFQ tab that hosted them is quarantined (`DesignerStudioWorkspace.tsx:42-43,65,81`: "RFQ tab quarantined in P14 — mock RFQ surface is hidden"). Not reachable from any live route.
- `products/ProductCatalogTab.tsx`, `ProductEditor.tsx`, `ImportTab.tsx`, `TaxonomyTab.tsx`, `ProductsPanel.tsx` — full catalogue CMS embedded in the workspace: `products`, `product_images`, `product_category_map`, `product_material_map`, `product_tag_map`, `product_industry_map`, `product_certification_map`, `product_categories`, `product_tags`, `product_materials`, `product_industries`, `product_certifications`, `storage.product-assets`. Unrelated to the 3D editor question.

### Hooks/pages (`src/features/designer/`)

- `hooks/useDesignSession.ts`, `hooks/useDesignSessions.ts` — CRUD over `design_sessions` + `design_layers` (single session / session list).
- `hooks/useDesignExports.ts` — CRUD over `design_exports`.
- `pages/ComposerPage.tsx` — the 2D brochure composer; reads/writes `design_sessions`, `design_layers`.
- `pages/PresentationPage.tsx` — read-only render of a composer session.
- `components/ComposerCanvas.tsx`, `ComposerToolbar.tsx`, `ComposerSessionList.tsx`, `LayerPanel.tsx`, `ProductPickerSheet.tsx`, `TemplatePickerDialog.tsx` — composer UI, no direct table access except `ComposerSessionList.tsx` (`design_sessions`, `design_layers`).
- `types.ts` — shared composer types, no table access.

### `src/features/auth/` pieces actually used by Designer Studio

- `AuthProvider` / `useAuth` — imported by `DesignerStudio.tsx`, `DesignerStudioLogin.tsx`, `DesignerStudioTrimLibrary.tsx`, `DesignerStudioWorkspace.tsx`.
- `RequireBrandAuth` — route guard, wraps `workspace`, `compose/:sessionId`, `present/:sessionId` in `App.tsx:249-264`.

### `public/3d-editor/` — separate vanilla three.js app

Not part of the React/Vite build. A static, hand-written app served as a plain asset directory and embedded via `<iframe>`:

- `index.html` — its own document; pins three.js via an **import map to a CDN**, not the repo's npm dependency: `"three": "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"` (`index.html:228-235`). This is a second, independent copy of three.js (r160.0) alongside the app's own npm `three@0.160.1`.
- `app.js` (1194 lines) — imports `OrbitControls`, `TransformControls`, `OBJLoader`, `OBJExporter` from `three/addons/`. Capabilities: import `.obj` (multi-file), add a cube primitive, transform (move/rotate/scale) via `TransformControls`, delete, clear, export `.obj`, a scene outliner list, basic image import. One shared `MeshStandardMaterial` (`app.js:85-87`, color `0x8a8f98`, metalness 0.1, roughness 0.7) applied to any mesh missing a material.
- `style.css`, `sample.obj` — static assets.
- No text/font tooling, no emboss/deboss, no CSG, no BVH, no Web Workers, no finish binding. It signals readiness to its parent via `postMessage({type:'editor-ready'})` and accepts `set-language`/`set-material-color` messages (`app.js:1187-1193`; consumed by `DesignerStudioEditor.tsx:65-71`).
- Only entry point into it from the React app: the iframe in `DesignerStudioEditor.tsx`.

---

## 2. Survive / retire / rewrite

Judged against architecture Part 2 (route structure — `/designer-studio`, `/designer-studio/library`, `/designer-studio/composer` as *existing*, `/designer-studio/editor/:designId` and `/designer-studio/designs` as *NEW*) and v3-review §11 (17-item MVP; ruling #6, buyers never see a scene tree).

| Item | Verdict | Replacement |
|---|---|---|
| `/designer-studio` (landing) | **SURVIVE** | — |
| `/designer-studio/trim-library` | **SURVIVE** | — (maps to architecture's "existing trim library"; path differs from the doc's proposed `/designer-studio/library` — naming only) |
| `/designer-studio/login` | **SURVIVE** | — |
| `/designer-studio/workspace`, `/dashboard` | **SURVIVE** | — (architecture's "existing workspace") |
| `/designer-studio/compose/:sessionId`, `/present/:sessionId` | **SURVIVE** | — (architecture's "existing 2D brochure composer"; Part 9 decision 7: "leave it untouched") |
| `/designer-studio/products/:slug` | **SURVIVE** | — |
| **`/designer-studio/editor`** (current iframe route) | **RETIRE** | Replaced by the NEW `/designer-studio/editor/:designId` (React Three Fiber editor, architecture Part 2). **Path collision to resolve**: the new route is a sibling under the same `/designer-studio/editor` prefix but with a required `:designId` param the current route doesn't have — the old bare `/designer-studio/editor?model=…&…` query-string contract (linked from `StudioHero3D.tsx:14`) has no `:designId` and must either redirect into a "start a new anonymous design" flow or be renamed. |
| `public/3d-editor/` (vanilla iframe app) | **RETIRE** | Replaced entirely by the R3F editor built per capabilities-summary technique + v3-review UX rulings. No part of it (no CSG, no text tool, separate three.js CDN copy) survives; it is pre-React tech debt, not a component to extend. |
| `editor_sessions` table | **RETIRE** | Replaced by `designs` + `design_versions` (architecture Part 3). `editor_sessions` only records `user_id, product_slug, product_name, model_url, created_at` — a crude "last opened" log; `designs`/`design_versions` supersede it with real ownership, brand scoping, autosave and versioning. |
| `Model3DViewer.tsx` | **REWRITE** (partial survive) | Its R3F/Canvas/`OrbitControls`/`Environment` scaffolding is close to what Part 7 wants, but its demo meshes and hard-coded `MeshStandardMaterial` must be replaced by finish-driven `MeshPhysicalMaterial` (axis-design §4) and a fixed self-hosted studio HDRI (see §5, §8). |
| `OBJModelLoader.tsx` | **REWRITE** (partial survive) | OBJ-load-and-normalize logic is reusable; its fixed material must be replaced by the finish record's derived params. |
| `StudioHero3D.tsx` | **SURVIVE**, link target changes | Keeps its role as marketing hero once its CTA points at the new `/designer-studio/editor/:designId` (catalogue entry point, axis-design §5). |
| Scene-tree / outliner UI in `public/3d-editor/app.js` | **RETIRE for the catalogue path** | Per v3-review ruling #6 and axis-design §5: buyers starting from the catalogue never see a scene tree; a rebuilt outliner only survives (as a NEW component) for the upload path (WIN-CYC staff / prospects with their own OBJ), which is v3-review MVP item outside the 17-item cut and architecture Phase 11. |
| Composer's `design_sessions`/`design_layers`/`design_exports` and their hooks | **SURVIVE** | Architecture Part 3 explicitly leaves these alone; they serve the 2D composer, not the 3D editor. |
| `customization_requests` table, RFQ components | **RETIRE (already dead)** | Not part of the 3D editor question; flagged here because it sits in the same admin-hardening migration set and has zero live callers today (see §3). No architecture-doc replacement is implied; this is pre-existing dead weight, not something E0 needs to plan around. |
| Catalogue CMS panels under `components/designer-studio/products/` | **SURVIVE** | Untouched by the architecture doc; separate concern (product catalogue authoring, not the 3D configurator). |

---

## 3. Schema

### The 5 proposed tables vs. the 6 existing ones

No name collisions: `designs`, `design_versions`, `design_assets`, `design_shares`, `design_quotes` (proposed) do not match `design_sessions`, `design_layers`, `design_exports`, `editor_sessions`, `customization_requests`, `user_library_items` (existing) — closest near-miss is `design_sessions`/`design_versions`/`design_assets` sharing the `design_` prefix with `design_sessions`/`design_layers`/`design_exports`, which is a naming-convention echo, not a collision. Architecture Part 3 is explicit that the existing three are left alone for this reason.

### Existing tables

**`design_sessions`** (`supabase/migrations/20260317180514_…:3-15`) — `id uuid pk`, `team_id text not null`, `name`, `background_image_*`, `thumbnail_url`, `status`, `created_by uuid`, timestamps. No FK on `team_id` (stored as free text, see tenancy below).

**`design_layers`** (`…:27-44`) — `id uuid pk`, `session_id uuid references design_sessions(id) on delete cascade`, `product_id uuid references products(id) on delete set null`, layout fields (`x,y,scale,rotation,opacity,flip_x,flip_y,is_visible,is_locked`), `layer_order`.

**`design_exports`** (`…:52-58`) — `id uuid pk`, `session_id uuid references design_sessions(id) on delete cascade`, `export_url`, `export_type`.

**`editor_sessions`** (`supabase/migrations/20260608111030_…:1-8`) — `id uuid pk`, `user_id uuid references auth.users(id) on delete cascade`, `product_slug`, `product_name not null`, `model_url not null`, `created_at`. Anonymous-writable (`GRANT INSERT … TO anon`, `…:10`).

**`customization_requests`** (`supabase/migrations/20260316105420_…:267-283`) — `id uuid pk`, `product_id → products`, `user_id → auth.users`, `team_id text`, `quantity`, `target_price`, `status public.customization_status enum`, etc. Schema-only: comment at `…:251-253` says "CUSTOMIZATION REQUESTS (schema only)", and no live code writes or reads it (§ live-write check below).

**`user_library_items`** (`…:218-231`) — `id uuid pk`, `product_id → products`, `user_id → auth.users`, `team_id text`, `custom_brand`, `custom_specs jsonb`, `notes`, `is_favorite`.

### Tenancy: `team_id` is a brand id

Confirmed. `team_id` is stored as `text`, but it is compared against `brand_memberships.brand_id::text` through a dedicated helper:

```sql
-- supabase/migrations/20260423090500_…:6-17
create or replace function public.user_has_brand_text(_user_id uuid, _brand_text text)
returns boolean … as $$
  select exists (
    select 1 from public.brand_memberships
    where user_id = _user_id and brand_id::text = _brand_text
  );
$$;
```
used by every `design_sessions`/`design_layers` RLS policy (`…:33-56` etc). So `team_id` **is** a brand id in practice, just typed as text instead of `uuid references brands(id)` — a looser version of the `brand_id` column the architecture doc's proposed tables use directly. `user_library_items.team_id` and `customization_requests.team_id` are the same pattern but are **not** wrapped in any RLS helper — their policies gate on `user_id = auth.uid()` only (`…:235-243`, `…:286-293`), so `team_id` there is unenforced free text.

### FK targets exist

`products` (`supabase/migrations/20260316105420_…:75`), `brands` (`supabase/migrations/20260422182607_…:2-8`), `auth.users` (built-in, referenced throughout), `finishes` (`supabase/migrations/20260903130000_…`, used by `product_finishes`), `product_size_variants` (`supabase/migrations/20260903130000_…:349-360`) — all present. `design_assets` (a proposed table) has no existing analogue to FK against; it would be new.

### Reusable helper functions

| Function | Location | Signature | Checks |
|---|---|---|---|
| `user_has_brand` | `supabase/migrations/20260422182607_…:38-45` | `(_user_id uuid, _brand_id uuid) returns boolean` | Membership in `brand_memberships` by uuid `brand_id` — exact shape the architecture Part 4 RLS example calls for. |
| `user_has_brand_text` | `supabase/migrations/20260423090500_…:6-17` | `(_user_id uuid, _brand_text text) returns boolean` | Same, for the legacy `text`-typed `team_id` columns. Not needed for new tables if they use `brand_id uuid` per the proposal. |
| `user_is_catalogue_editor` | `supabase/migrations/20260903120000_…:45-57` | `(_user_id uuid) returns boolean` | Membership in `catalogue_editors`. Architecture Part 4 is explicit this must **not** imply design access — reuse for catalogue RLS only. |
| `user_is_brand_manager_or_owner` | `supabase/migrations/20260615120000_…:22-37` | `(_user_id uuid) returns boolean` | `role in ('manager','owner')` in `brand_memberships`, evaluated globally (no brand param) — close to but not the same shape as the "manager/owner of *this* brand" check `design_shares`/`design_quotes` approval flows would want; would need a brand-scoped variant. |
| `user_is_designer_staff` (named in architecture Part 4) | **does not exist** | — | Gap — see §8. |

### Live write paths (six existing tables)

| Table | Live writes | Live reads only |
|---|---|---|
| `design_sessions` | `ComposerPage.tsx:259` (update), `useDesignSessions.ts:78,96,117,129` (insert/update/delete) | `useDesignSession.ts:16`, `ComposerSessionList.tsx:86`, `ComposerPage.tsx:208,218`, `useDesignSessions.ts:8,20,38` |
| `design_layers` | `useDesignSession.ts:69,79,89`, `ComposerSessionList.tsx:47`, `useDesignSessions.ts:63`, `CompositionPickerDialog.tsx:59`, `DesignerStudioWorkspace.tsx:295` (all insert/update) | `useDesignSession.ts:24,58`, `useDesignSessions.ts:53`, `ComposerPage.tsx:63`, `CompositionPickerDialog.tsx:52` |
| `design_exports` | none found | `useDesignExports.ts:14,26` |
| `editor_sessions` | `DesignerStudioEditor.tsx:34-41` (insert) | `DesignerStudioEditor.tsx:51-56` (select) |
| `customization_requests` | **none** | **none** — dead table |
| `user_library_items` | `SearchProductDialog.tsx:71` (insert), `useUserLibrary.ts:165,182` (update/delete) | `useUserLibrary.ts:31`, `ProductDetail.tsx:192,202` |

---

## 4. Reuse

| Item | File | What it is | Admin coupling | Classification |
|---|---|---|---|---|
| `FinishPicker` | `src/components/admin/finish/FinishPicker.tsx` | CMS tool to **attach/detach finishes to a product's catalogue record** (rail + grid + attached list). | None in imports (no admin-auth guard), but its behavior is CMS-shaped: `toggle()` (`FinishPicker.tsx:52-58`) calls `attach.mutate(...)`/`detach.mutate(...)` which **write directly to `product_finishes`** (`useProductFinishes.ts:43-44`, insert; `:59-73`, delete). **Selecting a finish mutates the database immediately** — this is catalogue-editing behavior, not buyer preview-selection, and is the wrong click semantic to reuse verbatim for a buyer picking a finish to render. | Needs extraction: keep it for the CMS "which finishes can this product take" surface; the 3D editor needs a sibling selector built from the same rail/grid but with local-state (non-mutating) selection — see `ProductColourFinish.tsx` below for the correct pattern already in the codebase. |
| `FinishFacetRail` | `src/components/admin/finish/FinishFacetRail.tsx` | Presentational filter rail over the 8 axes. | None — props-only (`axes, selected, onToggle, onClear, countFor`). | Reusable as-is. |
| `FinishSwatchGrid` | `src/components/admin/finish/FinishSwatchGrid.tsx` | Presentational swatch grid. | None — props-only. | Reusable as-is. |
| `useFinishFilter` | `src/features/admin/hooks/useFinishFilter.ts` | Faceted search (OR within axis, AND across axes) over a finish list; supports controlled or local selection state — already used by both the CMS picker and the public listing's finish-facet rail. | None — pure client-side filter over data passed in. | Reusable as-is (already proven reused across two surfaces). |
| `useFinishes` | `src/features/admin/hooks/useFinishes.ts` | React Query hook reading the `finishes` table + `FINISH_AXES` config + `useFinishAxes` (axis value lists). | None — plain `supabase.from(...)` read, no auth gate. | Reusable as-is. Lives under `features/admin/` for historical reasons only; not functionally admin-scoped. |
| `useProductFinishFacets` | `src/features/products/hooks/useProductFinishFacets.ts` | Already the public/buyer-facing consumer: computes which finishes are attached to *visible, public, metal* products, drives the public catalogue's finish-facet rail via `useFinishFilter`. | None — explicitly built for "the public listing" (comment at `:33-37`). | Reusable as-is; closest existing precedent for how the 3D editor should query "finishes valid for this product." |
| `FinishSwatch` | `src/features/finishes/FinishSwatch.tsx` | Renders one swatch from `hex_approx/metalness/roughness/anisotropy/swatch_url`. | None. | Reusable as-is. |
| `product_finishes` | `supabase/migrations/20260903130000_…:321-330` | Join table `product_id, finish_id, sort_order`, PK on the pair; `trg_product_finishes_requires_metal` trigger enforces the metal gate at insert/update. | — | Existing, correct FK target for "finishes valid for this product." |
| `product_size_variants` | `…:349-363` | `product_id, size_primary_mm, size_secondary_mm, size_label, size_ligne` (generated from mm), `weight_g, thickness_mm, is_default`. | — | Matches axis-design §7's "Size ○ 15mm (24L) ● 20mm (31.5L)" requirement directly; `size_ligne` is already a generated column, no client math needed. |
| `is_metal` gate | DB: `check_finish_requires_metal_material()` trigger on `product_finishes` (`…:328-330`). Client mirror: `isMetalProduct()`, `src/features/products/utils/productMaterial.ts:23-25` (`product.material?.is_metal === true`). | — | — | Both layers exist and agree; reusable as-is. |
| `Model3DViewer` | `src/components/designer-studio/Model3DViewer.tsx` | R3F Canvas, `OrbitControls`, `Environment`, demo meshes or an uploaded OBJ. | None (public component). | Viewer-only: no finish binding, hard-coded `MeshStandardMaterial` (`ButtonModel` etc., e.g. `Model3DViewer.tsx:27-31`), `Environment preset="studio"/"night"` fetched from a third-party CDN (see §5, §8). Scaffolding reusable; material/env need rework. |
| `OBJModelLoader` | `src/components/designer-studio/OBJModelLoader.tsx` | Loads + normalizes an OBJ, applies one `MeshStandardMaterial`. | None. | Viewer-only, same caveat — material is hard-coded (`OBJModelLoader.tsx:23-27`), not finish-driven. |
| `StudioHero3D` | `src/components/designer-studio/StudioHero3D.tsx` | Marketing wrapper around `Model3DViewer`, links to the editor. | None. | Viewer-only; survives as a shell once its material path and CTA target are updated. |

The correct **non-mutating selection pattern** already exists in the codebase and should be the model for the editor's finish picker, not `FinishPicker`: `src/components/product/ProductColourFinish.tsx` gates on `isMetalProduct()`, renders `product.finishes` as `FinishSwatch` buttons, and `onClick={() => setFinishId(f.id)}` (`ProductColourFinish.tsx:52`) — **pure local state, no database write.**

---

## 5. Three.js state

**Versions** (`package.json`): `three@^0.160.1`, `@react-three/fiber@^8.18.0`, `@react-three/drei@^9.122.0`, `@types/three@^0.160.0`, `react@^18.3.1`, `typescript@^5.8.3` (`tsconfig.app.json:26` → `strict: false`), `vite@^5.4.19`. `three-mesh-bvh` and `three-bvh-csg` are **not present anywhere in `package.json`** — neither is installed.

**Materials in use:**
- `Model3DViewer.tsx` demo meshes and `OBJModelLoader.tsx` — `THREE.MeshStandardMaterial`, hard-coded `color/metalness/roughness`, no anisotropy.
- `public/3d-editor/app.js:85-87` — one shared `THREE.MeshStandardMaterial` (`0x8a8f98`, metalness 0.1, roughness 0.7).
- No use of `MeshPhysicalMaterial` or `anisotropy`/`anisotropyRotation` anywhere in the live codebase today — the axis-design §4 rendering model (finish-driven `MeshPhysicalMaterial`) is not implemented yet.
- **`MeshPhysicalMaterial.anisotropy`/`anisotropyRotation` were added in three.js r161** (confirmed against the three.js release history), not "r155+" as the architecture doc claims. The pinned `"three": "^0.160.1"` resolves under npm semver to `>=0.160.1 <0.161.0` — it **cannot** reach r161 without a pin change. As installed today, the repo cannot render anisotropic brushed finishes at all; see §7 for the required version bump.

**Environment map source:** `Model3DViewer.tsx:186` uses drei's `<Environment preset={lightMode ? "studio" : "night"}>`. Drei's `preset` prop resolves to a remote fetch from `raw.githack.com/pmndrs/drei-assets/…/hdri/studio_small_03_1k.hdr` (and the "night" equivalent) at runtime — a third-party CDN, not a repo-local or Supabase-hosted asset, and drei's own docs advise against using `preset` in production. This contradicts architecture Part 7 ("One neutral studio HDRI, fixed" — implicitly self-hosted so it can't vary or fail to load).

**Loaders:** `OBJLoader` (`three/examples/jsm/loaders/OBJLoader.js`, used by `OBJModelLoader.tsx`, and `three/addons/loaders/OBJLoader.js` in the vanilla editor). `OBJExporter` in the vanilla editor only. No GLTF/STL loaders or exporters anywhere yet.

**CSG / BVH / text / worker code:** none present. No `three-bvh-csg`, no `three-mesh-bvh`, no `FontLoader`/`TextGeometry`/`ExtrudeGeometry` text pipeline, no `new Worker(...)` usage anywhere under the audited scope. The entire branding/emboss/deboss/text pipeline described in the capability-summary and required by v3-review §11 and axis-design §1 does not exist in code yet, in either the React app or the vanilla iframe app.

**Model storage:** `public/models/*.obj` (8 static files, e.g. `Polo_Button_10.8.obj`, bundled with the Vite build) and `public/3d-editor/sample.obj`. **No Supabase Storage bucket exists for 3D models** — the only storage buckets defined are `product-images`, `product-assets`, `design-assets` (2D/brochure assets). This contradicts architecture Part 7 ("OBJ models in Supabase Storage, cached by the browser and by a CDN").

---

## 6. Finish identification

Parsed all 135 `insert into public.finishes` rows from `supabase/migrations/20260903170000_catalogue_data_m2.sql:286-420` (columns `process_id, base_family_id, surface_id, tone_id, effect_id, tint_id, coating_id, pattern_id`, resolved from their `(select id from … where code='…')` subqueries).

**Verdict: the 8 axes do not uniquely identify all 135 finishes.** 118 distinct axis-tuples cover 135 records — **11 duplicate tuples span 28 records.**

### Every duplicate 8-axis tuple (identical on all 8 axes, excluding `cyc_code`)

| Tuple (only non-null axes shown) | Colliding records |
|---|---|
| `ROLL · TIN` | CYC-0046 Tin, CYC-0047 Black Tin |
| `ROLL · BRASS` | CYC-0051 Brass, CYC-0064 Nickel Brass, CYC-0065 Tin Brass, CYC-0068 Red Brass |
| `ROLL · ANTI_BRASS` | CYC-0057 Anti Brass, CYC-0070 Enamel Anti Brass |
| `ROLL · RED_COPPER` | CYC-0071 Red Copper, CYC-0074 Black Red Copper, CYC-0084 Copper Tin, CYC-0085 Tin Red Copper |
| `ROLL · ANTI_COPPER` | CYC-0076 Anti Copper, CYC-0083 Old Anti Copper Tin, CYC-0090 Enamel Anti Copper |
| `PAINT · coating=GLOSS_ENAMEL` | CYC-0106 White Enamel, CYC-0111 Black Enamel, CYC-0129 Tea Gold Enamel |
| `PAINT · surface=MATT · coating=MATT_ENAMEL` | CYC-0107 Matt White Enamel, CYC-0112 Matt Black Enamel |
| `PAINT · coating=RUBBER` | CYC-0108 Rubber White, CYC-0113 Rubber Black |
| `PAINT · coating=PEARL` | CYC-0109 Pearl White, CYC-0114 Pearl Black |
| `PAINT · coating=METALLIC` | CYC-0121 Metallic Silver, CYC-0123 Metallic Red |
| `PAINT · coating=GLITTER` | CYC-0126 White Glitter, CYC-0127 Gold Glitter |

Pattern: every plated collision is a base-family group where marketing names differ by a **secondary metal or effect word** (Nickel/Tin/Red Brass; Black/Copper/Tin Red Copper) that none of the 8 axes captures; every painted collision differs only by **pigment colour** (White/Black/Tea Gold Enamel), which also has no axis. These 11 groups are genuine taxonomy gaps, not sparsity — `marketing_name`/`factory_name_en` is the only field that currently disambiguates them.

### Tuples that would newly collide if `tone` were dropped — 30 groups

| Base tuple (surface where present) | Records (tone shown in parens) |
|---|---|
| HP·NICKEL | 0001(—) Nickel, 0033(ANCIENT) Ancient Nickel |
| HP·GUN_METAL | 0004(—) Gun Metal, 0034(ANCIENT) Ancient Gun Metal |
| HP·ROSE_GOLD | 0007(IMT) Imitation Rose Gold, 0019(—) Rose Gold |
| HP·ROSE_GOLD·BRUSHED | 0008(IMT) Imitation Brushed Rose Gold, 0020(—) Brushed Rose Gold |
| HP·ROSE_GOLD·MATT | 0009(IMT) Imitation Matt Rose Gold, 0021(—) Matt Rose Gold |
| HP·GOLD | 0013(—) Gold, 0025(IMT) Imitation Gold, 0035(ANCIENT) Ancient Gold |
| HP·GOLD·BRUSHED | 0014(—) Brushed Gold, 0026(IMT) Imitation Brushed Gold |
| HP·LIGHT_GOLD | 0016(LIGHT) Light Gold, 0022(IMT) Imitation Light Gold |
| HP·LIGHT_GOLD·BRUSHED | 0017(LIGHT) Brushed Light Gold, 0023(IMT) Imitation Brushed Light Gold |
| HP·LIGHT_GOLD·MATT | 0018(LIGHT) Matt Light Gold, 0024(IMT) Imitation Matt Light Gold |
| ROLL·NICKEL | 0036(—) Nickel, 0039(DARK) Dark Nickel, 0042(ANTI) Anti Nickel |
| ROLL·NICKEL·BRUSHED | 0037(—) Brushed Nickel, 0041(DARK) Brushed Dark Nickel |
| ROLL·NICKEL·MATT | 0038(—) Matt Nickel, 0040(DARK) Matt Dark Nickel, 0043(LIGHT) Matt Light Anti Nickel |
| ROLL·BLACK_COPPER | 0044(—) Black Copper, 0045(IMT) Imitation Black Copper |
| ROLL·TIN | 0046(—) Tin, 0047(—) Black Tin, 0048(ANTI) Old Tin |
| ROLL·BRASS | 0051(—) Brass, 0064(—) Nickel Brass, 0065(—) Tin Brass, 0068(—) Red Brass |
| ROLL·ANTI_BRASS | 0056(DARK) Dark Anti Brass, 0057(—) Anti Brass, 0070(—) Enamel Anti Brass |
| ROLL·RED_COPPER | 0071(—) Red Copper, 0074(—) Black Red Copper, 0084(—) Copper Tin, 0085(—) Tin Red Copper |
| ROLL·ANTI_COPPER | 0076(—) Anti Copper, 0083(—) Old Anti Copper Tin, 0090(—) Enamel Anti Copper |
| ROLL·ALLOY | 0087(LIGHT) Light Alloy, 0088(MEDIUM) Medium Alloy, 0089(DEEP) Deep Alloy |
| ROLL·ANTI_SILVER | 0091(—) Anti Silver, 0092(IMT) Imitation Anti Silver |
| ROLL·GOLD | 0093(ANTI) Anti Gold, 0094(ANCIENT) Ancient Gold, 0096(—) Gold, 0101(IMT) Imitation Gold |
| ROLL·LIGHT_GOLD | 0097(LIGHT) Light Gold, 0102(IMT) Imitation Light Gold |
| ROLL·ROSE_GOLD | 0098(—) Rose Gold, 0103(IMT) Imitation Rose Gold |
| PAINT·coating=GLOSS_ENAMEL | 0106(—) White Enamel, 0111(—) Black Enamel, 0129(—) Tea Gold Enamel, 0130(ANTI) Anti Gold Enamel |
| PAINT·surface=MATT·coating=MATT_ENAMEL | 0107(—) Matt White Enamel, 0112(—) Matt Black Enamel |
| PAINT·coating=RUBBER | 0108(—) Rubber White, 0113(—) Rubber Black |
| PAINT·coating=PEARL | 0109(—) Pearl White, 0114(—) Pearl Black |
| PAINT·coating=METALLIC | 0121(—) Metallic Silver, 0123(—) Metallic Red |
| PAINT·coating=GLITTER | 0126(—) White Glitter, 0127(—) Gold Glitter |

### Tuples that would newly collide if `surface` were dropped — 25 groups

| Base tuple (tone where present) | Records (surface shown in parens) |
|---|---|
| HP·NICKEL | 0001(—) Nickel, 0002(BRUSHED) Brushed Nickel, 0003(MATT) Matt Nickel, 0028(SAND) Sand Nickel |
| HP·GUN_METAL | 0004(—) Gun Metal, 0005(BRUSHED) Brushed Gun Metal, 0006(MATT) Matt Gun Metal, 0029(SAND) Sand Gun Metal |
| HP·ROSE_GOLD (tone IMT) | 0007(—) Imitation Rose Gold, 0008(BRUSHED) Imitation Brushed Rose Gold, 0009(MATT) Imitation Matt Rose Gold |
| HP·BRASS | 0010(—) Brass, 0011(BRUSHED) Brushed Brass, 0012(MATT) Matt Brass |
| HP·GOLD | 0013(—) Gold, 0014(BRUSHED) Brushed Gold, 0015(MATT) Matt Gold |
| HP·LIGHT_GOLD (tone LIGHT) | 0016(—) Light Gold, 0017(BRUSHED) Brushed Light Gold, 0018(MATT) Matt Light Gold |
| HP·ROSE_GOLD | 0019(—) Rose Gold, 0020(BRUSHED) Brushed Rose Gold, 0021(MATT) Matt Rose Gold |
| HP·LIGHT_GOLD (tone IMT) | 0022(—) Imitation Light Gold, 0023(BRUSHED) Imitation Brushed Light Gold, 0024(MATT) Imitation Matt Light Gold |
| HP·GOLD (tone IMT) | 0025(—) Imitation Gold, 0026(BRUSHED) Imitation Brushed Gold, 0030(SAND) Imitation Light Sand Gold |
| ROLL·NICKEL | 0036(—) Nickel, 0037(BRUSHED) Brushed Nickel, 0038(MATT) Matt Nickel |
| ROLL·NICKEL (tone DARK) | 0039(—) Dark Nickel, 0040(MATT) Matt Dark Nickel, 0041(BRUSHED) Brushed Dark Nickel |
| ROLL·TIN | 0046(—) Tin, 0047(—) Black Tin |
| ROLL·BRASS | 0051(—) Brass, 0052(BRUSHED) Brushed Brass, 0053(MATT) Matt Brass, 0064(—) Nickel Brass, 0065(—) Tin Brass, 0068(—) Red Brass |
| ROLL·ANTI_BRASS | 0057(—) Anti Brass, 0059(BRUSHED) Brushed Anti Brass, 0060(BRIGHT) Old Anti Brass, 0070(—) Enamel Anti Brass |
| ROLL·RED_COPPER | 0071(—) Red Copper, 0072(MATT) Matt Red Copper, 0074(—) Black Red Copper, 0084(—) Copper Tin, 0085(—) Tin Red Copper |
| ROLL·ANTI_COPPER | 0076(—) Anti Copper, 0080(BRUSHED) Brushed Anti Copper, 0083(—) Old Anti Copper Tin, 0090(—) Enamel Anti Copper |
| ROLL·GOLD | 0096(—) Gold, 0099(BRUSHED) Brushed Gold, 0100(MATT) Matt Gold |
| ROLL·ROSE_GOLD | 0098(—) Rose Gold, 0104(BRUSHED) Brushed Rose Gold |
| PAINT·coating=GLOSS_ENAMEL | 0106(—) White Enamel, 0111(—) Black Enamel, 0129(—) Tea Gold Enamel |
| PAINT·coating=MATT_ENAMEL | 0107(MATT) Matt White Enamel, 0112(MATT) Matt Black Enamel |
| PAINT·coating=RUBBER | 0108(—) Rubber White, 0113(—) Rubber Black |
| PAINT·coating=PEARL | 0109(—) Pearl White, 0114(—) Pearl Black |
| PAINT·coating=EP | 0116(—) Ep Black, 0117(MATT) Matt Ep Black |
| PAINT·coating=METALLIC | 0121(—) Metallic Silver, 0123(—) Metallic Red |
| PAINT·coating=GLITTER | 0126(—) White Glitter, 0127(—) Gold Glitter |

Practical implication: the eight axes are a good **filter** vocabulary (matches axis-design §1's ruling — they narrow, they don't uniquely name), but **`cyc_code` (or `marketing_name`, which is 1:1 with it per the taxonomy doc) must remain the actual selection key** everywhere a finish is picked or stored — consistent with axis-design §6's ruling that the recipe stores `finish_id`, never axis values.

---

## 7. Stack fitness

Registry metadata checked directly (no install):

| Package | Installed | Peer/dep requirement found (fetched directly from the npm registry / unpkg `package.json`) | Compatible with current pins? |
|---|---|---|---|
| `three-mesh-bvh@0.9.15` (latest) | not installed | `peerDependencies: "three": ">= 0.159.0"` | Yes — compatible with `three@0.160.1`. |
| `three-bvh-csg@0.0.18` (latest) | not installed | `peerDependencies: "three": ">=0.179.0", "three-mesh-bvh": ">=0.9.7"` | **No** — requires `three>=0.179.0`, newer than the pinned `0.160.1`. |
| `three-bvh-csg@0.0.17` (prior, unchanged since 2023-12 through the pre-0.0.18 line) | not installed | `peerDependencies: "three": ">=0.151.0", "three-mesh-bvh": ">=0.6.6"` | Yes — compatible with `three@0.160.1` and with `three-mesh-bvh@0.9.15`. |
| `@react-three/fiber@8.18.0` (installed range) | `^8.18.0` | `peerDependencies: "react": ">=18 <19", "three": ">=0.133"` | Yes; also confirms R3F 8 explicitly **rejects** React 19. |
| `@react-three/fiber@9.7.0` (latest overall) | — | `peerDependencies: "react": ">=19 <19.3", "three": ">=0.156"` | R3F 9 **does** hard-require React 19 (`>=19 <19.3`) — confirmed directly from the registry, correcting the common assumption that it's optional. Staying on R3F 8 avoids this entirely. |
| `@react-three/drei@9.122.0` (installed range) | `^9.122.0` | `peerDependencies: "react": "^18", "three": ">=0.137", "@react-three/fiber": "^8"` | Yes, and it pins to R3F **8**, not 9 — drei 9.x and R3F 8.x are the matched pair currently installed. |

**`MeshPhysicalMaterial.anisotropy`/`anisotropyRotation`**: added in **three r161** (confirmed against three.js's release history — not "r155+" as architecture Part 7 claims). The pinned `"three": "^0.160.1"` resolves under npm's caret rule for a 0.x package to `>=0.160.1 <0.161.0` — **it cannot reach r161**. This is a real gap, not a rounding error: as pinned today, brushed-finish anisotropy (architecture Part 7's specific rendering requirement) is unavailable. The pin must move to at least `^0.161.0` (or later) to unlock it — see verdict below.

**Module workers under Vite 5**: `new Worker(new URL('./worker.js', import.meta.url), { type: 'module' })` has been supported since Vite 2 and remains supported in Vite 5.4.19 — no version risk here.

**React 19 / R3F 9 / three major upgrade required?** No. Nothing here requires leaving React 18 / R3F 8 / drei 9. The two real constraints are both minor-version pin issues: (1) `three-bvh-csg` latest has moved its floor to `three@0.179`, ahead of this repo's pin — resolved by pinning the older `three-bvh-csg@0.0.17` instead of `latest`; (2) `three` itself must move from `^0.160.1` to at least `^0.161.0` to get anisotropy, which stays well inside every other package's peer range (`three-mesh-bvh` wants `>=0.159`, `three-bvh-csg@0.0.17` wants `>=0.151`, R3F 8 wants `>=0.133`, drei 9 wants `>=0.137`).

**`tsconfig.app.json` `strict: false`**: not a blocker for any of the above; worth tightening incrementally as the editor's recipe/state types get written (`designs.recipe` is a `jsonb` the architecture doc wants precisely typed), but out of scope to force as part of this stack decision.

### Verdict: **proceed as-is, with a minor-version bump + two pinned additions**

No major stack change and no React/R3F-9 upgrade is required. Three concrete pin changes:
- Bump `three` from `^0.160.1` to `^0.161.0` (minimum) — required to get `MeshPhysicalMaterial` anisotropy at all. Bump `@types/three` to match.
- Add `three-mesh-bvh@^0.9.15` (or pin `0.9.15`).
- Add `three-bvh-csg@0.0.17` (pin exactly — do **not** take `^0.0.18`, which breaks on any `three` version below `0.179`).

`@react-three/fiber@^8.18.0`, `@react-three/drei@^9.122.0`, React `18.3.1`, Vite `5.4.19` are internally consistent and sufficient for architecture Phases 1–7 (MVP configurator) with no forced upgrade.

---

## 8. Gaps

Things the docs assume exist in this repo but do not:

1. **`three-mesh-bvh` and `three-bvh-csg` are not installed.** Architecture Part 1's table lists them as "npm, browser" fits, phrased as already-available; they need to be added, and `three-bvh-csg` needs an explicit older pin (§7).
1a. **The pinned `three@^0.160.1` predates anisotropy support.** Architecture Part 7 assumes `MeshPhysicalMaterial.anisotropy`/`anisotropyRotation` "just works" on the existing dependency (citing "r155+"); the feature actually landed in r161, one minor version past what the current caret range (`>=0.160.1 <0.161.0`) can reach. The pin must move to `^0.161.0`+ before brushed-finish rendering is possible (§5, §7).
2. **No Supabase Storage bucket for 3D models.** Architecture Part 7 assumes OBJ models live in Supabase Storage; today all 8 sample OBJs live in `public/models/` as bundled static assets, and `public/3d-editor/sample.obj` is a third, unrelated copy.
3. **`public/3d-editor` is a second, disconnected three.js instance.** It CDN-loads `three@0.160.0` via an import map (`public/3d-editor/index.html:228-235`), independent of the npm `three@0.160.1` the React app uses. It shares no code with the React app and has none of the text/emboss/deboss/CSG capability either source doc assumes as a starting point — it implements only §§1–8 and §22 of the capability summary (import/inspect/transform/export), none of §§9–21 (curved text, emboss, deboss, materials).
4. **`designer_staff` table and `user_is_designer_staff()` helper do not exist.** Architecture Part 4's third role (WIN-CYC sales, "same shape as `catalogue_editors`") has no schema or RLS function today.
5. **No brand-scoped variant of "manager or owner."** `user_is_brand_manager_or_owner()` (`supabase/migrations/20260615120000_…:22-37`) checks the role globally, not for a specific `brand_id` — the `design_shares`/quote-approval RLS the architecture doc sketches would need a `(_user_id, _brand_id)` version, which doesn't exist yet (only `user_has_brand`/`user_has_brand_text` check plain membership, not role).
6. **No finish-driven rendering anywhere live.** Both `Model3DViewer.tsx`/`OBJModelLoader.tsx` and `public/3d-editor/app.js` use one hard-coded `MeshStandardMaterial`; nothing in the live app currently reads `finishes.metalness/roughness/anisotropy` into a Three.js material, despite the trigger that derives those columns already existing (`supabase/migrations/20260904150000_finish_material_params.sql`).
7. **`Environment preset` fetches from a third-party CDN at runtime**, not the self-hosted "one neutral studio HDRI, fixed" architecture Part 7 calls for; drei's own docs warn `preset` isn't meant for production.
8. **Route collision**: architecture's NEW `/designer-studio/editor/:designId` lands on the same path prefix as the CURRENT, live `/designer-studio/editor` (query-string-driven, no `:designId`), which is linked from `StudioHero3D.tsx:14` and writes to `editor_sessions`. Needs an explicit migration/redirect decision, not just an additive route.
9. **Two `design_` table families with no shared story.** `design_sessions/design_layers/design_exports` (2D composer, brand-scoped via `team_id text`) and the proposed `designs/design_versions/…` (3D editor, `brand_id uuid`) will coexist under near-identical naming; the architecture doc's "left alone" framing is correct but the naming proximity is worth flagging so nobody conflates them later.
10. **`customization_requests` and the RFQ UI are dead** (schema-only table, quarantined UI per `DesignerStudioWorkspace.tsx:42-43`) — not an architecture-doc assumption gap, but adjacent dead weight worth noting since E0 touched the same migration files.
