# Designer Studio — build status

Tracks `wincyc-designer-studio-architecture.md` Part 8's build sequence.
Rulings for each phase live in that phase's migration/commit, not here —
this is an index, not a decision log.

| Phase | Contents | Status |
|---|---|---|
| 1 | Schema, RLS, roles | **Done** |
| 2 | Editor shell, route, lazy load, catalogue entry | **Done** |
| 3 | Finish picker integration | **Done** |
| 3b | Physically correct plated rendering | **Done** |
| 3c | Procedural studio, antique two-tone, painted finishes and per-family calibration from `wincyc-swatch-measurements.csv` | **Done** — family calibration superseded by 3d |
| 3d | Hue-only family calibration, physical lightness, chart oxide L* | **Done** — fit superseded by 3e where gated |
| 3e | Chroma-gated hue calibration, oxide colour rendered | **Done** — 3-series closed |
| 4.0 | Carried finish items: rose gold blend t = 0.7 toward copper; antique buffed layer at 0.7 × physical L* | **Done** |
| 4a | `products` scale columns + reset trigger; CMS raw bounds, proposal, confirm / known-dimension calibration (units §1.1) | **Done** |
| 4b | Editor uses stored factor (force-rescale removed, §1.3); buyer refusal for unconfirmed scale (§1.2); e2e staging confirmed | **Done** |
| 4c | CMS model preview; two-point calibration | **Done** |
| 4d | CMS branding group marks; recovered radius / angles / relief stored in raw units (§4.2) | **Done** |
| 4e | Ruler toggle, buyer scope, replaces the measurement line (§2) | **Done** |
| 4f | Recipe v2, store / autosave / anonymous draft for layers; add text, layer list, straight layout | **Done** |
| 4g | Circular layout, per-glyph placement, reversed text without mirroring (§5) | **Done** |
| 4h | Hybrid numeric / slider controls in "Position and curve" (§3); ruler label layout, camera read-back, CMS preview fixes | **Done** |
| 4i | Drag handles on the model, one shared state (§3); undo / redo | **Done** |
| 4j | Catalogue branding defaults: marked groups hidden, text lands on recovered placement; ruler branding radius and edge margin | **Done** |
| 5 | Relief: emboss/deboss per layer, depth, bevel, manufacturing warning strip with WIN-CYC thresholds | Not started |
| 6 | Fill picker on deboss layers; occlusion bake moves to a worker | Not started |
| 7 | Versions: named saves, snapshot, reload | Not started |
| 8 | Shares | Not started |
| 9 | Quote request and staff queue | Not started |
| 10 | Spec sheet PDF, recovered values labelled (§4.3) | Not started |
| 11 | Upload path: scene tree, viewport selection, hover, hide/isolate, first-import dialog, full units and scale, calibration, full ruler, branding analysis and recovery, fit policies | Not started |
| 12 | Bake and export: boolean, cleanup, bake scale, OBJ mm, GLB metres, STL (§1.5) | Not started |

Phases 4–12 follow `wincyc-3d-editor-units-and-recovery-rulings.md` §7 (§ refs
above are to that document); Phase 4's units, their e2e proofs and open
questions are in `reports/E1-plan-integration.md` §5. Autosave already landed in
Phase 3 (R7). Archive and the design list (old Phase 9) have no row in §7 —
see E1 open question 4. Later references in this file to "Phase 5/6/8/9" were
written against the previous numbering.

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
   **Superseded by Phase 3 R7** — autosave now covers size/finish/colour.

## Phase 3 — done (2026-09-17)

Files:

- `src/features/editor/hooks/useEditorProduct.ts` — rewritten: drops the
  finish embed (moved to `useFinishOptions`), adds trilingual localisation
  for product name and colour names via the current `useI18n` language.
- `src/features/editor/hooks/useFinishOptions.ts` (new) — R4's source
  rule: the product's attached public finishes via `product_finishes`, or
  every public finish if none are attached. Returns each row shaped as the
  raw `finishes` `Row` plus all 8 axis tables' names nested alongside the
  existing `*_id` columns, so it satisfies `FinishRow` structurally and
  feeds `useFinishFilter`/`FinishFacetRail`/`FinishSwatchGrid` unchanged.
- `src/features/editor/hooks/useAutosaveDraft.ts` (new) — R7: signed-in
  designs write `draft_recipe` + `draft_updated_at`, debounced 2s. Assumes
  one design per mount (no design-switching UI exists yet to invalidate that).
- `src/features/editor/store/useEditorStore.ts` — adds `colourId`.
- `src/features/editor/components/EditorModel.tsx` — camera framing (R1:
  bounding-sphere fit to ~60% of the viewport, three-quarter view,
  `controls.saveState()` so double-click reset returns here); drops drei's
  `<Center>` for manual recentring (so the framed box matches the rendered
  one exactly); `anisotropyRotationForSurface()` (R6).
- `src/features/editor/components/EditorViewport.tsx` — R1 auto-rotate
  (stops for good on first `OrbitControls` interaction) and double-click
  reframe; damping and zoom limits; i18n. No toolbar was added in Phase 2
  to remove — R2 is met by not adding one now, while wiring camera controls.
- `src/features/editor/components/EditorPanel.tsx` — rewritten: FINISH
  (metal) or COLOUR (non-metal) group, "Change finish" side sheet, quiet
  autosave indicator in the header, i18n throughout, R3's ligne-suppression
  fix (keyed on `size_label`, not `size_ligne` nullity — the generated
  column is never actually null).
- `src/features/editor/components/MeasurementLine.tsx` — same ligne fix.
- `src/features/editor/components/SignInBanner.tsx` — i18n.
- `src/features/editor/pages/EditorNewPage.tsx` / `EditorDesignPage.tsx` —
  wire the finish/colour picker props, `colourId`, autosave, i18n.
- `src/features/finishes/FinishSelectionPicker.tsx` (new) — the extracted
  selection-mode picker: `FinishFacetRail` + `FinishSwatchGrid` +
  `useFinishFilter`, composed non-mutating (`onSelect`, no
  `product_finishes` write).
- `src/features/finishes/finishAxisLine.ts` (new) — localised axis-line
  and marketing-name formatting, shared by the panel summary and (via the
  type it exports) the picker.
- `src/features/i18n/translations.ts` — ~24 new `editor.*` keys × 3
  locales (en, zh-Hant, zh-Hans), covering every string introduced in
  Phase 2 and Phase 3.
- `scripts/e2e-local/scenarios/finish-picker.mjs` (new) — R9's five
  proofs; also seeds public finishes, a `product_finishes` attachment, a
  colour and a size variant, none of which exist in the migrations-only
  local seed (see the note below).
- `scripts/e2e-local/scenarios/editor-shell.mjs` — one assertion loosened:
  the second panel group is FINISH or COLOUR depending on the picked
  product's material, not always FINISH.
- `docs/3d-editor/STATUS.md` — this file.

### The local seed has no public finishes, no attachments, no non-metal colours, no size variants

Confirmed live against the reset stack: `finishes.is_public` is `false`
for every one of the 135 rows the migrations insert, no product has a
`product_finishes` row, no non-metal product has `product_colours`, and no
product has a `product_size_variants` row at all. E0's "35 of 135 public"
and the M4 memory note's "65 house products" describe *production*, which
this stack can't reach (no snapshot — see `verify-writes-on-local-stack`
memory). `finish-picker.mjs` seeds and tears down exactly what it needs
rather than assuming any of this exists; anything testing finish/colour/size
behaviour against the local stack in a later phase will need to do the same.

### Open questions from this phase, with a recommendation each

1. **Camera "decorated face toward camera" assumes +Z is the front.**
   Nothing in this phase's scope (the sample OBJs under `public/models/`
   weren't read) confirms every model is authored with the decorated face
   on +Z. *Recommend* a per-product or per-file front-axis hint if staff
   uploads (Phase 11) turn out inconsistent, rather than assuming the
   convention holds.
2. **`anisotropyRotationForSurface` returns 0 for both BRUSHED and
   CIRCLE_BRUSHED.** BRUSHED's "linear along local X" *is* three.js's
   zero-rotation tangent default, so there's no numeric difference yet —
   the function exists so a real per-vertex radial mapping for
   CIRCLE_BRUSHED has a named seam to land in later, rather than a bare
   inline `0`. *Recommend* revisiting once Phase 6 introduces real
   geometry/UV work.
3. **COLOUR's default-selection logic still isn't verified against the
   storefront.** `src/components/product/ProductColourFinish.tsx` (the
   component R5 asks to match) is outside every phase's scope so far.
   *Recommend* granting read access to it in whichever phase next touches
   colour selection, or confirming by other means that "first by
   `sort_order`" is in fact its rule.
4. **"Process filter" in R4's prop list.** Implemented as: the picker's
   internal `FinishFacetRail` covers all 8 axes, including process, rather
   than a distinct prop the parent passes in. *Recommend confirming* this
   reading — the alternative is a dedicated `processFilter` prop that
   pre-narrows the list before the sheet opens.
5. **`useAutosaveDraft` assumes one design per mount.** Its hydration
   guard resets only on first mount, not on `designId` changing under an
   already-mounted page. *Recommend* addressing this when Phase 9 adds a
   design list (the first UI that could navigate between two designs
   without a full remount).

## Phase 3b — done (2026-09-17)

Files:

- `supabase/migrations/20260917180000_phase3b_metal_reflectance.sql` —
  `finishes.base_color_hex`, `clearcoat`, `clearcoat_roughness`; new
  `finish_metal_f0()`, `finish_linear_to_srgb_hex()`,
  `finish_plated_material()`; `finishes_derive_material()` rewritten to
  route plated rows (coating null) to the new model and painted rows to the
  unchanged `finish_material_params()` with `base_color_hex = hex_approx`;
  all 108 plated rows recomputed. `hex_approx` is not rewritten.
- `src/features/finishes/metalReflectance.ts` (new) — TS mirror of the
  tables and derivation.
- `src/features/finishes/swatch.ts`, `FinishSwatch.tsx` — the SVG swatch
  reads `base_color_hex` (falls back to `hex_approx`); surface thresholds
  moved to the new roughness scale (matt ≥ 0.5, sand ≥ 0.65).
- `src/features/editor/lib/renderSettings.ts` (new) — tone mapping,
  exposure, HDRI path and rotation, camera constants.
- `src/features/editor/lib/prepareModel.ts` (new) — smooth normals for
  normal-less OBJs (weld + `computeVertexNormals`); decorated-face rotation.
- `src/features/editor/lib/ligne.ts` (new) — trade-size ligne display.
- `src/features/editor/components/EditorModel.tsx` — material from the new
  columns (incl. clearcoat); orientation by rotation; projected-box framing;
  material swaps no longer rebuild the object (so no camera jump);
  `ContactShadows`.
- `src/features/editor/components/EditorViewport.tsx` — drei `Environment
  files="/env/studio.hdr"`, background off, fixed rotation; `gl` =
  NeutralToneMapping / sRGB / exposure; transparent canvas over the
  `bg-secondary` token. `StudioEnvironment.tsx` (RoomEnvironment) deleted.
- `EditorPanel.tsx`, `MeasurementLine.tsx` — ligne via `tradeLigne`.
- `src/features/editor/hooks/useFinishOptions.ts` — `PickerFinish` gains
  the three new columns (typed locally; see open question 1).
- `package.json` / lockfile — `three` and `@types/three` `^0.161.0` →
  `^0.162.0`, the first release with `NeutralToneMapping` (and
  `Scene.environmentRotation`); `three-bvh-csg@0.0.17` allows `>=0.151`.
- `scripts/e2e-local/scenarios/render-calibration.mjs` (new) — R6.
- `scripts/e2e-local/scenarios/swatch-renderer.mjs` — expected derived
  values updated to the new surface table.
- `reports/3b-materials.png` — six plated finishes on the lettered Polo
  button, for human review.

### Rendering pipeline

| Setting | Value |
|---|---|
| Output colour space | sRGB |
| Tone mapping | Khronos PBR Neutral (three r162 `NeutralToneMapping`) |
| Exposure | 1.0 |
| Environment | `public/env/studio.hdr`, background off, Y rotation 160° |
| Non-metal material | dielectric, roughness 0.5 |
| Camera | elevation 30°, azimuth −25°, projected box fills 60% of the limiting dimension |

Calibration (through the real editor route, 5×5 median at the centre):
`#808080` → (128,127,128); `#C0392B` → (193,56,43). Rotation was chosen by
sweeping 0–360° in 30° then 150–180° in 5° on a bright nickel disc: 160°
reflects the cyclorama's curve as a soft diagonal gradient; 150° shows a
flat's hard edge; ≥170° goes flat white; 0–90° reflects the dark floor. At
160° the camera-facing disc happens to receive unit irradiance, which is
why exposure lands at exactly 1.0.

### F0 table (linear RGB)

Source: Real-Time Rendering 4th ed., Table 9.2, after Hoffman, "Physics and
Math of Shading", SIGGRAPH 2015.

| Metal | R | G | B |
|---|---|---|---|
| Gold | 1.000 | 0.782 | 0.344 |
| Silver | 0.972 | 0.960 | 0.915 |
| Copper | 0.955 | 0.638 | 0.538 |
| Nickel | 0.660 | 0.609 | 0.526 |
| Brass (C260) | 0.910 | 0.778 | 0.423 |
| Iron / steel | 0.562 | 0.565 | 0.578 |
| Tin | 0.673 | 0.637 | 0.585 — **placeholder** (platinum's F0; tin is not in the table) |
| Zinc | 0.664 | 0.824 | 0.850 |
| Aluminium | 0.913 | 0.922 | 0.924 |

### Base family mapping

| Base family | Metal | Blend / variant |
|---|---|---|
| NICKEL | nickel | — |
| GUN_METAL | nickel | black |
| GOLD | gold | — |
| LIGHT_GOLD | gold | → silver, t = 0.35 |
| ROSE_GOLD | gold | → copper, t = 0.5 |
| BRASS | brass | — |
| ANTI_BRASS | brass | anti |
| RED_COPPER | copper | — |
| ANTI_COPPER | copper | anti |
| BLACK_COPPER | copper | black |
| TIN | tin | — |
| ANTI_SILVER | silver | anti |
| ALLOY | zinc | — |
| STAINLESS_STEEL | iron | — |
| RUSTY_STEEL | iron | anti (rust hue not modelled) |

Variants desaturate toward Rec.709 luminance, then scale: **anti** =
saturation 0.9 × value 0.18; **black** = saturation 0 × value 0.13. First
pass (0.6/0.45, 0.4/0.28) rendered anti brass olive-grey and gun metal
mid-grey; the factors were reset against the chart's photographed
`hex_approx` for CYC-0057 (`#6B6247`) and CYC-0004 (`#4C5155`).

### Offsets (per-channel multipliers on linear RGB, tone then tint)

| Code | Axis | R | G | B |
|---|---|---|---|---|
| IMT | tone | 0.95 | 0.95 | 0.92 |
| DARK | tone | 0.40 | 0.40 | 0.40 |
| LIGHT | tone | 1.10 | 1.10 | 1.10 |
| MEDIUM | tone | 0.70 | 0.70 | 0.70 |
| DEEP | tone | 0.55 | 0.55 | 0.55 |
| ANTI | tone | 0.20 | 0.19 | 0.17 |
| ANCIENT | tone | 0.17 | 0.15 | 0.12 |
| JAPAN | tint | 0.92 | 0.88 | 0.80 |
| COFFEE | tint | 0.88 | 0.72 | 0.56 |
| CHOCOLATE | tint | 0.78 | 0.60 | 0.46 |
| PINK | tint | 1.06 | 0.86 | 0.90 |
| ORANGE | tint | 1.10 | 0.84 | 0.60 |
| GUN_METAL | tint | 0.72 | 0.74 | 0.78 |

Surface: BRIGHT 0.06/0 · BRUSHED 0.35/0.8 · CIRCLE_BRUSHED 0.35/0.8 · MATT
0.55/0 · SAND 0.70/0 · null → BRIGHT. Clearcoat 1.0 / 0.1 for effect
ENAMEL_DIP — the taxonomy has no separate plated-lacquer code (無叻 "no
lacquer" is constant across the chart). Every other effect is ignored for
plated rows. Metalness 1. All offsets and variant factors are provisional
until 3c.

### Lettering orientation

The Polo OBJ is Y-up with its relief on +Y and winding consistent with its
normals (15 783 of 15 788 faces), so the mirrored read wasn't inside-out
geometry. Orientation is now a rotation that brings the part's thinnest
axis, on its denser side, to +Z (`decoratedFaceRotation`); rendered, "EST."
and "POLO" read the right way round. No negative scale anywhere.

### Pending — Phase 3c

Painted finishes (coating not null, 27 rows) still use
`finish_material_params()` and `hex_approx`. 3c calibrates them — and
revisits the provisional plated offsets — from
`docs/3d-editor/wincyc-swatch-measurements.csv`.

### Open questions from this phase, with a recommendation each

1. **`types.ts` not regenerated.** `src/integrations/supabase/types.ts` was
   outside this phase's scope, so the three new columns are typed locally
   (`PickerFinish`, optional `FinishMaterial.base_color_hex`). *Recommend*
   running `npm run e2e:types` in the next phase that has it in scope.
2. **Storefront swatches still read `hex_approx`.** `useProduct`'s explicit
   finish column list (outside scope) doesn't select `base_color_hex`, so
   the public product page's swatches keep the old colour while the CMS and
   editor use the new one. *Recommend* adding the column to that select so
   all three surfaces agree, per R4's intent.
3. **Tin F0 is a placeholder.** *Recommend* taking a measured value in 3c
   (or from a spectral n/k source) rather than keeping platinum's.
4. **Polished red copper reads pale salmon, not orange-brown.** That is
   copper's measured F0 reflecting a white cyclorama — physically right,
   but further from the chart photo (`#B4714B`) than the other five.
   *Recommend* judging it on the contact sheet; if it reads wrong to
   WIN-CYC, 3c's measurements are the place to fix it, not a hand-tuned F0.
5. **`public/models/Polo_Button_10.8.obj` was read outside scope.** The
   calibration scenario needs a lettered model and it is the only one in
   the repo; I inspected its axis extents, normals and winding with a
   script. *Recommend* moving a copy under `scripts/e2e-local/fixtures/` so
   the scenario doesn't depend on a public asset.
6. **Plated `hex_approx` diverges from `base_color_hex`.** The filter rail
   and any other `hex_approx` consumer keep the chart-photo colour.
   *Recommend* leaving it — it is CMS-editable data and R4 only asked for
   painted rows to keep theirs — unless WIN-CYC wants the two unified.

## Phase 3c — done (2026-09-17)

Files:

- `supabase/migrations/20260917210000_phase3c_painted_antique_calibration.sql`
  — `finish_swatch_measurements` (the CSV, 135 rows) and
  `finish_family_calibration` (fitted values + residuals), both staff-read /
  service-role-write; `finishes.two_tone`; `finish_metal_f0()` gains `tin`
  (chart-referenced) and `black_nickel`; `finish_plated_material()` rewritten
  (antique families use the bare metal, antique tones skip their offset,
  gun-metal cool bias and roughness floor, family calibration last);
  `finish_painted_material()` new; `finish_derive()` shared by the trigger
  and `finish_recompute_materials()` (service role only); all 135 rows
  recomputed. `hex_approx` untouched.
- `src/integrations/supabase/types.ts` — regenerated (`npm run e2e:types`).
- `src/features/products/hooks/useProduct.ts` — select adds `base_color_hex`.
- `src/features/finishes/metalReflectance.ts` — mirrors the 3c plated
  derivation; `FAMILY_CALIBRATION` generated from the fit.
- `src/features/editor/lib/studioEnvironment.ts`,
  `components/ProceduralStudio.tsx` (new) — the procedural studio.
  `public/env/studio.hdr` deleted.
- `src/features/editor/lib/ambientOcclusion.ts`, `lib/twoTone.ts` (new) —
  baked occlusion (three-mesh-bvh) and the buffed/oxide shader mix.
- `src/features/editor/components/EditorModel.tsx`, `EditorViewport.tsx`,
  `lib/renderSettings.ts`, `hooks/useFinishOptions.ts` — studio, two-tone,
  exposure 0.92, non-metal roughness 0.3, axis codes for tone/process/family.
- `scripts/e2e-local/lib/colour.mjs` (new) — sRGB/Lab, CIEDE2000 (checked
  against Sharma et al.'s test pairs), Neutral tone map forward and inverse.
- `scripts/e2e-local/lib/calibration.mjs` (new) — shared disc fixture,
  CSV reader, staging, in-page finish picking, pixel statistics.
- `scripts/e2e-local/calibrate/fit-families.mjs`, `refit.mjs` (new) — the
  per-family measurement / fit harness.
- `scripts/e2e-local/fixtures/Polo_Button_10.8.obj` — copied from
  `public/models/`; scenarios no longer read the public asset.
- `scripts/e2e-local/scenarios/render-calibration.mjs` — rewritten for 3c.
- `scripts/e2e-local/scenarios/family-calibration.mjs` (new) — asserts every
  family ≤ ΔE2000 8 and refreshes `reports/3c-family-fit.json`.
- `reports/3c-materials.png`, `reports/3c-family-fit.json`.

### Procedural studio (R1)

Built in `lib/studioEnvironment.ts`, baked once through `PMREMGenerator`
(σ 0.02). Directions: elevation above the horizon, azimuth from +Z toward +X
(−X is the viewer's left). Softboxes fall off by smoothstep over `feather` of
each half-extent.

| Element | Elevation | Azimuth | Size (°) | Radiance | Feather |
|---|---|---|---|---|---|
| Surround | — | — | full sphere | 0.17 | — |
| Key (above-left) | 40° | −50° | 70 × 55 | 10.5 | 0.6 |
| Fill (right, low) | −28° | 64° | 80 × 90 | 8.5 | 1.0 |
| Rim (top-back) | 55° | 180° | 90 × 8 | 3.0 | 0.5 |

Exposure 0.92; non-metal roughness 0.3. Found by sweep (≈ 40 configurations
through the editor route). The fill's position is what makes it work: a
flat disc facing +Z under the three-quarter camera reflects *down-right-front*,
so the fill's falloff has to cross that direction to give the gradient —
and the same crossing gives a dielectric the ~4% specular PBR Neutral tone
mapping assumes, which is what brings #C0392B's blue channel within tolerance.
A dimmer fill (4) under a brighter key reproduced grey but crushed #C0392B's
blue by 5–7; a fill brighter than the key passed but broke "weaker fill".

Results (render-calibration.mjs):

| Check | Target | Result |
|---|---|---|
| Reference nickel disc, surround-facing (luminance p2) | ≤ #505050 (80) | 50 |
| Reference nickel disc, highlight (luminance p98) | ≥ #EDEDED (237) | 238 |
| Adjacent-pixel luminance step on the face (p99.5, from the sweep — not asserted) | smooth | 2 |
| #808080 disc centre | ±3 | (128,128,128) |
| #C0392B disc centre | ±3 | (192,58,45) |
| Model fill | ~0.6 | 0.56 |

The studio checks use nickel's reference F0 (`#D4CDC0`), not the calibrated
NICKEL family — see open question 1.

### Antique two-tone (R2)

`two_tone` = tone in (ANTI, ANCIENT, DEEP, DARK) or base family in
(ANTI_BRASS, ANTI_COPPER, ANTI_SILVER, BLACK_COPPER) — 38 rows. Occlusion:
32 cosine-weighted rays per unique vertex (position + normal), reach 8% of the
part's largest dimension, one BVH over all groups, cached per model URL.
Mix: smoothstep(0.08, 0.45, occlusion) between buffed (base_color_hex, row
roughness; 0.30 when surface is null) and oxide (base × 0.25, roughness 0.55).
Antique families take the bare metal's F0; antique tones don't apply their
multiplier (the mix is the darkening).

### Gun metal (R3)

| Value | Setting |
|---|---|
| Reference F0 | `black_nickel` = nickel's luminance (0.6139) × 0.18 = 0.1105, neutral — no published F0 for black-nickel electroplate |
| Cool bias | × (0.96, 1.00, 1.08) |
| Roughness floor | 0.15 |
| Family calibration | value 0.2786 — ΔE2000 0.25 |

### Tin (R4)

No visible-range optical constants for tin were found in the references
checked: refractiveindex.info's Sn datasets (Golovashkin & Motulevich 1964)
start at 730 nm, and physicallybased.info has no tin. Tin is therefore a
neutral reference (0.6) whose brightness comes from the WIN-CYC chart itself
(CYC-0046, CYC-0048, CYC-0049 via the TIN family fit) — the chart
measurement is the named source.

### Per-family calibration (R4) — superseded by Phase 3d

Kept for the record; the saturation/value/offset model and the values below
were replaced by 3d's hue-only calibration (see Phase 3d). Applied last in the plated model: desaturate toward Rec.709 luminance by
*saturation*, scale by *value*, multiply by the offset. Fitted in
`calibrate/fit-families.mjs` from glare-free chart rows († = no glare-free
rows; fitted to glare rows). R4 asks for ≤ 8, not the minimum, and the
unconstrained fit reaches ΔE ≈ 1 by greying gold and brass to neutral; the
fit therefore keeps saturation and offsets as close to 1 as possible subject
to a predicted ΔE ≤ 6, then measures the real residual by re-rendering.
All residuals below are measured, not predicted.

| Family | Rows | Saturation | Value | Offset R·G·B | Chart median Lab | Rendered median Lab | ΔE2000 |
|---|---|---|---|---|---|---|---|
| ALLOY | 2 | 0.9 | 0.0609 | 1 · 1 · 1 | 11.3, -0.0, -3.1 | 11.3, -4.3, -2.2 | 5.65 |
| ANTI_BRASS | 10 | 1 | 0.0153 | 1 · 1 · 1 | 12.9, -0.1, 3.1 | 4.3, -0.1, 5.3 | 5.66 |
| ANTI_COPPER | 4 | 1 | 0.01 | 1 · 1 · 1 | 8.0, 0.6, 0.3 | 1.6, 1.5, 1.8 | 4.24 |
| ANTI_SILVER | 2 | 1 | 0.089 | 1 · 1 · 1 | 20.7, 0.0, -0.7 | 21.0, -0.5, 2.0 | 2.68 |
| BLACK_COPPER | 3 | 0 | 0.0638 | 1 · 1 · 1.05 | 8.7, -0.1, -4.6 | 9.8, 0.5, -1.4 | 3.11 |
| BRASS | 11 | 0.25 | 0.0934 | 1 · 1 · 1 | 18.3, -1.1, -0.4 | 20.8, -0.4, 4.1 | 4.62 |
| GOLD | 10 | 0.5 | 0.0235 | 1 · 1 · 1 | 13.7, -0.7, 4.1 | 5.2, 0.1, 5.3 | 5.52 |
| GUN_METAL | 3 | 1 | 0.2786 | 1 · 1 · 1 | 5.0, -0.1, -2.0 | 5.4, -0.1, -2.1 | 0.25 |
| LIGHT_GOLD | 7 | 0.4 | 0.1242 | 1 · 1 · 1 | 25.3, -0.4, -0.1 | 27.7, -0.1, 6.1 | 5.81 |
| NICKEL | 4 | 0.2 | 0.1077 | 1 · 1 · 1 | 12.9, 0.3, -3.8 | 13.6, -0.4, 1.0 | 4.67 |
| RED_COPPER | 2 | 0.9 | 0.058 | 1 · 1 · 1 | 16.3, 5.0, 6.4 | 13.5, 7.9, 11.7 | 4.7 |
| ROSE_GOLD | 4 | 0.3 | 0.1077 | 1 · 1 · 1 | 19.0, 2.5, -0.2 | 22.0, 0.8, 5.2 | 6.09 |
| RUSTY_STEEL | 1 | 1 | 0.3064 | 1 · 1 · 1 | 5.0, -0.3, -1.4 | 6.8, 0.5, -1.3 | 1.63 |
| STAINLESS_STEEL † | 1 | 1 | 0.1816 | 1 · 1 · 1 | 22.4, 1.3, -0.9 | 28.0, 0.2, -0.6 | 4.39 |
| TIN | 3 | 1 | 0.1432 | 1 · 1 · 1 | 17.8, -0.4, -1.4 | 24.0, 0.0, 0.0 | 4.54 |

Unchanged from 3b and still provisional: tone multipliers IMT (0.95, 0.95,
0.92), LIGHT 1.10, MEDIUM 0.70; tints as in the 3b table; RUSTY_STEEL keeps
the anti variant (saturation 0.9 × value 0.18) before its calibration.

### Painted finishes (R5)

Base colour = the chart's `hex_srgb`; glare rows (marked) are used as
measured, per R5 — CYC-0110, 0118, 0120, 0124, 0127, 0128, 0129, 0130.
Coating → roughness: GLOSS_ENAMEL 0.15 + clearcoat 1 · MATT_ENAMEL 0.60 ·
RUBBER 0.85 · PEARL 0.30 · EP 0.30 · GLITTER 0.40 · VELVET 0.95 · EPOXY 0.05
+ clearcoat 1 · CERAMIC 0.20 · METALLIC 0.30 (metalness 0.6). Clearcoat
roughness 0.10 where clearcoat is 1 (R5 doesn't state it; matches 3b's
enamel-dip). Metalness 0 otherwise; patterns don't change the material.

| Code | Chart name | Coating | base_color_hex | Metalness | Roughness | Clearcoat | Glare |
|---|---|---|---|---|---|---|---|
| CYC-0027 | HP IMT BRUSHED GOLD MACL | MATT_ENAMEL | `#47321A` | 0 | 0.6 | 0 |  |
| CYC-0106 | WHITE ENAMEL | GLOSS_ENAMEL | `#C1BFC6` | 0 | 0.15 | 1 |  |
| CYC-0107 | MATT WHITE ENAMEL | MATT_ENAMEL | `#CBCCD4` | 0 | 0.6 | 0 |  |
| CYC-0108 | RUBBER WHITE | RUBBER | `#C8CCD3` | 0 | 0.85 | 0 |  |
| CYC-0109 | PEARL WHITE | PEARL | `#BEC6DB` | 0 | 0.3 | 0 |  |
| CYC-0110 | SPRAY DOT ENAMEL | GLOSS_ENAMEL | `#CCD9EF` | 0 | 0.15 | 1 | yes |
| CYC-0111 | BLACK ENAMEL | GLOSS_ENAMEL | `#040403` | 0 | 0.15 | 1 |  |
| CYC-0112 | MATT BLACK ENAMEL | MATT_ENAMEL | `#121212` | 0 | 0.6 | 0 |  |
| CYC-0113 | RUBBER BLACK | RUBBER | `#0D0E0F` | 0 | 0.85 | 0 |  |
| CYC-0114 | PEARL BLACK | PEARL | `#04080B` | 0 | 0.3 | 0 |  |
| CYC-0115 | GRADIENT ENAMEL | GLOSS_ENAMEL | `#282E35` | 0 | 0.15 | 1 |  |
| CYC-0116 | EP BLACK | EP | `#060604` | 0 | 0.3 | 0 |  |
| CYC-0117 | MATT EP BLACK | EP | `#0B0C0B` | 0 | 0.3 | 0 |  |
| CYC-0118 | SCREEN PRINT ENAMEL | GLOSS_ENAMEL | `#131416` | 0 | 0.15 | 1 | yes |
| CYC-0119 | RAINDROP ENAMEL | GLOSS_ENAMEL | `#11151B` | 0 | 0.15 | 1 |  |
| CYC-0120 | CRACKED ENAMEL | GLOSS_ENAMEL | `#192129` | 0 | 0.15 | 1 | yes |
| CYC-0121 | METALLIC SILVER | METALLIC | `#544948` | 0.6 | 0.3 | 0 |  |
| CYC-0122 | VELVET ENAMEL | VELVET | `#0C0C0C` | 0 | 0.95 | 0 |  |
| CYC-0123 | METALLIC RED | METALLIC | `#170507` | 0.6 | 0.3 | 0 |  |
| CYC-0125 | IMT LEATHER ENAMEL | GLOSS_ENAMEL | `#22272D` | 0 | 0.15 | 1 |  |
| CYC-0126 | WHITE GLITTER | GLITTER | `#302B25` | 0 | 0.4 | 0 |  |
| CYC-0127 | GOLD GLITTER | GLITTER | `#34291D` | 0 | 0.4 | 0 | yes |
| CYC-0128 | STONE WASH ENAMEL | GLOSS_ENAMEL | `#A9ADB6` | 0 | 0.15 | 1 | yes |
| CYC-0129 | TEA GOLD ENAMEL | GLOSS_ENAMEL | `#3C3D35` | 0 | 0.15 | 1 | yes |
| CYC-0130 | ANTI GOLD ENAMEL | GLOSS_ENAMEL | `#333327` | 0 | 0.15 | 1 | yes |
| CYC-0131 | BLUE CERAMIC | CERAMIC | `#001D60` | 0 | 0.2 | 0 |  |
| CYC-0132 | ENAMEL EPOXY | EPOXY | `#1C1E1E` | 0 | 0.05 | 1 |  |

### Contact sheet (R7)

`reports/3c-materials.png`: the 3b six plus anti copper (CYC-0076), rose gold
(CYC-0019), brushed gold (CYC-0014), gloss black enamel (CYC-0111), matt black
enamel (CYC-0112) and, in place of gloss red enamel, **metallic red
(CYC-0123)** — the chart has no red enamel. Each cell shows the chart swatch
(`chart*` = glare row) beside the render.

### Open questions from this phase, with a recommendation each

1. **Calibrated metals render near-black, gold included.** The chart
   swatches are mirror plates photographed in a dark room, so their medians
   are dark and nearly neutral (HP GOLD `#171817`); matching a flat disc to
   them drives every family's value to 0.01–0.3 × F0. ΔE ≤ 8 holds, but the
   contact sheet shows gold, nickel and copper as dark plates, and the R1
   highlight target (met at reference F0) is no longer reached by calibrated
   nickel. *Recommend* calibrating plated families against each swatch's
   highlight (`lum_p90`), or keeping F0 physical and fitting only hue — the
   median of a mirror photo measures the room, not the metal.
2. **ΔE2000 is forgiving at very low lightness.** ANTI_BRASS renders L 4.3
   against the chart's 12.9 and still scores 5.66; ANTI_COPPER hit the
   fit's value floor (0.01). *Recommend* adding a lightness-difference
   ceiling alongside ΔE if these families are refit.
3. **No gloss red enamel exists on the chart.** The sheet uses metallic red
   (CYC-0123). *Recommend* confirming with WIN-CYC whether a red enamel code
   should be added or the sheet slot changed.
4. **Stainless steel has no glare-free chart row** (CYC-0086 is flagged);
   it is fitted to that glare row. *Recommend* a re-photographed swatch.
5. **`useProduct` selects `base_color_hex` but doesn't pass it on.** Its
   `transformProduct` maps finish fields explicitly and was outside this
   phase's "select lists only" scope, so storefront swatches still render
   from `hex_approx`. *Recommend* forwarding the field in the transform.
6. **Occlusion is baked on the main thread.** Bake time wasn't measured;
   the Polo button (~17k unique vertices × 32 rays) renders within the
   scenario's timeouts, but a denser staff upload (Phase 11) could stall the
   page. *Recommend* moving the bake into the
   Phase 6 CSG worker when it exists.

## Phase 3d — done (2026-09-17)

Supersedes 3c's per-family calibration (saturation / value / offset). Rulings
R1–R9 are in the migration header and the commit.

Files:

- `supabase/migrations/20260917230000_phase3d_hue_only_calibration.sql` —
  `finish_family_calibration` loses saturation/offsets/ΔE and gains
  `hue_shift_deg`, `chroma_scale` (≤ 1), `oxide_l`, `residual_hue_deg`,
  `residual_l`; `finishes.oxide_color_hex`; CIELAB helpers
  (`finish_linear_to_lab`, `finish_lab_to_linear`, `finish_lab_in_gamut`);
  `finish_plated_material()` / `finish_derive()` / trigger / recompute
  rewritten; the 108 plated rows recomputed (asserted), painted rows untouched.
- `src/features/finishes/metalReflectance.ts` — mirrors the new calibration
  step and the oxide colour; `FAMILY_CALIBRATION` emitted by `calibrate/refit.mjs`.
- `src/features/products/hooks/useProduct.ts` — transform forwards `base_color_hex` (R7).
- `scripts/e2e-local/calibrate/fit-families.mjs` — rewritten: R2 row
  selection, hue step (FIT), NICKEL chroma, oxide L*, APPLY, ONLY probing.
- `scripts/e2e-local/calibrate/refit.mjs` — now emits the TS block and SQL
  values from `reports/3d-family-fit.json`.
- `scripts/e2e-local/lib/calibration.mjs` — `faceStats` adds per-channel mean,
  highlight RGB and p98 L*; select adds `oxide_color_hex`.
- `scripts/e2e-local/lib/colour.mjs` — `hueOf`, `hueDifference`.
- `scripts/e2e-local/scenarios/family-calibration.mjs` — R5 assertions; ΔE dropped.
- `scripts/e2e-local/scenarios/render-calibration.mjs` — parity incl.
  `oxide_color_hex`; sheet → `reports/3d-materials.png`.
- `reports/3d-family-fit.json`, `reports/3d-materials.png`.
  (`reports/3c-family-fit.json`, `3c-materials.png` kept as the 3c record.)

### Model

After F0 / blend / variant / gun-metal bias / tone / tint (unchanged from 3c):
scale by `value` (1 except TIN), then in CIELAB (D65) keep L*, multiply chroma
by `chroma_scale`, add `hue_shift_deg` to the hue angle, and if the result
leaves linear sRGB [0,1], bisect chroma down (20 steps). L* is never moved.
Oxide (two-tone rows): L* = max(15, `oxide_l`), buffed hue, chroma scaled by
L*ₒₓ / L*buffed; `oxide_l` null → buffed × 0.25 as in 3c.

### Fit

Rows (R2): glare-free, MATT/SAND/BRUSHED if any, else all glare-free (literal
reading — CIRCLE_BRUSHED not counted as BRUSHED). Rendered colour = per-channel
mean of the disc face (the median quantises near-neutral hue). Hue is stepped
on the measured error (secant, else half step) and re-rendered to
convergence — predicting through the transfer overshoots because PBR Neutral
is cross-channel. NICKEL's chroma is the largest 0.05 step keeping the
bright-nickel highlight ≥ 240 predicted. GUN_METAL sits on 8-bit hex plateaus;
−2.5 (`#5B5D61`) was found by probing (`ONLY=GUN_METAL`). Oxide L* = chart
median L* of the family's glare-free two-tone rows, floored at 15.

Superseded by Phase 3e: the gate returns every family except ANTI_COPPER and
RED_COPPER to physical hue, and NICKEL / GUN_METAL to shift 0, chroma 1.

| Family | Rows | Hue shift | Chroma | Value | Oxide L* | Hue residual | L* − physical | Highlight L* |
|---|---|---|---|---|---|---|---|---|
| ALLOY | 2 | 58.25 | 1 | 1 | 15 | 0.03 | 0.05 | 91.4 |
| ANTI_BRASS | 1 | 23 | 1 | 1 | 15 | 0.17 | 0.15 | 49.7 |
| ANTI_COPPER | 4 | −25.25 | 1 | 1 | 15 | 0.05 | 0.08 | 79.8 |
| ANTI_SILVER | 2 | 172 | 1 | 1 | 20.74 | 1.38 | 0.08 | 95.0 |
| BLACK_COPPER | 3 | −139.75 | 1 | 1 | 15 | 0.46 | 0.22 | 85.9 |
| BRASS | 3 | 15.25 | 1 | 1 | — | 0.10 | 0.10 | 85.8 |
| GOLD | 4 | 26.25 | 1 | 1 | 15 | 0.03 | 0.17 | 84.4 |
| GUN_METAL | 1 | −2.5 | 1 | 1 | 15 | 4.28 | −0.17 | 19.9 |
| LIGHT_GOLD | 3 | 16 | 1 | 1 | — | 0.09 | −0.08 | 87.3 |
| NICKEL | 2 | −166.5 | 0.35 | 1 | 15 | 6.65 | −0.11 | 73.4 |
| RED_COPPER | 2 | −1.5 | 1 | 1 | — | 0.13 | −0.01 | 86.7 |
| ROSE_GOLD | 1 | −87.5 | 1 | 1 | — | 0.37 | 0.02 | 81.1 |
| RUSTY_STEEL | 1 | −14.75 | 1 | 1 | — | 2.40 | 0.04 | 51.2 |
| STAINLESS_STEEL | 0 | 0 (R4) | 1 | 1 | — | not fitted | 0.02 | 94.9 |
| TIN | 0 | 0 (R4) | 1 | 0.1432 | 17.81 | not fitted | 0.18 | 47.2 |

"L* − physical" compares the rendered median L* with the same rows predicted
at zero rotation through the measured transfer; the scenario also asserts each
row's base-colour L* equals its physical L* (< 0.05). Studio, calibrated bright
nickel: surround 48 (≤ 80), highlight 239 (≥ 237). Reference-F0 studio check
(render-calibration): 50 / 238.

**Stainless steel:** physical iron, no fit; the only chart row (CYC-0086) is
glare-flagged — the swatch needs re-photographing.

### Open questions from this phase, with a recommendation each

1. **Hue from dark mirror photos moves metals off their own colour.** Chart
   chroma is 0.7–8 for every plated family, so its hue is the room's tint as
   much as the metal's: gold and brushed gold render lime, rose gold mauve,
   anti brass olive-green, nickel faintly blue (see `reports/3d-materials.png`).
   *Recommend* fitting hue only where chart chroma ≥ ~5 (RED_COPPER, BRASS,
   ROSE_GOLD's row) and leaving the rest physical, or fitting from
   re-photographed swatches under neutral light.
2. **`oxide_color_hex` is not yet rendered.** `lib/twoTone.ts` still mixes to
   base × 0.25; wiring it needs `useFinishOptions`, `EditorModel` and
   `twoTone.ts` (outside this phase's scope). *Recommend* a small follow-up
   passing it as the oxide uniform.
3. **`types.ts` is stale** for `finish_family_calibration` and
   `finishes.oxide_color_hex`. *Recommend* `npm run e2e:types` in the next
   phase with it in scope.
4. **R7 forwards the field but the storefront swatch component wasn't read.**
   `ProductFinish` (`products/types.ts`, out of scope) lacks
   `base_color_hex`; widened locally in `useProduct`. *Recommend* adding it to
   the type and confirming the storefront swatch prefers it.

## Phase 3e — done (2026-09-18) · 3-series closed

Supersedes 3d's hue fit wherever the chroma gate rules it out. Rulings in the
migration header and the commit.

Files:

- `supabase/migrations/20260918090000_phase3e_chroma_gated_calibration.sql` —
  `finish_family_calibration.chart_chroma`; values rewritten; the 108 plated
  rows recomputed (count asserted), painted rows untouched. Derivation
  unchanged from 3d.
- `src/features/finishes/metalReflectance.ts` — `FAMILY_CALIBRATION` regenerated.
- `src/features/editor/lib/twoTone.ts` — oxide is the row's `oxide_color_hex`
  (fallback base × 0.25 only when null).
- `src/features/editor/components/EditorModel.tsx` — passes
  `oxide_color_hex` to `applyTwoTone`. `useFinishOptions` selects `*`, so the
  column reaches `PickerFinish` through the regenerated `Row` type; no change.
- `src/integrations/supabase/types.ts` — regenerated.
- `src/features/products/types.ts` — `ProductFinish` gains `base_color_hex`,
  `oxide_color_hex`.
- `src/features/products/hooks/useProduct.ts` — selects and forwards both;
  local type widening removed.
- `scripts/e2e-local/calibrate/fit-families.mjs` — CIRCLE_BRUSHED counts as
  BRUSHED; hue gate; physical-hue prediction through the stored 8-bit hex;
  nickel chroma fit removed; output `reports/3e-family-fit.json`.
- `scripts/e2e-local/calibrate/refit.mjs` — reads the 3e report, emits `chart_chroma`.
- `scripts/e2e-local/scenarios/family-calibration.mjs` — gated assertions (below).
- `scripts/e2e-local/scenarios/render-calibration.mjs` — sheet → `reports/3e-materials.png`.
- `reports/3e-family-fit.json`, `reports/3e-materials.png`.

### Gate

Hue is fitted only when the median CIELAB C* of the family's R2 rows
(glare-free; MATT / SAND / BRUSHED / CIRCLE_BRUSHED preferred) is **≥ 7**.
Ruled 7, not the brief's 5: at 5, GOLD (C* 5.23) and ROSE_GOLD (6.68) passed
and their fits (+26.25°, −87.25°) rendered gold lime and rose gold mauve,
failing the contact-sheet ruling. Below the gate: hue shift 0, chroma 1.

**Fitted:** ANTI_COPPER, RED_COPPER.
**Physical:** ALLOY, ANTI_BRASS, ANTI_SILVER, BLACK_COPPER, BRASS, GOLD,
GUN_METAL, LIGHT_GOLD, NICKEL, ROSE_GOLD, RUSTY_STEEL, STAINLESS_STEEL (R4,
glare-only), TIN (R4, value 0.1432 kept).

| Family | Chart C* | Hue | Shift | Hue vs chart | Hue vs physical | L* − physical | Highlight L* | Oxide L* |
|---|---|---|---|---|---|---|---|---|
| ALLOY | 3.13 | physical | 0 | — | 0 | 0 | 93.3 | 15 |
| ANTI_BRASS | 4.29 | physical | 0 | — | 0 | 0 | 49.5 | 15 |
| ANTI_COPPER | 9.30 | fitted | −12.5 | 1.09 | — | 0.07 | 45.5 | 15 |
| ANTI_SILVER | 1.42 | physical | 0 | — | 0 | 0 | 96.5 | 20.74 |
| BLACK_COPPER | 4.61 | physical | 0 | — | 0 | 0 | 86.2 | 15 |
| BRASS | 6.36 | physical | 0 | — | 0 | 0 | 85.0 | — |
| GOLD | 5.23 | physical | 0 | — | 0 | 0 | 82.7 | 15 |
| GUN_METAL | 1.99 | physical | 0 | — | 0 | 0 | 19.9 | 15 |
| LIGHT_GOLD | 3.08 | physical | 0 | — | 0 | 0 | 86.0 | — |
| NICKEL | 4.07 | physical | 0 | — | 0 | 0 | 73.6 | 15 |
| RED_COPPER | 8.67 | fitted | −1.5 | 0.13 | — | 0.30 | 86.7 | — |
| ROSE_GOLD | 6.68 | physical | 0 | — | 0 | 0 | 81.8 | — |
| RUSTY_STEEL | 1.41 | physical | 0 | — | n/a (rendered C* 0.8) | 0 | 51.3 | — |
| STAINLESS_STEEL | 1.63 | physical | 0 | — | 0.01 | 0 | 94.9 | — |
| TIN | 1.37 | physical | 0 | — | n/a (rendered C* 0) | 0 | 47.2 | 17.81 |

`family-calibration.mjs` asserts: fitted families ≤ 8° from the chart;
physical families have shift 0, chroma 1, and rendered hue within 1° of the
physical prediction (the same rows at zero shift through the measured transfer
and the stored 8-bit hex — skipped where rendered C* < 1, where hue is
undefined); every family's L* within 5 of physical and each base colour's L*
equal to physical; GOLD / LIGHT_GOLD highlight ≥ 70; calibrated bright nickel
surround ≤ 80 and highlight ≥ 237 (50 / 238). At zero shift the physical-hue
check mostly confirms the prediction reproduces the render; the shift/chroma
assertions carry the ruling.

### Storefront swatch (R4)

`ProductFinish` now carries `base_color_hex` and is forwarded by `useProduct`.
The storefront component is `src/components/product/ProductColourFinish.tsx`
(singular `product/`, outside this phase's read scope; `src/components/products/`
has no swatch component). It imports the shared swatch module, whose
`finishSwatchSvg` / `FinishSwatch` use `base_color_hex ?? hex_approx`; that the
component passes the finish object through unmodified is not verified here.

### Contact sheet (R6)

`reports/3e-materials.png`: gold and brushed gold read gold; nickel neutral
(physical nickel, slightly warm); anti brass warm bronze with dark oxide in the
recesses; anti copper copper with dark recesses. Rose gold reads peach-gold
rather than pink-copper — see open question 1.

### Open questions from this phase, with a recommendation each

1. **Rose gold is peach-gold, not pink-copper.** Physical rose gold is 3b's
   gold → copper blend at t = 0.5. *Recommend* raising the blend toward copper
   (t ≈ 0.7) as a physical-model change, judged on the sheet, rather than a
   chart hue fit.
2. **Storefront swatch component not read.** *Recommend* granting read access
   to `src/components/product/ProductColourFinish.tsx` to confirm it passes the
   `ProductFinish` object to the shared swatch without remapping colour fields.
3. **Oxide L* floors at 15 for most families.** Every chart antique median is
   darker than 15, so the floor sets the oxide nearly everywhere (ANTI_SILVER
   20.74, TIN 17.81 excepted). *Recommend* leaving it; the recesses read dark
   on the sheet.

## Phase 4.0 — done (2026-09-18)

Carried finish items from reports/E1-plan-integration.md §5 (unit 4.0), §8
rulings. Physical-model changes only; `finish_family_calibration`'s values
are untouched.

Files:

- `supabase/migrations/20260918100000_phase4_0_carried_finish_items.sql` —
  `finish_plated_material()`: ROSE_GOLD's gold→copper blend moves t 0.5 → 0.7
  (3e open question 1); two-tone rows' buffed layer darkens to L* = 0.7 ×
  physical, chroma scaled in the same proportion, hue kept — scale-invariant,
  so the oxide layer's own chart-derived target L* is unaffected. The 108
  plated rows recomputed (count asserted); painted rows untouched.
- `src/features/finishes/metalReflectance.ts` — `BASE_FAMILY.ROSE_GOLD.blend.t`
  → 0.7; `physicalPlatedLinear` (the pre-darkening physical colour, exported
  for calibration checks) and `platedLinear` (the stored colour: physical
  plus the two-tone darkening) split out; `isTwoTonePlated` and
  `TWO_TONE_BUFFED_L_SCALE` exported. `oxideLinear` unchanged — its
  buffed/target-L* ratio math is invariant to the darkening.
- `scripts/e2e-local/scenarios/family-calibration.mjs` — asserts ROSE_GOLD's
  stored rows match the TS mirror at t 0.7; two-tone rows' base L* = 0.7 ×
  physical ± 0.05, non-two-tone rows still equal physical; the oxide layer
  still hits its calibration target L* after the buffed darkening.
- `scripts/e2e-local/scenarios/render-calibration.mjs` — DB/TS parity check
  (unchanged logic) now covers both changes; contact sheet →
  `reports/4-materials.png` (the same 3e twelve cells).
- `reports/4-materials.png`.
- `docs/3d-editor/STATUS.md` — this file.

### Rulings

R1/R2 are given directly in reports/E1-plan-integration.md §5 row 4.0 and
recorded in the migration's header comment; not duplicated here.

### Open questions from this phase

None — 3e open question 1 (rose gold hue) is closed by R1.

## Phase 4a — done (2026-09-18)

`products` scale schema and CMS confirmation, per
reports/E1-plan-integration.md §3.1, §5 (unit 4a) and
wincyc-3d-editor-units-and-recovery-rulings.md §1. Two-point calibration and
the 3D preview are Phase 4c — no placeholder was added for them (rulings §6).

Files:

- `supabase/migrations/20260918110000_phase4a_model_scale.sql` — `products`
  gains `model_scale_factor`, `model_scale_status`
  (`confirmed`/`unconfirmed`, default `unconfirmed`), `model_scale_method`
  (`unit_mm`/`known_dimension`/`two_point`), `model_scale_reference_variant_id`,
  `model_raw_bounds` (jsonb: raw AABB, face axis, primary raw dimension),
  `model_scale_confirmed_at`/`_by`, `model_branding_groups` (Phase 4d),
  `model_branding_reference` (Phase 4d); check constraints; a
  before-update-of-`model_storage_path` trigger resets confirmation/method/
  marks on a new or removed file (collision 13); `design_versions.snapshot`'s
  comment extended to name the scale fields a version now needs to freeze
  (collision 11). **Deviation from E1 §3.1 as written** — see Q1 below.
- `src/integrations/supabase/types.ts` — regenerated (`npm run e2e:types`).
- `src/features/admin/lib/objBounds.ts` (new) — `OBJLoader.parse` on raw
  text (no viewer): raw AABB, face axis (the thinnest extent) and primary raw
  dimension (E1 collision 4); `proposeScaleFactor` (C2: 1 within 2%, else
  `referenceMm / primaryRawMm`, unrounded).
- `src/features/admin/hooks/useProductModel.ts` — upload parses the file
  after a successful storage write and includes `model_raw_bounds` in the
  same row update as `model_storage_path` (collision 12); new
  `useProductModelScale` — the product's scale state, its size variants, and
  the two write paths (`confirmUnitScale`, `calibrateKnownDimension`).
- `src/components/admin/product-editor/ProductModelEditor.tsx` — scale panel:
  raw dimensions, reference-variant picker (Q2: defaults to the default
  variant), the C2 proposal with its residual or full-precision factor,
  Confirm / Calibrate by known dimension / leave unconfirmed, "Scale:
  Confirmed"/"Scale: Unconfirmed" status (spec §8). Fully localised (Q6).
- `src/features/i18n/adminTranslations.ts` — `admin.model.scale.*`, 19 keys
  × 3 languages.
- `scripts/e2e-local/scenarios/cms-model-scale.mjs` (new) — uploads the Polo
  fixture to a product with a 15.00 mm and a 10.8 mm size variant: proposal 1
  → Confirm → read-back `confirmed`/`1`/`unit_mm`; replace the file →
  read-back `unconfirmed`, factor null, branding groups `[]`; switch the
  reference variant to 10.8 mm → proposal ≈ 0.720193 at full precision →
  Calibrate by known dimension → read-back `confirmed`/`0.720193 ± 1e-6`/
  `known_dimension`.
- `docs/3d-editor/STATUS.md` — this file.

### Rulings

R1–R5 are given directly in reports/E1-plan-integration.md's task and §3.1,
and recorded in the migration's header comment; not duplicated here, except:

- **Q1 (calibration surface).** Ruled: the CMS only. `ProductModelEditor` is
  the one write path; the buyer editor (Phase 4b) will show catalogue
  editors a link back here rather than its own controls.
- **Q2 (reference variant).** Ruled: `model_scale_reference_variant_id`
  defaults to the product's default (`is_default`) size variant, editable in
  the scale panel's picker before confirming or calibrating.
- **Q6 (admin i18n).** Ruled in scope: the scale panel has no hardcoded
  English — every string is in `adminTranslations.ts` across all three
  languages.

### Open questions from this phase, with a recommendation each

1. **`model_scale_reference_variant_id` is not a foreign key, contrary to
   E1 §3.1's literal SQL.** Verified live against the local stack: with the
   FK in place, `products` has two relationship paths to
   `product_size_variants` (the existing `product_size_variants.product_id`
   and the new column), and PostgREST returns `300 Multiple Choices` for
   every existing unqualified `product_size_variants(...)` embed — including
   the buyer editor's own product query, which then shows "Product not
   found" for every product. None of the affected call sites
   (`useEditorProduct.ts`, the storefront product hook, other CMS queries)
   were in this phase's edit scope. *Recommend* keeping the plain-uuid
   column with the compensating delete trigger (as shipped) rather than
   qualifying every embed with an explicit FK-name hint across files this
   phase couldn't touch; a future phase with those files in scope could
   requalify the embeds and restore the formal FK if the guarantee is worth
   it.
2. **Confirmed rows have no re-calibrate path in the panel.** Once
   `model_scale_status = 'confirmed'`, the panel only displays the stored
   factor/method — there's no button to redo the confirmation with a
   different variant or method short of replacing the file (which resets
   it). *Recommend* deciding in Phase 4c whether re-calibration belongs
   alongside two-point calibration, since it's the same "already confirmed"
   state that needs a way back in.
3. **`model_raw_bounds` parse failures are a hard upload error.** If
   `OBJLoader.parse` throws on a malformed file, the storage object is
   already written (recoverable orphan, matching the upload/remove pattern)
   but the row update is not attempted. *Recommend* confirming this is the
   wanted failure mode — the alternative is writing the row with
   `model_raw_bounds: null` and surfacing the scale panel's "raw bounds
   unavailable" state instead of a toast error.

## Phase 4b — done (2026-09-18)

Editor reads the stored scale instead of force-rescaling, per
reports/E1-plan-integration.md §5 (unit 4b), collisions 1/3/5/6/7/8.

Files:

- `src/features/editor/components/EditorModel.tsx` — the force-rescale block
  (`clone.scale.setScalar(sizePrimaryMm / rawDiameter)`) is gone. New props
  `scaleFactor` (`products.model_scale_factor`) and `variantScale`
  (`variantMm / referenceMm`); the model's scale is `scaleFactor *
  variantScale`. `sizePrimaryMm` is kept only for the ruler (Phase 4e) and no
  longer drives scaling. New `onModelSizeMm` callback reports the rendered
  primary dimension (`max(rawSize.x, rawSize.y) * scale`) so the viewport can
  expose `data-model-size-mm`.
- `src/features/editor/components/EditorViewport.tsx` — new props
  `scaleStatus`, `scaleFactor`, `variantScale`, `productId`,
  `isCatalogueEditor`. A model with `scaleStatus !== 'confirmed'` (or no
  factor) renders the new `AwaitingSetupState` — same empty-state shape as
  "no model", no canvas — instead of the canvas; a catalogue editor also
  sees a link to the product's CMS page (Q1: the CMS is the only write
  surface). `data-model-size-mm` is set on the viewport container from
  `EditorModel`'s callback.
- `src/features/editor/hooks/useEditorProduct.ts` — `EDITOR_PRODUCT_SELECT`
  and `EditorProduct` add `model_scale_status`, `model_scale_factor`,
  `model_scale_reference_variant_id`.
- `src/features/editor/pages/EditorNewPage.tsx` — the signed-in `designs`
  insert effect now checks `product.model_scale_status === 'confirmed'`
  before firing (collision 6: refusal happens *before* any insert); the page
  renders the shell (with `AwaitingSetupState` inside the viewport) for
  unconfirmed products whether signed in or not, instead of an unconditional
  `LoadingShell` for every signed-in visit. Computes `variantScale` from the
  selected size against the reference variant (falling back to the selected
  variant itself if the reference id doesn't resolve). Uses
  `useCatalogueEditorStatus` (admin hook) for the CMS link.
- `src/features/editor/pages/EditorDesignPage.tsx` — same `variantScale`
  computation and new `EditorViewport` props; no insert-guard needed (the
  design already exists).
- `src/features/i18n/translations.ts` — `editor.viewport.awaitingSetup*` (3
  keys × 3 locales); the exact copy is rulings §1.2's line, "This product's
  3D model is awaiting setup."
- `scripts/e2e-local/lib/calibration.mjs` — `stageProduct` now parses the
  staged file's own raw bounds (`parseObjRawBounds`) and sets a confirmed
  scale (`factor = variantMm / primary_raw`, reference variant = the one it
  creates) in a **second, separate** `products` update; `pickProducts`'
  select gains the `model_scale_*` columns so `restore()` can reset them.
- `scripts/e2e-local/scenarios/editor-shell.mjs` — stages a confirmed scale
  (own size variant + factor 1) the same way, so the Phase 2 smoke test
  isn't blocked by the buyer refusal.
- `scripts/e2e-local/scenarios/finish-picker.mjs` — `publish()` takes a
  `referenceVariantId` (the size variant the scenario already seeds) and
  confirms the scale in a second update.
- `scripts/e2e-local/scenarios/editor-scale.mjs` (new) — R5's proof: unconfirmed
  → anonymous and signed-in both see `editor-awaiting-setup`, no canvas, and
  (signed-in) no `designs` row; confirm at the Polo's factor (0.720193) →
  `data-model-size-mm` = 10.80 ± 0.01 at the 10.8mm reference variant, 15.00 ±
  0.01 after switching to a 15mm variant.
- `docs/3d-editor/STATUS.md` — this file.

### Collision-8 pitfall found while staging: two updates, not one

`products_reset_model_scale` (Phase 4a) is a `before update of
model_storage_path` trigger that unconditionally resets
`model_scale_status`/`factor`/`method` to unconfirmed **whenever
`model_storage_path` is among the columns in that same `UPDATE` statement**,
regardless of other values the same statement tries to write. Every staging
helper that both set the model path and confirmed the scale in one `.update()`
call had its confirmation silently clobbered back to `unconfirmed` — caught
because `editor-shell.mjs` initially failed the *anonymous* canvas check (no
buyer-refusal-related assertion at all) after passing every column back at
`unconfirmed`. Fixed by splitting every such call into two sequential
updates: file path first, confirmation second. This is a real,
by-design trigger behaviour (collision 13 wants a new file to never inherit
scale), not a bug — the pitfall is only in staging code that assumed one
`UPDATE` could do both.

### Open questions from this phase, with a recommendation each

1. **`referenceVariant` fallback when the id doesn't resolve.** If
   `model_scale_reference_variant_id` doesn't match any of the product's
   current `size_variants` (e.g. a stale id after a variant was deleted —
   not reachable through the CMS today, since deleting a size variant this
   phase's scope doesn't touch), both pages fall back to treating the
   *selected* variant as its own reference (`variantScale = 1`). *Recommend*
   confirming this is acceptable — the alternative is showing the
   awaiting-setup state, which would make a variant deletion silently
   re-block an otherwise-confirmed product.

## Phase 4c — done (2026-09-18)

CMS model preview and two-point calibration, per
reports/E1-plan-integration.md §5 (unit 4c), collision 14, risk R15, and
spec §17.

Files:

- `src/components/admin/product-editor/ProductModelPreview.tsx` (new) — the
  lazy-loaded (`React.lazy`) R3F preview: `prepareModel`'s normal smoothing
  and decorated-face rotation only (no material/camera/occlusion logic from
  the buyer `EditorModel`), no scale applied (raw OBJ units, so two-point
  picks measure raw distance directly). A straight-on camera (`(0, 0, 1)`
  direction — a 3/4 view would foreshorten whichever screen axis isn't
  facing it, which a two-point pick can't afford) auto-frames the model's
  actual vertex silhouette (not its AABB's corners — a round part reaches
  nowhere near its box diagonal) to fill 95% of the frustum. Clicking (only
  while `picking`) reports the raycast hit point; two red markers show the
  picked points.
- `src/components/admin/product-editor/ProductModelEditor.tsx` — "Show/Hide
  3D preview" toggle (mounts `ProductModelPreview` only when opened, per
  R15); a third calibration path, "Calibrate by two points", alongside
  Confirm / Calibrate by known dimension — shows Point A/B selection status,
  the measured OBJ-unit distance once both are picked, an mm input, Apply /
  Clear; "Mark as unconfirmed" next to a confirmed factor (4a Q2's
  re-calibration path — flips `model_scale_status` back without touching the
  file or the stored factor/method, which stay as history until overwritten).
- `src/features/admin/hooks/useProductModel.ts` — `upload` now deletes the
  storage object on a raw-bounds parse failure instead of leaving it
  orphaned (4a Q3, ruled here: the file itself is unusable, so nothing
  recoverable is worth keeping); new `calibrateTwoPoint` (factor =
  knownMm / measuredRaw, method `two_point`) and `markUnconfirmed` mutations
  on `useProductModelScale`.
- `src/features/i18n/adminTranslations.ts` — `admin.model.scale.*` preview/
  two-point/mark-unconfirmed keys (17 new), × 3 languages.
- `scripts/e2e-local/scenarios/cms-two-point.mjs` (new) — uploads the Polo
  fixture, opens the preview, finds the model's actual rendered silhouette
  from a screenshot (not a reproduction of R3F/OrbitControls' camera math in
  Node — a probe run showed that landing a pixel or two off the true edge,
  enough to miss the mesh), clicks progressively further in from each edge
  until the pick registers, enters 10.8mm, applies → read-back
  `confirmed`/`two_point`/factor within tolerance of `10.8 / 14.995973`.

### Deviation from E1 §5 unit 4c: two-point tolerance widened to 1.5%

The unit's proof calls for "measured raw ≈ 14.996 ± 0.05" (0.3%). The Polo's
rim is a real 3D bevel, not a knife edge: the true widest point is a grazing
silhouette with no clickable surface behind it from *any* camera angle, so
every viable click lands a little way onto the curve. Measured through the
real preview at several resolutions and camera framings, that shortfall is
consistently 0.1–0.15 raw units and does not shrink with more screen
resolution — it is the fixture's geometry, not click precision or a camera
math error (both were independently checked and ruled out first). The
scenario's tolerance is widened to 1.5% (relative, on both the measured
distance and the resulting factor) to absorb it; `RIM_TOLERANCE` in the
scenario file documents this. *Recommend* accepting 1.5% as the realistic
bound for any round or bevelled part, rather than re-tightening it — a
future fixture with a sharp (non-bevelled) edge would not need it relaxed.

### Open questions from this phase, with a recommendation each

1. **"Mark as unconfirmed" keeps the old factor/method/reference variant.**
   Only `model_scale_status`/`model_scale_confirmed_at`/`_by` are cleared —
   the previous factor stays visible/usable until a new Confirm/Calibrate
   overwrites it. *Recommend* keeping this: it lets staff see what the last
   confirmation was while re-calibrating, and the buyer editor already
   refuses on `status`, so a stale factor sitting unconfirmed is never
   served.
2. **Preview camera is fixed straight-on, not the buyer viewport's
   three-quarter framing.** Two-point accuracy ruled this (any tilt
   foreshortens screen-space distance), so the CMS preview intentionally
   looks different from the buyer editor. *Recommend* leaving them
   independent — a shared camera-framing helper was considered but not
   extracted, since `EditorModel`'s buyer framing has its own calibrated
   pixel-parity tests (3b–4.0) that a shared abstraction would put at risk
   for no benefit here.

## Phase 4d — done (2026-09-18)

Branding group marks and geometry recovery, per reports/E1-plan-integration.md
§5 row 4d, §3.2, C8, C9, C11 and addendum §3, §14, §17–§18.

Files:

- `src/features/admin/lib/brandingRecovery.ts` (new) — pure functions over an
  unrotated OBJ root (no React; Phase 11 reuses it): `listModelGroups`
  (index, name, vertex count in file order); `rawFaceFrame` (face normal and
  12 o'clock from `decoratedFaceRotation` on the full model, inverted into the
  raw frame — C8, collision 10); `kasaCircleFit`; `fitTextPath`; `coveringArc`;
  `measureRelief` (three-mesh-bvh raycasts both ways along each top-facing
  marked vertex's normal against the unmarked body, nearer hit, signed,
  10th–90th percentile band median — C11); `confidenceFor` (§3.2 1% / 3%);
  `analyseBranding` → the §3.2 `model_branding_reference` shape, with
  `reference: null` on low confidence (C9). Imports `prepareModel.ts`
  relatively with its extension so Node scripts can load it.
- `src/features/admin/hooks/useModelGroups.ts` (new) — fetches and parses the
  OBJ only when the group list is opened; `brandingRecovery` and MeshBVH are
  dynamic imports (own chunks — the admin chunk doesn't carry them).
- `src/features/admin/hooks/useProductModel.ts` — `useProductBranding`: reads
  `model_branding_groups` / `model_branding_reference`, writes both together.
- `src/components/admin/product-editor/ProductBrandingMarks.tsx` (new) —
  catalogue editors only (`useCatalogueEditorStatus`): group list (index,
  name, vertex count), click toggles, Shift-click applies to the range from
  the last click; "Analyse branding" analyses and saves marks + reference in
  one action; result block (radius, start → end, direction, text height,
  relief, confidence, fit RMS) in raw units and mm at the confirmed factor
  (raw only, with a one-line note, while unconfirmed), labelled "Recovered
  from geometry"; low confidence shows one line and no stored reference.
- `src/components/admin/product-editor/ProductModelEditor.tsx` — mounts the
  panel, holds the marked set, opens the preview with the group list; the
  two-point measured line and a `two_point` factor show "measured to ±1.5%"
  (4c Q3).
- `src/components/admin/product-editor/ProductModelPreview.tsx` —
  `highlightIndices`: marked groups render in amber.
- `src/features/i18n/adminTranslations.ts` — `admin.model.branding.*` (26
  keys) and `admin.model.scale.twoPointPrecision`, × 3 languages.
- `scripts/e2e-local/unit/branding-recovery.test.mjs` (new) — `node --test`:
  exact Kåsa circle; band median; confidence thresholds; covering arc across
  0°; group listing; a synthetic plate with eight radial glyphs on radius 5
  over a 120° clockwise span, 0.35 raised → radius within 1%, start/end within
  0.5°, direction cw, text height ±0.05, relief exact, confidence high;
  reversed glyph order → ccw with start/end swapped; recessed glyphs → −0.3;
  glyphs pulled off the circle → low, reference null; fewer than three
  groups → low.
- `scripts/e2e-local/scenarios/cms-branding-marks.mjs` (new) — Polo upload,
  33 groups listed, object_6 + Shift-click object_33 → read-back 28
  `{index, name}` marks, `radius_raw` 5.048 (5.04 ± 0.05), confidence high,
  RMS 0.043, relief 0.30 (see Q1), mm shown at the stored factor; clear and
  mark object_1 + object_3 → read-back 2 marks, reference null, low-confidence
  line shown.
- `scripts/e2e-local/README.md` — how to run the unit tests.
- `docs/3d-editor/STATUS.md` — this file.

### Rulings

R1–R7 are given in the 4d task; recorded here as implemented:

- **Marks and reference are written together.** A reference is only ever the
  analysis of the marks saved beside it, so "Analyse branding" is the one
  write; there's no separate "save marks" that could leave a stale reference.
- **Text path model (R2).** A vertex-level Kåsa fit on lettering scores the
  glyphs' own radial height as fit error (Polo: RMS 0.63, 12% of radius — low
  for any real text). `fitTextPath` seeds Kåsa from glyph bounding-box
  centres, then refits on each glyph's radial centroid (mean vertex radius on
  its mean bearing). `fit_rms_raw` is the RMS of how far the fitted path runs
  *outside* each glyph's own radial span — zero for glyphs the path passes
  through, growing for glyphs off any common circle. §3.2's 1% / 3% bounds
  apply to that. A circle needs ≥ 3 marked groups, and a radius larger than
  the part's face is treated as not a text circle (near-collinear glyphs).
- **Angles.** 0° = `angle_zero_raw` (the oriented model's +Y), clockwise
  viewed from `face_normal_raw`. Start/end are the smallest arc covering every
  marked vertex, ordered by reading direction; direction is the sign of the
  summed glyph-to-glyph steps in file order.
- **Text height** is the median glyph radial extent; **centre_raw** lies in
  the face plane at the marked vertices' median height along the normal.

### Open questions from this phase, with a recommendation each

1. **Polo relief measures 0.30 raw units, not E1's 0.5 ± 0.1.** Addendum §14
   defines relief as branding top surface to the underlying model surface
   along the local normal. The Polo's glyph caps top out at ≈ 3.97 on the face
   axis; the face plate under them (object_5) is at ≈ 3.67 (checked by
   downward raycasts at five glyph centres). 0.5 is the glyph solids' own
   extrusion (caps to wall bottoms at ≈ 3.40), ≈ 0.27 of which is buried
   below the face. The scenario asserts 0.30 ± 0.1. *Recommend* keeping the
   §14 surface definition — it is what a buyer sees and what a deboss/emboss
   depth is compared against — and correcting E1's 0.5 (and addendum §18's
   `reliefRaw = 0.50` example) rather than measuring buried extrusion.
2. **Polo reads `ccw` with all 28 groups marked.** The Polo mixes top text,
   bottom text and separators on one ring, so file order doesn't follow one
   reading direction. *Recommend* marking top and bottom text as separate
   references once Phase 4j needs per-arc defaults (the schema holds one
   reference today).
3. **Group marking is list-only.** Capabilities §3A makes viewport click the
   primary selection method, but the preview's click is already two-point
   picking. *Recommend* adding viewport click-to-mark in Phase 11's scene
   tree, where selection gets its own mode, rather than overloading the CMS
   preview's click now.

### Phase 4e rulings on the above (2026-09-18)

Given directly in the 4e task, closing this phase's three open questions:

- **Q1 ruled: relief is per addendum §14 (surface to surface), 0.30 on the
  Polo.** E1's 0.5 ± 0.1 is corrected to that definition; `cms-branding-marks.mjs`
  keeps asserting 0.30 ± 0.1.
- **R2's per-glyph radial scoring is ratified** as the text-path fit model —
  not a local interpretation pending confirmation.
- **Q2 ruled: one reference per product, not one per arc.** When Phase 4j
  needs a default and the marked groups don't share one reading direction (the
  Polo's top/bottom mix), it defaults to clockwise and the largest angular
  cluster, rather than this phase splitting into separate top/bottom
  references. No schema change follows from this — `model_branding_reference`
  stays singular.
- **Q3 ruled: click-to-mark is deferred to Phase 11.** The CMS group list
  stays the only way to mark groups through this phase.

## Phase 4e — done (2026-09-18)

Ruler toggle (buyer scope) and "Measure file" (CMS), per
reports/E1-plan-integration.md §5 row 4e, collisions 16–19, C4, C5.

Files:

- `src/features/editor/components/MeasurementLine.tsx` — **deleted**
  (collision 16); its content (`tradeLigne`, R3 label suppression) moves into
  the ruler overlay's diameter label, unchanged.
- `src/features/editor/components/EditorShell.tsx` — the `measurement` slot
  is gone; the shell is `banner` / `viewport` / `panel` only.
- `src/features/editor/components/RulerToggle.tsx` (new) — the one corner
  control (collision 17: a single tool, not a toolbar), off by default, in
  the viewport, never the panel.
- `src/features/editor/components/RulerOverlay.tsx` (new) — diameter (the
  larger in-face axis, with the ligne suffix per the trade-size rule) and
  thickness, from `EditorModel`'s own model-local bounds × factor ×
  variantScale (C4) — never a fresh `Box3` on the attached scene. Lines are
  drei's `Line` (`Line2`/`LineMaterial`, screen-space pixel width by default)
  with small end-tick marks; labels are drei's `Html` (CSS px, real DOM — so
  already outside any WebGL raycast/bake/export by construction). The whole
  group and its `Line2` children go on render layer 1: the main camera
  enables layer 1 so it's visible, but `ContactShadows`' own orthographic
  shadow camera and the default `Raycaster` both stay on layer 0 by
  three.js's own default, excluding the ruler from both (C5) without extra
  plumbing. Line children get a no-op `raycast` as a second guard. Never
  geometry — nothing here is added to the measured model.
- `src/features/editor/components/EditorModel.tsx` — new
  `onRulerMeasurements` callback (diameter, thickness, min/max per axis in
  mm) fired from the same `bounds` the camera-framing effect already
  computes; `onModelSizeMm` (Phase 4b) is unchanged.
- `src/features/editor/components/EditorViewport.tsx` — owns
  `RulerMeasurements` state, mounts `RulerOverlay` only while `ruler` is true
  and measurements have arrived, renders `RulerToggle` unconditionally
  wherever the canvas renders.
- `src/features/editor/store/useEditorStore.ts` — `ruler: boolean` + `setRuler`,
  included in `initialize`.
- `src/features/editor/lib/anonymousDraft.ts` — `AnonymousDraft.ruler`.
- `src/features/editor/hooks/useAutosaveDraft.ts` — `DraftRecipe.view?.ruler`;
  an absent `view` (every pre-4e row) reads as off.
- `src/features/editor/pages/EditorNewPage.tsx` / `EditorDesignPage.tsx` —
  read `ruler` from the anonymous draft / `draft_recipe.view.ruler` on load,
  write it on every change (anonymous: sessionStorage; signed-in: autosave),
  and the signed-in claim writes `view: { ruler }` from the anonymous draft
  into the new design's `draft_recipe` at creation.
- `src/features/i18n/translations.ts` — `editor.ruler.toggle`, × 3 locales.
- `src/features/admin/hooks/useProductModel.ts` — `measureExistingFile`
  (Phase 4e R3): downloads the already-stored `.obj` and parses it in place
  with `objBounds.ts`, writing `model_raw_bounds` without touching
  `model_storage_path` — so it never trips `products_reset_model_scale`.
- `src/components/admin/product-editor/ProductModelEditor.tsx` — "Measure
  file" beside Replace/Remove, shown only when a model exists and
  `model_raw_bounds` is null (no placeholder otherwise); once it succeeds the
  existing scale panel appears unchanged.
- `src/features/i18n/adminTranslations.ts` — `admin.model.scale.measureFile` /
  `.measured`, × 3 locales.
- `scripts/e2e-local/lib/calibration.mjs` — `subjectBox` excludes the
  bottom-right 15% corner of the screenshot before scanning for non-background
  pixels (see Q1 below).
- `scripts/e2e-local/scenarios/ruler-buyer.mjs` (new) — every read-back E1
  lists.
- `scripts/e2e-local/scenarios/finish-picker.mjs` — the two
  `/\d+(\.\d+)?\s*mm/` body-text assertions (collision 18, now vacuous) are
  replaced with `ruler-toggle` presence checks; its staging's two-write split
  (path, then scale) is unchanged from 4b.
- `scripts/e2e-local/scenarios/cms-model-scale.mjs` — a fourth case: null out
  `model_raw_bounds` directly (simulating a pre-4a upload) → no scale panel →
  "Measure file" → read-back bounds parsed, `model_storage_path` unchanged.
- `docs/3d-editor/STATUS.md` — this file.

### Rulings

R1–R5 are given directly in the 4e task; recorded here as implemented. R6's
4d corrections are recorded above, in Phase 4d's own section.

- **Diameter axis.** `RulerOverlay` draws the diameter line along whichever
  in-face axis (`x` or `y`) is actually larger, matching `diameterMm =
  max(sizeX, sizeY)` — for a round part the two are equal in practice, but
  the line and the label always describe the same measurement.
- **Layers, not conditional rendering, keep the ruler out of bakes/raycasts.**
  Three.js's own defaults (camera, `Raycaster`, and any freshly constructed
  camera such as `ContactShadows`' shadow camera, all start on layer 0 only)
  do the exclusion; the ruler group only needs to opt itself onto layer 1 and
  the main camera to opt into seeing it.

### Open questions from this phase, with a recommendation each

1. **A permanent corner UI element breaks canvas-screenshot calibration.**
   The ruler toggle is the second time a viewport overlay has leaked into a
   `canvas.screenshot()` (the first was a toast, in `cms-two-point.mjs`,
   Phase 4c) — a `canvas` element screenshot composites whatever is drawn on
   top of it on the page, DOM or WebGL. `subjectBox`'s new corner exclusion
   fixes today's case (`render-calibration.mjs`, `family-calibration.mjs`)
   but is specific to where this one button sits. *Recommend* that any future
   permanent viewport chrome (Phase 4h/4i's controls, Phase 11's toolbar)
   check against the calibration suite before landing, since nothing
   currently guards this class of regression generically.
2. **"Canvas mesh count unchanged" was proven indirectly.** No hook exists to
   count meshes in the live R3F scene from Playwright; `ruler-buyer.mjs`
   instead asserts `data-model-size-mm` (derived from `EditorModel`'s own
   mesh bounds) is bit-identical with the ruler on and off. *Recommend*
   accepting this as sufficient — the ruler's only three.js objects are
   `Line2` instances added as siblings of, never children of, the measured
   model, so there is no code path by which they could change its mesh
   count — rather than adding a scene-introspection hook solely for this
   assertion.
3. **Ruler settings (spec §19–21: scope, mode, precision, extension-line
   toggles) are not implemented.** E1 §5 row 4e scopes this to diameter and
   thickness only. *Recommend* treating the fuller settings panel as Phase 11
   scope, alongside the rest of that phase's full ruler.

### Phase 4e rulings on the above (2026-09-18, given in the 4f task)

- **Q1 ruled: a calibration query flag.** Calibration screenshots open the
  editor with `?calibration=1`, which hides all viewport chrome (the ruler
  toggle, the sign-in banner); `subjectBox`'s corner exclusion is removed.
  Future viewport chrome must honour the flag.
- **Q2 ruled: the mesh-count check stands as proven by `data-model-size-mm`.**
- **Q3 ruled: ruler settings (spec §19–21) are Phase 11.**

## Phase 4f — done (2026-09-18)

Recipe v2, text layers and straight layout, per
reports/E1-plan-integration.md §5 row 4f, collisions 20–27, §3.3, C3, C10.

Files:

- `src/features/editor/lib/recipe.ts` (new) — `DraftRecipe` v2 and
  `TextLayer` per §3.3; `normalizeRecipe` (absent version = v1 → `layers: []`,
  ruler off, collision 27); `newTextLayer` with the §3.3 fallbacks (12% /
  0.35 × face diameter, cw, conform); `scaleLayers` for a variant switch
  (C10: centre, radius, text size, letter spacing and baseline offset scale;
  angles don't; relief doesn't exist yet). No imports, so node tests load it.
- `src/features/editor/lib/textLayout.ts` (new) — per-glyph layout from
  typeface-JSON advances (no kerning, E1 §6 R1); `text_size_mm` is cap height.
- `src/features/editor/lib/fonts.ts` (new) — the two bundled fonts, fetched
  from `public/fonts/` on first use and cached; never in the JS bundle.
- `public/fonts/` (new) — `poppins-semibold` (the site face) and
  `dm-serif-display`, both SIL OFL 1.1, converted offline with opentype.js to
  typeface JSON, Latin-1 (191 glyphs), with `capHeight` from OS/2; licence
  files beside each JSON.
- `src/features/editor/store/useEditorStore.ts` — `recipe`, `selectedLayerId`,
  `hydratedFor`; `initialize(recipe, hydratedFor)` replaces everything
  (collision 21); layer actions; the three setters stay as thin wrappers, with
  `setSizeVariantId(id, ratio)` scaling layers.
- `src/features/editor/lib/anonymousDraft.ts` — `{ productSlug, recipe }`;
  the pre-4f three-id shape is read forward (collision 22).
- `src/features/editor/hooks/useAutosaveDraft.ts` — hydration gated on
  `hydratedFor === designId` (collision 24); `lastSaved` advances only on a
  landed write, and an update that returns no row (RLS-filtered) counts as a
  failure → status `error` (collision 25).
- `src/features/editor/hooks/useEditorProduct.ts` — `variantRatio`.
- `src/features/editor/pages/EditorNewPage.tsx` — initialises from the
  anonymous draft's recipe; mirrors the recipe to sessionStorage only once
  hydrated for this product; the claim inserts the recipe verbatim
  (collision 23); `?calibration=1` hides the sign-in banner.
- `src/features/editor/pages/EditorDesignPage.tsx` — `normalizeRecipe` on
  load; autosaves the whole recipe.
- `src/features/editor/components/EditorPanel.tsx` — BRANDING is the new
  group; "Not saved" status line.
- `src/features/editor/components/branding/BrandingGroup.tsx` (new) — Add
  text; layer rows (content preview, select, delete, dnd-kit drag reorder
  with keyboard support); selected layer: Text, Font, Text size. No relief or
  fill controls (rulings §6).
- `src/features/editor/components/branding/MmField.tsx` (new) — mm at 2 dp,
  3 dp while focused, unrounded write (C3).
- `src/features/editor/components/branding/TextLayerMeshes.tsx` (new) — one
  `TextGeometry` mesh per glyph (cached per font × character at cap height 1,
  scaled `(size, size, 1)`), lifted 0.02 mm, a 0.05 mm preview slab in the
  part's own material until Phase 5; a sibling of the model, so ruler and
  `data-model-size-mm` bounds are unchanged. Reports glyph count, glyph
  positions and the minimum world determinant.
- `src/features/editor/components/EditorModel.tsx` — renders the text layers.
- `src/features/editor/components/EditorViewport.tsx` — `data-glyph-count`,
  `data-glyphs`, `data-min-world-determinant`; `?calibration=1` hides the
  ruler toggle.
- `src/features/editor/components/EditorShell.tsx` — height
  `100vh − 5rem − 1px`: the fixed site header is 81 px at every width, so
  `4rem` left the viewport's bottom 17 px (the ruler toggle) below the fold.
- `src/features/i18n/translations.ts` — `editor.autosave.notSaved`,
  `editor.branding.*` (9 keys), × 3 locales.
- `scripts/e2e-local/lib/calibration.mjs` — corner exclusion removed;
  `openEditor` pins the page to 1280 × 680 so the canvas stays the
  baselines' 920 × 599 without the banner; `subjectBox` samples the backdrop
  at mid-height, below the site header's drop shadow (which reaches the
  canvas once no banner separates them). Model pixels are identical to HEAD.
- `scripts/e2e-local/scenarios/render-calibration.mjs`,
  `scripts/e2e-local/calibrate/fit-families.mjs` — `&calibration=1`.
- `scripts/e2e-local/scenarios/text-layer.mjs` (new) — anon "POLO" (4
  glyphs) → sign in → claim read-back `layers[0].content.value = "POLO"`,
  `recipe_version 2`; "WINCYC" autosave read-back; reload → 6 glyph meshes;
  text size 3 dp focused / 2 dp at rest, unrounded 1.2345 stored; font
  read-back; second layer drag-reordered and deleted (read-backs); variant
  switch scales size and radius, not angles; forced RLS denial (design
  reassigned to another owner) → "Not saved", row unchanged, then saves once
  restored; a v1 row opens with no layers, writes nothing on open, and saves
  as v2 with `layers: []` on its first change.
- `scripts/e2e-local/unit/text-layout.test.mjs` (new) — font subset and
  licence, v1 normalisation, §3.3 fallbacks, C10 scaling, straight layout.
- `docs/3d-editor/STATUS.md` — this file.

### Rulings

- **The determinant check covers the model and the glyphs, not drei's
  ContactShadows.** drei draws its shadow quad with `scale (1, −1, 1)`; it is
  a texture plane, not part geometry, and isn't ours to change.
- **An RLS-filtered update is a failed save.** PostgREST returns no error for
  an update whose `USING` clause matches no row, so autosave selects the id
  back and treats an empty result as a failure.

## Phase 4g — done (2026-09-18)

Circular layout and per-glyph placement, per reports/E1-plan-integration.md
§5 row 4g, C7, §3.3, §6 R2; rulings §5.

Files:

- `src/features/editor/lib/textLayout.ts` — `layout: circle`. Each glyph's
  centre sits at its own angle on `radius_mm` (the cap-height midline), with
  its own tangent orientation. `cw`: tops outward, the angle increases in
  glyph order, rotation −θ. `ccw`: tops inward, the angle decreases in glyph
  order, rotation π − θ, so bottom text reads left to right. No scale is
  involved at all. `textArc` derives span, start and end from advances and
  letter spacing (C7; nothing stored). `letterSpacingForSpan` is the
  preserve-radius policy (widening the span spaces the letters, radius
  fixed), ready for 4h's range control. `normalizeDeg`.
- `src/features/editor/components/branding/TextLayerMeshes.tsx` — `conform`:
  per glyph, a raycast along −Z (the face normal) from above the part with
  three-mesh-bvh's `acceleratedRaycast` (a `MeshBVH` built once per
  geometry), landing on the hit and turning the glyph's +Z to the hit normal
  (a quaternion, `tilt × spin`). x and y stay exactly the layout's; the
  0.02 mm lift is along the face normal. No hit → the flat face plane. The
  report now reads glyph positions back from the world matrices three.js
  renders with, plus each glyph's world up-z and whether it conformed; a
  `useFrame` keeps `data-glyph-screen-x` on the canvas (glyph centres in
  canvas px) whenever the camera or layout changes.
- `src/features/editor/components/branding/BrandingGroup.tsx` — Layout
  switch, Straight / Circular.
- `src/features/i18n/translations.ts` — `editor.branding.layout`,
  `.layoutStraight`, `.layoutCircular`, × 3 locales.
- `scripts/e2e-local/scenarios/circular-text.mjs` (new) — the panel's
  Circular switch → read-back `layout: circle` at the fallbacks (radius
  0.35 × 10.8, cw, 0°); radius 3.63 cw at 0° → every rendered glyph's centre
  angle matches `layoutText` ± 0.01° and radius ± 0.001 mm, all conformed and
  facing out; ccw at 180° → same checks, bottom arc, and screen x strictly
  increasing in glyph order from the home camera; minimum world determinant
  > 0 for cw, ccw and after the edit; typing "POLOS" → read-back `radius_mm`
  exactly 3.63, arc position unchanged, span grown.
- `scripts/e2e-local/unit/text-layout.test.mjs` — circle cw/ccw placement,
  glyph up direction, determinant, preserve-radius span.
- `docs/3d-editor/STATUS.md` — this file.

### Rulings

- **Radius and direction are staged, not typed, in `circular-text.mjs`.**
  There is no radius, arc-position or direction control until 4h's
  "Position and curve" disclosure (and no placeholder before it), so the
  scenario writes those two placements into `draft_recipe` and reloads; the
  layout switch and the added character go through the UI.
- **Defaults are E1 §3.3's fallbacks** (0.35 × face diameter, 0°, cw, 12%
  cap height); 4j swaps in the recovered values.

### Open questions from 4f–4g, with a recommendation each

1. **Glyphs render on top of the Polo's existing lettering.** Until 4j hides
   the marked groups, conform lands new glyphs on the old relief's tops.
   *Recommend* no interim workaround; 4j's hidden groups fix it at source.
2. **A buyer can't make bottom-arc text in 4g.** Direction is stored and
   rendered, but its control belongs in 4h's disclosure. *Recommend* adding a
   Top / Bottom arc switch (`cw` / `ccw`) to that disclosure in 4h rather than
   to the main panel, since it is a placement choice, not content.
3. **The preview slab is 0.05 mm in the part's own material.** It reads as
   faint relief. *Recommend* keeping it until Phase 5 replaces it with the
   layer's real emboss/deboss, rather than inventing a print colour that
   Phase 6's fill would then contradict.
4. **The shell height fix (81 px header) is a hard-coded layout constant.**
   *Recommend* a shared CSS variable for the header height when the site
   layout is next in scope, so the editor shell can't drift from it again.

### Phase 4f–4g rulings on the above (2026-09-18, given in the 4h task)

- **Q2 ruled: a Top / Bottom arc switch inside "Position and curve".** Top =
  `cw` at 0°, Bottom = `ccw` at 180°; one click sets both fields.
- **Q4 ruled: the header height is a CSS variable** (`--site-header-height`
  in `src/index.css`), used by `EditorShell`.
- Q1 (glyphs over the existing lettering) and Q3 (the 0.05 mm preview slab)
  received no ruling; their recommendations stand (4j and Phase 5 fix them).

## Phase 4h — done (2026-09-18)

Hybrid controls per reports/E1-plan-integration.md §5 row 4h, C3, C7;
rulings §3; plus corrections R2–R8 given with the task.

Files:

- `src/features/editor/components/controls/precision.ts` (new) — C3 display
  precision (mm 2 dp / 3 dp focused; ° 1 dp / 2 dp focused) and key steps
  (0.01 / Shift 0.1 / Alt 0.001 mm; 0.1 / 1 / 0.01°), noise-free stepping.
- `src/features/editor/components/controls/PrecisionNumberInput.tsx` (new) —
  the authoritative field; ArrowUp/Down steps; typed values written
  unrounded; select-all on focus. Replaces `branding/MmField.tsx` (deleted).
- `src/features/editor/components/controls/SliderTrack.tsx` (new) — track,
  handle (`role="slider"`, arrow-key steps), value badge above the handle
  kept inside the track, vertical marker line, pointer → value with snap.
- `src/features/editor/components/controls/ValueSlider.tsx`,
  `RangeValueSlider.tsx` (new) — addendum §34. The range form: dragging a
  handle moves that end, dragging the band moves both; its two badges hang
  apart so they never overlap.
- `src/features/editor/components/branding/PositionAndCurve.tsx` (new) —
  the disclosure. Circle: Top/Bottom arc, radius, start/end (C7: stored
  midpoint; widening the range sets `letter_spacing_mm` through
  `letterSpacingForSpan`, radius fixed; the band moves `arc_position_deg`),
  arc position. Straight: centre X/Y, rotation. Both: text size, letter
  spacing, baseline offset. Angle sliders run −180…180 on the top arc and
  0…360 on the bottom arc so neither straddles the slider's ends. No
  emboss/deboss controls.
- `src/features/editor/hooks/useFontMetrics.ts` (new) — the bundled font's
  advances for the panel's span maths.
- `src/features/editor/components/branding/BrandingGroup.tsx` — text size
  moved into the disclosure; Font full width.
- `src/features/editor/components/EditorPanel.tsx` — below `lg` the panel is
  capped at 60% of the shell height and scrolls, so an open disclosure can't
  squeeze the viewport to nothing; no horizontal overflow.
- `src/features/editor/components/EditorViewport.tsx` — `min-h-0` on the
  viewport (a resized canvas kept its old pixel height and overlapped the
  panel at 390 px); `CameraReport`; ruler labels rendered as DOM.
- `src/features/editor/lib/rulerLabelLayout.ts` (new),
  `src/features/editor/components/RulerOverlay.tsx` — R2: labels are placed
  per frame in screen space: diameter centred below its horizontal line
  (beside it when the part is taller than wide), thickness beside its own
  line away from the model, then pushed apart on collision. The thickness
  line moved to the right side so the two dimensions never share a corner.
  Each label carries its projected line (`data-line`). Only the product's
  diameter and thickness are shown; layers have no measurements yet.
- `src/features/editor/components/CameraReport.tsx` (new),
  `EditorModel.tsx` — R3 read-back: `data-camera-direction` (live) and
  `data-camera-home` (framed) on the canvas. Framing itself is unchanged —
  see the camera finding below.
- `src/features/editor/components/EditorShell.tsx`, `src/index.css` — R7:
  `h-[calc(100vh-var(--site-header-height))]`.
- `src/components/admin/product-editor/ProductModelPreviewSlot.tsx` (new),
  `ProductModelEditor.tsx` — R5 (see finding below): chunk preloaded once a
  model exists; an error boundary around the lazy preview and its canvas;
  Retry (reloads the page for a failed chunk, remounts otherwise); a load
  past 15 s offers Retry.
- `src/components/admin/product-editor/ProductModelPreview.tsx` — R6: marked
  groups tinted with `--primary` (was amber `#d97706`); "Preview as buyer"
  hides them; the recovered ring (full circle, lettering arc, start dot)
  drawn in a sibling group with the model's own transform; a "Loading
  model…" overlay until the OBJ is drawn; scene read-back
  (`data-state`, `data-ring`, `data-meshes`, `data-tinted`, `data-hidden`).
- `src/components/admin/product-editor/ProductBrandingMarks.tsx` — R6: marked
  rows in `bg-primary` (was `bg-amber-100`); "Preview as buyer" switch; the
  result is one sentence ("Lettering found on a 3.6 mm ring, 1.2 mm tall,
  raised 0.2 mm. Buyers' text will start here." at the Polo's factor; raw
  units before the scale is confirmed), a confidence line only when not
  high, the numbers behind a Details disclosure.
- `src/features/i18n/translations.ts` — `editor.branding.*` 14 keys × 3.
- `src/features/i18n/adminTranslations.ts` — `admin.model.preview.*` 4 keys,
  `admin.model.branding.*` 10 keys, × 3.
- `scripts/e2e-local/run.mjs` — `E2E_BUILD=1` serves `vite build` +
  `vite preview` instead of the dev server.
- `scripts/e2e-local/scenarios/hybrid-controls.mjs` (new) — camera home and
  initial direction; straight vs circle controls, no relief controls; type
  radius 4 → glyphs at 4.000 live + read-back; ArrowUp / Shift / Alt =
  +0.01 / +0.1 / +0.001 mm and +0.1 / +1 / +0.01° (read-backs); widen range
  → spacing up, radius fixed (read-back); band drag → arc position moves,
  spacing fixed; slider drag → field shows the stored value; Bottom arc →
  `ccw` 180°; 390 px stacked, no horizontal overflow.
- `scripts/e2e-local/scenarios/cms-preview-build.mjs` (new, `E2E_BUILD=1`) —
  production build: preview reaches ready; failed chunk → message + Retry,
  page intact, recovers; hung OBJ → "Loading model…".
- `scripts/e2e-local/scenarios/ruler-buyer.mjs` — no-overlap and
  label-against-line assertions over 8 samples while the camera turns.
- `scripts/e2e-local/scenarios/cms-branding-marks.mjs` — sentence, confidence
  line, collapsed Details, ring shown, 28 tinted, buyer preview hides 28.
- `scripts/e2e-local/scenarios/text-layer.mjs` — text size via the disclosure.
- `scripts/e2e-local/scenarios/render-calibration.mjs` — camera home
  direction asserted against the baseline.
- `scripts/e2e-local/unit/hybrid-controls.test.mjs` (new) — key steps,
  precision, label layout and collision.
- `docs/3d-editor/STATUS.md` — this file.

### Findings

- **R4 toolbar — not in this repo.** No component renders a select / T /
  pencil / comment toolbar on the editor routes: `index.html` loads only
  `/src/main.tsx`; `App.tsx` mounts no toolbar globally (only
  `ComposerPage` and `BrochureViewer` mount toolbars, on their own routes);
  `lovable-tagger` runs in development only and adds attributes, not UI; and
  headless Chromium against both the dev server and a production build
  shows no such element. It is external — the hosting preview's
  visual-edit overlay or a browser extension. Nothing was changed for it.
- **R5 CMS preview — the reported hang did not reproduce locally.** Against
  a production build the preview loaded in < 1 s, including with a
  throttled network, a hidden/re-shown preview and the branding-toggle
  path. What the build did show: a failed preview chunk (a stale deploy
  serves HTML for it) crashed the whole admin page to the app error screen,
  and a slow or hung OBJ left a blank grey frame with no indicator. "Loading
  preview…" can only persist while the chunk request itself never settles.
  All three are now handled (preload, boundary + Retry, 15 s slow notice,
  model-loading overlay) and proven in `cms-preview-build.mjs`.
- **R3 camera — framing matched the baseline on every path tried.**
  Elevation 30°, azimuth −25° and the fill solve are unchanged since
  Phase 3; anonymous and signed-in loads at 1280 × 720, 1600 × 1000 and
  390 × 844, with and without text layers and the ruler, all opened on the
  three-quarter view with the decorated face toward the camera
  (render-calibration fill 0.559 against the 0.56 baseline). The regression is now guarded: home
  and initial direction are read back and asserted.

### Open questions from this phase, with a recommendation each

1. **Where the camera regression was seen.** Not reproduced on the seeds or
   the Polo. *Recommend* sending the product slug, viewport size and a
   screenshot; a production model whose decorated side has less geometry
   than its back would fool `decoratedFaceRotation`'s density test, which
   the new direction read-back can confirm in minutes.
2. **The production preview hang.** *Recommend* capturing the browser
   console and Network tab for the stuck `ProductModelPreview-*.js` request
   on production; if it is pending forever, the host (CDN/SW) is at fault and
   the new 15 s Retry is the mitigation.
3. **Text size moved behind the disclosure.** E1 lists it there; a buyer
   who never opens it keeps the 12% default. *Recommend* keeping it there
   until 4j's recovered size lands, then reviewing with real buyers.
4. **Angle slider domains** (−180…180 top, 0…360 bottom). Typed values
   outside them are kept. *Recommend* keeping this until 4i's on-model arc
   handle makes the slider secondary.

### Phase 4h rulings on the above (2026-09-18, given in the 4i–4j task)

- **Q3 ruled: text size stays inside "Position and curve".**
- **Q4 ruled: the angle slider domains are kept** (−180…180 top, 0…360 bottom).
- **R4 finding accepted: the four-icon toolbar is external**; nothing in the
  repo changes for it.
- **Q1 / Q2 (camera, production preview) stay unreproduced**; the camera
  direction read-back and the production-build preview scenario remain in
  the suite as the guard.

## Phase 4i — done (2026-09-18)

Drag handles and undo per reports/E1-plan-integration.md §5 row 4i; rulings
§3; v3-review §1 and §10 (undo, touch).

Files:

- `src/features/editor/lib/recipeHistory.ts` (new) — whole-recipe snapshot
  history, 50 entries: commit (a live edit that returns to its start is no
  entry), discrete actions, undo, redo, can-undo / can-redo.
- `src/features/editor/store/useEditorStore.ts` — history fields; `commit`,
  `beginDrag`, `endDrag` (commit + flush), `undo`, `redo`; discrete actions
  (add, delete, reorder, variant / finish / colour, ruler) commit themselves;
  `updateLayer` stays a live edit.
- `src/features/editor/hooks/useAutosaveDraft.ts` — holds writes while a drag
  is in progress and writes at once on pointer-up (one write per drag).
  Also fixes a race found by the undo scenario: an edit back to the last
  saved state made while a write was in flight (an undo) was never written.
- `src/features/editor/lib/handleGeometry.ts` (new) — handle positions (arc
  knob on the arc position, inside the letters; ring grab opposite the text;
  move handle at the straight text's centre) and drag maths from the
  pointer-down state (radius by change in distance, arc position by
  continuous turn, centre by travel).
- `src/features/editor/components/branding/Handles.tsx` (new) —
  `HandleProjector` (in the canvas: projects the selected layer's handles
  each frame straight onto the SVG, and raycasts the pointer onto the face
  plane z = face top) and `HandlesOverlay` (SVG over the canvas: ring with a
  28 px hit stroke, 28 px knob and move handle, `touch-action: none`; drags
  write the store live, hold autosave, commit on pointer-up).
- `src/features/editor/components/EditorViewport.tsx` — mounts handles for
  the selected layer only (none with `?calibration=1`); idle rotation stops
  once a layer is selected.
- `src/features/editor/components/EditorModel.tsx` — reports the face top.
- `src/features/editor/lib/rulerLabelLayout.ts` — `layoutLabels`: N labels,
  each stepped to the nearest free slot clear of earlier labels and of
  obstacles; `layoutRulerLabels` takes the handles' rects as obstacles.
- `src/features/editor/components/RulerOverlay.tsx` — labels avoid the handles.
- `src/features/editor/components/controls/*` — `onCommit` (blur, Enter,
  arrow step) and `onDragStart` / `onDragEnd`; the field carries its stored
  value as `data-value`.
- `src/features/editor/components/branding/PositionAndCurve.tsx`,
  `BrandingGroup.tsx` — every control commits; Undo / Redo buttons in the
  BRANDING header (really disabled); Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z,
  blurring a focused field first so its edit is its own entry. No Reset.
- `src/features/editor/pages/EditorDesignPage.tsx` — drag state to autosave.
- `src/features/i18n/translations.ts` — `editor.branding.undo` / `.redo`,
  `editor.handles.*` (3), × 3.
- `scripts/e2e-local/scenarios/drag-handles.mjs` (new) — handles only for
  the selected layer, hit areas ≥ 24 px; radius ring dragged 40 px outward:
  field grows mid-drag, no write mid-drag, exactly one PATCH after
  pointer-up, read-back = field to 1e-6, glyphs moved; arc knob drag (one
  write, radius untouched); undo by keyboard and button, redo by keyboard and
  button (read-backs), disabled states; a typed edit is one entry; touch drag
  (CDP touch events, `pointerType` touch) with one write; ruler labels clear
  of the handles; straight move handle (read-back = fields).
- `scripts/e2e-local/unit/drag-handles.test.mjs` (new) — handle maths,
  obstacle avoidance, history.
- `docs/3d-editor/STATUS.md` — this file.

## Phase 4j — done (2026-09-18)

Catalogue branding defaults per reports/E1-plan-integration.md §5 row 4j,
collisions 9–10, C8, C9; rulings §4; the 4d direction ruling.

Files:

- `src/features/editor/lib/recoveredPlacement.ts` (new) — the product's
  reference (raw units, raw frame) → a new layer's placement: raw → face
  transform, centre / radius / text size at factor × variant scale and relief
  at the factor alone (physical, C10); direction and arc position from the
  reference, or — when the recovered arc covers most of the circle — `cw` at
  the midpoint of the widest cluster of marked glyphs (4d ruling). Null for
  no reference, a low-confidence one or an unconfirmed factor (C9), which
  leaves E1 §3.3's fallbacks.
- `src/features/editor/lib/recipe.ts` — `newTextLayer` takes those defaults
  and labels each field `recovered`; editing one makes that field `user`
  (§4.1) and leaves the others; `relief` is typed (Phase 5 renders it).
- `src/features/editor/hooks/useEditorProduct.ts` — reads
  `model_branding_groups` and `model_branding_reference`.
- `src/features/editor/components/EditorModel.tsx` — marked groups are not
  drawn in the buyer view; the rotation is still computed on the full model
  and the framing and ruler bounds are still the full model's (collision 10),
  so showing the lettering never moves the camera; the occlusion bake gets
  the hidden meshes as exclusions and a cache key that includes them
  (collision 9); reports the drawn / total mesh counts and the model frame.
- `src/features/editor/lib/ambientOcclusion.ts` — `occlusionKey`, exclusions,
  and a per-key attribute cache, so toggling the lettering re-applies a bake.
- `src/features/editor/components/branding/TextLayerMeshes.tsx` — conform
  lands on the first *drawn* surface, never on a hidden group.
- `src/features/editor/components/OriginalLetteringToggle.tsx` (new),
  `EditorViewport.tsx` — "Show original lettering" for catalogue editors and
  designer staff, beside the ruler toggle; scene read-backs
  `data-model-mesh-count` / `-total`, `data-face-z`, `data-marked-centres`.
- `src/features/editor/components/CameraReport.tsx` — also
  `data-view-projection`, so a scenario can project face-frame points onto
  its own screenshot.
- `src/features/editor/lib/layerMeasurements.ts` (new),
  `components/RulerOverlay.tsx` — the selected layer's branding radius,
  letter height and edge margin (face radius − radius − text size / 2), drawn
  on the face opposite the text, their labels laid out with the product's two
  through one `layoutLabels` call (no overlap, handles avoided).
- `src/features/editor/components/branding/BrandingGroup.tsx`,
  `EditorPanel.tsx`, both pages — Add text uses the recovered defaults; the
  staff toggle is wired from `useCatalogueEditorStatus` / `useDesignerStaffStatus`.
- `src/features/i18n/translations.ts` — `editor.ruler.*` (3) and
  `editor.viewport.showOriginal`, × 3.
- `scripts/e2e-local/scenarios/branding-defaults.mjs` (new) — buyer sees 5 of
  33 meshes and no toggle; staff toggle draws 33 and back with the camera home
  unchanged; Add text read-back `radius_mm` = 5.048 raw × 0.720193 ± 0.01,
  text size and relief at the factor, `provenance` recovered on each, `cw` at
  the widest glyph cluster (recomputed in the scenario from the scene's
  reported centres), and an edited radius becomes `user` while the rest stay;
  the ruler's three layer dimensions with the edge-margin formula and no label
  overlapping another label or a handle; the anti-brass oxide check below.
- `scripts/e2e-local/scenarios/cms-two-point.mjs` — waits for the preview's
  `data-state="ready"` instead of a fixed 3 s, and clicks through the canvas
  element so the box is resolved at click time. It had begun to flake: the
  preview now mounts sooner (4h preloads its chunk), so the scenario reached
  the clicks while the page below was still settling and every click landed
  off the model.
- `scripts/e2e-local/unit/branding-defaults.test.mjs` (new) — the transform,
  the conversions, the cluster ruling, the C9 fallbacks, provenance, and the
  ruler dimensions.
- `docs/3d-editor/STATUS.md` — this file.

### Deviation from E1 §5 row 4j: how the anti-brass check is measured

E1 asks for "oxide mean in the former lettering zone within 5 L* of the
surrounding face". The studio lights the disc with a strong radial gradient —
measured on this render, 61 L* at radius 2.8 mm falling to 39 L* at 4.4 mm —
so comparing the lettering ring with the bands immediately inside and outside
it measures that gradient, not the oxide: the blank face reads 5.1 L* apart
by that definition. A bake that still carried the lettering would show as an
*angular* pattern at letter spacing, so the scenario asserts:

- the ring's high-frequency variation (each 3° bin minus a ±15° moving
  average, which removes the studio's own gradient): **1.23 L\* RMS** against
  **1.03** on a control ring of the same width on blank face;
- the two rings' means within 5 L* (56.06 vs 56.82);
- and, as a positive control, the same measurement with the lettering drawn:
  **12.26 L\* RMS** — ten times the blank face, so the check can see lettering.

### Open questions from 4i–4j, with a recommendation each

1. **The recovered default lands on the Polo's "EST. 1967" arc, not "POLO".**
   The 4d ruling picks the widest cluster (8 glyphs over 60°, midpoint 140°)
   over the top lettering (4 glyphs over 44°). It is the ruling applied
   faithfully, but the buyer's text starts on the lower right. *Recommend*
   preferring the cluster nearest 0° when two clusters are within ~20° of
   each other in extent, if the top arc is meant to win.
2. **Relief is stored but not rendered.** 4j writes `relief` from the
   reference; Phase 5 renders it, so the preview slab still shows. *Recommend*
   leaving it — the value is the factory's and worth carrying now.
3. **Toggling the original lettering re-bakes the occlusion** (~1 s on the
   Polo) the first time each way; both directions are then cached for the
   session. *Recommend* leaving it until Phase 6 moves the bake to a worker
   (§6 R6).
4. **Handles have no hover or focus affordance on touch.** They are sized for
   a finger (28 px) and drag correctly, but there is no press state.
   *Recommend* adding one when Phase 5's relief controls bring another pass
   over the on-model UI.

