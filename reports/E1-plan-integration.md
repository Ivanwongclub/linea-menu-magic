# E1 — Units, scale and recovery rulings: plan integration

Inputs: `docs/3d-editor/wincyc-3d-editor-units-and-recovery-rulings.md` (the
**rulings**), `claude_code_3d_editor_units_scale_size_ruler_spec_v3.md` (the
**spec**; addendum sections cited as "add. §n"),
`obj_rhino_units_scale_research_findings_v2.md` (the **research**),
`wincyc-3d-editor-axis-design.md`, `STATUS.md`, and the Phase 1–3e code.
Read-only audit; nothing outside `reports/E1-plan-integration.md` and
`docs/3d-editor/STATUS.md` was changed.

Facts this report relies on:

- `products` has **no** size column. `size_primary_mm` lives on
  `product_size_variants` (one product, many variants, one OBJ).
- The Polo fixture measures X 14.995973 · Y 4.139496 · Z 14.995974 raw units,
  face in XZ, relief on +Y. Its name says 10.8. At 10.8 mm the factor is
  0.720193 mm per raw unit, so the recovered radius of ≈ 5.04 raw units is
  ≈ 3.63 mm, not the 5.04 mm in axis-design §6's example recipe.
- `EditorModel` rotates first (`decoratedFaceRotation`, axis-aligned
  quarter or half turns only), then scales the clone so that
  `max(size.x, size.y)` equals the selected variant's `size_primary_mm`.

---

## 1. Collisions

One line each: **exists** → **ruling wants** → **smallest reconciling change**.

### Scale and prepareModel/EditorModel

1. **Force-rescale.** `EditorModel.tsx:96-102` scales every model so its face diameter equals the variant's mm → §1.3 says use the stored `products.model_scale_factor` → `clone.scale.setScalar(factor × variantMm / referenceMm)`, with `referenceMm` from the reference variant (§3). Delete the raw-diameter code.
2. **"Raw primary dimension" has no product-level target.** §1.1 compares it with `size_primary_mm`, but that column is per variant → add `products.model_scale_reference_variant_id`, defaulting in the CMS to the default variant. The proposal uses that variant's mm.
3. **Size variants after the change.** Today switching variant rescales to that variant's mm → the factor maps raw units to mm only at the reference variant → any other variant multiplies by `variantMm / referenceMm`. That is a product-size change, not a unit reinterpretation (the research §6 separation holds). Text-layer behaviour on switch is open question 3.
4. **Raw primary definition.** The code takes `max(x, y)` after rotation → §1.1 needs the same number before any viewer exists (at CMS upload) → define it as the larger of the two non-thinnest raw AABB extents. It doesn't depend on rotation and matches the current code for the axis-aligned rotations `decoratedFaceRotation` produces.
5. **Prop name and comment.** `sizePrimaryMm` is documented as "scales the model so 1 scene unit = 1mm" (`EditorModel.tsx:21`) → the model is scaled by the stored factor → pass `scaleFactor` and `variantScale`, and keep `sizePrimaryMm` for the ruler only.
6. **Buyer refusal.** `EditorViewport` only branches on `!modelStoragePath` → §1.2 wants the same empty state when `model_scale_status = 'unconfirmed'`, with the line "This product's 3D model is awaiting setup." → add `model_scale_status` and `model_scale_factor` to `EDITOR_PRODUCT_SELECT`, plus one guard next to the existing one. Signed-in `/new` should refuse *before* it inserts a `designs` row.
7. **"Staff see the calibration controls"** (§1.2). Editor staff means `designer_staff` (`useDesignerStaffStatus`), but calibration writes to `products`, which only catalogue editors can update → keep one write path. The calibration controls stay in the CMS. On the editor, a catalogue editor sees the awaiting-setup state with a link to the product's CMS page. (Open question 1.)
8. **E2E staging.** `editor-shell.mjs`, `finish-picker.mjs`, `render-calibration.mjs` and `family-calibration.mjs` stage products by setting only `model_storage_path`. All of them will hit the buyer refusal → `stageProduct` and the scenario staging must also set `model_scale_status='confirmed'` and a factor. Pick the factor so the rendered size is unchanged (factor = variant mm / 14.995973) and the 3c–3e pixel baselines hold. `scripts/e2e-local/lib/` is outside this audit's read scope, so it was not inspected.
9. **Occlusion bake and hidden groups.** `bakeOcclusion(prepared, url)` bakes every group and caches by URL → §4.2 hides the marked branding groups for buyers → exclude hidden meshes from the BVH and key the cache by `url + hidden-group set`. Otherwise the blank shows oxide shadows where the old lettering was.
10. **Orientation with hidden groups.** `decoratedFaceRotation` picks the decorated side by vertex density, and the branding supplies that density → compute the rotation on the full model *before* hiding groups, so a blank and a lettered view of the same file orient the same way.
11. **Snapshot shape (Phase 1 R2).** The `design_versions.snapshot` comment says rendering reads the snapshot, never live rows, but a stored scale is a live product field → add `model_scale_factor`, `model_scale_reference_variant_id` and `model_branding_groups` to the documented snapshot shape (a comment change in the Phase 4 migration). Phase 7 then writes them.

### CMS upload flow

12. **No scale step.** `useProductModel.upload` writes `model_storage_path` and returns → §1.1 wants raw bounds, a proposal, and confirm/calibrate/leave → after a successful upload, parse the file client-side (`OBJLoader.parse` on the `File` text, no viewer), write `model_raw_bounds` in the same row update, and open a confirmation panel in `ProductModelEditor`.
13. **Replace keeps a stale confirmation.** Replace and Remove only swap the path → a new OBJ must never inherit the old factor or marks → a `before update` trigger on `products`. When `model_storage_path` changes, it resets status to `unconfirmed` and nulls factor, method, confirmed_at/by, branding groups and reference. Put it in the database so the upload and every future path get it.
14. **Two-point calibration and group marking need a 3D view** (§1 table, §4.2). The CMS has none → add a lazy-loaded `ProductModelPreview` (R3F) in `ProductModelEditor`, reusing `prepareModel`. Don't import the buyer `EditorModel`: its framing and material logic aren't needed.
15. **Admin i18n.** `ProductModelEditor` strings are hardcoded English (Phase 2 Q1) → the scale panel adds about 15 strings → either put `adminTranslations` in the 4a scope or keep English to match the existing field. (Open question 6.)

### Measurement line vs ruler

16. **Fixed line.** `MeasurementLine.tsx` is rendered in `EditorShell`'s `measurement` slot on both pages → §2 says a ruler toggle replaces it and the line's content becomes the ruler's default → delete the slot and component, and add a `RulerToggle` in the viewport corner and a `RulerOverlay` inside the canvas. Ligne formatting (`tradeLigne`, R3 label suppression) moves into the overlay's label formatter unchanged.
17. **"No floating toolbar over the viewport" (Phase 3 R2).** The ruler toggle is one tool arriving with its phase, which is how R2 was worded → no conflict. It is a single corner toggle, not a toolbar.
18. **Test that goes vacuous.** `finish-picker.mjs:114,134` asserts `/\d+(\.\d+)?\s*mm/` in body text "measurement line is present". The panel's size radio (`15mm (24L)`) still matches, so the test keeps passing after the line is gone → replace it with a ruler assertion in 4e.
19. **Diameter source.** The line shows the catalogue variant's mm, while a ruler measures geometry → the ruler shows geometry (model-local AABB × factor × variant scale). For the reference variant it matches the catalogue within the 2% proposal band. On a mismatch the catalogue value is **not** substituted.

### Editor store shape

20. **Flat ids.** `useEditorStore` holds `sizeVariantId/finishId/colourId` → Phase 4 needs layers, the selected layer and ruler state under one shared parameter state (§3, add. §6) → replace the three fields with `recipe: DraftRecipe` (§3 of this report), plus `selectedLayerId` and actions `addLayer`, `updateLayer(id, patch)`, `removeLayer`, `moveLayer`, `setRuler`. Keep the three setters as thin wrappers so `EditorPanel` doesn't change shape.
21. **Global store leaks between designs.** The zustand store is module-global and `initialize` sets only three fields → with layers, `/new` layers or a previous design's layers survive navigation → `initialize(recipe)` replaces the whole recipe and resets `selectedLayerId`.

### Anonymous draft shape

22. **Three camelCase ids.** `AnonymousDraft` in sessionStorage has only the three ids → layers and ruler state must survive sign-in → store `{ productSlug, recipe: DraftRecipe }` with the recipe in the same snake_case shape as `draft_recipe`. `readAnonymousDraft` maps the old three-field shape forward.
23. **Claim copies three fields.** `EditorNewPage.tsx:91-95` builds `draft_recipe` field by field → a claimed draft loses its text layers → insert `draft?.recipe ?? defaultRecipe(product)` verbatim.

### Autosave

24. **Hydration seeds a stale payload.** On the first effect run, `useAutosaveDraft` records whatever the store held *before* `initialize` ran, which then triggers one redundant write. That was harmless with three ids; with a leaked layer array it writes the wrong design → gate hydration on `initialize` having run for this `designId` (a `hydratedFor` id in the store), not on the first render.
25. **Failed save is marked as saved.** `.then` sets `lastSaved = payload` even when `error` is set, so a failed write is never retried → only advance `lastSaved` on success. Show "not saved" rather than going quiet (the panel already renders a status line).
26. **Drag churn.** Handles and sliders change the recipe every frame → the 2 s debounce already coalesces this. `JSON.stringify` on every render is fine at Phase 4 sizes. No change beyond not saving mid-drag: flush on pointer-up is enough.
27. **Recipe version.** `DesignRow.draft_recipe` is read field by field with optional ids → add `recipe_version: 2`, and treat an absent version as v1 (`layers: []`, ruler off).

### Other documents

28. **Axis-design §6 example** uses `radius_mm: 5.04`, the raw Polo value → treat it as illustrative. The recipe stores mm after scale, where the Polo is ≈ 3.63.
29. **Axis-design §3 "fill disabled with a reason"** vs rulings §6 "absent, not disabled-looking" → not a conflict. §6 covers unfinished features; fill-on-emboss is a working rule with its reason shown. Keep §3 in Phase 6.
30. **STATUS phase table** (old 5 direct manipulation, 6 CSG, 7 fill, 8 save/versions, 9 archive/share/list, 10 quote + spec sheet) → rulings §7 renumbers → STATUS table rewritten. Old 9's "archive, design list" has no home in §7 (open question 4).

---

## 2. Counter-proposals (technique only; §8 rejections not re-argued)

| # | Topic | Rulings as written | Spec knows better | Recommendation |
|---|---|---|---|---|
| C1 | Stored scale | One `model_scale_factor` | §5 keeps `rawUnitToMM` (interpretation) separate from `calibrationScale`; §31 keeps "Reset Scale" separate from "Reset Unit Interpretation" | Store one factor = rawUnitToMM × calibrationScale (the buyer only needs the product), plus `model_scale_method` (`unit_mm` / `known_dimension` / `two_point`) so Phase 11 and audit can tell them apart. |
| C2 | Calibration maths | "Propose the factor that makes them equal" | §16: `rawUnitToMM = P_mm / R`; §17 two-point uses the raycast distance as R; §6 never rounds internal values | Use exactly those formulas. Store the full-precision factor (0.7201932…), never the displayed 0.7202. In the 2% band, propose exactly 1 but show the residual (e.g. "measures 14.996 mm, catalogue 15.00 mm, −0.03%"). |
| C3 | Precision | Silent | §25 internal float mm, display 2–3 dp; add. §5 0.001 mm / 0.01°; add. §7 arrow steps | Buyer path displays mm at 2 dp (3 dp while a field is focused) and degrees at 1 dp. Adopt add. §7 key steps unchanged (0.01 / Shift 0.1 / Alt 0.001 mm; 0.1 / 1 / 0.01°). The recipe stores unrounded floats. The CMS shows the factor at 6 dp. |
| C4 | AABB vs OBB | Silent | §22: report intrinsic/local dimensions; camera never changes them | Measure in model-local space: union of each mesh's `geometry.boundingBox` × factor × variant scale. Never `Box3.setFromObject` on the world-space scene. Buyer-path rotations are axis-aligned, so a local AABB is exact and OBB isn't needed. Use `OBB` only in Phase 11 for selected, arbitrarily rotated groups. |
| C5 | Ruler rendering | "Follows spec §23" | §23: helper lines + HTML labels, readable at any zoom; research §7: never geometry | Labels as DOM (`Html` from drei) sized in CSS px; lines as screen-space `Line2`. Everything under one `Group` on render layer 1, excluded from ContactShadows, the occlusion bake, raycasts and every exporter. |
| C6 | Scale undo | Silent | §32 command history for every sizing action | Buyer path has no scale actions, so there is no scale undo. The CMS confirm is an explicit write whose reset is "mark unconfirmed". Adopt §32's `UnitScaleCommand` only in Phase 11. Undo for *layer* edits is a gap in the rulings (open question 5). |
| C7 | Angle parameters | §3 lists start angle, arc span and arc position as separate hybrid controls | add. §6: "Never maintain two independent states" | Three independent angles over-determine a text arc whose span follows from glyph advances. Store `arc_position_deg`, `radius_mm` and `letter_spacing_mm`. Derive start, end and span. The two-handle start/end control moves the midpoint when dragged together and changes letter spacing when widened (preserve-radius policy). All §3 controls still appear. |
| C8 | Recovered values | §4.2 "uses the recovered radius, start angle and relief" | add. §3 and §18: keep recovered values in raw model units and derive mm, so recalibration updates them (add. §21) | Store the reference in **raw units** on the product. Convert to mm when a buyer adds text, and write the mm value into the layer with provenance `recovered`. |
| C9 | Fit confidence | Silent for the catalogue path | add. §17: RMS error and confidence; low → no forced circle | Store `fit_rms_raw` and `confidence` with the marks. The CMS refuses to save a low-confidence circle as a default: marks save, reference stays null, and the buyer default falls back to the face centre and 70% of the face radius. |
| C10 | Resize with layers | Silent (buyer resize is a variant switch) | §27: choose scale-with-model or preserve physical, never silently | Fix the buyer policy instead of asking. Placement and text size scale with the variant; relief `depth_mm` and `bevel_mm` keep physical values (they are factory tolerances). See open question 3. |
| C11 | Relief measurement | §5 "along the local surface normal" | add. §14: median of the 10th–90th percentile, outlier rejection | Agreed. When relief recovery lands (4d), use add. §14's robust aggregate, not max/min. |

---

## 3. Data model

### 3.1 Migration `supabase/migrations/2026MMDDhhmmss_phase4a_model_scale.sql`

```sql
alter table public.products
  add column model_scale_factor numeric,                -- mm per raw OBJ unit at the reference variant (C1)
  add column model_scale_status text not null default 'unconfirmed',
  add column model_scale_method text,                   -- unit_mm | known_dimension | two_point
  add column model_scale_reference_variant_id uuid
    references public.product_size_variants(id) on delete set null,
  add column model_raw_bounds jsonb,                    -- {min:[x,y,z], max:[x,y,z], face_axis:0|1|2, primary_raw:n}
  add column model_scale_confirmed_at timestamptz,
  add column model_scale_confirmed_by uuid references auth.users(id) on delete set null,
  add column model_branding_groups jsonb not null default '[]'::jsonb,  -- [{index:int, name:text}]
  add column model_branding_reference jsonb;            -- see 3.2; raw units

alter table public.products
  add constraint products_model_scale_status_check
    check (model_scale_status in ('confirmed','unconfirmed')),
  add constraint products_model_scale_factor_positive
    check (model_scale_factor is null or model_scale_factor > 0),
  add constraint products_model_scale_method_check
    check (model_scale_method is null or model_scale_method in ('unit_mm','known_dimension','two_point')),
  add constraint products_model_scale_confirmed_complete
    check (model_scale_status = 'unconfirmed'
           or (model_scale_factor is not null and model_storage_path is not null));

-- §1 collision 13: a new or removed file never inherits scale or marks.
create or replace function public.products_reset_model_scale() returns trigger
language plpgsql as $$
begin
  if new.model_storage_path is distinct from old.model_storage_path then
    new.model_scale_status := 'unconfirmed';
    new.model_scale_factor := null;
    new.model_scale_method := null;
    new.model_scale_confirmed_at := null;
    new.model_scale_confirmed_by := null;
    new.model_branding_groups := '[]'::jsonb;
    new.model_branding_reference := null;
    if new.model_storage_path is null then new.model_raw_bounds := null; end if;
  end if;
  return new;
end $$;

create trigger trg_products_reset_model_scale before update of model_storage_path
  on public.products for each row execute function public.products_reset_model_scale();
```

- Comments go on every new column. The `design_versions.snapshot` comment is extended (collision 11).
- RLS: none new. `products` update is already catalogue-editor-gated, and the storefront/editor select is already public.
- Backfill: none. Every existing product starts `unconfirmed`, which is correct by §1.2. The local seed has no models, so the e2e staging change (collision 8) is the only follow-on.
- `model_branding_groups` uses `{index, name}` because OBJ `o`/`g` names can repeat. `index` is the child order under `OBJLoader`'s root group, which is stable per file, and the trigger clears marks on file change.
- Then run `npm run e2e:types`.

### 3.2 `model_branding_reference` (raw units, raw OBJ frame)

| Field | Type | Unit / meaning | Default |
|---|---|---|---|
| `algorithm` | text | `kasa-circle-v1` | — |
| `analysed_at` | timestamptz text | — | — |
| `origin` | text | always `recovered-from-geometry` (§4.3) | — |
| `face_normal_raw` | [x,y,z] | unit vector, decorated side | — |
| `angle_zero_raw` | [x,y,z] | unit vector in face plane for 0° (so angles survive any rotation heuristic change) | — |
| `centre_raw` | [x,y,z] | raw units | — |
| `radius_raw` | number | raw units | — |
| `start_angle_deg` / `end_angle_deg` | number | degrees, 0 = `angle_zero_raw`, clockwise viewed from the face | — |
| `direction` | `cw` \| `ccw` | reading direction | — |
| `text_height_raw` | number \| null | raw units, radial extent of marked groups | null |
| `relief_raw` | number \| null | raw units along the local normal (C11), + raised / − recessed | null until 4d measures it |
| `fit_rms_raw` | number | raw units | — |
| `confidence` | `high` \| `medium` \| `low` | RMS/radius < 1% / < 3% / else | — |

### 3.3 `draft_recipe` v2 (also the anonymous draft's `recipe`)

Face frame: viewed from +Z after orientation, origin at the face centre, mm. Angles: 0° = 12 o'clock, clockwise positive.

```jsonc
{
  "recipe_version": 2,
  "size_variant_id": "uuid|null",
  "finish_id": "uuid|null",
  "colour_id": "uuid|null",
  "view": { "ruler": false },                    // §2: per design, off by default
  "layers": [{
    "id": "uuid",                                // client-generated
    "kind": "text",
    "visible": true,
    "content": { "type": "text", "value": "POLO", "font": { "source": "bundled", "key": "<font-key>" } },
    "style":   { "text_size_mm": 1.0, "letter_spacing_mm": 0 },
    "placement": {
      "layout": "circle",                         // "straight" | "circle"
      "centre_mm": { "x": 0, "y": 0 },
      "rotation_deg": 0,                          // straight only
      "radius_mm": 3.63,                          // circle only
      "arc_position_deg": 0,                      // circle: midpoint of the text (C7)
      "direction": "cw",                          // cw = reads along outside/top, ccw = inside/bottom
      "baseline_offset_mm": 0,
      "conform": true
    },
    "relief": null,                               // Phase 5: { "type": "emboss"|"deboss", "depth_mm": 0.30, "bevel_mm": 0.05 }
    "fill": null,                                 // Phase 6: { "finish_id": "uuid" }
    "provenance": {                               // §4.1 labels; absent key = "user"
      "radius_mm": "recovered", "arc_position_deg": "recovered", "text_size_mm": "user"
    }
  }]
}
```

| Field | Unit | Default for a new layer |
|---|---|---|
| `text_size_mm` | mm, cap height | recovered `text_height_raw × scale`, else 12% of face diameter |
| `letter_spacing_mm` | mm added per gap | 0 |
| `centre_mm` | mm | recovered centre (face frame), else 0,0 |
| `rotation_deg` | ° | 0 |
| `radius_mm` | mm | `radius_raw × factor × variantScale`, else 0.35 × face diameter |
| `arc_position_deg` | ° | midpoint of recovered start/end, else 0 |
| `direction` | — | recovered, else `cw` |
| `baseline_offset_mm` | mm | 0 |
| `conform` | bool | true |
| `relief.depth_mm` | mm, along local normal, magnitude for both types | Phase 5: `relief_raw × scale` if recovered, else `finish_processes.min_deboss_depth_mm` |

Derived, never stored: start/end angle, arc span, per-glyph angle and position. `start = arc_position − span/2`, and `span = (Σ advance + (n−1)·letter_spacing) / radius` in radians → degrees. Per-glyph placement data (add. §11) is computed per frame. Add a `glyph_overrides` array only if Phase 11 needs manual per-glyph edits.

Relief keeps axis-design §6's single `depth_mm`. The UI labels it "Emboss height" or "Deboss depth" by type, so there is one field and no emboss/deboss divergence.

---

## 4. Storefront swatch

**Confirmed, no fix needed.** `ProductColourFinish.tsx:57` renders
`<FinishSwatch finish={f} …/>` with `f` straight from `product.finishes`, no
remapping. `useProduct` selects and forwards `base_color_hex`
(`useProduct.ts:67,184`). `FinishSwatch` → `finishSwatchStyle` →
`finishSwatchSvg` uses `m.base_color_hex ?? m.hex_approx` (`swatch.ts:87`), and
the memo key includes `base_color_hex`. One caveat, by design: a non-empty
`swatch_url` photograph takes precedence over the rendered colour
(`swatch.ts:167-171`). This closes 3b Q2, 3c Q5, 3d Q4 and 3e Q2/R4.

---

## 5. Phase 4 build units

One CC sprint each. Order is dependency order. Every unit proves its writes
through the real UI against the local stack with a read-back, per the
verify-writes rule. Every unit adds its strings to `translations.ts` (×3)
and keeps all existing scenarios green.

| Unit | Content | Scope (edit) | E2E proof |
|---|---|---|---|
| **4.0** Carried finish items | ROSE_GOLD blend gold→copper t 0.5 → **0.7**. Two-tone rows: buffed layer L* = **0.7 × physical L*** (hue and chroma angle kept, chroma scaled with L* as the oxide does; oxide target L* unchanged). Recompute the 108 plated rows. Mirror both in `metalReflectance.ts`. New contact sheet. | migration `phase4_0_*`, `metalReflectance.ts`, `family-calibration.mjs`, `render-calibration.mjs`, `reports/4-materials.png` | `family-calibration.mjs`: ROSE_GOLD base matches the TS mirror at t 0.7 (hex parity). Two-tone rows' base L* = 0.7 × physical ± 0.05, non-two-tone rows still equal to physical. Oxide L* unchanged. `render-calibration.mjs` parity for all rows. Count assertion 108. |
| **4a** Scale schema + CMS confirm | Migration §3.1, types regen. Upload parses the OBJ client-side and writes `model_raw_bounds`. Scale panel: raw dims, reference variant picker, proposal (1 mm if within 2%, else P/R), residual shown, **Confirm** / **Calibrate by known dimension** (numeric P in mm) / leave unconfirmed. | `useProductModel.ts`, `ProductModelEditor.tsx`, migration, `types.ts`, new `lib/objBounds.ts` | `cms-model-scale.mjs`: upload the Polo fixture to a product whose variant is 15.00 mm → proposal 1 → confirm → read-back `confirmed/1/unit_mm`. Variant 10.8 → proposal 0.720193 ± 1e-6 → known-dimension 10.8 → read-back. Replace the file → read-back `unconfirmed`, factor null, groups `[]`. |
| **4b** Editor reads stored scale | Remove the force-rescale. Scale = factor × variant mm / reference mm. Buyer refusal and awaiting-setup copy, before the design insert. Catalogue-editor link (per Q1). `stageProduct` and scenario staging set confirmed + a baseline-preserving factor. | `EditorModel.tsx`, `EditorViewport.tsx`, `useEditorProduct.ts`, both pages, `scripts/e2e-local/lib/calibration.mjs`, 4 staging scenarios | `editor-scale.mjs`: unconfirmed → anon and signed-in both show the copy, no `<canvas>`, **no `designs` row inserted** (read-back count). Confirmed at 0.720193 → `data-model-size-mm` on the viewport = 10.80 ± 0.01. Switch to a 15 mm variant → 15.00 ± 0.01. 3c–3e render scenarios unchanged. |
| **4c** CMS preview + two-point | Lazy R3F preview in the CMS (`prepareModel` only). Two-point calibration by raycast (§17): click A, click B, enter mm, apply. | `ProductModelEditor.tsx`, new `ProductModelPreview.tsx` | `cms-two-point.mjs`: click two rim points at known screen projections of the Polo's X extremes → measured raw ≈ 14.996 ± 0.05 → enter 10.8 → read-back `two_point`, factor within 0.5% of 0.7202. |
| **4d** Branding group marks + recovery | Group list (index, name, vertex count) with multi-select, staff only, highlighted in the preview. Kåsa circle fit of marked vertices projected on the face plane → centre, radius, start/end, direction, text height, RMS, confidence. Relief along local normals, 10–90 percentile median (C11). Save marks and reference (null reference if low confidence, C9). | `ProductModelEditor.tsx`, `ProductModelPreview.tsx`, new `lib/brandingRecovery.ts` (shared with Phase 11) | `cms-branding-marks.mjs`: mark Polo groups object_6–object_33 → read-back 28 marks. `radius_raw` 5.04 ± 0.05, `relief_raw` 0.5 ± 0.1, confidence ≠ low. Mark 2 random body groups → reference null. |
| **4e** Ruler, buyer scope | Delete `MeasurementLine` and the shell slot. Corner toggle, off by default. Overlay: diameter and thickness (+ ligne per R3) from model-local bounds (C4), DOM labels and Line2 on layer 1 (C5). `view.ruler` in the recipe, persisted signed-in and anonymous. | `EditorShell.tsx`, `EditorViewport.tsx`, new `Ruler*.tsx`, store (ruler field only), `anonymousDraft.ts`, `useAutosaveDraft.ts`, `finish-picker.mjs` | `ruler-buyer.mjs`: toggle absent from the panel and present in the viewport. Off → no ruler labels. On → "10.80 mm" and thickness label. Canvas mesh count unchanged (overlay not geometry). Reload signed-in design → still on (read-back `draft_recipe.view.ruler = true`). Anon → sign in → claimed design has `ruler = true`. The `finish-picker.mjs` mm assertion is replaced. |
| **4f** Recipe v2 + straight text | Store refactor (collisions 20–27). BRANDING group: **Add text**, layer list (select, delete, reorder), content field, bundled Latin font, text size, straight layout on the face plane (glyphs as `TextGeometry`, lifted 0.02 mm to avoid coplanar faces). Autosave/claim of layers. | store, `useAutosaveDraft.ts`, `anonymousDraft.ts`, both pages, `EditorPanel.tsx`, new `components/branding/*`, `lib/textLayout.ts`, `public/fonts/` | `text-layer.mjs`: anon adds "POLO" → sign in → read-back `layers[0].content.value = "POLO"`, `recipe_version 2`. Edit to "WINCYC" → autosave → read-back. Reload → 6 glyph meshes. Failed-save path shows "not saved" (forced RLS denial). Old v1 row opens with `layers: []`. |
| **4g** Circular layout, per-glyph | `layout: circle`. Per-glyph position and tangent orientation (§5). `ccw` by glyph order, traversal and rotation, never negative scale. Default fit policy: preserve radius (span from advances). | `lib/textLayout.ts`, layer panel (layout switch), `EditorModel` glyph group | `circular-text.mjs`: radius 3.63, "POLO" cw at 0° → each glyph's centre angle matches the layout function ± 0.01°, radius ± 0.001 mm. `ccw` at 180° → glyph screen-x increases left to right. Every object's world matrix determinant > 0. Adding a character leaves `radius_mm` unchanged (read-back). |
| **4h** Hybrid controls | `ValueSlider`, `RangeValueSlider`, `PrecisionNumberInput` (add. §34), value label and vertical marker. "Position and curve" disclosure with radius, start/end (two-handle, C7), arc position, text size, letter spacing, baseline offset. Numeric authoritative. Key steps C3. Emboss/deboss controls ship with Phase 5 (rulings §6). | new `components/controls/*`, layer panel | `hybrid-controls.mjs`: type radius 4 → glyph radius 4.000 live. ArrowUp / Shift / Alt steps = +0.01 / +0.1 / +0.001. Widen range → `letter_spacing_mm` increases, `radius_mm` fixed (read-back). Slider drag updates the input. Mobile width 390 px stacks without overflow. |
| **4i** Drag handles | Handles on the model: radius ring, arc-position knob, straight-layout move. Raycast on the face plane. Same store. Autosave flush on pointer-up. Undo if Q5 is ruled in. | new `components/branding/Handles.tsx`, store | `drag-handles.mjs`: drag the radius handle outward 40 px → numeric field increases, glyphs move, and exactly one autosave write after pointer-up (request count). Read-back matches the field to 1e-6. |
| **4j** Catalogue branding defaults | Buyer view hides marked groups (staff: toggle to show). Occlusion bake excludes them (collision 9). Orientation computed before hiding (collision 10). Add text uses the recovered centre, radius, arc position, direction and size, with provenance `recovered`. Ruler adds branding radius and edge margin (face radius − radius − text size/2). | `EditorModel.tsx`, `ambientOcclusion.ts`, `textLayout.ts`, ruler, `useEditorProduct.ts` | `branding-defaults.mjs`: Polo with 28 marks at factor 0.720193 → buyer mesh count = body groups only. Add text → read-back `radius_mm` = 5.04 raw × 0.720193 ± 0.01 and `provenance.radius_mm = "recovered"`. Ruler shows branding radius and edge margin. Anti-brass render: oxide mean in the former lettering zone within 5 L* of the surrounding face. |

---

## 6. Risks, Phases 4–12

Known versions (from STATUS): `three`/`@types/three` ^0.162.0,
`three-mesh-bvh` ^0.9.15, `three-bvh-csg` 0.0.17 (exact), `zustand` ^5.0.15.
The R3F and drei versions are in `package.json`, outside this audit's read
scope, so they weren't checked (open question 7).

| # | Phase | Risk | Mitigation |
|---|---|---|---|
| R1 | 4 | `TextGeometry` / `FontLoader` typeface JSON has advances (`ha`) but no kerning, and CJK typeface JSON runs to megabytes. The site is trilingual. | Phase 4 ships Latin fonts only (converted offline, subset). Kerning is accepted as absent, and letter spacing is exposed instead. CJK text is open question 8. |
| R2 | 4 | Flat glyphs on a domed face float or sink. | `conform` in 4g: per-glyph raycast along −normal with `three-mesh-bvh`'s `acceleratedRaycast`, orient to the hit normal. Per-vertex bending waits for Phase 5 relief. |
| R3 | 4–5 | Relief of 0.3 mm on a 10–15 mm part, with near = distance/100, can z-fight at coplanar bases. | Sink glyph bases 0.02 mm below the surface, and use `polygonOffset` on the base material. Reach for `logarithmicDepthBuffer` only if that fails, since it changes the calibrated renderer. |
| R4 | 5 | `three-bvh-csg` 0.0.17 requires closed two-manifold input with matching attributes. Rhino OBJ groups are open shells, `TextGeometry` glyphs can self-overlap at negative spacing, and `withSmoothNormals` strips `uv` only on normal-less meshes. | Rulings §5 already keep emboss/deboss non-destructive until bake. Live preview: emboss = extruded glyph mesh; deboss = stencil-carved recess (set `stencil: true` explicitly in `GL_SETTINGS`, since three r163+ defaults it off). CSG runs only at bake in a worker, after attribute normalisation (position + normal only) and a manifold check. Fail loudly per layer. |
| R5 | 5, 12 | `three-bvh-csg` ≥ 0.0.18 needs `three` ≥ 0.179, which likely drags R3F/drei majors, and newer three changes tone mapping and PMREM output. Every 3b–3e calibration baseline would move. | Stay on 0.0.17 through Phase 11. Before Phase 12, run a one-sprint upgrade spike gated on `render-calibration.mjs` and `family-calibration.mjs` passing unchanged. If CSG proves unreliable on real OBJs, evaluate `manifold-3d` (WASM) in that spike; it needs a package ruling. |
| R6 | 5–6 | Occlusion bake is main-thread and URL-keyed. Relief changes the geometry, so two-tone recesses need a re-bake per layer edit. | Phase 6 moves the bake to a module worker (three-mesh-bvh BVH serialisation), keyed by model + hidden groups + relief-layers hash. During edits, bake on idle or pointer-up, not per frame. |
| R7 | 5–6 | Two-tone uses `onBeforeCompile` with a fixed `customProgramCacheKey`. A radial CIRCLE_BRUSHED anisotropy or deboss fill shader would collide on that hook and key. | One shader-patch composer in `lib/` that concatenates chunks and derives the cache key from the enabled features. Do it with the first second patch, not before. |
| R8 | 5 | CIRCLE_BRUSHED needs tangents; `computeTangents` needs UVs, and Rhino OBJs often have none. | Procedural radial tangent in the shader (face centre known from orientation). No UV unwrap. |
| R9 | 6 | Fill preview on a deboss floor needs the recess as a separate surface before any CSG. | The stencil-carved recess (R4) renders its floor as its own mesh, so fill is that mesh's material. |
| R10 | 7 | A version snapshot must freeze the scale and marks, not read live product rows (Phase 1 R2). | Collision 11: snapshot comment in 4a; Phase 7 writes the fields. |
| R11 | 10 | No PDF library is known to be installed (not verifiable in scope). | Phase 10 either rules a package (e.g. pdf-lib) or renders a print-CSS page server-side. Decide before the sprint. |
| R12 | 11 | `OBJLoader.parse` is synchronous and main-thread. Staff CAD files can be tens of MB, and hover/selection over 100+ groups needs fast raycasts. | Parse in a worker (OBJLoader works on text off-DOM). BVH per mesh. Hover by swapping to a cloned tinted material (no postprocessing outline package). |
| R13 | 11 | `OBB` in r162 is under `examples/jsm/math/OBB.js` and fits from a `Box3` + matrix, not a best fit from points. | Use it only for selections under a known transform (C4). A PCA fit is a small local util if it's ever needed. |
| R14 | 12 | `GLTFExporter` can't export the two-tone shader patch; OBJ has no unit field; the mm→m conversion must not touch the editing scene. | Export from a baked clone: two-tone baked to vertex colours (buffed/oxide via the occlusion attribute), root scale 0.001 for GLB, a `# units: millimetres` comment line for OBJ, binary STL in mm. Prove by re-import measuring 10.80 mm / 0.0108 m. |
| R15 | 4 | Admin bundle: a CMS preview that imports R3F eagerly would add the 3D chunk to every admin page. | `React.lazy` for `ProductModelPreview`, mounted only when the model section is expanded. |

---

## Open questions (with a recommendation each)

1. **Who calibrates from the editor (§1.2 "staff see the calibration controls")?** *Recommend* the CMS only, since it's the one path with `products` write RLS. The editor shows catalogue editors a "Set up in CMS" link, and designer staff who aren't catalogue editors see the buyer copy.
2. **Reference variant.** *Recommend* `model_scale_reference_variant_id` defaulting to the product's default variant, editable in the scale panel.
3. **Text layers on a variant switch.** *Recommend* C10: placement and text size scale with `variantMm / referenceMm`; `depth_mm` and `bevel_mm` stay physical.
4. **Archive and design list** (old Phase 9) are absent from rulings §7. *Recommend* folding them into Phase 8 with shares, since it's the first UI to navigate between designs (Phase 3 Q5).
5. **Undo for layer edits** is not in rulings §7. *Recommend* a capped (50) recipe-snapshot history in the store, added in 4i, with one entry per pointer-up or committed field edit.
6. **Admin i18n for the scale panel.** *Recommend* adding the admin translations file to 4a's scope rather than growing more hardcoded English.
7. **R3F/drei versions** weren't readable in scope. *Recommend* granting read of `package.json` in 4e (the first unit that needs drei's `Html`/`Line`).
8. **CJK text on buttons.** *Recommend* Latin only in Phase 4, with CJK font subsetting ruled together with Phase 11's custom fonts.
9. **Default font.** *Recommend* one open-licence geometric sans (e.g. Inter SemiBold, OFL) plus one serif, subset to Latin-1, as the only bundled fonts in 4f.
