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
