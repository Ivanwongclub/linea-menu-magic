# P3 — Product Detail CTA Consolidation: Audit Report

**Date:** 2026-06-11  
**Branch:** main  
**Prerequisites:** P1 (smart routing), P2 (trim library cleanup) — both merged  
**Files touched:** `src/pages/ProductDetail.tsx`

---

## 1. Pre-change state (STEP 0 grep outputs)

```
# grep -n "Request Quote\|Customize This Trim\|Add to My Library\|Download Spec Sheet\|Open in Editor" src/pages/ProductDetail.tsx
525:                  Request Quote
531:                    Customize This Trim
538:                    Add to My Library
542:                    Download Spec Sheet
561:                        Open in Editor

# grep -n "useAuth\|sonner\|useSearchParams\|useNavigate" src/pages/ProductDetail.tsx
(no output — none of these were imported)

# grep -n "addItem" src/features/products/hooks/useUserLibrary.ts
(no output — no addItem in the hook)
```

All three pre-change facts confirmed:
- ✅ CTA block had: default Button "Request Quote" (no onClick), `isCustomizable`-gated outline Button "Customize This Trim" (no onClick), ghost-button grid with "Add to My Library" (no onClick), "Download Spec Sheet" (no onClick), "View 3D Model" (working, `setShow3D`), "Open in Editor" (working Link with `?model=` params)
- ✅ `ProductDetail.tsx` did not import `useAuth`, `useNavigate`, `useSearchParams`, or `sonner`
- ✅ `useUserLibrary.ts` has no `addItem` function

---

## 2. Changes applied (unified diff)

```diff
diff --git a/src/pages/ProductDetail.tsx b/src/pages/ProductDetail.tsx
--- a/src/pages/ProductDetail.tsx
+++ b/src/pages/ProductDetail.tsx
@@ -1,9 +1,12 @@
-import { useState, useMemo } from 'react';
-import { useParams, Link, useLocation } from 'react-router-dom';
+import { useState, useMemo, useEffect, useCallback } from 'react';
+import { useParams, Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
+import { toast } from 'sonner';
+import { useAuth } from '@/features/auth/AuthProvider';
+import { supabase } from '@/integrations/supabase/client';
 import {
   FileDown, Box, Send, Palette, BookmarkPlus, Download,
   ShieldCheck, Factory, ArrowRight, Layers, ClipboardList,
-  Package, Cpu, Globe, ChevronRight, Edit3,
+  Package, Cpu, Globe, ChevronRight,
 } from 'lucide-react';

@@ -270,6 +270,9 @@ export default function ProductDetail() {
   const { slug } = useParams<{ slug: string }>();
   const location = useLocation();
+  const navigate = useNavigate();
+  const [searchParams, setSearchParams] = useSearchParams();
+  const { session, primaryBrand } = useAuth();
   const isStudioContext = location.pathname.startsWith('/designer-studio');
   const { product, loading, error } = useProduct(slug ?? '');
   const [show3D, setShow3D] = useState(false);

@@ -320,6 +320,44 @@ export default function ProductDetail() {
   }, [product]);

+  const addToLibrary = useCallback(async () => {
+    if (!product) return;
+    if (!session || !primaryBrand) {
+      const next = encodeURIComponent(`${location.pathname}?intent=add-library`);
+      navigate(`/designer-studio/login?next=${next}`);
+      return;
+    }
+    const { data: existing } = await supabase
+      .from('user_library_items')
+      .select('id')
+      .eq('team_id', primaryBrand.id)
+      .eq('product_id', product.id)
+      .maybeSingle();
+    if (existing) {
+      toast.info('Already in your library');
+      return;
+    }
+    const { error: insertError } = await supabase
+      .from('user_library_items')
+      .insert({ team_id: primaryBrand.id, product_id: product.id });
+    if (insertError) {
+      toast.error('Could not add to library');
+      return;
+    }
+    toast.success(`${product.name} added to your library`);
+  }, [product, session, primaryBrand, navigate, location.pathname]);
+
+  // Complete a pending add-library intent after login
+  useEffect(() => {
+    if (searchParams.get('intent') !== 'add-library') return;
+    if (!product || !session || !primaryBrand) return;
+    addToLibrary();
+    const params = new URLSearchParams(searchParams);
+    params.delete('intent');
+    setSearchParams(params, { replace: true });
+    // eslint-disable-next-line react-hooks/exhaustive-deps
+  }, [product?.id, session, primaryBrand]);
+
   if (loading) {

@@ -564,45 +564,44 @@ export default function ProductDetail() {
               {/* CTAs */}
               <div className="space-y-3 mt-auto">
-                <Button variant="default" size="lg" className="w-full gap-2 h-12 text-sm font-semibold tracking-wide">
-                  <Send className="h-4 w-4" />
-                  Request Quote
+                <Button
+                  variant="default"
+                  size="lg"
+                  className="w-full gap-2 h-12 text-sm font-semibold tracking-wide"
+                  asChild
+                >
+                  <Link to={`/contact?product=${encodeURIComponent(product.slug)}`}>
+                    <Send className="h-4 w-4" />
+                    Request Quote
+                  </Link>
                 </Button>

-                {isCustomizable && (
-                  <Button variant="outline" size="lg" className="w-full gap-2 h-11 text-sm">
-                    <Palette className="h-4 w-4" />
-                    Customize This Trim
+                {product.model_url && (
+                  <Button variant="outline" size="lg" className="w-full gap-2 h-11 text-sm" asChild>
+                    <Link
+                      to={`/designer-studio/editor?model=…&name=…&slug=…`}
+                    >
+                      <Palette className="h-4 w-4" />
+                      Customize in 3D Editor
+                    </Link>
                   </Button>
                 )}

-                <div className={`grid gap-2 ${product.model_url ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2'}`}>
-                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9">
+                <div className="grid gap-2 grid-cols-2">
+                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" onClick={addToLibrary}>
                     <BookmarkPlus className="h-3.5 w-3.5" />
                     Add to My Library
                   </Button>
-                  <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9">
-                    <FileDown className="h-3.5 w-3.5" />
-                    Download Spec Sheet
-                  </Button>
-                  {product.model_url && (
+                  {product.model_url ? (
                     <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" onClick={() => setShow3D(true)}>
                       <Box className="h-3.5 w-3.5" />
                       View 3D Model
                     </Button>
-                  )}
-                  {product.model_url && (
-                    <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" asChild>
-                      <Link to={`/designer-studio/editor?model=…&name=…&slug=…`}>
-                        <Edit3 className="h-3.5 w-3.5" />
-                        Open in Editor
+                  ) : (
+                    <Button variant="ghost" size="sm" className="gap-1.5 text-[11px] h-9" asChild>
+                      <Link to={`/contact?product=${encodeURIComponent(product.slug)}`}>
+                        <Send className="h-3.5 w-3.5" />
+                        Enquire
                       </Link>
                     </Button>
                   )}
```

---

## 3. Verification results

### tsc --noEmit
**PASS** — no output (clean, zero errors)

### eslint src/pages/ProductDetail.tsx
**PASS** — no output (zero errors or warnings on the touched file). Pre-existing baseline: 74 issues in other files (unchanged from P1/P2).

### npm run build
**PASS** — `✓ 2871 modules transformed`, `✓ built in 5.16s`. No new chunks; pre-existing large-chunk warnings unchanged.

---

### Logic checks

**1. Zero buttons without an action on the product detail page?**  
✅ YES.  
- "Request Quote" → `asChild` Link to `/contact?product=…` (line 573)  
- "Customize in 3D Editor" → `asChild` Link with full `?model=…&name=…&slug=…` params (line 582), gated on `product.model_url`  
- "Add to My Library" → `onClick={addToLibrary}` (line 591)  
- "View 3D Model" → `onClick={() => setShow3D(true)}` (line 595–598), gated on `product.model_url`  
- "Enquire" (no-model fallback) → `asChild` Link to `/contact?product=…` (line 602), shown when `!product.model_url`  
No button in the CTA block is without an action.

**2. Guest clicks "Add to My Library" → redirected to `/designer-studio/login?next=<product-url>%3Fintent%3Dadd-library`?**  
✅ YES.  
`addToLibrary` (line 323): when `!session || !primaryBrand`, it builds `next = encodeURIComponent(`${location.pathname}?intent=add-library`)` and calls `navigate(`/designer-studio/login?next=${next}`)` (lines 325–328). The full URL encodes correctly: the `?intent=add-library` suffix becomes `%3Fintent%3Dadd-library` inside the outer query string.

**3. After login, user returns to the product page, item inserts once, toast shows, `intent` param is stripped from the URL?**  
✅ YES.  
The `useEffect` (line 350) fires when `product?.id`, `session`, or `primaryBrand` changes. After login, `session` and `primaryBrand` become truthy, the effect detects `intent=add-library` in `searchParams`, calls `addToLibrary()`, then strips the param via `setSearchParams(params, { replace: true })` (line 357) so it doesn't re-fire. The `addToLibrary` callback calls `toast.success(…)` on successful insert (line 345).

**4. Duplicate add shows "Already in your library" info toast, no second insert?**  
✅ YES.  
`addToLibrary` first queries `supabase.from('user_library_items').select('id')…maybeSingle()` (lines 330–335). If `existing` is non-null it calls `toast.info('Already in your library')` and returns early (lines 336–339) — no insert is attempted.

**5. "Customize in 3D Editor" carries identical `model/name/slug` params to the old "Open in Editor" link?**  
✅ YES.  
Old "Open in Editor" (pre-change, line 558):  
`/designer-studio/editor?model=${encodeURIComponent(product.model_url)}&name=${encodeURIComponent(product.item_code || product.name)}&slug=${encodeURIComponent(product.slug)}`  
New "Customize in 3D Editor" (line 582):  
`/designer-studio/editor?model=${encodeURIComponent(product.model_url)}&name=${encodeURIComponent(product.item_code || product.name)}&slug=${encodeURIComponent(product.slug)}`  
Identical construction.

**6. Products without `model_url`: no customize button, ghost grid shows Add to Library + Enquire?**  
✅ YES.  
- "Customize in 3D Editor" is wrapped in `{product.model_url && (…)}` (line 579) — absent when no model.  
- Ghost grid: `{product.model_url ? ( <View 3D Model> ) : ( <Enquire link> )}` (lines 595–606) — when no model, renders the Enquire Link to `/contact?product=…`.

**7. RLS sanity: does `user_library_items` allow inserts for brand members?**  
✅ YES — not a blocker.  
The latest migration (`20260422182607_d0d7b60f-2b15-4f33-95c0-8335ad14d795.sql`) replaces the earlier broad policies with:

```sql
create policy "Authed manage own brand library" on public.user_library_items
  for all to authenticated
  using (public.user_has_brand(auth.uid(), team_id))
  with check (public.user_has_brand(auth.uid(), team_id));
```

`FOR ALL` covers INSERT, UPDATE, DELETE, and SELECT. The `WITH CHECK` clause requires `user_has_brand(auth.uid(), team_id)`. In `addToLibrary`, `team_id` is always set to `primaryBrand.id`, and `primaryBrand` is only non-null when the authenticated user is a member of that brand (enforced by `useAuth`). The insert will satisfy the RLS check.

---

## 4. Out-of-scope observations (noticed, not changed)

- **Contact page `?product=` prefill:** The "Request Quote" and "Enquire" links now carry `?product=<slug>`, but `Contact.tsx` does not currently read this parameter to pre-populate a subject/inquiry field. Reading and applying this param is a future enhancement.
- **`isCustomizable` flag:** Still computed from `product.is_customizable || seed?.is_customizable` (line 424) and used for a badge/label elsewhere in the file. It no longer gates the customize button — the gate is now `product.model_url`. If isCustomizable=true but model_url=null, no customize button appears; this is correct for the current scope.
- **`QuickRFQDialog` / RFQ components:** Referenced elsewhere in the file but not touched. Full RFQ wiring is pending the guest-RFQ business decision.
- **i18n:** The page uses hardcoded English strings ("Request Quote", "Customize in 3D Editor", "Add to My Library", "View 3D Model", "Enquire"). Wrapping these in `t(…)` is out of scope for P3.
- **`FileDown` icon at line 754** (Downloads section): Survives because the Downloads section uses it for downloadable_files (library items). Was not removed.
- **`studio.enter` / other unused keys:** Not in this file; no changes needed.

---

## 5. Residual risks for P4/P5

- **`/designer-studio/editor` with no `?model=` param is still reachable via direct URL.** `App.tsx:198` registers the route unconditionally. If a user navigates there without a model param, the editor loads with an empty state. `DesignerStudioEditor.tsx` should guard against a missing model and redirect (or show an empty state message). P4 should address this.
- **Deferred-auth intent round-trip via `next` param:** The `DesignerStudioLogin.tsx` `next` parameter carries the full URL including `?intent=add-library`. If the user logs in and is redirected, the `useEffect` fires `addToLibrary()` and immediately strips `?intent`. However, if login redirects to `RequireBrandAuth` (no brand), the user never reaches the product page and the intent is silently dropped. P4 should decide whether to surface a post-onboarding redirect in that case.
- **`user_library_items` insert race:** Two rapid clicks before the first Supabase response could trigger two inserts. The `UNIQUE (product_id, team_id)` constraint in the DB will block the second with a unique-violation error, which surfaces as `toast.error('Could not add to library')` — technically misleading (it did get added on the first click). P4 could improve UX with a loading/disabled state on the button.
- **`addToLibrary` in the intent `useEffect`:** The `eslint-disable-next-line react-hooks/exhaustive-deps` comment suppresses a warning about `addToLibrary` not being in the dependency array. The intent effect is intentionally scoped to `product?.id`, `session`, and `primaryBrand` to avoid re-running on every render. This is safe given the `intent` guard, but should be reviewed if the callback is ever made more complex.
- **Bare editor deep links from other pages (P4 scope):** `grep -rn 'designer-studio/editor' src/` shows only `App.tsx` (route) and `ProductDetail.tsx` (deep link with params). No other page links to the bare editor path; no additional surface area introduced.
