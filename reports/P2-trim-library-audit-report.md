# P2 — Trim Library Cleanup: Audit Report

**Date:** 2026-06-11  
**Branch:** main  
**Prerequisite:** P1 (smart routing) — merged  
**Files touched:** `src/pages/DesignerStudioTrimLibrary.tsx`, `src/features/i18n/translations.ts`

---

## 1. Pre-change state (STEP 0 grep outputs)

```
# grep -n "studio.enter\|studio.requestAccess\|designer-studio/editor" src/pages/DesignerStudioTrimLibrary.tsx
84:            <Link to="/designer-studio/editor">
86:                {t("studio.enter")}
91:                {t("studio.requestAccess")}
203:              {t("studio.requestAccessBtn")}

# grep -n "readyTitle\|readyBody\|requestAccessBtn" src/pages/DesignerStudioTrimLibrary.tsx
192:            {t("studio.readyTitle")}
195:            {t("studio.readyBody")}
203:              {t("studio.requestAccessBtn")}

# grep -n '"studio.myWorkspace"' src/features/i18n/translations.ts
(no output — key did not exist)
```

All three pre-change facts confirmed:
- ✅ Header bar had `Link to="/designer-studio/editor"` (line 84) with `t("studio.enter")` (line 86), and `Link to="/contact"` with `t("studio.requestAccess")` (line 91)
- ✅ Bottom section used `t("studio.readyTitle")` (line 192), `t("studio.readyBody")` (line 195), `t("studio.requestAccessBtn")` (line 203)
- ✅ `studio.myWorkspace` did not exist in translations.ts

---

## 2. Changes applied (unified diff)

```diff
diff --git a/src/features/i18n/translations.ts b/src/features/i18n/translations.ts
index 9fc0cb1..b1f1b96 100644
--- a/src/features/i18n/translations.ts
+++ b/src/features/i18n/translations.ts
@@ -209,6 +209,7 @@ export const translations: Record<AppLanguage, TranslationMap> = {
     "studio.subtitle": "Browse the full component library. Enter the studio to build review-ready trim concepts.",
     "studio.enter": "Enter Studio",
     "studio.requestAccess": "Request Access",
+    "studio.myWorkspace": "My Workspace",
     "studio.searchPlaceholder": "Search components…",
     "studio.all": "All",
     "studio.empty": "No components found.",
@@ -565,6 +566,7 @@ export const translations: Record<AppLanguage, TranslationMap> = {
     "studio.subtitle": "瀏覽完整輔料庫，快速建立可評審的設計方案。",
     "studio.enter": "進入工作室",
     "studio.requestAccess": "申請權限",
+    "studio.myWorkspace": "我的工作空間",
     "studio.searchPlaceholder": "搜尋輔料…",
     "studio.all": "全部",
     "studio.empty": "找不到符合條件的輔料。",
@@ -850,6 +852,7 @@ export const translations: Record<AppLanguage, TranslationMap> = {
     "studio.subtitle": "浏览完整辅料库，快速建立可评审的设计方案。",
     "studio.enter": "进入工作室",
     "studio.requestAccess": "申请权限",
+    "studio.myWorkspace": "我的工作空间",
     "studio.searchPlaceholder": "搜索辅料…",
     "studio.all": "全部",
     "studio.empty": "未找到匹配的辅料。",

diff --git a/src/pages/DesignerStudioTrimLibrary.tsx b/src/pages/DesignerStudioTrimLibrary.tsx
index 3c23af6..8c48d01 100644
--- a/src/pages/DesignerStudioTrimLibrary.tsx
+++ b/src/pages/DesignerStudioTrimLibrary.tsx
@@ -81,16 +81,19 @@ const DesignerStudioTrimLibrary = () => {
             </p>
           </div>
           <div className="flex gap-3 shrink-0">
-            <Link to="/designer-studio/editor">
-              <Button size="sm" className="tracking-[0.05em] text-xs px-6 capitalize">
-                {t("studio.enter")}
-              </Button>
-            </Link>
-            <Link to="/contact">
-              <Button variant="outline" size="sm" className="tracking-[0.05em] text-xs px-6 capitalize">
-                {t("studio.requestAccess")}
-              </Button>
-            </Link>
+            {session ? (
+              <Link to="/designer-studio/dashboard?tab=library">
+                <Button size="sm" className="tracking-[0.05em] text-xs px-6 capitalize">
+                  {t("studio.myWorkspace")}
+                </Button>
+              </Link>
+            ) : (
+              <Link to="/contact">
+                <Button variant="outline" size="sm" className="tracking-[0.05em] text-xs px-6 capitalize">
+                  {t("studio.requestAccess")}
+                </Button>
+              </Link>
+            )}
           </div>
         </div>
       </section>
@@ -186,6 +189,7 @@ const DesignerStudioTrimLibrary = () => {
       </section>
 
       {/* Bottom CTA + Onboarding */}
+      {!session && (
       <section className="py-20 px-6 lg:px-10 bg-foreground text-background">
         ...existing content unchanged...
       </section>
+      )}
```

---

## 3. Verification results

### tsc --noEmit
**PASS** — no output (clean, zero errors)

### eslint src/pages/DesignerStudioTrimLibrary.tsx src/features/i18n/translations.ts
**PASS** — no output (zero errors or warnings on both touched files). Pre-existing problems in other files: 74 issues across unrelated files (same as P1 baseline).

### npm run build
**PASS** — `✓ 2871 modules transformed`, `✓ built in 4.89s`. Chunk sizes and pre-existing large-chunk warnings unchanged from P1.

---

### Logic checks

**1. Guest header bar shows exactly one button: "Request Access" → `/contact`?**  
✅ YES.  
`session` is `null`/falsy for guests → the `{session ? … : …}` ternary renders the `false` branch: `<Link to="/contact"><Button variant="outline" …>{t("studio.requestAccess")}</Button></Link>` (DesignerStudioTrimLibrary.tsx:89–94). No other buttons exist in the `flex gap-3 shrink-0` div for guests.

**2. Authed header bar shows exactly one button: "My Workspace" → `/designer-studio/dashboard?tab=library`?**  
✅ YES.  
`session` is truthy for authed users → the `true` branch renders: `<Link to="/designer-studio/dashboard?tab=library"><Button size="sm" …>{t("studio.myWorkspace")}</Button></Link>` (DesignerStudioTrimLibrary.tsx:84–88). The "Request Access" branch is excluded.

**3. No remaining `Link` to `/designer-studio/editor` without a `?model=` param anywhere in this file?**  
✅ YES.  
`grep -n 'designer-studio/editor' src/pages/DesignerStudioTrimLibrary.tsx` returns no output after the edit. The only remaining reference in the entire `src/` tree is the route registration in `App.tsx:198` (a `<Route path=…>` declaration, not a navigation link).

**4. Bottom black CTA section renders for guests, absent for authed users?**  
✅ YES.  
`{!session && ( <section …>…</section> )}` wraps the entire CTA block (DesignerStudioTrimLibrary.tsx:191–228). When `session` is truthy `!session` is `false` and React renders nothing; when `session` is null `!session` is `true` and the section renders in full.

**5. `studio.myWorkspace` resolves in EN / 繁中 / 简中 (no missing-key fallback)?**  
✅ YES.  
- EN: `"studio.myWorkspace": "My Workspace"` added at translations.ts:212  
- 繁中 (zh-HK): `"studio.myWorkspace": "我的工作空間"` added at translations.ts:569  
- 简中 (zh-CN): `"studio.myWorkspace": "我的工作空间"` added at translations.ts:855  
All three locales covered; `t("studio.myWorkspace")` will resolve to the correct string in each.

**6. Product card links unchanged: `/designer-studio/products/${product.slug}`?**  
✅ YES.  
`displayProducts.map((product, i) => ( <Link key={product.id} to={`/designer-studio/products/${product.slug}`}>` (DesignerStudioTrimLibrary.tsx:175) — untouched.

---

## 4. Out-of-scope observations (noticed, not changed)

- `studio.enter` keys remain in all three locale blocks — unused but harmless; removal deferred per spec.
- The `studio.subtitle` copy still reads "Enter the studio to build review-ready trim concepts." — copy update for the new no-enter-button world is a content concern for a later phase.
- `session` is already destructured at component top (line 15: `const { session, primaryBrand } = useAuth()`) — no import changes needed.
- The `{!session && (…)}` wrapper leaves a single trailing `)}` line after the section close tag — syntactically valid JSX but visually unusual; a formatter pass would normalise it.

---

## 5. Residual risks

- **Bare `/designer-studio/editor` link in `App.tsx`:** `src/App.tsx:198` registers `<Route path="/designer-studio/editor" element={…} />`. This route is still reachable by direct URL or external deep link without a `?model=` param. If an empty editor is undesirable, `DesignerStudioEditor.tsx` should guard against a missing model param and redirect. This is out of scope for P2.
- **Other pages linking to bare editor:** `grep -rn '"/designer-studio/editor"' src/` returns only `App.tsx:198` (the route declaration). No other page or component links to the bare editor path — the only entry points are now model deep-links from product detail pages.
- **`studio.subtitle` copy drift:** The subtitle still advertises "Enter the studio" but the enter button is gone for guests. Low UX risk since the call-to-action button is the primary affordance, but copy should be updated before wider launch.
- **Guest CTA section visibility on slow auth init:** While `useAuth` resolves `loading`, `session` is `null`, so guests briefly see the correct state (CTA section shown). If auth resolves to a session, the section disappears — no flash of wrong content, just a correct progressive render.
