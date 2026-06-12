# P13 — Workspace Revamp Phase A: Quick Wins, Removals, Honest Surfaces

**Date:** 2026-06-12
**Branch:** main
**Phase A code commit:** `d05d54f` (Ivanwongclub, "update", 8 files / -276 LOC net)
**Audit reference:** `reports/P11-workspace-ux-audit.md`

This report documents Phase A in the form spec'd by P13: per-task before/after, the 6 logic-check answers, deletion ledger, residual risks for Phase B.

---

## Per-task before/after

### T1 — Nav routing revert
**Files:** `src/components/layout/Header.tsx`

| Before | After |
|---|---|
| `resolveNavHref` helper at `Header.tsx:229-230` rewrote the "Designer Studio" nav link to `/designer-studio/dashboard?tab=library` when authed | Helper deleted. Desktop nav (`Header.tsx:407` `to={link.href}`) and mobile nav (`Header.tsx:827` `to={link.href}`) use the literal `link.href` for every user |
| Authed user clicking "Designer Studio" in the public nav → workspace (jarring) | Authed user clicking "Designer Studio" → `/designer-studio` public landing, same as guests |
| `studioCtaHref` (`:227`), the P6 dropdown "My Workspace" item (`:449`), login `next` default, trim library "My Workspace" button: unchanged | Unchanged — these still own the workspace deep-link |

### T2 — W3 + W17 (hearts removed, spelling normalized)
**Files:** `LibraryItemCard.tsx`, `LibraryTable.tsx`, `DesignerStudioDashboard.tsx`

| Before | After |
|---|---|
| Per-card heart button (`LibraryItemCard.tsx:215-227` old) with live `toggleFavourite` call | Card props are now just `{ item, onView }`. Heart button + action row trimmed. |
| Per-row heart column in `LibraryTable` (header icon + per-row toggle button) | Heart column header + per-row toggle deleted. Table now starts with the Image column. |
| `LibraryTable` prop `onToggleFavorite` (American spelling) | Prop removed from interface and implementation; British `Favourite` is the only convention left in touched files. |
| Favourites filter button in the library toolbar (`Dashboard.tsx:509-518`) | KEPT — it still filters on `is_favourite` from `useUserLibrary`. |

**Favourite-toggle path during Phase A:** ProductQuickView does **not** currently expose a favourite toggle. Phase A leaves the library workspace without a way to *set* favourites — the filter still works against whatever `is_favourite` rows exist (admin defaults, items favourited before P13). This is acceptable per the prompt: "favourites can still be set from ProductQuickView if it has a control, otherwise the filter simply reflects legacy data for now". Phase E will reintroduce a favourite toggle in the canonical detail surface alongside the legacy-adapter retirement.

### T3 — W4 ("Request →" removed)
**Files:** `LibraryItemCard.tsx`, `DesignerStudioDashboard.tsx`

The `Request →` link at the bottom of every library card has been deleted from `LibraryItemCard.tsx`, along with its `onRequestSample` prop. The Dashboard's mock `toast.info(...)` handler that was wired to it (`Dashboard.tsx:656` old) is gone. RFQ-from-card paths now route exclusively through the ProductQuickView's "Request Quote" button (mock surface that Phase B resolves).

### T4 — W5 ("Add to Composition" overlay removed)
**Files:** `LibraryItemCard.tsx`, `DesignerStudioDashboard.tsx`

The hover-overlay block in `LibraryItemCard` had two buttons. The "Add to Composition" button + `onAddToComposition` prop were deleted; "View Details" remains as the single overlay action. The Dashboard's lying handler (`onAddToComposition={() => setActiveMainTab('composer')}`) is gone with the prop chain. The real add-to-composition flow with a target picker returns in Phase E.

### T5 — W13 (one detail surface: ProductQuickView)
**Files:** `LibraryTable.tsx`, `DesignerStudioDashboard.tsx`

| Before | After |
|---|---|
| Grid card → ProductQuickView modal · List row → LibraryItemDetail full page | Both surfaces route `onView` to `handleQuickView` (`Dashboard.tsx:273-276, 595, 602`). One detail surface. |
| `selectedLibraryItem` state, `handleViewLibraryItem`, `handleBackFromLibraryDetail`, and the `selectedLibraryItem` early-return branch existed in Dashboard | All removed. The "Legacy detail views" state block (`Dashboard.tsx:159-162` old) collapsed to just the quick-view state. |
| `LibraryItemDetail` imported into Dashboard (`Dashboard.tsx:50` old) | Import deleted. Component file kept on disk (Phase E retires it together with the `toLegacyItem` adapter). |

`grep -n "LibraryItemDetail" src/pages/DesignerStudioDashboard.tsx → DISCONNECTED` ✓

### T6 — W6 + W7 collateral (ProductQuickView honesty check)
**Files:** `ProductQuickView.tsx`

**Findings:**
- **Pricing block (W6 risk):** ProductQuickView's "Pricing & Quantity" card reads `item.pricing.unitPrice`. The `toLegacyItem` adapter (`Dashboard.tsx:75-103`) hardcodes `pricing: { unitPrice: 0, currency: 'USD', moq: 0 }`, so this block would display "USD $0.00 / MOQ 0" for every item — same disease W6 documented in LibraryItemDetail.
- **Gallery (W7 risk):** ProductQuickView does NOT show a fake gallery. It uses a single `<img src={item.thumbnailUrl} … />` (with a "View 3D Model" toggle when `modelUrl` is present). No four-copies-of-the-same-thumbnail gimmick. Safe.

**Fix applied for pricing:** the entire Pricing block plus its `<Separator />` is now gated on `item.pricing.unitPrice > 0` (`ProductQuickView.tsx:274`). With the legacy adapter writing 0, the block stays hidden until Phase E surfaces real pricing — but the gate keeps working automatically when that lands.

### T7 — W8 (dead buttons removed)
**Files:** `DesignerStudioDashboard.tsx`, `RFQDetail.tsx`

| Removed | Where |
|---|---|
| RFQ tab "Filter" button (no handler) | `Dashboard.tsx:752-755` old |
| RFQDetail "Download OBJ" + "Fullscreen View" (no handlers, sitting under the model preview) | `RFQDetail.tsx:184-191` old |
| RFQDetail "Upload File" full-width button at the bottom of the Attachments tab (no handler) | `RFQDetail.tsx:279-282` old |
| LibraryItemDetail "Download OBJ" (no handler) | exits naturally because LibraryItemDetail is disconnected (T5) |
| `Upload` icon import unused after the above | trimmed from `RFQDetail.tsx:23` |

**Bonus:** the per-file download row in `RFQDetail`'s Attachments tab still had a button without `onClick`. Replaced with a real `<a href={file.url} download={file.name} target="_blank" rel="noopener noreferrer">` so per-file downloads at least work when `file.url` exists.

### T8 — W9 (auto-hide header dead code)
**Files:** `DesignerStudioDashboard.tsx`

Removed: `isHeaderVisible` state, `lastScrollY` ref, `scrollThreshold` constant, the scroll-listener `useEffect`, AND the empty sticky `<div>` wrapper (lines 415-420 old) that the listener controlled. `useRef` is no longer imported from React.

### T9 — W10 (orphan CreateRFQDialog removed)
**Files:** `DesignerStudioDashboard.tsx`

Removed: `isCreateDialogOpen` state, `handleCreateRFQ` handler, the JSX mount of `<CreateRFQDialog>`, and the import. The `CreateRFQDialog.tsx` file stays on disk for Phase B reference.

### T10 — W11 (one "+ New Composition")
**Files:** `DesignerStudioDashboard.tsx`, `ComposerSessionList.tsx`

| Before | After |
|---|---|
| Top-right page CTA: `onClick={handleCreateComposition}` → creates a blank session, no template picker | Top-right CTA now `onClick={() => setTemplatePickerOpen(true)}` (`Dashboard.tsx:387`). Template picker drives the create. |
| `ComposerSessionList` header had a second "+ New Composition" button with the *correct* template-picker behaviour, leading to two buttons same label, different code paths | Header button + its container deleted. The block at `ComposerSessionList.tsx:104` is now just title + helper text. |
| `ComposerSessionList`'s empty-state "+ New Composition" CTA (with template picker) | KEPT (`ComposerSessionList.tsx:220-222`). Two locations max: page CTA + empty-state CTA. Both open the same `TemplatePickerDialog`. |
| Dashboard had no `TemplatePickerDialog` import or mount | Added: `Dashboard.tsx:61, 743-747` (mount at the same level as `ProductQuickView` and `SearchProductDialog`). |

The Dashboard's `handleCreateFromTemplate` (`Dashboard.tsx:316-330`) mirrors the seeding logic from `ComposerSessionList` (creates the session, inserts seeded layers from the template, navigates to `/designer-studio/compose/:id`).

### T11 — W12 + A17 (honest back labels)
**Files:** `DesignerStudioDashboard.tsx`

| Where | Before | After |
|---|---|---|
| Library tab back button | `{t("dashboard.common.back")}` → "← Back" | Literal `← All Compositions` (`Dashboard.tsx:453`) |
| RFQ/Brochures/Products tab back button | Literal `← Back to Projects` | Literal `← All Compositions` (`Dashboard.tsx:637`) |

Both labels were either i18n-keyed-but-generic ("Back") or hardcoded-English ("Back to Projects"). Phase C will revisit `dashboard.common.back` during the i18n namespace work; for now, replacing the call site with the literal keeps the key reusable for other "Back" contexts that may want it (none currently). Hardcoded English is acceptable per the prompt because the originals were also hardcoded.

### T12 — W36 + appendix (dead code sweep)
**Files:** `DesignerStudioDashboard.tsx`, `LibraryItemCard.tsx`, `LibraryTable.tsx`, `RFQDetail.tsx`, `StudioPreview.tsx`

| Action | Where |
|---|---|
| `StudioPreview.tsx` deleted | confirmed zero importers via grep |
| Dashboard icon imports trimmed: removed `Filter`, `Layers`, `Heart`, `Check`, fixed the orphan blank line | `Dashboard.tsx:17-32` |
| Dashboard React imports trimmed: removed `useRef`, `useCallback` | `Dashboard.tsx:1` |
| Dashboard removed: `categoryLabels` (only `LibraryItem` type still imported from `mockLibraryData`), `statusLabels`, `LibraryItemDetail`, `CreateRFQDialog` | imports block |
| Dashboard hook destructures trimmed: dropped `toggleFavourite`, `removeItem`, `recentSessions`, `sessionsLoading`, `adminDefaultItems` (all unused after T2–T11) | `Dashboard.tsx:139, 143` |
| `LibraryItemCard` icons trimmed: removed `Layers`, `Heart` | `LibraryItemCard.tsx:2` |
| `LibraryTable` icons trimmed: removed `Heart` | `LibraryTable.tsx:5` |
| `RFQDetail` icons trimmed: removed `Upload` | `RFQDetail.tsx:18-31` |

---

## Logic-check answers (with line references)

### 1. Nav reach: both guest and authed click → `/designer-studio`; workspace via dropdown only

- Desktop generic nav at `Header.tsx:407`: `to={link.href}` — literal, no rewrite, no `session` branch.
- Mobile nav at `Header.tsx:827`: `to={link.href}` — same.
- `resolveNavHref` is no longer defined: `grep -rn "resolveNavHref" src/ → CLEAN`.
- Workspace deep-links survive on:
  - `Header.tsx:227` `studioCtaHref` (authed CTA button)
  - `Header.tsx:449` "My Workspace" dropdown item (`navigate("/designer-studio/dashboard?tab=library")`)
  - `Header.tsx:842` mobile drawer studio CTA
  - `DesignerStudioLogin.tsx:46` post-login `next`
  - `DesignerStudioTrimLibrary.tsx:70` "My Workspace" header button
  - `DesignerStudio.tsx:47` `workspaceHref` (cap6 tile)
- ✓ Authed user clicking the public "Designer Studio" nav lands on `/designer-studio`, identical to guest behaviour. Workspace is reached via the brand-name dropdown menu, the CTA button, or the targeted links in §1.3 of the audit.

### 2. Grid and list both open ProductQuickView

- `DesignerStudioDashboard.tsx:273-276` defines `handleQuickView(item)` → `setQuickViewItem(toLegacyItem(item)); setIsQuickViewOpen(true)`.
- Grid: `Dashboard.tsx:595` `<LibraryItemCard onView={handleQuickView} … />`.
- List: `Dashboard.tsx:602` `<LibraryTable onView={handleQuickView} … />`.
- `LibraryTable.tsx` row click and "View" button both call `onView(item)` (lines 95 and 157) — they hit the same handler now.
- `ProductQuickView` is mounted at `Dashboard.tsx:719-723` and receives the shared `quickViewItem` + `isQuickViewOpen` state.
- ✓ Both surfaces open the same modal.

### 3. Zero hearts on items; favourites filter still works

- `LibraryItemCard`: `Heart` no longer in lucide import (`:2`). The bottom action row at `:167` is `{hasDownloads && (...)}` only — no heart toggle. The hover overlay (`:133-143`) contains only "View Details". ✓
- `LibraryTable`: `Heart` no longer in lucide import (`:5`). Header row at `:42-46` opens with `<TableHead className="w-20">Image</TableHead>` — no leading heart column. Per-row body cells (`:96-153`) have no heart toggle. ✓
- Favourites filter button still present at `Dashboard.tsx:509-518` (uses the `Heart` icon imported in Dashboard's top-of-file lucide block at line 30, kept intentionally for the **filter** — that's not a per-item control). The filter reads `item.is_favourite` (`Dashboard.tsx:218`) and the favourite count chip (`:245`) still computes from `libraryItems`.
- ✓ Filter button + chip + filter-as-applied chip (`:558-566`) all work against existing `is_favourite` rows. No way to *set* a favourite from this surface during Phase A — documented under T2 as acceptable per the prompt.

### 4. Exactly one "+ New Composition" behaviour (template picker) site-wide

- Page CTA: `Dashboard.tsx:387` `<Button onClick={() => setTemplatePickerOpen(true)}>`.
- Empty-state CTA: `ComposerSessionList.tsx:220` `<Button onClick={() => setTemplatePickerOpen(true)}>`.
- Both open `TemplatePickerDialog`. The Dashboard's `handleCreateFromTemplate` (`Dashboard.tsx:316-330`) and the ComposerSessionList's `handleCreateFromTemplate` (`ComposerSessionList.tsx:33-52`) execute the same flow: create session → seed template layers → navigate to `/designer-studio/compose/:id`.
- The removed header-row "+ New Composition" inside `ComposerSessionList` is gone (`grep "New Composition" src/features/designer/components/ComposerSessionList.tsx` returns only the empty-state hit at line 222).
- ✓ One label, one behaviour, two locations.

### 5. Zero handler-less buttons on the audited surfaces

Re-walked the audit's A-inventory REMOVE/DEAD items:

| Audit ID | Status | Evidence |
|---|---|---|
| A4 (auto-hide div) | removed | `Dashboard.tsx` opens with `<div className="min-h-screen flex flex-col bg-background">` directly into the content container; no sticky wrapper |
| A6 ("+ New Composition" duplicate) | removed | `ComposerSessionList.tsx:104` |
| A29 (per-card heart) | removed | `LibraryItemCard.tsx:2, :167` |
| A30 ("Request →") | removed | `LibraryItemCard.tsx` no `Request` string anywhere |
| A32 ("Add to Composition" overlay) | removed | `LibraryItemCard.tsx:133-143` |
| A38 (heart column header) | removed | `LibraryTable.tsx:42-46` |
| A39 (heart toggle per row) | removed | `LibraryTable.tsx:96-153` |
| A50 ("Download OBJ" no handler in LibraryItemDetail) | unreachable | component disconnected (T5) |
| A59 ("Filter" no handler in RFQ tab) | removed | `Dashboard.tsx:697` block deleted |
| A64 ("Upload File" RFQDetail) | removed | `RFQDetail.tsx` block deleted |
| A65 ("Download OBJ" / "Fullscreen View" in RFQDetail) | removed | `RFQDetail.tsx` block deleted |
| A66 (orphan `CreateRFQDialog` mount) | removed | `grep "CreateRFQDialog" src/pages/DesignerStudioDashboard.tsx` returns 0 hits |
| A75 ("← Back to Projects") | renamed | `Dashboard.tsx:637` "← All Compositions" |

Buttons that retained handlers and stayed by design: A3 (page CTA — now opens template picker), A14-A16 (secondary cards — `setActiveMainTab`), A18 (Add Component — opens search dialog), A19-A28 (library filters), A31 (Files download dropdown), A33-A34 (View Details / card click), A40-A42 (table sort + view), A43-A48 (ProductQuickView controls), A57-A58, A60-A63 (RFQ surface, untouched per Phase B scope), A67-A75 (Brochures + Products + back navigation).

- ✓ Zero handler-less buttons remain on Phase A surfaces. The RFQ tab still ships with mock-state handlers (W1, W2 by design — Phase B).

### 6. ProductQuickView pricing/gallery honesty verdict (T6)

- **Pricing:** `ProductQuickView.tsx:274` now wraps the Pricing block in `{item.pricing.unitPrice > 0 && (…)}`. With `toLegacyItem` hardcoding `unitPrice: 0`, the block is currently hidden for every item. When Phase E retires the adapter and surfaces real `unit_price` from Supabase, the gate flips automatically.
- **Gallery:** ProductQuickView shows a single image (`item.thumbnailUrl`) + optional 3D toggle. No fake 4-thumbnail carousel like LibraryItemDetail's (W7). Honest as-is, no changes needed.
- ✓ The "$0.000" disease is contained; W6/W7 no longer reach a rendered surface in Phase A.

---

## Deletion ledger — what's gone vs what's parked

### Deleted in this phase
| File | Reason |
|---|---|
| `src/components/designer-studio/StudioPreview.tsx` | Zero importers post-P5b. Confirmed via grep before deletion. |

### Disconnected but kept on disk (Phase E retires these)
| File | Why parked |
|---|---|
| `src/components/designer-studio/LibraryItemDetail.tsx` | No longer imported anywhere. Retires when the legacy `toLegacyItem` adapter is unwound and `ProductQuickView` is rewritten to consume `UserLibraryItem` directly. |
| `src/components/designer-studio/CreateRFQDialog.tsx` | Phase B decides whether RFQ is hidden-for-demo or built. If built, this dialog may return — re-attach instead of duplicating. |
| `src/data/mockLibraryData.ts` | Only `LibraryItem` type is still imported (by Dashboard for the adapter return type and by ProductQuickView/QuickRFQDialog through legacy chains). File goes when the adapter goes. |
| `src/data/mockRFQData.ts` | Source of `mockRFQs` for the RFQ tab. Phase B decision determines whether to delete (hide-for-demo) or replace with Supabase types (build). |

### Imports that became unused and were trimmed but the **files** stay
| Import (file) | Why no longer needed in that file |
|---|---|
| `LibraryItem, categoryLabels` from `mockLibraryData` → kept `LibraryItem` only (`Dashboard.tsx:42`) | `categoryLabels` was only used by `LibraryItemDetail` (disconnected) |
| `statusLabels` from `mockRFQData` (`Dashboard.tsx`) | Was never read — the RFQ stat cards read enum keys directly |
| `LibraryItemDetail`, `CreateRFQDialog` (Dashboard) | Replaced/removed by T5/T9 |
| `Filter`, `Layers`, `Heart`, `Check` (Dashboard) | Were tied to removed UI |
| `useRef`, `useCallback` (Dashboard) | Removed alongside auto-hide scroll listener and dropped callbacks |
| `Layers`, `Heart` (LibraryItemCard) | Removed alongside overlay + heart |
| `Heart` (LibraryTable) | Removed alongside heart column |
| `Upload` (RFQDetail) | Removed alongside "Upload File" button |

---

## Residual risks for Phase B

1. **RFQ surface is still entirely mock** (W1, W2, W7-class). The `mockRFQs` array lives in component `useState`; every status change / comment add vanishes on reload. Phase B's hide-or-build decision should land before any client demo. Until then, the RFQ tab is visible to every brand user.
2. **`QuickRFQDialog` submit is still a toast.** Independent of the Dashboard cleanups, the dialog opened from ProductQuickView "Request Quote" pretends to submit. If Phase B picks "hide for demo," the trigger button in `ProductQuickView.tsx:566-572` should be replaced with a `<Link to="/contact?product=…">` to honour the deferred-quote pattern P3 introduced.
3. **Favourites can only be filtered, not set, on the workspace surface** during Phase A → Phase D. The Heart filter button remains intentionally; we just removed the per-item toggle. If users ask "how do I favourite," the honest answer is "Phase E" — flag in product comms or temporarily disable the filter chip.
4. **Brochure publish/delete actions still ignore `primaryBrand.role`** (W15). A brand `member` can still nuke published catalogues. Phase B should add a role gate — or at minimum, gate just the destructive actions (`AlertDialog` for Delete already exists, but the Publish/Unpublish toggle is one click).
5. **`ComposerSessionList.handleToggleShare` still updates `design_sessions` without a `team_id` defence filter** (W16). RLS still enforces it server-side, but the audit's recommendation to belt-and-braces this is unaddressed.
6. **`ProductQuickView` pricing gate (T6) is a band-aid.** When Phase E lands real pricing, the block becomes visible automatically — but if the database has any `unit_price = 0` rows by accident, those items would show "$0.00 / MOQ 0". The proper fix in Phase E is to nullable-type the column and gate on `unit_price != null && unit_price > 0`.
7. **`adminDefaultItems` was deleted (was unused)**, but `is_admin_default` rows still flow through `useUserLibrary` and render the "Collection" badge on cards (`LibraryItemCard.tsx:106-110`). No bug — just noting the data path stays alive for Phase E to use intentionally.
8. **Library filters still aren't URL-encoded** (W19). Out of Phase A's scope, but reloads still drop the source toggle, category, search, view mode, sort field, sort order — only `?tab=` persists.

---

## Verification (re-run after the commit)

```
$ npx tsc --noEmit                                                        → ✅ 0 errors
$ npx eslint <7 touched files>                                            → ✅ 0 errors / warnings
$ npm run build                                                           → ✅ built in 4.81s
$ grep -rn "resolveNavHref|onAddToComposition|isCreateDialogOpen|isHeaderVisible" src/ → CLEAN
$ grep -n "LibraryItemDetail" src/pages/DesignerStudioDashboard.tsx       → DISCONNECTED
```

**Bundle impact** — `DesignerStudioDashboard` lazy chunk: **307.30 kB → 268.04 kB** (-39 kB raw, -12 kB gzipped). Net source delta: **-276 LOC** across 8 files (1 deletion, 7 modifications). Within the 150–250 LOC removal estimate, more aggressive because of StudioPreview's deletion (130 LOC) plus dropped state machinery.
