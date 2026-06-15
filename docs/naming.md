# Naming Conventions

Public/private split:
- Studio = the public area (/designer-studio)
- Workspace = the authenticated brand area (/designer-studio/workspace)

Tools:
- 3D Editor — the trim model customizer. Verb: "Open in Editor".
- Composer — the composition assembler. Verb: "Open in Composer".

Artefacts:
- Composition — what the Composer produces.
- Library item — a saved/favourited product entry.
- Brochure / Catalogue — flipbook content.

Retired terms (do not reintroduce):
- "Concept board" — was the Composer artefact; now "Composition".
- "Visual Composer" — now just "Composer".
- "Dashboard" — now "Workspace".
- `LibraryItem` (legacy type from `legacyTypes.ts`) — workspace surfaces consume `UserLibraryItem` directly. The legacy type survives only for the quarantined `QuickRFQDialog.tsx`; delete the legacy type when QuickRFQDialog is rewritten or retired.

zh translations (consistency lock):
- Composition: 組合 (zh-Hant) / 组合 (zh-Hans)
- Workspace: 工作空間 / 工作空间
- Studio: 工作室 / 工作室
- Composer (tool): treated as a brand-name term, not localised — surfaces as "Composer" across all locales (parallel to product names like "Photoshop" or "Figma"). Decision locked in P16. If marketing later requests a zh equivalent, the recommended translation is 排版工具.
- 3D Editor (tool): same brand-name pattern — surfaces as "3D Editor" across locales. If translated, recommended: 3D 編輯器 / 3D 编辑器.

## Static 3D assets

Files under `public/models/`. Identity is the **actual mesh** — not whatever a product row or gallery card happens to label it. Established by visual inspection in P19 after the wrong-mesh assumption from P5a was caught.

| File | Actual mesh | Size | Wired by |
|---|---|---|---|
| `button-4hole.obj` | 4-hole metal button | 22 KB | `ObjGallery` "4-Hole Metal Button" card |
| `cord-stopper.obj` | Cord stopper | 15 KB | none (P5a-r §2 nulls any DB row referencing it) |
| `d-ring-buckle.obj` | D-ring buckle | 28 KB | `ObjGallery` "D-Ring Buckle" card |
| `eyelet-grommet.obj` | Eyelet / grommet | 13 KB | `ObjGallery` "Eyelet / Grommet" card |
| `metal-badge.obj` | Metal badge / patch | 7 KB | none (P5a-r §2 nulls any DB row referencing it) |
| `Polo_Button_10.8.obj` | Polo-style metal button | 3.6 MB | `StudioHero3D` (the canonical Button), `metal-button` DB row's `model_url` |
| `Polo_Button_10.8-2.obj` | TBD — confirm vs `Polo_Button_10.8.obj` in a 3D viewer | 3.6 MB | none yet — see P19 §T5 follow-up |
| `snap-button.obj` | Snap button | 25 KB | `ObjGallery` "Snap Button" card |

Rules:
- Before wiring a new product to a `model_url`, **visually inspect the OBJ** in a 3D viewer (Blender, online viewer). The filename is a label only — meshes can be uploaded under any name.
- When deleting a product's `model_url`, leave the OBJ on disk unless verified unused. The file is cheap; re-uploading is not.
- Never assume an OBJ matches its filename. The P5a→P5b→P8→P18 chain spent four phases assuming `d-ring-buckle.obj` was a button because P5a renamed a DB row to "Button" while attaching that file — the lesson is to verify the mesh, not trust the label.
