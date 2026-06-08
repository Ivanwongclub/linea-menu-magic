## Plan: DTM + Electroplating controls in 3D editor

**File:** `src/components/production/ObjGallery.tsx` (only file touched)

### 1. New data
Add two arrays alongside `COLOURS` / `FINISHES`:

- `DTM_FINISHES` — 4 options, each maps to material PBR values:
  - Enamel: metalness 0.05, roughness 0.15, clearcoat 1.0 (glossy non-metal)
  - Rubberize: metalness 0.0, roughness 0.95, clearcoat 0.0 (soft matte)
  - Shiny: metalness 0.1, roughness 0.08, clearcoat 1.0 (high gloss lacquer)
  - Matte: metalness 0.0, roughness 0.85, clearcoat 0.0 (flat)

- `PLATINGS` — electroplating swatches (chrome, nickel, gold, copper, black-chrome, gunmetal, rose-gold) with `materialHex` + a metalness/roughness override (high metalness 0.95, low roughness 0.05).

### 2. State + mode
- Add `activeDtm` (nullable, defaults to null = "off") and `activePlating` (nullable).
- Selecting a DTM chip clears Plating; selecting a Plating swatch clears DTM. Colour + Finish remain the base when neither is active.

### 3. Material application
In `ObjMesh`, derive the final material props with precedence:
1. If `activePlating` → use its color + plating metalness/roughness (overrides Colour & Finish).
2. Else if `activeDtm` → use Colour's hex but DTM's metalness/roughness/clearcoat (overrides Finish).
3. Else → existing Colour + Finish behavior (unchanged).

Pass `activeDtm`/`activePlating` through `ModelScene` → `ObjMesh` and include them in the `useMemo` deps.

### 4. UI panels
Extend the existing divided row (`flex flex-col sm:flex-row ... divide-x`) to four sections in this order:
Colour | Finish | **DTM** | **Electroplating**

- DTM section: label "DTM (Dye to Match)", chip buttons styled identically to Finish chips (Enamel / Rubberize / Shiny / Matte), plus a small "None" reset chip.
- Electroplating section: label "Electroplating", round swatch buttons styled identically to Colour swatches, plus active label text on the right.

All styling follows existing tokens: monochrome, `rounded-none` borders, 9–11px uppercase tracked labels, Poppins (inherited). No emojis.

### 5. Reset behavior
In `prev` / `next` / thumbnail click handlers, also reset `activeDtm` and `activePlating` to null (matches existing reset of Colour/Finish).

### Out of scope
- No DB / schema changes.
- No changes to `Model3DViewer`, ProductDetail, or any other 3D entry point.
- `/products` and trim library untouched.
