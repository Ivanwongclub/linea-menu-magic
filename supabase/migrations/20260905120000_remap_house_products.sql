-- M4 Step 2: move the 64 active house products from the old category tree
-- onto the 25 new categories, and archive the 15 that have no home.
--
-- Changes live customer-facing data. Migration for review, not applied.
--
-- What it does, in order:
--   1. For every HOUSE product (brand_id is null) mapped to an old category
--      in the table below, add the new category as its primary mapping.
--      Where a product's old categories point at more than one new one,
--      the first match in table order wins the primary; the others are
--      added as secondary mappings.
--   2. Demote the old-category mappings to is_primary = false. They are
--      KEPT, not deleted — the old category records why a product landed
--      where it did (e.g. which of the 13 parked buttons was a shank
--      button), and WIN-CYC re-sorts from that in the CMS. The old
--      categories are inactive, so nothing public reads them.
--   3. Archive house products whose only categories are the four orphans
--      (other, beads, drawcords, hardware): status = 'archived',
--      is_public = false. Nothing is deleted; images stay in storage.
--
-- Rules carried from the brief:
--   * The 13 buttons (buttons, shank-buttons) are PARKED in Metal & Shank
--     Buttons, not classified — nothing in the data says polyester from
--     horn from metal, and product names are not to be guessed from.
--   * hook-eyes → Eyelets & Rivets, NOT Hook & Loop. Hook-and-eye closures
--     are metal fasteners; Hook & Loop is velcro. False-friend name match.
--   * Every write here is guarded on brand_id is null. Polo Ralph Lauren's
--     products are a customer's catalogue and are never remapped or
--     archived by us.
--
-- Keyed by slug and idempotent: re-running adds nothing and archives
-- nothing new. Where an old category does not exist (a fresh local stack —
-- the old categories were entered in production directly, not by any
-- migration), every step is a no-op.
--
-- Pre-flight, before applying — what will move, and what will be archived:
--   select oldc.slug as old_category, count(distinct p.id) as products
--   from public.product_category_map m
--   join public.product_categories oldc on oldc.id = m.category_id
--   join public.products p on p.id = m.product_id and p.brand_id is null
--   where oldc.slug in ('buckles','toggles','cord-ends','cord-stoppers','zipper-pullers',
--                       'eyelets','rivets','hook-eyes','snap-buttons','jeans-buttons',
--                       'webbing','badges','buttons','shank-buttons',
--                       'other','beads','drawcords','hardware')
--   group by 1 order by 2 desc;
-- Expected from the brief: 11 + 9 + 6 + 5 + 4 + 2 + 13 remapped, 15 archived.

begin;

-- ---------------------------------------------------------------------
-- 1. New primary (and secondary) mappings
-- ---------------------------------------------------------------------
with remap(priority, old_slug, new_slug) as (
  values
    (1, 'buckles',        'buckles-cord-locks'),
    (1, 'toggles',        'buckles-cord-locks'),
    (1, 'cord-ends',      'buckles-cord-locks'),
    (1, 'cord-stoppers',  'buckles-cord-locks'),
    (2, 'zipper-pullers', 'zipper-pullers-sliders'),
    (3, 'eyelets',        'eyelets-rivets'),
    (3, 'rivets',         'eyelets-rivets'),
    (3, 'hook-eyes',      'eyelets-rivets'),          -- metal fasteners, not velcro
    (4, 'snap-buttons',   'snap-fasteners-jeans-buttons'),
    (4, 'jeans-buttons',  'snap-fasteners-jeans-buttons'),
    (5, 'webbing',        'pp-cotton-poly-tc-webbing'),
    (6, 'badges',         'metal-pendants-brand-badges'),
    (7, 'buttons',        'metal-shank-buttons'),     -- parked, see header
    (7, 'shank-buttons',  'metal-shank-buttons')      -- parked, see header
),
targets as (
  select distinct on (p.id, newc.id)
         p.id as product_id, newc.id as category_id, r.priority
  from public.products p
  join public.product_category_map m on m.product_id = p.id
  join public.product_categories oldc on oldc.id = m.category_id
  join remap r on r.old_slug = oldc.slug
  join public.product_categories newc on newc.slug = r.new_slug
  where p.brand_id is null
  order by p.id, newc.id, r.priority
),
ranked as (
  select product_id, category_id,
         row_number() over (partition by product_id order by priority, category_id) = 1 as is_primary
  from targets
)
insert into public.product_category_map (product_id, category_id, is_primary)
select product_id, category_id, is_primary from ranked
on conflict (product_id, category_id) do update set is_primary = excluded.is_primary;

-- ---------------------------------------------------------------------
-- 2. Demote the old mappings (kept as history)
-- ---------------------------------------------------------------------
update public.product_category_map m
set is_primary = false
from public.product_categories oldc, public.products p
where oldc.id = m.category_id
  and p.id = m.product_id
  and p.brand_id is null
  and oldc.slug in ('buckles','toggles','cord-ends','cord-stoppers','zipper-pullers',
                    'eyelets','rivets','hook-eyes','snap-buttons','jeans-buttons',
                    'webbing','badges','buttons','shank-buttons',
                    'other','beads','drawcords','hardware')
  and m.is_primary;

-- ---------------------------------------------------------------------
-- 3. Archive the products with no home
-- ---------------------------------------------------------------------
update public.products p
set status = 'archived', is_public = false
where p.brand_id is null                      -- never a customer's catalogue
  and p.status <> 'archived'
  and exists (
    select 1 from public.product_category_map m
    join public.product_categories c on c.id = m.category_id
    where m.product_id = p.id and c.slug in ('other','beads','drawcords','hardware')
  )
  and not exists (                            -- and nothing active to stand on
    select 1 from public.product_category_map m
    join public.product_categories c on c.id = m.category_id
    where m.product_id = p.id and c.is_active
  );

commit;

-- After applying:
--   select c.slug, count(*) from public.product_category_map m
--   join public.product_categories c on c.id = m.category_id
--   join public.products p on p.id = m.product_id
--   where m.is_primary and p.brand_id is null and p.status = 'active'
--   group by 1 order by 2 desc;                       -- 7 new categories, 50 products
--   select count(*) from public.products
--   where brand_id is null and status = 'archived';   -- +15
