# P4 — Editor Sign-in Nudge + No-Model Guard: Audit Report

**Date:** 2026-06-11  
**Branch:** main  
**Prerequisites:** P1–P3 merged  
**Files touched:** `src/pages/DesignerStudioEditor.tsx`

---

## 1. Pre-change state (STEP 0 grep output)

```
# grep -n "useLocation\|authSession\|model\b\|iframe\|historyOpen" src/pages/DesignerStudioEditor.tsx | head -25
11:  const model = params.get("model");
15:  const { session: authSession } = useAuth();
16:  const iframeRef = useRef<HTMLIFrameElement>(null);
17:  const [historyOpen, setHistoryOpen] = useState(false);
21:    if (model) qs.set("model", model);
27:  // Save editor session on mount (only when a model is loaded)
29:    if (!model) return;
33:        user_id: authSession?.user?.id ?? null,
36:        model_url: model,
42:  }, [model]);
45:    queryKey: ["editor-sessions", authSession?.user?.id],
54:    enabled: !!authSession?.user?.id,
57:  // Push language to iframe whenever it changes or the editor signals ready.
60:      iframeRef.current?.contentWindow?.postMessage(
88:          {authSession && (
99:              {historyOpen && sessions.length > 0 && (
104:                      to={`/designer-studio/editor?model=${encodeURIComponent(s.model_url)}...`}
125:      <iframe
126:        ref={iframeRef}
```

All four pre-change facts confirmed:
- ✅ Component reads `model`, `name`, `slug` from `useSearchParams` (lines 11–13)
- ✅ `authSession` from `useAuth()`; History renders only when `authSession` exists (lines 15, 88)
- ✅ `useLocation` was NOT imported (no hit in grep)
- ✅ The iframe rendered unconditionally at line 125, regardless of `model`

---

## 2. Changes applied (unified diff)

```diff
diff --git a/src/pages/DesignerStudioEditor.tsx b/src/pages/DesignerStudioEditor.tsx
--- a/src/pages/DesignerStudioEditor.tsx
+++ b/src/pages/DesignerStudioEditor.tsx
@@ -1,12 +1,14 @@
 import { useEffect, useRef, useState } from "react";
-import { Link, useSearchParams } from "react-router-dom";
-import { ArrowLeft, Clock, ChevronDown } from "lucide-react";
+import { Link, useSearchParams, useLocation } from "react-router-dom";
+import { ArrowLeft, Clock, ChevronDown, LogIn, Box } from "lucide-react";
+import { Button } from "@/components/ui/button";
 
 const DesignerStudioEditor = () => {
+  const location = useLocation();
   const [params] = useSearchParams();

@@ -100,7 +100,7 @@
-                  {sessions.map((s: any) => (
+                  {sessions.map((s: { id: string; model_url: string; product_name: string; product_slug?: string; created_at: string }) => (

@@ -121,15 +123,45 @@
           )}
         </div>
+        {!authSession && (
+          <Link
+            to={`/designer-studio/login?next=${encodeURIComponent(location.pathname + location.search)}`}
+            className="shrink-0"
+          >
+            <Button variant="outline" size="sm" className="gap-1.5 text-xs tracking-[0.05em]">
+              <LogIn className="h-3.5 w-3.5" />
+              Sign in to save your design
+            </Button>
+          </Link>
+        )}
       </div>
-      <iframe … />
+      {model ? (
+        <iframe
+          ref={iframeRef}
+          title="3D Editor"
+          src={src}
+          className="flex-1 w-full border-0 bg-background"
+          allow="fullscreen"
+          sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
+        />
+      ) : (
+        <div className="flex-1 flex items-center justify-center px-6">
+          <div className="max-w-md w-full text-center space-y-6 border border-border p-10 bg-background">
+            <div className="mx-auto w-12 h-12 flex items-center justify-center border border-foreground">
+              <Box className="w-5 h-5" strokeWidth={1.5} />
+            </div>
+            <div className="space-y-2">
+              <h2 className="text-xl font-light tracking-wide text-foreground">No model loaded</h2>
+              <p className="text-sm text-muted-foreground leading-relaxed">
+                Choose a trim from the library to start customizing in 3D.
+              </p>
+            </div>
+            <Button asChild className="rounded-none">
+              <Link to="/designer-studio/trim-library">Browse Trim Library</Link>
+            </Button>
+          </div>
+        </div>
+      )}
```

**Incidental fix included in this PR:** The pre-existing `sessions.map((s: any) =>` (line 103) raised an `@typescript-eslint/no-explicit-any` error when ESLint was run against this specific file. Replaced with an inline structural type `{ id: string; model_url: string; product_name: string; product_slug?: string; created_at: string }` — fields match exactly what the History dropdown accesses.

---

## 3. Verification results

### tsc --noEmit
**PASS** — no output (clean, zero errors)

### eslint src/pages/DesignerStudioEditor.tsx
**PASS** — no output after fixing the pre-existing `s: any`. Pre-existing baseline across other files: 74 issues (unchanged).

### npm run build
**PASS** — `✓ 2871 modules transformed`, `✓ built in 5.16s`. No new chunks; pre-existing large-chunk warnings unchanged.

---

### Logic checks

**1. Guest with a model loaded: toolbar shows "Sign in to save your design"; href encodes full current URL including `?model=…&name=…&slug=…`?**  
✅ YES.  
- Nudge rendered at line 126: `{!authSession && ( <Link to={`/designer-studio/login?next=${encodeURIComponent(location.pathname + location.search)}`} … > )}`.  
- `location.pathname` is `/designer-studio/editor`; `location.search` is the raw query string `?model=…&name=…&slug=…` from react-router. Concatenated before `encodeURIComponent`, the full URL encodes correctly. Both `pathname` and `search` reflect live router state, so they are always current.

**2. Authed user: no nudge button rendered; History dropdown unchanged?**  
✅ YES.  
- Nudge: `{!authSession && (…)}` (line 126) — when `authSession` is truthy, `!authSession` is false, nothing renders.  
- History: `{authSession && ( <div className="relative"> … </div> )}` (line 90) — untouched; renders only when authenticated, same as before.

**3. Bare `/designer-studio/editor` (no params): empty state renders, no iframe mounts, no `editor_sessions` insert fires?**  
✅ YES.  
- `model = params.get("model")` returns `null` when no query param (line 13).  
- Iframe: `{model ? ( <iframe … /> ) : ( <div … empty state … /> )}` (line 138) — null is falsy, so the empty state `<div>` renders; the `<iframe>` element is never mounted.  
- Session insert: the `useEffect` at line 31 has `if (!model) return;` as its first line — it exits immediately when `model` is null. No Supabase insert fires.

**4. With model param: iframe renders with identical attributes to before (diff the attribute list)?**  
✅ YES.  
Before (removed):
```
ref={iframeRef}
title="3D Editor"
src={src}
className="flex-1 w-full border-0 bg-background"
allow="fullscreen"
sandbox="allow-scripts allow-same-origin allow-downloads allow-popups"
```
After (inside `{model ? ( … ) : (…)}`): byte-identical. Verified in the diff — only indentation changed (2-space indent added due to JSX nesting inside the ternary); no attribute was added, removed, or modified.

**5. Round trip: login from the nudge returns to the exact editor URL via the `next` param?**  
✅ YES.  
The nudge link passes `?next=<encoded-editor-url>` to `DesignerStudioLogin.tsx`. In that file (DesignerStudioLogin.tsx:46):  
```tsx
const next = searchParams.get("next") || "/designer-studio/dashboard?tab=library";
```  
`searchParams.get("next")` returns the encoded URL, which is truthy → the fallback is skipped. The existing `useEffect` at line 49–53 then calls `navigate(next, { replace: true })`, which decodes the URL and navigates to `/designer-studio/editor?model=…&name=…&slug=…`. The `DesignerStudioEditor` mounts fresh with all params intact; the session-insert effect fires because `model` is non-null and `authSession` is now set.

**6. The empty state's "Browse Trim Library" → `/designer-studio/trim-library`?**  
✅ YES.  
`<Button asChild className="rounded-none"><Link to="/designer-studio/trim-library">Browse Trim Library</Link></Button>` (line 160). The `asChild` prop delegates rendering to the `Link`, so the final DOM element is an `<a href="/designer-studio/trim-library">`.

---

## 4. Out-of-scope observations (noticed, not changed)

- **Hardcoded English labels:** "Sign in to save your design", "No model loaded", "Choose a trim from the library to start customizing in 3D.", "Browse Trim Library" are all hardcoded. i18n wrapping is deferred.
- **Named-design saving via postMessage:** The current session insert records only `model_url`, `product_name`, and `product_slug`. Design state (materials, colours, annotations) lives inside the `/3d-editor/index.html` iframe and is not persisted. A postMessage protocol to serialize and save named design snapshots is a future enhancement.
- **`src` computed even when `model` is null:** The `src` IIFE at lines 19–25 runs regardless; it returns `/3d-editor/index.html` (no query string) when model is null. This is harmless — the iframe is never mounted — but a minor cleanup opportunity.
- **Language postMessage effect with no iframe:** When `model` is null, the language `useEffect` (line 58) still attaches its `message` listener and calls `iframeRef.current?.contentWindow?.postMessage(…)`. Since `iframeRef.current` is null (iframe not mounted), `?.` safely short-circuits. No functional issue.
- **`isCustomizable` flag on ProductDetail:** Still computed but no longer gates the Customize button (changed in P3). The flag is still used for visual badges elsewhere; removal is out of scope.

---

## 5. Residual risks for P5 (landing rebuild)

- **Guest sees nudge on empty state too:** If a guest navigates directly to `/designer-studio/editor` (no model), the empty state renders AND the nudge appears in the toolbar. The nudge's `next` URL would be `/designer-studio/editor` (no params), so login would return to the empty state, not a product. This is a minor UX roughness — P5 could hide the nudge when `!model`, or only show the nudge when the empty state is not active.
- **History dropdown has no empty-list message:** When `authSession` is set but `sessions` is empty (new account), the History button renders but clicking it shows nothing. A "No history yet" empty state inside the dropdown would improve discoverability.
- **Session insert records anonymous users (`user_id: null`):** When a guest views the editor (with a model), `authSession?.user?.id ?? null` inserts a null user_id row. These orphan rows accumulate. P5 or a periodic cleanup job should address them, or the insert should be gated on `!!authSession`.
- **`next` param carrying `?intent=add-library`:** If a user was redirected from P3's add-to-library flow with `?intent=add-library` in the URL, and they then open the editor nudge from that page, the `next` URL will include `?intent=add-library`. After editor login, they'd land on `/designer-studio/editor?model=…&intent=add-library`, which would not trigger the library-add effect (wrong page). No breakage, just a dangling param that resolves silently.
