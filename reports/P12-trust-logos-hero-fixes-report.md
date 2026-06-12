# P12 — Studio Trust Strip Real Logos + Hero Defect Fixes

**Date:** 2026-06-12
**Branch:** main
**Scope:** `src/pages/DesignerStudio.tsx`, `src/components/designer-studio/StudioHero3D.tsx`, `src/features/i18n/translations.ts`

---

## Pre-change audit (STEP 0 verbatim)

```
$ ls public/images/brands/
adidas.webp
calvin-klein.webp
michael-kors.webp
puma.webp
ralph-lauren.webp
```

5 webp files present. **No `tommy-hilfiger.webp`** — even though the homepage `BrandLogosSection.tsx:13` references it. (Homepage 404 is its own problem and is explicitly out of scope per "DO NOT CHANGE: the homepage BrandLogosSection".)

```
$ grep -n "trustWordmarks\|logoSrc\|trustLabel" src/pages/DesignerStudio.tsx
28:const trustWordmarks = [
110:            {t("studioIntro.trustLabel")}
113:            {trustWordmarks.map(({ name }) => (
```

`trustWordmarks` had no `logoSrc` field — entries were `{name: string}` only, rendering 5 fictional all-caps phrases.

```
$ grep -rn "BrandLogosSection" src/ --include="*.tsx" -l
src/components/home/BrandLogosSection.tsx
src/pages/Index.tsx
```

Homepage uses 6 brands (Ralph Lauren, Adidas, Puma, Tommy Hilfiger wide, Michael Kors, Calvin Klein wide) with classes `h-5 md:h-6` (wide marks) / `h-7 md:h-8` (compact marks), `opacity-50 hover:opacity-100`. The studio strip is a thinner trust band, so the prompt's smaller `h-5 lg:h-6 opacity-45 grayscale` with no hover is the correct harmonised treatment.

```
$ grep -n "Drag to rotate\|hint\|Customize\|customize" src/components/designer-studio/StudioHero3D.tsx
53:          {t("studioIntro.customizeThis")}
65:            {t("studioIntro.customizeThis")} →
```

Two consumers of `studioIntro.customizeThis` inside StudioHero3D:
1. **Caption block at lines 50-55** — bottom-left, `pointer-events-none hidden sm:block`, prints the i18n string as plain text.
2. **CTA button at lines 58-68** — bottom-right, prints the i18n string with a hardcoded `→` appended.

```
$ grep -n "customizeThis" src/features/i18n/translations.ts
328:    "studioIntro.customizeThis": "Customize this →",
622:    "studioIntro.customizeThis": "自訂此款 →",
926:    "studioIntro.customizeThis": "自定义此款 →",
```

**The "→" lives inside the i18n string in all 3 locales.** Combined with the button's appended `→`, the rendered text was "Customize this → →" — the double-arrow.

```
$ grep -n "Drag\|Scroll\|rotate\|zoom\|pan\|hint" src/components/designer-studio/Model3DViewer.tsx
308:          Drag to rotate · Scroll to zoom · Right-click to pan
325:        <span className="text-muted-foreground">Format: OBJ</span>
326:        <span className="text-muted-foreground">File size: 2.4 MB</span>
```

`Model3DViewer.tsx:308` already renders the rotation/zoom/pan hint chip internally — gated to when the viewer is mounted. `Model3DViewer.tsx:325-326` is the meta row (Format/File size).

---

## Root-cause analysis

### Defect 1 — Overlapping hint text

The "hint" overlap was actually a **text collision in the bottom-left zone** between two different chips:
- `Model3DViewer.tsx:308` "Drag to rotate · Scroll to zoom · Right-click to pan" (rotation hint, gated to mounted-3D state)
- `StudioHero3D.tsx:50-55` "Customize this →" caption (CTA echo, always visible — including over the poster)

The StudioHero3D caption was the wrong element: it duplicated the bottom-right CTA's purpose, it sat in the same screen real estate as the viewer's own hint, and it rendered even over the poster (the "false promise" the prompt called out). Deleting it resolves the overlap.

### Defect 2 — Double "Customize this" CTA

Same caption block at `StudioHero3D.tsx:50-55` ALSO duplicated the bottom-right CTA's label. One delete eliminates both Defect 1 and Defect 2.

### Defect 3 — Double arrow

The i18n source string contained a literal `→`. The button JSX appended another `→`. Stripping the arrow from all 3 locales **and** swapping the literal `→` for a single `<ArrowRight />` icon component yields one arrow rendered as a lucide glyph.

---

## Diffs

### `src/pages/DesignerStudio.tsx`

```diff
-const trustWordmarks = [
-  { name: "GLOBAL APPAREL BRANDS" },
-  { name: "PREMIUM DENIM HOUSES" },
-  { name: "OUTDOOR & PERFORMANCE" },
-  { name: "LUXURY READY-TO-WEAR" },
-  { name: "HERITAGE SPORTSWEAR" },
-];
+// Real client logos. Tommy Hilfiger's file isn't uploaded yet — falls back to text wordmark.
+const trustWordmarks: { name: string; logoSrc?: string }[] = [
+  { name: "Michael Kors",      logoSrc: "/images/brands/michael-kors.webp" },
+  { name: "Tommy Hilfiger" },
+  { name: "adidas",            logoSrc: "/images/brands/adidas.webp" },
+  { name: "Calvin Klein",      logoSrc: "/images/brands/calvin-klein.webp" },
+  { name: "Polo Ralph Lauren", logoSrc: "/images/brands/ralph-lauren.webp" },
+];
```

```diff
-          <div className="flex-1 flex flex-wrap items-center justify-center lg:justify-end gap-x-8 lg:gap-x-12 gap-y-3">
-            {trustWordmarks.map(({ name }) => (
-              <span
-                key={name}
-                className="text-[11px] tracking-[0.22em] text-foreground/40 font-semibold"
-              >
-                {name}
-              </span>
-            ))}
-          </div>
+          <div className="flex-1 flex flex-wrap items-center justify-center lg:justify-end gap-x-8 lg:gap-x-12 gap-y-3">
+            {trustWordmarks.map(({ name, logoSrc }) =>
+              logoSrc ? (
+                <img
+                  key={name}
+                  src={logoSrc}
+                  alt={name}
+                  loading="lazy"
+                  decoding="async"
+                  className="h-5 lg:h-6 w-auto object-contain opacity-45 grayscale"
+                />
+              ) : (
+                <span
+                  key={name}
+                  className="text-[11px] tracking-[0.22em] text-foreground/40 font-semibold uppercase"
+                >
+                  {name}
+                </span>
+              ),
+            )}
+          </div>
```

### `src/components/designer-studio/StudioHero3D.tsx`

```diff
 import { lazy, Suspense, useEffect, useState } from "react";
 import { Link } from "react-router-dom";
+import { ArrowRight } from "lucide-react";
 import { Button } from "@/components/ui/button";
 import { useI18n } from "@/features/i18n/I18nProvider";
```

```diff
-      {/* Caption — bottom-left, hidden on narrow widths to avoid overlap */}
-      <div className="absolute bottom-5 left-5 right-5 pointer-events-none hidden sm:block">
-        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground max-w-[55%]">
-          {t("studioIntro.customizeThis")}
-        </p>
-      </div>
-
-      {/* CTA — bottom-right, same inset as text */}
+      {/* CTA — bottom-right, single p-5 inset. Only one customize control on the stage;
+          the Model3DViewer renders its own bottom-left "Drag to rotate…" hint when mounted. */}
       <div className="absolute bottom-5 right-5">
         <Link to={HERO_EDITOR_URL}>
           <Button
             size="sm"
             variant="outline"
             className="text-[10px] uppercase tracking-[0.14em] bg-background/90 backdrop-blur-sm rounded-none"
           >
-            {t("studioIntro.customizeThis")} →
+            {t("studioIntro.customizeThis")}
+            <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
           </Button>
         </Link>
       </div>
```

### `src/features/i18n/translations.ts`

```diff
-    "studioIntro.customizeThis": "Customize this →",
+    "studioIntro.customizeThis": "Customize this",
…
-    "studioIntro.customizeThis": "自訂此款 →",
+    "studioIntro.customizeThis": "自訂此款",
…
-    "studioIntro.customizeThis": "自定义此款 →",
+    "studioIntro.customizeThis": "自定义此款",
```

---

## Verification

```
npx tsc --noEmit                                                       → ✅ 0 errors
npx eslint src/pages/DesignerStudio.tsx src/components/.../StudioHero3D.tsx  → ✅ 0 errors / warnings
npm run build                                                          → ✅ built in 4.88s
```

### Logic-check answers

1. **Trust strip render coverage:** Four entries with `logoSrc` (`DesignerStudio.tsx:29, 31-33`) render `<img>` from `/images/brands/{michael-kors|adidas|calvin-klein|ralph-lauren}.webp`. All four paths verified against `ls public/images/brands/` output. Tommy Hilfiger (`DesignerStudio.tsx:30`) has no `logoSrc` and renders the `<span>` text fallback (`DesignerStudio.tsx:120-127`). Puma's file exists but is intentionally unused (the brand isn't currently in the workspace's client list per the prompt's example). Nothing 404s. ✓
2. **Hint chip count in mounted-3D state:** Exactly one — `Model3DViewer.tsx:308` "Drag to rotate · Scroll to zoom · Right-click to pan", rendered internally by the viewer and only present after mount. **Zero hints in the poster state** because the only StudioHero3D overlay element that rendered over the poster (the deleted caption at the old `:50-55`) is gone. The "Interactive 3D" eyebrow at `StudioHero3D.tsx:44-48` remains — it's the section label, not a hint. ✓
3. **Customize CTA + arrow count:** Exactly one `Customize this` control on the stage — the bottom-right button at `StudioHero3D.tsx:57-66`. The button contains one `<ArrowRight className="w-3.5 h-3.5 ml-1.5" />` and no literal `→` character (`StudioHero3D.tsx:61`). All three locales of `studioIntro.customizeThis` (`translations.ts:328, 622, 926`) carry only the verb phrase — no arrows. Grep for `customizeThis` across `src/` returns 4 hits: 3 translation entries + 1 button consumer. ✓
4. **P8 single-inset rule:** The eyebrow uses `absolute top-5 left-5 right-5` (`StudioHero3D.tsx:44`) and the CTA uses `absolute bottom-5 right-5` (`StudioHero3D.tsx:58`). After deleting the caption block, those are the only two stage-level overlay elements, both with the `p-5` (20px) inset. The Model3DViewer's internal meta row (Format/File size at `Model3DViewer.tsx:325-326`) is rendered by the viewer using its own layout; that internal alignment is unchanged because Model3DViewer was not touched. ✓

### Per-logo size overrides

None applied. All four logos use the default `h-5 lg:h-6 w-auto object-contain opacity-45 grayscale`. The `wide` modifier from the homepage (for Calvin Klein and Tommy Hilfiger) was intentionally NOT carried over because the studio trust band is half the visual weight of the homepage brand strip — uniform sizing is preferred at this scale.

### What was NOT touched

- `BrandLogosSection.tsx` (homepage) — out of scope per "DO NOT CHANGE"
- `Model3DViewer.tsx` — out of scope; its internal hint at `:308` and meta row at `:325-326` are the canonical implementations
- The idle-mount gate (`StudioHero3D.tsx:15-24`), PosterStage component, and P8 alignment grid for the remaining eyebrow + CTA
- Workflow rail, capabilities, metrics, FAQ, final CTA sections in `DesignerStudio.tsx`
- The `tommy-hilfiger.webp` 404 on the homepage — that's BrandLogosSection's responsibility

---

## Residual notes

- If/when `tommy-hilfiger.webp` is uploaded, the studio strip auto-promotes Tommy to a logo by adding `logoSrc: "/images/brands/tommy-hilfiger.webp"` to the entry (one-line change). No re-render logic needed.
- Puma is uploaded but unused in the studio strip — kept on disk for the homepage's reuse. If the workspace's client list ever needs to expand to 6, Puma slots in cleanly.
- All four logos use `grayscale` + `opacity-45` for monochrome harmony. If a specific brand's mark reads too thin at that opacity (the Ralph Lauren polo emblem is a common case), a per-logo override can be added later — but visual review is needed before any tweak.
