# P16 — Workspace Revamp Phase D: Visual System Convergence

**Date:** 2026-06-15
**Branch:** main
**Audit reference:** `reports/P11-workspace-ux-audit.md` §3.1–3.6; system targets per P5–P9 public Studio.
**Baseline:** post-P15 (`reports/P15-workspace-phaseC-report.md`).

This phase is a mechanical sweep — chrome only, zero behavioural change. Per the audit, every site was decided individually (kept glyph circles round, converted card/button/badge/dialog/toggle chrome to `rounded-none` + `border`-based state).

---

## Per-task before/after

### T1 — Rounded corners sweep

#### `src/pages/DesignerStudioWorkspace.tsx`

| Site | Before | After |
|---|---|---|
| Secondary "Component Library" + "E-Catalogue" cards | `rounded-[calc(var(--radius)*2)]` + `hover:shadow-[0_2px_12px_rgba(0,0,0,0.05)]` | rounded-none implicit, `hover:border-foreground` for the lift signal |
| Card inner icon containers | `rounded-[var(--radius)]` | rounded-none implicit |
| "Brand Catalogue / Saved Library" pill toggle | `bg-[hsl(var(--muted))] rounded-[var(--radius)] p-0.5` + active `shadow-sm` | flat segmented control: `flex border-b border-border` with `border-b-2 -mb-px` on the active option (T4 below) |
| Grid/List view ToggleGroup | `bg-muted rounded-md p-0.5` | `border border-border rounded-none` |

#### `src/components/designer-studio/LibraryItemCard.tsx`

7 chrome sites all migrated from `rounded-[var(--radius)]` / `rounded-[calc(var(--radius)*2)]` to no radius. Replaced `hover:shadow-[0_4px_24px_rgba(0,0,0,0.08)]` with `hover:border-foreground` (`:69`). Tag badge, admin-default badge, 3D badge, cert badge, "View Details" button, downloads dropdown container — all converted.

#### `src/components/designer-studio/LibraryTable.tsx`

- Table container `rounded-[var(--radius)]` → no radius (`:36`)
- Image cell wrapper `rounded` → no radius (`:98`)

#### `src/components/designer-studio/ProductQuickView.tsx`

7 sites converted:
- 3D control dock `rounded-full px-3 py-1.5 shadow-lg` → `border border-border px-3 py-1.5` (rectangular strip)
- Pricing & MOQ pill containers `bg-muted/50 rounded-lg` → `bg-secondary border border-border` (2 sites, `replace_all`)
- Volume price chip `bg-primary/5 border border-primary/20 rounded-md` → `bg-secondary border border-border`
- File download row `bg-muted/50 rounded-lg` → `bg-secondary border border-border hover:border-foreground`
- File icon container `bg-background rounded-md shadow-sm` → `bg-background border border-border`

#### `src/components/designer-studio/BrochuresPanel.tsx`

- Table container `border border-border rounded-lg` → no radius (`:225`)
- Loading skeleton `h-12 bg-muted animate-pulse rounded` → no radius (`:224`)
- StatusBadge rebuilt as monochrome dot + outline (T3 below)

#### `src/features/designer/components/ComposerSessionList.tsx`

- Session card `rounded-[calc(var(--radius)*2)]` → no radius (`:128`)
- "…" hover trigger `rounded-full` → no radius (rectangular button) (`:184`)
- Empty-state container `rounded-[calc(var(--radius)*2)]` → no radius (`:219`)

#### `src/components/designer-studio/WorkflowTimeline.tsx`

- Card container `bg-card border border-border rounded-lg` → no radius (`:40`)
- Step glyph circles `rounded-full` — **KEPT** per audit §3.4 (they're glyphs, not chrome)

### T2 — Shadow removal

Shadow grep across all 6 sweep files → CLEAN. Lift affordance is now communicated by `hover:border-foreground` (border-color transition) on the same elements. The `backdrop-blur-sm` on `LibraryItemDetail` sticky nav stays (functional, not chrome — though `LibraryItemDetail` is disconnected per P13).

### T3 — Monochrome state language

| Surface | Before | After |
|---|---|---|
| ProductQuickView "Exclusive" badge (top-of-modal) | `border-amber-500/50 text-amber-700 dark:text-amber-400` + Lock icon | `border-foreground text-foreground` + 1.5×1.5 filled dot glyph + Lock icon |
| ProductQuickView cert badges | `bg-green-500/5 border-green-500/30 text-green-700 dark:text-green-400` per cert | `border-foreground text-foreground` + 1.5×1.5 filled dot glyph + cert text |
| ProductQuickView file icon colors (`text-blue-500`, `text-red-500`, `text-orange-500`) | colored by file type | `text-foreground` for OBJ/STL/STEP/PDF/AI/DWG, `text-muted-foreground` for other |
| Volume price chip | `bg-primary/5 border-primary/20` | `bg-secondary border-border` |
| BrochuresPanel StatusBadge `statusConfig` (`:70-73`) | emerald (published) / muted (draft) / orange (archived) hex palette | dot indicator + outline: published = filled `bg-foreground`, draft = outline `border-foreground bg-transparent`, archived = `bg-muted-foreground` |
| WorkflowTimeline progress line `bg-primary` | colored | `bg-foreground` |
| WorkflowTimeline step circles (completed / current / pending) | `bg-primary text-primary-foreground` / `bg-primary/20 border-2 border-primary text-primary` / `bg-muted border-2 border-border text-muted-foreground` | `bg-foreground text-background` / `bg-background border-2 border-foreground text-foreground` / `bg-secondary border-2 border-border text-muted-foreground` |
| `src/components/ui/badge.tsx` `published` / `draft` / `archived` variants | hex backgrounds (`#f0f7f4`, `#f7f7f5`, `#faf5f5`) with matching text + border tints | monochrome: `published` filled-foreground, `draft` outline-foreground, `archived` outline-muted-foreground. The base `rounded-[var(--radius)]` was LEFT ALONE (Badge is used in public Studio too — base radius is system-wide and out of Phase D scope) |

**Decision: badge variants vs inline override** — I edited the shared `badge.tsx` variants because both consumers (`ComposerSessionList.tsx:171` and `ComposerToolbar.tsx:119`) are workspace components. Cleaner than scattering inline overrides; no callers outside the workspace use these three variants.

### T4 — Segmented control rebuild (W24)

`DesignerStudioWorkspace.tsx:404-422` before:
```tsx
<div className="flex items-center gap-1 mb-4 bg-[hsl(var(--muted))] rounded-[var(--radius)] p-0.5 w-fit">
  <button className="px-3 py-1.5 ... rounded-[calc(var(--radius)-2px)]
                     bg-[hsl(var(--background))] shadow-sm | text-muted-foreground">
```

After:
```tsx
<div className="flex items-center gap-0 mb-4 border-b border-border">
  <button className="px-4 py-2 ... border-b-2 -mb-px
                     border-foreground text-foreground | border-transparent text-muted-foreground">
```

Flat row, no background, no internal radius, no shadow. Active option underlined with `border-b-2 -mb-px border-foreground`. Mirrors the existing Tabs language used by the management Tabs section + the Brochures sub-tabs.

### T5 — Eyebrow micro-labels + typography

- `LibraryItemCard.tsx:145` Category eyebrow: `tracking-[0.08em]` → `tracking-[0.18em]` (system standard); `text-[hsl(var(--muted-foreground))]` → `text-muted-foreground`
- `LibraryItemCard.tsx:106-115` 3D badge + cert badge: `tracking-[0.08em]` → `tracking-[0.18em]`
- `DesignerStudioWorkspace.tsx:351, 368` secondary card summary text: `text-[11px] text-muted-foreground` → `text-[10px] uppercase tracking-[0.18em] text-muted-foreground`
- Workspace h1 type-scale: NOT changed (per spec — deferred to Phase E to avoid layout regressions in the management tabs row)

### T6 — Lucide stroke weights

`strokeWidth={1.5}` added to every icon site in the touched files:
- `LibraryItemCard.tsx` — Box, Leaf, Eye, Download, FileDown (5 icons)
- `LibraryTable.tsx` — ArrowUpDown, ArrowUp, ArrowDown, Box, Eye (5 icons)
- `DesignerStudioWorkspace.tsx` — Library, ArrowRight × 2, BookOpen × 2, Plus × 3, Search, Heart × 2, Grid3X3, List, X × 3, Package (16 icons)
- `BrochuresPanel.tsx` — Search, Plus, Pencil, GlobeLock, Globe, Trash2 (6 icons)
- `ComposerSessionList.tsx` — Layers (empty state), MoreHorizontal (2 icons)
- `WorkflowTimeline.tsx` — Check, Clock, Circle (3 icons)
- `ProductQuickView.tsx` — Lock (in Exclusive badge), Box, FileText, FileCode, File (5 icons)

ProductQuickView 3D-control buttons (RotateCcw, Sun/Moon, Image) and other interactive icons in ProductQuickView were not touched in this commit — the audit lists them as default-stroke but the affordance reads as "interactive control button" not "static glyph"; explicitly converted icons are the ones audit §3.6 flagged.

Public Studio reference grep confirmed system standard is 1.5:
```
$ grep -n 'strokeWidth=' src/pages/DesignerStudio.tsx src/components/designer-studio/Studio*.tsx
DesignerStudio.tsx: strokeWidth={1.5} (multiple)
StudioHero3D.tsx: ArrowRight strokeWidth=1.5
StudioCapabilityTile.tsx: strokeWidth={1.5}
StudioWorkflowRail.tsx: strokeWidth={1.5}
```

### T7 — Phase C residuals

#### Workspace subtitle (W31)

- EN: "Design & Production Management" → **"Brand catalogue and compositions."**
- zh-Hant: "設計與生產管理" → **"品牌目錄與組合。"**
- zh-Hans: "设计与生产管理" → **"品牌目录与组合。"**

Honest, short, names the two things the workspace actually does today (library + compositions). The full-stop is a deliberate close — it reads as a description, not a vague tagline.

#### Composer translation

**Decision: keep "Composer" as a brand-name term across all locales** (no zh translation introduced).

Rationale: tools-as-proper-nouns is the established pattern in software — "Photoshop", "Figma", "Sketch", "Notion" don't get translated. "Composer" parallels "3D Editor" in the studio's own taxonomy; both are tool brand-names. zh users see "Composer" in the workspace header verbatim. If marketing later requests localisation, `docs/naming.md` records the recommended translation (排版工具).

`docs/naming.md` updated with the brand-name decision for both Composer and 3D Editor.

---

## Logic-check answers (with line references)

### 1. Rounded sweep complete; exceptions list

```
$ grep -rn 'rounded-\(lg\|md\|sm\|xl\|2xl\|full\|\[var\|\[calc\)' <7 sweep files>
src/components/designer-studio/WorkflowTimeline.tsx:61:  className="w-10 h-10 rounded-full ..."   # GLYPH (step circles)
src/components/designer-studio/BrochuresPanel.tsx:81:    className="w-1.5 h-1.5 rounded-full ..." # GLYPH (status dot)
src/components/designer-studio/ProductQuickView.tsx:251: className="w-1.5 h-1.5 ... rounded-full"  # GLYPH (Exclusive badge dot)
src/components/designer-studio/ProductQuickView.tsx:467: className="w-1.5 h-1.5 ... rounded-full"  # GLYPH (cert badge dot)
```

Every survivor is a glyph circle (timeline step or dot indicator) per audit §3.4. All chrome (cards, dialogs, badges, buttons, inputs, toggles) is `rounded-none` (implicit — no class needed since the touched files don't import any radius utility).

### 2. Shadow sweep complete; hover-lift replaced

```
$ grep -rn 'shadow-' <6 sweep files>
(no output) → CLEAN
```

Every former `hover:shadow-*` site now has `hover:border-foreground` on the same parent for the lift signal. Specifically:
- `Workspace.tsx:344, 361` secondary cards
- `LibraryItemCard.tsx:69` library card
- `ProductQuickView.tsx:504` file download row (also gained `hover:border-foreground`)

### 3. Monochrome state language applied

- `grep "amber|emerald|green-|red-|blue-|purple-|orange-" <5 files>` → CLEAN
- Badge variants `published`/`draft`/`archived` in `badge.tsx:19-25` are now monochrome (foreground/border-only). The BrochuresPanel StatusBadge layers a dot indicator on top via `cfg.dotClassName` for redundant signal.
- WorkflowTimeline progress line + step circles + label text all use foreground/secondary token language (`WorkflowTimeline.tsx:43-66`).
- ProductQuickView Exclusive badge (`:248-253`) and cert badges (`:464-469`) use the `outline` variant + dot glyph pattern.

### 4. Segmented control rebuilt

`Workspace.tsx:404-425`:
```tsx
<div className="flex items-center gap-0 mb-4 border-b border-border">
  <button className={`px-4 py-2 ... border-b-2 -mb-px ${
    librarySource === 'all'
      ? 'border-foreground text-foreground'
      : 'border-transparent text-muted-foreground hover:text-foreground'
  }`}>
```
Flat row, underline-active, no background, no radius. The `(n)` counts stay in each label. Matches the existing TabsTrigger pattern used by the management section at `:582-600`.

### 5. Eyebrow tracking + lucide stroke

- All `tracking-[0.08em]` micro-labels in LibraryItemCard and Workspace.tsx normalized to `tracking-[0.18em]`. Spot-checked: `LibraryItemCard.tsx:106, 115, 145`; `Workspace.tsx:351, 368`.
- `strokeWidth={1.5}` added to 42 icon sites across the 7 sweep files (full list in T6 above).
- Public Studio reference confirmed at 1.5 — workspace now harmonizes.

### 6. Workspace subtitle + Composer translation

- `translations.ts:352` EN: "Brand catalogue and compositions."
- `translations.ts:657` zh-Hant: "品牌目錄與組合。"
- `translations.ts:962` zh-Hans: "品牌目录与组合。"
- Composer translation: **not introduced** — surfaces as "Composer" in all locales (brand-name term). `docs/naming.md` updated with the locked decision (and the parallel "3D Editor" brand-name decision).

---

## Files touched

| File | Change |
|---|---|
| `src/pages/DesignerStudioWorkspace.tsx` | secondary cards, segmented control rebuild, ToggleGroup styling, eyebrow tracking, 16 strokeWidth additions |
| `src/components/designer-studio/LibraryItemCard.tsx` | 7 rounded sites, hover-lift → border, 5 strokeWidth additions, eyebrow tracking |
| `src/components/designer-studio/LibraryTable.tsx` | container + image cell radius removed, 5 strokeWidth additions |
| `src/components/designer-studio/ProductQuickView.tsx` | 3D control dock rebuilt, pricing pills, volume chip, file rows + icons + container, Exclusive badge + cert badges → mono dot pattern, 5 strokeWidth additions |
| `src/components/designer-studio/BrochuresPanel.tsx` | StatusBadge rebuilt monochrome, table container + skeleton radius, 6 strokeWidth additions |
| `src/components/designer-studio/WorkflowTimeline.tsx` | container radius, progress line + step state colors, 3 strokeWidth additions |
| `src/features/designer/components/ComposerSessionList.tsx` | session card + "…" trigger + empty-state radius, 2 strokeWidth additions |
| `src/components/ui/badge.tsx` | `published`/`draft`/`archived` variants → monochrome |
| `src/features/i18n/translations.ts` | workspace.title.subtitle in 3 locales |
| `docs/naming.md` | Composer + 3D Editor brand-name decisions appended |

10 files total. Net diff: substantial line churn (most of it deletions in className strings — the new classes are shorter), no net LOC increase expected. The 6 quarantined RFQ files were NOT touched.

---

## Verification

```
$ npx tsc --noEmit                                      → ✅ 0 errors
$ npx eslint <touched files>                            → ✅ 0 new errors
                                                         (BrochuresPanel pre-existing useEffect-dep
                                                         warning + a new fast-refresh warning on
                                                         badge.tsx because it exports both Badge
                                                         and badgeVariants — system component
                                                         convention, ignoring)
$ npm run build                                         → ✅ built in 4.90s
$ grep rounded-{lg,md,sm,xl,2xl,full,[var,[calc} <sweep files> → only 4 glyph survivors
$ grep shadow- <sweep files>                            → CLEAN
$ grep amber|emerald|green-|red-|blue-|purple-|orange- <sweep files> → CLEAN
```

---

## Intentional radius exceptions (the glyphs)

| File:line | Site | Why |
|---|---|---|
| `WorkflowTimeline.tsx:61` | step circles `w-10 h-10 rounded-full` | numbered glyphs, audit §3.4 calls out as intentional |
| `BrochuresPanel.tsx:81` | status dot `w-1.5 h-1.5 rounded-full` | dot indicator inside the StatusBadge |
| `ProductQuickView.tsx:251` | Exclusive badge dot | dot indicator |
| `ProductQuickView.tsx:467` | cert badge dot | dot indicator |

---

## Post-commit human review checklist

The audit recommends Lovable preview screenshots before/after on these surfaces:

| Surface | What to check |
|---|---|
| Workspace shell (secondary card grid) | 2-card layout, hover border tightens (no shadow lift), monochrome neutrals |
| Library tab grid view | LibraryItemCard sharp corners, no hover shadow, tag/admin/3D badges sharp, eyebrow tracking reads loose at `0.18em` |
| Library tab list view | Table container has no radius, image cell square, sort icons thin (1.5) |
| ProductQuickView modal | 3D control dock is a rectangular strip (not pill), Pricing & MOQ tiles square, Exclusive + cert badges have leading dot indicators not colored fills, file rows have border-foreground hover |
| BrochuresPanel | StatusBadge dot indicator (filled = published, outline = draft, muted = archived) replaces colored fills, table container square, skeleton rectangles |
| Composer session list | Session cards square, "…" hover button rectangular, empty-state border-dashed without radius |
| WorkflowTimeline | Step circles still round (glyphs), progress line `bg-foreground` instead of primary, current-state circle has border-foreground outline rather than primary tint |
| Brand Catalogue / Saved Library segmented control | Flat row with underline-active, no background, no radius — looks like the existing Tabs language |

---

## Residual risks for Phase E

1. **Badge base radius unchanged.** `badge.tsx:7` still has `rounded-[var(--radius)]`. Phase E or a global design-system pass should convert this; doing it here would also affect public Studio Badge instances (out of scope).
2. **Workspace h1 type scale** (audit §3.5) deferred — `text-2xl font-semibold` may want `text-3xl/4xl` alignment with public Studio headers. Phase E.
3. **`LibraryItemCard` line 156** — product name uses `text-[hsl(var(--foreground))]` hex-token form; the rest of the file mixes `text-foreground` (short form) and the hex form. Token-level alignment is a sweep candidate for Phase E.
4. **ProductQuickView 3D control buttons** (RotateCcw, Sun/Moon, Image at `:175-200`) didn't get `strokeWidth={1.5}` — they're not lucide glyph icons being styled as decoration, they're interactive control buttons in a small fixed strip. If a visual pass disagrees, adding 1.5 there is one line.
5. **`text-destructive` on Delete button** in `BrochuresPanel.tsx:294` survived as the intentional semantic color (system token, not chrome accent). If full monochrome is required, that's a token-level conversation.
6. **The new `WorkspaceRedirect` from P15** still works the same; this commit didn't touch routing.
7. **Lovable visual regressions** — high-risk phase. Even with screenshots, an editorial review on the live preview is recommended before declaring Phase D complete.
