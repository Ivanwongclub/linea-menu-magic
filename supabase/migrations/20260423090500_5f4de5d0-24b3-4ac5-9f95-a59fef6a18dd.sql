-- Brand-scoped access hardening for designer working tables.
-- Ensures authenticated users can only access sessions/layers/exports
-- tied to brands they belong to.

-- Helper for tables that store brand/team as text (e.g. design_sessions.team_id)
create or replace function public.user_has_brand_text(_user_id uuid, _brand_text text)
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
      and brand_id::text = _brand_text
  );
$$;

grant execute on function public.user_has_brand_text(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- design_sessions
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated read design_sessions" on public.design_sessions;
drop policy if exists "Authenticated manage design_sessions" on public.design_sessions;
drop policy if exists "Authed read own brand design_sessions" on public.design_sessions;
drop policy if exists "Authed insert own brand design_sessions" on public.design_sessions;
drop policy if exists "Authed update own brand design_sessions" on public.design_sessions;
drop policy if exists "Authed delete own brand design_sessions" on public.design_sessions;

create policy "Authed read own brand design_sessions"
on public.design_sessions
for select
to authenticated
using (public.user_has_brand_text(auth.uid(), team_id));

create policy "Authed insert own brand design_sessions"
on public.design_sessions
for insert
to authenticated
with check (public.user_has_brand_text(auth.uid(), team_id));

create policy "Authed update own brand design_sessions"
on public.design_sessions
for update
to authenticated
using (public.user_has_brand_text(auth.uid(), team_id))
with check (public.user_has_brand_text(auth.uid(), team_id));

create policy "Authed delete own brand design_sessions"
on public.design_sessions
for delete
to authenticated
using (public.user_has_brand_text(auth.uid(), team_id));

-- ---------------------------------------------------------------------------
-- design_layers
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated read design_layers" on public.design_layers;
drop policy if exists "Authenticated manage design_layers" on public.design_layers;
drop policy if exists "Authed read own brand design_layers" on public.design_layers;
drop policy if exists "Authed insert own brand design_layers" on public.design_layers;
drop policy if exists "Authed update own brand design_layers" on public.design_layers;
drop policy if exists "Authed delete own brand design_layers" on public.design_layers;

create policy "Authed read own brand design_layers"
on public.design_layers
for select
to authenticated
using (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_layers.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);

create policy "Authed insert own brand design_layers"
on public.design_layers
for insert
to authenticated
with check (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_layers.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);

create policy "Authed update own brand design_layers"
on public.design_layers
for update
to authenticated
using (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_layers.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
)
with check (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_layers.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);

create policy "Authed delete own brand design_layers"
on public.design_layers
for delete
to authenticated
using (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_layers.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);

-- ---------------------------------------------------------------------------
-- design_exports
-- ---------------------------------------------------------------------------
drop policy if exists "Authenticated read design_exports" on public.design_exports;
drop policy if exists "Authenticated manage design_exports" on public.design_exports;
drop policy if exists "Authed read own brand design_exports" on public.design_exports;
drop policy if exists "Authed insert own brand design_exports" on public.design_exports;
drop policy if exists "Authed update own brand design_exports" on public.design_exports;
drop policy if exists "Authed delete own brand design_exports" on public.design_exports;

create policy "Authed read own brand design_exports"
on public.design_exports
for select
to authenticated
using (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_exports.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);

create policy "Authed insert own brand design_exports"
on public.design_exports
for insert
to authenticated
with check (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_exports.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);

create policy "Authed update own brand design_exports"
on public.design_exports
for update
to authenticated
using (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_exports.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
)
with check (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_exports.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);

create policy "Authed delete own brand design_exports"
on public.design_exports
for delete
to authenticated
using (
  exists (
    select 1
    from public.design_sessions s
    where s.id = design_exports.session_id
      and public.user_has_brand_text(auth.uid(), s.team_id)
  )
);
