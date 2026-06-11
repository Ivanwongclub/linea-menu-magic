# P6 — Sign-out + P5b Fix-ups: Audit Report

**Date:** 2026-06-11  
**Branch:** main  
**Scope:** `Header.tsx`, `RequireBrandAuth.tsx`, `DesignerStudio.tsx`, `translations.ts`

---

## Pre-change audit (STEP 0)

```
grep -rn "signOut" src/ | grep -v AuthProvider
→ (no output) — zero signOut consumers outside AuthProvider ✓

grep -n "studioCtaHref\|studioCtaLabel" src/components/layout/Header.tsx
→ 211: studioCtaHref = session ? "/designer-studio/dashboard?tab=library" : "/designer-studio/login"
   212: studioCtaLabel = primaryBrand?.name ?? t("header.cta.b2bLogin")
   419: <Link to={studioCtaHref}>
   428: <span>{studioCtaLabel}</span>
   800: <Link to={studioCtaHref} ...>
   802: <span className="truncate">{studioCtaLabel}</span>

grep -n "DropdownMenu" src/components/layout/Header.tsx
→ (no output) — no DropdownMenu imports ✓

grep -n "metric1Value|metric2Value|metric3Value|metric4Value" src/features/i18n/translations.ts
→ EN only at lines 301–307; zh-Hant and zh-Hans had no metric keys (falling back to EN key strings)

grep -n "cap4\|workspaceHref" src/pages/DesignerStudio.tsx
→ 70: { icon: Link2, t: "cap4", to: "/ecollections" }
→ workspaceHref not found (removed in P5b)

Discrepancy vs prompt: prompt expected cap4 to be the unwired tile. Actual P5b output had
cap4 → "/ecollections" (E-Catalogue Hotlinks, correctly wired). The unwired tile was cap6
(ShieldCheck / Brand-Private Library, `to: undefined`). Fix-up B targets cap6.
```

---

## Changes made

### `src/components/layout/Header.tsx`

**New imports:**
- `useNavigate` from `react-router-dom`
- `LogOut` from `lucide-react`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuSeparator`, `DropdownMenuTrigger` from `@/components/ui/dropdown-menu`
- `useQueryClient` from `@tanstack/react-query`

**Provider position confirmed (App.tsx):**
`QueryClientProvider` → `BrowserRouter` → `AuthProvider` → `Layout` → `Header`

Both `useQueryClient()` and `useNavigate()` are available in Header. No fallback to `window.location.assign` needed.

**`handleSignOut` added** (lines ~200–204, wrapped in `useCallback`):
```tsx
const handleSignOut = useCallback(async () => {
  await signOut();       // clears supabase session
  queryClient.clear();   // purges personal data from React Query cache
  navigate("/designer-studio");
}, [signOut, queryClient, navigate]);
```
Order: `signOut()` awaited before `queryClient.clear()` — no authed refetch can repopulate personal data ✓

**Desktop CTA** (was: unconditional `<Link>` wrapping a `<Button>`):
- `session` truthy → `<DropdownMenu>` with brand-name trigger + `ChevronDown` (3×3). Items:
  1. "My Workspace" (`header.cta.myWorkspace`) → navigate to `/designer-studio/dashboard?tab=library`
  2. `<DropdownMenuSeparator />`
  3. "Sign out" (`header.cta.signOut`) + `LogOut` icon → `handleSignOut`
- `session` falsy → unchanged `<Link to={studioCtaHref}>` plain button (B2B Login label) ✓

**Mobile drawer CTA section:**
- Existing contact + studio CTA rows unchanged
- New `{session && <Button variant="ghost" ...>}` row below: `onClick={() => { setIsMenuOpen(false); handleSignOut(); }}` — closes drawer before signing out ✓

### `src/features/auth/RequireBrandAuth.tsx`

- Added `useNavigate` import, `useNavigate()` hook, `LogOut` icon
- `handleSignOut` in component: `await signOut(); navigate("/designer-studio/login")`
  - Navigates to login rather than landing — lets user immediately switch to a different account
- New "Sign out" `<Button variant="outline">` added below the existing "Back" button
- Uses `t("header.cta.signOut")` — key resolves via `useI18n` already present in this component ✓

### `src/pages/DesignerStudio.tsx`

- Added `useAuth` import
- `const { session } = useAuth()` at component top
- `workspaceHref` re-introduced: `session ? "/designer-studio/dashboard?tab=library" : "/designer-studio/login"`
- `cap6` tile: `to: undefined` → `to: workspaceHref`
  - Hover-lift and icon-invert effects restored automatically via `StudioCapabilityTile`'s `to`-prop branch ✓
  - Guest lands on login; brand user lands on dashboard ✓

### `src/features/i18n/translations.ts`

**New keys — all 3 locales:**

| Key | EN | zh-Hant | zh-Hans |
|-----|----|---------|---------|
| `header.cta.myWorkspace` | My Workspace | 我的工作空間 | 我的工作空间 |
| `header.cta.signOut` | Sign out | 登出 | 退出登录 |

**zh-Hant metric keys added** (were falling through to raw key strings):

| Key | Value |
|-----|-------|
| `studioIntro.metricsLabel` | 平台規模 |
| `studioIntro.metric1Value` | 500+ (TODO) |
| `studioIntro.metric1Label` | 收錄輔料 |
| `studioIntro.metric2Value` | 3 |
| `studioIntro.metric2Label` | 產品系列 |
| `studioIntro.metric3Value` | < 48h |
| `studioIntro.metric3Label` | 典型詢價回應時間 |
| `studioIntro.metric4Value` | 100% |
| `studioIntro.metric4Label` | 資料隔離 |

**zh-Hans metric keys added** — same values, simplified characters.

---

## Verification (STEP 7)

```
npx tsc --noEmit     → ✅ 0 errors
npx eslint [files]   → ✅ 0 errors / warnings
npm run build        → ✅ built in 5.16s (large-chunk warnings are pre-existing OBJLoader)
```

---

## Logic-check answers

1. **Authed desktop:** `session` truthy → `<DropdownMenu>` renders; trigger shows `studioCtaLabel` (brand name) + `ChevronDown`. Items: My Workspace + separator + Sign out. `session` falsy → plain `<Link>` with B2B Login label — unchanged. ✓

2. **Sign-out flow:** `await signOut()` → Supabase session cleared → `queryClient.clear()` purges React Query cache → `navigate("/designer-studio")` → `useAuth()` re-evaluates `session = null` → Header renders guest branch (B2B Login plain link). ✓

3. **Order of operations:** `queryClient.clear()` is on line 202, after `await signOut()` on line 201. Supabase session is null before cache is cleared — no authed subscriber can refetch personal data during the gap. ✓

4. **Mobile drawer sign-out:** `onClick={() => { setIsMenuOpen(false); handleSignOut(); }}` — drawer closes synchronously before the async sign-out completes. No partial-open state visible. ✓

5. **No-brand screen:** New "Sign out" outline Button calls `handleSignOut` → `signOut()` + `navigate("/designer-studio/login")`. Component has `useI18n` so `t("header.cta.signOut")` resolves correctly. ✓

6. **Three locales:** All four metric pairs (value + label) now defined in EN, zh-Hant, zh-Hans with equivalent semantics (500+ trims / 3 families / <48h / 100% isolation). `header.cta.myWorkspace` and `header.cta.signOut` present in all 3 locales. ✓

7. **cap6 tile:** `to={workspaceHref}` (string, never undefined). `StudioCapabilityTile` receives truthy `to` → renders hover-lift (`hover:-translate-y-0.5`), icon invert, and `<Link>` wrapper with focus ring. Guest → login; authed → dashboard. ✓

---

## Residual risks / observations

- `queryClient.clear()` clears ALL cached queries, including public catalogue data. This causes a brief loading state if the user immediately navigates to the products page after sign-out. Acceptable UX trade-off; the alternative (selective invalidation) adds complexity with little gain.
- The desktop dropdown uses `onClick` on `DropdownMenuItem` for navigation rather than an `asChild` Link — this means the "My Workspace" item is not right-click-openable in a new tab. Low priority; standard for auth menus.
- `RequireBrandAuth.handleSignOut` does not call `queryClient.clear()` — if a user on the no-brand screen signs out and a new user logs in on the same browser without a reload, stale data could appear briefly. Acceptable: the no-brand screen is a narrow edge case and React Query's auth-dependent query keys will invalidate on the new session anyway.
