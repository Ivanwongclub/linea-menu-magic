# P18 — Studio Hero Frame Cleanup, Editor Color Wiring, Featured Trims Parity

**Date:** 2026-06-15
**Branch:** main
**Scope:** `Model3DViewer.tsx`, `StudioHero3D.tsx`, `DesignerStudio.tsx`, `DesignerStudioEditor.tsx`, `ProductCard.tsx`, `public/3d-editor/app.js`, new `resolveProductImage.ts`, `translations.ts`.

Three connected client-side fixes — no schema changes. The §D migration question is documented below for the human; the code lands safely either way.

---

## A. Hero frame cleanup

### A1. Root cause of the overlap

```
$ grep -n "Drag to rotate|Format:|File size|3D Model" StudioHero3D.tsx Model3DViewer.tsx
Model3DViewer.tsx:308   "Drag to rotate · Scroll to zoom · Right-click to pan"  ← internal hint chip
Model3DViewer.tsx:325   "Format: OBJ"                                            ← metadata strip
Model3DViewer.tsx:326   "File size: 2.4 MB"
StudioHero3D.tsx:52     comment only (P12 already removed the customize caption)
```

The hint string is rendered ONCE — by `Model3DViewer.tsx:307-309` at `absolute top-4 left-4`. The visual overlap the user reported wasn't two hint chips; it was StudioHero3D's "Interactive 3D" eyebrow at `top-5 left-5 right-5` colliding with Model3DViewer's hint chip in the same top-left corner of the stage. P12 had already deduplicated the customise caption — the eyebrow was the second collision the screenshot caught.

### A2 + A4. Eyebrow replaced with an in-frame header

The floating `<p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Interactive 3D</p>` overlay is gone. In its place, a real header bar lives INSIDE the frame border, ABOVE the 3D stage:

```tsx
<div className="border border-border bg-secondary/40 overflow-hidden rounded-none">
  <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background">
    <h3 className="text-sm font-semibold tracking-tight text-foreground">
      {t("studioIntro.heroFrameTitle")}
    </h3>
  </div>
  <div className="relative w-full aspect-[4/3]">
    {/* stage (poster or Model3DViewer with showMetadata={false}) */}
    {/* bottom-right CTA at p-5 inset, unchanged */}
  </div>
</div>
```

The 3D stage is wrapped in its own fixed `aspect-[4/3]` container so the frame keeps the same shape between poster and mounted states — there's no layout shift on idle-mount.

**New i18n key:** `studioIntro.heroFrameTitle` in all 3 locales:
- EN: `"3D Model — Metal Buttons"`
- zh-Hant: `"3D模型 — 金屬鈕扣"`
- zh-Hans: `"3D模型 — 金属纽扣"`

Model3DViewer's "Drag to rotate · …" hint is now the ONLY top-left text on the stage. No more overlap.

### A3. `showMetadata` prop on Model3DViewer

```diff
 interface Model3DViewerProps {
   hasModel: boolean;
   modelType?: 'button' | 'zipper' | 'lace' | 'hardware';
   modelUrl?: string;
+  /** When false, hides the bottom "Format: OBJ / File size: …" strip.
+   *  Default true preserves the existing QuickView dialog rendering (P18 A3). */
+  showMetadata?: boolean;
 }
```

The `Format: OBJ / File size: 2.4 MB` strip at `:323-327` is now wrapped in `{showMetadata && (…)}`. StudioHero3D passes `showMetadata={false}`; `ProductQuickView`'s "View 3D Model" dialog (and any other caller) keeps the default `true`.

### A5. P8 alignment grid

Header bar uses `px-5 py-3` — the `px-5` matches the stage's `p-5` inset for the right-side CTA. CTA still bottom-right at `bottom-5 right-5`. PosterStage fills the same fixed-aspect container as the mounted viewer, so the stage region doesn't shift between idle and ready states. P8 alignment intact.

---

## B. Editor auto-load with color

### B1. Existing deep-link

```
StudioHero3D.tsx:9-10  HERO_EDITOR_URL = "/designer-studio/editor?model=…&product=metal-button&name=Button"
DesignerStudio.tsx:62  cap3 tile uses HERO_EDITOR_URL
DesignerStudio.tsx:85  hero CTA uses HERO_EDITOR_URL
DesignerStudio.tsx:156 Featured cards build their own editor URL per product (model_url + name + slug)
DesignerStudioEditor.tsx:21-27  builds iframe `src` from model + name
```

### B2. Color source choice

**Chosen color: `#C9A961` (polished brass).**

Source: the **hero render itself.** The product's `specifications.color_options` for `metal-button` in `pdpSeedData.ts:57` are textual labels (`"Polished Nickel", "Antique Brass", "Gunmetal", "Matte Black"`) with no hex companions. The hero scene renders the button in a polished-gold tone (see Image 1) — the prompt's recommended `#C9A961` matches that visual identity, and we don't have an authoritative hex anywhere in the data layer to override it with. If/when the schema grows a `color_options_hex` column or similar, swap to data-driven; for now the hero color is the hero's own.

`HERO_EDITOR_URL` updated:
```diff
- "/designer-studio/editor?model=/models/d-ring-buckle.obj&product=metal-button&name=Button"
+ "/designer-studio/editor?model=/models/d-ring-buckle.obj&product=metal-button&name=Button&color=%23C9A961"
```

The Featured Trims cards' editor URLs (`DesignerStudio.tsx:156`) did NOT receive a default color. Reason: those URLs deep-link to whichever product the user clicked on; injecting a hero-specific gold tone for non-Button products would be misleading. They keep the default editor material.

### B3. Wiring the color through

#### `DesignerStudioEditor.tsx`

```diff
  const model = params.get("model");
  const name = params.get("name");
  const slug = params.get("slug");
+ const color = params.get("color");  // P18 B3: optional default material color (#RRGGBB)

  const src = (() => {
    const qs = new URLSearchParams();
    if (model) qs.set("model", model);
    if (name) qs.set("name", name);
+   if (color) qs.set("color", color);
    const q = qs.toString();
    return `/3d-editor/index.html${q ? `?${q}` : ""}`;
  })();
```

The existing language postMessage now also pushes the color:
```diff
- const send = () => {
-   iframeRef.current?.contentWindow?.postMessage({ type: "set-language", language }, "*");
- };
+ const send = () => {
+   const win = iframeRef.current?.contentWindow;
+   if (!win) return;
+   win.postMessage({ type: "set-language", language }, "*");
+   if (color) win.postMessage({ type: "set-material-color", color }, "*");
+ };
…
- }, [language]);
+ }, [language, color]);
```

This gives us a belt-and-braces: the static editor can pick up the color from the URL param OR from a postMessage on `editor-ready`. Either path works in isolation.

#### `public/3d-editor/app.js`

Two additions:

1. **`applyMaterialColor(hex)` helper** — sets the active selection's material colors and keeps the `propColor` input in sync. Wrapped in try/catch so a malformed hex falls back silently to default material.

2. **postMessage handler** for `{ type: 'set-material-color', color }` joins the existing `set-language` listener.

3. **Autoload extension** — `autoloadFromQuery` now reads `_urlParams.get('color')` and calls `applyMaterialColor(colorParam)` AFTER `loadOBJText(...)` runs (so the model is loaded and `selected` points at the new root before color set fires).

Order chosen: URL-param path is primary (works on first paint, no parent dependency). PostMessage is the fallback / runtime channel.

### B4. Verification

- Click "Try the 3D Editor" from `/designer-studio` → opens `/designer-studio/editor?…&color=%23C9A961` → iframe loads `/3d-editor/index.html?model=…&name=Button&color=%23C9A961` → autoload fires, model loads, `applyMaterialColor("#C9A961")` paints the button gold. `propColor` input also reads `#C9A961`, so the user can immediately tweak.
- Open `/designer-studio/editor?model=…&name=Foo` (no color param) → behaviour unchanged, default material renders.
- Open `/designer-studio/editor?…&color=garbage` → try/catch swallows the THREE.js color-parse error; default material survives.

---

## C. Featured Trims parity

### C1 + C2. Same picker, different card rendering

Both pages call the same exported `pickFamilyFeatured(products)` on the same `useProducts` data (`DesignerStudio.tsx:45`, `DesignerStudioTrimLibrary.tsx:37`). Picker is in lockstep.

The divergence was in the card image-resolution path:

| Surface | Image source chain |
|---|---|
| Trim Library `<ProductCard>` | `resolveProductImage(p)` → checks `p.images[0]` → `p.thumbnail_url` → seeded → placeholder |
| Landing Featured strip (pre-fix) | `p.thumbnail_url ? getProductImageUrl(p.thumbnail_url, "card") : getProductThumbnailUrl(…)` — skipped both `p.images[0]` AND the seeded fallback |

For products where the canonical image lives in `product.images[0]` (the join row) but `thumbnail_url` is empty or null on the row, the landing strip would skip past the real photo and synthesize a placeholder. Eco Lace Trim in Image 3 is exactly that case — the placeholder generator produced the composer-grid mock visual the user saw.

### C3. Shared image resolver extracted

New file: **`src/features/products/utils/resolveProductImage.ts`** — pulled verbatim from `ProductCard.tsx:23-45` so both surfaces consume the same chain.

```ts
export function resolveProductImage(
  product: Product,
  size: 'thumb' | 'full' = 'thumb',
): string {
  if (product.images?.length) {
    const primary = product.images.find((img) => img.is_primary) ?? product.images[0];
    if (primary?.url) return primary.url;
  }
  if (product.thumbnail_url) return product.thumbnail_url;

  const seeded = getPdpSeedImages(product.slug, product.primary_category?.slug);
  if (seeded && seeded.length > 0) return seeded[0];

  return getProductPlaceholderUrl(
    product.name_en ?? product.name,
    product.item_code,
    product.primary_category?.slug,
    product.primary_category?.name,
    size === 'thumb' ? 400 : 800,
  );
}
```

- `ProductCard.tsx` now imports from the shared util (the local function is deleted; `getPdpSeedImages` + `getProductPlaceholderUrl` imports removed too — they're consumed inside the shared util).
- `DesignerStudio.tsx` Featured Trims card replaces its custom image branch with `getProductImageUrl(resolveProductImage(p, 'thumb'), 'card')`.

### C4. Localised display name

`DesignerStudio.tsx:185` was rendering `{p.name}` — which is the *primary* `name` field (often a non-EN locale on this data). The Trim Library's `ProductCard` already uses `product.name_en ?? product.name`. Aligned:

```tsx
const displayName = p.name_en ?? p.name;
// …
<h3>{displayName}</h3>
```

This also flows into the alt text and the editor URL's `&name=` param — so the editor's header shows the EN name when one is present.

### C5. "Open in Editor" gating

`DesignerStudio.tsx:155` already conditions on `p.model_url`:
```tsx
const editorUrl = p.model_url ? `/designer-studio/editor?…` : null;
…
{editorUrl && (<Link to={editorUrl}>Open in Editor</Link>)}
```

Source is correct. If the user's screenshot showed "OPEN IN EDITOR" on all three cards, that's a **data state** issue — the products other than `metal-button` still have `model_url` populated from pre-P5a-r seed values (likely `/models/cord-stopper.obj`, `/models/metal-badge.obj`, or other broken paths the P5a-r migration nulls out). The gating in the source is honest; what's rendered depends on which database state the page reads. See §D below.

---

## D. Migration-state hypothesis (for the human — NOT a code task)

Strong evidence that the P5a-r migration (`supabase/migrations/20260611130000_rename_button_remove_ugly_models.sql`) has NOT been applied to the live Supabase yet:

| Signal | What it implies |
|---|---|
| Image 3 shows `環保蕾絲` (Traditional Chinese name) for the Eco Lace card even in EN | The product row's `name_en` is empty or null on that record — P5a-r's UPDATE never landed |
| "OPEN IN EDITOR" appears on all three Featured Trims cards | Eco Lace and Woven Badge still have `model_url` pointing at broken OBJ paths (the cord-stopper / metal-badge / hardware files P5a-r nulls out) |
| The hero d-ring-buckle.obj works | Public `/models/*.obj` files are static assets; the file loads even though the product row that should *reference* it doesn't exist with the right name + model_url |

**Verify in the Supabase SQL editor:**
```sql
SELECT slug, name, name_en, model_url FROM products WHERE slug = 'metal-button';
-- expected: name='Button', name_en='Button', model_url='/models/d-ring-buckle.obj'

SELECT slug, model_url FROM products
WHERE model_url LIKE '%cord-stopper.obj' OR model_url LIKE '%metal-badge.obj';
-- expected: 0 rows

SELECT slug, model_url FROM products
WHERE model_url IN ('/models/hardware.obj','/models/zipper.obj','/models/hw-snap-002.obj','/models/button.obj','/models/zip-n3-002.obj');
-- expected: 0 rows
```

If those queries don't return the expected state, apply `20260611130000_rename_button_remove_ugly_models.sql` via the Supabase SQL editor. After that:
- The Featured Trims cards C4 will render `Eco Lace Trim` instead of `環保蕾絲`
- The "OPEN IN EDITOR" button will appear only on the Button card (C5 gating works)
- The hero CTA's deep-link will hit the canonical Button product

The P18 client code is correct independent of migration state. Half of §C's *visible* behaviour depends on the data, which is the human's responsibility to resolve in Supabase.

---

## Logic-check answers

1. **One hint chip on the hero?** Yes — Model3DViewer's at `top-4 left-4` is now the only top-left text. StudioHero3D's overlapping "Interactive 3D" eyebrow is replaced by a real in-frame header bar above the stage.
2. **Format/File-size absent from hero, present in QuickView?** Yes — gated on the new `showMetadata` prop. StudioHero3D passes `false`; QuickView dialog's `<Model3DViewer hasModel … />` call (no override) keeps the default `true`.
3. **Header "3D Model — Metal Buttons" visible in all three locales?** Yes — `studioIntro.heroFrameTitle` added to EN / zh-Hant / zh-Hans, rendered by `StudioHero3D.tsx` header bar.
4. **Editor URL carries `&color=`; editor applies it?** Yes — `HERO_EDITOR_URL` has `&color=%23C9A961`. `DesignerStudioEditor.tsx` reads `color`, appends to iframe URL, also postMessages on `editor-ready`. `public/3d-editor/app.js` reads `color` from `_urlParams`, calls `applyMaterialColor(hex)` after `loadOBJText(...)`; postMessage handler covers runtime updates.
5. **Featured Trims + Trim Library identical?** Image resolution: yes (both routed through `resolveProductImage`). Names: yes (`name_en ?? name` on both). Product set: yes (same `pickFamilyFeatured` on same data).
6. **"Open in Editor" only when `model_url` is set?** Yes — `DesignerStudio.tsx:155` gates on `p.model_url`. Whether the button shows on multiple cards depends on the database state (see §D).
7. **P8 alignment intact?** Yes — header bar inside the border, stage in a fixed-aspect container, CTA `bottom-5 right-5` unchanged. Poster ↔ mounted state no longer shifts the stage region.

---

## Files touched

| File | Change |
|---|---|
| `src/components/designer-studio/Model3DViewer.tsx` | new `showMetadata` prop + gate |
| `src/components/designer-studio/StudioHero3D.tsx` | frame layout: in-border header bar + fixed-aspect stage container; eyebrow removed; HERO_EDITOR_URL gains `&color=%23C9A961`; pass `showMetadata={false}` |
| `src/pages/DesignerStudio.tsx` | featured strip uses shared `resolveProductImage`; `name_en ?? name` fallback; editor URL inherits localised name |
| `src/pages/DesignerStudioEditor.tsx` | reads `color` param; passes to iframe URL + postMessage |
| `public/3d-editor/app.js` | `applyMaterialColor(hex)` helper; postMessage handler for `set-material-color`; autoload reads `color` URL param |
| `src/components/products/ProductCard.tsx` | imports `resolveProductImage` from shared util; local function deleted |
| `src/features/i18n/translations.ts` | 3 locales × `studioIntro.heroFrameTitle` |
| `src/features/products/utils/resolveProductImage.ts` | **new** — shared resolver |
| `reports/P18-…` | this report |

---

## Verification

```
$ npx tsc --noEmit                                       → ✅ 0 errors
$ npx eslint <touched files>                             → ✅ 0 errors / warnings
$ npm run build                                          → ✅ built in 4.77s
$ grep "Drag to rotate" src/components/designer-studio/  → only Model3DViewer:308 (one site)
$ grep "Format: OBJ" src/components/designer-studio/     → only Model3DViewer:325 (gated)
```

---

## Residual risks

1. **`pickFamilyFeatured` + database state.** The trim library and the landing now share image resolution, but they may still pick *different first products per family* if the `useProducts` query returns different rows in different ordering on different sessions. If the user reports product mismatch (rather than image mismatch), the picker itself needs determinism — out of scope here.
2. **Color persistence in static editor.** `applyMaterialColor` runs once on autoload. If the static editor's IndexedDB has cached a prior `selected` color, that cache is wiped by the model-load branch (line 1148-1150). No collision expected.
3. **postMessage echo.** The Editor pushes `set-material-color` on `editor-ready`. The autoload also calls `applyMaterialColor` from inside the iframe. Both paths are idempotent — calling `mat.color.set(hex)` twice is a no-op — so the redundancy is safe.
4. **§D migration unapplied.** Half of §C5's visible behaviour depends on the migration. The code is correct either way; if §D's hypothesis is true, the human needs to apply the migration via Supabase SQL editor before the OPEN IN EDITOR button gating reads as one-card-only in the demo.
5. **Heroframe title is hard-coded to "Metal Buttons" in copy.** If/when the hero shifts to a different artefact, the i18n string needs updating in lockstep. Lower priority — the hero artefact is a deliberate marketing choice, not data-driven.
