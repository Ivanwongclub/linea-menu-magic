# P11 — Workspace UX & UI Audit (read-only)

**Date:** 2026-06-12
**Status:** AUDIT ONLY — no source edits in this phase
**Scope read:** `DesignerStudioDashboard.tsx`, `LibraryItemCard.tsx`, `LibraryTable.tsx`, `LibraryItemDetail.tsx`, `ProductQuickView.tsx`, `SearchProductDialog.tsx`, `RFQList.tsx`, `RFQDetail.tsx`, `CreateRFQDialog.tsx`, `QuickRFQDialog.tsx`, `WorkflowTimeline.tsx`, `BrochuresPanel.tsx`, `ProductsPanel.tsx`, `ComposerSessionList.tsx`, `ComposerPage.tsx`, `PresentationPage.tsx`, plus referencing files (`Header.tsx`, `App.tsx`, `DesignerStudio.tsx`, `DesignerStudioTrimLibrary.tsx`, `DesignerStudioLogin.tsx`, `translations.ts`).

---

## 1. Information architecture map

### 1.1 Routes and views

| Route | File | Notes |
|---|---|---|
| `/designer-studio/dashboard?tab=…` | `DesignerStudioDashboard.tsx` | Main workspace shell. `tab` param: `library | rfq | brochures | products | composer`. Default = `library` (`DesignerStudioDashboard.tsx:107-122`). Wrapped in `RequireBrandAuth` (`App.tsx:213-215`). |
| `/designer-studio/compose/:sessionId` | `features/designer/pages/ComposerPage.tsx` | Full-screen editor for a single composition. Has its own toolbar + canvas + LayerPanel + ProductPickerSheet. `RequireBrandAuth` (`App.tsx:217-219`). |
| `/designer-studio/present/:sessionId` | `features/designer/pages/PresentationPage.tsx` | Public/read-only share view. `RequireBrandAuth` (`App.tsx:221-223`). |
| `/designer-studio/products/:slug` | `ProductDetail` reused | Brand-private PDP shown for items linked from the workspace. |

### 1.2 In-page sections rendered by `DesignerStudioDashboard.tsx`

The shell renders ONE of the following based on `activeMainTab`:

| Tab | Section | Renders | Evidence |
|---|---|---|---|
| `composer` | "Default home" — page title, Visual Composer grid, 3 secondary cards | `ComposerSessionList` (sessions grid + dropdown menus) + 3 hand-rolled cards | `DesignerStudioDashboard.tsx:439-499` |
| `library` | Component Library — toggle (Brand Catalogue / Saved Library), filters, grid/list switcher | `LibraryItemCard` × N or `LibraryTable` | `DesignerStudioDashboard.tsx:502-689` |
| `rfq` | Requests & Quotes — stat strip + status tabs + table | `RFQList` | `DesignerStudioDashboard.tsx:732-772` |
| `brochures` | E-Catalogue — search, status tabs, table | `BrochuresPanel` | `DesignerStudioDashboard.tsx:774-776` |
| `products` | Products CMS — sub-tabs Catalog / Categories & Tags / Import | `ProductsPanel` → `ProductCatalogTab | TaxonomyTab | ImportTab` | `DesignerStudioDashboard.tsx:778-780` |

Detail views are handled as **inline early returns** that replace the entire shell, leaving the user without the auto-hiding header (`DesignerStudioDashboard.tsx:372-407`):

- `editingProductId !== null` → `ProductEditor` full-page
- `editingBrochureId !== null` → `BrochureEditor` full-page
- `selectedLibraryItem` → `LibraryItemDetail` full-page (uses legacy `LibraryItem` type)
- `selectedRFQ` → `RFQDetail` full-page

Modals/dialogs over the shell:
- `ProductQuickView` — opened from `LibraryItemCard.onView` (`Dashboard.tsx:301-304`)
- `CreateRFQDialog` — only mounted from `setIsCreateDialogOpen`; **never actually opened** by any UI (orphaned, see W6)
- `SearchProductDialog` — opened from the "Add Component" button (`Dashboard.tsx:521-524`)
- `QuickRFQDialog` — opened from `ProductQuickView`'s "Request Quote" button (`ProductQuickView.tsx:566-572` → `QuickRFQDialog.tsx:31`); toast-only handler.

### 1.3 Entry points INTO the workspace

| Source (file:line) | Lands on |
|---|---|
| `Header.tsx:211` desktop studio CTA `studioCtaHref` (P1) | `/designer-studio/dashboard?tab=library` |
| `Header.tsx:230` desktop generic nav `resolveNavHref` (P1) | `/designer-studio/dashboard?tab=library` (when authed) |
| `Header.tsx:451` desktop dropdown "My Workspace" (P6) | `/designer-studio/dashboard?tab=library` |
| `Header.tsx:800` mobile drawer studio CTA (P1) | `/designer-studio/dashboard?tab=library` |
| `DesignerStudioLogin.tsx:46` post-login default `next` (P3) | `/designer-studio/dashboard?tab=library` |
| `DesignerStudioTrimLibrary.tsx:70` "My Workspace" link in header (P2) | `/designer-studio/dashboard?tab=library` |
| `DesignerStudio.tsx:47` `workspaceHref` for cap6 tile (P5b/P6) | `/designer-studio/dashboard?tab=library` |
| `ComposerPage.tsx:308` toolbar back button | `/designer-studio/dashboard` |
| `ComposerPage.tsx:383` empty-canvas "Go to Library" CTA | `/designer-studio/dashboard?tab=library` |
| `Header.tsx:166` preload loader registry | preload trigger only |
| `App.tsx:213` route registration | the route itself |

**Total entry points: 10 references across 7 files.**

### 1.4 Exit points OUT of the workspace (when in detail views)

- `ProductEditor.onBack` → `setEditingProductId(null)` (returns to `products` tab)
- `BrochureEditor.onBack` → `setEditingBrochureId(null)` (returns to `brochures` tab)
- `LibraryItemDetail.onBack` → `setSelectedLibraryItem(null)` (returns to `library` tab — but reflows to `composer` because of the empty "Back" button text label, see W12)
- `RFQDetail.onBack` → `setSelectedRFQ(null)` (returns to `rfq` tab)
- Top-of-page `Header` (the public header, since this is inside `Layout`) is always present

### 1.5 Naming inventory — "dashboard" / "workspace" / "library" / "catalogue" / "composer" / "composition" / "concept"

#### "dashboard" (must disappear from UI per D1)
| Where | file:line |
|---|---|
| **Route**: `/designer-studio/dashboard` | `App.tsx:213` |
| **Header preload map** | `Header.tsx:166` |
| **studioCtaHref** (authed) | `Header.tsx:211` |
| **resolveNavHref** target | `Header.tsx:230` |
| **mobile CTA href** | `Header.tsx:800` |
| **Dropdown menu "My Workspace" target** | `Header.tsx:451` |
| **Post-login default** | `DesignerStudioLogin.tsx:46` |
| **TrimLibrary header link** | `DesignerStudioTrimLibrary.tsx:70` |
| **DesignerStudio cap6 target** | `DesignerStudio.tsx:47` |
| **Dashboard self-sync URL** | `DesignerStudioDashboard.tsx:137` |
| **ComposerPage onBack** | `ComposerPage.tsx:308` |
| **ComposerPage empty-canvas link** | `ComposerPage.tsx:383` |
| **Translation key namespace** `dashboard.*` — 22 keys per locale | `translations.ts:346-366` (EN), `:649-669` (zh-Hant), `:952+` (zh-Hans) |
| **File name** `DesignerStudioDashboard.tsx` | filesystem |
| Public-facing UI strings using the word "dashboard" | **none directly** — strings come from translations (key uses "dashboard." but rendered text is e.g. "Component Library", "Design & Production Management") |

So no rendered text says "Dashboard", but the route, file name, hooks, and i18n key namespace all do. This is an **identifier-only** rename — copy is unaffected.

#### "workspace" (already used loosely)
- `Header.cta.myWorkspace` translation key (P6) — "My Workspace" / 我的工作空間 / 我的工作空间 (`translations.ts:24, 391, 692`)
- `dashboard.title.subtitle` is "Design & Production Management" — does not say "Workspace"
- `auth.noBrand.title/body` discuss "brand workspace"
- `StudioCapabilityTile` cap6 body says "Brand-Private Library"

No conflict — workspace is already the soft term we've used for the authed surface.

#### "composition" / "composer" / "concept board" (vocabulary chaos — D3 evidence)
| Term | Where (file:line) | Surface |
|---|---|---|
| **"New Composition"** | `Dashboard.tsx:435`, `ComposerSessionList.tsx:114`, `ComposerSessionList.tsx:228`, `TemplatePickerDialog.tsx:319` | Buttons + dialog title |
| **"Untitled Composition"** | `ComposerSessionList.tsx:36` | Default session name |
| **"Add to Composition"** | `LibraryItemCard.tsx:142`, prop `onAddToComposition` (`Dashboard.tsx:655`) | Card hover overlay (handler navigates to `composer` tab; doesn't add anything) |
| **"Composition shared/draft"** | `ComposerSessionList.tsx:84`, `ComposerPage.tsx:213` | Toast strings |
| **"No compositions yet"** | `ComposerSessionList.tsx:222` | Empty state |
| **"Visual Composer"** | `ComposerSessionList.tsx:107`, `StudioWorkflowRail`, `studioIntro.cap2Title` (`translations.ts:268`) | Section heading + landing tile |
| **"Loading composer..."** | `ComposerPage.tsx:297` | Loader text |
| **"Concept board"** | `ComposerCanvas.tsx:477` "Start your concept board", `TemplatePickerDialog.tsx:321` "Choose a starting structure for your concept board", `PresentationPage.tsx:45,56,67` (3 strings) | Empty/error states in editor + presentation |
| **"Layered composition"** | `studioIntro.spot1Bullet1` (`translations.ts:291`) | Landing copy |
| **Data layer** `design_sessions`, `design_layers`, type `DesignSession`, hook `useDesignSessions`, dir `features/designer/` | many | Technical |
| **URL slug** `/compose/:id`, `/present/:id` | `App.tsx:217-223` | Routes |

The user sees: **Compose**, **Composer**, **Composition**, **Concept board** — four nouns/verbs for the same artefact. Recommendation in §7.

#### "Library" / "Catalogue"
| Term | Where | Refers to |
|---|---|---|
| **"Component Library"** | `dashboard.library.title`, `LibraryItemDetail.tsx:71`, `Dashboard.tsx:455-460` | The workspace library tab |
| **"Brand Catalogue"** | `dashboard.library.brandCatalogue` (`Dashboard.tsx:538`), `auth.noBrand.contact` references | The "All Products" view inside the library |
| **"Saved Library"** | `dashboard.library.savedLibrary` (`Dashboard.tsx:548`) | The "My Library" view |
| **"My Library"** | local state `librarySource === 'my'` (Dashboard.tsx:154,541-549) | Same as above (mismatch with rendered "Saved Library") |
| **"E-Catalogue"** | Brochures tab label (`Dashboard.tsx:721`), `BrochuresPanel` "catalogues" everywhere | The flipbook tool |
| **"Trim Library"** | Public page (`DesignerStudioTrimLibrary.tsx`) | Public marketing surface |
| **`Component Library` breadcrumb** | `LibraryItemDetail.tsx:71` | Detail-page breadcrumb |

"Catalogue" is overloaded: brand catalogue (=all-products view) vs e-catalogue (=brochure/flipbook). Confusing.

---

## 2. Complete action inventory ("messy buttons")

### 2.1 Top-level header / page title area

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A1 | "Studio" (h1) | `Dashboard.tsx:426-428` (`t("studio.title")`) | static | The h1 says "Studio" but this is the WORKSPACE. **Rename** to "Workspace". |
| A2 | "Design & Production Management" subtitle | `Dashboard.tsx:430` (`t("dashboard.title.subtitle")`) | static | Vague corporate filler. **Rewrite** or remove. |
| A3 | "+ New Composition" CTA (top-right) | `Dashboard.tsx:433-436` `handleCreateComposition` | LIVE — `createSession()` → navigates to `/compose/:id` | KEEP, but renaming may shift to "+ New Composition". Note: this button creates a blank composition, while the **same-name button** in `ComposerSessionList.tsx:112` opens `TemplatePickerDialog` first — **two different behaviours behind the same label**. |
| A4 | "Auto-hiding header" `<div>` (empty) | `Dashboard.tsx:415-420` | nothing | DEAD — empty container with `sticky` + transform + `[&>header]:static` selector; scrolls-but-shows-nothing. **Remove** including the `isHeaderVisible` state + scroll listener (`Dashboard.tsx:182-200`). |

### 2.2 Composer "home" view (when no main tab is expanded — `showingSessions = true`)

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A5 | `ComposerSessionList` heading "Visual Composer" + helper text | `ComposerSessionList.tsx:107-110` | static | Naming inconsistency with the A1 + parent "Studio" headers. Will be reconciled in D3 phase. |
| A6 | "+ New Composition" (inside ComposerSessionList) | `ComposerSessionList.tsx:112` | Opens `TemplatePickerDialog` | DUPLICATE of A3 with different behaviour. **Merge.** Pick one behaviour (template picker) and one location. |
| A7 | Session card click | `ComposerSessionList.tsx:129` | navigate to `/compose/:id` | KEEP |
| A8 | Session card "…" menu: Rename | `ComposerSessionList.tsx:190-192` | LIVE — `updateSession` | KEEP |
| A9 | "…" menu: Create Variant | `ComposerSessionList.tsx:194-197` | LIVE — `duplicateSession` | KEEP |
| A10 | "…" menu: Delete | `ComposerSessionList.tsx:198-201` | LIVE — `deleteSession` | KEEP. No confirmation dialog — toast on success/fail. Risky; add confirm. |
| A11 | "…" menu: Share / Set to Draft | `ComposerSessionList.tsx:203-205` | LIVE — direct Supabase update on `design_sessions.status` | KEEP. Bypasses `updateSession` hook (one-off `supabase.from(...).update`); cache invalidation depends on the follow-up `updateSession(name)` hack on line 85. Refactor. |
| A12 | "…" menu: Copy presentation link | `ComposerSessionList.tsx:207-212` | LIVE — `navigator.clipboard.writeText` | KEEP |
| A13 | Empty state "+ New Composition" | `ComposerSessionList.tsx:226-229` | Opens template picker | OK |
| A14 | Secondary card "Component Library" | `Dashboard.tsx:449-464` | `setActiveMainTab('library')` | KEEP — but D2/D4 styling. |
| A15 | Secondary card "Requests & Quotes" | `Dashboard.tsx:466-481` | `setActiveMainTab('rfq')` | KEEP. Hard-coded English string `"Requests & Quotes"` (no translation, breaks zh locales). |
| A16 | Secondary card "E-Catalogue & Content" | `Dashboard.tsx:483-498` | `setActiveMainTab('brochures')` | KEEP. Hard-coded English. |

### 2.3 Library tab

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A17 | "← Back" (to composer tab) | `Dashboard.tsx:507-512` | `setActiveMainTab('composer')` | Confusing — says "Back" but goes to the composer "home", not the previous view. **Rename to "← All Compositions"** or remove. |
| A18 | "+ Add Component" | `Dashboard.tsx:521-524` | Opens `SearchProductDialog` | KEEP. Inside the dialog: live `supabase.insert` into `user_library_items`. |
| A19 | "Brand Catalogue (n)" toggle | `Dashboard.tsx:530-538` | `setLibrarySource('all')` | KEEP. Catalogue items get synthesized `is_favourite` from real library favs (`Dashboard.tsx:218-224`) — solid. |
| A20 | "Saved Library (n)" toggle | `Dashboard.tsx:540-549` | `setLibrarySource('my')` | KEEP. Label "Saved Library" but `librarySource === 'my'` and translation key `savedLibrary` — vocabulary drift. |
| A21 | Search input | `Dashboard.tsx:554-562` | local filter | KEEP |
| A22 | Favourites filter button | `Dashboard.tsx:566-575` | `setShowFavoritesOnly(!)` | KEEP, but Heart-iconography on workspace tile conflicts with D2 ("no hearts"). The **filter** button heart is fine (it's a UI filter, not a card action); the heart on each **card** must go (W3). |
| A23 | Category select | `Dashboard.tsx:577-587` | filter; pulls from `useProductTaxonomy` | KEEP |
| A24 | Grid/List view toggle | `Dashboard.tsx:591-603` | `setLibraryViewMode` | KEEP |
| A25 | "Clear (n)" | `Dashboard.tsx:605-610` | `clearAllFilters()` | KEEP |
| A26 | Filter chips with X | `Dashboard.tsx:616-631` | Remove individual filter | KEEP |
| A27 | Empty-state "+ Add Component(s)" | `Dashboard.tsx:678-681` | Opens `SearchProductDialog` | KEEP |
| A28 | Empty-state "Clear filters" | `Dashboard.tsx:683-685` | `clearAllFilters` | KEEP |

#### LibraryItemCard surface (D2 violations live here)

| # | Label | Location | Handler | Verdict (D2) |
|---|---|---|---|---|
| **A29** | **❤ Heart (favourite)** | `LibraryItemCard.tsx:215-227` | `onToggleFavourite(item.id)` → live `toggleFavourite` in `useUserLibrary` | **REMOVE per D2.** Favouriting can live in the detail/quick-view panel or as a multi-select bulk action. The current per-card heart pulls user attention away from spec/code data. |
| **A30** | **"Request →" link** | `LibraryItemCard.tsx:204-212` | `onRequestSample(item)` → fires `toast.info(...)` only (`Dashboard.tsx:656`) | **REMOVE per D2.** Handler is a mock toast. The RFQ flow already lives in `ProductQuickView` ("Request Quote", A40) and in the contact form (P3). |
| A31 | "Files (n)" download toggle | `LibraryItemCard.tsx:187-198` | `setShowDownloads` opens inline dropdown of real files | KEEP. Inline drop-down list of downloads is reasonable; could move to detail panel. |
| A32 | Hover overlay "Add to Composition" | `LibraryItemCard.tsx:134-143` | `onAddToComposition(item)` → handler is `() => setActiveMainTab('composer')` (`Dashboard.tsx:655`) — **does NOT add to any composition** | **BROKEN handler.** Label promises an action the code doesn't perform. Either wire (need composition target picker) or **rename to "Open Composer".** D3 will rename anyway. |
| A33 | Hover overlay "View Details" | `LibraryItemCard.tsx:144-153` | `onView(item)` → opens `ProductQuickView` | KEEP. But "View Details" + clicking the card both open the same view — redundant. |
| A34 | Whole card click | `LibraryItemCard.tsx:73-77` | `onView(item)` | KEEP. |
| A35 | Tag badges (top-left) | `LibraryItemCard.tsx:94-103` | static | KEEP |
| A36 | 3D badge | `LibraryItemCard.tsx:112-118` | static | KEEP; could become a "View in 3D Editor" link (revenue tie-in for the 3D tool). |
| A37 | Sustainability cert badge | `LibraryItemCard.tsx:120-129` | static | KEEP |

#### LibraryTable (list view) surface

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A38 | Heart icon header | `LibraryTable.tsx:43-45` | none (decorative) | Remove the icon header — it sits over a column of heart toggles. Per D2, the heart column itself should go. |
| A39 | Heart toggle per row | `LibraryTable.tsx:102-117` | `onToggleFavorite(item.id)` (note: prop name uses **American spelling** `Favorite`; Card prop is **British** `Favourite`) | REMOVE per D2 + fix spelling inconsistency. |
| A40 | Sort buttons (4 columns) | `LibraryTable.tsx:48-83` | `onSort(field)` | KEEP |
| A41 | "View" button per row | `LibraryTable.tsx:174-182` | `onView(item)` → opens `LibraryItemDetail` (not the QuickView — different path than the grid!) | Inconsistent: grid → quick-view modal, list → full-page detail. Pick one. |
| A42 | Row click | `LibraryTable.tsx:99-101` | `onView(item)` | KEEP |

### 2.4 ProductQuickView dialog

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A43 | "Close" (mobile header) | `ProductQuickView.tsx:144-150` | `onOpenChange(false)` | KEEP |
| A44 | "View 3D Model" overlay button | `ProductQuickView.tsx:208-218` | `setShow3D(true)` (renders an inline 3D Canvas inside the dialog using **hardcoded primitive models** ButtonModel/ZipperModel/HardwareModel from `ProductQuickView.tsx:30-77`, NOT the real OBJ unless `modelUrl` provided) | Duplicate of `Model3DViewer`. Three different 3D viewing surfaces in the codebase (here, `Model3DViewer.tsx`, `StudioHero3D.tsx`). Consolidate. |
| A45 | Auto-rotate, Light mode, Image-mode controls | `ProductQuickView.tsx:170-195` | local state | KEEP |
| A46 | "Close" (footer) | `ProductQuickView.tsx:559-563` | `onOpenChange(false)` | KEEP |
| A47 | "Request Quote" (footer) | `ProductQuickView.tsx:566-572` | `setShowRFQDialog(true)` → opens `QuickRFQDialog` (toast-only) | MOCK — see W7 |
| A48 | Inline download buttons per file | `ProductQuickView.tsx:511-522` | opens `file.url` in new tab | KEEP, but depends on real `item.downloadableFiles` — driven by adapter `toLegacyItem` which **never populates `downloadableFiles`** (the field is missing in the adapter mapping at `Dashboard.tsx:75-103`). So this section never renders in practice. |

### 2.5 LibraryItemDetail (full-page detail)

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A49 | "Back" + breadcrumb | `LibraryItemDetail.tsx:54-83` | `onBack()` | KEEP |
| A50 | "Download OBJ" | `LibraryItemDetail.tsx:122-127` | **no handler** (button has no `onClick`) | DEAD button. Remove or wire to `item.modelUrl` download. |
| A51 | Image carousel + thumb strip + Zoom hover | `LibraryItemDetail.tsx:131-180` | uses 4 copies of the same thumbnail as a fake gallery (line 35-40 comment: "in real app, these would come from backend") | MOCK — galleries are fake. **Hide unless real `item.images` exist.** |
| A52 | Pricing / MOQ / Volume Pricing cards | `LibraryItemDetail.tsx:275-313` | static — reads `item.pricing.unitPrice` etc. | MOCK. Adapter `toLegacyItem` at `Dashboard.tsx:85` hardcodes `pricing: { unitPrice: 0, currency: 'USD', moq: 0 }`. **Always shows "USD $0.000" + "0 pcs MOQ".** Embarrassing on demo. **Remove the pricing card** until pricing comes from DB. |
| A53 | "Material/Size/Weight/Thickness/Finish/Tensile Strength" rows | `LibraryItemDetail.tsx:215-272` | reads `item.specifications` | partial: spec fields come through, but the adapter narrows `category` to `'buttons'` for ALL items (`Dashboard.tsx:82`), so the `categoryLabels[item.category]` breadcrumb badge is always "Buttons". |
| A54 | "Available Colors" card | `LibraryItemDetail.tsx:351-368` | reads `item.availableColors` | Adapter sets `availableColors: []` always — never renders. Dead UI. |
| A55 | "Lead Time / Sample Time / Origin / Capacity" | `LibraryItemDetail.tsx:315-349` | reads `item.production` | Adapter reads from `p.production` JSONB; works IF the DB populates that field. Otherwise displays empty strings. |
| A56 | "Created / Last Updated" metadata | `LibraryItemDetail.tsx:392-413` | reads from `added_at` only (both fields use the same timestamp due to adapter line 100-101) | Both dates always equal. Misleading. |

### 2.6 RFQ tab (entire surface is mock — see §5)

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A57 | Stat cards (6) | `Dashboard.tsx:734-739` | static | KEEP — but counts derived from `mockRFQs`. |
| A58 | "Search RFQ…" | `Dashboard.tsx:745-750` | local filter | KEEP |
| A59 | "Filter" button | `Dashboard.tsx:752-755` | **no handler** | DEAD |
| A60 | Status tabs (7 of them) | `Dashboard.tsx:758-767` | `setActiveRFQTab` | KEEP |
| A61 | Row click in `RFQList` | `RFQList.tsx:132-137` | `onSelect(rfq)` → opens `RFQDetail` | KEEP |
| A62 | `RFQDetail` "Confirm Design" / "Request Revision" / "Approve Production" / "Close" actions | `RFQDetail.tsx:62-94, 147-161` | `onStatusChange(rfqId, newStatus)` → updates **local `useState`** (`Dashboard.tsx:318-325`) — vanishes on reload | MOCK — state lives in React only. |
| A63 | "Add comment" / Send | `RFQDetail.tsx:240-251` | local `setComments` only | MOCK |
| A64 | "Upload File" | `RFQDetail.tsx:279-282` | **no handler** | DEAD |
| A65 | "Download OBJ" + "Fullscreen View" | `RFQDetail.tsx:184-191` | **no handlers** | DEAD |
| A66 | `CreateRFQDialog` itself | `Dashboard.tsx:791-795` | mounted in JSX but `setIsCreateDialogOpen(true)` is **never called by any UI** | ORPHAN — the dialog is dead code from the workspace's perspective. |

### 2.7 Brochures tab

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A67 | "+ New Catalogue" | `BrochuresPanel.tsx:194-201` | `onOpenEditor()` → routes via prop to `BrochureEditor` | KEEP |
| A68 | Status filter tabs | `BrochuresPanel.tsx:183-189` | `setFilterTab` | KEEP |
| A69 | Search | `BrochuresPanel.tsx:172-181` | local filter | KEEP |
| A70 | Row click / "Edit" | `BrochuresPanel.tsx:232-236, 254-262` | `onOpenEditor(b.id)` | KEEP |
| A71 | "Publish / Unpublish" | `BrochuresPanel.tsx:263-280` | LIVE — `updateBrochure.mutate` | KEEP |
| A72 | "Delete" + confirm dialog | `BrochuresPanel.tsx:281-289, 300-318` | LIVE — `deleteBrochure.mutate` | KEEP |

### 2.8 Products tab

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A73 | Sub-tabs Catalog / Categories & Tags / Import | `ProductsPanel.tsx:18-31` | `setSubTab` | KEEP |
| A74 | All actions inside `ProductCatalogTab`, `TaxonomyTab`, `ImportTab` | not read in this audit | — | Recommend a P11-extension audit pass on these three components — they appear admin-grade and may be irrelevant to brand users. |

### 2.9 "Back to Projects" navigation

| # | Label | Location | Handler | Verdict |
|---|---|---|---|---|
| A75 | "← Back to Projects" | `Dashboard.tsx:695-700` | `setActiveMainTab('composer')` | "Projects" is **never defined** anywhere in the UI. The composer tab page says "Visual Composer" + "No compositions yet". **Rename to "← All Compositions".** |

---

## 3. Visual system deviations (D4)

Target system (from P5–P9 Studio work): `rounded-none`, 1px borders, no soft shadows, eyebrow typography `text-[10px] uppercase tracking-[0.18em]`, monochrome black/white chips and buttons, lucide icons (consistent weight 1.5), warm ivory neutrals.

### 3.1 Rounded corners (must be `rounded-none`)

| File:line | Class | Replacement |
|---|---|---|
| `Dashboard.tsx:452,469,486` | `rounded-[calc(var(--radius)*2)]` (secondary cards) | `rounded-none` |
| `Dashboard.tsx:454,471,488` | `rounded-[var(--radius)]` (icon containers) | `rounded-none` |
| `Dashboard.tsx:529,532,542` | `rounded-[var(--radius)]` and `rounded-[calc(var(--radius)-2px)]` (toggle pill + items) | `rounded-none` |
| `Dashboard.tsx:825,831` | `rounded-[var(--radius)]` (StatCard) | `rounded-none` |
| `LibraryItemCard.tsx:75,98,107,114,123,139,149,232,246` | many `rounded-[var(--radius)]` + `rounded-[calc(var(--radius)*2)]` | `rounded-none` |
| `LibraryTable.tsx:38,46,119` | `rounded-[var(--radius)]`, `rounded` | `rounded-none` |
| `LibraryItemDetail.tsx:165,302` | `rounded-md`, `bg-muted/50 rounded px-2` | `rounded-none` |
| `ProductQuickView.tsx:170,202,280,286,302,494,496` | `rounded-full`, `rounded-lg`, `rounded-md` | `rounded-none` (and replace `rounded-full` pill controls with rectangular icon buttons) |
| `BrochuresPanel.tsx:208,216,250` | `rounded`, `rounded-lg` | `rounded-none` |
| `ComposerSessionList.tsx:128,185,220` | `rounded-[calc(var(--radius)*2)]`, `rounded-full` | `rounded-none` |
| `RFQList.tsx:74,148` | `rounded-lg`, `whitespace-nowrap` badge with default radius | `rounded-none` |
| `RFQDetail.tsx:74,262,279` | `rounded-lg` | `rounded-none` |
| `CreateRFQDialog.tsx:166,168,174` | `rounded-lg`, `rounded` (dropzone) | `rounded-none` |
| `QuickRFQDialog.tsx:105,164,190` | `rounded-lg`, `rounded-md` | `rounded-none` |
| `WorkflowTimeline.tsx:40,61` | `rounded-lg`, `rounded-full` step circles | `rounded-none` for container; circles may stay round (they're glyphs, not chrome) |

### 3.2 Soft shadows (must go)

| File:line | Class | Replacement |
|---|---|---|
| `Dashboard.tsx:452,469,486` | `hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)]` | remove — use border hover instead |
| `Dashboard.tsx:534,544` | `shadow-sm` (toggle pill) | remove |
| `Dashboard.tsx:825,831` | `hover:shadow-sm`, `hover:shadow-md` (StatCard) | remove |
| `LibraryItemCard.tsx:75` | `hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]` | remove |
| `LibraryItemDetail.tsx:51` | `backdrop-blur-sm` + sticky nav | KEEP (functional) |
| `ProductQuickView.tsx:170,496` | `shadow-lg`, `shadow-sm` | remove |
| `BrochuresPanel.tsx` table card has no border shadows ✓ | — | OK |

### 3.3 Off-system colour accents

| File:line | Class | Compliant alternative |
|---|---|---|
| `LibraryItemDetail.tsx:98-99` | `border-amber-500/50 text-amber-700 dark:text-amber-400` (Team Exclusive badge) | `border-foreground text-foreground` |
| `ProductQuickView.tsx:245-247` | same amber pattern | same |
| `LibraryItemDetail.tsx:381-383` | `bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400` (cert badges) | monochrome outline badge |
| `ProductQuickView.tsx:454-456` | `bg-green-500/5 border-green-500/30 text-green-700` | monochrome outline badge |
| `ProductQuickView.tsx:302` | `bg-primary/5 border-primary/20` (volume price pill) | `bg-secondary border-border` |
| `LibraryTable.tsx:112-114` | `fill-red-500 text-red-500` heart | n/a — entire heart column removed (W3) |
| `RFQList.tsx` via `mockRFQData.statusColors` | colored status badges (likely tailwind colors) | rebuild with monochrome state language (Outline / Filled / Dashed) |
| `WorkflowTimeline.tsx:62-66` | `bg-primary text-primary-foreground`, `bg-primary/20`, `border-primary` | `bg-foreground text-background`, etc. |
| `BrochuresPanel.tsx:70-71` | `bg-emerald-500/15 text-emerald-600 border-emerald-500/30`, `bg-orange-500/15 …` | monochrome with dot indicator |
| `QuickRFQDialog.tsx:62-63` | `text-blue-500` file icon | `text-foreground` |
| `RFQDetail.tsx:217-223` | comment avatar colors (blue/purple/primary) | monochrome initials |
| `ComposerSessionList.tsx:172-173` | `Badge variant='published'/'draft'` — these variants come from a custom badge.tsx; assess separately | confirm Badge variants align with monochrome system |
| `ProductsPanel`/`ImportTab` (not read) | likely admin-flavoured | follow-up |

### 3.4 Pill / round shapes that should be rectangles

- `Dashboard.tsx:528-550` "Brand Catalogue / Saved Library" toggle is a `bg-muted` pill with rounded items — should be a flat segmented control (border underline on active).
- `ProductQuickView.tsx:170` 3D control dock `rounded-full px-3 py-1.5 shadow-lg` — should be a small rect strip with 1px border.
- `ComposerSessionList.tsx:185` Hover "…" trigger `rounded-full` — change to `rounded-none` or absorb into card chrome.
- `WorkflowTimeline.tsx:61` step circles — fine to keep as glyphs but recolor.
- `RFQDetail.tsx:217` avatar circles — keep as glyphs but use monochrome initials.

### 3.5 Typography deviations

- `Dashboard.tsx:426` h1 uses `text-2xl font-semibold` (not `text-3xl/4xl` of public studio). Matter of taste, but workspace shell should align with redesigned scale.
- `LibraryItemDetail.tsx:104` h1 `text-2xl font-semibold` — likewise.
- `Dashboard.tsx:532, 542` toggle uppercase tracking-[0.06em] — slightly off-system (system uses `0.18em` for eyebrows).
- Eyebrow micro-labels like "Category" / "Code" on `LibraryItemCard.tsx:161-166` use `text-[10px] tracking-[0.08em]` — should be `tracking-[0.18em]` for consistency.

### 3.6 Icon weight inconsistencies

- Most workspace icons use the lucide default `strokeWidth` (≈ 2). The public studio uses `strokeWidth={1.5}` consistently. Set workspace defaults to 1.5. Locations: many — too many to list per icon; standardise centrally.
- `WorkflowTimeline.tsx:70-74` uses 5×5 icons inside 10×10 circles — proportions are fine but stroke weight defaults differ.

### 3.7 Lavender / accent colours not aligned with ivory neutrals

- `Dashboard.tsx:452-498` cards use `bg-[hsl(var(--background))] border-[hsl(var(--border))]` — fine.
- `LibraryItemCard.tsx:79` uses `bg-[hsl(var(--secondary))]` for the image area — fine but should be a slightly warmer tone if "warm ivory" is the target. (Token-level change, not class-level.)

---

## 4. UX flow findings

### 4.1 Core job: "browse brand catalogue → save to library → build composition → request quote"

**Click count to first composition:**

1. (Landing) header → "My Workspace" → `/dashboard?tab=library` (1 click → library)
2. To get to composer "home": click "← Back" (mislabeled as A17) → `composer` tab (1 click)
3. Click "+ New Composition" → opens `TemplatePickerDialog` (1 click)
4. Pick a template → composition created → navigates to `/compose/:id` (1 click)
5. In composer: click "Open Library" inside `ProductPickerSheet` → pick items (≥2 clicks per item)

**Click count to "add an existing library item to a composition":**

The naïve path (click "Add to Composition" on a card) is broken:
- A32 sets `activeMainTab` to `composer` but does NOT carry the product into any composition.
- User now sees the composer "home" with their sessions, NOT a target picker.
- They have to manually open a composition, then open `ProductPickerSheet`, then re-find the same item.

That is 4+ clicks for what looks like 1 click. **Critical wayfinding bug** (W4).

**Click count to RFQ from a library card:**

1. Click card → `ProductQuickView` modal (1 click)
2. Click "Request Quote" → `QuickRFQDialog` (1 click)
3. Fill form, submit → **toast-only**, no persistence (mock).

OR from the cards: "Request →" link (A30) — fires toast immediately, never opens a form.

**Click count from list view to RFQ:** Cannot RFQ from list view. Only grid view + ProductQuickView path leads there.

### 4.2 Dead ends and broken paths

- W4 above: A32 "Add to Composition" doesn't add to any composition.
- "Request →" link (A30) toasts and disappears — no actual request submitted.
- `LibraryItemDetail` has no RFQ button at all — opening the full detail removes the option you had in the grid card and modal.
- `CreateRFQDialog` is mounted but never opened (A66).
- "Filter" button in RFQ tab does nothing (A59).
- "Download OBJ" / "Fullscreen View" / "Upload File" in RFQDetail do nothing (A64, A65).
- "Download OBJ" in LibraryItemDetail does nothing (A50).

### 4.3 State lost on tab switch

- `searchQuery`, `categoryFilter`, `showFavoritesOnly`, `librarySource`, `libraryViewMode` all live in component state inside `DesignerStudioDashboard`. They survive **tab** switches (component stays mounted) but are reset on any **route** change (e.g. visit composer page and come back).
- The `?tab=` param is the only state that's URL-encoded. Search/filter selections are not preserved across reloads, deep links, or sharing.

### 4.4 Redundant or competing paths

- Two "New Composition" buttons in the same view (A3 + A6) with different behaviours.
- Grid card click and "View Details" hover button do the same thing (A33+A34).
- Grid view opens `ProductQuickView` (modal); list view opens `LibraryItemDetail` (full-page). Same data, different UI.
- `Model3DViewer` (Library/RFQDetail), `ProductQuickView` inline 3D (with HARDCODED button/zipper/hardware primitives at `ProductQuickView.tsx:30-77`), and `StudioHero3D` are three separate 3D rendering paths.

### 4.5 Empty / loading / error states

| Surface | Loading | Empty | Error |
|---|---|---|---|
| Library | ✓ (`dashboard.library.loading`) | ✓ (split: "empty" vs "no match") | ✗ — no error state for failed Supabase queries |
| RFQ tab | ✗ — `mockRFQs` is sync | ✓ (`RFQList.tsx:64-71`) | ✗ |
| Brochures | ✓ (5 skeleton bars) | ✓ ("No catalogues found") | ✗ |
| Composer sessions | ✓ ("Loading sessions...") | ✓ (dashed-border empty state) | ✗ |
| ProductsPanel | depends on sub-tabs (not read) | unknown | unknown |
| LibraryItemDetail full-page | ✗ — no loading; opens instantly with adapter data | n/a | ✗ |
| RFQDetail full-page | ✗ | n/a | ✗ |
| `SearchProductDialog` | "Searching..." text | "No components found" | ✗ |
| `ProductQuickView` | none | n/a | ✗ |

### 4.6 Mobile behaviour (code-level only)

- `Dashboard.tsx`: container is `max-w-7xl mx-auto px-4 lg:px-6`. Page title row is `flex items-end justify-between` — on narrow screens the title + "+ New Composition" button get tight; no responsive collapse.
- Library filters row at `Dashboard.tsx:553-611` is `overflow-x-auto scrollbar-hide` — horizontal scroll works but no visual hint.
- `LibraryItemCard` hover overlay (A32/A33) is on mouse hover only. On touch devices there's no equivalent — tapping the card opens quick-view; "Add to Composition" is unreachable from mobile.
- `LibraryItemDetail` is a 2-column grid that collapses to 1 column on `lg:` breakpoint — OK.
- `RFQDetail` shipping info / quote details panel is in a 1-of-3 column grid — collapses to 1 column. OK.
- `ProductQuickView` is `max-w-6xl` with `md:grid-cols-2`. On mobile it has a manually-added sticky header (`ProductQuickView.tsx:143-152`) but on tablets where md breakpoint kicks in, the sticky mobile header disappears mid-layout. Watch for tablet regressions.
- `BrochuresPanel` table actions are `opacity-0 group-hover:opacity-100` — **unreachable on touch devices.**

### 4.7 Auto-hiding header (W5)

`Dashboard.tsx:182-200` adds a scroll listener that flips `isHeaderVisible` based on scroll direction, then applies `translate-y-0` / `-translate-y-full` to an **empty** `<div>` (Dashboard.tsx:415-420 — opening div, closing div, nothing between). The state machine runs forever, listener never detaches across SPA navigations until unmount, and the visible effect is zero. Pure dead code.

---

## 5. Data & wiring health

### 5.1 Real (Supabase-backed)

- `useUserLibrary` (`team_id`-scoped) — library items, toggleFavourite, removeItem
- `useProducts({ visibility: 'brand' })` — full product catalogue
- `useProductTaxonomy` — category list
- `useDesignSessions` — `design_sessions` + `design_layers`
- `useBrochures` + `useBrochureMutations` — flipbook catalogues
- `SearchProductDialog.handleAdd` — direct `supabase.insert` into `user_library_items` (auth scoping via RLS)
- `BrochuresPanel.handleTogglePublish/Delete` — live mutations
- `ComposerSessionList` rename/duplicate/delete/share/copy-link — live
- `ProductsPanel` sub-tabs — live (per file structure)

### 5.2 Mock (would embarrass a client demo)

- **RFQ tab (entire surface)** — `Dashboard.tsx:54` imports `mockRFQs` from `src/data/mockRFQData.ts`; state in `useState`; all status changes / comments / files persist only in memory (`Dashboard.tsx:318-340`). Tab is named "Requests" in UI but it is fake. **Critical W7.**
- **`CreateRFQDialog`** — mounted but never opened (A66).
- **`QuickRFQDialog`** — opens a real form but the submit handler is `toast({ title: "Quote request submitted" })` and that's it (`QuickRFQDialog.tsx:68-89`).
- **`RFQDetail` upload file / download OBJ / fullscreen view buttons** — no handlers (A64, A65).
- **`LibraryItemDetail` "Download OBJ"** — no handler (A50).
- **Image gallery in `LibraryItemDetail`** — 4 copies of the same thumbnail (A51).
- **Pricing fields in `LibraryItemDetail`** — always `USD $0.000` because adapter hardcodes pricing to zero (A52).
- **3D primitive models** in `ProductQuickView.tsx:30-77` — handrolled ButtonModel/ZipperModel/HardwareModel; only used as fallback when `modelUrl` is absent. The 3D Canvas itself is live three.js but the geometry is a demo prop.

### 5.3 RLS / permission notes (P4b pattern)

- `useUserLibrary(teamId)` — assumes RLS row policy `team_id = primaryBrand.id`. `RequireBrandAuth` guarantees `primaryBrand` exists before render (`Dashboard.tsx:117 → teamId = primaryBrand?.id ?? ''`). The `?? ''` fallback would issue a query for `team_id = ''` if `primaryBrand` is somehow null — RLS would reject, but it's defensive paranoia.
- `SearchProductDialog.handleAdd` inserts `{ product_id, team_id }` only — relies on RLS to reject unauthorised team_ids. Per P4b pattern, the policy must require `team_id = current team`. Confirm policy exists.
- `useDesignSessions` — same pattern.
- `BrochureEditor` / `BrochuresPanel` — admin-grade controls (publish/delete) are exposed regardless of `primaryBrand.role` (`member | manager | owner`). **Role-gating is missing.** A `member` could nuke published catalogues.
- `ProductsPanel` (CMS) is exposed under the brand-auth gate, but Products is a global resource not a per-brand one. Whether brand users should be CMS-editing global products is a product question, not a security one — but should be reviewed (likely belongs in an admin shell, not in the workspace).
- `ComposerSessionList.handleToggleShare` does a direct `supabase.from('design_sessions').update(...).eq('id', session.id)` without `team_id` filter (`ComposerSessionList.tsx:82`). Relies entirely on RLS. Add the `team_id` filter as defence-in-depth.

---

## 6. Severity-ranked findings list

🔴 Critical · 🟠 High · 🟡 Medium · 🟢 Low

| # | Finding | Severity | Where |
|---|---|---|---|
| W1 | RFQ tab is entirely backed by `mockRFQs` in-memory state — visible to all brand users on every load | 🔴 Critical | `Dashboard.tsx:54,172,318-340`, `data/mockRFQData.ts` |
| W2 | `QuickRFQDialog` submit handler only fires a `toast`; no insert, no persistence — user thinks they sent a quote request | 🔴 Critical | `QuickRFQDialog.tsx:68-89` |
| W3 | D2 violation: per-card heart on `LibraryItemCard` + per-row heart in `LibraryTable` | 🔴 Critical (per D2) | `LibraryItemCard.tsx:215-227`, `LibraryTable.tsx:43,102-117`, `Dashboard.tsx:654,664` |
| W4 | D2 violation: per-card "Request →" link with mock toast handler | 🔴 Critical (per D2) | `LibraryItemCard.tsx:204-212`, handler `Dashboard.tsx:656` |
| W5 | "Add to Composition" on `LibraryItemCard` switches tabs but does not add anything — label lies | 🔴 Critical | `LibraryItemCard.tsx:134-143`, handler `Dashboard.tsx:655` |
| W6 | `LibraryItemDetail` pricing card shows hardcoded zeros ($0.000, 0 pcs) on every item — adapter writes `unitPrice: 0` | 🔴 Critical | `Dashboard.tsx:85`, `LibraryItemDetail.tsx:282-294` |
| W7 | `LibraryItemDetail` image gallery is 4× the same thumbnail with a fake zoom hover | 🔴 Critical | `LibraryItemDetail.tsx:35-40,136-180` |
| W8 | "Filter" button (RFQ tab), "Upload File" (RFQDetail), 2× buttons in RFQDetail 3D area, "Download OBJ" (LibraryItemDetail) — zero handlers | 🟠 High | `Dashboard.tsx:752-755`, `RFQDetail.tsx:184-191,279-282`, `LibraryItemDetail.tsx:122-127` |
| W9 | "Auto-hiding header" wraps an empty `<div>` (no children) — dead code, runs a scroll listener for nothing | 🟠 High | `Dashboard.tsx:182-200,415-420` |
| W10 | `CreateRFQDialog` is JSX-mounted but never opened by any UI — dead code, plus the form is wired to mock state anyway | 🟠 High | `Dashboard.tsx:174,791-795` |
| W11 | Two "+ New Composition" buttons with **different behaviour** in the same composer view (top-right blank create vs grid open-template-picker) | 🟠 High | `Dashboard.tsx:433-436`, `ComposerSessionList.tsx:112-115` |
| W12 | "← Back to Projects" label, but there is no "Projects" surface — only "Visual Composer" | 🟠 High | `Dashboard.tsx:695-700` |
| W13 | Grid card and list row open **different** detail surfaces (Quick-view modal vs full-page detail) — same data, two UIs | 🟠 High | `Dashboard.tsx:650-668`, `LibraryItemCard.onView`, `LibraryTable.onView` |
| W14 | D3 vocabulary chaos: "Composition" / "Concept board" / "Composer" / "Visual Composer" used interchangeably | 🟠 High | multiple — see §1.5 |
| W15 | Brochure publish/delete actions exposed regardless of `primaryBrand.role` — a `member` can delete published catalogues | 🟠 High | `BrochuresPanel.tsx:146-167`; no role check |
| W16 | `ComposerSessionList.handleToggleShare` updates `design_sessions` without `team_id` filter; relies fully on RLS | 🟠 High | `ComposerSessionList.tsx:80-86` |
| W17 | British/American spelling inconsistency: `onToggleFavourite` (card) vs `onToggleFavorite` (table) | 🟡 Medium | `LibraryItemCard.tsx:12,43`, `LibraryTable.tsx:16,32` |
| W18 | Hover-only actions on `BrochuresPanel` rows and `ComposerSessionList` cards — unreachable on touch | 🟡 Medium | `BrochuresPanel.tsx:253`, `ComposerSessionList.tsx:182` |
| W19 | Library filters not URL-encoded — deep links / reloads / sharing lose state | 🟡 Medium | `Dashboard.tsx:154-161` |
| W20 | Three separate 3D rendering paths: `Model3DViewer`, `ProductQuickView`'s inline Canvas, `StudioHero3D` | 🟡 Medium | `Model3DViewer.tsx`, `ProductQuickView.tsx:30-77`, `StudioHero3D.tsx` |
| W21 | D4: rounded radii (`rounded-[var(--radius)]`, `rounded-lg`, `rounded-full`, `rounded-md`) used across nearly every workspace surface — needs `rounded-none` sweep | 🟡 Medium | see §3.1 (28+ sites) |
| W22 | D4: soft shadows (`shadow-sm`, `shadow-md`, `hover:shadow-[...]`) on cards, dialogs, controls | 🟡 Medium | see §3.2 |
| W23 | D4: colored accent palette (amber, emerald, green-100, red-500, primary tints) on badges and timeline | 🟡 Medium | see §3.3 |
| W24 | D4: pill segmented control "Brand Catalogue / Saved Library" — should be flat segmented control | 🟡 Medium | `Dashboard.tsx:528-550` |
| W25 | D4: lucide stroke weight inconsistent (default ~2 in workspace, 1.5 in public studio) | 🟡 Medium | many |
| W26 | LibraryItemDetail downloads section never renders because adapter doesn't populate `downloadableFiles` | 🟡 Medium | `Dashboard.tsx:75-103`, `ProductQuickView.tsx:466-530` |
| W27 | `toLegacyItem` hardcodes `category: 'buttons'` for ALL items — every detail page badge says "Buttons" | 🟡 Medium | `Dashboard.tsx:82` |
| W28 | "Created" and "Last Updated" always equal because adapter sets both from `added_at` | 🟢 Low | `Dashboard.tsx:100-101` |
| W29 | h1 "Studio" (`Dashboard.tsx:426-428`) on the **workspace** shell — copy collision with the public Studio page | 🟢 Low | `Dashboard.tsx:426-428` |
| W30 | "Auto-filled Item Info" panel in `QuickRFQDialog` shows category via legacy `categoryLabels` — depends on broken category narrowing (W27) | 🟢 Low | `QuickRFQDialog.tsx:107` |
| W31 | Translation key `dashboard.title.subtitle` renders as "Design & Production Management" — generic filler | 🟢 Low | `translations.ts:350` |
| W32 | Hard-coded English strings in secondary cards "Requests & Quotes" / "E-Catalogue & Content" / "Manage catalogues & product data" — break zh locales | 🟢 Low | `Dashboard.tsx:475,492-494` |
| W33 | Hard-coded English in RFQ section: "Requests (n)", "Search RFQ…", "Pending", "Filter", "In Production", "Sample Review", stat labels | 🟢 Low | `Dashboard.tsx:711-769`, `RFQList.tsx:84-127` |
| W34 | Hard-coded English in `ComposerSessionList`, `BrochuresPanel`, dialog titles — not i18n-keyed | 🟢 Low | multiple |
| W35 | `setTimeout` re-open trick on `SearchProductDialog.onAdded` (close + 100ms reopen) — should be a refetch + state reset, not a UI bounce | 🟢 Low | `Dashboard.tsx:802-805` |
| W36 | `Dashboard.tsx:13-36` imports a long list of icons; some unused (`Heart` is the only D2-relevant one to delete; verify the rest still get used after W3) | 🟢 Low | `Dashboard.tsx` imports block |

---

## 7. Proposed phase plan

Each phase is an independently shippable batch. Order respects risk and dependencies. **None of these are implemented in P11.**

### Phase A — Quick-wins / removals (low-risk cleanup)
**Goal:** stop showing fake numbers and dead buttons. No naming changes, no route changes, no styling overhaul.

Tasks:
- W3 — remove heart from `LibraryItemCard`, remove heart column from `LibraryTable`
- W4 — remove "Request →" from `LibraryItemCard`
- W5 — fix or remove "Add to Composition" overlay (recommend rename to "Open Composer" until a true add-to-target flow exists)
- W6 — remove the Pricing card from `LibraryItemDetail` (or gate on `pricing.unitPrice > 0`)
- W7 — show single image / model in `LibraryItemDetail`; remove the 4-thumbnail fake carousel
- W8 — remove dead buttons: RFQ "Filter", RFQDetail "Upload File" / "Download OBJ" / "Fullscreen", LibraryItemDetail "Download OBJ"
- W9 — delete the empty auto-hide header div + scroll listener + state
- W10 — delete `CreateRFQDialog` mount and `isCreateDialogOpen` (orphan)
- W11 — pick one "+ New Composition" (recommend: top-right launches template picker; remove the secondary button in `ComposerSessionList`) OR vice versa — but ONE
- W12 — rename "Back to Projects" to "← All Compositions"
- W13 — pick one detail surface (recommend: keep `ProductQuickView` modal everywhere, retire `LibraryItemDetail` from the workspace, or vice versa)
- W17 — normalise to British `Favourite` everywhere (the favourite filter remains in §2.3 A22, only the per-item heart goes)
- W36 — clean unused icon imports after the heart goes

Files touched: `Dashboard.tsx`, `LibraryItemCard.tsx`, `LibraryTable.tsx`, `LibraryItemDetail.tsx`, `RFQDetail.tsx`, `ComposerSessionList.tsx`, `QuickRFQDialog.tsx` (small).

Risk: low. Each change is local. No data layer changes.

Estimated size: ~150–250 LOC removed, ~30 added.

### Phase B — RFQ honesty (build OR hide)
**Goal:** stop pretending RFQ is shippable.

Decision required from human first: **build it or hide it for the demo.**

If "hide for demo": gate the RFQ tab + the secondary RFQ card behind a feature flag (or simply remove from the tab list); replace "Request Quote" in `ProductQuickView` with a `/contact` link prefilled with the item.

If "build now":
- Create Supabase tables for RFQs + comments + files (with RLS by team_id)
- Replace `mockRFQs` with `useRfqs` hook
- Wire `QuickRFQDialog` submit to insert + toast on success
- Wire `RFQDetail` status changes to mutations
- Wire file uploads
- W15 — role-gate Brochures publish/delete and any new RFQ mutations
- W16 — add defence-in-depth `team_id` filters on all `design_sessions` updates

Files touched: `Dashboard.tsx`, all RFQ components, new hooks, new migration.

Risk: high (real surface that ships to customers). Size: large.

### Phase C — Naming consolidation (D1 + D3)
**Goal:** "Studio" = public, "3D Editor" = the tool, "Workspace" = authed area; one word for compositions.

Tasks:
- D1 route rename `/designer-studio/dashboard` → `/designer-studio/workspace`
   - 10 string updates across 7 files: `App.tsx:213`, `Header.tsx:166,211,230,451,800`, `DesignerStudioLogin.tsx:46`, `DesignerStudioTrimLibrary.tsx:70`, `DesignerStudio.tsx:47`, `Dashboard.tsx:137`, `ComposerPage.tsx:308,383`
   - Add `<Route path="/designer-studio/dashboard" element={<Navigate to="/designer-studio/workspace" replace />} />` for any external bookmarks
   - Rename i18n key namespace `dashboard.*` → `workspace.*` (22 keys × 3 locales = 66 string moves) — or keep keys as internal stable identifiers and only change render-time. The pragmatic move is to rename keys for clarity; either choice is OK.
   - W29 — rename h1 "Studio" → "Workspace"
- D3 — pick ONE vocabulary:
   - **Recommendation:** "**Composition**" everywhere user-facing; "**Composer**" only for the page/tool name (parallel to "3D Editor"). Drop "concept board" entirely.
   - Strings to change:
     - `ComposerCanvas.tsx:477` "Start your concept board" → "Start your composition"
     - `TemplatePickerDialog.tsx:321` "Choose a starting structure for your concept board" → "Choose a starting structure for your composition"
     - `PresentationPage.tsx:45,56,67` × 3 "concept board" → "composition"
     - `studioIntro.spot1Bullet1` "Layered composition" — already aligned
     - All "Visual Composer" → "Compositions" for the section heading; keep "Composer" for the toolbar/page heading
- File rename `DesignerStudioDashboard.tsx` → `DesignerStudioWorkspace.tsx` (optional but nice)

Files touched: 7 files for the route; ~10 for translation/wording.

Risk: medium (lots of touches, easy to miss one; type-check + grep enforce coverage).

Estimated size: ~30 LOC functional + ~70 translation-string updates.

### Phase D — Visual system convergence (D4)
**Goal:** workspace looks like the redesigned public Studio.

Tasks:
- `rounded-none` sweep — see §3.1 (~28 sites)
- Soft-shadow removal — see §3.2
- Monochrome badge rebuild — replace amber/emerald/green/blue/primary tints with foreground/secondary outlines + dot indicators
- Segmented control rebuild for "Brand Catalogue / Saved Library" toggle (W24)
- Standardise `strokeWidth={1.5}` for lucide icons (W25)
- Eyebrow typography sweep: `text-[10px] uppercase tracking-[0.18em]` on micro-labels
- Recolour `WorkflowTimeline` (foreground / background / outline)
- Recolour `RFQList` status badges (depends on RFQ phase B outcome)

Files touched: all workspace components; large but mechanical.

Risk: medium (visual regressions); ship via screenshots on each PR.

Estimated size: medium-large.

### Phase E — Flow + IA restructuring (after the above)
**Goal:** make the workspace coherent.

Tasks:
- W13 — finalise on one detail surface (decide first in Phase A, ship structural cleanup here)
- W14 — already addressed by Phase C, but verify
- W19 — URL-encode library filters (search query, category, source, view mode)
- W20 — consolidate 3D rendering paths to a single component
- W26, W27, W28 — fix or retire `toLegacyItem`; the adapter is a maintenance trap (hardcoded category, hardcoded pricing, equal dates, missing files). Drop the legacy `LibraryItem` type entirely and pass `UserLibraryItem` end-to-end. This is a refactor that touches `LibraryItemDetail`, `ProductQuickView`, `QuickRFQDialog`.
- Mobile: replace hover-only actions with explicit menus (W18); replace `LibraryItemCard` hover overlay with always-visible icon buttons or a card-tap context menu.
- W31 — rewrite or remove "Design & Production Management" tagline
- W32, W33, W34 — i18n sweep on workspace hard-coded English

Files touched: many; data-layer changes; mobile-specific component variants.

Risk: high. Will likely surface latent bugs in the data layer.

Estimated size: large.

---

## Appendix — Deletion candidates (dead code to retire)

| File / block | Reason |
|---|---|
| `src/components/designer-studio/StudioPreview.tsx` | Not imported anywhere (grep returned 0 hits). Was replaced by `StudioHero3D` in P5b. **Safe to delete.** |
| `src/data/mockLibraryData.ts` (the file itself) | Only imported for `LibraryItem, categoryLabels` in `Dashboard.tsx:49`. `categoryLabels` is also exported from `features/products/legacyTypes.ts` (which still imports from `mockLibraryData` per the file comment). After Phase E retires the legacy adapter, this whole data file can go. |
| `src/data/mockRFQData.ts` | Only used by the mock RFQ surface (W1). Goes if RFQ is hidden, gets replaced if RFQ is built. |
| `LibraryItemDetail.tsx` | If Phase A picks `ProductQuickView` as the canonical detail surface, this whole component retires. |
| `CreateRFQDialog.tsx` | Dead in workspace (W10). May be re-used if Phase B builds RFQ. |
| `Dashboard.tsx:182-200` (scroll listener + `isHeaderVisible` state) | Dead (W9). |
| `Dashboard.tsx:415-420` (empty sticky div) | Dead (W9). |
| `Dashboard.tsx:174,791-795` (`CreateRFQDialog` mount + state) | Dead (W10). |
| `ProductQuickView.tsx:30-77` (hardcoded ButtonModel/ZipperModel/HardwareModel) | After Phase E consolidates 3D rendering, these primitive demos retire. |
