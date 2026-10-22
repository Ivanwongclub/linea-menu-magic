# Proposed next build plan

This proposal is for ChatGPT/product-planning review. It is based on docs/project/CODEBASE_AUDIT.md and is not an implementation decision.

## Guardrails

1. Keep the new 3D editor (designs) and legacy composer (design_sessions) explicit; do not create a third overlapping design model.
2. Treat hosted Supabase as a required deployment surface. Compare its migration ledger, RLS, storage and edge functions before schema work.
3. U11 is verified and closed on the local tree, but remains uncommitted and unpushed; the repository-wide suite is green after two minimal scenario-harness fixes.

## Audit gate refresh — 2026-10-07

The comprehensive read-only audit was refreshed against the current dirty tree.
The repository is buildable and has 83/83 unit tests passing, but lint remains
red at 47 errors and 43 warnings. The source confirms two live studio systems:
the legacy `design_sessions` composer and the newer `designs`/`design_versions`
3D editor. Do not introduce a third design model.

The deployment target is Lovable Publish for the Vite frontend, with Supabase
project `otkuqwpsgxzlaxbclbfi` as a separate backend surface. No deployment
manifest or CI deployment pipeline is tracked, so hosted frontend settings,
Supabase migration/function state, and runtime role behavior remain outside
local proof.

Step 1 remains the next gate and is **not complete**: supplied hosted exports
show migration-ledger divergence, broad legacy policies, 34 design-table
constraints, and storage policy shapes, but not complete runtime/API role
behavior or Edge Function deployment inventory. No policy remediation is
authorized from documentation alone.

MO06 and MO09 are not present as identifiable repository milestones, routes,
migrations, or scenarios. Keep them unplaced and unstarted until their exact
scope and acceptance criteria are provided. After Step 1, the owner must first
choose whether future shares, quotes, versions, and outputs belong to the new
3D design model or the legacy composer; only then can MO06/MO09 be mapped to a
safe sequence.

## Focused MO06/MO09 onboarding plan — 2026-10-07

This is a read-only onboarding proposal, not an implementation start. The
repository contains neither `MO06.obj` nor `MO09.obj`, and no product rows for
either model were found. The current flow can onboard them without a new
feature when the missing product and geometry inputs are supplied:

1. A catalogue editor uploads one `.obj` through the existing product-model
   CMS flow. The file is written to `product-models/models/<productId>/<timestamp>.obj`;
   the client parses raw bounds, stores `products.model_storage_path` and
   `products.model_raw_bounds`, and removes the previous object after a
   successful replacement.
2. The editor reads the product by slug/id, obtains the public
   `product-models` URL, loads it with Three.js `OBJLoader`, applies the stored
   millimetres-per-raw-unit factor and selected-size ratio, and renders finish,
   colour, zones and branding behavior.
3. The CMS must confirm a unit or physical-dimension calibration before the
   buyer editor opens the model. The reference size comes from
   `product_size_variants.size_primary_mm`; replacing the path resets scale and
   branding metadata.
4. The Parts scene tree currently reports direct mesh children in OBJLoader
   file order. It displays `mesh.name` when an OBJ `o`/`g` name is present and
   falls back to `Object <n>` otherwise. Rows can be selected, hidden, isolated
   and used
   by zone/branding logic; the factory-lettering row is a separate marked-group
   control and is not itself selectable. Therefore unnamed MO06/MO09 files can
   render and be selected as default objects; material sections must not be
   treated as semantic product parts. The current fallback is `group_<n>` and
   should become the agreed `Object <n>` label; a rename-later path is not yet
   verified.

### Required owner inputs and acceptance criteria

Before wiring either product, obtain the two OBJ files (without uploading them
in this planning step), checksums, source-unit declaration, physical primary
dimension in millimetres, target/default size variant, and product identity
(slug, item code, names, material/metal flag, finish/colour and publication or
brand ownership). Because the supplied models have no physical units or
dimensions and no OBJ object/group names, the current evidence cannot establish
their scale or stable scene-tree/branding mapping.

The onboarding gate is: local OBJ preflight parses both files with finite raw
bounds and expected mesh count; each product has a matching size variant and a
confirmed scale; the editor loads by product slug/id; the Parts list exposes
the unnamed file as an `Object <n>` row and selection/hide/show work without
claiming material sections are semantic parts; and catalogue-editor
upload/public-read/outsider-write behavior is verified in the authorized
local/hosted role test. No model is considered ready while
`model_scale_status` is `unconfirmed`.

### Schema, security and Step 1 impact

The local flow itself requires no new schema, RLS, storage-policy, or Edge
Function change: it uses existing `products`, `product_size_variants`,
`products.model_*` columns, and the `product-models` bucket/policies. This is
conditional, not an assumption about production. Before any hosted upload,
read-only evidence must confirm those columns, the bucket, effective public
read, catalogue-editor write, and outsider denial in project
`otkuqwpsgxzlaxbclbfi`; if they diverge, stop and reconcile rather than adding
an unreviewed migration or policy.

### Hosted product-model path probe — 2026-10-09

Using the existing `.env` publishable client only, anonymous read-only REST
queries accepted the product model columns (`model_storage_path`, raw bounds,
scale and branding fields) and the relevant `product_size_variants` fields
(`size_primary_mm`, secondary size, label, default and sort order), both HTTP
200. A known existing public object in `product-models` also returned HTTP 200.
No hosted product row matching MO06 or MO09 was visible. This confirms the
ordinary public catalogue/model read path for an existing model, not the
catalogue-editor write policy.

The hosted bucket metadata endpoint did not provide policy metadata through
the anonymous probe. Catalogue-editor upload/association and update/delete,
outsider denial, and effective policy expressions remain untested: the repo
contains local disposable E2E credentials only, and no hosted user session or
read-only policy-catalog access was available. No upload or write was attempted.
The local migration/export evidence still describes the intended shape as
public `product-models` read with catalogue-editor writes; hosted runtime role
behavior is not claimed from that shape.

### OBJ scene-tree labels and renaming — 2026-10-09

Status: **implemented and browser-verified**. Unnamed OBJ mesh children now
display one-based `Object 1`, `Object 2`, etc. instead of `group_<n>`. Parts
rows retain index-based selection and hide/show behavior, and a pencil action
opens an inline rename control. Empty names remove the override. Custom labels
are stored as optional `part_names` in the existing recipe JSON, so draft
autosave and `design_versions.recipe` carry them without a migration or hosted
data change. Older recipes remain valid and read forward unchanged.

Focused evidence: `scripts/e2e-local/unit/part-names.test.mjs` covers fallback
numbering, trimming/clearing, and recipe normalization; the full unit suite
passes; `npm run build` passes with the existing warnings; targeted ESLint is
clean; and `E2E_PORT=8123 E2E_SUITE_ONLY='parts-list' npm run e2e:suite` passed
1/1 in 29 seconds. The browser scenario verified rename read-back after reload
and then continued the existing hide/show assertions. MO06/MO09 were not
uploaded or used.

No database migration, RLS/storage-policy change, hosted write, deployment,
commit or push was made. The rename is keyed to OBJ child index; changing a
model file can therefore require rechecking labels, while semantic product
parts are still not inferred from material groups. The next product step is
to confirm MO06/MO09 source units, physical millimetre dimensions, target
variants and product metadata, then wire them through the existing CMS flow.

Step 1 gaps that directly affect these products are the hosted ledger/schema
status for product/model columns and size variants, `product-models` bucket and
object-policy metadata, and safe catalogue-editor/member/outsider runtime role
tests. Edge Function inventory is not a dependency of direct OBJ upload/display
unless image generation is explicitly included. Legacy `design_sessions`
policy drift, design-table cross-column constraints, design-assets and
flipbook-assets rules, and new-editor share/quote/version role tests do not
block basic model onboarding; they remain general Step 1 gaps. No hosted policy
change is recommended from exports alone.

### Exact next action

Obtain the missing MO06/MO09 units/dimensions, target variants and product
metadata first. The fallback-label and rename task is complete; next wire the
products through the existing CMS flow after those owner inputs are confirmed.
Obtain hosted catalogue-editor and outsider role evidence separately if those
role checks are required for production acceptance. Do not start a new feature
or alter schema/policies for this onboarding.

### Audit-derived next sequence

1. **Close Step 1 read-only reconciliation.** Obtain the complete hosted
   migration ledger, constraints/indexes/triggers/grants/policies, storage
   metadata and expressions, Edge Function inventory/configuration, and safe
   anonymous/outsider/member/manager/catalogue-editor/staff role tests. Preserve
   the 34 observed constraints as PostgreSQL/RDS requirements. Do not change
   hosted or local schema during evidence collection.
2. **Make the studio boundary decision.** Name the authoritative route/table
   owner for the legacy composer and the 3D editor; decide retention/archive,
   staff visibility, sharing, quotes, version freezing, and output semantics.
3. **Map MO06/MO09 only after the first two gates.** Require a written scope,
   dependency list, acceptance tests, and owner decision before adding either
   to the implementation sequence.
4. **Implement the chosen product milestone.** Keep implementation separate
   from reconciliation, and require unit, local RLS/storage, and browser
   evidence before marking it complete.

## Sequence

### 0. U11 — completed verification (2026-09-28)

Scope/result: reviewed the complete diff and untracked BottomSheet.tsx / WorkspaceContext.tsx; ran the targeted hybrid-controls and workspace browser scenarios on the labeled disposable local stack, then attempted the full suite.

Acceptance: **met**. At 390px the sheet reached peek/half/full; the viewport measured 544/349/200px; expanded Check also measured 200px; the page stayed 390px wide with no offenders; all three tabs and one content surface per tab were verified; Parts state survived reload; Reset changed chrome while preserving the design recipe.

Tests: 83/83 unit tests passed; npm run build passed; E2E_PORT=8123 E2E_SUITE_ONLY='hybrid-controls|workspace' npm run e2e:suite passed 2/2 in 3m41s. The initial full suite was 46/48 in 20m21s; after minimal scenario-level fixes for persisted Parts state and duplicate-toast/read-back timing, the complete rerun passed 48/48 in 23m20s. Logs: /tmp/linea-e2e-suite-triage-full/.

Harness triage review: **passed**. The two initial failures were reproduced,
classified as scenario/harness collisions, corrected only in the affected
scenarios, and rerun successfully. The final reported evidence is 48/48 full
E2E, 83/83 unit tests, and a passing production build. No application feature
code was changed by the triage.

Known limit: the >50-row virtualization UI path remains unit-tested only; the local Polo fixture has 33 groups. Full-suite logs are in /tmp/linea-e2e-suite-full/.

### 0.1. U12 — deck and workspace rulings (2026-09-28)

Status: **verified/complete**. After Docker Desktop capacity was increased,
the labeled stack was reinitialized with the documented command and the deck
runner completed against the current U11 tree. Three narrow U11-aware harness
corrections are present: persisted phone tabs are made explicit before the
mobile shot, the shot switches from Layers to Properties before editing a new
text layer, and the relief locator targets the Properties surface.

Deck result: `E2E_PORT=8123 npm run deck:shots` returned `ok: true` with 26
shots. The only skip was the documented absence of trim OBJ fixtures. The
fresh `reports/deck/manifest.json` contains 26 entries; every referenced PNG
exists, is nonblank, and was independently checked at 2880×1800 desktop or
780×1688 mobile device-scale dimensions. The three mobile captures visibly
show the Layers sheet, finish picker, and Properties segment respectively.
The runner still logged the known React `fetchPriority` warning and local 503
resource warnings; neither caused a shot failure.

Final workspace rulings recorded for the next successful re-shoot:

- Desktop remains a fixed left/right workspace column; its width, side,
  collapsed state, section state, phone snap and phone tab are chrome state
  persisted per user and layout version.
- Phone width is 390px with one bottom sheet and three snap points — peek,
  half and full — while the viewport is clamped to at least 200px. The sheet
  segments are Layers, Properties and Check; each segment exposes one content
  surface, with manufacturing lines owned by Check on phone.
- Layers owns creation/listing; Properties owns the selected layer's content,
  relief and placement controls. Parts is folded by default and its state is
  persisted with the workspace.
- Reset workspace restores chrome only: it does not alter the recipe,
  selection or camera. `?calibration=1` remains the deterministic layout path.

Relevant checks after the runner edits: **83/83 unit tests passed**, `npm run
build` passed with the existing Browserslist/Tailwind/chunk-size warnings, and
`git diff --check` passed. Exact logs and the completed U12 evidence are in
`docs/project/SESSION_LOG.md`. U12 is complete; Docker capacity is only a
precondition for future E2E runs. Do not start Phase 8 in this task.

Capacity note (2026-09-28): the VM had 7.8GB free before the successful reset
and capture, but reported 0 bytes free again after the run while the host had
113GiB free. The labeled stack was not cleaned up and unrelated resources were
not touched. This is an environment-maintenance concern for future E2E runs,
not a U12 acceptance failure; do not prune globally.

### 1. Hosted/local schema and security reconciliation

Scope: read-only compare hosted migration history, effective RLS, storage buckets/policies, edge-function configuration and legacy workspace policies. Resolve whether broad legacy policies remain effective.

Dependency: Supabase read-only project access.

Acceptance: dated drift report identifies every mismatch and authoritative environment; no SQL is applied during this step.

Tests: anonymous/outsider/member/manager/catalogue-editor/staff RLS and storage path matrix; edge-function auth/service-role review.

Risk: production inspection is high impact; keep it read-only.

### 2. Choose the studio product boundary

Scope: decide whether legacy composer is maintained, migrated or retired; define whether “design” means a 3D recipe, 2D composition, or both; define ownership, staff visibility, shares, archive and version/output semantics.

Dependency: step 1 and product-owner decision.

Acceptance: one-page domain contract naming table and route ownership plus the migration/non-migration decision.

Risk: skipping this creates a third overlapping persistence model.

### 3. Phase 8 shares (chosen model only)

Scope: share creation/revocation/recipient access using design_shares only if step 2 confirms the new model; do not silently share legacy sessions.

Dependencies: steps 1–2 and existing visibility helpers.

Acceptance: owner/manager/staff can create/revoke; recipient can read but not mutate; revoked access stops; anonymous behavior is specified.

Tests: RLS/API matrix and route-load browser scenarios for owner, recipient and revoked states.

Risk: token/URL handling needs a threat-model review.

### 4. Quote request and staff queue

Scope: use design_quotes for a minimal request/status flow and define whether a request references a live draft or immutable version.

Dependencies: chosen model, shares, hosted RLS verification.

Acceptance: buyer submits once; staff sees only permitted designs and can change status; recipe/snapshot is deterministic; duplicate and unauthorized updates are specified.

Tests: RLS, insert/update/read-back E2E and retry/idempotency cases.

### 5. Spec-sheet PDF/output contract

Scope: first Output socket feature: a spec sheet from a frozen version; defer OBJ/GLB/STL until units and manufacturing rules are approved.

Dependencies: versions, quote semantics and phase 10/12 rulings.

Acceptance: PDF contains product/finish/size/layers/warnings, labels recovered values, and remains reproducible after live catalogue edits.

Tests: fixtures, rendered PDF inspection, route E2E and download read-back.

### 6. Upload/scene-tree phase 11

Scope: scene tree, selection/hover/hide/isolate, import dialog, units, scale/calibration and branding recovery for uploaded OBJs. Reuse existing CMS scale/branding fields where valid.

Dependencies: schema reconciliation, completed U11, and phases 4a/4c/4d.

Acceptance: editor can replace a model, confirm/calibrate, inspect groups, recover branding and prove stale scale/marks do not survive replacement.

Tests: trigger tests, CMS/browser scenarios, malformed OBJ/replacement and mobile layout regression.

#### Phase 11 local follow-up — isolate control — 2026-10-09

Status: **implemented and browser-verified** as the smallest remaining local
OBJ editor control. The Parts scene tree now has an index-based isolate toggle:
it hides every other reported mesh child, leaves the selected target visible,
and toggles back to all visible. The edit uses existing `hidden_groups` recipe
state, so selection, hide/show, autosave and reload behavior remain on the
existing path. No schema, hosted permission, model metadata or upload is
needed.

Evidence: the focused `parts-list` browser scenario passed 1/1 in 30 seconds
after verifying isolate, restore-all, hide/show, rename and reload persistence;
the full unit suite passed 86/86; the production build passed with existing
warnings; targeted ESLint passed; and `git diff --check` passed. The first
focused attempt timed out at the old post-hide assertion because the scenario
needed to account for isolate's restore-all state; that harness assertion was
corrected and the rerun passed. This is recorded as a test-sequencing fix, not
an application failure.

Remaining Phase 11 items are import-dialog/first-import UX and any additional
hover/fit policy decisions not required by the current local acceptance. The
existing CMS replacement path already resets scale and branding metadata and
has browser coverage; do not reopen it in this task. Keep MO06/MO09 wiring
paused until dimensions and target variants are confirmed.

#### Phase 11 local follow-up — first-import dialog — 2026-10-10

Status: **implemented and browser-verified** as the smallest explicitly
planned import UX gap. The CMS OBJ editor now holds a first selected `.obj`
file in a confirmation dialog before the first storage write. The dialog shows
the filename and offers Cancel or Import OBJ. Cancel clears the pending file
without changing the product; confirmation calls the existing upload mutation.
Replacement remains immediate and therefore preserves the existing replacement
reset path for scale and branding metadata. Invalid extensions continue to be
rejected before either path. No schema, migration, hosted data, model upload,
publication, or deployment change was made by this task.

Evidence: `cms-model-scale` passed 1/1 in 12 seconds after asserting the
first-import dialog, cancel-without-upload, confirmation, and the existing
scale confirmation/calibration/measurement flow. The first attempt failed only
on an immediate DOM-removal assertion; Radix keeps the dialog mounted while its
close animation runs, so the scenario now waits for hidden state and passes.
The full unit suite passed 86/86, targeted ESLint passed, production build
passed with the existing Browserslist, ambiguous Tailwind utility, and
chunk-size warnings, and `git diff --check` passed.

Remaining Phase 11 candidates are any separately approved hover/fit policy
decisions. Keep MO06/MO09 wiring paused until dimensions and target variants
are confirmed; do not begin Phase 12.

### 7. Bake/export phase 12

Scope: boolean/cleanup/bake and documented OBJ mm, GLB metres, STL output, tied to an immutable version.

Dependencies: phase 11, manufacturing thresholds, worker/storage/download strategy.

Acceptance: deterministic names, validated geometry, documented units and clear failure state.

Tests: fixture meshes, scale assertions, artifact inspection, worker resource limits and browser download E2E.

Risk: decide worker/background-job strategy before UI commitment.

## Open decisions for review

- U11 is accepted against targeted browser criteria and the full local suite is green; review the two scenario-level harness fixes with the next milestone if desired.
- Which studio system owns future shares, quotes, PDFs and exports?
- Is hosted Supabase authoritative, or will this repo become authoritative after controlled reconciliation?
- Should versions freeze model bytes (sha256 is currently null in the snapshot builder) before output/export?
- What are archive/retention rules for designs, versions, uploads and quotes?
