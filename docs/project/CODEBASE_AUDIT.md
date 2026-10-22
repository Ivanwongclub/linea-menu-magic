# Linea Menu Magic codebase audit

Audit date: 2026-09-27/28 (Asia/Hong_Kong)  
Checkout: `/Users/a1234/Documents/GitHub/linea-menu-magic`  
Target: local working tree, including uncommitted U11 work  
HEAD: `316a974b7b7c0aa4a5372978fd2029ae9f360cd6` (`Workspace U9, U10`)  
Branch/upstream: `main` / `origin/main`, 0 ahead and 0 behind

This is an audit, not an implementation. Application code and migrations were
not changed. **Verified** means code, migration, or command evidence;
**inferred** means assembled from several paths; **proposed** belongs in the
next build plan; **unresolved** cannot be proved from this checkout.

## Executive summary

This is a Vite/React/Supabase application with two live Designer Studio
systems:

1. The newer product-branding 3D editor at `/designer-studio/editor/*`, backed
   by `designs`, `design_versions`, and `design_assets`. HEAD contains phases
   1–7a and workspace units U1–U10.
2. The older brand workspace/composer at `/designer-studio/workspace` and
   `/designer-studio/compose/*`, backed by `design_sessions` and
   `design_layers`. It remains present and must not be assumed retired.

The public catalogue, product detail, brochures/flipbooks, CMS, auth, and both
studio systems depend directly on hosted Supabase. The repository has a local
Supabase migration set and disposable E2E harness, but no deployment pipeline
or proof that the hosted project exactly matches it.

The worktree contains local-only U11 changes: a mobile bottom sheet with
peek/half/full snaps, Layers/Properties/Check tabs, viewport-floor tests,
layout-section persistence, and scenario updates. U11 is not in HEAD or
`origin/main`; its pure unit tests and production build pass, but its browser
E2E was not run in this audit.

## Checkout and change boundary

**Verified commands:** `pwd`, branch/HEAD/upstream/status, recent `git log`,
`git rev-list --left-right --count HEAD...origin/main`.

At audit start:

- `main` exactly matched `origin/main` at `316a974`.
- Tracked local changes: the U11 scenario/unit files plus editor/UI/i18n files
  shown by `git status --short`.
- Untracked local files: `src/features/editor/components/workspace/BottomSheet.tsx`
  and `WorkspaceContext.tsx`.
- The changes were preserved and were not staged, committed, reset, cleaned,
  pushed, or deployed.

## Functionality matrix

| Area/persona | Routes | Main code paths | Durable boundary |
|---|---|---|---|
| Public content | `/`, `/about`, `/about/our-story`, `/about/factory`, `/about/certificates`, `/sustainability`, `/production`, `/news`, `/news/:id`, `/contact`, legal routes | `src/pages/*`, layout components, `src/App.tsx` | Mostly static/local data; global cookies, i18n, auth and Supabase client |
| Public catalogue | `/products`, `/products/:slug` | `Products.tsx`, `ProductDetail.tsx`, `src/features/products/hooks/*` | Products, taxonomy, images, sizes, colours, finishes, compliance; URL filters |
| Brochures/flipbooks | `/ecollections`, `/ecollections/:slug` | `src/features/flipbook/*`, brochure pages/components | Brochure/page/hotlink tables and storage |
| New 3D editor | `/designer-studio/editor/new?product=<slug>`, `/designer-studio/editor/:designId` | `EditorRoute`, `EditorNewPage`, `EditorDesignPage`, `EditorViewport`, `EditorPanel`, `useEditorStore` | Anonymous sessionStorage; signed-in `designs.draft_recipe`; immutable named versions |
| Legacy workspace/composer | `/designer-studio/workspace`, `/designer-studio/dashboard`, `/designer-studio/compose/:sessionId`, `/designer-studio/present/:sessionId` | `DesignerStudioWorkspace`, `features/designer/pages/*`, designer hooks | `brand_memberships`; `design_sessions`, `design_layers`, `design_exports`, `design-assets` |
| Studio library/login | `/designer-studio`, `/designer-studio/trim-library`, `/designer-studio/login`, `/designer-studio/designs`, `/designer-studio/products/:slug` | `src/pages/DesignerStudio*.tsx`, product hooks | Auth/membership and catalogue reads; design list reads `designs` |
| Catalogue CMS | `/admin/login`, `/admin`, `/admin/products`, `/admin/products/new`, `/admin/products/:id`, `/admin/taxonomy`, `/admin/finishes` | `src/pages/admin/*`, `src/components/admin/*`, `src/features/admin/hooks/*` | `catalogue_editors` UX gate; RLS-backed catalogue/storage writes |
| Compatibility/fallback | `/about/sustainability`, bare editor, `*` | `App.tsx` redirects and NotFound | Client-side router |

**Verified:** all routes above are declared in `src/App.tsx`; admin is outside
the customer `Layout`, and editor/admin chunks are lazy-loaded.

## Important flows

### Catalogue and product detail

**Verified:** `useProducts`/`useProduct` read products, visibility, taxonomy,
typed specifications, images, size variants, colours, public finishes and
compliance. The `product-*.mjs` scenarios exercise anonymous, published,
brand-scoped and CMS-backed behavior.

**Verified:** catalogue RLS is implemented in
`20260903120000_catalogue_rls_hardening.sql` and later catalogue migrations;
React visibility is not the only boundary.

### New 3D editor

**Verified flow:** catalogue/editor entry → `EditorNewPage` → product and
finish queries → anonymous local recipe or signed-in `designs` insert →
`EditorDesignPage` → Zustand recipe/history → OBJ from `product-models` →
Three.js/R3F model, materials, branding layers, zones and overlays.

**Verified persistence:** `useAutosaveDraft` debounces signed-in
`designs.draft_recipe` updates; anonymous recipes and pending logos use
sessionStorage until sign-in claim. Logo files use private `design-uploads`
and `design_assets`. `useDesignVersions` inserts immutable named
`design_versions` rows containing recipe and denormalized snapshot, then updates
`designs.current_version_id`; reload reads the stored recipe.

**Verified gates:** unconfirmed model scale prevents design creation and shows
awaiting setup. CMS model upload, bounds, scale/two-point calibration and
branding-group analysis live in `ProductModelEditor.tsx` and
`useProductModel.ts`. The scale migration intentionally avoids a reverse FK
because PostgREST embeds became ambiguous.

**Verified capabilities at HEAD:** plated/paint/printed/custom appearance,
size variants, text and SVG/raster logos, straight/circular text, placement and
handles, relief, zones/parts/occlusion, ruler, manufacturing checks, undo/redo,
autosave, versions/design list, and U1–U10 desktop workspace chrome.

**Verified limits:** STATUS marks shares, quote/staff queue, spec-sheet PDF,
full upload/scene tree, and bake/export as not started. No audited UI implements
sharing, quote request, spec-sheet generation, or OBJ/GLB/STL export. Archive
has no home per STATUS.

### Legacy composer/presentation

**Verified:** workspace/library browsing, composition creation, product layers,
annotations, arrows, highlights, legends, grouping, duplication, background
upload, PNG export, rename/share status, variants, and presentation are in the
legacy path. `ComposerPage.tsx` autosaves layer updates after 1.5 seconds.
Some controls are placeholders (for example RFQ creation shows a toast).

**Security item:** early migrations granted broad authenticated CRUD on legacy
workspace tables; later workspace hardening adds team/role policies. The
effective hosted policy set is unresolved and needs live read-only verification
before extending this system.

### Brochures and CMS

**Verified:** brochure listing/viewing uses flipbook hooks and page/hotlink
components. CMS supports products, taxonomy, finishes, images, sizes,
colour/finish attachments, model upload/scale/branding, and brochure editing.
The E2E harness has a production-only brochure seed because migrations alone
cannot reconstruct that known dependency.

## 3D model/state/rendering map

`src/features/editor/lib/recipe.ts` defines the durable recipe: selected
product/size/finish/colour, layers, optional zones, hidden OBJ groups and view
state. `useEditorStore.ts` adds one selection (`layer`, `zone`, or `part`),
history, pending logos and runtime model/parts/paint state.

The pipeline is: storage OBJ → loader/`prepareModel` → raw-to-face transform
and scale → R3F model/branding meshes → finish/material derivation → text/logo
geometry, relief and zones → camera/ruler/handles/manufacturing strip.
Occlusion uses `occlusionWorker.ts`. SQL finish derivation is mirrored by
`src/features/finishes/metalReflectance.ts`; `render-calibration.mjs` checks
parity.

**Verified by unit coverage:** recipe normalization, version snapshots,
materials/appearance, geometry/handles, branding recovery, text layout,
relief, manufacturing thresholds, zones and workspace layout. U11 adds sheet
math/persistence tests only; it does not prove responsive DOM behavior.

## Supabase/data/security map

**Core tables verified in migrations/client code:**

- Identity: `brands`, `brand_memberships`, `catalogue_editors`,
  `designer_staff`, `brand_role`.
- Catalogue: `products`, families/categories/materials/industries/
  certifications/tags and maps, `product_images`, `product_attachments`,
  compliance tables, `finishes`, `finish_processes`, calibration/material
  tables, `product_finishes`, `product_colours`, `product_size_variants`.
- New editor: `designs`, `design_versions`, `design_assets`, `design_shares`,
  `design_quotes`.
- Legacy workspace: `design_sessions`, `design_layers`, `design_exports`.
- Brochures: `flipbook_brochures`, `flipbook_pages`, `flipbook_hotlinks`.

**Verified role boundaries:** `RequireCatalogueEditor` checks
`catalogue_editors`, while catalogue writes call `user_is_catalogue_editor`.
`RequireBrandAuth` requires an active membership; the UI uses the first as
`primaryBrand`. New-editor writes are owned/brand/staff scoped; anonymous has
no access to new design tables. New-editor versions are insert-only. Product
models are public-read; design uploads are private/path-scoped.

**Unresolved:** the repository cannot prove the hosted project's current RLS,
storage objects, rows, edge-function deployment or migration ledger. It proves
the tracked SQL and local replay intent only.

## Tests, build and deployment

`scripts/e2e-local/README.md` documents a disposable Docker + Supabase stack,
seed replay, service-role read-back, Playwright scenarios, build mode and
`npm run e2e:suite`. `docs/3d-editor/STATUS.md` records historical 48/48
mechanical passes for Phase 7a and later U7/U5; the U9/U10 entry records
resource/watchdog-killed batches, not one uninterrupted run.

### Audit-run evidence on the dirty U11 tree

| Command | Result |
|---|---|
| `node --test 'scripts/e2e-local/unit/*.test.mjs'` | **83 passed, 0 failed**; includes U11 tests |
| `npm run build` | **Passed**; Vite production build completed with chunk/Tailwind warnings |
| `npm run lint` | **Failed**; 47 errors and 43 warnings across the tree |
| `git diff --check` | **Passed** |
| `npm run e2e:suite` | **Not run**; long Docker/Playwright suite and dirty tree were not frozen |

Notable lint failures include explicit `any`, empty interfaces, an unused
expression, and `prefer-const`; warnings include hook dependencies and fast
refresh exports. They predate or span the local U11 scope and were not fixed in
this audit.

**Verified setup:** `package.json` has Vite dev/build/preview, lint, local E2E,
and deck scripts. `vite.config.ts` uses port 8080 and Lovable's development
tagger. Frontend variable names are `VITE_SUPABASE_URL`,
`VITE_SUPABASE_PUBLISHABLE_KEY`, and optional
`VITE_SUPABASE_IMAGE_TRANSFORMS`. `supabase/config.toml` names project ref
`otkuqwpsgxzlaxbclbfi` and declares `generate-product-images` and
`bootstrap-demo-user`; the function runtime uses `SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY`. Secret values were not read or recorded.

README documents Lovable publish/custom-domain workflow. No GitHub Actions,
Netlify/Vercel config, Dockerfile, or deployment script was found. Hosting
outside Lovable therefore needs a static Vite host with SPA fallback plus
separate Supabase schema/storage/function ownership. Hosted Lovable variable
injection and Supabase deployment state are unresolved.

## Reconciliation table

| Repo docs say | Code shows | Conclusion | Next verification |
|---|---|---|---|
| STATUS: phases 1–7a and U1–U10 done | HEAD has matching editor/workspace code | Verified for HEAD | Freeze and browser-test U11 before marking it done |
| STATUS: U11 not started | U11 exists only in dirty worktree | Correct for HEAD, stale for local audit target | Review diff and run targeted browser scenarios |
| Architecture describes versioned new editor | `designs`/`design_versions` are used by editor | Verified | Keep route-load scenario for every new embedded query |
| Workspace docs describe editor chrome | Legacy workspace routes/tables remain live | Two systems coexist | Product decision: converge, maintain or retire legacy composer |
| Harness docs describe local replay | Brochure seed is needed before a later migration | Replay is intentionally augmented | Compare hosted migration ledger/data dependencies |
| README says Lovable is publish path | Vite build is portable, no deployment manifests | Lovable coupling is operational | Capture Lovable/Supabase deployment settings before migration |

## Fact status

**Verified:** checkout state, routes, major feature paths, editor phases,
schema/RLS intent, 83 unit passes, production build pass, lint failure.

**Inferred:** the two studio data models are parallel surfaces; future schema
work must be coupled to UI and RLS acceptance; non-Lovable hosting needs both
static frontend and Supabase operational ownership.

**Proposed:** accept/reject U11 first, reconcile hosted security next, then
choose one studio model before building shares/quotes/output/import/export.

**Unresolved:** hosted drift, U11 browser behavior, legacy/new studio product
direction, version byte/hash semantics, and archive/retention policy.

## Comprehensive audit refresh — 2026-10-07

This refresh rechecked the repository and current documentation against the
working tree, source tree, migrations, edge functions, harness, and build
configuration. It is still an audit, not an implementation. No application
code, migration, hosted state, Docker resource, or deployment target was
changed.

### Checkout and deployment boundary

- Repository: `/Users/a1234/Documents/GitHub/linea-menu-magic`
- Branch: `main`
- HEAD: `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`
- Upstream: `origin/main`; branch is even with upstream
- The worktree remains dirty with the pre-existing U11/U12 editor, scenario,
  deck, status, and report changes. `docs/project/` and the two workspace
  components remain untracked. Nothing was staged, committed, pushed, reset,
  cleaned, or deployed.
- Deployment target verified from `README.md`: Lovable project
  `a8e59680-e4fc-4735-a797-36af2f7e2875`, published through Lovable Share →
  Publish, with optional Lovable custom-domain configuration. Supabase project
  ref is `otkuqwpsgxzlaxbclbfi` from `supabase/config.toml`.
- No GitHub Actions, Netlify/Vercel manifest, Dockerfile, or repository deploy
  script exists. The Vite build is portable, but hosted frontend settings,
  Lovable environment injection, Supabase deployment state, and edge-function
  deployment state are not verified locally.

### Codebase map verified against source

| Surface | Current implementation | Evidence and status |
|---|---|---|
| Public site/catalogue | React Router pages under `src/pages`, shared `Layout`, product hooks and taxonomy components | Route declarations in `src/App.tsx`; catalogue data comes from Supabase hooks; public and brand-scoped behavior has dedicated E2E scenarios |
| Legacy studio | `/designer-studio/workspace`, `/designer-studio/compose/:sessionId`, `/designer-studio/present/:sessionId` | `DesignerStudioWorkspace.tsx`, `features/designer/pages/*`, `useDesignSessions.ts`, `useDesignSession.ts`, `useDesignExports.ts`; still live, not retired |
| New 3D studio | `/designer-studio/editor/new`, `/designer-studio/editor/:designId`, `/designer-studio/designs` | `EditorRoute.tsx`, `EditorNewPage.tsx`, `EditorDesignPage.tsx`, `DesignerStudioDesigns.tsx`; anonymous sessionStorage draft and signed-in `designs` persistence |
| Editor workspace chrome | Desktop docks plus local U11 phone bottom sheet with Layers/Properties/Check | `WorkspaceShell.tsx`, `BottomSheet.tsx`, `WorkspaceContext.tsx`, `useWorkspaceLayout.ts`, `workspaceLayout.ts`; U11/U12 evidence is in STATUS and the session log, not in HEAD |
| Catalogue CMS | `/admin/*` guarded by `RequireCatalogueEditor` | Product, taxonomy, finishes, images, models, scale, and branding controls in `src/pages/admin`, `src/components/admin`, and `src/features/admin` |
| Brochures/flipbooks | `/ecollections`, `/ecollections/:slug` | `features/flipbook`, brochure/page/hotlink tables and `flipbook-assets`; production-only seed is required by local replay |
| Edge functions | `generate-product-images`, `bootstrap-demo-user` | `supabase/functions/*/index.ts`, declared in `supabase/config.toml`; service-role behavior and hosted deployment are not independently verified |

### Current editor flow, persistence, and rendering

The verified new-editor path is catalogue/product entry → product and finish
queries → anonymous recipe in `sessionStorage` or signed-in `designs` insert →
Zustand recipe/history → OBJ fetch from `product-models` → Three.js/R3F model,
materials, branding, zones, overlays, ruler, and manufacturing checks.

- Durable recipe/state: `src/features/editor/lib/recipe.ts`,
  `store/useEditorStore.ts`, `lib/anonymousDraft.ts`.
- Signed-in autosave: `hooks/useAutosaveDraft.ts` writes debounced
  `designs.draft_recipe` and `draft_updated_at`.
- Named immutable versions: `hooks/useDesignVersions.ts` plus
  `lib/versionSnapshot.ts`; inserts `design_versions`, then updates
  `designs.current_version_id`.
- Model/render pipeline: `EditorViewport.tsx`, `EditorModel.tsx`,
  `OBJModelLoader.tsx`, `lib/prepareModel.ts`, `finishMaterial.ts`,
  `BrandingMeshes.tsx`, `reliefGeometry.ts`, `zones.ts`, and
  `occlusionWorker.ts`.
- Product/model ingestion: `useProductModel.ts` uploads
  `models/<product-id>/<timestamp>.obj` to `product-models`, computes raw OBJ
  bounds, writes `products.model_storage_path` and scale metadata, and removes
  the prior object. `20260918110000_phase4a_model_scale.sql` resets scale and
  branding metadata when the model path changes.
- Logo ingestion: `useLogoAssets.ts` and `useLogoUpload.ts` upload to the
  private path-scoped `design-uploads` bucket and create `design_assets` rows.
- Verified limits: shares, quote/staff queue, spec-sheet output, full uploaded
  scene-tree workflow, and bake/export are not implemented as complete product
  flows. The editor has no audited OBJ/GLB/STL export contract yet.

### Supabase and security reconciliation status

Local inventory remains 34 migration files through `20260918110000`; the
reported hosted ledger has 14 rows through `20260615193612`. Local Phase 1
(`20260917120000_designer_studio_phase1.sql`) is therefore outside the supplied
hosted ledger boundary. Hosted Lovable exports supplied during Step 1 confirm
the eight design-table structures, 34 constraints, authenticated CRUD grants
and broad permissive policies on the three legacy tables, and storage policy
shapes. They do not prove runtime API exposure, object contents, role behavior,
or whether Phase 1 was applied outside the ledger. Full details are in
`docs/project/STEP1_DRIFT_REPORT_2026-09-30.md`.

Observed local/hosted risks remain evidence gaps, not implementation tasks:

- Legacy `design_sessions`, `design_layers`, and `design_exports` are intended
  locally to be brand-scoped, but supplied hosted policy/grant evidence is
  broader.
- The hosted constraint export does not show cross-column ownership constraints
  for `design_quotes.design_version_id`/`design_id` or
  `designs.current_version_id`/`design_id`; application-level enforcement is
  unverified, not declared defective.
- `design-assets` and `flipbook-assets` authenticated writes are bucket-only in
  the supplied policy export and need safe role testing. No breach is claimed.
- `design-uploads` is path-scoped locally; product asset/model writes are
  catalogue-editor-gated locally. Hosted effective behavior remains unverified.
- Edge Function inventory/configuration and safe anonymous/outsider/member/
  manager/catalogue-editor/staff tests remain open.

### Harness and verification evidence

The documented harness is serial and disposable: `suite.sh` filters scenario
filenames with quoted `grep -E`, `e2e:up` copies `supabase/` to a scratch
directory, replays migrations plus the production-only seed, starts the labeled
Supabase stack, and `run.mjs` drives Playwright against the local API. The
service-role client is used for controlled test setup/read-back. No E2E run was
started in this audit because it would require local Docker mutation and the
task was an audit-only gate.

Checks run on the unchanged working tree:

| Command | Result |
|---|---|
| `node --test 'scripts/e2e-local/unit/*.test.mjs'` | **83/83 passed** |
| `npm run build` | **Passed**; existing Browserslist, Tailwind ambiguous-class, and chunk-size warnings |
| `npm run lint` | **Failed**; 47 errors and 43 warnings, distributed across existing app/UI/auth/designer/flipbook/function/config files |
| `git diff --check` | **Passed** before documentation edits; must be rerun at handoff |
| Historical targeted/full E2E | Existing session-log evidence: U11 targeted 2/2 and corrected full suite 48/48; U12 deck 26/26 with one documented trim-fixture skip |

### Audit conclusion and MO06/MO09 placement

The repository is buildable and unit-tested, and the current U11/U12 chrome is
documented as locally verified. The main product and security decisions are
not complete: two studio persistence models coexist, hosted Supabase drift is
not fully reconciled, role behavior is unverified, and output/import/export
contracts are not implemented.

No MO06 or MO09 definition, acceptance contract, route, migration, or scenario
was found in the repository search. They therefore cannot be placed in the
build sequence from code evidence. Do not begin either item until their exact
scope and acceptance criteria are supplied and the hosted/local Step 1 gate is
closed.
