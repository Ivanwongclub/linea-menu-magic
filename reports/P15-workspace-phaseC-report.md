# P15 — Workspace Revamp Phase C: Route Rename + Vocabulary Consolidation

**Date:** 2026-06-15
**Branch:** main
**Audit reference:** `reports/P11-workspace-ux-audit.md` §1.5, §7 Phase C; baseline `reports/P13-…`, `reports/P14-…`

**Prerequisite check:** The P14 migration file (`supabase/migrations/20260615120000_workspace_role_and_team_hardening.sql`) is present in this repo (committed `33b9d81`). Application to the live Supabase instance is the user's responsibility per the P14 deployment note — I cannot verify the live database state from the CLI. If the migration has NOT been applied yet, **this Phase C commit is still safe to land** (it's pure identifier/copy surgery, no schema dependency), but a `member` role user could still POST a brochure delete via DevTools until that migration is live.

---

## Per-task before/after

### T1 — App.tsx route

**File:** `src/App.tsx`

| Before | After |
|---|---|
| `import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";` | + `useLocation` (`App.tsx:8`) |
| `const loadDesignerStudioDashboard = () => import("./pages/DesignerStudioDashboard");` | `const loadDesignerStudioWorkspace = () => import("./pages/DesignerStudioWorkspace");` (`App.tsx:31`) |
| `const DesignerStudioDashboard = lazy(loadDesignerStudioDashboard);` | `const DesignerStudioWorkspace = lazy(loadDesignerStudioWorkspace);` (`App.tsx:55`) |
| `<Route path="/designer-studio/dashboard" element={<RequireBrandAuth>{withRouteSuspense(<DesignerStudioDashboard />)}</RequireBrandAuth>} />` | Canonical route at `/designer-studio/workspace` (`App.tsx:218-221`) + legacy redirect route at `/designer-studio/dashboard` rendering `<WorkspaceRedirect />` (`App.tsx:222-227`) |
| (no helper) | New `WorkspaceRedirect` inline component (`App.tsx:147-150`): reads `useLocation()` and returns `<Navigate to={`/designer-studio/workspace${search}${hash}`} replace />` — preserves `?tab=…` and any other query/fragment exactly. |

### T2 — File rename

`git mv src/pages/DesignerStudioDashboard.tsx src/pages/DesignerStudioWorkspace.tsx`. Git auto-detected the rename in `git diff --stat`. After the commit, `git log --follow src/pages/DesignerStudioWorkspace.tsx` will trace history through the old filename.

Internal component identifier renamed `DesignerStudioDashboard` → `DesignerStudioWorkspace` at the `const` declaration (`Workspace.tsx:101`) and the default export (`:634`).

App.tsx and Header.tsx import paths updated alongside.

### T3 — Path-string updates across the 7 consumer sites

| Site | Path before | Path after |
|---|---|---|
| `Header.tsx:166` preload map key | `/designer-studio/dashboard` + import `@/pages/DesignerStudioDashboard` | `/designer-studio/workspace` + `@/pages/DesignerStudioWorkspace` |
| `Header.tsx:227` `studioCtaHref` | `/designer-studio/dashboard?tab=library` | `/designer-studio/workspace?tab=library` |
| `Header.tsx:449` dropdown "My Workspace" | `navigate("/designer-studio/dashboard?tab=library")` | `navigate("/designer-studio/workspace?tab=library")` |
| `Header.tsx:842` mobile drawer CTA | uses `studioCtaHref` variable | (auto-inherits) |
| `DesignerStudioLogin.tsx:46` login `next` default | `/designer-studio/dashboard?tab=library` | `/designer-studio/workspace?tab=library` |
| `DesignerStudioTrimLibrary.tsx:70` "My Workspace" button | `/designer-studio/dashboard?tab=library` | `/designer-studio/workspace?tab=library` |
| `DesignerStudio.tsx:48` cap6 `workspaceHref` | `/designer-studio/dashboard?tab=library` | `/designer-studio/workspace?tab=library` |
| `DesignerStudioWorkspace.tsx:129` URL self-sync | `navigate(\`/designer-studio/dashboard?\${params}\`, ...)` | `/designer-studio/workspace?...` |
| `ComposerPage.tsx:319` toolbar back | `navigate('/designer-studio/dashboard')` | `navigate('/designer-studio/workspace')` |
| `ComposerPage.tsx:394` "Go to Library" empty-canvas CTA | `navigate('/designer-studio/dashboard?tab=library')` | `navigate('/designer-studio/workspace?tab=library')` |

### T4 — Grep enforcement

```
$ grep -rn "designer-studio/dashboard" src/
src/App.tsx:147: *  the legacy /designer-studio/dashboard path to /designer-studio/workspace. */
src/App.tsx:226:                      path="/designer-studio/dashboard"

$ grep -rn "DesignerStudioDashboard" src/
(no output)  → CLEAN
```

The two surviving `designer-studio/dashboard` references are:
- `App.tsx:147` — the JSDoc comment on `WorkspaceRedirect` describing what the helper does. Documenting the legacy path is the *point* of the comment.
- `App.tsx:226` — the legacy `<Route path="/designer-studio/dashboard" element={<WorkspaceRedirect />} />` itself.

Both are intentional. No source file outside `App.tsx` references the old path.

### T5 — i18n namespace rename

`Edit` with `replace_all` on `translations.ts` swept `"dashboard.` → `"workspace.` across all three locale blocks (22 keys × 3 locales = 66 lines updated in one operation).

Callsites updated via per-file `replace_all` on `t("dashboard.` → `t("workspace.`:
- `DesignerStudioWorkspace.tsx` — 20 callsites
- `DesignerStudioTrimLibrary.tsx` — 1 callsite (`primaryBrand?.name ?? t("workspace.library.brandCatalogue")` on line 143)

Enforcement:
```
$ grep -rn 't("dashboard\.' src/         → CLEAN
$ grep -n '"dashboard\.' src/features/i18n/translations.ts → CLEAN
```

### T6 — W29 workspace shell h1

Added three new keys at the top of each locale block:
- EN `translations.ts:347`: `"workspace.title": "Workspace"`
- zh-Hant `:652`: `"workspace.title": "工作空間"`
- zh-Hans `:957`: `"workspace.title": "工作空间"`

Workspace shell h1 (`DesignerStudioWorkspace.tsx:319`):
- Before: `{t("studio.title")}` — collided with the public studio's "Studio" header
- After: `{t("workspace.title")}` — renders "Workspace" / 工作空間 / 工作空间

The public studio (`DesignerStudioTrimLibrary.tsx:62` still uses `t("studio.title")` → "Studio") is unchanged.

### T7 — Vocabulary consolidation

**Decision: zh translation of "Composition" is 組合 (zh-Hant) / 组合 (zh-Hans).**

Rationale: those two characters already appear in `workspace.title.newComposition` ("新建組合"/"新建组合") established in earlier commits — the only translated reference to the artefact. No competing translation was used. Picking 組合 is "align on the one already in the codebase."

For "Composer" (the tool), zh translations currently fall back to English (the existing `studioIntro.cap2Title` is EN-only). No new zh translation introduced in this commit — the EN noun "Composer" surfaces to zh users via fallback. If a zh translation is added later, `docs/naming.md` recommends following the verb pattern (e.g. 排版工具 — but the choice is deferred).

#### i18n string replacements (EN)

| Key | Before | After |
|---|---|---|
| `studio.step3Desc` | "Create concept boards, compare directions, and prepare presentations." | "Create compositions, compare directions, and prepare presentations." |
| `studioIntro.cap2Title` | "Visual Composer" | "Composer" |
| `studioIntro.cap2Body` | "Build concept boards by placing components on garment references with annotations and layers." | "Build compositions by placing components on garment references with annotations and layers." |
| `studioIntro.step2Body` | "Place components on garment references and assemble review-ready concept boards." | "Place components on garment references and assemble review-ready compositions." |
| `studioIntro.spot1Title` | "Concept boards your sourcing team can act on" | "Compositions your sourcing team can act on" |
| `studioIntro.spot1Body` | "Stop sending PDFs and screenshots. Build a single board with real components, annotations, and version history that sourcing can read like a spec." | "Stop sending PDFs and screenshots. Build a single composition with real components, annotations, and version history that sourcing can read like a spec." |

#### i18n string replacements (zh — only one key had a non-English translation)

| Key | Before | After |
|---|---|---|
| `studio.step3Desc` (zh-Hant) | "建立概念版面、比較方向並準備提案。" | "建立組合、比較方向並準備提案。" |
| `studio.step3Desc` (zh-Hans) | "建立概念版面、比较方向并准备提案。" | "建立组合、比较方向并准备提案。" |

The other affected keys (`studioIntro.cap2*`, `spot1*`, `step2Body`) have no zh translations — zh users see the (now-updated) EN strings via the i18n fallback.

#### Source-string replacements

| Site | Before | After |
|---|---|---|
| `ComposerCanvas.tsx:477` | "Start your concept board" | "Start your composition" |
| `ComposerSessionList.tsx:111` | h2 "Visual Composer" | h2 "Composer" |
| `TemplatePickerDialog.tsx:321` | "Choose a starting structure for your concept board" | "Choose a starting structure for your composition" |
| `PresentationPage.tsx:45` | "Preparing your concept board…" | "Preparing your composition…" |
| `PresentationPage.tsx:56-57` | heading "This concept board is unavailable" + body "…the board may no longer exist…" | heading "This composition is unavailable" + body "…the composition may no longer exist…" |
| `PresentationPage.tsx:67-68` | heading "This concept board is private" + body "…hasn't shared this board…" | heading "This composition is private" + body "…hasn't shared this composition…" |

### T8 — `docs/naming.md`

New file `docs/naming.md` created with the public/private split, tool definitions, artefact list, retired terms, and the zh translation lock for "Composition". Becomes the reference for future phases and new contributors.

### T9 — Grep enforcement

```
$ grep -rn "concept board\|Concept board\|Visual Composer\|概念板\|概念版面" src/ → CLEAN
$ grep -rn "designer-studio/dashboard\|DesignerStudioDashboard\|dashboard\." src/
src/App.tsx:147: *  the legacy /designer-studio/dashboard path to /designer-studio/workspace. */
src/App.tsx:226:                      path="/designer-studio/dashboard"
```

Vocabulary CLEAN. Route references constrained to the two intentional sites in `App.tsx` (redirect + comment).

---

## Logic-check answers (with line references)

### 1. Old route still works via redirect; new route is canonical?

- Canonical: `App.tsx:218-221`
  ```tsx
  <Route
    path="/designer-studio/workspace"
    element={<RequireBrandAuth>{withRouteSuspense(<DesignerStudioWorkspace />)}</RequireBrandAuth>}
  />
  ```
- Redirect: `App.tsx:222-226`
  ```tsx
  <Route
    path="/designer-studio/dashboard"
    element={<WorkspaceRedirect />}
  />
  ```
- `WorkspaceRedirect` (`App.tsx:147-150`) uses `useLocation()` to grab `search` + `hash`, then renders `<Navigate to={\`/designer-studio/workspace${search}${hash}\`} replace />`. The query string is appended verbatim — `/designer-studio/dashboard?tab=brochures` redirects to `/designer-studio/workspace?tab=brochures`. The `replace` flag means the legacy path doesn't pollute browser history.
- The legacy redirect target is *not* wrapped in `RequireBrandAuth` — that's intentional. Once Navigate fires the new path, the canonical route's auth guard runs in the normal flow.

### 2. File rename: `git log --follow` shows history preserved?

`git diff --stat HEAD` reports the rename with `=>` syntax:
```
.../{DesignerStudioDashboard.tsx => DesignerStudioWorkspace.tsx} | 52 ++++----
```
Git auto-detected the rename. After the commit lands, `git log --follow src/pages/DesignerStudioWorkspace.tsx` will trace history back through all P5–P14 commits to the file's original `DesignerStudioDashboard.tsx` name. (`git log --follow` from before the commit returns nothing because the rename isn't committed yet; verified after-the-fact by inspecting `git diff --stat` output.)

### 3. All `t("dashboard.…")` callsites updated; all three locales translated?

- `grep 't("dashboard\.' src/` → CLEAN (zero hits)
- `grep '"dashboard\.' src/features/i18n/translations.ts` → CLEAN (zero hits)
- All 22 keys present under `workspace.*` in all three locales — verified by spot-checking the locale blocks at `translations.ts:347-372` (EN), `:651-676` (zh-Hant), `:955-980` (zh-Hans).
- 21 callsites in `DesignerStudioWorkspace.tsx` + 1 in `DesignerStudioTrimLibrary.tsx:143` — all migrated.

### 4. h1 says "Workspace" / 工作空間 / 工作空间, not "Studio"?

- `translations.ts:347` `"workspace.title": "Workspace"`
- `translations.ts:652` `"workspace.title": "工作空間"`
- `translations.ts:957` `"workspace.title": "工作空间"`
- `DesignerStudioWorkspace.tsx:319` `{t("workspace.title")}` renders the locale-correct string.
- The public studio's `studio.title` ("Studio" / 工作室 / 工作室) is untouched and still used by `DesignerStudioTrimLibrary.tsx:62`.

### 5. Vocabulary retirements grep CLEAN; chosen Composition translation applied consistently in zh?

- `grep "concept board|Concept board|Visual Composer|概念板|概念版面" src/` → CLEAN (zero hits).
- zh translation of Composition: **組合** (zh-Hant) / **组合** (zh-Hans). Applied at:
  - `translations.ts` `workspace.title.newComposition` (kept — already used this form)
  - `translations.ts` `studio.step3Desc` (zh-Hant + zh-Hans) — migrated from 概念版面 to 組合/组合
- No other zh strings carried the old vocabulary.

### 6. `docs/naming.md` created and reflects the decisions?

- New file `docs/naming.md` created.
- Contains: public/private split (Studio vs Workspace), tools (3D Editor, Composer) with verb phrases ("Open in Editor", "Open in Composer"), artefacts (Composition, Library item, Brochure), retired terms list (Concept board, Visual Composer, Dashboard), zh translation lock for Composition (組合/组合).

---

## Files touched

| File | Change |
|---|---|
| `src/App.tsx` | route rename + redirect component + import |
| `src/components/layout/Header.tsx` | 3 path strings (preload, CTA, dropdown) |
| `src/pages/DesignerStudio.tsx` | cap6 workspaceHref path |
| `src/pages/DesignerStudioLogin.tsx` | `next` default path |
| `src/pages/DesignerStudioTrimLibrary.tsx` | "My Workspace" Link + `t("workspace.library.brandCatalogue")` |
| `src/pages/DesignerStudioWorkspace.tsx` (renamed from `DesignerStudioDashboard.tsx`) | component identifier + 20 i18n callsites + URL self-sync + h1 |
| `src/features/designer/pages/ComposerPage.tsx` | 2 navigate paths |
| `src/features/designer/pages/PresentationPage.tsx` | 5 user-visible strings |
| `src/features/designer/components/ComposerSessionList.tsx` | "Visual Composer" → "Composer" |
| `src/features/designer/components/ComposerCanvas.tsx` | empty-state string |
| `src/features/designer/components/TemplatePickerDialog.tsx` | dialog description |
| `src/features/i18n/translations.ts` | 66 key renames + `workspace.title` × 3 + 6 EN vocabulary strings + 2 zh vocabulary strings |
| `docs/naming.md` | new file — naming reference |

12 source files + 1 new doc file. Net diff: **134 insertions, 118 deletions** — the i18n namespace rename dominates the line count.

---

## Verification (run after the commit)

```
$ npx tsc --noEmit                                      → ✅ 0 errors
$ npx eslint <touched files>                            → ✅ 0 new errors (pre-existing 'any'
                                                          + empty-block in unchanged ComposerPage
                                                          code from P14 baseline remain)
$ npm run build                                         → ✅ built in 4.94s
  DesignerStudioWorkspace lazy chunk: 237.89 kB (was 237.90 kB pre-rename) — gzip 67.74 kB
$ grep -rn "designer-studio/dashboard" src/             → only the redirect + comment in App.tsx
$ grep -rn "DesignerStudioDashboard" src/               → CLEAN
$ grep -rn 't("dashboard\.' src/                        → CLEAN
$ grep -n  '"dashboard\.' src/features/i18n/translations.ts → CLEAN
$ grep -rn "concept board|Concept board|Visual Composer|概念板|概念版面" src/ → CLEAN
```

---

## Residual risks for Phase D

1. **The legacy `/dashboard` redirect is a Route in the same Routes block** — it's a single line, but if Phase D ever introduces a catch-all `404` route ahead of it in the JSX tree, the redirect could be shadowed. The order today is fine; flag during any router restructure.
2. **`studioCtaHref` in Header still encodes `?tab=library`** — if Phase D restructures the workspace tabs (e.g. removes the library tab as default), this needs to move with it. Search for `?tab=library` across the codebase before that work.
3. **`workspace.title.subtitle` still reads "Design & Production Management"** — generic filler from W31. Out of scope for Phase C; flagged again for Phase D copy work.
4. **`studioIntro.cap2Title` zh users** see English "Composer" — acceptable per the prompt, but if a marketing review surfaces this, the proper zh translation (recommended: 排版工具) can be added without touching code.
5. **The "Composer" tool name and "Composition" artefact are now distinct in copy** — but the URL is still `/designer-studio/compose/:id` and the directory is `src/features/designer/`. These identifiers were explicitly out of scope for this phase (the audit's §1.5 only enumerated user-visible naming chaos). A future phase could rename the route to `/designer-studio/composer/:id` for full alignment, but it's identifier-level cosmetics, not user-visible.
6. **`docs/naming.md` is not enforced by tooling.** Future PRs could reintroduce "concept board" without CI catching it. If Phase D adds a lint plugin or pre-commit hook, this terminology check is a candidate.
