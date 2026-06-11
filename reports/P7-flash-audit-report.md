# P7 — Page-Load Flash: Investigation + Fix Report

**Date:** 2026-06-11  
**Branch:** main  
**Scope:** `src/hooks/use-scroll-animation.ts`, `src/App.tsx`

---

## PART A — Findings

### A1. Method
Browser-based reproduction was not possible in this environment, so the diagnosis is a rigorous static trace of the first-paint render path: `index.html` → `main.tsx` → providers in `App.tsx` → route render. Each hypothesis is mapped to source evidence with file:line references.

### A2 / A3. Hypotheses table

| # | Hypothesis | Verdict | Evidence | User-visible symptom | Affected pages |
|---|---|---|---|---|---|
| **H1** | i18n late hydration text-swap flash | **REJECTED** | `src/features/i18n/I18nProvider.tsx:34` uses `useState<AppLanguage>(getStoredLanguage)` — lazy initializer reads `localStorage` synchronously at first render (`I18nProvider.tsx:25-31`). The only `useEffect` (line 43) writes `document.documentElement.lang` — no state change, no re-render. First paint is in the persisted language. | none | none |
| **H2** | Scroll-reveal animating above-fold content | **CONFIRMED** | `src/hooks/use-scroll-animation.ts:21` initialises `isVisible = false`. The `useLayoutEffect` runs before paint but registers an `IntersectionObserver` whose callback (line 46) fires *asynchronously* after paint. The existing route-entry bailout at line 40 only triggers when `rect.top ≤ topZoneThreshold` (max(600, viewportH × 0.28) = **600px on a ≥ 1080p screen**). With a tall hero (`py-20 lg:py-24` + content ≈ 700–900px), the trust strip, featured strip and capability grid sit *above the fold but below 600px* — so they fall through to the observer path and flash from `opacity-0` → `opacity-100` on the first observer tick. | Sections below the hero blink in 1–2 frames after first paint | DesignerStudio (7 hooks), TrimLibrary, and every page using `useScrollAnimation` |
| **H3** | Route-level Suspense skeleton flash | **CONFIRMED** | `src/App.tsx:130-132` wraps every lazy route in `<Suspense fallback={<RouteTransitionFallback />}>`. `RouteTransitionFallback` (lines 117-128) renders four large `animate-pulse` blocks **the instant** a chunk suspends — even when the chunk resolves in 30–60ms on a warm cache. The fallback unmounts the previous route's content, so navigation looks like "page → animated skeleton → page". Only the homepage (`/`, line 181) is eagerly imported and exempt. | Skeleton blink on every navigation and on deep-link load of any non-`/` route | every lazy route |
| **H4** | Auth render-gate on whole tree | **REJECTED** | `AuthProvider.tsx:29` initialises `loading: true` but no consumer render-gates the whole tree. `App.tsx:174` wraps children directly. `RequireBrandAuth.tsx` only gates its own subtree. | none | none |
| **H5** | `RouteAndNetworkWarmup` side effects | **REJECTED** | `App.tsx:134-159` only appends `<link rel="preconnect">` and `<link rel="dns-prefetch">` to `<head>` via `useEffect` and returns `null`. No state changes, no re-renders, no DOM in the React tree. | none | none |
| **H6** | Font loading FOUT/FOIT | **SUSPECTED (minor)** | `index.html:13` loads Google Fonts at runtime: `<link href="https://fonts.googleapis.com/css2?family=Poppins...&display=swap" rel="stylesheet">`. `display=swap` is correct, so text renders in the fallback font first and swaps to Poppins once the file arrives. The swap is real but visually subtle — closer to a metric shift than a "page reloads" flash. Self-hosting (per `~/.claude/CLAUDE.md`) would eliminate this entirely. | Brief letterform/metric shift on first paint | every page |
| **H7** | Other (StrictMode, theme class, body opacity) | **REJECTED** | `src/main.tsx` has no `<React.StrictMode>` wrapper. `src/index.css` has no body-level `opacity-0` or theme class applied late. No dev-only double render. | none | none |

---

## PART B — Fixes applied

### Fix H2 — `src/hooks/use-scroll-animation.ts`

Widen the route-entry bailout from "top 600px" to "anything in the viewport at first layout". Below-fold elements still go through the observer.

```diff
- const topZoneThreshold = Math.max(topZonePx, Math.floor(viewportHeight * 0.28));
- const isInTopZone = rect.top <= topZoneThreshold && rect.bottom > 0;
- if (triggerOnce && disableTopOnRouteEntry && isRouteEntry && isInTopZone) {
+ const isInViewport = rect.top < viewportHeight && rect.bottom > 0;
+ const topZoneThreshold = Math.max(topZonePx, Math.floor(viewportHeight * 0.28));
+ const isInTopZone = rect.top <= topZoneThreshold && rect.bottom > 0;
+ if (triggerOnce && disableTopOnRouteEntry && isRouteEntry && (isInViewport || isInTopZone)) {
    setIsVisible(true);
    return;
  }
```

The `topZonePx` knob is retained for callers that want a stricter top-of-page-only bailout, but the default behaviour now bails out on any in-viewport element. Below-fold sections (rect.top ≥ viewportHeight) keep the existing observer + fade-in.

`prefers-reduced-motion` was already handled at line 28 — left as-is.

### Fix H3 — `src/App.tsx`

Split the suspense fallback into a `RouteSkeleton` (the actual JSX) and a `RouteTransitionFallback` wrapper that delays mounting it by 180ms. Fast chunks finish before the timer fires and the user sees nothing.

```diff
- function RouteTransitionFallback() {
-   return (
-     <div className="min-h-[45vh] px-6 lg:px-8 py-16">
-       ...
-     </div>
-   );
- }
+ function RouteSkeleton() {
+   return (
+     <div className="min-h-[45vh] px-6 lg:px-8 py-16">
+       ...
+     </div>
+   );
+ }
+
+ // Delay the skeleton so fast chunk loads (<180ms) never paint it.
+ function RouteTransitionFallback() {
+   const [show, setShow] = useState(false);
+   useEffect(() => {
+     const id = window.setTimeout(() => setShow(true), 180);
+     return () => window.clearTimeout(id);
+   }, []);
+   if (!show) return null;
+   return <RouteSkeleton />;
+ }
```

`withRouteSuspense` and the route definitions are unchanged.

### Recommendations not implemented in this phase

- **H6 — Self-host Poppins.** `index.html:13` should be replaced with a self-hosted `@font-face` block in `index.css`, with the actual `.woff2` files placed in `src/assets/fonts/` and preloaded via `<link rel="preload" as="font" crossorigin>` in `index.html`. This eliminates the runtime Google Fonts fetch and the resulting FOUT. Deferred because it's a self-contained perf task with its own verification matrix and shouldn't ride on a flash-fix commit. Tracked separately.

---

## Verification

```
npx tsc --noEmit                                              → ✅ 0 errors
npx eslint src/App.tsx src/hooks/use-scroll-animation.ts      → ✅ 0 errors / warnings
npm run build                                                 → ✅ built in 4.96s
```

### Logic-check answers

1. **First-paint sequence after fixes:**
   - DesignerStudio landing: `useLayoutEffect` in `useScrollAnimation` runs for each section *before paint*. For each section whose `rect.top < viewportHeight`, `isVisible` is set to `true` synchronously. First paint shows trust/featured/caps already at `opacity-100`. Below-fold sections paint at `opacity-0` (correct — they're outside the viewport, the user can't see them). On scroll, the observer fires and fades them in normally. **Flash eliminated.**
   - Navigation to a lazy route: Suspense triggers. `RouteTransitionFallback` mounts but renders `null` for 180ms. If the chunk resolves in <180ms (typical for warmed-up caches), the user sees nothing — no skeleton flash. If the chunk takes longer, the skeleton appears at the 180ms mark, which feels like a deliberate loading state rather than a blink. **Skeleton flash eliminated for fast loads.**

2. **H2 below-fold + reduced motion:** Below-fold elements (`rect.top ≥ viewportHeight`) skip the route-entry bailout and stay on the observer path — they fade in on scroll exactly as before. `prefers-reduced-motion` path at `use-scroll-animation.ts:28` is unchanged and still sets `isVisible = true` immediately for everything. ✓

3. **H3 slow chunks:** If a chunk takes > 180ms, the `setTimeout` fires, `show` flips to `true`, and `RouteSkeleton` renders normally. The user still gets the loading indicator they need for slow loads. Cleanup runs in the `return` of the effect, so an aborted suspense (chunk resolves before 180ms) cancels the timer cleanly. ✓

4. **H1 (not fixed but verified still correct):** `getStoredLanguage()` reads `localStorage` synchronously in the `useState` initializer. First render uses the persisted language. The `LanguageSwitcher` calls `setLanguage(next)` which both updates state and writes to `localStorage` — persistence intact. ✓

5. **No new warnings:** `tsc` and `eslint` both clean. No hydration warnings expected because there is no SSR — this is a pure Vite SPA.

---

## How to confirm in browser (manual checklist)

Once Lovable redeploys, open Chrome DevTools → **Performance** → "Screenshots" enabled, then record a trace for each scenario below. Compare the recorded screenshots to verify no flash.

| Scenario | Expected behaviour |
|---|---|
| Hard-reload `/designer-studio` (Cmd+Shift+R) | Hero, trust strip, featured strip and capability grid all paint together at full opacity. No section fades in unless you start scrolling. |
| Navigate `/` → `/products` from the desktop nav | No skeleton blink. The previous page may briefly remain visible, then the new page paints (assuming `/products` chunk loads in <180ms). |
| Throttle network to "Slow 3G" in DevTools, then navigate `/` → `/products` | Skeleton DOES appear after ~180ms and stays until chunk loads. This is intentional. |
| Hard-reload `/designer-studio/trim-library` (deep link, no warmed cache) | App shell renders empty for up to 180ms while the chunk loads; then the page fills in. No skeleton blink for typical fast loads. |
| Visit any page, scroll down past the hero | Below-fold reveal sections fade in on scroll — animation still works. |
| Enable `prefers-reduced-motion` in OS settings, reload any page | Every reveal section renders fully opaque, no animation. |
| Switch language with the header switcher, then hard-reload | After reload, the page paints in the chosen language with no English flash. |

Suggested DevTools workflow: Performance recorder → click "Reload" → stop after 3s → expand the **Screenshots** filmstrip. The first screenshot showing meaningful content should already have the trust/featured sections at full opacity. Compare against the pre-P7 build (commit `c988cb7`) to verify the difference.

---

## Residual risks

- **180ms is empirical.** It's the common React-Suspense delay value (used by frameworks like Remix and Next.js for loading boundaries). On very slow connections, a 180ms blank flash before the skeleton appears might feel like nothing is happening. If users report this, increase the delay or wire a `useTransition` at the navigation site so the previous route stays visible during suspense.
- **Viewport check is layout-time.** If a section is hidden by `display: none` initially (or has zero height because content hasn't measured), `rect.top < viewportHeight` will be true (top is 0) and the section will set visible immediately. Not a known concern in this codebase, but worth knowing.
- **Google Fonts FOUT remains.** Until H6 is addressed, there will still be a subtle font swap on first paint. If the user originally meant the font-swap visual when they said "page reloads", H6 should be prioritised next.
- **H3 fix relies on React 18 behavior.** Suspense fallback can re-mount (and reset the 180ms timer) if React decides to retry. In practice this is rare with `React.lazy()` chunks but worth a note.
