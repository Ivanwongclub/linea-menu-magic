# Audit Session Log

## 2026-09-28 — full-suite failure triage started

- Scope: diagnose `branding-defaults` and `cms-branding-marks` only; no new feature and no U12.
- Exact checkout: `/Users/a1234/Documents/GitHub/linea-menu-magic`; branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; `main...origin/main` is even.
- Full working-tree status at start: `docs/3d-editor/STATUS.md` modified; the 10 pre-existing U11 tracked files remain modified; `docs/project/` is untracked from the audit; U11 untracked components `BottomSheet.tsx` and `WorkspaceContext.tsx` remain present. No reset, clean, stage, commit, push, deploy, row deletion, or Docker cleanup performed.
- Known evidence under triage: targeted U11 2/2 passed; prior full suite 46/48; logs in `/tmp/linea-e2e-suite-full/`; post-run residue was 2 `product_size_variants` and 2 `product_finishes` rows.
- Completed: reread required docs and recorded this checkout/status.
- In progress: inspect failed logs/scenario setup/teardown, verify residue, reproduce serially on labeled disposable stack.
- Exact resume point: read the two failure logs and relevant scenario/code paths before any reset or rerun.

### 2026-09-28 — failure paths inspected

- Read `/tmp/linea-e2e-suite-full/branding-defaults.log` and `cms-branding-marks.log`.
- `branding-defaults` fails at scenario line 349 while clicking `part-row-lettering` visibility after a fresh editor navigation. The row is rendered only when marked branding groups are present and the Parts section is open. The failure is not yet classified; no application change made.
- `cms-branding-marks` fails at line 169 while waiting for a new `Branding marks saved` toast after changing the selection to two body groups and clicking Analyse. The component emits no toast when analysis returns null and emits an error toast on mutation failure; the log has no browser console errors, so the exact branch still requires reproduction/DOM/database evidence.
- Both scenarios use `finally` cleanup. Branding cleanup removes its inserted finish/size/model fixture; CMS cleanup resets the selected product model path and removes its model files. Residue attribution is not established.
- Exact resume point: inspect documented harness/schema checks, prepare a clean labeled stack without deleting project data, then run the two scenarios serially with isolated logs and residue checks between runs.

### 2026-09-28 — harness identity verified

- Read the suite runner and harness lifecycle. `E2E_SUITE_ONLY` is a filename `grep -E`; each scenario is serial; the runner removes only its selected log directory. `e2e:up` recreates `/private/var/folders/k5/gfx9qq1n60n95ppvr93b1nv40000gn/T/linea-e2e-local`, copies repo migrations plus test seed, starts the labeled Supabase project, and runs `supabase db reset`; `e2e:down` stops that project with `--no-backup` and removes only the scratch directory.
- Current labeled stack identity confirmed by Docker labels: compose/Supabase project `otkuqwpsgxzlaxbclbfi`, workdir `/private/var/folders/k5/gfx9qq1n60n95ppvr93b1nv40000gn/T/linea-e2e-local`; all containers are the disposable harness stack. No other Docker data will be targeted.
- The npm Supabase wrapper is unavailable on darwin-arm64; the repository harness explicitly supports `/opt/homebrew/bin/supabase`, which is present at v2.116.0. This is a tooling note, not an application failure.
- Reset effect authorized for the next step: fresh database replay and scratch-copy replacement for this labeled E2E stack only. No volumes/prune or project/user data cleanup.
- Exact resume point: run `SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:up`, then check documented residue counts before the first serial scenario.

### 2026-09-28 — serial reproductions completed

- Reset result: `SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:up` completed against the already verified labeled project. Read-only post-reset counts were all zero for `product_size_variants`, `product_finishes`, `designs`, `design_versions`, `design_sessions`, and `design_layers`.
- Serial reproduction 1: `E2E_PORT=8123 SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:run -- scenarios/branding-defaults.mjs` failed again at line 349, waiting for `part-row-lettering` visibility. Log: `/tmp/linea-e2e-triage-branding-defaults.log`. Browser console contained only the pre-existing `fetchPriority` warning. Post-cleanup counts were all zero.
- Serial reproduction 2: `E2E_PORT=8123 SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:run -- scenarios/cms-branding-marks.mjs` failed again at line 169 waiting for a second matching toast. Log: `/tmp/linea-e2e-triage-cms-branding-marks.log`. No browser console errors. The failure screenshot showed the second body-group selection and the low-confidence result text (`marks saved, but no branding reference was stored`), proving the analysis/write completed despite the missing toast assertion. Post-cleanup counts were all zero.
- Current classification: CMS failure is a deterministic harness assertion collision/timing issue, not a product or U11 failure. Branding failure remains to be compared against HEAD because the row is in an unchanged component but its section state is supplied by U11's `LayersDock` integration.
- Exact resume point: run `branding-defaults` from a detached HEAD 316a974 worktree against the same clean labeled stack, then record whether the U11 workspace integration changes the outcome; do not alter this checkout.

### 2026-09-28 — scenario-level fixes verified

- Detached HEAD comparison: from `/tmp/linea-menu-magic-head-triage`, the unmodified `branding-defaults` scenario passed against the same stack; this confirms the current U11 persistence behavior exposed the scenario's unconditional second toggle.
- Reverted a speculative application-hook change; `src/features/editor/hooks/useWorkspaceLayout.ts` is unchanged by this triage.
- Minimal harness fixes: `branding-defaults.mjs` now opens Parts only when its persisted row is absent; `cms-branding-marks.mjs` waits for the selected two-group DOM state, clicks Analyse, and polls the admin read-back for two saved marks instead of requiring a duplicate visible toast. The first analysis still verifies the toast contract.
- Affected rerun: `branding-defaults` passed with `/tmp/linea-e2e-triage-branding-scenario-fixed.log`; `cms-branding-marks` passed with `/tmp/linea-e2e-triage-cms-scenario-fixed-4.log`, including 28-mark high-confidence and 2-mark null-reference read-back, with no console errors.
- Exact resume point: check residue, then run the full suite once on the current tree with a separate log directory if resources remain sufficient.

### 2026-09-28 — triage complete

- Post-targeted residue before the full run: all six documented tables were 0.
- Full command: `E2E_PORT=8123 E2E_SUITE_SKIP_UP=1 E2E_SUITE_LOG_DIR=/tmp/linea-e2e-suite-triage-full npm run e2e:suite`.
- Full result: **48/48 passed in 23m20s**, completed normally; no kill, interruption, or partial-run credit. Logs: `/tmp/linea-e2e-suite-triage-full/`. `branding-defaults`, `cms-branding-marks`, `hybrid-controls`, and `workspace` all passed.
- Final residue: `product_size_variants=2`, `product_finishes=2`, `designs=0`, `design_versions=0`, `design_sessions=0`, `design_layers=0`. Read-only row inspection identified the size rows as `size-variants.mjs`'s intentional `sample-hook-and-loop` rows (`Small` 15mm and 20mm), and the finish rows as `finish-picker-layout.mjs`'s intentional `sample-zipper-pullers-sliders` attachments (`CYC-0001`/`CYC-0002`). No manual deletion, volume pruning, or Docker cleanup was performed.
- Conclusion: `branding-defaults` was a scenario collision with U11's persisted Parts state; `cms-branding-marks` was a scenario timing/duplicate-toast collision. Neither is a product defect. Application code was left unchanged; only the two scenario files were minimally corrected.
- Documentation updated because the verification conclusion changed: `docs/3d-editor/STATUS.md` now records the 48/48 rerun and residue ownership; `docs/project/BUILD_PLAN.md` now records a green local suite and removes the open question about these failures.
- Final checkout: branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`, `main...origin/main` even. `git diff --check` passed. Main worktree remains uncommitted/unpushed with the pre-existing U11 files, audit docs, two U11 untracked components, plus this triage's two scenario files and documentation updates.
- Exact next action: have Planner/reviewer review the two scenario-level fixes and the updated U11 evidence before the next milestone; do not start U12 in this task.

### 2026-09-28 — final stop checkpoint

- Final verification commands: `git status --short --branch`, `git diff --check`, `git rev-parse HEAD`, and `git rev-parse --abbrev-ref --symbolic-full-name '@{upstream}'`.
- Final outputs: `## main...origin/main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; `main...origin/main` even; `git diff --check` passed. No files were staged, committed, pushed, deployed, reset, cleaned, or manually deleted. The labeled E2E stack remains available; no Docker cleanup was run.
- Files changed by this triage: `scripts/e2e-local/scenarios/branding-defaults.mjs`, `scripts/e2e-local/scenarios/cms-branding-marks.mjs`, `docs/3d-editor/STATUS.md`, `docs/project/BUILD_PLAN.md`, and this log. Existing U11 application/scenario/unit changes and untracked U11 components remain preserved.
- Resume point: Planner/reviewer reviews these scenario-only fixes and the green 48/48 evidence; then begin only the next planned milestone, not U12 in this triage.

## 2026-09-28 — U11 harness triage review and U12 start

- Current checkout inspected before work: `/Users/a1234/Documents/GitHub/linea-menu-magic`; branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; `main...origin/main` even.
- Existing local changes preserved. U11 triage diff is limited to `branding-defaults.mjs`, `cms-branding-marks.mjs`, `docs/3d-editor/STATUS.md`, `docs/project/BUILD_PLAN.md`, and the session log; all existing U11 application files and untracked workspace components remain present.
- Harness triage review recorded as **passed**: final full E2E **48/48**, unit tests **83/83**, production build **passed**. No application feature code changed in triage; no staging, commit, push, deploy, reset, clean, or Docker cleanup performed.
- U12 scope started: re-shoot `reports/deck/*.png` and `manifest.json` through `npm run deck:shots`, then document final workspace rulings and exact screenshot/check results.
- Historical resume point (superseded): run the deck shooter on the labeled local E2E stack, then inspect the generated files and manifest.

### 2026-09-28 — U12 stack preflight

- `E2E_PORT=8123 npm run deck:shots` was blocked before browser startup because the harness `/var/folders/k5/gfx9qq1n60n95ppvr93b1nv40000gn/T/linea-e2e-local/status.json` was missing.
- Docker read-only inspection confirmed the same labeled disposable project `otkuqwpsgxzlaxbclbfi` and workdir; the containers were still present, with the edge-runtime container exited. No other Docker project was targeted.
- Historical resume point (superseded by the completed U12 entry below): reinitialize only this labeled harness stack, then rerun the deck capture.

### 2026-09-28 — U12 first deck capture blocked

- The labeled stack was reinitialized with `SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:up`; no broad Docker cleanup was used.
- `E2E_PORT=8123 npm run deck:shots` reached the mobile workspace capture but failed at `scripts/e2e-local/deck/shots.mjs:522` after a 30-second wait for `text-layer-content` following `add-text`. The run is **not** counted as a U12 pass. It emitted `reports/deck/deck-failure.png`; shots through `15b-mobile-finish-sheet.png` were rewritten, while `15c-mobile-text-layer.png` was not.
- Inspection showed the deck harness entered the mobile editor with the user-persisted sheet tab unspecified; the mobile block assumed Layers was selected before clicking `add-text`. This is a harness setup gap exposed by U11's persisted tab state, not evidence of an application feature failure. A minimal deck-only fix now explicitly selects `[data-tab="layers"]` after the mobile navigation.
- Historical resume point (superseded): rerun the deck capture with the explicit Layers setup and validate the artifacts.

### 2026-09-28 — U12 deck harness follow-up

- The rerun with explicit Layers selection failed again at the mobile shot, now at `scripts/e2e-local/deck/shots.mjs:527`: `text-layer-content` is correctly absent from the Layers segment under U11. The run is not counted as a pass; `reports/deck/deck-failure.png` was refreshed and `15c-mobile-text-layer.png` was not produced.
- Root cause is confirmed as a second stale deck-harness assumption, not an application defect: U11's phone workspace deliberately separates layer creation (Layers) from content/relief editing (Properties). The minimal deck fix now switches to the Properties segment after `add-text` and before filling the content.
- Historical resume point (superseded): rerun the deck shooter with the Layers-then-Properties mobile sequence and validate the artifacts.

### 2026-09-28 — U12 deck environment interruption

- A third `E2E_PORT=8123 npm run deck:shots` attempt failed before the editor at `shots.mjs:274` while navigating to `/designer-studio` with `networkidle` (30-second timeout; one expected local 401 resource was logged). Port 8123 was not listening afterward; the labeled stack status file remained present. This is an interrupted/failed environment attempt, not a U12 pass.
- No process or Docker cleanup was performed. The prior user-owned dev process on another port was left untouched.
- Historical resume point (superseded): rerun the deck shooter on port 8123 and validate the artifact set.

### 2026-09-28 — U12 deck navigation wait adjustment

- The immediate retry reproduced the same pre-editor timeout at `shots.mjs:274`, waiting for `networkidle` on authenticated `/designer-studio`; no listener remained on port 8123 afterward. The home/catalogue page rendered and only the known local auth 401 plus React `fetchPriority` warning were reported.
- The deck harness now uses `domcontentloaded` for that catalogue navigation. This is limited to the flaky navigation boundary; the editor and model readiness checks remain explicit and unchanged.
- Historical resume point (superseded): run the deck shooter once more and validate output.

### 2026-09-28 — U12 deck stack instability

- The capture passed the catalogue/editor navigation and the U11 mobile-segment sequence, then failed at `shots.mjs:353` waiting for the staged logo count; the browser logged repeated local 503 responses.
- Read-only Docker inspection identified the exact labeled project `otkuqwpsgxzlaxbclbfi`; its database was still starting, realtime was restarting, and Kong was unhealthy. The residue query was deferred because the database container was restarting. No other Docker project was targeted and no cleanup/pruning was performed.
- Historical resume point (superseded): reinitialize only the labeled disposable stack, then rerun the deck shooter and validate outputs.

### 2026-09-28 — U12 blocked at final checkpoint

- Deck attempts and outcomes: first failed at mobile `text-layer-content` because the persisted phone tab was not made explicit; second confirmed the U11 Layers/Properties split and failed for the same stale harness assumption; third and fourth failed before/at capture because authenticated catalogue navigation waited for `networkidle`, then the adjusted run reached logo staging but received local 503 responses. The stack subsequently entered PostgreSQL recovery with `No space left on device`; `SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:up` failed with `LegacyStatusDbNotReadyError`.
- Read-only disk evidence: host filesystem still has 118GiB available, but the labeled Docker database volume `/var/lib/docker/volumes/supabase_db_otkuqwpsgxzlaxbclbfi/_data` could not complete WAL recovery. `docker system df` showed 92.37GB images and 6.962GB local volumes, but no prune or deletion was authorized or performed. The stack status file is now absent. No database rows, Docker volumes, project files, or user data were manually deleted.
- Historical conclusion (superseded): U12 was temporarily blocked before the successful reset and completed deck capture recorded below.
- Regression checks after runner/doc edits: `node --test 'scripts/e2e-local/unit/*.test.mjs'` = **83/83 passed**; `npm run build` = **passed** with existing Browserslist, Tailwind ambiguous-class, and large-chunk warnings; `git diff --check` = **passed**.
- Files changed in this session: `scripts/e2e-local/deck/shots.mjs`; `docs/project/BUILD_PLAN.md`; `docs/project/SESSION_LOG.md`; `docs/3d-editor/STATUS.md`; partial rewrites under `reports/deck/*.png`; untracked `reports/deck/deck-failure.png`. Existing U11 application/scenario/unit changes and U11 components remain preserved.
- Final checkout: branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; `main...origin/main` even. Working tree is uncommitted and unstaged; no stage, commit, push, deploy, reset, clean, or broad Docker cleanup occurred.
- Historical capacity note (superseded as a U12 blocker): Docker VM free space must be checked before any future E2E run.

### 2026-09-28 — U12 Docker capacity recheck

- Re-read `SESSION_LOG.md`, `BUILD_PLAN.md`, `STATUS.md`, and `scripts/e2e-local/README.md`; inspected the unchanged worktree before Docker actions.
- Exact labeled stack: Supabase project `otkuqwpsgxzlaxbclbfi`; containers `supabase_db_`, `studio_`, `pg_meta_`, `edge_runtime_`, `storage_`, `rest_`, `realtime_`, `inbucket_`, `auth_`, `kong_`, `vector_`, and `analytics_`. Its only labeled volumes are `supabase_db_otkuqwpsgxzlaxbclbfi` (85.41MB reported by Docker; 82MB measured), `supabase_storage_otkuqwpsgxzlaxbclbfi` (257.4MB / 247MB), and `supabase_edge_runtime_otkuqwpsgxzlaxbclbfi` (81.92kB / 88kB). The database is restarting with 22 restarts and repeated `No space left on device`; `status.json` is absent.
- Docker VM capacity: `docker run ... postgres:16 ... df -h /` reports a 98GB overlay with 96GB used and 0 bytes available. Host macOS has 113GiB available. `docker system df` reports 93.69GB images (49.01GB reclaimable), 6.964GB volumes (5.862GB reclaimable), and 0B build cache.
- Exact non-stack candidates include `supabase_db_rfcxdednlmlwngdqrzui` at 5.138GB (unlinked), plus unrelated `barpacific-*`, `bp-*`, `kap-*`, `edm-tool-*`, and `outbound-platform-*` images/volumes. The current labeled stack can reclaim only about 0.34GB of volumes and cannot recover the full Docker VM. No unrelated resource was removed, no global prune was run, and no project files were deleted.
- Historical decision (superseded): U12 remained blocked while the Docker VM was full. The capacity concern remains relevant only before future E2E runs.
- Historical resume point (superseded): reclaim capacity through an approved cleanup or VM enlargement, then verify the labeled stack.

### 2026-09-28 — U12 deck retry reached final mobile locator

- Docker capacity recovered to 7.8GB free in the 98GB VM; the labeled project remained `otkuqwpsgxzlaxbclbfi` and `SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:up` completed successfully, including migration replay and editor-account setup.
- `E2E_PORT=8123 npm run deck:shots` ran through the corrected mobile Layers-to-Properties flow, then failed at `shots.mjs:537` because the shot still looked for `layer-relief` inside a Layers row after switching to Properties. This was a deck-harness locator mismatch, not an application assertion. The run is not counted as complete; `deck-failure.png` was refreshed and the manifest was not finalized.
- Minimal correction: the mobile shot now scrolls `properties-panel`'s `layer-relief` and describes the U11 Properties surface.
- Historical resume point (superseded): rerun the deck shooter on the same labeled stack and validate the artifacts.

### 2026-09-28 — U12 deck re-shoot verified

- Docker Desktop capacity check: the VM reported 7.8GB free in a 98GB overlay; host macOS had 113GiB free. The labeled Supabase project remained exactly `otkuqwpsgxzlaxbclbfi`; its stack was identified before reset and no unrelated containers or volumes were targeted.
- Reinitialization: `SUPABASE_BIN=/opt/homebrew/bin/supabase npm run e2e:up` completed successfully, replayed all repository migrations, recreated the scratch harness, and recreated the editor account. No global prune, unrelated cleanup, project-file deletion, stage, commit, push, or deploy occurred.
- Deck command: `E2E_PORT=8123 npm run deck:shots` completed with exit code 0 and `{ "ok": true, "shots": 26 }`. The only skipped item was `21..-trim-<name>.png` because `scripts/e2e-local/fixtures/trims/` has no OBJ fixtures.
- Artifact validation: `reports/deck/manifest.json` mtime `2026-09-28T04:15:43.181Z`, 26 entries; all 26 referenced PNGs exist; none is missing or below the runner's stddev blank threshold. Desktop frames are 2880×1800 and mobile frames are 780×1688 (390×844 at device scale 2). The manifest descriptions and independent visual inspection confirm Layers (`15-mobile`), finish picker (`15b-mobile-finish-sheet`) and U11 Properties with BRAND/relief (`15c-mobile-text-layer`).
- Runner output included the known React `fetchPriority` warning and three local 503 resource warnings, but no shot failed. The documented trim skip is the only manifest skip. `reports/deck/deck-failure.png` was removed by the runner's documented same-run cleanup at startup and is no longer present.
- Post-run environment note: the Docker VM returned to 0 bytes free and the database/realtime containers began restarting after capture; this did not invalidate the completed artifact run. Residue read-back was unavailable while the DB container was restarting. No Docker cleanup was performed.
- U12 conclusion: **verified/complete**. Updated `docs/project/BUILD_PLAN.md` and `docs/3d-editor/STATUS.md` with the 26-shot result, fresh manifest validation, visual U11 evidence, warnings, trim limitation, and capacity note. Existing U11 and triage changes remain preserved.
- Exact next action: Planner/reviewer reviews the fresh `reports/deck/` set and final U12 rulings; Docker VM capacity is a concern only before a future E2E run.

### 2026-09-28 — U12 documentation reconciled

- U12 is the current verified state: `deck:shots` returned `ok: true` with 26 shots; the fresh manifest contains 26 entries; every referenced PNG exists and is nonblank; the only skip is the missing trim OBJ fixture set. Stale pre-completion resume instructions are marked historical/superseded; Docker disk-full state is retained only as a capacity concern before future E2E runs.
- Next planned milestone from `docs/project/BUILD_PLAN.md`: **Step 1 — Hosted/local schema and security reconciliation**. Do not begin it in this task.
- Prerequisites: U12 review is complete; read-only access to the hosted Supabase project; a dated comparison of hosted migration history, effective RLS, storage buckets/policies, edge-function configuration, and legacy workspace policies. No SQL or hosted mutation is authorized.
- Owner decisions/access needed: the owner must identify the authoritative environment for reconciliation (hosted Supabase versus repository/local migrations), grant read-only project/SQL metadata access sufficient to inspect migration ledger, RLS/storage policies and edge-function settings, and decide whether legacy broad policies are in scope for retirement or preservation. The acceptance deliverable is a dated drift report and role/access test matrix.
- Exact next action: Planner/reviewer confirms the authoritative environment and grants the required read-only Supabase access; then begin Step 1 in a separate task. Docker resources remain untouched.

### 2026-09-28 — Step 1 hosted access preflight

- Read `docs/project/BUILD_PLAN.md`, `docs/project/SESSION_LOG.md`, and `docs/project/CODEBASE_AUDIT.md`; inspected the current unchanged worktree first.
- Local authority metadata identifies hosted Supabase project ref `otkuqwpsgxzlaxbclbfi` in `supabase/config.toml`. No secret values were printed, requested, or stored; no Supabase/Vite environment variables are configured in this shell.
- Read-only access check: `/opt/homebrew/bin/supabase --version` returned `2.116.0`; `supabase projects list` stopped with `LegacyPlatformAuthRequiredError: Access token not provided`. No hosted inventory, SQL, policy read, storage read, edge-function read, or hosted write was attempted.
- Step 1 is blocked on hosted authentication and read-only project access. Safe prerequisite: the owner authenticates the Supabase CLI in this environment with an approved token/session, or provides an approved read-only project/dashboard/SQL metadata role without placing secrets in chat. The project ref is already known; no additional project identifier is needed.
- Exact access needed for the later read-only inventory: hosted migration ledger visibility; read-only SQL metadata access for effective `pg_policies` and storage policies/buckets; read-only edge-function/configuration visibility; and permission to exercise the anonymous/outsider/member/manager/catalogue-editor/staff access matrix. No SQL or hosted mutation is authorized.
- Exact next action: obtain the approved read-only hosted access, then run Step 1 as a separate task under the authority model “hosted describes live behavior; repository migrations control future schema changes after reconciliation.” No Docker resources or local application files were changed by this preflight.

## 2026-09-28 — U11 verification started

- Scope: verify and close out Workspace U11 only; no Phase 8 or hosted Supabase policy work.
- Exact checkout at start: `/Users/a1234/Documents/GitHub/linea-menu-magic`; branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; `main...origin/main` is even.
- Full working-tree status at start: 10 tracked U11-related files modified and 2 untracked U11 workspace components; `docs/project/` also exists from the prior audit. Existing local U11 files confirmed present: `BottomSheet.tsx`, `WorkspaceContext.tsx`, modified `WorkspaceShell.tsx`, `EditorPanel.tsx`, `ManufacturingStrip.tsx`, `LayersDock.tsx`, `useWorkspaceLayout.ts`, `workspaceLayout.ts`, `translations.ts`, `workspace.mjs`, `hybrid-controls.mjs`, and `workspace.test.mjs`.
- Preservation rule: no reset, clean, overwrite, stage, commit, push, deploy, or Docker cleanup has occurred.
- Completed this milestone: reread required audit/build/session/status/harness docs and captured checkout/status with `pwd`, branch/HEAD/upstream/status/log commands.
- In progress: complete U11 diff review, runner/residue checks, unit/build rerun, targeted browser suite, and acceptance decision.
- Exact resume point: inspect the complete U11 diff and disk/local-stack state before running any E2E command.

## 2026-09-28 — U11 runner/residue check

- Completed: reviewed the complete tracked diff and both untracked U11 files. Scope matches phone bottom sheet, three snaps, three tabs, 200px floor, persisted chrome state, and recipe-preserving reset.
- Runner verified: `E2E_SUITE_ONLY` is a quoted grep-E filename filter; the suite deletes/recreates only its log directory, while `e2e:up` recreates the harness scratch copy and runs `supabase db reset`. `e2e:down` stops the labeled local stack and removes that scratch copy.
- Read-only resources: 98GiB disk available; Docker reports 37 images/32 containers/23 volumes; no pruning is authorized or needed. Port 8080 is held by SSH, so the targeted run will use port 8123.
- Read-only residue check on labeled E2E container `supabase_db_otkuqwpsgxzlaxbclbfi`: `product_size_variants=2`, `product_finishes=0`, `designs=0`, `design_versions=0`, `design_sessions=0`, `design_layers=0`. The two size rows are documented harness residue; ownership is confirmed by Docker labels pointing to the harness workdir, so the harness reset is within test scope.
- Exact resume point: run unit/build checks, then `E2E_PORT=8123 E2E_SUITE_ONLY='hybrid-controls|workspace' npm run e2e:suite` and preserve its per-scenario logs.

## 2026-09-28 — U11 targeted browser verification passed

- Unit/build milestone: `node --test 'scripts/e2e-local/unit/*.test.mjs'` passed 83/83; `npm run build` passed. Build emitted existing Browserslist/Tailwind/chunk-size warnings only.
- Targeted command: `E2E_PORT=8123 E2E_SUITE_ONLY='hybrid-controls|workspace' npm run e2e:suite`.
- Targeted result: **2/2 passed in 3m41s**. Logs: `/var/folders/k5/gfx9qq1n60n95ppvr93b1nv40000gn/T/linea-e2e-suite/hybrid-controls.log`, `workspace.log`, and `_up.log`.
- Browser evidence: `hybrid-controls` reported 390px width, `peek` viewport 544px/sheet 154px, `half` viewport 349px/sheet 349px, `full` viewport 200px/sheet 498px, `scrollWidth=390`, no offenders, and 200px with the Check/manufacturing content open. `workspace` reported Parts open survives reload and Reset folds it while leaving one design layer; desktop selection/layout checks also passed. Both scenario logs had `ok: true`; workspace had no console errors. Hybrid-controls had one pre-existing React `fetchPriority` DOM warning on the home hero, unrelated to U11.
- Residue after targeted run: `product_size_variants=0`, `product_finishes=0`, `designs=0`, `design_versions=0`, `design_sessions=0`, `design_layers=0`. The harness reset only the labeled disposable E2E stack; no Docker prune/volume cleanup was performed.
- Exact resume point: run the full suite on the same unchanged tree using a separate log directory, then decide whether to update STATUS/BUILD_PLAN and close U11.

## 2026-09-28 — U11 closed

- U11 state: **verified/closed** against targeted browser acceptance; application changes remain uncommitted and unpushed.
- Commands/results: `node --test 'scripts/e2e-local/unit/*.test.mjs'` = 83/83 pass; `npm run build` = pass; `E2E_PORT=8123 E2E_SUITE_ONLY='hybrid-controls|workspace' npm run e2e:suite` = 2/2 pass in 3m41s; full `E2E_PORT=8123 E2E_SUITE_SKIP_UP=1 E2E_SUITE_LOG_DIR=/tmp/linea-e2e-suite-full npm run e2e:suite` = 46/48 in 20m21s.
- Full-suite failures: `branding-defaults` timed out at `branding-defaults.mjs:349` waiting for `part-row-lettering` visibility; `cms-branding-marks` timed out at `cms-branding-marks.mjs:169` waiting for a toast. U11 `hybrid-controls` and `workspace` passed in the same full run. Logs: `/tmp/linea-e2e-suite-full/`.
- Browser evidence: targeted hybrid-controls measured peek 544px, half 349px, full 200px viewport at 390px; expanded Check also 200px; width 390px/no offenders. Workspace verified three tabs, one selected content surface, reload persistence and recipe-preserving Reset.
- Residue after full suite: `product_size_variants=2`, `product_finishes=2`, all checked design/workspace tables 0. This is documented test residue; no manual deletion, Docker prune, volume deletion, or cleanup was performed.
- Documentation changed by this task: `docs/3d-editor/STATUS.md` (U11 done/evidence/limits), `docs/project/BUILD_PLAN.md` (U11 completed and next risks), and this session log. Existing U11 application/scenario files and untracked components remain untouched.
- Final checkout: branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`, still 0 ahead/behind. Working tree remains the pre-existing 10 modified U11 tracked files plus 2 untracked U11 components, with `docs/project/` documentation files from the audit/task.
- Exact next action: review the two unrelated full-suite failures and the documented test residue before the next build milestone; do not start Phase 8 in this task.

## 2026-09-27 — audit started

- Status: in progress.
- Scope: read-only codebase/product audit for the next build plan. Application code and Supabase migrations must not be changed.
- Verified checkout: `/Users/a1234/Documents/GitHub/linea-menu-magic`, branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`; `main...origin/main` is even.
- Working tree: pre-existing local-only U11 changes are present in 10 tracked files and 2 untracked workspace components. They are preserved and are part of the audit target; no files have been modified by this audit yet.
- Completed: Phase 0 checkout/status inspection; repository/doc inventory; route and feature map; editor persistence/rendering map; Supabase/RLS/storage map; build/deployment map; audit and proposed build plan.
- Completed checks: 83 unit tests passed; production build passed; git diff --check passed; lint failed with 47 errors and 43 warnings.
- In progress: final worktree verification and interruption/resume handoff.
- Not started: browser E2E on dirty U11; hosted Supabase drift/security verification; product decision on the two studio models.
- Next action: review docs/project/CODEBASE_AUDIT.md and BUILD_PLAN.md; if U11 is intended, freeze/review its diff and run targeted browser scenarios on a clean local stack.

## 2026-09-30 — Step 1 hosted/local schema follow-up

- Scope: read-only reconciliation of every local Supabase migration filename/version and the SQL/application use for `design_sessions`, `design_layers`, `design_exports`, `designs`, `design_versions`, `design_assets`, `design_quotes`, and `design_shares`. No hosted writes, SQL writes, migrations, policy changes, Docker cleanup, staging, commit, push, or application-code changes.
- Checkout at review: branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`; pre-existing U11/U12 worktree changes preserved. The new report is the only file added by this follow-up.
- Commands/evidence: `find supabase/migrations -maxdepth 1 -type f -name '*.sql' | sort` found 34 local migrations; `rg` identified the target-table creation/policy migrations and upload call sites; `supabase/migrations/20260917120000_designer_studio_phase1.sql` was read through its RLS, grants, and storage sections. The local CLI preflight remains unauthenticated, so the hosted facts in the report are the owner-supplied evidence rather than an independent catalog query.
- Version conclusion: hosted evidence reports 14 ledger rows through `20260615193612`; local history includes `20260615193616` and Phase 1 `20260917120000_designer_studio_phase1.sql` plus later migrations. Phase 1 is absent from the supplied hosted ledger. Whether it was not applied, applied outside the ledger, or recreated manually remains unresolved without hosted catalog evidence.
- Policy conclusion: local final intent for the three legacy tables is brand-scoped authenticated access with anonymous privileges removed (`20260423090500` plus `20260615120000`). Supplied hosted evidence says permissive authenticated `ALL` true policies remain effective, which is a material drift/overbreadth finding. RLS enabled on 55 tables does not establish restrictive effective policies. No recommendation to drop policies was made; grants, product intent, and role tests remain prerequisites.
- Application/storage conclusion: legacy Composer uses `design_sessions/layers/exports` and public `design-assets` paths `backgrounds/<session>` and `exports/<session>`; new logo assets use private path-scoped `design-uploads` and `design_assets`; CMS media uses `product-assets`; product OBJ uploads use `product-models`; flipbook uploads use `flipbook-assets`. The access matrix and ownership rationale are recorded in the dated report.
- Changed files: `docs/project/STEP1_DRIFT_REPORT_2026-09-30.md` and this `docs/project/SESSION_LOG.md`. No application, migration, policy, hosted, Docker, or unrelated worktree files changed.
- Verification: `git diff --check` is the next required read-only check before handoff; no unit/build/E2E rerun was needed for this documentation-only drift review.
- Exact resume point: obtain approved read-only hosted catalog access for project `otkuqwpsgxzlaxbclbfi`, then compare the complete hosted ledger, effective grants/policies, Phase 1 schema/functions, storage policies, edge-function metadata, and the six-persona role matrix. Do not apply remediation until that evidence and product intent are reviewed.

## 2026-10-01 — Step 1 Lovable export supplement

- Verified repository path `/Users/a1234/Documents/GitHub/linea-menu-magic`; branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; `main...origin/main` remains even. Existing U11/U12 application, screenshot, runner, and documentation changes remain uncommitted and unstaged.
- Read `docs/project/STEP1_DRIFT_REPORT_2026-09-30.md` and this session log before editing. No hosted data, policies, migrations, application code, Docker resources, or unrelated files were changed.
- Added the owner-supplied Lovable SQL Editor evidence to the dated drift report: `authenticated` has `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on `design_sessions`, `design_layers`, and `design_exports`; the grants export also lists `TRUNCATE`, recorded as a catalog grant and not as a normal Supabase REST API capability.
- Recorded that each legacy table has a permissive authenticated `ALL` policy with `USING true` and `WITH CHECK true`, plus a broad authenticated `SELECT` policy. This confirms hosted overbreadth against local intended brand-scoped policy history, but does not prove public data exposure or runtime API behavior.
- Recorded that the hosted columns export confirms structures for `designs`, `design_versions`, `design_shares`, `design_quotes`, `design_assets`, `design_sessions`, `design_layers`, and `design_exports`, with the local migration field/constraint baseline for comparison. Actual hosted runtime constraints, role behavior, and API exposure remain unverified.
- Preserved the evidence boundary: no inference that `design-assets` contains new-editor uploads; local application tracing still maps new-editor logo uploads to private `design-uploads`.
- Files changed by this follow-up: `docs/project/STEP1_DRIFT_REPORT_2026-09-30.md` and this `docs/project/SESSION_LOG.md`. The directory is pre-existing untracked documentation; all unrelated worktree changes remain preserved.
- Verification: `git diff --check` passed; final diff inspection is recorded at handoff. No tests/build/E2E run because this was a read-only documentation reconciliation.
- Remaining Step 1 gaps: exact hosted migration filenames beyond the supplied count/latest, complete hosted constraints/indexes/triggers/grants for the five new tables, storage policies/bucket contents, edge-function configuration, and anonymous/outsider/member/manager/catalogue-editor/staff runtime/API role tests.
- Exact next action: obtain or run an approved read-only hosted catalog/role-test export for those remaining gaps, then reconcile the complete Step 1 matrix before recommending any policy change. Do not apply hosted or local remediation yet.

## 2026-10-06 — Step 1 reconciliation handoff verified

- Repository verified at `/Users/a1234/Documents/GitHub/linea-menu-magic`; branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; `main...origin/main` is even. The worktree retains the pre-existing U11/U12 application, screenshot, runner, and documentation changes; no unrelated file was modified by this verification.
- The dated drift report already records both owner-supplied Lovable SQL Editor exports: authenticated `SELECT`, `INSERT`, `UPDATE`, and `DELETE` grants on `design_sessions`, `design_layers`, and `design_exports`; the catalog `TRUNCATE` entry is not described as a normal Supabase REST API capability; each table has permissive authenticated `ALL` with `USING true` and `WITH CHECK true` plus broad authenticated `SELECT`; and the hosted columns export confirms the eight requested table structures.
- Evidence boundaries remain explicit: actual Supabase API exposure and runtime role behavior are unverified; no public data breach is claimed; and no inference is made that `design-assets` contains new-editor uploads. Local tracing continues to map new-editor logo uploads to private `design-uploads`.
- Changed documentation scope for this handoff: `docs/project/STEP1_DRIFT_REPORT_2026-09-30.md` contains the export supplement; `docs/project/SESSION_LOG.md` contains this entry. The entire `docs/project/` directory remains untracked and was not staged, committed, or pushed. All pre-existing unrelated worktree changes remain preserved.
- Verification performed: `git diff --check` passed. No hosted data, policies, migrations, application code, Docker resources, staging, commit, push, or deployment was performed.
- Remaining Step 1 gaps: exact hosted migration filenames beyond the supplied count/latest; complete hosted constraints, indexes, triggers, grants, and policies for the five new tables; storage policies and bucket contents; edge-function metadata; and safe anonymous/outsider/member/manager/catalogue-editor/staff runtime/API role tests.
- Exact next action: obtain approved read-only hosted catalog and role-test evidence for those remaining gaps, then reconcile the complete Step 1 matrix before recommending any policy change. Do not apply remediation until that evidence and product intent are reviewed.

## 2026-10-07 — Step 1 constraints and storage CSV supplement

- Verified repository path `/Users/a1234/Documents/GitHub/linea-menu-magic`; branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; branch remains even with upstream. Existing U11/U12 and documentation worktree changes were preserved.
- Read the current `docs/project/STEP1_DRIFT_REPORT_2026-09-30.md` and `docs/project/SESSION_LOG.md` before editing. No hosted data/policies, migrations, application code, Docker resources, staging, commit, push, or deployment was performed.
- Added the owner-supplied 2026-10-07 CSV findings to the dated drift report: 34 hosted constraints across the eight design tables, covering primary/foreign keys, `CHECK`, and `UNIQUE` constraints. These are recorded as PostgreSQL migration requirements for a future RDS migration.
- Recorded the unresolved cross-column integrity evidence: no exported constraint proves `design_quotes.design_version_id` belongs to the quote’s `design_id`, or `designs.current_version_id` belongs to that design. No defect is claimed; application-level enforcement remains unverified.
- Recorded storage evidence: public `SELECT` policies for `design-assets`, `flipbook-assets`, `product-assets`, and `product-models`; `design-assets` and `flipbook-assets` authenticated upload/update/delete policies check only `bucket_id`; `design-uploads` uses first-folder-segment owner/brand-role checks; product asset/model writes are catalogue-editor-only.
- Preserved evidence boundaries: exports show neither object contents nor runtime behavior. No breach is claimed, no policy change is recommended, and no inference is made that `design-assets` contains new-editor uploads. Edge Function inventory and safe anonymous/outsider/member/manager/catalogue-editor/staff role-behavior tests remain Step 1 gaps.
- Changed files by this task: `docs/project/STEP1_DRIFT_REPORT_2026-09-30.md` and this `docs/project/SESSION_LOG.md`. The existing untracked `docs/project/` directory and all unrelated modified files remain untouched.
- Exact next evidence: read-only hosted migration ledger names; complete constraint/index/trigger/grant/policy metadata; Edge Function inventory/configuration; storage policy expressions and bucket metadata; and controlled safe role tests, especially for the bucket-only `design-assets`/`flipbook-assets` write policies and the two cross-column ownership relationships.

## 2026-10-07 — comprehensive audit refresh before new implementation

- Verified checkout: `/Users/a1234/Documents/GitHub/linea-menu-magic`; branch `main`; HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`; upstream `origin/main`; branch is even with upstream. Full status was captured before edits: existing U11/U12 editor, deck, scenario, status, and report changes remain dirty; `docs/project/` and the two workspace components remain untracked. No existing changes were overwritten.
- Full working-tree status at start:
  ```text
  M docs/3d-editor/STATUS.md
  M reports/deck/00-finishes-contact-sheet.png
  M reports/deck/01-catalogue-entry.png
  M reports/deck/02-editor-first-open.png
  M reports/deck/03-finish-sheet.png
  M reports/deck/04-finish-gold.png
  M reports/deck/05-finish-anti-brass.png
  M reports/deck/06-ruler-on.png
  M reports/deck/07-add-text.png
  M reports/deck/08-position-curve.png
  M reports/deck/09-text-bottom-arc.png
  M reports/deck/10-straight-text.png
  M reports/deck/11-ruler-layer.png
  M reports/deck/12-logo-layer.png
  M reports/deck/13-layers-list.png
  M reports/deck/14-anonymous-banner.png
  M reports/deck/15-mobile.png
  M reports/deck/15b-mobile-finish-sheet.png
  M reports/deck/15c-mobile-text-layer.png
  M reports/deck/16-cms-upload.png
  M reports/deck/20-cms-groups.png
  M reports/deck/23-relief-raised.png
  M reports/deck/24-relief-engraved.png
  M reports/deck/25-manufacturing-strip.png
  M reports/deck/manifest.json
  M scripts/e2e-local/deck/shots.mjs
  M scripts/e2e-local/scenarios/branding-defaults.mjs
  M scripts/e2e-local/scenarios/cms-branding-marks.mjs
  M scripts/e2e-local/scenarios/hybrid-controls.mjs
  M scripts/e2e-local/scenarios/workspace.mjs
  M scripts/e2e-local/unit/workspace.test.mjs
  M src/features/editor/components/EditorPanel.tsx
  M src/features/editor/components/ManufacturingStrip.tsx
  M src/features/editor/components/workspace/LayersDock.tsx
  M src/features/editor/components/workspace/WorkspaceShell.tsx
  M src/features/editor/hooks/useWorkspaceLayout.ts
  M src/features/editor/lib/workspaceLayout.ts
  M src/features/i18n/translations.ts
  ?? docs/project/
  ?? src/features/editor/components/workspace/BottomSheet.tsx
  ?? src/features/editor/components/workspace/WorkspaceContext.tsx
  ```
- Deployment target verified from `README.md`: Lovable project `a8e59680-e4fc-4735-a797-36af2f7e2875`, published via Lovable Share → Publish, with optional Lovable custom domain. `supabase/config.toml` identifies backend project `otkuqwpsgxzlaxbclbfi`; no repo CI/deployment manifest was found.
- Read and reconciled `docs/project/CODEBASE_AUDIT.md`, `BUILD_PLAN.md`, `SESSION_LOG.md`, `docs/3d-editor/STATUS.md`, architecture/ruling documents, `README.md`, `package.json`, `vite.config.ts`, `supabase/config.toml`, the complete route declarations in `src/App.tsx`, relevant editor/composer/CMS hooks/components, migrations, edge functions, and `scripts/e2e-local/README.md` plus runner scripts.
- Verified current code map: public catalogue/content, CMS, brochure/flipbook flows, legacy composer/workspace (`design_sessions`/`design_layers`/`design_exports`), and new 3D editor (`designs`/`design_versions`/`design_assets`) coexist. Anonymous recipes use sessionStorage; signed-in drafts autosave to `designs.draft_recipe`; named versions are immutable rows with snapshots; OBJ/model ingestion uses `product-models`, scale/reset triggers, and branding metadata; logo uploads use private path-scoped `design-uploads`.
- Verified security/deployment boundaries against local code and supplied hosted exports: local migrations contain 34 files through `20260918110000`; hosted evidence remains 14 ledger rows through `20260615193612`; the hosted/local drift report records broad legacy policy/grant evidence, 34 hosted constraints, storage policy shapes, and unresolved runtime/API behavior. Edge Function inventory is limited locally to `generate-product-images` and `bootstrap-demo-user`; hosted deployment/configuration remains unverified.
- Search result: no identifiable MO06/MO09 definition, route, migration, or E2E scenario exists in the repository. They remain unplaced and unstarted pending exact scope and acceptance criteria; no feature work began.
- Checks run on the unchanged tree: `node --test 'scripts/e2e-local/unit/*.test.mjs'` = **83/83 passed**; `npm run build` = **passed** with existing Browserslist/Tailwind/chunk-size warnings; `npm run lint` = **failed** with 47 errors and 43 warnings; historical E2E/deck results remain those recorded earlier (corrected full suite 48/48, U12 deck 26 shots with one trim-fixture skip). No E2E, Docker, hosted, or deployment action was started in this audit.
- Documentation changed by this audit: `docs/project/CODEBASE_AUDIT.md`, `docs/project/BUILD_PLAN.md`, and this session log. No application code, migrations, database data, Lovable, deployment, or Docker resources changed.
- Exact resume point: complete the remaining read-only Step 1 evidence—hosted migration names, full constraints/indexes/triggers/grants/policies, storage metadata and expressions, Edge Function inventory/configuration, and safe role tests—then make the owner decision on legacy versus new studio ownership. Only after those gates should MO06/MO09 be scoped and placed.

## 2026-10-07 — focused MO06/MO09 onboarding plan

- Scope: read-only onboarding proposal only. The comprehensive codebase audit was not repeated. Verified repository `/Users/a1234/Documents/GitHub/linea-menu-magic`, branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`, and an unchanged dirty worktree before editing. Existing U11/U12 application, deck, scenario, status, report, and untracked workspace changes remain preserved.
- Evidence reviewed: `src/features/admin/hooks/useProductModel.ts`, `src/components/admin/product-editor/ProductModelEditor.tsx`, `src/features/editor/hooks/useEditorProduct.ts`, `src/features/editor/components/EditorModel.tsx`, `src/features/editor/components/PartsGroup.tsx`, `src/features/editor/components/PartProperties.tsx`, `supabase/migrations/20260917120000_designer_studio_phase1.sql`, `supabase/migrations/20260918110000_phase4a_model_scale.sql`, `supabase/migrations/20260903130000_catalogue_schema_m1.sql`, and the existing audit/drift documents.
- Current implemented path: catalogue-editor `.obj` upload to public `product-models/models/<productId>/<timestamp>.obj`; client raw-bound parsing and product metadata update; CMS unit/known-dimension/two-point calibration; product lookup by slug/id; Three.js `OBJLoader`; stored mm scale plus selected-size ratio; finish/colour, zones, hide/show, selection, and branding-group behavior. Replacing a model resets scale and branding metadata. Buyer editor refuses an unconfirmed model.
- Scene-tree finding: `EditorModel.tsx` reports direct mesh children in file order using `mesh.name || group_<n>`. `PartsGroup.tsx` makes those rows selectable and hideable; `PartProperties.tsx` reads the selected report group. The separate original-lettering row represents marked groups and is not selectable. Thus missing OBJ object/group names do not prevent parsing/rendering, but they leave human-readable labels and stable branding mapping unresolved.
- MO06/MO09 finding: neither OBJ file nor product definition exists in the repository, and no upload was performed. The supplied absence of physical units/dimensions blocks scale confirmation; absent object/group names blocks stable label/branding mapping. These are owner inputs, not application defects.
- Decision: no schema, RLS, storage-policy, or Edge Function change is required by the existing local onboarding path itself. This is conditional on read-only confirmation that hosted `products` model columns, `product_size_variants`, the `product-models` bucket, effective public read, catalogue-editor writes, and outsider denial exist and behave as intended. Direct OBJ upload/display does not depend on Edge Functions unless image generation is added.
- Step 1 impact: product/model schema and bucket-policy metadata plus catalogue-editor/member/outsider role tests directly affect onboarding. Legacy design-table policy drift, design-assets/flipbook-assets tests, cross-column design constraints, and share/quote/version tests do not block basic product model wiring; they remain unrelated Step 1 gaps. No hosted policy recommendation was made.
- Proposed acceptance: obtain files/checksums/source units/physical primary dimensions/target variants/product identity; unnamed OBJ objects remain acceptable, with the agreed `Object <n>` fallback and optional rename-later behavior treated separately from model wiring; run no-upload local OBJ preflight; confirm scale and size variant; wire through existing CMS only after hosted product-model evidence and role tests pass; verify editor load, Parts selection/hide, finishes and sizing without treating material sections as semantic parts.
- Files changed by this task: `docs/project/BUILD_PLAN.md` and this `docs/project/SESSION_LOG.md` only. No code, migration, database, hosted configuration, Lovable, deployment, Docker resource, OBJ file, stage, commit, or push was changed.
- Final verification before stopping: `git diff --check` passed. `git status --short` confirms the pre-existing modified U11/U12, deck, scenario, editor, and status files remain present, while `docs/project/` and the two workspace components remain untracked; no staged files or commits were created.
- Exact next action: obtain the missing MO06/MO09 files and the specific unit/dimension, target-variant, and product-identity inputs first; then run local no-upload OBJ preflight and read-only hosted product-model schema/bucket/role checks before wiring product rows. Do not begin a new feature.

## 2026-10-07 — focused MO06/MO09 OBJ preflight

- Verified checkout before inspection: `/Users/a1234/Documents/GitHub/linea-menu-magic`, branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`. The existing dirty worktree was preserved; no repository files, database data, hosted configuration, Docker resources, or OBJ files were changed.
- Inputs inspected read-only from `/Users/a1234/Downloads`: `MO06.obj` is 30,462,687 bytes, SHA-256 `8e69fa6a538d8695baead89d159735dfad00c804ffb8f88eb437f25983ba8566`; `MO09.obj` is 6,455,728 bytes, SHA-256 `665308af2669528876cb68c469961992fa75c1003a6336042c06736c27701caa`.
- OBJ syntax/geometry evidence: both files have one `mtllib`, no `o` records, no `g` records, and one `usemtl` stream split into material sections (`MO06`: 271 `usemtl`, 138,044 vertices, 150,063 faces; `MO09`: 18 `usemtl`, 29,870 vertices, 29,488 faces). No unit, millimetre, centimetre, inch, scale, or dimension declaration was present in the inspected text.
- Raw vertex bounds, before any importer rotation or scale: MO06 x `[-6.604060650, 10.050701141]`, y `[-0.130465582, 4.930465698]`, z `[-20.399999619, 2.250285864]`, size `16.654761791 × 5.060931280 × 22.650285482` raw units. MO09 x `[-17.179864883, 16.906665802]`, y `[-1.322194457, 1.500010610]`, z `[-12.605049133, 12.490335464]`, size `34.086530685 × 2.822205067 × 25.095384598` raw units. These are not physical millimetre dimensions until the source unit is supplied; no unit conversion was inferred.
- Actual importer probe: repository `three`/`OBJLoader` parsed both files successfully. Each produced exactly one root mesh child with an empty name. MO06 had 450,189 expanded position vertices and 271 geometry material groups; MO09 had 88,464 expanded position vertices and 18 geometry material groups. The current editor filters direct mesh children, so each file exposes one selectable Parts row, not 271/18 semantic part rows. Material sections are not treated as product-part semantics.
- Label finding: `EditorModel.tsx:268` currently uses `mesh.name || \`group_${index + 1}\``; these files therefore display one fallback row, `group_1`. `PartsGroup.tsx` makes that row selectable and hideable. Under the agreed behavior, unnamed objects are acceptable and should display default labels `Object 1`, `Object 2`, etc.; the current fallback needs adjustment from `group_<n>` to `Object <n>`. A user-rename path is not present in the inspected current row/store flow, so “rename later” remains an unimplemented/unverified follow-up rather than a prerequisite for these files.
- Catalogue evidence: repository migrations contain generic sample products but no MO06/MO09 rows and no seeded size variants for them; the E2E size scenarios create temporary examples such as 10.8, 15, 20 and 25 mm, which are not target-product evidence. Hosted anonymous REST returned no `MO`-matching product rows. Hosted products with existing models showed one default `15.00` mm variant in the sampled records, but that is catalogue precedent only and must not be assigned to MO06/MO09 without owner confirmation.
- Focused hosted read-only probes against the configured project `otkuqwpsgxzlaxbclbfi`: anonymous REST query selecting product model columns returned HTTP 200; anonymous REST query selecting `product_size_variants` fields returned HTTP 200; an existing hosted product-model object returned HTTP 200 from the public object URL. The bucket metadata endpoint returned HTTP 400 and did not expose policy metadata through this probe. Catalogue-editor upload/update/delete and outsider-denial behavior were not exercised because no user credential was requested or stored; no write request was made. Effective policy expressions remain unverified and require approved read-only catalog evidence or role credentials.
- Preflight conclusion: both files are importer-compatible and selectable as one unnamed object each, but wiring is blocked by missing source units, physical millimetre reference dimensions, target/default size variants, and product identity/material/finish data. No schema, RLS, storage-policy, Edge Function, upload, or deployment change was made or justified by this preflight.
- Exact next action: obtain from the owner for each model the source unit and physical primary dimension in millimetres, intended default/available `product_size_variants` (the existing hosted 15 mm rows are not authoritative), product slug/item code/name/material/finish/publication data, and confirmation that the fallback-label change to `Object 1` is desired. Then make the minimal label-only application change if approved, rerun the local no-upload parser/scene-tree check, and only afterward wire the products through the existing catalogue flow with separate authorized role verification.
- Final status check for this preflight: `git diff --check` passed; no stage/commit/push/deploy occurred; all pre-existing worktree changes remain.

## 2026-10-09 — hosted product-model access-path probe

- Verified checkout: `/Users/a1234/Documents/GitHub/linea-menu-magic`, branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`; the full pre-existing dirty status remains unchanged and preserved.
- Access used: existing `.env` publishable Supabase client only. No secret was printed, requested, or stored. Repository E2E accounts were identified as local disposable-stack accounts (`scripts/e2e-local/lib/stack.mjs`); they are not treated as hosted credentials, and no hosted sign-in or account creation was attempted.
- Hosted anonymous/read-only evidence: REST selection of product model fields (`model_storage_path`, `model_raw_bounds`, `model_scale_status`, `model_scale_factor`, `model_scale_reference_variant_id`, `model_branding_groups`) returned HTTP 200; REST selection of size-variant fields (`size_primary_mm`, `size_secondary_mm`, `size_label`, `is_default`, `sort_order`) returned HTTP 200. A known existing `product-models` object URL returned HTTP 200. No hosted MO06/MO09 product row was visible in the anonymous slug probe.
- Policy/role boundary: the anonymous bucket-metadata endpoint did not expose policy metadata. Catalogue-editor upload/association/update/delete and outsider denial were not safely testable with available hosted access. The prior local migration/export evidence records intended public model read and catalogue-editor model writes, but effective hosted policy expressions and authenticated runtime role behavior remain unverified. No uploads, writes, SQL, policy changes, or deployment occurred.
- Result: ordinary public product/model reading is evidenced for existing hosted data; the hosted write/authorization path is not fully verified. This does not block OBJ wiring once MO06/MO09 dimensions, source units, target variants, and product metadata are confirmed, unless production acceptance specifically requires the missing role tests first.
- Documentation changed: `docs/project/BUILD_PLAN.md` and this `docs/project/SESSION_LOG.md`. No application or database files changed.
- Exact next action: obtain the remaining MO06/MO09 physical dimensions/source units, target/default variants, and product metadata; then apply only the approved `Object <n>` fallback-label adjustment and wire through the existing CMS flow. Separately obtain hosted catalogue-editor and outsider test sessions or an approved read-only policy export if those role checks are required for release acceptance.

## 2026-10-09 — OBJ scene-tree default labels and renaming

- Verified before editing: repository `/Users/a1234/Documents/GitHub/linea-menu-magic`, branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`; complete pre-existing dirty and untracked status was preserved. No audit or OBJ preflight was repeated.
- Implementation: `EditorModel.tsx` now uses one-based `Object <n>` fallback labels. New pure `partNames.ts` helpers normalize, display, and clear custom names. `DraftRecipe` accepts optional index-keyed `part_names`; `normalizeRecipe` reads it forward, and `useEditorStore.renamePart` writes it through the existing recipe/history/autosave path. `PartsGroup.tsx` provides inline rename/save/cancel controls; `PartProperties.tsx` reflects the custom display name. Selection and `hidden_groups` remain keyed by OBJ index, so rename does not disturb selection or visibility.
- Persistence conclusion: `designs.draft_recipe` and `design_versions.recipe` already store the complete recipe JSON. No schema, migration, authorization, hosted-data, RLS, or storage change was needed.
- Tests added: `scripts/e2e-local/unit/part-names.test.mjs` covers `Object 1` numbering, trimming/clearing, and recipe normalization. `scripts/e2e-local/scenarios/parts-list.mjs` now covers scene-tree rename, recipe read-back, reload persistence, and subsequent hide/show behavior.
- Verification: focused unit test 3/3 passed; full `node --test 'scripts/e2e-local/unit/*.test.mjs'` passed; `npm run build` passed with existing Browserslist/Tailwind/chunk-size warnings; targeted ESLint over changed implementation/test files passed; `git diff --check` passed; `E2E_PORT=8123 E2E_SUITE_ONLY='parts-list' npm run e2e:suite` passed 1/1 in 29 seconds. The scenario used the existing disposable fixture only; MO06/MO09 were not uploaded.
- Remaining limitation: custom names are keyed by OBJ child index, and the UI rename path is intentionally label-only; material sections are not semantic parts. Replacing a model can require label review. No hosted writes, uploads, deployments, commits, or pushes occurred.
- Exact next action: obtain MO06/MO09 source units, physical primary dimensions in millimetres, target/default size variants, and product identity/material/finish/publication metadata; then wire the products through the existing CMS flow. Keep hosted catalogue-editor/outsider role testing as separate release evidence if required.

## 2026-10-09 — Phase 11 local isolate control

- Verified before editing: repository `/Users/a1234/Documents/GitHub/linea-menu-magic`, branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`; complete dirty and untracked status preserved. Read the Phase 11 plan and compared prerequisites with current code. U11, local phases 4a/4c/4d, model replacement reset, calibration, branding recovery, selection, hide/show, and rename were already present or covered; isolate was named in the plan but absent.
- Scope selected: smallest unblocked local OBJ task — an index-based Parts isolate toggle. `useEditorStore.isolatePart` derives all current mesh indices from the runtime report, hides all other indices through existing `hidden_groups`, and repeats to restore all visible. `PartsGroup` exposes the control and preserves selection, rename, and visibility controls. No schema, migration, hosted access, model upload, MO06/MO09 metadata, or deployment was involved.
- Tests: full unit suite `node --test 'scripts/e2e-local/unit/*.test.mjs'` passed **86/86**; production `npm run build` passed with existing Browserslist/Tailwind/chunk-size warnings; targeted ESLint for changed implementation/scenario files passed; `git diff --check` passed. Focused `E2E_PORT=8123 E2E_SUITE_ONLY='parts-list' npm run e2e:suite` first timed out at `parts-list.mjs:97` because the scenario expected the pre-isolate mesh count after restore-all; after correcting the test sequence to hide then show explicitly, the rerun passed **1/1 in 30 seconds**. The scenario used only the existing disposable fixture; MO06/MO09 were not uploaded.
- Documentation changed: `docs/project/BUILD_PLAN.md` and this session log. Application changes are limited to the local scene-tree isolate control, its translations, and the focused scenario; all prior dirty/untracked files remain untouched.
- Exact next action: keep MO06/MO09 wiring/publication paused until the owner supplies source units, physical millimetre dimensions, target/default variants, and product metadata. The next independent Phase 11 candidate is first-import/import-dialog UX; confirm its intended local acceptance before starting it. Do not begin Phase 12 or hosted remediation.

## 2026-10-10 — Phase 11 first-import/import-dialog UX

- Verified before editing: repository `/Users/a1234/Documents/GitHub/linea-menu-magic`, branch `main`, HEAD `316a974b7b7c0aa4a5372978fd2029ae9f360cd6`, upstream `origin/main`. The complete pre-existing dirty and untracked worktree was preserved; no reset, clean, stage, commit, push, deploy, hosted write, upload, or MO06/MO09 use occurred.
- Read the Phase 11 plan and inspected `src/components/admin/product-editor/ProductModelEditor.tsx` plus the CMS model scenarios. The explicitly planned gap was real: first file selection/drop uploaded immediately and had no import dialog. Replacement/reset was already implemented and covered, so it was not changed.
- Implementation scope: `ProductModelEditor.tsx` now stores only a first-import pending `File`, shows a controlled dialog with filename plus Cancel/Import OBJ actions, and invokes the existing upload mutation only after confirmation. Cancellation does not mutate the product. Existing replacement remains immediate; invalid extensions remain rejected. Added English fallback strings in `src/features/i18n/adminTranslations.ts`. Updated the initial-upload steps in `cms-model-scale.mjs`, `cms-branding-marks.mjs`, `cms-preview-build.mjs`, and `cms-two-point.mjs` to confirm the dialog. No persistence/schema change was needed because pending state is intentionally pre-upload and the existing product-model mutation remains the persistence path.
- Verification commands/results:
  - `npx eslint src/components/admin/product-editor/ProductModelEditor.tsx src/features/i18n/adminTranslations.ts scripts/e2e-local/scenarios/cms-model-scale.mjs scripts/e2e-local/scenarios/cms-branding-marks.mjs scripts/e2e-local/scenarios/cms-preview-build.mjs scripts/e2e-local/scenarios/cms-two-point.mjs` — passed.
  - `node --test 'scripts/e2e-local/unit/*.test.mjs'` — **86/86 passed**.
  - `npm run build` — passed; existing Browserslist, ambiguous Tailwind utility, and chunk-size warnings remain.
  - `git diff --check` — passed.
  - `E2E_PORT=8123 E2E_SUITE_ONLY='cms-model-scale' npm run e2e:suite` — first attempt failed at the test’s immediate dialog-removal assertion (`cms-model-scale.mjs:82`); after changing it to wait for Radix hidden state, rerun passed **1/1 in 12 seconds**. Logs: `/var/folders/k5/gfx9qq1n60n95ppvr93b1nv40000gn/T//linea-e2e-suite/cms-model-scale.log` (latest successful run).
- Documentation changed: this session log and the Phase 11 section of `docs/project/BUILD_PLAN.md`. Application/test changes are limited to the first-import dialog and affected initial-upload scenario steps. Existing deck, U11, U12, scene-tree, and other dirty/untracked files remain present and were not cleaned or overwritten.
- Limitations: the dialog confirms filename/intent only; OBJ parsing, dimensions, scale confirmation, and storage validation still occur in the existing upload/scale path. Replacement intentionally does not show the first-import dialog. No additional hover/fit policy was inferred.
- Exact next action: keep MO06/MO09 product wiring/publication paused until the owner supplies source units, physical millimetre dimensions, target/default size variants, and product metadata. If another Phase 11 task is authorized, choose a separately specified hover/fit policy; otherwise review this local import UX. Do not begin Phase 12 or hosted remediation.
