-- 1. brands table
create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.brands enable row level security;

create policy "Public read active brands" on public.brands
  for select to anon using (is_active = true);
create policy "Authed read brands" on public.brands
  for select to authenticated using (true);

-- 2. brand role enum + memberships
do $$ begin
  create type public.brand_role as enum ('member','manager','owner');
exception when duplicate_object then null; end $$;

create table public.brand_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  brand_id uuid not null references public.brands(id) on delete cascade,
  role public.brand_role not null default 'member',
  created_at timestamptz not null default now(),
  unique (user_id, brand_id)
);
alter table public.brand_memberships enable row level security;

create policy "Users read own memberships" on public.brand_memberships
  for select to authenticated using (user_id = auth.uid());

create index brand_memberships_user_idx on public.brand_memberships(user_id);
create index brand_memberships_brand_idx on public.brand_memberships(brand_id);

-- 3. SECURITY DEFINER helper to avoid recursive RLS
create or replace function public.user_has_brand(_user_id uuid, _brand_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.brand_memberships
    where user_id = _user_id and brand_id = _brand_id
  )
$$;

-- 4. products.brand_id
alter table public.products
  add column if not exists brand_id uuid references public.brands(id);
create index if not exists products_brand_id_idx on public.products(brand_id);

-- 5. Tighten products RLS
drop policy if exists "Public read active products" on public.products;
drop policy if exists "Authenticated read all products" on public.products;

create policy "Anon read public active products" on public.products
  for select to anon
  using (status = 'active' and is_public = true and brand_id is null);

create policy "Authed read public + own brand products" on public.products
  for select to authenticated
  using (
    (status = 'active' and is_public = true and brand_id is null)
    or (brand_id is not null and public.user_has_brand(auth.uid(), brand_id))
  );

-- 6. Lock down designer working tables (remove overly broad anon ALL)
drop policy if exists "Public read design_sessions" on public.design_sessions;
drop policy if exists "Public manage design_sessions" on public.design_sessions;
drop policy if exists "Public read design_layers" on public.design_layers;
drop policy if exists "Public manage design_layers" on public.design_layers;
drop policy if exists "Public read design_exports" on public.design_exports;
drop policy if exists "Public manage design_exports" on public.design_exports;

-- 7. user_library_items: brand-scoped + admin defaults
drop policy if exists "Public read library items" on public.user_library_items;
drop policy if exists "Public manage library items" on public.user_library_items;
drop policy if exists "Authenticated read library items" on public.user_library_items;
drop policy if exists "Authenticated manage library items" on public.user_library_items;

create policy "Authed read brand library + defaults" on public.user_library_items
  for select to authenticated
  using (
    is_admin_default = true
    or public.user_has_brand(auth.uid(), team_id)
  );

create policy "Authed manage own brand library" on public.user_library_items
  for all to authenticated
  using (public.user_has_brand(auth.uid(), team_id))
  with check (public.user_has_brand(auth.uid(), team_id));

-- 8. Seed brand + private products
insert into public.brands (id, slug, name)
values ('11111111-1111-1111-1111-111111111111','polo-ralph-lauren','Polo Ralph Lauren')
on conflict (slug) do nothing;

insert into public.products (name, slug, item_code, status, is_public, brand_id, description)
values
  ('Polo Signature Horn Button','polo-signature-horn-button','PRL-BTN-001','active', false,
   '11111111-1111-1111-1111-111111111111','Private Polo Ralph Lauren signature horn button — for authorized brand designers only.'),
  ('Polo Equestrian Metal Snap','polo-equestrian-metal-snap','PRL-SNP-002','active', false,
   '11111111-1111-1111-1111-111111111111','Private Polo Ralph Lauren equestrian-line metal snap — for authorized brand designers only.')
on conflict (slug) do nothing;
