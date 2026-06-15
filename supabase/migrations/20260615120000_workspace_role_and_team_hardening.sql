-- ---------------------------------------------------------------------------
-- P14 workspace hardening
--   1. Helper: user_is_brand_manager_or_owner(uid)
--   2. flipbook_brochures: replace the over-permissive "Authenticated full access"
--      with role-aware mutate + read-for-all-authenticated.
--      (Brochures are a global resource with no team_id, so role gating is global:
--       members may read every brochure; managers/owners are the only authenticated
--       roles allowed to insert, update, or delete.)
--   3. design_sessions: drop the leftover anon (Public read / Public manage) policies
--      from the 20260317184925 migration that were never superseded. The brand-scoped
--      authenticated policies from 20260423090500 (user_has_brand_text) remain the
--      enforcement layer; the client-side .eq('team_id', …) calls added in P14 are
--      belt-and-braces.
--   4. design_layers / design_exports: same anon cleanup as design_sessions.
--
-- Strictly additive in spirit: the new policies match or tighten existing access.
-- Nothing outside flipbook_brochures, design_sessions, design_layers, design_exports
-- is touched.
-- ---------------------------------------------------------------------------

-- 1. Helper function — true if the user holds manager or owner role on any brand.
create or replace function public.user_is_brand_manager_or_owner(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.brand_memberships
    where user_id = _user_id
      and role in ('manager', 'owner')
  );
$$;

grant execute on function public.user_is_brand_manager_or_owner(uuid) to authenticated;

-- 2. flipbook_brochures — role-aware mutate, open read for authenticated users.
drop policy if exists "Authenticated full access brochures" on public.flipbook_brochures;
drop policy if exists "Authed read brochures"               on public.flipbook_brochures;
drop policy if exists "Authed insert brochures (managers)"  on public.flipbook_brochures;
drop policy if exists "Authed update brochures (managers)"  on public.flipbook_brochures;
drop policy if exists "Authed delete brochures (managers)"  on public.flipbook_brochures;

-- Members and above see every brochure (draft + published) in the workspace list.
create policy "Authed read brochures"
on public.flipbook_brochures
for select
to authenticated
using (true);

create policy "Authed insert brochures (managers)"
on public.flipbook_brochures
for insert
to authenticated
with check (public.user_is_brand_manager_or_owner(auth.uid()));

create policy "Authed update brochures (managers)"
on public.flipbook_brochures
for update
to authenticated
using  (public.user_is_brand_manager_or_owner(auth.uid()))
with check (public.user_is_brand_manager_or_owner(auth.uid()));

create policy "Authed delete brochures (managers)"
on public.flipbook_brochures
for delete
to authenticated
using (public.user_is_brand_manager_or_owner(auth.uid()));

-- Apply the same model to flipbook_pages and flipbook_hotlinks (cascade resource).
drop policy if exists "Authenticated full access pages"     on public.flipbook_pages;
drop policy if exists "Authed read pages"                   on public.flipbook_pages;
drop policy if exists "Authed mutate pages (managers)"      on public.flipbook_pages;

create policy "Authed read pages"
on public.flipbook_pages
for select
to authenticated
using (true);

create policy "Authed mutate pages (managers)"
on public.flipbook_pages
for all
to authenticated
using  (public.user_is_brand_manager_or_owner(auth.uid()))
with check (public.user_is_brand_manager_or_owner(auth.uid()));

drop policy if exists "Authenticated full access hotlinks"  on public.flipbook_hotlinks;
drop policy if exists "Authed read hotlinks"                on public.flipbook_hotlinks;
drop policy if exists "Authed mutate hotlinks (managers)"   on public.flipbook_hotlinks;

create policy "Authed read hotlinks"
on public.flipbook_hotlinks
for select
to authenticated
using (true);

create policy "Authed mutate hotlinks (managers)"
on public.flipbook_hotlinks
for all
to authenticated
using  (public.user_is_brand_manager_or_owner(auth.uid()))
with check (public.user_is_brand_manager_or_owner(auth.uid()));

-- 3. design_sessions — strip the legacy anon "Public" policies. The brand-scoped
--    "Authed * own brand design_sessions" policies from 20260423090500 already
--    enforce per-team access for authenticated users; we just remove the anon
--    bypass that was never cleaned up.
drop policy if exists "Public read design_sessions"   on public.design_sessions;
drop policy if exists "Public manage design_sessions" on public.design_sessions;

-- 4. design_layers / design_exports — same anon cleanup.
drop policy if exists "Public read design_layers"   on public.design_layers;
drop policy if exists "Public manage design_layers" on public.design_layers;

drop policy if exists "Public read design_exports"   on public.design_exports;
drop policy if exists "Public manage design_exports" on public.design_exports;

-- Defence in depth at the grant level: anon should never have written to these
-- tables. Revoke broad grants (no-op if absent).
revoke all on public.design_sessions  from anon;
revoke all on public.design_layers    from anon;
revoke all on public.design_exports   from anon;
revoke all on public.flipbook_brochures from anon;
-- flipbook_pages and flipbook_hotlinks retain their existing public-read policies
-- (only for rows tied to status='published' brochures), so do not revoke from anon.

-- End of migration.
