-- Designer Studio Phase 4a — model scale schema and CMS confirmation.
-- Ref: reports/E1-plan-integration.md §3.1, §5 (Phase 4 build unit 4a);
-- docs/3d-editor/wincyc-3d-editor-units-and-recovery-rulings.md §1.
--
--   R1  products gains the scale-confirmation columns: a stored factor (mm
--       per raw OBJ unit, at the reference variant — C1), a confirmation
--       status, the calibration method used, the reference variant the
--       factor was measured against (Q2: defaults to the product's default
--       variant, editable in the CMS scale panel), the raw AABB parsed from
--       the OBJ at upload time, who/when it was confirmed, and the marked
--       branding groups and their recovered reference (Phase 4d; columns
--       land now so the reset trigger has one thing to reset).
--   R1a Deviation from E1 §3.1 as written: model_scale_reference_variant_id
--       is a plain uuid, not `references product_size_variants(id)`. products
--       already has the *other* direction of this relationship
--       (product_size_variants.product_id -> products.id), and adding a
--       second FK between the same two tables makes every existing
--       unqualified `product_size_variants(...)` embed ambiguous — PostgREST
--       returns 300 Multiple Choices instead of picking one. Verified live:
--       with the FK in place, the buyer editor's own product query
--       (useEditorProduct.ts, out of this migration's edit scope) 300s and
--       the route shows "Product not found". A trigger below reproduces
--       "on delete set null" without registering a second FK relationship.
--   R2  A new or replaced OBJ must never inherit the previous file's scale
--       or marks (collision 13): a before-update trigger on
--       model_storage_path resets confirmation, factor, method, marks and
--       branding reference, and clears the raw bounds only when the model is
--       removed outright (a replacement's upload write follows in the same
--       transaction as the new path, per useProductModel.upload).
--   R3  design_versions.snapshot's documented shape (Phase 1 R2) is extended
--       to name the scale fields a rendered version now needs (collision 11)
--       — Phase 7 writes them; this is a comment-only change.
--
-- RLS: none new. products update is already catalogue-editor-gated, and the
-- storefront/editor select is already public. Backfill: none — every
-- existing product starts 'unconfirmed', which is correct (rulings §1.2);
-- the local seed has no models, so there is nothing to migrate.
--
-- src/features/admin/lib/objBounds.ts computes model_raw_bounds client-side
-- at upload (no viewer). Run `npm run e2e:types` after this migration.

begin;

alter table public.products
  add column model_scale_factor numeric,
  add column model_scale_status text not null default 'unconfirmed',
  add column model_scale_method text,
  add column model_scale_reference_variant_id uuid,  -- see R1a: no FK, to avoid a second products<->product_size_variants relationship
  add column model_raw_bounds jsonb,
  add column model_scale_confirmed_at timestamptz,
  add column model_scale_confirmed_by uuid references auth.users(id) on delete set null,
  add column model_branding_groups jsonb not null default '[]'::jsonb,
  add column model_branding_reference jsonb;

alter table public.products
  add constraint products_model_scale_status_check
    check (model_scale_status in ('confirmed','unconfirmed')),
  add constraint products_model_scale_factor_positive
    check (model_scale_factor is null or model_scale_factor > 0),
  add constraint products_model_scale_method_check
    check (model_scale_method is null or model_scale_method in ('unit_mm','known_dimension','two_point')),
  add constraint products_model_scale_confirmed_complete
    check (model_scale_status = 'unconfirmed'
           or (model_scale_factor is not null and model_storage_path is not null));

comment on column public.products.model_scale_factor is
  'Millimetres per raw OBJ unit, measured at model_scale_reference_variant_id '
  '(C1 — a product has one factor, not per-variant). Null until confirmed. '
  'Full precision is stored; the CMS displays it at 6dp.';
comment on column public.products.model_scale_status is
  '''confirmed'' or ''unconfirmed'' (default). The buyer editor refuses to '
  'open a product that is unconfirmed (units rulings §1.2) — it shows the '
  '"awaiting setup" empty state instead of a model.';
comment on column public.products.model_scale_method is
  'How model_scale_factor was set: unit_mm (the CMS proposal accepted as-is,'
  ' 1 or the computed P/R — spec §7), known_dimension (calibrated against a '
  'typed real-world measurement — spec §16), or two_point (Phase 4c). Null '
  'until confirmed.';
comment on column public.products.model_scale_reference_variant_id is
  'The product_size_variants row the stored factor was measured against '
  '(Q2: defaults to the product''s default variant in the CMS scale panel, '
  'editable there). Other variants scale by variantMm / referenceMm. '
  'Deliberately not a foreign key (R1a): product_size_variants already has '
  'a product_id -> products FK, and a second FK the other way makes every '
  'existing unqualified product_size_variants(...) embed ambiguous to '
  'PostgREST. trg_product_size_variants_clear_scale_reference reproduces '
  'on-delete-set-null without registering a second relationship.';
comment on column public.products.model_raw_bounds is
  'Parsed client-side from the uploaded OBJ, before any rotation or scale '
  '(E1 collision 4/12): {min:[x,y,z], max:[x,y,z], face_axis:0|1|2, '
  'primary_raw:n}. face_axis is the thinnest raw AABB axis (the relief '
  'direction); primary_raw is the larger of the other two extents.';
comment on column public.products.model_scale_confirmed_at is
  'When the catalogue editor confirmed or calibrated the scale. Null while unconfirmed.';
comment on column public.products.model_scale_confirmed_by is
  'The catalogue editor who confirmed or calibrated the scale. Null while unconfirmed.';
comment on column public.products.model_branding_groups is
  'Catalogue-editor-marked factory-branding OBJ groups, Phase 4d: '
  '[{index:int, name:text}]. index is the child order under OBJLoader''s '
  'root group (stable per file); name is the OBJ o/g name (may repeat). The '
  'buyer editor hides these groups. Reset to [] on a new or removed file.';
comment on column public.products.model_branding_reference is
  'Recovered circle-fit reference from the marked branding groups, Phase 4d '
  '(raw units, raw OBJ frame) — see reports/E1-plan-integration.md §3.2. '
  'Null until analysed, and reset to null on a new or removed file.';

-- Collision 13: a new or removed OBJ never inherits the previous file's
-- scale confirmation or branding marks.
create or replace function public.products_reset_model_scale() returns trigger
language plpgsql as $$
begin
  if new.model_storage_path is distinct from old.model_storage_path then
    new.model_scale_status := 'unconfirmed';
    new.model_scale_factor := null;
    new.model_scale_method := null;
    new.model_scale_confirmed_at := null;
    new.model_scale_confirmed_by := null;
    new.model_branding_groups := '[]'::jsonb;
    new.model_branding_reference := null;
    if new.model_storage_path is null then new.model_raw_bounds := null; end if;
  end if;
  return new;
end $$;

create trigger trg_products_reset_model_scale before update of model_storage_path
  on public.products for each row execute function public.products_reset_model_scale();

-- R1a: reproduces the FK's "on delete set null" without registering a second
-- products<->product_size_variants relationship (which would make every
-- existing unqualified product_size_variants(...) embed ambiguous).
create or replace function public.product_size_variants_clear_scale_reference() returns trigger
language plpgsql as $$
begin
  update public.products set model_scale_reference_variant_id = null
    where model_scale_reference_variant_id = old.id;
  return old;
end $$;

create trigger trg_product_size_variants_clear_scale_reference after delete on public.product_size_variants
  for each row execute function public.product_size_variants_clear_scale_reference();

-- Collision 11: a version snapshot freezes scale and marks, not live product
-- rows (Phase 1 R2) — Phase 7 writes these fields into the snapshot.
comment on column public.design_versions.snapshot is
  'Denormalised copy of every referenced entity at save time: product '
  '(name, item_code), finish (name, cyc_code, hex, material params), size '
  'variant (measurements), plus model_storage_path (the OBJ this version '
  'renders from), model_sha256 (its content hash, for cache/integrity '
  'checks), model_scale_factor, model_scale_reference_variant_id and '
  'model_branding_groups (Phase 4a — a stored scale and marked groups are '
  'live product fields, so a version freezes them too). Rendering reads '
  'this column, never live rows — see architecture doc Part 3.';

commit;
