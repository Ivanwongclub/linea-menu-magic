# P19 — Button Mesh Correction

**Date:** 2026-06-16
**Branch:** main
**Scope:** `supabase/migrations/20260611130000_rename_button_remove_ugly_models.sql`, `src/components/designer-studio/StudioHero3D.tsx`, `src/components/production/ObjGallery.tsx`, `docs/naming.md`.

A wrong-mesh assumption that propagated through four phases. Caught by visual inspection of the live screenshots; corrected here before the broken migration ever hit production.

---

## Timeline of the wrong-mesh assumption

| Phase | Where it landed | Assumption |
|---|---|---|
| **P5a** | `ObjGallery.tsx` "buckle" card retitled "Button"; migration `20260611130000_…sql` §1 written to attach `/models/d-ring-buckle.obj` to `metal-button` | "the OBJ at d-ring-buckle.obj is a button (mislabeled file)" |
| **P5b** | `StudioHero3D.tsx` HERO_EDITOR_URL constant + Model3DViewer prop both hardcoded `/models/d-ring-buckle.obj`; hero card titled "Button" | inherited from P5a — the hero is showing the "canonical Button" mesh |
| **P8** | Hero CTA aligned, in-frame title planned around "Metal Buttons" | inherited |
| **P18** | In-frame header bar **literally titled** "3D Model — Metal Buttons" in 3 locales; editor deep-link gained `&color=%23C9A961` "polished brass" matching what was assumed to be a button | inherited |

The screenshots showed:
- `/designer-studio` hero loading d-ring-buckle.obj → renders an obvious **D-ring shape** under the "Metal Buttons" title.
- `/designer-studio/editor?model=/models/d-ring-buckle.obj` → same D-ring, same wrong label.
- `metal-button` product's actual 3D dialog in production rendering a real button — proving `metal-button.model_url` was already pointing at the correct OBJ before P5a-r tried to overwrite it.

The migration had NEVER been applied to Supabase (per the P11/P18 §D hypothesis the screenshots confirmed). So the production DB was still in the correct state — `metal-button.model_url = '/models/Polo_Button_10.8.obj'`. Applying P5a-r as written would have *broken* the production button rendering.

P19 corrects the migration in place and repoints the hero to the real button mesh.

---

## T1 — Migration rewritten in place

`supabase/migrations/20260611130000_rename_button_remove_ugly_models.sql` — §1 no longer mentions `model_url`. The other three clauses are unchanged.

```sql
-- Corrected 2026-06-15 (P19): §1 no longer reassigns model_url because the
-- /models/d-ring-buckle.obj file is a D-ring shape, not a button. metal-button
-- keeps its existing model_url which points at the real button OBJ
-- (currently /models/Polo_Button_10.8.obj in production).

-- 1. Hero product: rename ONLY — model_url is preserved.
UPDATE public.products
SET
  name = 'Button',
  name_en = 'Button',
  is_customizable = true,
  description = 'Classic metal button in zinc alloy with a polished dome face. Available in multiple plated finishes and sizes for shirts, jackets and outerwear.'
WHERE slug = 'metal-button';

-- 2. Remove low-quality 3D models (cord stopper, woven badge)
UPDATE public.products
SET model_url = NULL
WHERE model_url LIKE '%cord-stopper.obj' OR model_url LIKE '%metal-badge.obj';

-- 3. Remove broken 3D references (OBJ files absent from /public/models)
UPDATE public.products
SET model_url = NULL
WHERE model_url IN (
  '/models/hardware.obj',
  '/models/zipper.obj',
  '/models/hw-snap-002.obj',
  '/models/button.obj',
  '/models/zip-n3-002.obj'
);

-- 4. Remove mismatched model (zipper puller displaying a button OBJ)
UPDATE public.products
SET model_url = NULL
WHERE slug = 'metal-zipper-puller';
```

When applied: `metal-button` gets the canonical Button rename + description + `is_customizable` flag, and the ugly/broken/mismatched models elsewhere are cleaned up — all without touching the live button mesh.

---

## T2 — Hero repointed to the real button OBJ

### Three sites with `/models/d-ring-buckle.obj`

```
StudioHero3D.tsx:12   HERO_EDITOR_URL constant            ← FIXED
StudioHero3D.tsx:47   Model3DViewer modelUrl prop         ← FIXED
ObjGallery.tsx:117    Production page "buckle" card       ← FIXED (different fix — see below)
```

### `StudioHero3D.tsx` — point at the real button mesh

```diff
- // 3D Editor opens with the same material applied — what you see is what you customise.
  export const HERO_EDITOR_URL =
-   "/designer-studio/editor?model=/models/d-ring-buckle.obj&product=metal-button&name=Button&color=%23C9A961";
+   "/designer-studio/editor?model=/models/Polo_Button_10.8.obj&product=metal-button&name=Button&color=%23C9A961";
…
-                modelUrl="/models/d-ring-buckle.obj"
+                modelUrl="/models/Polo_Button_10.8.obj"
```

### `ObjGallery.tsx:117` — restore the honest "D-Ring Buckle" label

The card existed before P5a as "D-Ring Buckle" with the d-ring file. P5a renamed it to "Button" believing the mesh was a button. P19 reverts the label to "D-Ring Buckle" — the file stays in the production showcase, just under its true identity.

```diff
- { id: "buckle",  title: "Button",        subtitle: "Cast zinc · Polished nickel or antique brass finish",    file: "/models/d-ring-buckle.obj",   …
+ // P19: this card was mislabeled "Button" in P5a — the OBJ at /models/d-ring-buckle.obj
+ // is genuinely a D-ring buckle, not a button. Restored honest labeling.
+ { id: "buckle",  title: "D-Ring Buckle", subtitle: "Cast zinc · Polished nickel or antique brass finish",    file: "/models/d-ring-buckle.obj",   …
```

The card's existing `material: { color: "#A08030", metalness: 0.8, roughness: 0.25 }` ("antique brass") is plausible for a D-ring buckle — left unchanged. The "4-Hole Metal Button" card at line 115 remains the only button-titled card in the gallery.

### Hero color choice — kept `#C9A961`

Reasoning:
- The `&color=` param only affects what the **editor** renders on deep-link. The hero's own Model3DViewer mount does not consume it (it renders whatever the OBJ + default material produces).
- `pdpSeedData.ts` for `metal-button` lists `color_options: ['Polished Nickel', 'Antique Brass', 'Gunmetal', 'Matte Black']` as textual labels — no companion hex values. `#C9A961` falls inside the "Antique Brass" family.
- The ObjGallery's brass-tone button card uses `#A08030` (a darker shade in the same family) — confirms brass is the established button finish across surfaces.
- Picking a "Polished Nickel" hex (silver) for the editor would jar the user: hero shows brass tone → editor opens silver → they'd wonder why.

So the editor deep-link still applies `#C9A961`. If a future visual review on the live preview says it looks wrong on the Polo_Button mesh, swapping the hex is a one-line change — but the family choice (brass) is justified.

---

## T3 — Lazy-load gate confirmed for the 3.6 MB OBJ

`StudioHero3D.tsx` structure (unchanged from P5b):

```tsx
const [ready, setReady] = useState(false);
useEffect(() => {
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => setReady(true));
  } else {
    const id = setTimeout(() => setReady(true), 300);
    return () => clearTimeout(id);
  }
}, []);

return (
  …
  {ready ? (
    <Suspense fallback={<PosterStage />}>
      <Model3DViewer hasModel modelUrl="/models/Polo_Button_10.8.obj" … />
    </Suspense>
  ) : (
    <PosterStage />
  )}
);
```

`ready` starts false → PosterStage renders, `Model3DViewer` is NOT mounted, the `lazy(() => import(...))` doesn't trigger, the OBJ download doesn't begin. After `requestIdleCallback` fires (or 300ms fallback), `ready` flips true → React.lazy resolves Model3DViewer's chunk → Model3DViewer's `useEffect` triggers `OBJLoader.load(modelUrl)` → 3.6 MB fetch begins.

**File-size comparison:**
- `d-ring-buckle.obj`: 28 KB
- `Polo_Button_10.8.obj`: 3.6 MB (≈130× larger)

The bytes-over-the-wire jump is meaningful but happens during idle time, *after* first paint and *after* the route's initial chunk has loaded. The hero stays interactive throughout the OBJ download; user just sees PosterStage's animated placeholder until the model arrives.

No additional gating needed — the existing P5b idle-mount gate already covers it. If a future Network-tab inspection shows the download starting during initial route nav (e.g. some preload misconfiguration), a stricter gate would defer the `modelUrl` prop assignment too. Not seen today.

---

## T4 — `/models/d-ring-buckle.obj`'s future

**Decision: kept on disk.** It's accurately named, only 28 KB, and now consumed by `ObjGallery`'s honestly-titled "D-Ring Buckle" card. A future D-ring product line would reuse it directly.

`docs/naming.md` gained a **Static 3D assets** table cataloguing every OBJ in `public/models/` with its **actual mesh identity** (established by visual inspection in P19) — not whatever filename or DB label happens to claim. New rules at the bottom:

> Before wiring a new product to a `model_url`, **visually inspect the OBJ** in a 3D viewer (Blender, online viewer). The filename is a label only — meshes can be uploaded under any name.
>
> When deleting a product's `model_url`, leave the OBJ on disk unless verified unused. The file is cheap; re-uploading is not.
>
> Never assume an OBJ matches its filename. The P5a→P5b→P8→P18 chain spent four phases assuming `d-ring-buckle.obj` was a button because P5a renamed a DB row to "Button" while attaching that file — the lesson is to verify the mesh, not trust the label.

---

## T5 — Duplicate `Polo_Button_10.8-2.obj` flagged

`ls -la public/models/` shows two files identical in size (3,677,738 bytes):
- `Polo_Button_10.8.obj` (the one now wired into the hero + `metal-button`)
- `Polo_Button_10.8-2.obj` (unwired — zero references in the codebase per grep)

Both `mtime` timestamps are `14 4 11:18` — uploaded together, same date. Could be:
- Same content uploaded twice (delete the `-2`)
- Two intentionally different button geometries with a naming collision

**Not deleted in this commit.** Recommended follow-up:
1. Open both in Blender (or https://3dviewer.net) side-by-side.
2. If geometries are identical → delete `Polo_Button_10.8-2.obj`, no DB cleanup needed (already unreferenced).
3. If different → rename descriptively (e.g. `Polo_Button_10.8_dome.obj` vs `Polo_Button_10.8_flat.obj`) and update `docs/naming.md`'s Static 3D assets table with the resolution.

A binary `cmp` would answer the same-file question without a 3D viewer:
```bash
cmp public/models/Polo_Button_10.8.obj public/models/Polo_Button_10.8-2.obj && echo "IDENTICAL" || echo "DIFFERENT"
```

Not run in this commit because the recommendation is a follow-up, not a fix.

---

## Logic-check answers

1. **§1 no longer touches `model_url`?** Yes — `cat supabase/migrations/*rename_button*.sql | head -14` shows the rewritten §1 with only `name`, `name_en`, `is_customizable`, `description`. §2 / §3 / §4 unchanged.
2. **Hero constants point at `Polo_Button_10.8.obj` everywhere?** Yes:
   - `StudioHero3D.tsx:12` HERO_EDITOR_URL
   - `StudioHero3D.tsx:47` Model3DViewer modelUrl prop
3. **Remaining `/models/d-ring-buckle.obj` references in src/?** Three — all intentional:
   - `ObjGallery.tsx:117` P19 explanatory comment
   - `ObjGallery.tsx:119` the honestly-titled "D-Ring Buckle" card (file stays in the showcase)
   - `StudioHero3D.tsx:9` P19 explanatory comment in the HERO_EDITOR_URL doc
4. **Hero color choice + why?** `#C9A961` retained. Brass family matches the established button-finish identity (ObjGallery uses `#A08030`, the metal-button color_options include "Antique Brass" textually). If a visual review on the Polo_Button mesh disagrees, swap is one line.
5. **Idle-mount gate covers the 3.6 MB OBJ?** Yes — `ready` state must flip true before Model3DViewer is even rendered; only after that does the lazy chunk resolve and the OBJ fetch begin. PosterStage covers the interim with an animated placeholder.

---

## Verification

```
$ npx tsc --noEmit                                          → ✅ 0 errors
$ npx eslint StudioHero3D.tsx ObjGallery.tsx                → ✅ 0 errors (1 pre-existing
                                                              useMemo-dep warning in ObjGallery
                                                              unchanged code, unchanged by P19)
$ npm run build                                             → ✅ built in 4.71s
$ grep "/models/d-ring-buckle.obj" src/                     → only 3 intentional sites (2 comments
                                                              + the honestly-titled ObjGallery card)
$ head -14 supabase/migrations/*rename_button*.sql          → §1 with no `model_url` line
```

---

## Post-commit steps for the human

1. Pull latest in Lovable; preview should sync.
2. Apply the three pending migrations to Supabase **in order**:
   - `20260611120000_harden_editor_sessions.sql` (P4b)
   - `20260611130000_rename_button_remove_ugly_models.sql` (the now-corrected P5a-r-v2)
   - `20260615120000_workspace_role_and_team_hardening.sql` (P14)
3. Re-run the verification SELECTs from the P18 §D report. Expected after migration:
   ```sql
   SELECT slug, name, name_en, model_url FROM products WHERE slug = 'metal-button';
   -- → name='Button', name_en='Button', model_url='/models/Polo_Button_10.8.obj' (unchanged from prior state)

   SELECT COUNT(*) FROM products
   WHERE model_url LIKE '%cord-stopper.obj' OR model_url LIKE '%metal-badge.obj';
   -- → 0
   ```
4. Hard-refresh the Lovable preview.
5. Visit `/designer-studio` and confirm the hero renders a real button mesh; click "Try the 3D Editor" → editor opens, button OBJ loads, brass tone applied.
6. Visit `/production` and confirm the gallery now reads "D-Ring Buckle" for that card.

---

## Residual risks

1. **Polo_Button_10.8 vs Polo_Button_10.8-2 unresolved** — flagged in T5 above. Doesn't block P19.
2. **The hero color `#C9A961` is unverified on the new mesh** — if it reads wrong on the Polo_Button geometry vs the (smaller) d-ring it was tested on, swap the hex. The framework around it (HERO_EDITOR_URL → editor → postMessage → applyMaterialColor) is locked in by P18 and won't need re-touching.
3. **Documentation gap** — `docs/naming.md`'s new Static 3D assets table is a snapshot; new OBJ uploads need manual entry. A future polish pass could lint-enforce it against `ls public/models/`.
4. **`metal-button.model_url` is observed to be `/models/Polo_Button_10.8.obj` in production** based on the user's screenshots and the verification logic. If a future DB export contradicts this, the migration's preserved-`model_url` assumption holds — it just preserves whatever's there, including a wrong value if one has crept in.
