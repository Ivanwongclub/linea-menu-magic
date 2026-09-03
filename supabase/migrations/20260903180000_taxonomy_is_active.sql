-- M3 prerequisite: archive support for the three lookup tables M1 missed.
-- product_families and product_categories already have is_active from M1;
-- materials, attachments and compliance standards did not. Without it the CMS
-- can only hard-delete, and ON DELETE RESTRICT means any row referenced by a
-- product could never be removed — leaving obsolete entries permanently in
-- every dropdown.
--
-- Applied directly via the Supabase SQL editor 2026-09-03; this file records
-- that change so the repo matches the database.

alter table public.product_materials add column if not exists is_active boolean not null default true;
alter table public.product_attachments add column if not exists is_active boolean not null default true;
alter table public.compliance_standards add column if not exists is_active boolean not null default true;
