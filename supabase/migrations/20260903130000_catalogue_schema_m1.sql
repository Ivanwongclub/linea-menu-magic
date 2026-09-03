-- M1 — WIN-CYC catalogue schema (FINAL, staged 2026-09-03)
-- Ready to apply. Reviewed and ruled on by the client across two rounds.
--
-- Incorporates:
--   1. sku dropped; item_code is the published identifier. Live-confirmed
--      2026-09-03: 0 active products have a null item_code, so
--      published_needs_item_code freezes nothing on landing.
--   2. product_size_variants: size_mm -> size_primary_mm, + size_secondary_mm,
--      + size_label; size_ligne derives from size_primary_mm only.
--   3. products gains tensile_strength, origin, sample_time_days. No capacity.
--   4. compliance_standards gains zh_hant/zh_hans; finishes.factory_name_zh
--      split into factory_name_zh_hant / factory_name_zh_hans.
--   5. DB-level metal-only gate, both directions, covering both
--      product_finishes rows and products.default_finish_id:
--      (a) product_finishes: BEFORE INSERT OR UPDATE, rejects attaching a
--          finish unless the product's material is_metal = true (a product
--          with no material set is allowed through — drafts aren't blocked).
--      (b) products: BEFORE UPDATE, rejects changing material_id to a
--          non-metal material or to null while product_finishes rows still
--          reference that product, or while default_finish_id is still set;
--          the error names how many finishes are attached.
--      (c) products: BEFORE INSERT OR UPDATE, rejects setting
--          default_finish_id unless the product's material is_metal = true
--          (null material passes, same as (a)).
--   6. prevent_code_change() rewritten via to_jsonb, and now only fires once
--      the old value was already set — finishes.cyc_code is nullable for
--      non-standard finishes, so a custom finish can still be promoted to a
--      coded standard one (null -> 'CYC-0136'). Also attached to
--      compliance_standards.code for consistency with product_attachments.
--      product_compliance_map / product_finishes / product_colours /
--      product_size_variants get parent-visibility-scoped read instead of
--      blanket public read.
--   7. finishes read policy gated on is_public, catalogue editors see all.
--      finishes.updated_at now refreshed on every update via a trigger
--      (previously only defaulted on insert).
--   8. product_families.segment constrained to ('apparel','beauty','material').
--
-- All new/rewritten trigger functions that check sibling-table state
-- (check_finish_requires_metal_material, check_material_change_preserves_finishes,
-- check_default_finish_requires_metal_material)
-- are SECURITY DEFINER: without it, a catalogue editor updating a product or
-- finish they don't have brand-scoped SELECT access to (e.g. another brand's
-- private catalogue — catalogue-editor UPDATE rights on products are not
-- brand-scoped, only their plain-authenticated read is) would have those
-- internal existence checks silently filtered by RLS instead of seeing the
-- real data, defeating the gate for exactly the case it exists to catch.
-- Same reasoning already used for user_has_brand / user_is_catalogue_editor.

-- ---------------------------------------------------------------------
-- Trigger functions (created before anything that attaches them)
-- ---------------------------------------------------------------------

-- Fix #6: generic "this column is immutable once set" trigger, rewritten to
-- look the column up dynamically instead of referencing static field names
-- that don't exist on every table this is attached to. Only fires once the
-- old value was already set — finishes.cyc_code is nullable for
-- non-standard finishes, and a custom finish must still be promotable to a
-- coded standard one (null -> 'CYC-0136'). The 8 axis tables' code is NOT
-- NULL, so this is a no-op change for them.
create or replace function public.prevent_code_change()
returns trigger language plpgsql as $$
declare
  col text := tg_argv[0];
begin
  if (to_jsonb(old) ->> col) is not null
     and (to_jsonb(new) ->> col) is distinct from (to_jsonb(old) ->> col) then
    raise exception '% is immutable (id %)', col, old.id;
  end if;
  return new;
end $$;

-- finishes.updated_at defaults on insert only; this keeps it current on
-- every update instead of relying on callers to set it themselves.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- Ruling 5(a): metal-only finish gate, enforced in the database. Products with
-- no material set (material_id is null — e.g. still a draft) are allowed
-- through; only an explicitly non-metal material blocks the write.
-- security definer: see file header — must see the real product/material
-- rows regardless of the calling editor's own brand-scoped read access.
create or replace function public.check_finish_requires_metal_material()
returns trigger language plpgsql
security definer set search_path = public
as $$
declare
  v_material_id uuid;
  v_is_metal boolean;
begin
  select p.material_id into v_material_id
  from public.products p
  where p.id = new.product_id;

  if v_material_id is null then
    return new;
  end if;

  select m.is_metal into v_is_metal
  from public.product_materials m
  where m.id = v_material_id;

  if v_is_metal is not true then
    raise exception 'product % material is not flagged is_metal — finishes cannot be assigned', new.product_id;
  end if;

  return new;
end $$;

-- Ruling 5(b): the other half of the gate — block changing an existing
-- product's material away from metal (or clearing it) while it still has
-- finishes attached, OR while it still has a default_finish_id set. Only
-- fires when material_id actually changes; a product with zero attached
-- finishes and no default_finish_id can change material freely.
create or replace function public.check_material_change_preserves_finishes()
returns trigger language plpgsql
security definer set search_path = public
as $$
declare
  v_is_metal boolean;
  v_finish_count int;
begin
  if new.material_id is not distinct from old.material_id then
    return new;
  end if;

  select count(*) into v_finish_count
  from public.product_finishes
  where product_id = new.id;

  if v_finish_count = 0 and new.default_finish_id is null then
    return new;
  end if;

  if new.material_id is null then
    raise exception 'product % has % finish(es) attached (default_finish_id %) — material cannot be cleared', new.id, v_finish_count, new.default_finish_id;
  end if;

  select m.is_metal into v_is_metal
  from public.product_materials m
  where m.id = new.material_id;

  if v_is_metal is not true then
    raise exception 'product % has % finish(es) attached (default_finish_id %) — material must remain metal', new.id, v_finish_count, new.default_finish_id;
  end if;

  return new;
end $$;

-- Ruling 5(b) cont'd: the insert-side mirror of the gate above — block
-- setting default_finish_id (on insert or update) unless the product's
-- material is flagged is_metal. A product with no material set (material_id
-- is null — e.g. still a draft) is allowed through, same as
-- check_finish_requires_metal_material above.
create or replace function public.check_default_finish_requires_metal_material()
returns trigger language plpgsql
security definer set search_path = public
as $$
declare
  v_is_metal boolean;
begin
  if new.default_finish_id is null or new.material_id is null then
    return new;
  end if;

  select m.is_metal into v_is_metal
  from public.product_materials m
  where m.id = new.material_id;

  if v_is_metal is not true then
    raise exception 'product % material is not flagged is_metal — default_finish_id cannot be set', new.id;
  end if;

  return new;
end $$;

-- ---------------------------------------------------------------------
-- product_families
-- ---------------------------------------------------------------------
create table public.product_families (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  name_zh_hant text,
  name_zh_hans text,
  tagline text,
  segment text not null default 'apparel'
    check (segment in ('apparel','beauty','material')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- product_categories (existing table)
-- ---------------------------------------------------------------------
alter table public.product_categories
  add column if not exists family_id uuid references public.product_families(id) on delete restrict,
  add column if not exists name_zh_hant text,
  add column if not exists name_zh_hans text,
  add column if not exists is_active boolean not null default true;

create index if not exists idx_categories_family on public.product_categories(family_id);

-- ---------------------------------------------------------------------
-- product_materials (existing table)
-- ---------------------------------------------------------------------
alter table public.product_materials
  add column if not exists is_metal boolean not null default false,
  add column if not exists name_zh_hant text,
  add column if not exists name_zh_hans text;

-- ---------------------------------------------------------------------
-- product_attachments
-- ---------------------------------------------------------------------
create table public.product_attachments (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  name_zh_hant text,
  name_zh_hans text,
  sort_order int not null default 0
);
create trigger trg_attachments_code before update on public.product_attachments
  for each row execute function public.prevent_code_change('code');

-- ---------------------------------------------------------------------
-- compliance_standards (ruling 4: + zh_hant/zh_hans)
-- ---------------------------------------------------------------------
create table public.compliance_standards (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  name_zh_hant text,
  name_zh_hans text,
  sort_order int not null default 0
);
create trigger trg_compliance_standards_code before update on public.compliance_standards
  for each row execute function public.prevent_code_change('code');

create table public.product_compliance_map (
  product_id uuid not null references public.products(id) on delete cascade,
  standard_id uuid not null references public.compliance_standards(id) on delete restrict,
  primary key (product_id, standard_id)
);

-- ---------------------------------------------------------------------
-- Finish facet axis tables (8) — unchanged from the original draft
-- ---------------------------------------------------------------------
do $$
declare a text;
begin
  foreach a in array array[
    'finish_processes','finish_base_families','finish_surfaces','finish_tones',
    'finish_effects','finish_tints','finish_coatings','finish_patterns'
  ] loop
    execute format($f$
      create table public.%I (
        id uuid primary key default gen_random_uuid(),
        code text unique not null,
        name text not null,
        name_zh_hant text,
        name_zh_hans text,
        sort_order int not null default 0,
        is_active boolean not null default true,
        created_at timestamptz not null default now()
      )$f$, a);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.prevent_code_change(''code'')',
      'trg_'||a||'_code', a);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- finishes (ruling 4: factory_name_zh split into hant/hans)
-- ---------------------------------------------------------------------
create table public.finishes (
  id uuid primary key default gen_random_uuid(),
  cyc_code text unique,
  is_standard boolean not null default true,
  factory_name_en text not null,
  factory_name_zh_hant text,
  factory_name_zh_hans text,
  marketing_name text not null,
  marketing_name_zh_hant text,
  marketing_name_zh_hans text,
  chart_page text,
  process_id uuid references public.finish_processes(id) on delete restrict,
  base_family_id uuid references public.finish_base_families(id) on delete restrict,
  surface_id uuid references public.finish_surfaces(id) on delete restrict,
  tone_id uuid references public.finish_tones(id) on delete restrict,
  effect_id uuid references public.finish_effects(id) on delete restrict,
  tint_id uuid references public.finish_tints(id) on delete restrict,
  coating_id uuid references public.finish_coatings(id) on delete restrict,
  pattern_id uuid references public.finish_patterns(id) on delete restrict,
  swatch_url text,
  hex_approx text,
  status text not null default 'active' check (status in ('active','discontinued')),
  is_public boolean not null default false,
  notes text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint standard_finish_needs_code
    check (is_standard = false or cyc_code is not null)
);
create trigger trg_finishes_code before update on public.finishes
  for each row execute function public.prevent_code_change('cyc_code');
create trigger trg_finishes_updated_at before update on public.finishes
  for each row execute function public.set_updated_at();
create index idx_finishes_process on public.finishes(process_id);
create index idx_finishes_base on public.finishes(base_family_id);
create index idx_finishes_surface on public.finishes(surface_id);

-- ---------------------------------------------------------------------
-- product_finishes (+ ruling 5: metal-only gate trigger)
-- ---------------------------------------------------------------------
create table public.product_finishes (
  product_id uuid not null references public.products(id) on delete cascade,
  finish_id uuid not null references public.finishes(id) on delete restrict,
  sort_order int not null default 0,
  primary key (product_id, finish_id)
);

create trigger trg_product_finishes_requires_metal
  before insert or update on public.product_finishes
  for each row execute function public.check_finish_requires_metal_material();

-- ---------------------------------------------------------------------
-- product_colours
-- ---------------------------------------------------------------------
create table public.product_colours (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null,
  name_zh_hant text,
  name_zh_hans text,
  hex text,
  sort_order int not null default 0
);
create index idx_product_colours_product on public.product_colours(product_id);

-- ---------------------------------------------------------------------
-- product_size_variants (ruling 2)
-- ---------------------------------------------------------------------
create table public.product_size_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size_primary_mm numeric(6,2) not null,
  size_secondary_mm numeric(6,2),
  size_label text,
  size_ligne numeric(6,1) generated always as (round((size_primary_mm / 0.635)::numeric, 1)) stored,
  weight_g numeric(6,2),
  thickness_mm numeric(6,2),
  is_default boolean not null default false,
  sort_order int not null default 0
);
create index idx_size_variants_product on public.product_size_variants(product_id);
create unique index idx_one_default_size on public.product_size_variants(product_id)
  where is_default;

-- ---------------------------------------------------------------------
-- products (ruling 1: no sku, item_code is the publish identifier;
-- ruling 3: + tensile_strength, origin, sample_time_days; no capacity)
-- ---------------------------------------------------------------------
alter table public.products
  add column if not exists material_id uuid references public.product_materials(id) on delete restrict,
  add column if not exists attachment_id uuid references public.product_attachments(id) on delete restrict,
  add column if not exists default_finish_id uuid references public.finishes(id) on delete restrict,
  add column if not exists face_style text,
  add column if not exists hole_count int,
  add column if not exists logo_customisable boolean not null default false,
  add column if not exists moq_qty int,
  add column if not exists moq_unit text default 'pcs',
  add column if not exists lead_time_min_days int,
  add column if not exists lead_time_max_days int,
  add column if not exists sample_time_days int,
  add column if not exists wash_resistance text,
  add column if not exists nickel_release_compliant boolean,
  add column if not exists tensile_strength text,
  add column if not exists origin text;

-- item_code already carries a column-level UNIQUE constraint from the
-- original schema (supabase/migrations/20260316105731...sql:100) — no new
-- index needed; a partial "where not null" index would be fully redundant
-- (plain UNIQUE already excludes NULLs from the uniqueness check).

-- Live-confirmed 2026-09-03: select count(*) from products where
-- status = 'active' and item_code is null returns 0 — this constraint
-- freezes nothing on landing.
alter table public.products
  add constraint published_needs_item_code
  check (status <> 'active' or item_code is not null) not valid;

create trigger trg_products_material_change_guards_finishes
  before update on public.products
  for each row execute function public.check_material_change_preserves_finishes();

create trigger trg_products_default_finish_requires_metal
  before insert or update on public.products
  for each row execute function public.check_default_finish_requires_metal_material();

-- ---------------------------------------------------------------------
-- RLS — split by table shape, per ruling 6/7.
-- ---------------------------------------------------------------------

-- (a) Pure lookup/taxonomy tables: public read, catalogue-editor write.
do $$
declare t text;
begin
  foreach t in array array[
    'product_families','product_attachments','compliance_standards',
    'finish_processes','finish_base_families',
    'finish_surfaces','finish_tones','finish_effects','finish_tints',
    'finish_coatings','finish_patterns'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to public using (true)',
      'Public read '||t, t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors insert '||t, t);
    execute format('create policy %I on public.%I for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors update '||t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors delete '||t, t);
  end loop;
end $$;

-- (b) finishes — read gated on is_public; catalogue editors see everything
-- (including drafts, for the CMS). Write unchanged (editors only).
alter table public.finishes enable row level security;

create policy "Public read published finishes" on public.finishes
  for select to public
  using (is_public = true or public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors insert finishes" on public.finishes
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update finishes" on public.finishes
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete finishes" on public.finishes
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- (c) Product-linked tables — read mirrors the parent product's own
-- visibility (same pattern as the product_images fix in P21), not a
-- blanket public read.
do $$
declare t text;
begin
  foreach t in array array[
    'product_compliance_map','product_finishes','product_colours','product_size_variants'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format($f$
      create policy %I on public.%I for select to anon
      using (exists (
        select 1 from public.products p
        where p.id = %I.product_id
          and p.status = 'active' and p.is_public = true and p.brand_id is null
      ))$f$, 'Anon read '||t, t, t);

    -- Mirrors the live products read policy exactly (three branches, not
    -- two — see 20260903120000_catalogue_rls_hardening.sql): editor bypass,
    -- then house products gated on status/is_public (not brand_id is null
    -- alone), then own-brand products. Section (c) previously fell back to
    -- a stale two-branch copy of this policy that leaked draft/non-public
    -- house-product child rows to any authenticated user.
    execute format($f$
      create policy %I on public.%I for select to authenticated
      using (
        public.user_is_catalogue_editor(auth.uid())
        or exists (
          select 1 from public.products p
          where p.id = %I.product_id
            and (
              (p.brand_id is null and p.status = 'active' and p.is_public = true)
              or (p.brand_id is not null and public.user_has_brand(auth.uid(), p.brand_id))
            )
        )
      )$f$, 'Authed read '||t, t, t);

    execute format('create policy %I on public.%I for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors insert '||t, t);
    execute format('create policy %I on public.%I for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors update '||t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors delete '||t, t);
  end loop;
end $$;

-- End of M1 migration.
