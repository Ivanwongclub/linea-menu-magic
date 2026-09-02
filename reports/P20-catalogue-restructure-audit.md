# P20 — Catalogue Restructure: Audit Report

**Date:** 2026-09-02
**Branch:** main
**Type:** Audit only — no files modified, no migrations written, no commands run beyond read-only search
**Client:** WIN-CYC (Hong Kong garment trim manufacturer)
**Scope of proposed work (not started):** (a) controlled option lists replacing free-text specifications, (b) category/menu restructure to 5 families / 25 subcategories (Apparel segment), (c) 135-record colour/finish taxonomy (CYC-0001–CYC-0135) with faceted filtering

---

## Executive summary

- **There is no single source of truth for categories.** Leaf categories live in Supabase (`product_categories`), but the family/segment grouping layer exists in **three independent, hand-maintained, mutually inconsistent copies**: `src/features/products/taxonomy.ts`, `src/components/layout/Header.tsx`'s `MEGA_FAMILIES`, and `src/features/products/hooks/useProducts.ts`'s `SEGMENT_TO_FAMILIES`. None of these three agree with each other today, before any restructure work begins.
- **Product specifications/production are unconstrained `Json` columns** edited through a genuinely free-text key/value editor (`ProductEditor.tsx`) with no schema, and the codebase already has three different key-naming conventions in play (snake_case DB seed data, snake_case frontend seed fallback, camelCase legacy/QuickView expectations) — one of which (`ProductQuickView.tsx`'s Production Info block) is effectively dead code because it only matches the unused camelCase convention.
- **A frontend "seed data" fallback layer (`pdpSeedData.ts`, `pdpSeedImages.ts`) is live in production**, unconditionally, for 19 named product slugs, silently filling gaps in real DB data on a per-field basis with no visual indication that a value is fabricated content rather than real WIN-CYC data.
- **No colour/finish/material lookup table exists anywhere** — the only structured, hex-coded colour data in the repo (`ObjGallery.tsx`) is an unrelated 3D-viewer material-preset demo, not wired to products, and structurally cannot hold 135 coded records.
- **RLS on `products` and all taxonomy tables is `FOR ALL USING (true) WITH CHECK (true)`** — any authenticated user, regardless of role or brand, can create/edit/delete any product or category, including other brands' private catalogues. The admin CMS UI has no role gate either.
- **The target 5-family/25-subcategory structure has no overlap with today's "Branding Trims" family and only partial overlap with "Soft Trims" and "Hardware"** — several current leaf categories (beads, drawcords, cord-ends, cord-stoppers, toggles, patches) have no home in the new structure, and one current category name (`hook-eyes`) collides in name only with a differently-scoped new category (`Hook & Loop`).
- **Product count and current product→category distribution could not be determined from the repo** — no live DB access, and no product seed data is checked into `supabase/migrations/*.sql`.

---

## 1. Category source of truth

### 1a. What actually drives what

| Surface | Drives from |
|---|---|
| `/products` listing (`src/pages/Products.tsx`) | `useProducts()` (`src/features/products/hooks/useProducts.ts`) — queries `products`, `product_category_map`, `product_categories` directly (**DB-backed**). Filters come from query-string params via `useProductFiltersFromURL.ts`, not path segments. |
| Sidebar filters (`src/components/products/ProductsSidebar.tsx`) | Leaf category checkboxes: DB, via `useProductTaxonomy()` (`useProductTaxonomy.ts:44`, queries `.from('product_categories')`). **Grouping** of those DB categories into family sections, and the Segments quick-filter buttons (Apparel/Beauty/Material): hardcoded `PRODUCT_FAMILIES`/`PRODUCT_SEGMENTS` from `taxonomy.ts` (imported `ProductsSidebar.tsx:14-17`, used lines 145-151, 197). |
| Site nav / mega menu (`src/components/layout/Header.tsx`) | **Does not import `taxonomy.ts` or `useProductTaxonomy` at all.** Has its own independent hardcoded tree: `MEGA_FAMILIES` (`Header.tsx:107-143`) and `MEGA_GRID_ITEMS` (`Header.tsx:52-68`), with slugs derived at click-time via a local `slugify()` (`Header.tsx:145-147`) applied to hardcoded English display names — a **second, drifting source of truth**. |
| URL routing (`src/App.tsx:198-243`) | Category/family/segment are **query-string parameters only** (`?category=`, `?family=`, `?segment=`), never path segments. No `/products/:category` or `/products/:family/:segment` route exists. Only route param in the products area is `/products/:slug` (product slug, `App.tsx:207`). |

### 1b. Every consumer of `taxonomy.ts` and `useProductTaxonomy`

**`PRODUCT_FAMILIES`:**
- `useProducts.ts:5,231` — resolves `filters.family` and segment→family mapping to DB category slugs
- `src/features/products/utils/pickFamilyFeatured.ts:2,15,33` — picks one featured product per family for Designer Studio
- `ProductsSidebar.tsx:15,145` — groups DB categories under family headings
- `src/pages/DesignerStudioTrimLibrary.tsx:9,48` — family filter tabs
- `src/pages/Products.tsx:19,123` — resolves family slug to display name for filter chips

**`PRODUCT_SEGMENTS`:** only `ProductsSidebar.tsx:16,197` (Segments quick-filter buttons).

**`PRODUCT_SEGMENT_DETAILS`:** **no consumers anywhere** outside `taxonomy.ts` itself (`grep -rn "PRODUCT_SEGMENT_DETAILS|ProductSegmentDetail|SegmentCategory"` — only hits in the definition file). Dead/unused.

**`useProductTaxonomy`:** `ProductEditor.tsx:104`, `ProductCatalogTab.tsx:58,273`, `DesignerStudioWorkspace.tsx:105,473,517`, `DesignerStudioTrimLibrary.tsx:38`, `Products.tsx:22,59`.

### 1c. Every consumer of Supabase `categories` / `product_categories` / `product_category_map`

- **`categories`** (bare table): **zero consumers** — `grep -rn "from('categories')"` returns nothing anywhere in `src/`.
- **`product_categories`**: `useProductTaxonomy.ts:44`; `TaxonomyTab.tsx:264,283` (admin CRUD); `ImportTab.tsx:158-160` (CSV slug resolution); `useProducts.ts:32,245,310` (filter dimension table + nested select).
- **`product_category_map`**: `useProducts.ts:41,248,308` (filter resolution + product-category join); `ProductEditor.tsx:177,651,657` (saving primary/secondary categories); `ImportTab.tsx:187`.

### 1d. `categories` vs `product_categories` — one is dead

`categories` was created as a self-referential hierarchical table (`parent_id uuid REFERENCES public.categories(id)`) in `supabase/migrations/20260316105420_813b4c53-72ea-4da3-9d5a-b4c8ed20e720.sql:7-18`, paired at the time with a *different*, purely-M2M table also named `product_categories`. That entire generation was dropped wholesale one migration later — `DROP TABLE IF EXISTS public.categories CASCADE;` (`supabase/migrations/20260316105731_9ce1cbd3-4158-4087-9633-29138a5403c4.sql:28`) — and replaced with today's schema: `product_categories` redefined as a **flat lookup table** (`id, name, slug, sort_order, icon_url`; `...105731...sql:42-49`, matches `src/integrations/supabase/types.ts:408-433`), plus a newly-named junction `product_category_map` (`...105731...sql:142-150`, matches `types.ts:435-467`, adds an `is_primary` flag). `types.ts`'s full `Tables` key list (lines 17-849) confirms `categories` **does not exist in the current schema at all**. Nothing in `src/` references it — **`categories` is dead** (a name collision with the CURRENT `product_categories`'s original short-lived working name, not a live parallel table).

`product_categories` = flat leaf-category lookup (no hierarchy, no family/segment/parent field). `product_category_map` = M2M join between `products` and `product_categories`, with `is_primary boolean` used to pick a canonical primary category for breadcrumbs/PDP (`useProducts.ts:77-84`).

`TaxonomyTab.tsx` (the admin CRUD UI) only manages `product_categories` (flat, leaf-level) plus tags/materials/industries/certifications (`TaxonomyTab.tsx:280-347`) — **it has no UI concept of family or segment at all**. Those groupings exist only in the hardcoded `taxonomy.ts` and, independently, in `Header.tsx`'s `MEGA_FAMILIES`, with **no admin-editable representation anywhere**.

### 1e. Slug usage in URLs and rename blast radius

Slugs are consumed exclusively as query-string values (`?category=`, `?family=`, `?segment=`), parsed by `useProductFiltersFromURL.ts:5-18`. Because slugs never appear in the URL path, **a rename never 404s — it fails silently** (empty or wrong filter results):
- Any hardcoded link using the old slug (full list in §6c) becomes a no-op filter.
- `PRODUCT_FAMILIES[].categorySlugs` entries in `taxonomy.ts:13-25` that still reference an old slug make that category silently vanish from the sidebar's family grouping (`ProductsSidebar.tsx:144-151`) even though the DB row is still valid.
- `Header.tsx`'s mega-menu slugs are derived by a naive `slugify()` of a hardcoded display string at click time (`Header.tsx:145-147`) — any divergence between that string and the real DB slug (punctuation, pluralization) produces a dead-end link with an empty result set, invisibly.
- `pdpSeedImages.ts`'s `categoryFallbacks` keys (`buttons, buckles, hardware, zippers, lace, labels, trims` — `pdpSeedImages.ts:67-75`) are matched against `product.primary_category?.slug` at runtime; a rename silently loses the image fallback for that category.
- `deriveModelType()` (`ProductQuickView.tsx:29-34`, `Model3DViewer.tsx:159`) does **substring** matching (`.includes('button')`, `.includes('zipper')`), so it is comparatively rename-resilient as long as the substring survives.

### 1f. Gap analysis — current taxonomy vs. target structure

Current DB-backed leaf categories, as grouped by `taxonomy.ts:13-25` (3 families, 17 leaves):

- **Hardware:** buttons, snap-buttons, jeans-buttons, shank-buttons, beads, buckles, cord-ends, cord-stoppers, eyelets, hook-eyes, rivets, zipper-pullers, toggles
- **Soft Trims:** drawcords, webbing
- **Branding Trims:** badges, patches

Target structure (5 families, 25 leaves — Apparel only): Soft Trims – Webbing & Tape (8), Laces & Ribbons (4), Metal & Hardware Accessories (4), Buttons (4), Zippers (5).

**Mapping assessment:**

| Current leaf | Target home | Notes |
|---|---|---|
| buttons, snap-buttons, jeans-buttons, shank-buttons | Buttons family (Polyester / Metal & Shank / Horn & Shell / Snap Fasteners & Jeans Buttons) | Needs a **material-based re-split** — current data has no field distinguishing polyester vs. horn/shell vs. metal buttons except the free-text `specifications.material` string (§2), so this split cannot be done mechanically without a data-cleanup pass. |
| buckles | Metal & Hardware Accessories → Buckles & Cord Locks | Direct-ish, but "Cord Locks" is a new sub-scope with no current data. |
| eyelets, rivets | Metal & Hardware Accessories → Eyelets & Rivets | Direct. |
| zipper-pullers | Zippers → Zipper Pullers & Sliders | **Family reassignment** — moves from "Hardware" to a brand-new "Zippers" family that otherwise has zero current products (no metal/nylon-coil/plastic-vislon/waterproof zipper category exists today at all). |
| webbing | Soft Trims – Webbing & Tape | Family name is reused but scope narrows to webbing/tape only and must be split across 8 new subcategories (Hook & Loop, Elastic Tape, Bias & Mattress Tape, PP/Cotton/Poly/TC Webbing, Bag/Case/Sofa Webbing, Camo & Reflective, Waistband & Labels, Jacquard Tape) — no data exists today to drive that split. |
| badges | Metal & Hardware Accessories → Metal Pendants & Custom Brand Badges | Only if the badge is metal — the new category is metal-specific; current `badges` has no material flag to test this. |
| **beads** | **No home** | No target category mentions beads. |
| **cord-ends** | **No home** | Not covered by "Buckles & Cord Locks" (which is about cord *locks*, a different hardware type). |
| **cord-stoppers** | **Ambiguous / likely no home** | Close to "Cord Locks" in function but not the same named part; needs a human decision. |
| **toggles** | **No home** | Not present anywhere in the 25 target subcategories. |
| **drawcords** | **No home** | "Soft Trims – Webbing & Tape" is webbing/tape-scoped; drawcord (a cord product, not tape) has no explicit target category. |
| **patches** | **No home** | The entire "Branding Trims" family is retired; only metal badges get a new home (Metal Pendants & Custom Brand Badges) — fabric/embroidered patches have no equivalent in the target list. |
| hook-eyes | **Name collision, not a real match** | Current `hook-eyes` = garment hook-and-eye closures. Target "Hook & Loop" = touch-fastener (hook-and-loop / Velcro-type) tape, an unrelated product line under the new "Soft Trims" family. These must not be auto-mapped by name similarity. |

**Entirely new, with zero current products:** the whole "Laces & Ribbons" family (4 subcategories — no lace/ribbon category exists in `taxonomy.ts` today, despite `Header.tsx`/`Footer.tsx`/`ProductCategories.tsx` already containing dead `#lace` links with no backing data, see §6c), and most of "Soft Trims – Webbing & Tape" and "Zippers" beyond the two items noted above.

**Net:** of 17 current leaf categories, roughly 7 have a plausible (but not mechanical) target home, 6 have no home at all, and 1 (`hook-eyes`) is a false-friend name match that must be handled deliberately. 18 of the 25 target subcategories currently have zero mapped products. This is a content/data-sourcing exercise on top of a schema restructure, not a pure rename.

---

## 2. Product specification storage

### 2a. Ground-truth schema

`src/integrations/supabase/types.ts:723,726` (repeated for Insert/Update at 743/746, 763/766): `products.production: Json | null`, `products.specifications: Json | null`. **No sub-schema is enforced at the DB type level** — both are opaque JSON blobs.

### 2b. Every key actually in use, by source

**Real DB seed data** (`supabase/migrations/20260422192314_9de125c2-55ff-4293-9b8a-bc81b135e1c9.sql:34-107`, a 24-product Polo Ralph Lauren private catalogue) — `specifications`: `diameter_mm, holes, material, finish, shank, type, width_mm, height_mm, technique, backing, length_mm, inner_mm, outer_mm`. `production`: `moq` (numeric), `lead_time_days` (numeric), `origin`.

**Frontend seed fallback** (`src/features/products/pdpSeedData.ts:9-27`) — `PdpSeedSpecs`: `material, finish, size, weight, thickness, attachment, color_options[], size_options[], tensileStrength`. `PdpSeedProduction`: `moq, sample_time, lead_time, origin, capacity` — all snake_case, but a **different key set** than the real DB seed above (e.g. `lead_time_days` vs `lead_time`).

**Legacy/quarantined type** (`src/features/products/legacyTypes.ts:25-45`, file header: *"QUARANTINED... workspace no longer consumes these types"*) — camelCase: `specifications: {material, size, color, finish, weight, thickness, tensileStrength}`, `production: {leadTime, sampleTime, origin, capacity}`. This is the origin of a third, incompatible naming convention.

**Admin editor** (`ProductEditor.tsx:119-120,436,441`) — writes **arbitrary free-text keys**, no fixed set (see §2d).

**Reader key expectations (with fallback chains):**
- `ProductDetail.tsx:396-409` — specs: `material`/`Material`, `finish`/`Finish`/`plating`, `size`/`Size`/`dimensions`, `weight`/`Weight`, `thickness`/`Thickness`, `attachment`/`construction`, `color_options`, `tensileStrength`; production: `moq`/`MOQ`/`minimum_order`, `sampleTime`/`sample_time`, `leadTime`/`lead_time`, `origin`/`Origin`, `capacity`/`Capacity`. The only consumer with a dual camelCase/snake_case fallback.
- `ProductQuickView.tsx:156,310-353` — reads production **only** as camelCase (`production.leadTime`, `.sampleTime`, `.origin`, `.capacity`), no snake_case fallback. Since real DB data uses `lead_time_days`/`origin` and seed data uses `sample_time`/`lead_time` (both snake_case), **the "Production Info" block in ProductQuickView cannot render for any real or seed-fallback product today** — it only matches the unused legacy camelCase shape. This is effectively dead/broken code.
- `ProductQuickView.tsx:155,362-368` — renders any remaining `string`/`number` spec key generically as a label:value row (label = key with `_`→space), excluding `color_options`/`size_options` — i.e. it round-trips whatever free text was typed into the editor, verbatim.
- `ProductQuickView.tsx:157,391-409` — `specs.color_options` array → "Available Colors" badge list.
- `LibraryItemCard.tsx:51-55` — only reads `specs.material`, `specs.size`, `specs.finish`.

**Dead/unreachable:** `src/components/product/ProductInfo.tsx` and `src/components/product/ProductDescription.tsx` contain fully hardcoded mock data (unrelated fake product) and are **not imported anywhere** (confirmed by grep). They do not read `specifications`/`production` and are not reachable from any route.

### 2c. `pdpSeedData.ts` fallback mechanics — exact precedence and reach

`ProductDetail.tsx:384`: `const seed = getPdpSeed(product.slug);` — looked up unconditionally, for every product rendered on the page.

```
387  const rawSpecs = product.specifications ?? {};
388  const rawProd = product.production ?? {};
389  const seedSpecs = seed?.specifications ?? {};
390  const seedProd = seed?.production ?? {};
```

Then per field, e.g. `ProductDetail.tsx:396`:
```
const materialNames = materials.length ? materials.map(...) : specValue(rawSpecs.material) ?? specValue(rawSpecs.Material) ?? seedSpecs.material ?? null;
```

**Precedence is per-field, not all-or-nothing:** live DB → alternate-cased/synonym DB key → seed → null. If a live row has `material` but not `finish`, the page shows real material and fabricated finish side by side with no visual distinction. The file's own header comment (`pdpSeedData.ts:1-6`) confirms this is intentional: *"Temporary frontend seed layer for PDP detail. Fills gaps when backend specifications/production data is incomplete... Precedence: real backend data → seed data → omit."*

**Every product slug covered (19 total):** `metal-button, resin-button, brand-button, engraved-button, pearl-button, jeans-button, sample-trim-collection, plastic-side-release-buckle, eco-lace-trim, jeans-button-antique, shank-button, shank-button-metal, snap-button, snap-button-ring, rivet-brass, rivet-copper, resin-fashion-button, metal-zipper-puller, nylon-cord-puller` (`pdpSeedData.ts:48-499`).

**Reaches production pages:** Yes, unconditionally — `ProductDetail.tsx` is a normal routed page (confirmed mounted at `/designer-studio/products/:slug`, `App.tsx:218`), with no `import.meta.env.DEV` or similar guard around `getPdpSeed()`. It runs on every render for every visitor for any product whose slug matches. A companion image seed (`pdpSeedImages.ts`) is used the same way, consumed at `LibraryItemCard.tsx:27` and `ProductDetail.tsx:25`.

**UNABLE TO DETERMINE:** whether a public (non-`/designer-studio`) route also renders `ProductDetail.tsx` — only the `/designer-studio/products/:slug` route was confirmed; a full route table pass was not exhaustive.

### 2d. Editing surface — can an editor type any key and any value?

`ProductEditor.tsx:23-85`, `KeyValueEditor`:
```
<Input placeholder="Key" value={key} onChange={(e) => updateKey(key, e.target.value)} .../>
<Input placeholder="Value" value={value} onChange={(e) => updateValue(key, e.target.value)} .../>
<Button ... onClick={addRow}><Plus .../> Add field</Button>
```
`addRow` (`ProductEditor.tsx:46-48`) does `onChange({ ...data, "": "" })` — a blank key is permitted before typing one. **Confirmed: genuinely unconstrained.** Any string key, any string value, no enum, no required fields, no duplicate-key guard beyond JS object semantics, used identically for both "Specifications" and "Production Info" (`ProductEditor.tsx:436,441`). Given that at least three incompatible naming conventions already exist in real data (§2b), this editor actively enables a fourth.

---

## 3. Colour and finish handling today

### 3a. `color_options` — exact format, every read/write site

Note: `ProductQuickView.tsx` is not at `src/pages/` — it's `src/components/designer-studio/ProductQuickView.tsx`.

Read at `ProductQuickView.tsx:157`:
```
const colorOptions = Array.isArray(specs.color_options) ? (specs.color_options as string[]) : [];
```
Format: **a plain array of freeform strings** (e.g. `['Polished Nickel', 'Antique Brass']`) — no structured object, no hex, no code. Rendered `ProductQuickView.tsx:391-409` as a wrapped list of text `<Badge>` chips, one per string — no swatch, no color dot, no hex preview.

`ProductDetail.tsx:402`:
```
const colorOptions = specValue(rawSpecs.color_options) ?? (seedSpecs.color_options ? seedSpecs.color_options.join(', ') : null);
```
`specValue()` (`ProductDetail.tsx:30-34`) joins arrays with `', '` into a single string. On the PDP, `color_options` is **flattened into one comma-joined generic spec-table row** (label "color options", table at `ProductDetail.tsx:686-707`) — it does **not** get its own "Available Colors" swatch section the way ProductQuickView gives it one. The two surfaces render the same underlying data completely differently.

**All occurrences of `color_options`/`colorOptions`:**
- `pdpSeedData.ts:16` (type def) and lines `57,84,108,133,157,181,222,246,271,296,320,345,370,442,465,489` (hardcoded per-product freeform arrays)
- `ProductQuickView.tsx:157,364,391-409`
- `ProductDetail.tsx:402,434`

No other file reads or writes `color_options`.

### 3b. Existing lookup table? None.

No Supabase table, TS constant, or JSON file in the product-catalogue path is a structured colour/finish/material lookup (code/name/hex/image).

- `products.specifications` (`types.ts:726`) stores colours only inside the freeform JSON blob — no FK to any colour table, no hex, no code.
- `product_materials` (`types.ts:638-658`): only `{id, name, slug, is_sustainable}` — no colour/hex/finish fields.
- `product_tags` (`types.ts:689-709`) has a `color: string | null` field (line 691), but this is a **UI badge tint** (e.g. hex for a chip colour), unrelated to product finish/colour swatches.
- Full `types.ts` table list checked (brands, brand_memberships, customization_requests, design_exports/layers/sessions, editor_sessions, flipbook_*, product_categories, product_category_map, product_certifications(_map), product_images, product_industries(_map), product_material_map, product_materials, product_tags(_map), products, user_library_items) — none is a colour/finish/surface taxonomy.
- The one place with structured hex-coded colour data is `src/components/production/ObjGallery.tsx:25-101` — `COLOURS: HardwareColour[]` (`{id, label, hex, materialHex}`), plus `FINISHES`, `DTM_FINISHES`, `PLATINGS` arrays with PBR material params (metalness/roughness/clearcoat). This is a **standalone 3D-viewer demo component**, not exported or imported anywhere else (verified — no other file imports from it), and not wired to the product catalogue. No `CYC-####` style code scheme anywhere.

### 3c. `materialSurfaces.ts` — what it is, and fitness for a 135-record taxonomy

Full file (32 lines): `materialKeywordMap: [string[], string][]` — 4 tuples mapping material-name keyword lists to one of 4 bundled stock JPGs (brass/bronze/copper/gold/antique → `brassSurface.jpg`; metal/steel/zinc/alloy/iron/nickel/chrome/aluminum → `metalSurface.jpg`; resin/plastic/nylon/polyester/acrylic/abs → `resinSurface.jpg`; cotton/fabric/woven/lace/thread/textile/linen → `cottonSurface.jpg`). Exported `getMaterialSurfaceImage(materialName?: string | null): string` (lines 22-31) does substring keyword matching and returns one of the 4 static images, defaulting to `metalSurface`.

**Only importer:** `ProductDetail.tsx:26`, used once at `ProductDetail.tsx:655` for the "Materials" card image (see §4c).

**Could it be extended to hold 135 CYC-coded records? No — structurally unsuited:**
1. It's keyed by **substring keyword match on a material name**, not by an `id`/`code` — there is no lookup key for a `CYC-0001` scheme to attach to.
2. It returns a single `string` (image URL), not a record — no room for name/hex/finish/i18n fields without a full rewrite of the return type and every call site.
3. 4 hardcoded entries mapping to 4 Vite-bundled static image imports vs. 135 needed — the current asset-import pattern (`import x from '@/assets/...'`) doesn't scale to 135 files; a DB- or storage-backed approach would be required regardless.
4. It solves a different problem ("which generic stock texture photo for a material family") than a colour/finish taxonomy ("which exact coded colour/finish does this product use, with a name and a swatch"). It should be treated as **orthogonal**, not a starting point.

---

## 4. Product detail page

### 4a. Section-by-section map

`src/pages/ProductDetail.tsx` (832 lines), component at line 270.

| Section | Location | Source |
|---|---|---|
| Hero gallery | `487-491` (component `50-133`) | `galleryImages` memo (`281-321`): DB `product.images` → `getPdpSeedImages()` → `getFallbackImage()`. |
| Breadcrumb | `478` | `breadcrumbSegments` (`457-462`) — DB (`primaryCat.name`) + hardcoded `'Home'` label. |
| Identity block | `497-529` | DB: `primaryCat`, `item_code`, `name_en ?? name`, `tags`; `isCustomizable = product.is_customizable || seed?.is_customizable` (`424`). |
| Brief description (hero) | `532-536` | `description = product.description_en ?? product.description ?? seed?.description` (`423`) — DB→seed. |
| Compact key-spec tiles (hero) | `539-546` | `materialNames/finish/size/attachment/moq/leadTime`, computed `396-409` from DB `specifications`/`production` with fallback chains, then seed. |
| Compliance badges (hero) | `549-563` | `certs` = DB certs + seed certs not already present (`411-415`). |
| CTAs | `565-609` | Hardcoded labels/JSX; gated on DB fields (`slug`, `model_url`, `item_code`). |
| Section nav bar | `617` | Hardcoded labels; tab presence conditioned on computed DB/seed data. |
| Overview — description | `629-633` | Same `description` var as hero (**duplicate**, see §4b). |
| Overview — key-value tiles | `634-648` | Same `materialNames/finish/size/weight/moq/leadTime` vars as hero (**duplicate**). |
| Overview — "Materials" image card | `650-681` | See §4c. |
| Technical Specifications table | `686-707` | `mergedSpecObj` (`427-440`): computed vars + spillover loop over remaining `rawSpecs` keys. |
| Production & Ordering table | `710-730` | `mergedProdObj` (`442-452`), same pattern. |
| "Customization Available" card | `731-745` | Hardcoded copy (`736-737`), visibility gated on `isCustomizable`. |
| Compliance & Certifications section | `751-770` | Same `certs` array as hero (**duplicate**), rendered as cards with `logo_url` or a generic icon fallback. |
| Applications & End Uses | `773-789` | `industries` = DB + seed dedupe (`417-421`). |
| Downloads & Resources | `792-813` | Gated on `hasDownloads = !!product.model_url` (`464`). "Spec Sheet" button (`796-800`) is **entirely hardcoded, no href/onClick — dead UI, not wired to any file**. "3D Model" button (`801-810`) is real. |
| Related Trims | `817` (component `209-244`) | DB, via `useProducts({ categories: [categorySlug] })`. |
| 3D Model dialog | `818-828` | DB `model_url` via `Model3DViewer`. |

### 4b. Fields rendered twice (or more)

- **Description**: hero truncated (`532-536`) + Overview full (`629-633`) — same variable, two blocks.
- **Material**: hero tile (`540`) + Overview tile (`636`) + spec table row via `mergedSpecObj['material']` (`428`) — up to 3 renderings.
- **Finish**: hero (`541`) + Overview (`637`) + spec table (`429`) — 3.
- **Size**: hero (`542`) + Overview (`638`) + spec table (`430`) — 3.
- **MOQ**: hero (`544`) + Overview (`640`) + Production table (`443`) — 3.
- **Lead Time**: hero (`545`) + Overview (`641`) + Production table (`444`) — 3.
- **Weight**: Overview (`639`) + spec table (`431`) — 2.
- **Attachment**: hero (`543`) + spec table (`433`) — 2.
- **Certifications**: hero inline badges (`549-563`) + full Compliance section cards (`751-770`) — same `certs` array, two visual formats.

This is structural: the same source variables feed the hero tiles, the Overview tiles, and the full spec/production tables independently, with no "shown once" guard between them.

### 4c. "Materials" image card

`ProductDetail.tsx:650-681`, gated on `materials.length > 0 || materialNames` (line 650). Image at `653-660`:
```
655  src={getMaterialSurfaceImage(materialNames)}
656  alt="Material surface"
```
`materialNames` (`394-396`) resolves from real material data or spec fallback, then is passed into `materialSurfaces.ts`'s keyword matcher, which returns **one of 4 fixed generic stock photos** — never a DB image, never a per-product image, regardless of the actual product. The text content below the image (`664-679`) *is* data-driven (real `product.materials` names), but the accompanying photo is always a generic material-family stock image.

### 4d. Image resolution — two divergent fallback chains

**A. `src/features/products/utils/resolveProductImage.ts`** — used by `ProductCard.tsx` (grid/list) and `DesignerStudio.tsx` (Featured Trims). Order (`15-27`): `product.images` primary/first → `product.thumbnail_url` → `getPdpSeedImages()[0]` → `getProductPlaceholderUrl()` (generated SVG data-URI).

**B. `ProductDetail.tsx`** — does **not** call `resolveProductImage()`. Its own inline logic (`281-321`):
```
284  const dbImages = [...(product.images ?? [])].sort((a,b) => a.sort_order - b.sort_order);
285  if (dbImages.length > 0) { return dbImages; }
290  const seeded = getPdpSeedImages(product.slug, product.primary_category?.slug);
292  if (seeded && seeded.length > 0) { return seeded.map(...); }
302  // "3. Absolute last resort — use category images, never SVG placeholder"
303  const fallbackSeeded = getPdpSeedImages(product.slug, product.primary_category?.slug); // identical to step 2 — dead/no-op tier
304  if (fallbackSeeded && fallbackSeeded.length > 0) { return fallbackSeeded.map(...); }
314  return [{ url: getFallbackImage(), ... }];  // static 'other-category.jpg', not the SVG placeholder
```
Order: DB images (all, sorted) → seed images → (duplicate no-op call) → static `other-category.jpg`. **`product.thumbnail_url` is never consulted here**, and the generated SVG placeholder (`getProductPlaceholderUrl()`) is **never used on the PDP at all** — a code comment at line 302 confirms this is deliberate ("never SVG placeholder"). This means ProductCard and ProductDetail genuinely diverge in their last-resort fallback and in whether `thumbnail_url` is honoured.

**`pdpSeedImages.ts`**: `getPdpSeedImages(slug, categorySlug)` (`77-100`) — direct slug lookup → partial slug substring match → category-slug fallback map → keyword substring match → universal fallback `[otherCategory, metalButton]`. `getFallbackImage()` (`62-64`) returns the bundled `other-category.jpg`.

**`productImagePlaceholder.ts`**: `getProductPlaceholderUrl()` (`139-177`) generates a **procedural SVG** (category-themed pattern + symbol + product name/code footer) via keyword-matched category theming (`getCategoryTheme`, `38-74`) and a hash-based per-product variation (`getProductVariation`, `76-88`). Used only in the ProductCard chain, bypassed on the PDP.

**`src/lib/productImage.ts`** is unrelated to *which* image is chosen — `getProductImageUrl(rawUrl, size)` rewrites an already-resolved URL to a Supabase Storage image-transform URL for a given size bucket, used in `ProductDetail.tsx:78,101,121`, `DesignerStudio.tsx:162`, `LibraryItemCard.tsx:63`.

---

## 5. What CMS already exists

### 5a. `src/components/designer-studio/products/` — the admin CMS

| File | Purpose |
|---|---|
| `ProductsPanel.tsx` | Tab shell: Catalog / Categories & Tags / Import (`17-44`) |
| `ProductCatalogTab.tsx` | List/search/filter, bulk status change, `is_public` toggle, archive, "New Product", AI image-generation button (edge function `generate-product-images`, `472-483`) |
| `ProductEditor.tsx` | Full product form: identity, status/public/customizable, free-text specifications/production key-value editor, taxonomy checkboxes, image upload/delete/primary, thumbnail, 3D model URL. Saves via `.insert`/`.update` (`211-241`) + junction sync (`643-683`) |
| `TaxonomyTab.tsx` | Generic inline-editable CRUD table (`37-245`) reused for categories, tags, materials, industries, certifications — direct `.insert`/`.update`/`.delete` with `tableName as any` (`74,87,101`) |
| `ImportTab.tsx` | CSV bulk-import: template download, Papaparse, validates `name` + `status` enum, batches 50, resolves category/material/tag/industry **slugs** to IDs (`107-192`) |

Confirmed as the CMS: mounted as the Products tab inside `DesignerStudioWorkspace.tsx:49-51,604-618`.

### 5b. Access control

Route `/designer-studio/workspace` (`App.tsx:220-221`) wrapped in `<RequireBrandAuth>`. The Products tab has **no separate route or additional guard** (`DesignerStudioWorkspace.tsx:603-618`).

`RequireBrandAuth` (`src/features/auth/RequireBrandAuth.tsx:12-71`) checks only: (a) a session exists, (b) the user has ≥1 `brand_memberships` row. **It never checks `role`** (`member`/`manager`/`owner`, `AuthProvider.tsx:9`) — role is fetched but not consulted here. **Any authenticated user at any role can open the full Products CMS.**

**RLS is even more permissive than the UI implies.** `products`: `CREATE POLICY "Authenticated manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);` (`supabase/migrations/20260316105731_9ce1cbd3-4158-4087-9633-29138a5403c4.sql:126-127`). Never dropped or tightened — a later migration (`20260422182607_...sql`, lines 54-66) only tightens **SELECT** for brand-scoping, leaving the blanket write policy intact. The same `FOR ALL USING(true) WITH CHECK(true)` pattern covers `product_categories`, `product_materials`, `product_industries`, `product_certifications`, `product_tags`, `product_images`, and all five `*_map` junction tables (`...105731...sql:51-52,61-62,71-72,81-82,91-92,149-150,158-159,167-168,176-177,185-186,202-203`), and the `product-assets` storage bucket permits `INSERT/UPDATE/DELETE` for any authenticated user with no ownership check (`...105731...sql:278-285`).

**Net effect: any authenticated user — any brand, any role — can create, edit, or delete any product or category, including other brands' private catalogues (e.g. the Polo Ralph Lauren seed rows), via direct Supabase client calls, independent of the UI.** The codebase demonstrably knows how to do proper role gating elsewhere: `supabase/migrations/20260615120000_workspace_role_and_team_hardening.sql:22-37,53-70,83-88,100-105` adds a `user_is_brand_manager_or_owner()` helper and restricts flipbook brochure mutation to manager/owner — explicitly noted (line 17-18) as *not* touching products/taxonomy, i.e. this gap is a known, deliberate scope exclusion from a prior hardening pass, not an oversight discovered here.

**UNABLE TO DETERMINE:** server-side enforcement inside `supabase/functions/` (edge functions) was not exhaustively reviewed.

### 5c. Editable via UI vs. SQL-only today

**UI-editable:** products (all core fields, specs/production as free text, images, thumbnail, model URL, status/public/customizable, taxonomy assignment); categories/tags/materials/industries/certifications (name/slug/sort_order/flags); bulk CSV product import.

**SQL-only (no UI found):** a product's `brand_id` (not in `ProductEditor.tsx`'s save payload, `211-224`); `sort_order` on products (read-only in the UI); hard delete of a product (Catalog tab only offers Archive — a status change, `ProductCatalogTab.tsx:188-206,412-420`); `brand_memberships` (no UI found in this pass — seeded only via migration SQL, e.g. `supabase/migrations/20260422192314_...sql:17-28`); the `brands` table itself.

### 5d. Blockers for a non-technical WIN-CYC staff member

1. Free-text specs/production with no schema (`ProductEditor.tsx:23-85`) — staff must know and consistently type exact key names; three incompatible conventions already exist in real data with nothing preventing a fourth.
2. Slug is a freely-editable text input (`ProductEditor.tsx:381-384`, auto-generated from name on creation at `138-142` but editable thereafter) with no uniqueness/format validation surfaced in the UI — DB `UNIQUE` violations would surface as a raw Supabase error toast (`254-255`).
3. CSV import requires knowing exact internal taxonomy **slugs** (`ImportTab.tsx:156-182`) — a typo silently fails to attach the relationship with no error surfaced (only `name`/`status` are validated, `78-82`).
4. No image validation (size/dimensions/aspect ratio) on upload (`ProductEditor.tsx:262-315`).
5. Delete confirmation on categories/tags/materials is generic (*"This may affect products linked to this item. Continue?"*, `TaxonomyTab.tsx:230-233`) — doesn't say which or how many products are affected.
6. No true product delete — only Archive; full removal needs direct DB access.
7. `sort_order` for catalogue display ordering is not editable in `ProductEditor.tsx` at all.
8. Any authenticated user of any role can edit/delete any product (§5b) — no permission ceiling comparable to the flipbook feature's role gate exists for the catalogue.

---

## 6. Data migration risk

### 6a. Product count and category mapping mechanism

**Product count: UNABLE TO DETERMINE** — no live DB access, and `supabase/migrations/*.sql` contains **no `INSERT INTO products` seed statements** except the one 24-row Polo Ralph Lauren private-brand batch already cited (§2b). No other seed SQL/CSV/JSON with a countable product roster exists in the repo. `pdpSeedData.ts`/`pdpSeedImages.ts` are frontend supplemental content keyed by slug (19 entries), not a product roster.

**Mapping mechanism:** via join table `product_category_map` (`product_id, category_id, is_primary`) — **not** a FK column on `products` (confirmed: `products` schema, `types.ts:710-780`, has no `category_id`). `useProducts.ts:303-327` fetches via nested join; `transformProduct()` (`59-147`) picks `primary_category` from the `is_primary === true` row (77-84), falling back to the first joined category. Products can belong to multiple categories (M2M) with at most one flagged primary. `taxonomy.ts` plays no role in this join — it only groups already-resolved category slugs into families/segments afterward.

### 6b. What needs remapping if category slugs change

- **`product_category_map`**: no direct impact from a slug rename (it FKs by `category_id`, not slug) — but any code that resolves a slug string to that ID (§1c) must use the new slug post-rename.
- **`user_library_items`** (`types.ts:781-839`): no category/slug column — references products only by `product_id` FK, so it inherits whatever category the product currently has. No direct coupling.
- **`design_sessions`** (`types.ts:236-277`): session metadata only (`name, status, team_id, background/thumbnail`) — no category/slug reference at all. Checked consumers (`useDesignSessions.ts`, `useDesignSession.ts`, `ComposerSessionList.tsx`, `ComposerPage.tsx`) show no coupling.
- **`flipbook_hotlinks`** (`types.ts:338-378`): has a free-text `url` field entered manually via `HotlinkEditorModal.tsx` (placeholder `"https://…"`, line 81), rendered as a plain `<a href={hl.url}>` (`PageHotlinks.tsx:46`, `HotlinkOverlay.tsx:28`). An admin *could* have typed an internal link like `/products?category=buttons` into a hotlink; this would silently break on a rename. **UNABLE TO DETERMINE** what hotlink URLs actually exist in the live DB — this is admin-entered content, not something greppable in `src/`.
- **Saved/bookmarked URLs**: since category is a query param (not a path), any externally bookmarked `/products?category=old-slug` link degrades to an empty/unfiltered result silently — no redirect layer exists.

### 6c. Every hardcoded category/segment slug string outside `taxonomy.ts`

Current real slugs (from `taxonomy.ts`): families `hardware, soft-trims, branding-trims`; segments `apparel, beauty, material`; leaves `buttons, snap-buttons, jeans-buttons, shank-buttons, beads, buckles, cord-ends, cord-stoppers, eyelets, hook-eyes, rivets, zipper-pullers, toggles, drawcords, webbing, badges, patches`.

| File:line | Hit | Note |
|---|---|---|
| `src/components/home/HeroSection.tsx:18,28,38,48` | `category=buttons`, `category=hardware`, `category=webbing`, `category=zipper-pullers` | `hardware` used as a leaf-category value here, but it's a *family* slug in `taxonomy.ts` — already inconsistent. |
| `src/components/layout/Header.tsx:52-68,107-143` | Full independent duplicate taxonomy (`MEGA_FAMILIES`, `MEGA_GRID_ITEMS`) | Second source of truth, not imported from `taxonomy.ts`. |
| `src/components/header/Navigation.tsx:108,116-121` | `segment=apparel`, plus its own submenu (`Buttons, Zippers, Lace, Hardware, Other Products`) | **This file is dead/unused** — no importer found anywhere in `src/`. Uses categories (`zippers`, `lace`, `other`) that don't exist in current `taxonomy.ts`. Lower priority but should be deleted rather than migrated. |
| `src/pages/ProductDetail.tsx:227,501` | `category=${categorySlug}` / `category=${primaryCat.slug}` | Dynamic (DB-driven) — safe, not a hardcode risk. |
| `src/pages/ProductDetail.tsx:780` | `segment=${ind.slug}` | **Pre-existing bug**: `ind` is a `product_industries` slug ("Applications & End Uses"), written into the `segment` param, which `useProducts.ts`'s `SEGMENT_TO_FAMILIES` only recognizes for `fashion/apparel/beauty` — industry slugs never match, so this filter is already silently inert. |
| `src/features/products/hooks/useProducts.ts:12-16` | `SEGMENT_TO_FAMILIES = { fashion: ['hardware'], apparel: ['soft-trims'], beauty: ['branding-trims'] }` | **Third, inconsistent hardcoded mapping** — `fashion` isn't a `PRODUCT_SEGMENTS` slug (dead branch), and `material` (a real segment slug) has no entry here at all, so selecting "Material" in the sidebar silently adds no category filter. Comment at line 8-10 calls this "Temporary." |
| `src/components/home/ProductCategories.tsx:17-23,42` | `/products#buttons`, `#hardware`, `#zippers`, `#lace`, `#other` | **Already broken**: hash fragments, not query params — `Products.tsx` only reads `useSearchParams`, never `location.hash`, so these links land on an unfiltered `/products`. Also references slugs (`zippers`, `lace`, `other`) that don't exist today. |
| `src/components/layout/Footer.tsx:56-60` | Same hash-fragment pattern, same stale slugs | Same bug as above. |
| `src/features/products/pdpSeedImages.ts:67-75` | `categoryFallbacks` keys: `buttons, buckles, hardware, zippers, lace, labels, trims` | Matched against `product.primary_category?.slug` at runtime; several of these keys have no corresponding category in current `taxonomy.ts` — **UNABLE TO DETERMINE** whether the live DB still has rows with those slugs. |
| `src/features/products/legacyTypes.ts:23,59-65` | Category union type + label map | File explicitly marked **"QUARANTINED"**; only remaining importer (`QuickRFQDialog.tsx`) is itself quarantined per its own header. Effectively dead but not deleted. |
| `src/components/designer-studio/RFQDetail.tsx:178` | `rfq.category === 'Hardware' ? 'hardware' : ...` | Free-text RFQ category field mapped to a 3D-preview model-type bucket; unrelated to `taxonomy.ts`, low risk. |
| `src/features/i18n/translations.ts:33,414,729` | `header.family.hardware` key | i18n label keyed to a family slug name; would need a corresponding key rename alongside any family rename. |

**Already-broken items independent of any future rename**, noted because a restructure effort might otherwise assume they currently work: `ProductDetail.tsx:780` (`segment=` misuse), `useProducts.ts:12-16` (`SEGMENT_TO_FAMILIES` doesn't cover `material` and includes a dead `fashion` key), `ProductCategories.tsx`/`Footer.tsx` (hash-fragment links that never filter anything).

---

## 7. i18n

`src/features/i18n/` has exactly 2 files: `I18nProvider.tsx` (78 lines — context provider, `AppLanguage = "en" | "zh-Hant" | "zh-Hans"`, persists to `localStorage` key `wincyc.language`, `t(key)` falls back `translations[lang][key]` → `translations.en[key]` → raw key) and `translations.ts` (a large flat `Record<AppLanguage, Record<string,string>>` of UI-chrome strings only — nav labels, buttons, headings, FAQ copy).

**Is the catalogue bilingual today? No — only UI chrome is.**
- `products` table has `name`/`name_en` and `description`/`description_en` (`types.ts`) — exactly **one** English-override pair, no `name_zh_hant`/`name_zh_hans` columns, and no per-language column for `specifications`/`production` (still a single freeform `Json` column each).
- `product_categories` (`types.ts:408-433`) has only a single `name: string` field — categories are monolingual in the DB.
- `product_materials`, `product_certifications`, `product_tags` likewise have only one `name` field each.
- `taxonomy.ts`'s `PRODUCT_FAMILIES`/`PRODUCT_SEGMENTS`/`PRODUCT_SEGMENT_DETAILS` hold single hardcoded English strings (e.g. `taxonomy.ts:16,39-41,55-56`) — not wired into `I18nProvider`/`translations.ts` at all.
- `color_options` seed/spec strings are plain English (`'Polished Nickel'`) with no translated counterpart anywhere.

**Does the current pattern support adding Traditional Chinese names for categories/finishes?** Not without extension. `translations.ts` is a **static, developer-authored dictionary keyed by compile-time string keys** — it has no established convention for looking up a translation by a DB row's id/slug dynamically (nothing like `t('category.' + category.slug)` wired to live category data today). The schema itself only has the single `name`/`name_en` bilingual-pair precedent on `products`, and no equivalent on `product_categories` or any other taxonomy table. Adding Traditional Chinese names for the new categories and the 135-record colour/finish taxonomy would require **either** new DB columns (e.g. `name_zh_hant` alongside the existing `name`/`name_en` precedent) **or** a separate translation-rows table — a data/schema decision, not something the current dictionary pattern already covers.

---

## 8. Blockers

Ranked by what stands in the way of starting the three work items. Each is tagged **[code]** (determinable/fixable from the codebase alone) or **[decision]** (needs a human/business call before code can proceed).

1. **[decision] Which category-grouping layer becomes canonical.** Three independent, disagreeing hardcoded copies exist today (`taxonomy.ts`, `Header.tsx`'s `MEGA_FAMILIES`, `useProducts.ts`'s `SEGMENT_TO_FAMILIES`), and none of the three has a DB-backed family/segment concept — only leaf categories are in the DB. Before restructuring to 5 families/25 subcategories, someone must decide whether families/segments become a real DB table (recommended given the CMS gap in §5) or remain a hardcoded config, and all three copies must be reconciled or replaced by a single source. **[code]** confirms the current fragmentation precisely (§1).

2. **[decision] Source data for the 6 orphaned current categories** (beads, cord-ends, cord-stoppers, toggles, drawcords, patches) and for the `hook-eyes` name collision (§1f) — do these products get discontinued, folded into an adjacent new category, or does the target structure need an "Other" catch-all? This cannot be resolved from the code; it requires WIN-CYC's own product-line decision.

3. **[decision] How to split existing button/webbing products across the new finer-grained subcategories** (e.g. "buttons" → Polyester / Metal & Shank / Horn & Shell / Snap & Jeans; "webbing" → 8 new subcategories). No material/composition field currently distinguishes these cleanly except the free-text `specifications.material` string (§2b), which has no controlled values today.

4. **[code] Fix the free-text specifications/production editor before or as part of introducing controlled option lists.** `ProductEditor.tsx`'s `KeyValueEditor` (§2d) is the single biggest reason spec data is inconsistent today (three incompatible key-naming conventions already coexist, one of which silently breaks `ProductQuickView`'s Production Info block). This is a pure engineering task once the controlled key/value schema is decided.

5. **[decision] What the controlled option-list schema actually is** — which spec fields become enums vs. remain free text, and what the canonical key names are (resolving the snake_case-vs-camelCase, `lead_time` vs `lead_time_days` split documented in §2b). This is the actual design decision behind item (a) of the requested restructure and isn't inferable from the current inconsistent code.

6. **[decision] Where the 135-record CYC-0001–CYC-0135 colour/finish taxonomy lives.** No existing table or file is fit for purpose (§3) — `materialSurfaces.ts` solves an unrelated problem and `ObjGallery.tsx`'s colour arrays are an unconnected 3D-demo preset list. A new Supabase table (with hex, name, English/Chinese labels, and possibly a swatch/image asset) is very likely required; this needs sign-off before schema work starts, but the "current state has nothing to build on" fact is code-confirmed.

7. **[code] Access control on the products/taxonomy CMS.** RLS is `FOR ALL USING(true) WITH CHECK(true)` on `products` and every taxonomy table (§5b) — any authenticated user of any role can currently alter or delete any product, including another brand's private catalogue. This should be hardened (the codebase already has a working pattern to copy from the flipbook-role migration) before opening the catalogue to broader internal editing as part of this restructure, independent of the taxonomy/spec work itself.

8. **[decision] Whether `pdpSeedData.ts`/`pdpSeedImages.ts` fabricated content is acceptable to keep live in production** once real, structured specification and colour data exists (§2c, §4d) — today it silently fills gaps for 19 specific product slugs with no visual "placeholder" indication, which will conflict with the accuracy goals of the (a) and (c) restructure work if left in place unchanged.

9. **[code] Reconcile or delete the already-broken/dead references** found during this audit that are unrelated to any future rename but will otherwise be mistaken for "working today": `ProductDetail.tsx:780`'s `segment=` misuse of an industry slug, `useProducts.ts:12-16`'s incomplete `SEGMENT_TO_FAMILIES` map, the hash-fragment links in `ProductCategories.tsx`/`Footer.tsx` that filter nothing, and the dead `src/components/header/Navigation.tsx` file. None of these require a decision — they can be cleaned up or left as tracked pre-existing debt.

10. **[decision] Product count and true current category distribution are unknown from the repo** (§6a — no DB access, no seed data checked in beyond one 24-row private-brand batch). A live DB export/count is needed before migration effort can be sized; this is an operational step, not a code question.

---

*This report is a static-analysis audit of the repository as of 2026-09-02. Several findings are explicitly marked UNABLE TO DETERMINE where they require live database access (row counts, current category distribution, actual `flipbook_hotlinks` URL content, edge-function server-side logic) that was out of scope for a code-only audit.*
