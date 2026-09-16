# Designer Studio — build status

Tracks `wincyc-designer-studio-architecture.md` Part 8's build sequence.
Rulings for each phase live in that phase's migration/commit, not here —
this is an index, not a decision log.

| Phase | Contents | Status |
|---|---|---|
| 1 | Schema, RLS, roles | **Done** |
| 2 | Editor shell, route, lazy load, catalogue entry | **Done** |
| 3 | Finish picker integration | Not started |
| 4 | Text: content, font, straight and circular layout | Not started |
| 5 | Direct manipulation: drag to position, size, curve | Not started |
| 6 | Emboss and deboss via CSG in a worker | Not started |
| 7 | Fill on deboss layers | Not started |
| 8 | Save, autosave, version history, restore | Not started |
| 9 | Archive, share, design list | Not started |
| 10 | Quote flow and spec sheet | Not started |
| 11 | Upload path: OBJ, scene tree, cleanup | Not started |
| 12 | Export OBJ / GLB / STL | Not started |

## Phase 1 — done (2026-09-17)

Files:

- `supabase/migrations/20260917120000_designer_studio_phase1.sql` — `designs`,
  `design_versions`, `design_assets`, `design_shares`, `design_quotes`,
  `designer_staff`; helpers `user_is_designer_staff`, `user_has_brand_role`,
  `user_has_design_share`; `finish_processes` deboss/feature tolerance
  columns; storage buckets `product-models` (public read, catalogue-editor
  write) and `design-uploads` (private, path-scoped); RLS + explicit grants
  on every new table.
- `src/integrations/supabase/types.ts` — regenerated against the local
  stack via `npm run e2e:types` (no hand-editing needed).
- `scripts/e2e-local/scenarios/designs-rls.mjs` — proves brand isolation,
  staff cross-brand read, anon denial, an owner with `brand_id null`
  reading their own design, and the quote update split (member blocked,
  staff allowed).
- `docs/3d-editor/STATUS.md` — this file.

### Rulings that shaped Phase 1

R1–R10 (given directly, overriding the architecture doc where they differ)
are recorded in the migration file's header comment, not duplicated here.

### E0's open items, accepted as rulings for Phase 1

E0 (`reports/E0-designer-studio-audit.md` §8, Gaps) flagged several things
the architecture doc assumed but the repo didn't have. The three that are
schema/RLS/role-shaped — the ones this phase had to resolve one way or
another — were accepted as follows:

1. **Gap 4 — `designer_staff` / `user_is_designer_staff()` didn't exist.**
   Accepted: created, mirroring `catalogue_editors` exactly (table shape,
   RLS, grants, security-definer helper).
2. **Gap 5 — no brand-scoped "manager or owner" check** (the existing
   `user_is_brand_manager_or_owner()` is global, not per-brand). Accepted:
   added `user_has_brand_role(_user_id, _brand_id, _roles brand_role[])`,
   used everywhere a design write policy needs "manager/owner of *this*
   brand."
3. **Gap 2 — no Supabase Storage bucket for 3D models.** Accepted: added
   `product-models` (catalogue) and `design-uploads` (buyer/staff uploads)
   per R6. `products.model_url` already existed as the 3D-model column
   (E0 §5), so no new `products` column was added, contrary to R6's
   fallback clause.

Gaps 1/1a (three-bvh-csg / anisotropy pin), 3 (disconnected vanilla
three.js app), 6 (no finish-driven rendering), 7 (CDN HDRI) and 8 (route
collision) are Phase 2+ concerns, not schema — left untouched here.

### §6 ruling — finish identification

Per E0 §6: the eight finish axes are a filter vocabulary, not a naming
one — 11 axis-tuples collide across 28 finish records. **`finish_id` is
the selection key** everywhere a finish is picked or stored (the
`design_versions.recipe`/`snapshot` shape follows this — see the column
comment in the migration). `cyc_code` (1:1 with `marketing_name`) is
never a selection key in buyer-facing surfaces; it appears only on staff
surfaces (CMS, spec sheets, quote responses).

### Open questions from this phase, with a recommendation each

1. **Write-role gate for `design_assets`.** R5 groups assets with
   "versions, assets, shares, quotes inherit via join to designs
   (product_images pattern)," but `design_assets` has no `design_id` — it's
   owned/brand-scoped directly and reused across designs (architecture
   Part 3). Implemented as: read = owner/brand-member/staff, write =
   owner/brand-manager-or-owner/staff (mirrors the `designs` table's own
   write gate, not a literal join). *Recommend confirming this is the
   intended reading* — the alternative is "any brand member can manage
   brand assets," matching architecture Part 4's plain "brand member"
   language.
2. **`design_shares` delete policy.** Not named in R5. Added
   owner/brand-manager-or-owner/staff delete, since sharing without a way
   to revoke access is incomplete. *Recommend keeping it* — low risk,
   additive, and matches the write gate already used for insert.
3. **`design-uploads` path-segment cast.** The storage policies cast
   `(storage.foldername(name))[1]` straight to `uuid`; a malformed path
   (wrong first segment) raises a Postgres error rather than a clean
   permission denial. *Recommend leaving as-is* — the invariant (first
   segment is always `brand_id` or the owner's uid) is app-enforced at
   upload time, and this is the standard Supabase pattern for path-scoped
   buckets.

## Phase 2 — done (2026-09-17)

Files:

- `supabase/migrations/20260917150000_phase2_retire_editor_sessions.sql` —
  drops `editor_sessions` (policies/grants cascade with it); adds
  `products.model_storage_path`.
- `package.json` / `package-lock.json` — `three` → `^0.161.0` (was pinned
  below r161, which is where `MeshPhysicalMaterial.anisotropy` landed —
  E0 §7), `@types/three` to match, `three-mesh-bvh@^0.9.15`,
  `three-bvh-csg@0.0.17` (exact — `^0.0.18` needs `three>=0.179`, E0 §7),
  `zustand@^5.0.15`.
- Deleted `public/3d-editor/` (the vanilla iframe app) and
  `src/pages/DesignerStudioEditor.tsx`.
- `src/App.tsx` — routes `/designer-studio/editor/new` and
  `/designer-studio/editor/:designId`, both on one lazy chunk
  (`src/features/editor/EditorRoute.tsx`); bare `/designer-studio/editor`
  redirects to `/new`, mapping legacy `?slug=` to `?product=`.
- `src/components/designer-studio/StudioHero3D.tsx` — CTA now points at
  `/designer-studio/editor/new?product=metal-button`.
- `src/features/editor/**` (new) — the editor feature: `EditorRoute.tsx`;
  `pages/EditorNewPage.tsx` (product → local state if anonymous, or create
  a `designs` row and move to `/:designId` if signed in, claiming any
  sessionStorage draft); `pages/EditorDesignPage.tsx` (loads an existing
  design); `store/useEditorStore.ts` (zustand — size variant + finish
  selection); `hooks/useEditorProduct.ts` (editor-scoped product read,
  independent of the storefront's `useProduct`); `hooks/useDesignerStaffStatus.ts`;
  `lib/anonymousDraft.ts` (sessionStorage); `components/EditorShell.tsx`,
  `EditorViewport.tsx`, `EditorModel.tsx`, `StudioEnvironment.tsx`
  (`RoomEnvironment` + `PMREMGenerator`, never a drei `preset`),
  `MeasurementLine.tsx`, `EditorPanel.tsx` (PRODUCT/FINISH/BRANDING/OUTPUT),
  `SignInBanner.tsx`.
- `src/features/admin/hooks/useProductModel.ts` (new) and
  `src/components/admin/product-editor/ProductModelEditor.tsx` (new) — the
  CMS `.obj` upload, mirroring `ProductImagesEditor`.
- `src/pages/admin/AdminProductEditor.tsx` — wires in `ProductModelEditor`.
  **Outside this phase's listed edit scope** (only `src/components/admin/
  product-editor/` and `src/features/admin/hooks/` were named) but the page
  that composes those sections is the only place the new field could be
  rendered from — R5 is otherwise unsatisfiable. One import + one `<section>` added.
- `scripts/e2e-local/scenarios/editor-shell.mjs` (new) — R8's four proofs.
- `docs/3d-editor/STATUS.md` — this file.

### Rulings that shaped Phase 2

R1–R9 are recorded in the migration file's header comment and in the
commit; not duplicated here.

### Open questions from this phase, with a recommendation each

1. **i18n was skipped for all new UI.** `src/features/i18n/` (translation
   dictionaries) wasn't in this phase's scope, so every new string — the
   editor panel, the sign-in banner, the CMS model field — is hardcoded
   English, unlike the rest of the admin/storefront UI. *Recommend* adding
   `adminTranslations.ts` and the storefront dictionary to a near-term
   phase's edit scope before this surface grows further.
2. **Non-metal "default" colour.** `product_colours` has no `is_default`
   flag (unlike size variants and finishes), so the editor shows the first
   row by `sort_order`. *Recommend confirming* this matches the storefront's
   own default-colour logic (`ProductColourFinish.tsx`, not read this
   phase) rather than picking a second convention.
3. **`anisotropyRotation` is fixed at 0.** Axis-design §4's `brushDirection`
   isn't defined anywhere as a concrete value — there's no geometry/UV
   mapping yet to derive it from. *Recommend* deriving it once surface-follow
   geometry exists (Phase 5/6), not guessing a value now.
4. **OBJ scale is forced, not trusted.** "1 scene unit = 1mm" is
   implemented by rescaling the loaded model's horizontal bounding-box
   extent to the selected variant's `size_primary_mm`, since E0 confirmed
   the bundled sample OBJs aren't consistently authored to real-world
   units. *Recommend keeping this* unless/until every uploaded model is
   guaranteed mm-scale at the source.
5. **`draft_recipe` is written once, at creation.** Changing the size
   selector afterward updates local/zustand state only — it does not
   patch the `designs` row. *Recommend confirming* this is acceptable
   until Phase 8 (autosave) lands, rather than adding an interim write path.
