-- Rows that exist in production only because they were entered directly
-- (Supabase Studio / SQL editor), never through a migration. Without them a
-- from-scratch replay fails at 20260414175102_…, whose UPDATE/INSERT
-- statements assume these two flipbook_brochures rows already exist.
--
-- The e2e-local harness copies this file into the scratch migrations folder
-- with a timestamp just before that migration. It is NOT part of
-- supabase/migrations and is never applied to production, where the rows
-- already exist (ON CONFLICT guards it regardless).
insert into public.flipbook_brochures (id, title, slug, status) values
  ('14e9130e-5c0e-4c95-b730-5c7732c56431', 'Sustainable Materials Catalog', 'sustainable-materials-catalog', 'draft'),
  ('3f6023d6-9889-413e-b513-f8ce715b4deb', 'Hardware Innovations',          'hardware-innovations',          'draft')
on conflict (id) do nothing;
