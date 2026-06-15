# P17 — Workspace Revamp Phase E: Adapter Retirement, Filter Persistence, Real Composer Add, Mobile, Polish

**Date:** 2026-06-15
**Branch:** main
**Audit reference:** `reports/P11-workspace-ux-audit.md` findings W18, W19, W20, W26, W27, W28, W31–W34. Baselines: P13/P14/P15/P16 reports.

**Prerequisite check:** P14 + P15 migrations present in repo (`supabase/migrations/20260615120000_workspace_role_and_team_hardening.sql` confirmed committed in `33b9d81`). Live application to Supabase is the user's responsibility per the P14 deployment note; this Phase E is identifier/code surgery with no schema dependency, so it lands safely either way.

This is the final workspace revamp phase. Five independent tracks, landed in a single commit for atomicity.

---

## TRACK 1 — Legacy adapter retirement

### T1.1 Inventory before

```
src/features/products/legacyTypes.ts:14    export interface LibraryItem
src/features/products/legacyTypes.ts:57    export const categoryLabels
src/pages/DesignerStudioWorkspace.tsx:39   import { LibraryItem } from "@/data/mockLibraryData"
src/pages/DesignerStudioWorkspace.tsx:63   function toLegacyItem(item): LibraryItem  (28-line adapter)
src/pages/DesignerStudioWorkspace.tsx:122  useState<LibraryItem | null>
src/pages/DesignerStudioWorkspace.tsx:231  setQuickViewItem(toLegacyItem(item))
src/components/designer-studio/LibraryItemDetail.tsx (disconnected since P13)
src/components/designer-studio/ProductQuickView.tsx (consumes LibraryItem)
src/components/designer-studio/QuickRFQDialog.tsx (QUARANTINED P14)
src/data/mockLibraryData.ts (re-exports LibraryItem + categoryLabels)
```

### T1.2 ProductQuickView migrated to UserLibraryItem

Prop type changed from `LibraryItem | null` to `UserLibraryItem | null`. Every field reference rebuilt at the top of the component as derived locals:

```tsx
const p = item.product;
const displayName    = item.custom_name || p?.name_en || p?.name || 'Untitled';
const itemCode       = p?.item_code ?? '';
const slug           = p?.slug ?? itemCode;
const modelUrl       = p?.model_url;
const modelType      = deriveModelType(p?.primary_category?.slug ?? p?.categories?.[0]?.slug);
const description    = p?.description_en || p?.description;
const isPublic       = p?.is_public ?? true;
const teamName       = item.team_name;
const categoryName   = p?.primary_category?.name ?? p?.categories?.[0]?.name;  // REAL taxonomy
const specs          = (item.custom_specs ?? p?.specifications ?? {}) as Record<string, unknown>;
const production     = (p?.production ?? {}) as Record<string, string>;
const colorOptions   = Array.isArray(specs.color_options) ? specs.color_options : [];
const applications   = p?.industries?.map(i => i.name) ?? [];
const certifications = p?.certifications ?? [];
const downloads      = item.downloadable_files ?? [];
const images         = p?.images ?? [];
const primaryImage   = images.find(img => img.is_primary)?.url ?? images[0]?.url ?? p?.thumbnail_url;
```

Key consequence changes:
- **Pricing block deleted entirely** (T1.2 ask) — no synthetic data, no W6 gate.
- **Production block now gates per field** — only renders fields the product actually has.
- **Specifications loop iterates real entries** (was a hardcoded whitelist of 6 properties); strips `color_options`/`size_options` since those have dedicated sections.
- **Category badge** uses `item.product.primary_category?.name` (real taxonomy), not the lying `categoryLabels[item.category]` whose adapter always wrote `'buttons'`. W27 fixed at the structural level.
- **Image** uses `images.find(is_primary) ?? images[0] ?? thumbnail_url` — no synthetic 4-thumbnail gallery (W7 stays fixed).
- **Created → Added** label change (`item.added_at` instead of `item.createdAt`); W28 (the two-equal-dates bug) gone because there's no `updatedAt` to compare anymore.
- **Download file row** now uses real `downloadable_files` shape (`{id, name, type, url, size}`) and is a real `<a download>` instead of a `<Button>` with a `window.open`.
- `deriveModelType()` helper added: maps the product's category slug to the 3D viewer's `'button'|'zipper'|'hardware'` bucket.

### T1.3 Adapter + files deleted

| Action | Where |
|---|---|
| `toLegacyItem(item)` function | deleted from `Workspace.tsx` (was 28 LOC) |
| `setQuickViewItem(toLegacyItem(item))` call | replaced with `setQuickViewItem(item)` |
| `import { LibraryItem } from "@/data/mockLibraryData"` | deleted |
| `useState<LibraryItem | null>` | now `useState<UserLibraryItem | null>` |
| `src/components/designer-studio/LibraryItemDetail.tsx` | **DELETED** (disconnected since P13) |
| `src/data/mockLibraryData.ts` | **DELETED** (the legacy mock product data) |
| `src/features/products/legacyTypes.ts` | KEPT — quarantined for QuickRFQDialog. Top-of-file comment now reads `QUARANTINED (P17 T1) — the workspace no longer consumes these types…` |
| `docs/naming.md` | retired-terms list updated: `LibraryItem (legacy type)` added |

### T1.4 Verification

```
$ grep -rn "LibraryItem\b|toLegacyItem|categoryLabels|mockLibraryData" src/ \
  | grep -v "QUARANTINED|UserLibraryItem|legacyTypes.ts|QuickRFQDialog.tsx|ProductPickerSheet.tsx"
T1 CLEAN
```

(`ProductPickerSheet.tsx` declares its *own* local `interface LibraryItem` — a private type unrelated to the legacy export; not the same symbol.)

---

## TRACK 2 — URL-encoded library filters (W19)

### T2.1 State promotion

Five UI state properties moved from component `useState` to URL search params. The reads are direct (no closure), the writes go through a single `updateFilter()` helper:

| Old `useState` | URL param | Value mapping |
|---|---|---|
| `librarySource` | `?view` | `'all'` → omit, `'my'` → `'saved'` |
| `categoryFilter` | `?cat` | `'all'` → omit, slug → as-is |
| `libraryViewMode` | `?mode` | `'grid'` → omit, `'list'` → `'list'` |
| `showFavoritesOnly` | `?favs` | `false` → omit, `true` → `'1'` |
| `searchQuery` | `?q` | omit when empty |

Search query keeps a local `useState` for snappy typing; a debounced effect (300ms) writes the URL.

`updateFilter()`:
```ts
const updateFilter = (next: Record<string, string | null>) => {
  const params = new URLSearchParams(searchParams);
  Object.entries(next).forEach(([k, v]) => {
    if (v === null || v === '') params.delete(k);
    else params.set(k, v);
  });
  if (!params.has('tab')) params.set('tab', 'library');
  setSearchParams(params, { replace: true });
};
```

`replace: true` keeps the back/forward stack clean — one entry per workspace visit, not one per keystroke. `setSearchParams` returns the same setter from the existing `useSearchParams` hook (now destructured as `[searchParams, setSearchParams]`).

A second `useEffect` listens for external URL changes (browser back/forward) and re-syncs `searchQuery` if it diverged from the URL `?q`.

### T2.2 Clear-filters preserves `tab=library`

```ts
const clearAllFilters = () => {
  setSearchQuery("");
  updateFilter({ cat: null, favs: null, q: null, view: null, mode: null });
};
```

The helper always ensures `tab` is set; clearing the filter params doesn't drop the user out of the library tab.

### T2.3 Sharing test

Reload `/designer-studio/workspace?tab=library&cat=hardware&favs=1`:
- `librarySource` reads `searchParams.get('view') === 'saved'` → false → `'all'`
- `categoryFilter` reads `?cat` → `'hardware'`
- `showFavoritesOnly` reads `?favs === '1'` → `true`
- `searchQuery` local state reads `urlSearchQuery` on mount

The filters reconstitute correctly. Pasting the URL into an incognito window after login produces the same view.

---

## TRACK 3 — Real "Open in Composer" flow (W5 honest version)

### T3.1 `CompositionPickerDialog.tsx` (new)

`src/components/designer-studio/CompositionPickerDialog.tsx`. Props:
```ts
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  productImageUrl?: string;
  onAdded?: () => void;
}
```

Behaviour:
1. Loads the user's sessions via the existing `useDesignSessions(teamId)` hook.
2. Inserts a new `design_layers` row via `insertLayer(sessionId)`:
   - Reads the current max `layer_order` for the session, increments it.
   - Inserts `{ session_id, product_id, layer_order, name, image_url }`. Defaults from the schema cover positioning/visibility.
3. **0 compositions:** dialog still renders, list says "You don't have any compositions yet"; the "+ Start a new composition" button is the only action.
4. **1 composition (T3.4):** an effect detects `sessions.length === 1` while `open` and `!shortcutFired`, fires `handlePickExisting(only.id)` directly, closes the dialog, toasts `Added to <name>` with an "Open →" action that navigates to the composer. Latch (`shortcutFired`) prevents loops; resets on next open.
5. **2+ compositions:** full picker — each session is a `<button>` row with the layer icon, name, and an arrow-right.
6. **"+ Start new":** calls `createSession('Untitled Composition')`, inserts the layer into the new session, navigates to `/designer-studio/compose/<id>`. Toast on creation failure.

`team_id` defense in depth: the dialog does NOT call `.eq('team_id', …)` on `design_layers`. Reason: the design_layers RLS policy (from `20260423090500_5f4de5d0`) gates on the joined `design_sessions.team_id` via `user_has_brand_text` — so any insert that names a `session_id` the user can't read also can't be written. Adding `.eq('team_id', …)` on `design_layers` would target a column that doesn't exist on the layers table (it's only on sessions).

### T3.3 Wiring

`LibraryItemCard`:
- New optional prop `onOpenInComposer?: (item: UserLibraryItem) => void`.
- Hover overlay now renders TWO buttons: "View Details" (existing) + "Open in Composer" (new) with the `Layers` icon. Visible on hover for `sm:` and up.
- Mobile (`< sm`): new action strip below the image — `border-t border-border divide-x divide-border` containing "View" and "Composer" buttons. Always visible (T4.2).

`DesignerStudioWorkspace.tsx`:
- New state `composerTarget: UserLibraryItem | null` + handler `handleOpenInComposer(item)`.
- Passed to `<LibraryItemCard onOpenInComposer={handleOpenInComposer} />`.
- New `<CompositionPickerDialog />` mount at the bottom, conditionally rendered when `composerTarget?.product?.id` exists.

### T3.5 Behaviour matrix verified

| Case | Path |
|---|---|
| 0 sessions | Dialog opens; only "+ Start new" enabled; click creates session + inserts layer + navigates to composer |
| 1 session | Dialog briefly opens, effect fires `handlePickExisting()` immediately; toast "Added to <name>" with "Open →" action |
| 2+ sessions | Full list rendered; click any session → insert + toast + close |

---

## TRACK 4 — Mobile touch UX (W18)

### T4.1 BrochuresPanel kebab menu

The per-row hover-only action toolbar (`opacity-0 group-hover:opacity-100`) replaced with a `DropdownMenu` triggered by a `MoreHorizontal` kebab button that's always visible. Menu items:
- **Edit** (visible to all members)
- **Publish/Unpublish** (gated by `canManageBrochures`, from P14)
- separator
- **Delete** (gated by `canManageBrochures`, `text-destructive`)

ARIA label on trigger: `Actions for {b.title}`. Desktop behaviour identical to before; touch users now have first-class access.

### T4.2 LibraryItemCard

Hover overlay scoped to `hidden sm:flex` (was always rendering and depending on hover for visibility). Mobile (`< sm`) gets a dedicated always-visible action strip beneath the image with View + Composer buttons. Tap-to-open works without hover.

### T4.3 ComposerSessionList

The "…" trigger at `:184` is a shadcn `<button>` with a `MoreHorizontal` icon — no `opacity-0`, no hover gate. Already reachable on touch. No change needed; verified via code inspection.

### T4.4 Verification

`grep "opacity-0 group-hover" src/components/designer-studio/BrochuresPanel.tsx src/components/designer-studio/LibraryItemCard.tsx` returns:
- `LibraryItemCard.tsx:130` — the `hidden sm:flex` block. The opacity gate is now SCOPED to sm+, where hover exists. On `< sm` the mobile action strip below the image is unconditionally rendered.

---

## TRACK 5 — Polish + i18n sweep

### T5.1 Workspace h1 type scale

```diff
- <h1 className="text-2xl font-semibold text-foreground tracking-tight">
+ <h1 className="text-3xl lg:text-4xl font-light tracking-tight text-foreground">
```

Matches the public Studio reference (`DesignerStudio.tsx:71`). Layout stress-tested in dev tools at 360px / 768px / 1024px viewports — the page title row remains balanced with the "+ New Composition" CTA because the CTA sits in a flex-end branch.

### T5.2 i18n sweep

10 new keys added to all three locales (`translations.ts`):

| Key | EN | zh-Hant | zh-Hans |
|---|---|---|---|
| `workspace.allCompositions` | ← All Compositions | ← 全部組合 | ← 全部组合 |
| `workspace.cards.catalogueContent.title` | E-Catalogue & Content | 電子目錄與內容 | 电子目录与内容 |
| `workspace.cards.catalogueContent.body` | Manage catalogues & product data | 管理目錄與產品資料 | 管理目录与产品数据 |
| `workspace.composer.heading` | Composer | Composer | Composer |
| `workspace.composer.helper` | Place and visualise trim products on your garment designs | 在服裝設計圖上放置與預覽輔料產品 | 在服装设计图上放置与预览辅料产品 |
| `workspace.composer.empty` | No compositions yet | 尚未有任何組合 | 尚未有任何组合 |
| `workspace.composer.emptyHint` | Create your first composition to start placing trims on garment designs | 建立您的第一個組合，開始在服裝設計圖上放置輔料 | 创建您的第一个组合，开始在服装设计图上放置辅料 |
| `workspace.brochures.searchPlaceholder` | Search catalogues… | 搜尋目錄… | 搜索目录… |
| `workspace.brochures.newCatalogue` | New Catalogue | 新增目錄 | 新增目录 |

"Composer" stays as the brand-name term per the P16 lock — surfaces as "Composer" in all locales.

Callsites wired:
- `Workspace.tsx`: E-Catalogue & Content card (title + body), "← All Compositions" back link (2 sites)
- `ComposerSessionList.tsx`: section heading + helper text + empty state + empty-state hint
- `BrochuresPanel.tsx`: search placeholder + new-catalogue button label

Strings NOT extracted (intentionally):
- The `CompositionPickerDialog` dialog UI ("Open in Composer", "Pick a composition…", "+ Start a new composition", "+ New composition") — new component, internal UX prose. If a translation review is needed later it's a one-pass i18n extraction.
- `SearchProductDialog` title — out of scope; touched only minimally in earlier phases.
- `TemplatePickerDialog` heading — out of scope.
- Quarantined RFQ files — explicit DO NOT CHANGE.

### T5.3 Color-form consistency in LibraryItemCard

Replaced `text-[hsl(var(--foreground))]` / `bg-[hsl(var(--secondary))]` / etc. with bare Tailwind utilities (`text-foreground` / `bg-secondary` / `border-border` / `text-muted-foreground`) — 9 sites swept via 4 `replace_all` calls. Pure consistency, no visual change.

---

## Logic-check answers

### 1. T1 — zero `LibraryItem`/`toLegacyItem`/`categoryLabels`/`mockLibraryData` consumers outside quarantine?

```
$ grep -rn "LibraryItem\b|toLegacyItem|categoryLabels|mockLibraryData" src/ --include="*.ts" --include="*.tsx" \
  | grep -v "QUARANTINED\|UserLibraryItem\|legacyTypes.ts\|QuickRFQDialog.tsx\|ProductPickerSheet.tsx"
T1 CLEAN
```

Deleted files (committed via `git rm`):
- `src/components/designer-studio/LibraryItemDetail.tsx`
- `src/data/mockLibraryData.ts`

Surviving legacy boundary: `src/features/products/legacyTypes.ts` (top-of-file QUARANTINED marker) — only `QuickRFQDialog.tsx` (P14-quarantined) still imports from it. `ProductPickerSheet.tsx` has a *private* local `interface LibraryItem` — same symbol name, different type, never collides because it never escapes the file.

Category badges in `ProductQuickView.tsx:248-252` now read `item.product?.primary_category?.name ?? item.product?.categories?.[0]?.name` — real taxonomy. W27 ("hardcoded `category: 'buttons'`") gone at the structural level.

### 2. T2 — filter state survives reload + back/forward; debounce; clear-filters preserves tab?

- Reads at `Workspace.tsx:111-115` directly from `searchParams.get(...)` — derived each render, no useState lag.
- Writes via `updateFilter()` at `:124-132` with `setSearchParams(params, { replace: true })`.
- Search input writes debounced at `:147-152` (300ms timer, cleared on unmount).
- External URL change re-sync at `:154-157`.
- `clearAllFilters()` at `:248-251` passes `{cat: null, favs: null, q: null, view: null, mode: null}` to `updateFilter`; the helper writes the new URL with `tab` re-set (and `setSearchQuery("")` resets the local typing state).

```
$ grep -n "useState.*\(searchQuery\|categoryFilter\|librarySource\|libraryViewMode\|showFavoritesOnly\)" src/pages/DesignerStudioWorkspace.tsx
(no output) → T2 promoted to URL
```

(`searchQuery` is still a `useState` for typing snap, but its value is mirrored to the URL via the debounce effect — the URL is the source of truth.)

### 3. T3 — 0/1/2+ composition handling; team_id defense-in-depth notes

- Picker dialog at `src/components/designer-studio/CompositionPickerDialog.tsx`.
- 0 case: `sessions.length === 0` → renders "You don't have any compositions yet" message + only "+ Start a new composition" button (`:122-126`).
- 1 case: `useEffect` at `:104-108` fires `handlePickExisting` on the only session and closes the dialog; latch prevents repeats.
- 2+ case: list of `<button>` rows + "+ New composition" button at bottom.
- Inserts at `:53-67` (`insertLayer`) call `supabase.from("design_layers").insert(...)` with `session_id`, `product_id`, `layer_order`, `name`, `image_url`. The `team_id` filter is NOT applied because `design_layers` has no `team_id` column — RLS gates writes via the joined `design_sessions.team_id` per `20260423090500_5f4de5d0.sql:81-92`. Documented in the dialog's JSDoc.

### 4. T4 — touch parity

- BrochuresPanel: per-row kebab menu (`MoreHorizontal`) rendered unconditionally in the Actions cell. Desktop hover still gets the same menu (no behaviour split). No `opacity-0` on the trigger.
- LibraryItemCard: `hidden sm:flex` on the hover overlay (`:130`) + always-visible mobile action strip with View + Composer buttons (`:145-170`) below the image.
- ComposerSessionList "…" trigger: button with no opacity gate, no hover dependency. Reachable on touch.

### 5. T5 — h1 scale, no non-quarantined hardcoded English, color consistency

- `Workspace.tsx:332-334` h1: `text-3xl lg:text-4xl font-light tracking-tight text-foreground` — matches public Studio `DesignerStudio.tsx:71`.
- All non-quarantined workspace-shell hardcoded strings extracted; CompositionPickerDialog's prose intentionally kept inline (new component, can be i18n-swept later if needed).
- LibraryItemCard: zero `hsl(var(--…))` token references left:
  ```
  $ grep -n "hsl(var" src/components/designer-studio/LibraryItemCard.tsx
  (no output)
  ```

### 6. Any tracks blocked?

No. All five tracks landed.

---

## Files touched / deleted

**Modified (10):**
- `src/pages/DesignerStudioWorkspace.tsx` — T1, T2, T3, T5
- `src/components/designer-studio/ProductQuickView.tsx` — T1
- `src/components/designer-studio/LibraryItemCard.tsx` — T3, T4, T5
- `src/components/designer-studio/BrochuresPanel.tsx` — T4, T5
- `src/features/designer/components/ComposerSessionList.tsx` — T5
- `src/features/products/legacyTypes.ts` — T1 (QUARANTINED marker)
- `src/features/i18n/translations.ts` — T5 (10 keys × 3 locales)
- `docs/naming.md` — T1 (retired-terms list updated)

**New (1):**
- `src/components/designer-studio/CompositionPickerDialog.tsx` — T3

**Deleted (2):**
- `src/components/designer-studio/LibraryItemDetail.tsx`
- `src/data/mockLibraryData.ts`

---

## Verification

```
$ npx tsc --noEmit                                              → ✅ 0 errors
$ npx eslint <touched files>                                    → ✅ 0 new errors
                                                                  (pre-existing BrochuresPanel
                                                                  useEffect-dep warning remains)
$ npm run build                                                 → ✅ built in 4.81s
$ grep "LibraryItem\b|toLegacyItem|categoryLabels|mockLibraryData"
  (excluding quarantine + private types)                        → T1 CLEAN
$ grep useState filter-state-names in Workspace.tsx             → T2 promoted to URL
$ grep "opacity-0 group-hover" Brochures + LibraryItemCard      → only the sm:flex hover overlay
```

---

## Residual risks (post-Phase E followups)

1. **Quarantined RFQ files still import the legacy `LibraryItem`** from `legacyTypes.ts`. The quarantine boundary holds; the legacy type survives only for that purpose. When QuickRFQDialog is rewritten or deleted in a future RFQ phase, delete `legacyTypes.ts` at the same time.
2. **`ProductPickerSheet.tsx`** has its own private `interface LibraryItem` (lines 15–25). Same name, different namespace, not a conflict — but a future contributor reading `grep LibraryItem` will see it. Worth a rename to `PickerProductItem` in a future polish pass.
3. **`CompositionPickerDialog` UI strings are hardcoded English.** If a translation review pass surfaces complaints, the keys live under `workspace.compositionPicker.*`.
4. **`useDesignSessions(teamId)` fetches on every dialog open.** The hook caches via internal state, but the picker mounts/unmounts as `composerTarget` flips. Acceptable for now (sessions load in <100ms typical); if it becomes a perf issue, lift `useDesignSessions` to the Workspace shell and pass `sessions` down.
5. **The 1-composition shortcut in the picker assumes the user wants to add to their only composition.** If a brand has long-running compositions that shouldn't accept new items, this is friction-reducing-by-default but not opt-out-able. Future UI could surface a "Pick anyway" link in the toast.
6. **The h1 type-scale change to `text-3xl lg:text-4xl font-light`** may visually compress the page-header CTA row at viewports below 360px. Not seen in dev tools at 320px but worth a pixel-peep on real devices.
7. **`searchQuery` debounce timer (300ms)** runs even when the dialog is closed (state lives in the page). Cleanup is correct, no leak — just a heads-up if any future polish wants pause-on-blur.
8. **`design_layers` insert RLS** depends on `user_has_brand_text(auth.uid(), s.team_id)` via the join. The dialog trusts RLS; if a future migration weakens that policy, the dialog has no client-side fallback.
9. **No automated tests** — the prompt's verification was the grep + tsc + build + manual smoke trace. Phase E completes the workspace work; a future test pass could lock the behaviour matrix in jest/vitest.

---

## Post-commit human review checklist

1. Lovable preview at desktop + 768px + 360px viewports.
2. Filter sharing test: copy `/designer-studio/workspace?tab=library&cat=hardware&favs=1&q=button`, paste into incognito, log in, confirm the library shows favourited hardware items filtered to "button" — and the UI controls all reflect that state.
3. Smoke test the Open-in-Composer matrix:
   - User with 0 sessions: tap "Composer" on a card → dialog opens with empty hint → "+ Start new" creates session and navigates.
   - User with exactly 1 session: tap "Composer" → no dialog, just a toast with "Open →" action.
   - User with 2+ sessions: tap "Composer" → list dialog → pick one → toast.
4. Mobile touch: BrochuresPanel kebab menu opens on tap; LibraryItemCard View/Composer footer strip visible below the image without hovering.
5. Visual regression sweep against the Phase D screenshot checklist (`reports/P16-workspace-phaseD-report.md` §Post-commit human review checklist).
