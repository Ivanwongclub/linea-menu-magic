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
| 3d | Hue-only family calibration, physical lightness, chart oxide L* | **Done** — 3-series closed |
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

## Phase 3d — done (2026-09-17) · 3-series closed

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
