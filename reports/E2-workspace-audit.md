# E2 — Designer Studio workspace audit

What the editor exposes today, who it is for, and what a docked workspace would
cost. Written 2026-09-23 against `main` at `1c40229` (Phase 6b, Phase 6 closed).

Read for this audit: `src/features/editor/**`, `src/pages/DesignerStudio*.tsx`,
`docs/3d-editor/**`, and — for §4 only — the selectors in
`scripts/e2e-local/**`. No code was changed. The CMS-side panels are named from
`STATUS.md` and from the scenario ids that drive them, not read.

---

## 1. Function inventory

The editor is one shell (`EditorShell`): a viewport column on the left and a
fixed 360 px panel on the right, stacked on small screens with the panel capped
at 60 % height. Everything below lives in one of those two columns.

Visibility legend: **A** always visible · **D** behind a disclosure · **S** in a
sheet opened from the panel · **C** contextual (only with a selection) · **R**
role-gated · **CMS** only on the catalogue-editor path.

### 1.1 The whole design — `EditorPanel`

| Control | Test id | Where | Vis |
|---|---|---|---|
| Product name, item code | — | Product group | A |
| Size variant | `#size-<variantId>` (DOM id, **no test id**) | Product group | A, only if the product has variants |
| Selected finish swatch, marketing name, axis line, disclaimer | — | Finish group | A (metal only) |
| Change finish → finish picker (rail, facets, swatch grid) | button by label `/change finish/i` (**no test id**), `finish-picker`, `finish-rail`, `finish-swatch` | Sheet, right | S |
| Product colour | `colour-swatch` | Colour group | A (non-metal only) |
| Output | — (`PanelGroup` with **no children**) | Output group | A — an empty box today |
| Autosave state | `autosave-status` (`data-status`) | Panel header | A when not idle |
| Undo / redo | `undo`, `redo` | **Branding** group header | A |
| Sign-in banner | — | `EditorShell` banner slot | A, anonymous new-design path only |
| Not-found / no-model / awaiting-setup empty states | `editor-awaiting-setup` | Replaces the viewport | A |
| "Open the CMS to finish setup" link | — | Awaiting-setup state | R (catalogue editor) |

Keyboard: undo/redo shortcuts are bound globally by `BrandingGroup`
(`useUndoShortcuts`), so document history is owned by a layer group.

### 1.2 The selected layer — `BrandingGroup`, `PositionAndCurve`

| Control | Test id | Where | Vis |
|---|---|---|---|
| Add text | `add-text` | Branding header | A |
| Add logo (file picker; `.svg` always, `.png/.jpg` signed in) | `add-logo`, `logo-input`, `logo-error`, `logo-anonymous-note` | Branding header | A |
| Layer list, drag to reorder | `text-layers`, `text-layer-row` (`data-layer-id`, `data-selected`), `text-layer-handle` | Branding group | A |
| Select / delete a layer | `text-layer-select`, `text-layer-delete` | Layer row | A |
| Logo thumbnail | `logo-thumbnail` (`data-kind`) | Layer row | A on logo layers |
| Relief type (Raised · Engraved · Printed) | `layer-relief`, `relief-type`, `relief-raster-reason` | Layer row | A |
| Depth mm | `relief-depth-input` | Layer row | A, hidden on printed |
| Appearance (Same as button · Plated · Paint · Printed) | `layer-appearance`, `appearance-control`, `appearance-mode`, `appearance-swatch` | Layer row | A |
| Choose a plating / paint | `appearance-choose` → `appearance-picker` + `finish-swatch` | Sheet | S |
| Custom colour (Pantone, on-screen pick, hex) | `appearance-custom-open`, `custom-colour-panel`, `custom-pantone`, `custom-pick`, `custom-hex`, `custom-apply`, `custom-colour-hint` | Layer row popover | D |
| Raster note (ink picker suppressed) | `appearance-raster-note` | Layer row | A on raster layers |
| Text content | `text-layer-content` | Layer editor | C |
| Layout (Straight · Circle) | `text-layer-layout` | Layer editor | C |
| Font | `text-layer-font` | Layer editor | C |
| Position and curve | `position-and-curve`, `position-and-curve-toggle` | Layer editor | C + D |
| Radius, arc start/end, arc position, arc side | `pc-radius`, `pc-arc-range`, `pc-arc-position`, `pc-arc` | Position and curve | C + D, circle layout only |
| Centre X / Y, rotation | `pc-centre-x`, `pc-centre-y`, `pc-rotation` | Position and curve | C + D |
| Text size, letter spacing, baseline offset | `pc-text-size`, `pc-letter-spacing`, `pc-baseline` | Position and curve | C + D |
| Bevel | `pc-bevel` | Position and curve | C + D |
| Logo width (+ height read-out) | `pc-logo-width`, `pc-logo-height` | Position and curve | C + D, logo layers |

Every slider is a triple — label, numeric input (`<id>-input`), track
(`<id>-track`, `-handle`, `-badge`) — so each row is three test ids deep.

### 1.3 A zone — `ZonesSection`

| Control | Test id | Where | Vis |
|---|---|---|---|
| Add zone → plane · parts · paint | `add-zone` (a `<details>` menu), `add-zone-plane`, `add-zone-groups`, `add-zone-paint` | Branding header | A + D |
| Zone row: name, method label, delete | `zone-row` (`data-zone-id`, `data-method`), `zone-name`, `zone-delete` | Branding group | A once a zone exists |
| Plane height, side | `zone-plane`, `zone-side` | Zone row | A on plane zones |
| Part picker | `zone-parts`, `zone-part` | Zone row | A on part zones |
| Brush radius, arm the brush, face count | `zone-brush`, `zone-paint-toggle`, `zone-face-count` | Zone row | A on paint zones |
| Zone appearance (plated · paint only) | `appearance-control` inside the row | Zone row | A |

A zone's own geometry is edited **on the model**, not in the panel: the brush
paints on pointer-down/move in the viewport while `zone-paint-toggle` is armed.

### 1.4 A part — `PartsGroup`

| Control | Test id | Where | Vis |
|---|---|---|---|
| Parts disclosure + hidden-count summary | `parts-group`, `parts-toggle`, `parts-summary` | Panel | A (header) |
| Part row: name, face count, show/hide | `parts-list`, `part-row` (`data-index`, `data-visible`), `part-visibility` | Parts list | D |
| Original lettering row | `part-row-lettering` | Parts list | D, only where the CMS has marked lettering |

Rows are raw OBJ group names (`object_1` … `object_33` on the Polo). There is no
part selection, no hover-highlight and no isolate — hide is the only verb.

### 1.5 The viewport — `EditorViewport` and overlays

| Control | Test id | Vis |
|---|---|---|
| Orbit / zoom (drag, wheel), idle auto-rotate until first interaction | — | A |
| Reset framing — **double-click only**, no button | — | A |
| Ruler | `ruler-toggle`, `ruler-labels` | A, bottom-right corner |
| On-model handles: move, radius, arc position, size | `layer-handles`, `handle-move`, `handle-radius`, `handle-arc`, `handle-size` | C (a layer is selected) |
| Brush painting | — | C (a paint zone is armed) |
| Manufacturing strip | `manufacturing-strip`, `manufacturing-warning`, `manufacturing-info`, `manufacturing-no-thresholds` | A, under the viewport |
| Scene read-backs (`data-parts`, `data-zones`, `data-occlusion`, …) | on `editor-viewport` | A, invisible |
| `?calibration=1` hides all viewport chrome and the strip | — | A |

There is **no floating toolbar**: `EditorViewport`'s own docstring records it as
a ruling ("R2: no floating toolbar over the viewport — tools arrive with their
phases"), and two scenarios assert `viewport-toolbar` is absent.

### 1.6 The CMS path

Reached from the editor only through the awaiting-setup link. The model panel in
the admin product editor owns model upload, scale proposal and confirm,
two-point calibration, the model preview and the branding-group marks
(`model-scale-preview-toggle`, `model-scale-two-point-toggle`,
`model-branding-toggle`, `model-branding-sentence`). Those decide what the
editor can show at all — an unconfirmed scale replaces the whole viewport with
the awaiting-setup state — but none of them are in the editor's own panel.

---

## 2. Personas

### 2.1 A buyer branding a catalogue product

Enters from the catalogue card (`studio-open-editor`), often signed out.

**Touches:** size, finish or colour, Add text, the text content and font, layout,
Position and curve (or the on-model handles), relief type and depth, appearance,
the ruler, the manufacturing strip, undo/redo, the sign-in banner.

**Noise:** the Parts list — 33 rows called `object_11` mean nothing to someone
buying a button; zones, mostly (a buyer wants "gold rim" as a preset, not a
plane slider and a brush radius); the original-lettering row (it shows a factory
sample's branding, which is not theirs); bevel; brush radius; face counts;
print-stroke thresholds phrased as process minimums.

The panel's own order is right for this persona and should not change.

### 2.2 A WIN-CYC salesperson configuring for a customer

Signed in, staff, working with a customer on a call or in a showroom. Wants
options side by side and an answer to "can you make this".

**Touches:** everything the buyer touches, plus zones (two-tone is the thing
being sold), the parts list as a way to show a variant with a component hidden,
custom colour with its "WIN-CYC to confirm" label, and the strip as the
feasibility verdict. Wants what does not exist yet: named versions, duplicate,
compare, and an Output that produces a quote or a spec sheet.

**Noise:** raw OBJ group names; bevel; brush radius fine-tuning; face counts;
occlusion timings; anything about model scale.

This persona is the reason the workspace is worth building: they are the only
one who works on several designs at once, and the current single column has no
place to put a version list.

### 2.3 A catalogue editor calibrating an upload

Signed in, catalogue-editor role, checking that an uploaded model reads
correctly before it is sold.

**Touches:** the awaiting-setup link back to the CMS, then — once confirmed —
the ruler, the parts list (are the groups sane, does hiding one leave a hole),
the original-lettering row, the size variants (does the model rescale), face
counts, and the viewport's read-backs.

**Noise:** the whole branding stack (text, logo, appearance, position and
curve), zones, the manufacturing strip, autosave — they are not making a design,
they are checking a file. Today they get the buyer's panel with the buyer's
groups and have to ignore four-fifths of it.

---

## 3. Proposed layout

The proposal, as given: a Layers dock always visible; one contextual Properties
panel; floating ruler / undo / reset over the viewport; the manufacturing strip;
a collapsed Versions / Output panel; panels dockable to four edges, remembered
per user, with "Reset workspace".

### 3.1 At 1440 × 900

```
┌────────────────────────────────────────────────────────────────────────────────────────────────┐
│  WIN-CYC                                                              header  (--site-header)  │
├──────────────────┬──────────────────────────────────────────────────┬──────────────────────────┤
│ LAYERS      [+▾] │                                                  │ PROPERTIES          [×]  │
│ ──────────────── │                                                  │ ──────────────────────── │
│ ▾ Branding   (3) │                                                  │  Text layer · "TIFFANY"  │
│   ⋮⋮ TIFFANY   ×│                                                  │  ┌────────────────────┐  │
│   ⋮⋮ BLUE      ×│                    ● ● ●                         │  │ Text  [TIFFANY   ] │  │
│   ⋮⋮ ▣ logo.svg×│                 ●         ●                      │  │ Font  [Serif    ▾] │  │
│ ▾ Zones      (2) │                ●   ◆◆◆◆◆   ●                    │  │ Layout ▣Straight   │  │
│   ◧ rim          │                ●  ◆     ◆  ●                    │  │        □Circle     │  │
│   ◨ face   ⚠     │                 ●         ●                      │  └────────────────────┘  │
│ ▸ Parts     (33) │                    ● ● ●                         │  Relief                  │
│   1 hidden       │                                                  │  ▣Raised □Engraved □Ink  │
│                  │                                                  │  Depth   [0.30] mm       │
│                  │                                                  │  Appearance              │
│                  │                                                  │  ▪ Bright Nickel   [▾]   │
│                  │                                          ┌─────┐ │  ▾ Position and curve    │
│                  │                                          │ ⤾ ⤿ │ │    Radius   ▭──── 3.78  │
│                  │                                          │ ⟲ ⤢ │ │    Arc pos  ──▭── 224°  │
│                  │                                          │ ⌗   │ │    Size     ─▭─── 1.30  │
│                  │                                          └─────┘ │    Spacing  ──▭── 0.10  │
├──────────────────┴──────────────────────────────────────────────────┴──────────────────────────┤
│ ⚠ Printed stroke 0.12 mm — below the 0.35 mm minimum for painting        CHECK  2 ⚠   [▴]      │
├────────────────────────────────────────────────────────────────────────────────────────────────┤
│ ▸ VERSIONS / OUTPUT                                                              Saved 12:04   │
└────────────────────────────────────────────────────────────────────────────────────────────────┘
   264 px             flexible                                          320 px
```

### 3.2 At 1920 × 1080

Same three zones; the extra width goes to the viewport, and the Versions /
Output panel can sit open as a right-hand rail without squeezing Properties.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  WIN-CYC                                                                                    header               │
├────────────────────┬───────────────────────────────────────────────────────┬─────────────────┬──────────────────┤
│ LAYERS        [+▾] │                                                       │ PROPERTIES  [×] │ VERSIONS    [▸]  │
│ ────────────────── │                                                       │ ─────────────── │ ──────────────── │
│ ▾ Branding     (3) │                                                       │ Zone · "rim"    │ ● Working draft  │
│   ⋮⋮ TIFFANY     × │                                                       │ Method  Plane   │ ○ Option A 11:20 │
│   ⋮⋮ BLUE        × │                      ● ● ● ● ●                        │ Height  ▭── 2.1 │ ○ Option B 11:48 │
│   ⋮⋮ ▣ logo.svg  × │                   ●             ●                     │ Side ▣Above     │ ───────────────  │
│ ▾ Zones        (2) │                  ●    ◆◆◆◆◆◆◆    ●                    │      □Below     │ OUTPUT           │
│   ◧ rim            │                 ●   ◆         ◆   ●                   │ Appearance      │ Request quote    │
│   ◨ face       ⚠   │                  ●    ◆◆◆◆◆◆◆    ●                    │ ▪ Gold    [▾]   │ Request sample   │
│ ▾ Parts       (33) │                   ●             ●                     │ Faces   4 210   │ Spec sheet  (10) │
│   ◉ object_1       │                      ● ● ● ● ●                        │                 │ OBJ · GLB · STL  │
│   ◉ object_2       │                                                       │                 │       (12)       │
│   ◌ object_3   ⃠   │                                                       │                 │                  │
│   … 30 more        │                                              ┌─────┐  │                 │                  │
│   Original letters │                                              │ ⤾ ⤿ │  │                 │                  │
│                    │                                              │ ⟲ ⤢ │  │                 │                  │
│                    │                                              │ ⌗   │  │                 │                  │
│                    │                                              └─────┘  │                 │                  │
├────────────────────┴───────────────────────────────────────────────────────┴─────────────────┴──────────────────┤
│ ⚠ Zone 2 overlaps Zone 1 — the later zone is what gets made              CHECK  1 ⚠   [▴]                       │
└──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
   300 px                 flexible                                            360 px            280 px
```

### 3.3 At 390 × 844

No docking. One sheet under the viewport with three snap points (peek, half,
full) and a segmented control; the viewport never drops below ~200 px, which is
what the current mobile test already guards.

```
┌────────────────────────────────┐   ┌────────────────────────────────┐
│ WIN-CYC                  ☰     │   │ WIN-CYC                  ☰     │
├────────────────────────────────┤   ├────────────────────────────────┤
│                                │   │                                │
│              ● ● ●             │   │              ● ● ●             │
│           ●         ●          │   │           ●         ●          │
│          ●   ◆◆◆◆◆   ●         │   │          ●   ◆◆◆◆◆   ●         │
│          ●  ◆     ◆  ●         │   │                                │
│           ●         ●          │   ├────────────────────────────────┤
│              ● ● ●      ┌────┐ │   │ ══                             │
│                         │⤾ ⤿ │ │   │ [ Layers ][Properties][Check•] │
│                         │⟲ ⌗ │ │   │ ────────────────────────────── │
│                         └────┘ │   │ Text layer · "TIFFANY"         │
├────────────────────────────────┤   │ Text   [TIFFANY            ]   │
│ ⚠ 2                      [▴]   │   │ Font   [Serif            ▾]    │
├────────────────────────────────┤   │ Layout ▣ Straight  □ Circle    │
│ ══                             │   │ Relief ▣Raised □Engraved □Ink  │
│ [ Layers ][Properties][Check ] │   │ Depth  [0.30] mm               │
│ ────────────────────────────── │   │ Appearance ▪ Bright Nickel [▾] │
│ ▾ Branding                 (3) │   │ ▾ Position and curve           │
│   ⋮⋮ TIFFANY                 × │   │   Radius  ▭────────── 3.78 mm  │
│   ⋮⋮ BLUE                    × │   │   Arc pos ──────▭──── 224.8°   │
│   ⋮⋮ ▣ logo.svg              × │   │   Size    ───▭─────── 1.30 mm  │
│ ▾ Zones                    (2) │   │   Spacing ─────▭───── 0.10 mm  │
│ ▸ Parts                   (33) │   │                                │
└────────────────────────────────┘   └────────────────────────────────┘
        peek / Layers                        full / Properties
```

### 3.4 What I would change in the proposal, and why

1. **Drop four-edge docking; ship a left/right swap and collapse instead.**
   A 3D editor has two useful columns and one bottom strip. Docking a layer list
   to the top edge gives a short wide list nobody wants, and every extra edge
   multiplies the persisted state, the drag affordances, the keyboard order and
   the e2e surface. *Recommend* fixed zones with: dock side (left/right) per
   panel, collapse per panel, a drag-to-resize width per panel. Revisit free
   docking only if someone asks for it.
2. **Do the selection model before any of the layout.** There is no single
   selection today: `selectedLayerId`, `selectedZoneId` and `paintZoneId` are
   three fields, and a part cannot be selected at all. One contextual Properties
   panel is undefined until selection is one union — `{kind: "layer" | "zone" |
   "part" | null, id}` — with one setter and one reducer rule ("selecting
   anything clears the others"). This is the load-bearing change; the panels are
   presentation on top of it.
3. **The Layers dock must be sectioned, not flat.** The Polo is 33 groups; a real
   CAD upload (Phase 11) will be worse. Parts as peers of text layers makes the
   dock unreadable. *Recommend* three sections — Branding, Zones, Parts — each
   with a count, Parts collapsed by default, and virtualised past ~50 rows.
   Section state is part of "Reset workspace".
4. **Floating tools are view tools only.** Undo/redo are document verbs, they
   already have keyboard shortcuts, and the canvas is contested: the on-model
   handles (4i) and the ruler labels already have an overlap test that expects
   exactly six clashes. *Recommend* the floating cluster carry reset-view,
   zoom-to-fit, ruler and — while a paint zone is armed — the brush size, with
   undo/redo in a document bar beside the design name. Note this cluster
   contradicts `EditorViewport`'s standing "no floating toolbar" ruling and the
   two scenarios that assert `viewport-toolbar` is absent; that ruling has to be
   retired deliberately, not incidentally, and the cluster must be hidden under
   `?calibration=1` or every render-calibration measurement moves.
5. **Remember the workspace in `localStorage`, keyed by user id and a layout
   version.** It is a per-device preference — a 27-inch desk and a laptop want
   different widths — and a DB column means a migration, an RLS decision and a
   write on every drag. *Recommend* `wincyc:workspace:v1:<userId>`, with the
   version stamp so a later layout change invalidates stale saved states instead
   of restoring a dock that no longer exists.
6. **The strip stays a verdict, not a panel.** Keep it docked under the viewport,
   spanning the viewport and Properties, collapsible to a single line with a
   count badge (`CHECK 2 ⚠`). At 390 px it must collapse by default, or it eats
   the viewport it is judging.
7. **Ship the Versions / Output panel empty of controls, not empty of content.**
   Today `EditorPanel` renders an Output group with no children — a placeholder
   box, which 6b R6 explicitly ruled against elsewhere. *Recommend* deleting that
   group now and introducing the Versions / Output dock only when Phase 7 has
   something to put in it; until then the dock is not rendered at all.
8. **"Reset workspace" resets chrome, never the design.** Dock sides, widths,
   collapse and section state — not the selection, not the recipe, not the
   camera. Put it in a workspace menu in the document bar, next to the design
   name, and say in the confirm copy that the design is untouched.
9. **Give the panel's unlabelled controls test ids in the same unit.** The size
   variant is reached by DOM id (`#size-<id>`) and "Change finish" by its English
   label in six places including the deck. Those break on any re-parenting and on
   any copy change; they should be fixed before the layout moves, not during.

---

## 4. What breaks

### 4.1 Components that assume the single panel

| File | Assumption |
|---|---|
| `components/EditorShell.tsx` | The whole layout: `flex-col` → `lg:flex-row`, viewport then `panel`, one optional banner. Becomes the dock host. |
| `components/EditorPanel.tsx` | Owns the 360 px column, its scroll, the four `PanelGroup`s, the autosave line and the finish sheet. Splits three ways (document controls, dock, properties). |
| `components/branding/BrandingGroup.tsx` | 600 lines holding the add buttons, undo/redo, the zone list, the layer list **and** the selected layer's editor in one box. Must split into a list component and a properties component; undo/redo and the global shortcut hook move out. |
| `components/PartsGroup.tsx` | Its own disclosure and hidden-count summary — both disappear when Parts becomes a dock section. |
| `components/branding/ZonesSection.tsx` | `AddZoneButton` is a `<details>` menu inside the Branding header; `ZoneList` renders rows and their properties in the same row. Rows go to the dock, properties to the panel. |
| `components/branding/PositionAndCurve.tsx` | Its own disclosure, with state per mounted layer (the deck script already works around the state being per row). In a Properties panel the disclosure is probably wrong — the panel is already contextual. |
| `components/branding/AppearanceControl.tsx` | Opens a sheet and an inline custom-colour popover from inside a row; the popover assumes a narrow column. |
| `components/ManufacturingStrip.tsx` | Rendered as a sibling of the viewport, so it spans the viewport's width only. Full-width and collapsible changes both. |
| `components/EditorViewport.tsx` | Owns the bottom-right ruler corner, the strip, and the "no floating toolbar" ruling; `?calibration=1` suppression must cover the new chrome. |
| `components/RulerOverlay.tsx`, `branding/Handles.tsx` | Overlay geometry competes with a floating cluster for the same corners. |
| `pages/EditorDesignPage.tsx`, `pages/EditorNewPage.tsx` | Both compose `EditorShell` with `viewport=` and `panel=` and pass nine props into `EditorPanel`. |
| `store/useEditorStore.ts` | Three selection-ish fields and no part selection (§3.4 item 2). |
| `pages/DesignerStudio.tsx`, `DesignerStudioWorkspace.tsx`, `DesignerStudioTrimLibrary.tsx` | Entry points only (`studio-open-editor`, `editorUrlForProduct`) — unaffected. |

### 4.2 Scenarios that select by panel structure

Out of 46 scenarios, **19 touch editor-panel ids**; the other 27 (admin CMS,
catalogue, product pages) are unaffected. All nine `unit/*.test.mjs` are pure
modules and unaffected.

**Highest fan-in first.** `lib/appearance.mjs` is the shared driver
(`addSampleText` → `add-text`, `text-layer-content`, `position-and-curve-toggle`,
`text-layer-layout`, `pc-text-size-input`; `setMode`/`pickLayerFinish` →
`appearance-mode`, `appearance-choose`, `appearance-picker`). It is used by
`appearance-plated`, `appearance-paint`, `appearance-printed`, `custom-colour`,
`parts-list` and `zones` — six scenarios break together on any change to the
layer row or the position disclosure.

Ordinal and nesting selectors — these break when rows move, are grouped, or
change default selection:

- `logo-layer.mjs:283` and `deck/shots.mjs:367` — `text-layer-row` `.nth(1)` →
  nested `text-layer-delete`.
- `text-layer.mjs:132, 190` — "the new layer is row 0", reorder by
  `text-layer-handle.nth(1)`.
- `zones.mjs:45, 51, 61, 85, 101, 146` — `zone-row.last()` → nested
  `appearance-mode` / `appearance-choose` / `zone-side`; and a bare
  `zone-row → zone-delete` that is only unambiguous while exactly one zone
  exists.
- `parts-list.mjs:40-43, 50-52, 63` — `part-row.first()`, row → `part-visibility`,
  and a row count compared against the viewport's `data-parts` length.
- `appearance-printed.mjs:49, 102, 127-132`, `relief-layers.mjs:206`,
  `circular-text.mjs:194`, `text-layer.mjs:156, 168, 213`, `custom-colour.mjs:59`,
  `deck/shots.mjs:403, 501` — `.first()` on `layer-appearance`,
  `text-layer-select`, `appearance-swatch`, `layer-relief`.
- `relief-layers.mjs:98-104, 168, 174` — strip lines by `.nth(i)`, with the exact
  line order and count asserted.
- CSS descendant chains on un-testid'd children: `text-layer-layout [data-value]`
  (`lib/appearance.mjs:168`, `hybrid-controls.mjs:167`, `drag-handles.mjs:140,
  266`), `pc-arc [data-value]` (`hybrid-controls.mjs:172, 248`,
  `deck/shots.mjs:332`), `appearance-picker finish-swatch`
  (`lib/appearance.mjs:184`, `zones.mjs:52`, `appearance-paint.mjs:75`,
  `appearance-plated.mjs:69`).
- Label- and id-only entry points: `getByRole("button", {name:/change finish/i})`
  (`parts-list.mjs:85`, `finish-picker.mjs:150, 178`, `lib/calibration.mjs:270`,
  `deck/shots.mjs:287, 302, 506`), `#size-<variantId>` (`editor-scale.mjs:127`),
  page-wide `getByRole("radio", {name:/15mm/})` (`text-layer.mjs:201`).
- Single-instance assumptions: bare `undo` / `redo` with `isDisabled()`
  (`drag-handles.mjs:133`, `relief-layers.mjs:156-162`) break if a toolbar
  duplicates them; `page.locator("canvas").first()` (`editor-shell.mjs:79, 114`,
  `finish-picker.mjs:143`) breaks if any panel ever hosts a preview canvas;
  `hybrid-controls.mjs:180` matches `[data-testid*="fill"]` across the whole
  page.

Container-ownership and text assertions — these are the ones that *should* fail
loudly, and need rewriting rather than patching:

- `editor-shell.mjs:81-90` — `editor-panel.innerText()` matched against
  `/Product/`, `/Finish|Colour/`, `/Branding/`, `/Output/`: it asserts the four
  group headings, in one column, in text order.
- `finish-picker.mjs:144, 147, 164-166` — the same panel-text approach plus
  `doesNotMatch(/^Finish$/m)` for a non-metal product.
- `ruler-buyer.mjs:94-95` — the ruler toggle is in the viewport and **not** in
  the panel. Keep this true (§3.4 item 4) and it survives.
- `parts-list.mjs:38` — `original-lettering-toggle` count 0.
- `text-layer.mjs:125-128` — `branding-group` must **not** contain the words
  emboss / deboss / fill / depth.
- `render-calibration.mjs:140`, `finish-picker.mjs` — `viewport-toolbar` count 0.

Layout assertions:

- `hybrid-controls.mjs:256-277` — the only direct panel-geometry test: at
  390 × 844 the panel's top must be at or below the viewport's bottom, the page
  must not scroll horizontally, the viewport must stay ≥ 200 px, and nothing
  inside `position-and-curve` may overflow. Any mobile reflow rewrites it.
- Ruler-label / handle overlap counts (`branding-defaults.mjs:243-262` expects
  exactly six clashes, plus `logo-layer.mjs:271-278`, `drag-handles.mjs:255-260`,
  `ruler-buyer.mjs:114-122`) — a floating cluster in a corner changes them.
- Fixed viewport sizes that the 360 px column's behaviour is measured at:
  1280 × 900 in ten scenarios, 1280 × 720, 1280 × 680 (pinned in
  `lib/calibration.mjs:251` to reproduce a 920 × 599 canvas), 1440 × 900,
  390 × 844.

Deck: `deck/run.mjs` shoots at 1440 × 900 and `deck/shots.mjs` takes full-window
screenshots with a pixel-stddev ≥ 3 check, so **every editor shot frames the
panel**. The ones that are *about* the panel: `02-editor-first-open` (its caption
names the four groups), `08-position-curve`, `13-layers-list` (three rows plus
reorder/delete/undo/redo, set up by ordinal selectors), `25-manufacturing-strip`,
`15-mobile` (its caption is the stacking contract), `15c-mobile-text-layer`
(scrolls an ordinal `layer-relief` into view). All need re-shooting in the same
unit that moves the layout.

### 4.3 i18n keys

Today's editor namespaces: `editor.branding` (37 uses), `editor.appearance` (13),
`editor.zones` (9), `editor.parts` (7), `editor.viewport` (5), `editor.panel` (5),
`editor.new` (5), `editor.handles` (4), `editor.finish` (4), `editor.autosave` (3),
`editor.signIn` (2), `editor.manufacturing` (2), `editor.design` (2),
`editor.ruler`, `editor.colour`, `editor.common`.

- **Re-homed, same strings:** `editor.panel.product`, `.finish`, `.colour`,
  `.branding` become dock section and properties headings.
- **Retired:** `editor.panel.output` if the empty group goes (§3.4 item 7) —
  or kept and reused as the Versions / Output dock title.
  `editor.parts.title`, `.allShown`, `.hiddenCount` lose their disclosure
  summary; the counts move to a section badge, which needs a shorter form.
- **Unchanged:** every `editor.branding.*` field label, `editor.appearance.*`,
  `editor.zones.*` control labels, `editor.handles.*`, `editor.manufacturing.*`.
- **New, ×3 locales (≈ 14 keys):** dock title; Properties title and its empty
  state ("Select a layer, zone or part"); the three segmented labels for 390 px
  (Layers / Properties / Check); Check summary count; collapse / expand labels;
  dock-left / dock-right; Reset workspace and its confirm copy; reset view;
  zoom to fit; brush size.

---

## 5. Build plan

Each unit is one commit-sized change with its own read-backs.

| # | Unit | Scope | Files |
|---|---|---|---|
| U1 | **One selection** | Replace `selectedLayerId` / `selectedZoneId` with a `selection` union and make parts selectable; keep `paintZoneId` as arming state only. | `store/useEditorStore.ts`, `components/branding/BrandingGroup.tsx`, `ZonesSection.tsx`, `PartsGroup.tsx`, `EditorViewport.tsx`, `EditorModel.tsx` |
| U2 | **Split the branding box** | `BrandingGroup` → `LayerList` (rows, add buttons, drag) + `LayerProperties` (editor, relief, appearance, position); no layout change, no new ids. | `components/branding/*`, `EditorPanel.tsx` |
| U3 | **Stable selectors** | Test ids for the size radios and Change finish; replace ordinal and CSS-descendant selectors in the suite with id- and `data-*`-based ones; no UI change. | `scripts/e2e-local/lib/appearance.mjs`, `calibration.mjs`, 19 scenarios, `deck/shots.mjs`, plus ids in `EditorPanel.tsx` |
| U4 | **Workspace shell** | Dock host with left/right placement, collapse, resize, `localStorage` persistence keyed by user + layout version, Reset workspace. | `components/EditorShell.tsx` (new `WorkspaceShell`), new `components/workspace/*`, `pages/EditorDesignPage.tsx`, `EditorNewPage.tsx` |
| U5 | **Layers dock** | Sectioned list (Branding / Zones / Parts) with counts, Parts collapsed, virtualised past ~50 rows. | `components/workspace/LayersDock.tsx`, `branding/LayerList.tsx`, `PartsGroup.tsx`, `ZonesSection.tsx` |
| U6 | **Properties panel** | Routes on `selection.kind` to layer, zone or part properties; empty state; the finish / appearance sheets open from here. | `components/workspace/PropertiesPanel.tsx`, `branding/LayerProperties.tsx`, `AppearanceControl.tsx`, part properties (new) |
| U7 | **Document bar** | Design name, autosave, undo / redo, workspace menu — the home for everything that is not a selection. | `components/workspace/DocumentBar.tsx`, `EditorPanel.tsx` (remove), `BrandingGroup.tsx` (history out) |
| U8 | **Versions / Output socket** | The collapsed dock itself, rendered only when it has content; delete the empty Output group. | `components/workspace/OutputDock.tsx`, `EditorPanel.tsx`, `translations.ts` |
| U9 | **Floating view tools** | Reset view, zoom to fit, ruler, brush size; retire the "no floating toolbar" ruling; hidden under `?calibration=1`. | `components/EditorViewport.tsx`, `RulerToggle.tsx`, new `ViewportTools.tsx`, `scenarios/render-calibration.mjs`, `finish-picker.mjs` |
| U10 | **Strip as a verdict** | Full width under viewport + properties, collapsible with a count badge, collapsed by default on small screens. | `components/ManufacturingStrip.tsx`, `EditorViewport.tsx`, `scenarios/relief-layers.mjs` |
| U11 | **390 px sheet** | Bottom sheet with three snap points and the segmented control; viewport floor kept at 200 px. | `components/workspace/*`, `scenarios/hybrid-controls.mjs` (the geometry block) |
| U12 | **Deck and docs** | Re-shoot every editor shot; record the workspace rulings. | `scripts/e2e-local/deck/shots.mjs`, `docs/3d-editor/STATUS.md` |
| U13 | **Free docking** (optional) | Four-edge docking and drag-to-dock, if U4's fixed zones prove insufficient. | `components/workspace/*` |

**Must precede Phase 7a (named versions, snapshot, reload):** U1, U2, U3, U4,
U6, U8. 7a needs a place to put a version list and a selection model that
survives loading a version; building it into today's single column means
building its UI twice, and U3 is what keeps the suite from becoming the
bottleneck for all of them.

**Can follow 7a:** U5 (the dock can ship flat-but-sectioned first), U7, U9, U10,
U11, U12, U13. U12 should follow whichever unit lands last before the deck is
next shown.

---

## Open questions

1. **Where does the workspace state live?** *Recommend* `localStorage` keyed by
   user id with a layout version stamp; it is a per-device preference and needs
   no migration. Move it to a `profiles` column only if WIN-CYC wants a
   salesperson's layout to follow them between machines.
2. **Are parts peers of layers in the dock?** *Recommend* a separate section,
   collapsed, with a count and virtualisation past ~50 rows — a 33-group Polo is
   already too many rows, and Phase 11's uploads will be worse.
3. **The empty Output group.** *Recommend* deleting it in U8 rather than carrying
   a placeholder box that 6b R6 would not have allowed anywhere else.
4. **Does 7a wait for the workspace?** *Recommend* yes — U1–U4, U6, U8 first.
   The alternative is a version list in the current column that is rebuilt a
   month later.
5. **The "no floating toolbar" ruling.** *Recommend* retiring it explicitly in
   U9's commit message and STATUS entry, keeping the cluster to view tools, and
   keeping it out of `?calibration=1` so the render baselines stay comparable.
6. **The ruler's owner.** *Recommend* leaving the toggle in the viewport cluster
   — the suite asserts it is not in the panel, and that assertion is worth
   keeping as the boundary between view tools and document controls.
7. **Reports in git.** `E0` and `E1` are untracked in this repo; this file is
   committed on its own as asked. *Recommend* deciding once whether
   `reports/*.md` are tracked artefacts or scratch, and applying it to all three.
