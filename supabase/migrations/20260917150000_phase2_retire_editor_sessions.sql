-- Designer Studio Phase 2 — editor shell, catalogue entry, finish render.
-- Ref: docs/3d-editor/wincyc-designer-studio-architecture.md Part 8, R2/R5.
--
--   R2 editor_sessions (the vanilla iframe editor's session log, P19/P20
--      hardened) is retired along with the iframe app itself
--      (public/3d-editor/, src/pages/DesignerStudioEditor.tsx). Nothing
--      reads it once those are gone — dropping the table drops its
--      policies and grants with it (Postgres cascades both automatically
--      when the table is dropped).
--   R5 products.model_storage_path — the Supabase-Storage-backed 3D model
--      column, distinct from the legacy `model_url` (bundled
--      public/models/*.obj, left as-is; still used by StudioHero3D's own
--      hero preview, untouched this phase). The CMS uploads .obj files to
--      the `product-models` bucket (created in Phase 1) and writes the
--      object path here; the editor resolves it to a public URL at
--      render time.

drop table if exists public.editor_sessions;

alter table public.products
  add column if not exists model_storage_path text;

comment on column public.products.model_storage_path is
  'Object path inside the product-models storage bucket, e.g. '
  'models/<product_id>/<timestamp>.obj. Null means no uploaded 3D model — '
  'the editor shows an empty state, never a demo mesh (v3-review §10). '
  'Distinct from the legacy model_url column (bundled public/models/*.obj).';

-- End of Phase 2 migration.
