# P14 — Workspace Revamp Phase B: Hide RFQ + Security Hardening

**Date:** 2026-06-15
**Branch:** main
**Audit reference:** `reports/P11-workspace-ux-audit.md` (W1, W2, W15, W16)
**Baseline:** `reports/P13-workspace-phaseA-report.md`

---

## Per-task before/after

### T1 — Remove the RFQ main tab

**Files:** `src/pages/DesignerStudioDashboard.tsx`

| Before | After |
|---|---|
| `validTabs = ['library','rfq','brochures','products','composer']` | `validTabs = ['library','brochures','products','composer']` (`Dashboard.tsx:98`) |
| `rfqs`/`selectedRFQ`/`activeRFQTab`/`rfqSearchQuery` `useState` block | Deleted. Quick-view state block now contains only the canonical `quickViewItem`/`isQuickViewOpen` pair. |
| `handleSelectRFQ`, `handleBackFromRFQDetail`, `handleStatusChange`, `filteredRFQs` filter, `statusCounts` table | All deleted. |
| `if (selectedRFQ) return <RFQDetail … />` early-return branch | Deleted. |
| `showingSessions = activeMainTab !== 'library' && activeMainTab !== 'rfq' && …` | `showingSessions = activeMainTab !== 'library' && activeMainTab !== 'brochures' && activeMainTab !== 'products'` |
| Secondary quick-access grid: 3 tiles (Component Library / Requests & Quotes / E-Catalogue & Content) — `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | 2 tiles only (Component Library + E-Catalogue & Content) — `grid-cols-1 sm:grid-cols-2`. Audit A15 "Requests & Quotes" tile removed. |
| Management Tabs: `value="rfq"` TabsTrigger + TabsContent with stat strip, search, status sub-tabs, `<RFQList>` | Removed. The Tabs row is now Brochures + Products only. |
| `(activeMainTab === 'rfq' \|\| activeMainTab === 'brochures' \|\| activeMainTab === 'products')` gate | `(activeMainTab === 'brochures' \|\| activeMainTab === 'products')` (`Dashboard.tsx:563`) |
| `StatCard` helper at the bottom of the file (RFQ-only consumer) | Deleted. |
| Imports: `mockRFQs`, `RFQ`, `RFQList`, `RFQDetail` from RFQ chain; icons `Filter`, `Clock`, `Upload`, `CheckCircle`, `Eye`, `FileText` | All removed. Now only `Search, Plus, Library, Package, Grid3X3, List, BookOpen, X, ArrowRight` (`Dashboard.tsx:14-24`). |

**Legacy URL handling:** `?tab=rfq` arrives in the URL → `validTabs.includes('rfq')` returns `false` (`Dashboard.tsx:114`) → `initialTab` falls back to `'library'`. The URL-sync `useEffect` (`:124-129`) sees `tabFromUrl !== activeMainTab` and rewrites the URL via `navigate(?tab=library, { replace: true })`. No error, no toast, no flash — a clean redirect.

### T2 — Replace every "Request Quote" affordance with prefilled contact link

**Files:** `src/components/designer-studio/ProductQuickView.tsx`, `src/features/products/legacyTypes.ts`, `src/pages/DesignerStudioDashboard.tsx`

| Before | After |
|---|---|
| `ProductQuickView.tsx:1` `import { useState, Suspense, useRef } from "react"` | + `import { Link } from "react-router-dom"` |
| `import QuickRFQDialog from "./QuickRFQDialog"` | Removed |
| `const [showRFQDialog, setShowRFQDialog] = useState(false)` | Removed (`:131` old slot freed) |
| icon `FileText` next to "Request Quote" label | `Send` (the spec'd lucide icon) |
| `<Button className="flex-1 gap-2" onClick={() => setShowRFQDialog(true)}>` | `<Button asChild className="flex-1 gap-2"><Link to={contactQuoteHref} onClick={() => onOpenChange(false)}>` (`ProductQuickView.tsx:576-580`) |
| `<QuickRFQDialog open={showRFQDialog} … />` mount | Removed |
| (n/a) | New `contactQuoteHref` computed value: `\`/contact?product=\${encodeURIComponent(item.slug ?? item.itemCode)}&source=workspace\`` (`ProductQuickView.tsx:137-140`). Closes the dialog on click. |
| `LibraryItem` had no `slug` field | Added optional `slug?: string` to the legacy type (`legacyTypes.ts:17`) so workspace surfaces can deep-link. The adapter `toLegacyItem` in `Dashboard.tsx:75` now populates it from `p.slug`. Defensive fallback to `itemCode` when slug is missing. |

**PDP confirmation:** `src/pages/ProductDetail.tsx:284-289` (from P3) already routes Request Quote to `/contact?product=<slug>` for every product page. Unchanged in this commit — kept the wired link.

**Audit grep — other workspace "Request" surfaces:** `grep -rn "RequestSample\|Request Quote\|Request Sample" src/ --include="*.tsx"` returns only PDP, ProductQuickView (the new contact link), and `LibraryItemCard.tsx:217` (a string inside the deleted block of P13's Phase A — confirmed already removed). Clean.

### T3 — Quarantine dead RFQ files

Added the top-of-file marker `// QUARANTINED — see reports/P14: workspace RFQ hidden for trial demo. Re-enable when a real RFQ data layer is built (Phase B-future).` to:
- `src/components/designer-studio/QuickRFQDialog.tsx`
- `src/components/designer-studio/CreateRFQDialog.tsx`
- `src/components/designer-studio/RFQList.tsx`
- `src/components/designer-studio/RFQDetail.tsx`
- `src/data/mockRFQData.ts`

Files stay on disk (not deleted) so the prior implementation work survives for the future build.

### T4 — i18n hygiene

`grep '"rfq\.' src/features/i18n/translations.ts` → zero hits. `grep 't("rfq\.' src/` → zero hits. **No `rfq.*` i18n keys ever existed** — every RFQ string was hardcoded English. Removing the tab swept those strings with the JSX. No-op for this task.

The shell page title still uses `t("studio.title")` and `t("dashboard.title.subtitle")` — both intentionally generic and reused; nothing to clean here. Phase C will revisit the whole `dashboard.*` namespace.

### T5 — design_sessions team_id defense-in-depth + audit-grep follow-ups

The explicit ask was `ComposerSessionList.tsx`. Audit-grep also turned up unfiltered mutations in `useDesignSessions.ts` and `ComposerPage.tsx`; all are now belt-and-braces.

| Site | Mutation | Before | After |
|---|---|---|---|
| `ComposerSessionList.tsx:80-90` | `handleToggleShare` UPDATE | `.update({status}).eq('id', session.id)` | adds `.eq('team_id', teamId)` |
| `useDesignSessions.ts:114-122` | `updateSession` UPDATE | `.update(updates).eq('id', id)` | adds `.eq('team_id', teamId)`; dep array now `[teamId]` |
| `useDesignSessions.ts:124-132` | `deleteSession` DELETE | `.delete().eq('id', id)` | adds `.eq('team_id', teamId)`; dep array now `[teamId]` |
| `ComposerPage.tsx:204-213` | `handleRename` UPDATE | `.update({name}).eq('id', session.id)` | adds `.eq('team_id', teamId)`; deps include `teamId` |
| `ComposerPage.tsx:215-226` | `handleShareStatusChange` UPDATE | `.update({status}).eq('id', session.id)` | adds `.eq('team_id', teamId)`; deps include `teamId` |
| `ComposerPage.tsx:259-263` | `handleUploadBackground` UPDATE | `.update({…}).eq('id', session.id)` | adds `.eq('team_id', teamId)` (single-line form preserved); deps include `teamId` |

**Known-safe (no client team_id filter, intentionally):**
- `useDesignSessions.ts:8` SELECT inside `createVariantFromSession` — reads a single source row by id; RLS already restricts the read to brands the user belongs to.
- `useDesignSessions.ts:38` INSERT inside `createVariantFromSession` — sets `team_id: src.team_id` from the source row that was just read under the user's RLS. Trust boundary inherited.
- `useDesignSessions.ts:78` SELECT inside `fetchSessions` — already has `.eq('team_id', teamId)`.
- `useDesignSessions.ts:96` INSERT inside `createSession` — already sets `team_id: teamId` on the row.
- `useDesignSession.ts:16` SELECT a single session — read-only; RLS enforces.

**Residual:** none flagged. Every UPDATE and DELETE on `design_sessions` in the workspace now carries the team_id filter; every SELECT and INSERT is either team-scoped at the query or sourced from a row already read under RLS.

### T6 — Brochures role-gate

**File:** `src/components/designer-studio/BrochuresPanel.tsx`

| Before | After |
|---|---|
| No `useAuth` import | `import { useAuth } from "@/features/auth/AuthProvider"` (`:14`) |
| All members saw + could click "+ New Catalogue", "Publish/Unpublish", "Delete" | `const canManageBrochures = primaryBrand?.role === "manager" \|\| primaryBrand?.role === "owner"` (`BrochuresPanel.tsx:100-103`). Buttons hidden when false (not just disabled — hidden, per the spec's "pick hidden for cleanliness"). |
| Header bar always rendered "+ New Catalogue" | Header wraps the button in `{canManageBrochures && (…)}` (`:201-210`) |
| Per-row hover actions rendered Edit / Publish / Delete unconditionally | Edit stays visible to everyone (editing is non-destructive — opens the brochure editor); Publish/Delete are wrapped in `{canManageBrochures && (<>…</>)}` (`:272-302`) |

The role enum exact values were checked against `AuthProvider.tsx:9`: `role: "member" \| "manager" \| "owner"`. The spec said "not `member`" — implemented as `"manager" \|\| "owner"`.

### T7 — Migration: RLS policies + helper function

**File:** `supabase/migrations/20260615120000_workspace_role_and_team_hardening.sql`

#### Current policies quoted (pre-P14)

`flipbook_brochures` (from `20260313092451_1e39707c-3bcf-4b54-bfdf-0b0baa809b01.sql`):
- `"Public can view published brochures"` — `FOR SELECT USING (status = 'published')` (kept by this migration — out of scope)
- `"Authenticated full access brochures"` — `FOR ALL TO authenticated USING (true) WITH CHECK (true)` ← **the W15 risk**

`flipbook_pages`, `flipbook_hotlinks` — analogous "Authenticated full access" + a published-cascade SELECT.

`design_sessions` (after `20260423090500_5f4de5d0-24b3-4ac5-9f95-a59fef6a18dd.sql`):
- `"Authed read own brand design_sessions"` — SELECT TO authenticated USING `user_has_brand_text(uid, team_id)` ✓
- `"Authed insert own brand design_sessions"` — INSERT with brand check ✓
- `"Authed update own brand design_sessions"` — UPDATE USING + WITH CHECK both brand-checked ✓
- `"Authed delete own brand design_sessions"` — DELETE brand-checked ✓
- **BUT** the earlier `20260317184925_7f2410ed-5015-49e5-9718-82b4f6b76380.sql` migration created **`"Public read design_sessions"` and `"Public manage design_sessions"` TO anon** — never dropped. These let anonymous clients read/write the table; the brand-scoped policies above only constrain authenticated traffic. This was the W16 root.

`design_layers`, `design_exports` — same anon "Public read" / "Public manage" hangover.

#### New helper function

```sql
create or replace function public.user_is_brand_manager_or_owner(_user_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from public.brand_memberships
    where user_id = _user_id
      and role in ('manager', 'owner')
  );
$$;

grant execute on function public.user_is_brand_manager_or_owner(uuid) to authenticated;
```

**Why a new helper instead of `user_has_brand`:** brochures are a **global** resource (no `team_id` column). Role gating is "this user holds manager-or-owner on any brand" rather than "this user holds manager-or-owner on a specific team." `user_has_brand_text(uid, brand_text)` answers a different question; reusing it would have lied.

#### New brochures policies (P4b-style: drop the broad one, recreate stricter)

```sql
drop policy if exists "Authenticated full access brochures" on public.flipbook_brochures;
drop policy if exists "Authed read brochures"               on public.flipbook_brochures;
drop policy if exists "Authed insert brochures (managers)"  on public.flipbook_brochures;
drop policy if exists "Authed update brochures (managers)"  on public.flipbook_brochures;
drop policy if exists "Authed delete brochures (managers)"  on public.flipbook_brochures;

-- Members and above see every brochure (draft + published) in the workspace list.
create policy "Authed read brochures"
on public.flipbook_brochures for select to authenticated using (true);

create policy "Authed insert brochures (managers)"
on public.flipbook_brochures for insert to authenticated
with check (public.user_is_brand_manager_or_owner(auth.uid()));

create policy "Authed update brochures (managers)"
on public.flipbook_brochures for update to authenticated
using  (public.user_is_brand_manager_or_owner(auth.uid()))
with check (public.user_is_brand_manager_or_owner(auth.uid()));

create policy "Authed delete brochures (managers)"
on public.flipbook_brochures for delete to authenticated
using (public.user_is_brand_manager_or_owner(auth.uid()));
```

Analogous role gating cascades to `flipbook_pages` and `flipbook_hotlinks`. Public SELECT for `status='published'` brochures + their pages is preserved (untouched).

#### design_sessions / design_layers / design_exports cleanup

```sql
drop policy if exists "Public read design_sessions"   on public.design_sessions;
drop policy if exists "Public manage design_sessions" on public.design_sessions;
drop policy if exists "Public read design_layers"     on public.design_layers;
drop policy if exists "Public manage design_layers"   on public.design_layers;
drop policy if exists "Public read design_exports"    on public.design_exports;
drop policy if exists "Public manage design_exports"  on public.design_exports;

revoke all on public.design_sessions   from anon;
revoke all on public.design_layers     from anon;
revoke all on public.design_exports    from anon;
revoke all on public.flipbook_brochures from anon;
```

The brand-scoped authenticated policies from `20260423090500` remain the enforcement layer — this migration **only drops the anon bypass**. flipbook_pages and flipbook_hotlinks retain their existing public-read policies (they're scoped to published brochures) so anon stays revokable-by-default but functional for the public e-catalogue surface.

**No tables outside `flipbook_brochures`, `flipbook_pages`, `flipbook_hotlinks`, `design_sessions`, `design_layers`, `design_exports` are referenced.**

#### Deployment note

This migration **must be applied to Supabase before P15 ships**. The client-side role gate in `BrochuresPanel.tsx` (T6) hides the controls from members in the UI, but server-side enforcement is the RLS policy. Without the migration applied, a member could still POST a delete via DevTools and Supabase would honour it under the old "Authenticated full access" policy. Apply via the Supabase dashboard's SQL editor or `supabase db push`, depending on Lovable's migration sync setup.

---

## Logic-check answers (with line references)

### 1. RFQ tab fully gone; `?tab=rfq` redirects to library?

- **Gone from URL union:** `Dashboard.tsx:98` `validTabs = ['library', 'brochures', 'products', 'composer']`. The `'rfq'` literal is absent.
- **Gone from tabs config:** Management Tabs at `Dashboard.tsx:573-604` only renders the Brochures and Products triggers/content. No `value="rfq"` anywhere in the file.
- **Secondary card gone:** `Dashboard.tsx:339-366` renders 2 tiles (Library + E-Catalogue & Content) inside `grid-cols-1 sm:grid-cols-2`. The "Requests & Quotes" tile is deleted.
- **Redirect:** `Dashboard.tsx:114` lazy-falls back to `'library'` because `validTabs.includes('rfq')` is false; the URL-sync effect at `:124-129` issues `navigate(?tab=library, {replace: true})` because `tabFromUrl ('rfq') !== activeMainTab ('library')`. No error path, no flash.

### 2. Request Quote opens prefilled contact link; no QuickRFQDialog mount

- `ProductQuickView.tsx:137-140` builds `contactQuoteHref = "/contact?product=" + encodeURIComponent(item.slug ?? item.itemCode) + "&source=workspace"`.
- `:574-580` renders `<Button asChild className="flex-1 gap-2"><Link to={contactQuoteHref} onClick={() => onOpenChange(false)}><Send className="w-4 h-4" />Request Quote</Link></Button>`.
- `grep "QuickRFQDialog\|setShowRFQDialog" src/components/designer-studio/ProductQuickView.tsx` → 0 hits.
- `grep "RFQList\|RFQDetail\|mockRFQs\|QuickRFQDialog" src/pages/DesignerStudioDashboard.tsx src/components/designer-studio/ProductQuickView.tsx` → CLEAN.
- The icon next to the label is `<Send className="w-4 h-4" />` — the spec's lucide choice — replacing the prior `<FileText>`.

### 3. ComposerSessionList share toggle includes `.eq('team_id', primaryBrand.id)`; other mutations?

- `ComposerSessionList.tsx:84-88`:
  ```ts
  .from('design_sessions')
  .update({ status: newStatus })
  .eq('id', session.id)
  .eq('team_id', teamId)
  ```
  Uses the `teamId` prop the component already receives from Dashboard (set to `primaryBrand?.id ?? ''` upstream). Source consistent with the rest of the file.
- **Other mutations also fixed:** `useDesignSessions.ts:114-122 / :124-132` (updateSession + deleteSession), `ComposerPage.tsx:204-213 / :215-226 / :258-263` (handleRename, handleShareStatusChange, handleUploadBackground). All six UPDATE/DELETE sites now carry `.eq('team_id', teamId)`.
- **Known-safe (no fix needed):** `createVariantFromSession` reads source row by id (RLS-gated SELECT) then inserts with `team_id: src.team_id`. Source row is the trust boundary. `useDesignSession.ts:16` is a SELECT — read-only, RLS enforces.

### 4. Brochures publish/delete hidden for `role === 'member'`

- Role check: `BrochuresPanel.tsx:100-103`:
  ```ts
  const canManageBrochures =
    primaryBrand?.role === "manager" || primaryBrand?.role === "owner";
  ```
- "+ New Catalogue" gate: `{canManageBrochures && (<Button …>New Catalogue</Button>)}` at `:201-210`.
- Per-row Publish + Delete gate: `{canManageBrochures && (<><Button …>Publish/Unpublish</Button><Button …>Delete</Button></>)}` at `:272-302`. Edit stays visible to everyone.
- For a `member`: zero publish/delete controls render. For `manager` or `owner`: all controls visible. For a guest (no `primaryBrand`): would also fail the gate, but `BrochuresPanel` only ever renders inside `RequireBrandAuth` so `primaryBrand` is guaranteed truthy.

### 5. Migration: helper name + DROP/CREATE summary + scope confirmation

- **Helper name:** `public.user_is_brand_manager_or_owner(_user_id uuid) → boolean`. New function. Existing `user_has_brand(uid, uuid)` answers "does this user belong to this specific brand"; brochures need "does this user manage *any* brand," so reusing the wrong helper would have leaked permissions.
- **DROP statements:**
  - `"Authenticated full access brochures"` on `flipbook_brochures`
  - `"Authenticated full access pages"` on `flipbook_pages`
  - `"Authenticated full access hotlinks"` on `flipbook_hotlinks`
  - `"Public read design_sessions"` and `"Public manage design_sessions"` on `design_sessions`
  - `"Public read design_layers"` and `"Public manage design_layers"` on `design_layers`
  - `"Public read design_exports"` and `"Public manage design_exports"` on `design_exports`
- **CREATE statements** (brochures only — the design_* tables already had proper auth policies that survive untouched):
  - `"Authed read brochures"` — SELECT TO authenticated USING (true)
  - `"Authed insert brochures (managers)"` — INSERT TO authenticated WITH CHECK `user_is_brand_manager_or_owner(auth.uid())`
  - `"Authed update brochures (managers)"` — UPDATE TO authenticated USING + WITH CHECK same predicate
  - `"Authed delete brochures (managers)"` — DELETE TO authenticated USING same predicate
  - `"Authed read pages"` + `"Authed mutate pages (managers)"` — analogous
  - `"Authed read hotlinks"` + `"Authed mutate hotlinks (managers)"` — analogous
- **`REVOKE ALL FROM anon`** on `design_sessions`, `design_layers`, `design_exports`, `flipbook_brochures`. (`flipbook_pages` + `flipbook_hotlinks` deliberately retain their existing public-read policies for the e-catalogue surface.)
- **Tables touched:** `flipbook_brochures`, `flipbook_pages`, `flipbook_hotlinks`, `design_sessions`, `design_layers`, `design_exports` + the helper function. **Nothing else.**

### 6. Quarantine comments present on all 5 files

```
$ grep "QUARANTINED" src/components/designer-studio/QuickRFQDialog.tsx \
                    src/components/designer-studio/CreateRFQDialog.tsx \
                    src/components/designer-studio/RFQList.tsx \
                    src/components/designer-studio/RFQDetail.tsx \
                    src/data/mockRFQData.ts
src/components/designer-studio/RFQList.tsx:1:// QUARANTINED — see reports/P14: …
src/components/designer-studio/CreateRFQDialog.tsx:1:// QUARANTINED — see reports/P14: …
src/components/designer-studio/QuickRFQDialog.tsx:1:// QUARANTINED — see reports/P14: …
src/components/designer-studio/RFQDetail.tsx:1:// QUARANTINED — see reports/P14: …
src/data/mockRFQData.ts:1:// QUARANTINED — see reports/P14: …
```
✓ All 5 files marked. Files preserved on disk for the future real RFQ build.

---

## Verification (re-run after the commit)

```
$ npx tsc --noEmit                                                                                          → ✅ 0 errors
$ npx eslint <12 touched files>                                                                             → ✅ 0 new errors
                                                                                                             (pre-existing warnings in unchanged code: ComposerPage.tsx 'any' types,
                                                                                                              useDesignSessions.tsx createVariantFromSession 'any' types,
                                                                                                              BrochuresPanel useEffect dep on brochureIds.join — all unrelated to P14)
$ npm run build                                                                                             → ✅ built in 4.82s
$ grep -rn "RFQList\|RFQDetail\|mockRFQs\|QuickRFQDialog" src/pages/DesignerStudioDashboard.tsx \
                                                          src/components/designer-studio/ProductQuickView.tsx → CLEAN
```

**Bundle impact** — `DesignerStudioDashboard` lazy chunk: **268.04 kB → 237.90 kB** (-30 kB raw, -6.5 kB gzipped). Cumulative since pre-P13: **307.30 kB → 237.90 kB** (-22% of the chunk's original size).

**Net source delta:** **-102 LOC** across 12 files plus the new SQL migration (`supabase/migrations/20260615120000_workspace_role_and_team_hardening.sql`).

---

## Residual risks for Phase C

1. **The migration is the only enforcement.** The BrochuresPanel client-side gate is UX only; if an operator forgets to apply `20260615120000_workspace_role_and_team_hardening.sql`, a malicious member could still POST a delete request directly. Deployment note above must be acted on before P15.
2. **`flipbook_pages` and `flipbook_hotlinks` retain anon SELECT** because the public e-catalogue surface needs to load pages of published brochures. The role gate covers mutations only. If the e-catalogue is ever locked behind auth, those policies should be reviewed.
3. **Brochures have no brand scoping** — a manager of Brand A can delete a brochure created by a manager of Brand B because brochures are a global resource. If multi-brand isolation is required for the e-catalogue authoring surface, that's a Phase E-or-later data-model change (`flipbook_brochures.team_id` column + new RLS).
4. **Quarantined RFQ files still type-check and bundle.** They're only referenced inside themselves (and `mockRFQData.ts` is no longer imported anywhere). The build doesn't pull them into chunks. If a future PR accidentally imports one, the quarantine comment is the only signal. Consider moving them to `src/_quarantine/` in Phase C if the namespace cleanup happens then.
5. **`LibraryItem.slug` is optional.** Workspace surfaces using the contact link fall back to `itemCode` when slug is absent. For Supabase-backed library items the slug always flows through the adapter, so this is mainly a guard for any legacy mock paths. Phase E retires the legacy type entirely.
6. **No deep-link tests.** The `?tab=rfq` redirect was hand-traced through the URL-sync effect; not covered by an automated test. If Phase C introduces a router test harness, add a case for it.
7. **`useDesignSessions` now closures over `teamId`** — updateSession and deleteSession depend on the prop being stable. RequireBrandAuth guarantees `primaryBrand?.id` doesn't change mid-render; if a future refactor moves session ownership to a different scoping unit, the dep arrays at `:122` and `:132` need updating in lockstep.
8. **Pre-existing lint debt** (`any` types in `createVariantFromSession`, useEffect dep warning in BrochuresPanel) is unchanged by this commit. Worth a Phase D sweep alongside the visual system convergence.
