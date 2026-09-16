-- Designer Studio Phase 1 — schema, RLS, roles.
-- Ref: docs/3d-editor/wincyc-designer-studio-architecture.md Part 3/4/8,
-- rulings R1-R10 (docs/3d-editor/STATUS.md). Additive only.
--
-- Rulings applied, overriding the architecture doc where they differ:
--   R1 brand_id uuid references brands(id) everywhere (never team_id);
--      designs gains draft_recipe/draft_updated_at for autosave;
--      design_versions holds only named/event versions (no is_autosave),
--      gains author_kind.
--   R2 design_versions.snapshot also carries model_storage_path/model_sha256
--      (documented via column comment, no constraint).
--   R3 finish_processes gains deboss/feature tolerance columns.
--   R4 designer_staff mirrors catalogue_editors; user_is_designer_staff() and
--      user_has_brand_role() are new security-definer helpers.
--   R5 RLS: designs select per architecture Part 4; insert/update by owner,
--      brand manager/owner, or staff; versions/assets/shares/quotes inherit
--      via join to designs (product_images pattern); anon has no access to
--      any new table; explicit GRANTs on every new table.
--   R6 storage: product-models (public read, catalogue-editor write) and
--      design-uploads (private, path-scoped); products already has
--      model_url, so no new products column is added.
--   R7 editor_sessions / customization_requests untouched.

-- ---------------------------------------------------------------------
-- R4 — designer_staff (mirrors catalogue_editors exactly)
-- ---------------------------------------------------------------------
create table public.designer_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.designer_staff enable row level security;

create policy "Users read own designer staff grant"
on public.designer_staff
for select
to authenticated
using (user_id = auth.uid());

-- No insert/update/delete policy for any client role: RLS default-denies
-- all writes. Grants are made only via direct SQL (service role / migrations),
-- same as catalogue_editors.
revoke all on public.designer_staff from anon;
grant select on public.designer_staff to authenticated;
grant all on public.designer_staff to service_role;

create or replace function public.user_is_designer_staff(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.designer_staff where user_id = _user_id
  );
$$;

grant execute on function public.user_is_designer_staff(uuid) to authenticated;

-- Brand-scoped role check — user_is_brand_manager_or_owner() (P14) checks
-- role globally; this checks it for one specific brand, which design write
-- policies below need.
create or replace function public.user_has_brand_role(_user_id uuid, _brand_id uuid, _roles public.brand_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.brand_memberships
    where user_id = _user_id and brand_id = _brand_id and role = any(_roles)
  );
$$;

grant execute on function public.user_has_brand_role(uuid, uuid, public.brand_role[]) to authenticated;

-- ---------------------------------------------------------------------
-- R3 — finish_processes deboss/feature tolerances
-- ---------------------------------------------------------------------
alter table public.finish_processes
  add column if not exists min_feature_mm numeric,
  add column if not exists min_deboss_depth_mm numeric,
  add column if not exists max_deboss_depth_mm numeric;

-- ---------------------------------------------------------------------
-- design_assets (created first: designs.source_asset_id references it)
-- ---------------------------------------------------------------------
create table public.design_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  brand_id uuid references public.brands(id),
  kind text not null check (kind in ('logo_svg','font','obj','texture')),
  storage_path text not null,
  original_filename text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz not null default now()
);

create index idx_design_assets_owner on public.design_assets(owner_id);
create index idx_design_assets_brand on public.design_assets(brand_id);

-- ---------------------------------------------------------------------
-- designs
-- ---------------------------------------------------------------------
create table public.designs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product_id uuid references public.products(id) on delete set null,
  source_asset_id uuid references public.design_assets(id) on delete set null,
  brand_id uuid references public.brands(id),
  owner_id uuid not null references auth.users(id) on delete cascade,
  current_version_id uuid,
  status text not null default 'draft'
    check (status in ('draft','submitted','quoted','approved','archived')),
  draft_recipe jsonb,
  draft_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_designs_owner on public.designs(owner_id);
create index idx_designs_brand on public.designs(brand_id);
create index idx_designs_product on public.designs(product_id);

create trigger trg_designs_updated_at before update on public.designs
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- design_versions — immutable named/event versions only (no autosave rows;
-- autosave lives on designs.draft_recipe/draft_updated_at per R1).
-- ---------------------------------------------------------------------
create table public.design_versions (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  version_number int not null,
  label text,
  recipe jsonb not null,
  snapshot jsonb not null,
  thumbnail_url text,
  author_kind text not null check (author_kind in ('buyer','staff')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (design_id, version_number)
);

create index idx_design_versions_design on public.design_versions(design_id);

-- R2: snapshot shape, documented here (no constraint — jsonb stays schemaless).
comment on column public.design_versions.snapshot is
  'Denormalised copy of every referenced entity at save time: product '
  '(name, item_code), finish (name, cyc_code, hex, material params), size '
  'variant (measurements), plus model_storage_path (the OBJ this version '
  'renders from) and model_sha256 (its content hash, for cache/integrity '
  'checks). Rendering reads this column, never live rows — see architecture '
  'doc Part 3.';

-- Circular FK: designs.current_version_id -> design_versions.id, added now
-- that design_versions exists.
alter table public.designs
  add constraint designs_current_version_id_fkey
  foreign key (current_version_id) references public.design_versions(id) on delete set null;

-- ---------------------------------------------------------------------
-- design_shares
-- ---------------------------------------------------------------------
create table public.design_shares (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  shared_with_user_id uuid not null references auth.users(id) on delete cascade,
  can_edit boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (design_id, shared_with_user_id)
);

create index idx_design_shares_design on public.design_shares(design_id);
create index idx_design_shares_recipient on public.design_shares(shared_with_user_id);

-- designs' SELECT policy and design_shares' policies each reference the
-- other table; without this, Postgres reports "infinite recursion detected
-- in policy for relation designs" the moment both RLS-enabled tables are
-- queried together. Routing the design_shares lookup through a security
-- definer function (same reasoning as user_has_brand/user_is_catalogue_editor)
-- bypasses design_shares' own RLS for this internal check and breaks the cycle.
create or replace function public.user_has_design_share(_user_id uuid, _design_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.design_shares
    where design_id = _design_id and shared_with_user_id = _user_id
  );
$$;

grant execute on function public.user_has_design_share(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------
-- design_quotes
-- ---------------------------------------------------------------------
create table public.design_quotes (
  id uuid primary key default gen_random_uuid(),
  design_id uuid not null references public.designs(id) on delete cascade,
  design_version_id uuid not null references public.design_versions(id) on delete restrict,
  requested_by uuid not null references auth.users(id),
  requested_at timestamptz not null default now(),
  quantity int,
  notes text,
  status text not null default 'pending'
    check (status in ('pending','responded','accepted','declined')),
  responded_by uuid references auth.users(id),
  responded_at timestamptz,
  response_notes text
);

create index idx_design_quotes_design on public.design_quotes(design_id);

-- ---------------------------------------------------------------------
-- RLS — designs (R5: select per architecture Part 4; insert/update by
-- owner, brand manager/owner, or staff)
-- ---------------------------------------------------------------------
alter table public.designs enable row level security;

create policy "Read own, brand, shared, or staff designs" on public.designs
for select to authenticated
using (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand(auth.uid(), brand_id))
  or public.user_is_designer_staff(auth.uid())
  or public.user_has_design_share(auth.uid(), designs.id)
);

create policy "Owner, brand manager, or staff insert designs" on public.designs
for insert to authenticated
with check (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand_role(auth.uid(), brand_id, array['manager','owner']::public.brand_role[]))
  or public.user_is_designer_staff(auth.uid())
);

create policy "Owner, brand manager, or staff update designs" on public.designs
for update to authenticated
using (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand_role(auth.uid(), brand_id, array['manager','owner']::public.brand_role[]))
  or public.user_is_designer_staff(auth.uid())
)
with check (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand_role(auth.uid(), brand_id, array['manager','owner']::public.brand_role[]))
  or public.user_is_designer_staff(auth.uid())
);

-- No delete policy: designs are archived (status = 'archived'), never
-- deleted — architecture Part 5.

-- ---------------------------------------------------------------------
-- RLS — design_versions (product_images pattern: read inherits the full
-- design visibility; write mirrors the design write gate. Immutable —
-- no update/delete policy at all.)
-- ---------------------------------------------------------------------
alter table public.design_versions enable row level security;

create policy "Read versions via design visibility" on public.design_versions
for select to authenticated
using (
  exists (
    select 1 from public.designs d
    where d.id = design_versions.design_id
      and (
        d.owner_id = auth.uid()
        or (d.brand_id is not null and public.user_has_brand(auth.uid(), d.brand_id))
        or public.user_is_designer_staff(auth.uid())
        or public.user_has_design_share(auth.uid(), d.id)
      )
  )
);

create policy "Owner, brand manager, or staff insert versions" on public.design_versions
for insert to authenticated
with check (
  exists (
    select 1 from public.designs d
    where d.id = design_versions.design_id
      and (
        d.owner_id = auth.uid()
        or (d.brand_id is not null and public.user_has_brand_role(auth.uid(), d.brand_id, array['manager','owner']::public.brand_role[]))
        or public.user_is_designer_staff(auth.uid())
      )
  )
);

-- ---------------------------------------------------------------------
-- RLS — design_assets (no design_id column — assets are owned/brand-scoped
-- directly and reused across designs, per architecture Part 3. Read/write
-- gates mirror the designs table's own owner/brand/staff shape.)
-- ---------------------------------------------------------------------
alter table public.design_assets enable row level security;

create policy "Read own, brand, or staff design_assets" on public.design_assets
for select to authenticated
using (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand(auth.uid(), brand_id))
  or public.user_is_designer_staff(auth.uid())
);

create policy "Owner, brand manager, or staff insert design_assets" on public.design_assets
for insert to authenticated
with check (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand_role(auth.uid(), brand_id, array['manager','owner']::public.brand_role[]))
  or public.user_is_designer_staff(auth.uid())
);

create policy "Owner, brand manager, or staff update design_assets" on public.design_assets
for update to authenticated
using (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand_role(auth.uid(), brand_id, array['manager','owner']::public.brand_role[]))
  or public.user_is_designer_staff(auth.uid())
)
with check (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand_role(auth.uid(), brand_id, array['manager','owner']::public.brand_role[]))
  or public.user_is_designer_staff(auth.uid())
);

create policy "Owner, brand manager, or staff delete design_assets" on public.design_assets
for delete to authenticated
using (
  owner_id = auth.uid()
  or (brand_id is not null and public.user_has_brand_role(auth.uid(), brand_id, array['manager','owner']::public.brand_role[]))
  or public.user_is_designer_staff(auth.uid())
);

-- ---------------------------------------------------------------------
-- RLS — design_shares
-- ---------------------------------------------------------------------
alter table public.design_shares enable row level security;

create policy "Read shares via design or as recipient" on public.design_shares
for select to authenticated
using (
  shared_with_user_id = auth.uid()
  or exists (
    select 1 from public.designs d
    where d.id = design_shares.design_id
      and (
        d.owner_id = auth.uid()
        or (d.brand_id is not null and public.user_has_brand_role(auth.uid(), d.brand_id, array['manager','owner']::public.brand_role[]))
        or public.user_is_designer_staff(auth.uid())
      )
  )
);

create policy "Owner, brand manager, or staff insert design_shares" on public.design_shares
for insert to authenticated
with check (
  exists (
    select 1 from public.designs d
    where d.id = design_shares.design_id
      and (
        d.owner_id = auth.uid()
        or (d.brand_id is not null and public.user_has_brand_role(auth.uid(), d.brand_id, array['manager','owner']::public.brand_role[]))
        or public.user_is_designer_staff(auth.uid())
      )
  )
);

create policy "Owner, brand manager, or staff delete design_shares" on public.design_shares
for delete to authenticated
using (
  exists (
    select 1 from public.designs d
    where d.id = design_shares.design_id
      and (
        d.owner_id = auth.uid()
        or (d.brand_id is not null and public.user_has_brand_role(auth.uid(), d.brand_id, array['manager','owner']::public.brand_role[]))
        or public.user_is_designer_staff(auth.uid())
      )
  )
);

-- ---------------------------------------------------------------------
-- RLS — design_quotes (R5 explicit: insert by owner or brand member;
-- update by staff only)
-- ---------------------------------------------------------------------
alter table public.design_quotes enable row level security;

create policy "Read quotes via design visibility" on public.design_quotes
for select to authenticated
using (
  exists (
    select 1 from public.designs d
    where d.id = design_quotes.design_id
      and (
        d.owner_id = auth.uid()
        or (d.brand_id is not null and public.user_has_brand(auth.uid(), d.brand_id))
        or public.user_is_designer_staff(auth.uid())
        or public.user_has_design_share(auth.uid(), d.id)
      )
  )
);

create policy "Owner or brand member insert design_quotes" on public.design_quotes
for insert to authenticated
with check (
  exists (
    select 1 from public.designs d
    where d.id = design_quotes.design_id
      and (
        d.owner_id = auth.uid()
        or (d.brand_id is not null and public.user_has_brand(auth.uid(), d.brand_id))
      )
  )
  or public.user_is_designer_staff(auth.uid())
);

create policy "Staff update design_quotes" on public.design_quotes
for update to authenticated
using (public.user_is_designer_staff(auth.uid()))
with check (public.user_is_designer_staff(auth.uid()));

-- ---------------------------------------------------------------------
-- R5 — explicit GRANTs (RLS without GRANTs returns empty). Anon has no
-- access to any new table.
-- ---------------------------------------------------------------------
revoke all on public.designs, public.design_versions, public.design_assets,
  public.design_shares, public.design_quotes, public.designer_staff from anon;

grant select, insert, update on public.designs to authenticated;
grant select, insert on public.design_versions to authenticated;
grant select, insert, update, delete on public.design_assets to authenticated;
grant select, insert, delete on public.design_shares to authenticated;
grant select, insert, update on public.design_quotes to authenticated;

grant all on public.designs, public.design_versions, public.design_assets,
  public.design_shares, public.design_quotes, public.designer_staff to service_role;

-- ---------------------------------------------------------------------
-- R6 — storage buckets
-- ---------------------------------------------------------------------

-- product-models: public read (mirrors product-images/product-assets),
-- write gated on catalogue editors. products.model_url already exists
-- (supabase/migrations/20260316105420_…:112) and is the 3D-model column —
-- no new products column added.
insert into storage.buckets (id, name, public)
values ('product-models', 'product-models', true)
on conflict (id) do nothing;

create policy "Public read product-models" on storage.objects
for select
using (bucket_id = 'product-models');

create policy "Catalogue editors upload product-models" on storage.objects
for insert to authenticated
with check (bucket_id = 'product-models' and public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors update product-models" on storage.objects
for update to authenticated
using (bucket_id = 'product-models' and public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors delete product-models" on storage.objects
for delete to authenticated
using (bucket_id = 'product-models' and public.user_is_catalogue_editor(auth.uid()));

-- design-uploads: private. Object path's first segment must be either the
-- owner's auth uid or a brand_id (app-enforced convention — see R6).
insert into storage.buckets (id, name, public)
values ('design-uploads', 'design-uploads', false)
on conflict (id) do nothing;

create policy "Owner, brand, or staff read design-uploads" on storage.objects
for select to authenticated
using (
  bucket_id = 'design-uploads'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.user_has_brand(auth.uid(), nullif((storage.foldername(name))[1], '')::uuid)
    or public.user_is_designer_staff(auth.uid())
  )
);

create policy "Owner, brand manager, or staff write design-uploads" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'design-uploads'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.user_has_brand_role(auth.uid(), nullif((storage.foldername(name))[1], '')::uuid, array['manager','owner']::public.brand_role[])
    or public.user_is_designer_staff(auth.uid())
  )
);

create policy "Owner, brand manager, or staff update design-uploads" on storage.objects
for update to authenticated
using (
  bucket_id = 'design-uploads'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.user_has_brand_role(auth.uid(), nullif((storage.foldername(name))[1], '')::uuid, array['manager','owner']::public.brand_role[])
    or public.user_is_designer_staff(auth.uid())
  )
);

create policy "Owner, brand manager, or staff delete design-uploads" on storage.objects
for delete to authenticated
using (
  bucket_id = 'design-uploads'
  and (
    (storage.foldername(name))[1] = auth.uid()::text
    or public.user_has_brand_role(auth.uid(), nullif((storage.foldername(name))[1], '')::uuid, array['manager','owner']::public.brand_role[])
    or public.user_is_designer_staff(auth.uid())
  )
);

-- End of Phase 1 migration.
