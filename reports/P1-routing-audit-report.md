# P1 — Designer Studio Smart Routing: Audit Report

**Date:** 2026-06-10  
**Branch:** main  
**Files touched:** `src/components/layout/Header.tsx`, `src/pages/DesignerStudioLogin.tsx`

---

## 1. Pre-change state (STEP 0 grep outputs)

```
# grep -n "studioCtaHref\|studioCtaLabel" src/components/layout/Header.tsx
209:  const studioCtaHref = session ? "/designer-studio" : "/designer-studio/login";
210:  const studioCtaLabel = primaryBrand?.name ?? t("header.cta.b2bLogin");

# grep -n '"/designer-studio"' src/components/layout/Header.tsx
147:  { href: "/designer-studio", labelKey: "header.nav.designerStudio" },
156:  "/designer-studio": () => import("@/pages/DesignerStudio"),
209:  const studioCtaHref = session ? "/designer-studio" : "/designer-studio/login";

# grep -n 'next = searchParams' src/pages/DesignerStudioLogin.tsx
46:  const next = searchParams.get("next") || "/designer-studio";
```

All four pre-change facts confirmed before editing:
- ✅ `studioCtaHref = session ? "/designer-studio" : "/designer-studio/login"` (line 209)
- ✅ `NAV_LINKS` contains `{ href: "/designer-studio", labelKey: "header.nav.designerStudio" }` (line 147)
- ✅ `routeLoaders` had `/designer-studio` (line 156) and `/designer-studio/trim-library` (line 157), but NOT `/designer-studio/dashboard`
- ✅ `DesignerStudioLogin.tsx` had `searchParams.get("next") || "/designer-studio"` (line 46)

---

## 2. Changes applied (unified diff)

```diff
diff --git a/src/components/layout/Header.tsx b/src/components/layout/Header.tsx
index 8d285b0..db8ad1c 100644
--- a/src/components/layout/Header.tsx
+++ b/src/components/layout/Header.tsx
@@ -155,16 +155,18 @@ const routeLoaders: Record<string, () => Promise<unknown>> = {
   "/ecollections": () => import("@/pages/Brochures"),
   "/designer-studio": () => import("@/pages/DesignerStudio"),
   "/designer-studio/trim-library": () => import("@/pages/DesignerStudioTrimLibrary"),
+  "/designer-studio/dashboard": () => import("@/pages/DesignerStudioDashboard"),
   "/news": () => import("@/pages/News"),
   "/contact": () => import("@/pages/Contact"),
 };
 
 const preloaded = new Set<string>();
 function preloadRoute(href: string) {
-  if (preloaded.has(href)) return;
-  const loader = routeLoaders[href];
+  const path = href.split("?")[0];
+  if (preloaded.has(path)) return;
+  const loader = routeLoaders[path];
   if (loader) {
-    preloaded.add(href);
+    preloaded.add(path);
     loader();
   }
 }
@@ -206,8 +208,10 @@ const Header = () => {
 
   const isHeroPage    = pathname === "/";
   const isTransparent = isHeroPage && !scrolled && !isProductsOpen && !isAboutOpen;
-  const studioCtaHref = session ? "/designer-studio" : "/designer-studio/login";
+  const studioCtaHref = session ? "/designer-studio/dashboard?tab=library" : "/designer-studio/login";
   const studioCtaLabel = primaryBrand?.name ?? t("header.cta.b2bLogin");
+  const resolveNavHref = (href: string) =>
+    href === "/designer-studio" && session ? "/designer-studio/dashboard?tab=library" : href;
 
   useEffect(() => {
     document.body.style.overflow = isMenuOpen ? "hidden" : "";
@@ -386,7 +390,7 @@ const Header = () => {
                 return (
                   <Link
                     key={link.href}
-                    to={link.href}
+                    to={resolveNavHref(link.href)}
                     className={linkClass(isActive(link.href))}
                     onMouseEnter={() => preloadRoute(link.href)}
                     onFocus={() => preloadRoute(link.href)}
@@ -778,7 +782,7 @@ const Header = () => {
                 return (
                   <Link
                     key={link.href}
-                    to={link.href}
+                    to={resolveNavHref(link.href)}
                     onClick={() => setIsMenuOpen(false)}
                     onTouchStart={() => preloadRoute(link.href)}
                     className="text-lg font-medium tracking-tight text-foreground hover:text-muted-foreground transition-colors duration-150 block py-4 px-6 border-b border-border"

diff --git a/src/pages/DesignerStudioLogin.tsx b/src/pages/DesignerStudioLogin.tsx
index 483cbc5..0a9649f 100644
--- a/src/pages/DesignerStudioLogin.tsx
+++ b/src/pages/DesignerStudioLogin.tsx
@@ -43,7 +43,7 @@ export default function DesignerStudioLogin() {
   const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
   const [authError, setAuthError] = useState<string | null>(null);
 
-  const next = searchParams.get("next") || "/designer-studio";
+  const next = searchParams.get("next") || "/designer-studio/dashboard?tab=library";
 
   // If already signed in, bounce to next
   useEffect(() => {
```

---

## 3. Verification results

### tsc --noEmit
**PASS** — no output (clean, zero errors)

### eslint
**PASS (for touched files)** — `Header.tsx` and `DesignerStudioLogin.tsx` produced zero new errors or warnings. The 74 pre-existing problems reported by the full `npm run lint` run are all in other files (TaxonomyTab.tsx, LayerPanel.tsx, useDesignSessions.ts, etc.) and were present before this change.

### npm run build
**PASS** — `✓ 2871 modules transformed`, `✓ built in 4.94s`. Pre-existing large-chunk warnings for OBJLoader (898 kB) and DesignerStudioDashboard (306 kB) are unchanged.

---

### Logic checks

**1. Guest: nav "Designer Studio" → `/designer-studio`? CTA → `/designer-studio/login`?**  
✅ YES.  
- `resolveNavHref` (Header.tsx:211–212): condition `href === "/designer-studio" && session` — when `session` is `null`/falsy the right operand short-circuits, so the function returns the original `href` unchanged → `/designer-studio`.  
- `studioCtaHref` (Header.tsx:209): ternary selects the `false` branch → `/designer-studio/login`.

**2. Authed: nav "Designer Studio" → `/designer-studio/dashboard?tab=library`? CTA → same?**  
✅ YES.  
- `resolveNavHref("/designer-studio")` when `session` is truthy: condition is true → returns `/designer-studio/dashboard?tab=library` (Header.tsx:212).  
- `studioCtaHref` ternary selects the `true` branch → `/designer-studio/dashboard?tab=library` (Header.tsx:209).

**3. Login with no `next` param → lands on `/designer-studio/dashboard?tab=library`?**  
✅ YES.  
- `const next = searchParams.get("next") || "/designer-studio/dashboard?tab=library"` (DesignerStudioLogin.tsx:46): `searchParams.get("next")` returns `null` which is falsy → fallback string is used. The existing `useEffect` on line 49–53 calls `navigate(next, { replace: true })` immediately on auth.

**4. Login with `next=/designer-studio/editor?model=x` → returns to that exact URL?**  
✅ YES.  
- `searchParams.get("next")` returns the full string `/designer-studio/editor?model=x`, which is truthy → `||` short-circuits, `next` equals the provided URL. `navigate(next, { replace: true })` navigates to it intact (DesignerStudioLogin.tsx:46, 51).

**5. `preloadRoute("/designer-studio/dashboard?tab=library")` resolves the DesignerStudioDashboard loader?**  
✅ YES.  
- `path = "/designer-studio/dashboard?tab=library".split("?")[0]` → `"/designer-studio/dashboard"` (Header.tsx:164).  
- `routeLoaders["/designer-studio/dashboard"]` → `() => import("@/pages/DesignerStudioDashboard")` (Header.tsx:158).  
- Loader is called and `preloaded.add("/designer-studio/dashboard")` guards against double-loading.

**6. Mobile menu designer-studio link resolves identically to desktop?**  
✅ YES.  
- Desktop generic branch: `to={resolveNavHref(link.href)}` (Header.tsx:393).  
- Mobile generic branch: `to={resolveNavHref(link.href)}` (Header.tsx:785).  
- Same function, same argument, same result.

---

## 4. Out-of-scope observations (noted, not changed)

- `megaMenu: "products"` and `megaMenu: "about"` branches in desktop nav hardcode `to="/products"` and `to="/about"` directly (lines 369, 379) — not NAV_LINKS-driven, unaffected.
- Mobile CTA `Link to={studioCtaHref}` on line 796 already receives the updated `studioCtaHref` value with no additional changes needed; the `preloadRoute(studioCtaHref)` call on the same line will now receive a `?tab=library`-suffixed href for authed users, which the updated query-safe `preloadRoute` strips correctly.
- The `isActive(link.href)` class logic still checks against the original `link.href` (`"/designer-studio"`), so the active-state highlight triggers on any `/designer-studio/*` path — consistent with the existing `pathname.startsWith(path + "/")` logic in `isActive`.
- `RequireBrandAuth.tsx`, `AuthProvider.tsx`, and `App.tsx` routes were not examined or touched.

---

## 5. Residual risks

- **`/designer-studio/dashboard` route registration in `App.tsx`:** This report assumes the route exists. If it is guarded by `RequireBrandAuth` and a user without brand membership hits it, the no-brand handling in that component will display (by design per the spec). No risk here, but the next phase should confirm the route guard is in place.
- **`?tab=library` query param handling in DesignerStudioDashboard:** If the dashboard does not consume this param, users land on the default tab. This is a degraded-but-not-broken state. Phase 2 should verify the tab is read and applied.
- **Large bundle for DesignerStudioDashboard (306 kB gzipped: 86 kB):** Already present before this PR. Adding a preload entry means the chunk is now fetched eagerly on hover for authed users. If the chunk causes performance concerns on slow connections, consider further code-splitting within the dashboard in a later phase.
- **`preloaded` set is module-level (never cleared):** If a user transitions from guest → authed in the same session without a hard reload, the preloaded set may still hold `/designer-studio` (from a guest hover), but the dashboard preload under `/designer-studio/dashboard` is a different key — so the dashboard will be fetched on first authed hover. No impact on correctness.
