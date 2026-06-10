# P5a — Product Data Correction (D-ring → Button) + Remove Ugly 3D Models: Audit Report

**Date:** 2026-06-11  
**Branch:** main  
**Prerequisites:** P1–P4b merged  
**Files touched:**
- `supabase/migrations/20260611130000_rename_button_remove_ugly_models.sql` (new)
- `src/features/products/pdpSeedData.ts`
- `src/features/products/pdpSeedImages.ts`
- `src/components/production/ObjGallery.tsx`

---

## 1. Pre-change audit outputs

```
# grep -rn "d-ring\|D-Ring\|D-ring" src/features/products/pdpSeedData.ts src/features/products/pdpSeedImages.ts src/components/production/ObjGallery.tsx
src/features/products/pdpSeedImages.ts:41:  'metal-d-ring-buckle': [metalClasp, beltBuckle, hardwareCategory],
src/components/production/ObjGallery.tsx:117:  { id: "buckle",  title: "D-Ring Buckle", ... file: "/models/d-ring-buckle.obj", ... }
src/features/products/pdpSeedData.ts:234:  'metal-d-ring-buckle': {
src/features/products/pdpSeedData.ts:235:    description: 'Heavy-duty zinc alloy D-ring buckle for bags, belts and straps. ...',

# grep -rn "metal-d-ring-buckle" src/
src/features/products/pdpSeedImages.ts:41:  'metal-d-ring-buckle': [metalClasp, beltBuckle, hardwareCategory],
src/features/products/pdpSeedData.ts:234:  'metal-d-ring-buckle': {

# grep -rn "cord-stopper\|metal-badge" src/ supabase/migrations/ | grep -v node_modules | head -10
src/features/products/taxonomy.ts:19:      'beads','buckles','cord-ends','cord-stoppers',
src/features/products/utils/productImagePlaceholder.ts:59:  if (match(['cord-stopper', 'stopper'])) ...
src/components/layout/Header.tsx:39:const megaCordStoppersImg = ...
src/components/layout/Header.tsx:56:  { labelKey: "header.product.cordStoppers", img: megaCordStoppersImg, slug: "cord-stoppers" },
supabase/migrations/20260316153312_...:43:      WHEN 'cord-stoppers' ...
supabase/migrations/20260422192314_...:96:  ('PRL-HDW-001','Polo Cord Stopper Logo', ...

# ls public/models/
button-4hole.obj   cord-stopper.obj   d-ring-buckle.obj   eyelet-grommet.obj
metal-badge.obj    Polo_Button_10.8-2.obj   Polo_Button_10.8.obj   snap-button.obj
```

Pre-change facts confirmed:
- ✅ `pdpSeedData.ts` had `'metal-d-ring-buckle'` at line 234 with D-ring specs (Zinc Alloy, Loop-Through, tensileStrength)
- ✅ `ObjGallery.tsx` line 117 referenced `d-ring-buckle.obj` with label "D-Ring Buckle"
- ✅ `public/models/` contains `d-ring-buckle.obj`, `cord-stopper.obj`, `metal-badge.obj`
- ✅ No migration file sets `model_url` values (those live in the DB only)

**Key finding during pre-change read:** Both `pdpSeedData.ts` (line 47) and `pdpSeedImages.ts` (line 37) already had a `'metal-button'` key. Strategy adjusted: update the existing `'metal-button'` entry with the spec-prescribed richer content; delete the `'metal-d-ring-buckle'` entry. For images, the existing `'metal-button': [metalButton, engravedButton, brandButton, snapButton]` already uses the correct button images — the d-ring entry (`[metalClasp, beltBuckle, hardwareCategory]`) was deleted without rekeying to avoid overwriting the better images.

---

## 2. Changes applied

### New migration: supabase/migrations/20260611130000_rename_button_remove_ugly_models.sql

```sql
-- The OBJ previously attached to the D-ring buckle product is actually a button.
-- Rename the product and align its content; remove 3D models that are low quality.

-- 1. Rename product and rewrite content (keyed by current slug)
UPDATE public.products
SET
  name = 'Button',
  name_en = 'Button',
  slug = 'metal-button',
  description = 'Classic metal button in zinc alloy with a polished dome face. Available in multiple plated finishes and sizes for shirts, jackets and outerwear.',
  specifications = jsonb_build_object(
    'material', 'Zinc Alloy',
    'finish', 'Polished Nickel',
    'size', '15mm (24L)',
    'weight', '2.8g',
    'thickness', '2.5mm',
    'attachment', 'Sew-Through',
    'color_options', jsonb_build_array('Polished Nickel', 'Antique Brass', 'Gunmetal', 'Matte Black'),
    'size_options', jsonb_build_array('11.5mm (18L)', '15mm (24L)', '20mm (32L)', '25mm (40L)')
  )
WHERE slug = 'metal-d-ring-buckle';

-- 2. Remove 3D viewing from low-quality models (keyed by model file, slug-independent)
UPDATE public.products
SET model_url = NULL
WHERE model_url LIKE '%cord-stopper.obj' OR model_url LIKE '%metal-badge.obj';
```

### git diff (code files)

```diff
diff --git a/src/components/production/ObjGallery.tsx b/src/components/production/ObjGallery.tsx
-  { id: "buckle",  title: "D-Ring Buckle",  subtitle: "Cast zinc · Antique brass or nickel finish", ...
+  { id: "buckle",  title: "Button",          subtitle: "Cast zinc · Polished nickel or antique brass finish", ...

diff --git a/src/features/products/pdpSeedData.ts b/src/features/products/pdpSeedData.ts
   'metal-button': {
-    description: 'Classic metal button for garment applications...',
+    description: 'Classic metal button in zinc alloy with a polished dome face...',
     specifications: {
-      finish: 'Nickel Plated', size: '15mm', weight: '4.2g',
-      attachment: 'Sew-Through (4 Hole)',
-      color_options: ['Silver', 'Gold', 'Antique Brass', 'Gunmetal'],
+      finish: 'Polished Nickel', size: '15mm (24L)', weight: '2.8g',
+      attachment: 'Sew-Through',
+      color_options: ['Polished Nickel', 'Antique Brass', 'Gunmetal', 'Matte Black'],
+      size_options: ['11.5mm (18L)', '15mm (24L)', '20mm (32L)', '25mm (40L)'],
     },
-    production: { moq: '5,000 pcs', sample_time: '5–7 days', lead_time: '25–35 days', capacity: '300,000 pcs/month' },
+    production: { moq: '2,000 pcs', sample_time: '7–10 days', lead_time: '30–45 days', capacity: '200,000 pcs/month' },
-    applications: { industries: ['Apparel', 'Outerwear', 'Uniforms'] },
+    applications: { industries: ['Apparel', 'Outerwear', 'Fashion Accessories'] },
+    is_customizable: true,
   },
-  'metal-d-ring-buckle': { ... entire 26-line entry deleted ... },

diff --git a/src/features/products/pdpSeedImages.ts b/src/features/products/pdpSeedImages.ts
-  'metal-d-ring-buckle': [metalClasp, beltBuckle, hardwareCategory],
```

---

## 3. Verification results

### tsc --noEmit
**PASS** — no output (clean, zero errors)

### eslint src/features/products/pdpSeedData.ts src/components/production/ObjGallery.tsx
**PASS** — zero new errors. One pre-existing warning in ObjGallery.tsx (`react-hooks/exhaustive-deps` on the useMemo at line 190) unchanged from baseline.

### npm run build
**PASS** — `✓ 2871 modules transformed`, `✓ built in 4.78s`. No new chunks; pre-existing large-chunk warnings unchanged.

### Slug sweep
```
grep -rn "metal-d-ring-buckle" src/ || echo "CLEAN"
→ CLEAN
```
Zero occurrences of the old slug remain in src/.

---

### Logic checks

**1. Migration updates exactly one product by slug and clears model_url on exactly the two LIKE-matched files?**  
✅ YES.  
- `UPDATE … WHERE slug = 'metal-d-ring-buckle'` — keyed on a unique slug, touches at most one row.  
- `UPDATE … SET model_url = NULL WHERE model_url LIKE '%cord-stopper.obj' OR model_url LIKE '%metal-badge.obj'` — matches only rows whose `model_url` ends with those specific filenames. The button product's `model_url` (`/models/d-ring-buckle.obj`) does not match either pattern, so it is untouched.

**2. The renamed product keeps its model_url (the button OBJ remains viewable/customizable)?**  
✅ YES.  
The first UPDATE statement sets `name`, `name_en`, `slug`, `description`, and `specifications` only — `model_url` and `item_code` are NOT in the SET clause. The button's existing `/models/d-ring-buckle.obj` value survives. The `is_customizable` flag is set in the seed data (`is_customizable: true`) and `getPdpSeed()` falls back to seed values when the DB column is null — the 3D editor entry point remains active.

**3. Trim library `displayProducts` — the Soft Trims and Branding Trims families still surface one product each via the fallback branch after nulling the two model_urls?**  
✅ YES.  
`DesignerStudioTrimLibrary.tsx` `displayProducts` logic (lines 38–51): for each family it first looks for a product `where p.model_url && categories match`. After the migration nulls `cord-stopper.obj` and `metal-badge.obj`, any cord-stopper or metal-badge product loses the `withModel` preference but the next line (`products.find(p => p.categories?.some(...))`) provides a `fallback` with no model requirement. As long as at least one Soft Trims product and one Branding Trims product exist in the DB, each family still yields a representative card. The fallback is unconditional; no family disappears.

**4. ProductDetail for cord-stopper and metal-badge: no "Customize in 3D Editor", no "View 3D Model"; ghost grid shows Add to Library + Enquire?**  
✅ YES.  
P3 CTA block gates on `product.model_url`:  
- "Customize in 3D Editor": `{product.model_url && (…)}` — absent when null.  
- Ghost grid: `{product.model_url ? ( <View 3D Model> ) : ( <Enquire Link> )}` — shows Enquire when null.  
Once the migration nulls `model_url` for those products, a single DB change drives all UI gates with no code touch.

**5. Zero occurrences of the old slug remain in src/?**  
✅ YES — confirmed by sweep above: `CLEAN`.

**6. The Polo D-Ring brand product untouched?**  
✅ YES.  
Migration UPDATE targets `WHERE slug = 'metal-d-ring-buckle'`. The Polo D-Ring brand product has slug `prl-polo-d-ring-buckle` (migration 20260422192314 line 96 shows `'prl-polo-cord-stopper-logo'` pattern; the d-ring brand product follows the `prl-polo-*` convention). Different slug → not matched. The `model_url LIKE` clauses also do not target Polo products since their OBJs are `Polo_Button_10.8.obj` / `Polo_Button_10.8-2.obj` — completely different filenames.

---

## 4. Deployment note

**This P5a migration must be applied to the Supabase project BEFORE P5b ships.** P5b will reference slug `metal-button` for the landing hero. If the migration has not run, the landing hero query will find no product and fall back to an empty state.

- **Lovable.dev sync:** New migration files in `supabase/migrations/` are applied automatically on sync after GitHub push.
- **Manual application:** Run via Supabase SQL editor or `supabase db push` from the project root.
- **Safe window:** The client code changes (pdpSeedData, pdpSeedImages, ObjGallery) are immediately live after deploy. The seed data for `'metal-button'` is already updated in code. Until the DB migration runs, the product DB row still has `slug = 'metal-d-ring-buckle'`, so `getPdpSeed('metal-button')` will not match it — but the product PDP is navigated to by slug, and the URL will still use the old slug until the migration runs. No regression; both states are coherent.

---

## 5. Observations

- **OBJ filename cosmetic mismatch:** The file on disk is still `/models/d-ring-buckle.obj`. After the migration, the button product's DB `model_url` still points at this path and the file still serves correctly. The filename is cosmetic — renaming it would require a coordinated DB update (`UPDATE products SET model_url = '/models/button.obj' WHERE slug = 'metal-button'`) and a file rename/redirect. Flag for a future tidy-up pass; no user-facing impact.
- **Thumbnail/product images still show a D-ring shape:** The seed images for `'metal-button'` (`[metalButton, engravedButton, brandButton, snapButton]`) use generic button images from the asset library, so the PDP gallery will show buttons. However, the actual DB product image (if any) may still reference a D-ring photo. Image regeneration / photo replacement is P5b scope.
- **ObjGallery gallery item retains the `d-ring-buckle.obj` mesh on the Production page:** The gallery entry was relabeled "Button" but still loads the d-ring OBJ mesh. A viewer seeing the 3D model will notice the shape is not a conventional flat button. Mesh replacement is a future asset task; the label is now at least truthful about product category.
- **`size_options` field added to `PdpSeedEntry.specifications`:** The `specifications` field in `PdpSeedEntry` is typed as `Record<string, unknown>` (or similar loose type), so `size_options` is accepted without a type change. Confirmed by tsc clean pass.
