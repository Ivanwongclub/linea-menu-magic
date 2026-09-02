-- Catalogue RLS hardening (P21)
-- 1. Dedicated catalogue_editors table (no brand pseudo-membership — see
--    P21 report §1 for why brand_memberships was rejected: primaryBrand
--    = brands[0] would become non-deterministic for any staff account
--    that also holds a real customer-brand membership).
-- 2. Restrict INSERT/UPDATE/DELETE on products, product_images, and all
--    taxonomy/mapping tables to catalogue editors.
-- 3. Broaden authenticated SELECT on products so draft/archived house
--    products remain visible to CMS staff of any (or no) elevated role.
-- 4. Fix product_images SELECT to respect the parent product's visibility.
-- 5. Tighten the product-assets storage bucket to catalogue editors.
--
-- catalogue_editors is NOT seeded here — grants are added separately by
-- direct SQL once specific accounts are named.

-- ---------------------------------------------------------------------
-- 1. catalogue_editors
-- ---------------------------------------------------------------------
create table public.catalogue_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.catalogue_editors enable row level security;

create policy "Users read own catalogue editor grant"
on public.catalogue_editors
for select
to authenticated
using (user_id = auth.uid());

-- No insert/update/delete policy for any client role: RLS default-denies
-- all writes. Grants are made only via direct SQL (service role / migrations).
revoke all on public.catalogue_editors from anon;

-- ---------------------------------------------------------------------
-- 2. Catalogue-editor predicate
-- ---------------------------------------------------------------------
create or replace function public.user_is_catalogue_editor(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.catalogue_editors where user_id = _user_id
  );
$$;

grant execute on function public.user_is_catalogue_editor(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. products
-- ---------------------------------------------------------------------
drop policy if exists "Authed read public + own brand products" on public.products;
drop policy if exists "Authenticated manage products" on public.products;

create policy "Authed read house + own brand products"
on public.products
for select
to authenticated
using (
  brand_id is null
  or public.user_has_brand(auth.uid(), brand_id)
);

create policy "Catalogue editors insert products"
on public.products
for insert
to authenticated
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors update products"
on public.products
for update
to authenticated
using (public.user_is_catalogue_editor(auth.uid()))
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors delete products"
on public.products
for delete
to authenticated
using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 4. product_images — read policy rewritten to respect parent visibility;
--    write policies gated to catalogue editors.
-- ---------------------------------------------------------------------
drop policy if exists "Public read product_images" on public.product_images;
drop policy if exists "Authenticated manage product_images" on public.product_images;

create policy "Anon read images of public active products"
on public.product_images
for select
to anon
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'active'
      and p.is_public = true
      and p.brand_id is null
  )
);

create policy "Authed read images of house + own brand products"
on public.product_images
for select
to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (p.brand_id is null or public.user_has_brand(auth.uid(), p.brand_id))
  )
);

create policy "Catalogue editors insert product_images"
on public.product_images
for insert
to authenticated
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors update product_images"
on public.product_images
for update
to authenticated
using (public.user_is_catalogue_editor(auth.uid()))
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors delete product_images"
on public.product_images
for delete
to authenticated
using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 5. Taxonomy tables — "Public read *" left as-is.
-- ---------------------------------------------------------------------

-- product_categories
drop policy if exists "Authenticated manage product_categories" on public.product_categories;
create policy "Catalogue editors insert product_categories" on public.product_categories
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_categories" on public.product_categories
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_categories" on public.product_categories
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_materials
drop policy if exists "Authenticated manage product_materials" on public.product_materials;
create policy "Catalogue editors insert product_materials" on public.product_materials
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_materials" on public.product_materials
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_materials" on public.product_materials
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_industries
drop policy if exists "Authenticated manage product_industries" on public.product_industries;
create policy "Catalogue editors insert product_industries" on public.product_industries
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_industries" on public.product_industries
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_industries" on public.product_industries
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_certifications
drop policy if exists "Authenticated manage product_certifications" on public.product_certifications;
create policy "Catalogue editors insert product_certifications" on public.product_certifications
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_certifications" on public.product_certifications
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_certifications" on public.product_certifications
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_tags
drop policy if exists "Authenticated manage product_tags" on public.product_tags;
create policy "Catalogue editors insert product_tags" on public.product_tags
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_tags" on public.product_tags
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_tags" on public.product_tags
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 6. Mapping (junction) tables — "Public read *" left as-is.
-- ---------------------------------------------------------------------

-- product_category_map
drop policy if exists "Authenticated manage product_category_map" on public.product_category_map;
create policy "Catalogue editors insert product_category_map" on public.product_category_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_category_map" on public.product_category_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_category_map" on public.product_category_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_material_map
drop policy if exists "Authenticated manage product_material_map" on public.product_material_map;
create policy "Catalogue editors insert product_material_map" on public.product_material_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_material_map" on public.product_material_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_material_map" on public.product_material_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_industry_map
drop policy if exists "Authenticated manage product_industry_map" on public.product_industry_map;
create policy "Catalogue editors insert product_industry_map" on public.product_industry_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_industry_map" on public.product_industry_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_industry_map" on public.product_industry_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_certification_map
drop policy if exists "Authenticated manage product_certification_map" on public.product_certification_map;
create policy "Catalogue editors insert product_certification_map" on public.product_certification_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_certification_map" on public.product_certification_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_certification_map" on public.product_certification_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_tag_map
drop policy if exists "Authenticated manage product_tag_map" on public.product_tag_map;
create policy "Catalogue editors insert product_tag_map" on public.product_tag_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_tag_map" on public.product_tag_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_tag_map" on public.product_tag_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 7. product-assets storage bucket
-- ---------------------------------------------------------------------
drop policy if exists "Authenticated upload product-assets" on storage.objects;
drop policy if exists "Authenticated update product-assets" on storage.objects;
drop policy if exists "Authenticated delete product-assets" on storage.objects;

create policy "Catalogue editors upload product-assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-assets' and public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors update product-assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-assets' and public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors delete product-assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-assets' and public.user_is_catalogue_editor(auth.uid()));

-- End of migration. catalogue_editors is intentionally left empty —
-- grant specific accounts via a follow-up statement, e.g.:
--   insert into public.catalogue_editors (user_id)
--   select id from auth.users where email = '<staff email>';
