
Replace all 4 prototype images in the "3D Printing Prototypes" popup (`PrintGallery.tsx`) with the newly uploaded photos, and update titles/metadata to accurately reflect what each image shows.

## Image analysis & mapping

| # | Uploaded file | What it shows | New title / meta |
|---|---|---|---|
| 1 | `FQ8786YLLI15597.webp` | 5 rectangular 3D-printed belt-buckle plates with custom logo reliefs (wave, batman, cardinal, puzzle, U) | **Custom Logo Buckle Plates** — FDM PLA · Multi-color · 50×35mm |
| 2 | `3d_print_1-2.webp` | 3D-printed side-release plastic buckles (green, teal, navy) with woven webbing | **Side-Release Buckles** — FDM Nylon · Functional Print · 25mm webbing |
| 3 | `knopennieuwklein-website.jpg` | Cluster of intricate openwork patterned buttons (rosette / sunburst lattice) | **Openwork Pattern Buttons** — SLA Resin · 2-Hole & 4-Hole · 14–22mm |
| 4 | `img_20190418_112159_8666.webp` | Round 3D-printed pin-back badge with embossed "RIDER.CZ 2019" text mounted on wood | **Engraved Pin Badge** — FDM PLA · Embossed Type · 38mm diameter |

(`img_20190418_112153_8666.webp` is a wider shot of the same set as #4, so we'll use the closer/sharper one.)

## Implementation steps

1. **Copy uploads into the project** as optimized assets:
   - `src/assets/3dprint/buckle-plates.webp` ← `FQ8786YLLI15597.webp`
   - `src/assets/3dprint/side-release-buckles.webp` ← `3d_print_1-2.webp`
   - `src/assets/3dprint/openwork-buttons.webp` ← `knopennieuwklein-website.jpg`
   - `src/assets/3dprint/pin-badge.webp` ← `img_20190418_112159_8666.webp`

2. **Update `src/components/production/PrintGallery.tsx`**:
   - Add ES6 imports for the 4 new assets.
   - Replace the `PRINT_IMAGES` array entries (`src`, `title`, `meta`) with the mapping above. Keep `id` slugs aligned to new content (`buckle-plates`, `side-release`, `buttons`, `pin-badge`) and keep `tag` as `Prototype 01`–`Prototype 04` for sequential consistency.
   - No structural/UI changes — modal layout, navigation, zoom, and thumbnail strip remain identical.

3. **Verify**: open the Production page → click the "View 3D Print" badge → confirm all 4 images load, thumbnails match, titles/meta read correctly, and arrow/keyboard navigation cycles through 1/4 → 4/4.

## Files to change
- `src/assets/3dprint/buckle-plates.webp` (new)
- `src/assets/3dprint/side-release-buckles.webp` (new)
- `src/assets/3dprint/openwork-buttons.webp` (new)
- `src/assets/3dprint/pin-badge.webp` (new)
- `src/components/production/PrintGallery.tsx` (edit `PRINT_IMAGES` only)

## Intentionally not changing
- Modal layout, animations, zoom behavior, keyboard handling.
- The trigger badge in `Production.tsx` (already says "View 3D Print").
- Other galleries (`ObjGallery`, etc.).
