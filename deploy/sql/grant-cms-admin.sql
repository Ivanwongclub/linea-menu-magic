-- =============================================================================
-- CMS Admin (Catalogue Editor) grant
-- =============================================================================
-- Purpose: allow a named Auth user to use /admin and write catalogue tables
--          (products, finishes, taxonomy, product-assets / product-models).
--
-- Why this must run with elevated DB access:
--   public.catalogue_editors has NO insert/update/delete policies for the
--   anon/authenticated client roles. RLS default-denies those writes.
--   Only service_role, a migration, or a database superuser can insert grants.
--
-- Prerequisites:
--   1. Schema migrations are applied (table public.catalogue_editors exists).
--   2. The person already has an Auth user (Dashboard → Authentication → Users,
--      or they have signed up once).
--
-- How to run (pick one):
--   A. Supabase Dashboard → SQL Editor → paste → Run
--   B. psql as supabase_admin / postgres against the project DB
--   C. node deploy/scripts/grant-cms-admin.mjs (service role key)
--
-- BEFORE RUNNING: replace BOTH occurrences of the placeholder email below.
-- =============================================================================

-- 1) Grant CMS catalogue editor (idempotent)
insert into public.catalogue_editors (user_id)
select id
from auth.users
where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL@example.com')
on conflict (user_id) do nothing;

-- 2) Verify the grant
select
  u.id as user_id,
  u.email,
  c.granted_at
from public.catalogue_editors c
join auth.users u on u.id = c.user_id
where lower(u.email) = lower('REPLACE_WITH_ADMIN_EMAIL@example.com');

-- If step 2 returns zero rows: the Auth user does not exist yet, or the email
-- does not match. Create / confirm the user in Authentication, then re-run.

-- -----------------------------------------------------------------------------
-- Optional: Designer Studio staff (cross-brand design access).
-- Uncomment and replace the email if needed. Not required for CMS /admin alone.
--
-- insert into public.designer_staff (user_id)
-- select id from auth.users
-- where lower(email) = lower('REPLACE_WITH_ADMIN_EMAIL@example.com')
-- on conflict (user_id) do nothing;
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- Optional: list all current CMS admins
--
-- select u.email, c.user_id, c.granted_at
-- from public.catalogue_editors c
-- join auth.users u on u.id = c.user_id
-- order by c.granted_at;
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- Optional: revoke CMS admin for one email
--
-- delete from public.catalogue_editors c
-- using auth.users u
-- where c.user_id = u.id
--   and lower(u.email) = lower('REPLACE_WITH_ADMIN_EMAIL@example.com');
-- -----------------------------------------------------------------------------
