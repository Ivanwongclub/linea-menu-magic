
-- =========================================================
-- Polo Ralph Lauren private brand library seed (idempotent)
-- =========================================================

-- 1. Brand
insert into public.brands (id, slug, name, is_active)
values ('11111111-1111-1111-1111-111111111111', 'polo-ralph-lauren', 'Polo Ralph Lauren', true)
on conflict (slug) do update set name = excluded.name, is_active = true;

-- 2. Brand category
insert into public.product_categories (name, slug, sort_order)
values ('Polo Ralph Lauren', 'polo-ralph-lauren', 100)
on conflict (slug) do update set name = excluded.name;

-- 3. Demo user membership (only if user already exists)
do $$
declare
  v_user_id uuid;
  v_brand_id uuid := '11111111-1111-1111-1111-111111111111';
begin
  select id into v_user_id from auth.users where lower(email) = 'demo.polo@wincyc.com' limit 1;
  if v_user_id is not null then
    insert into public.brand_memberships (user_id, brand_id, role)
    values (v_user_id, v_brand_id, 'member')
    on conflict (user_id, brand_id) do nothing;
  end if;
end $$;

-- 4. Seed/upsert 24 private products (conflict on item_code)
with brand as (
  select id from public.brands where slug = 'polo-ralph-lauren'
),
data(item_code, name, slug, description, specs, prod) as (
  values
  ('PRL-BTN-001','Polo Signature Horn Button','prl-polo-signature-horn-button','Genuine buffalo horn 4-hole shirt button with engraved Polo crest.',
    '{"diameter_mm":15,"holes":4,"material":"horn","finish":"natural polished"}'::jsonb,
    '{"moq":5000,"lead_time_days":35,"origin":"Italy"}'::jsonb),
  ('PRL-BTN-002','Polo Mother of Pearl Button','prl-polo-mop-button','Trocas mother-of-pearl 2-hole button for premium oxford shirts.',
    '{"diameter_mm":11,"holes":2,"material":"trocas shell","finish":"natural"}'::jsonb,
    '{"moq":10000,"lead_time_days":40,"origin":"Philippines"}'::jsonb),
  ('PRL-BTN-003','Polo Engraved Brass Blazer Button','prl-polo-brass-blazer-button','Domed brass blazer button engraved with the Polo Pony.',
    '{"diameter_mm":20,"shank":"metal loop","material":"brass","finish":"antique gold"}'::jsonb,
    '{"moq":3000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-BTN-004','Polo Corozo Knit Button','prl-polo-corozo-knit-button','Tagua nut corozo button for cardigans and knitwear.',
    '{"diameter_mm":18,"holes":4,"material":"corozo","finish":"matte stone"}'::jsonb,
    '{"moq":4000,"lead_time_days":35,"origin":"Ecuador"}'::jsonb),
  ('PRL-BTN-005','Polo Ralph Lauren Polo Shirt Button','prl-polo-shirt-button','Resin tonal button used on classic Polo mesh shirts.',
    '{"diameter_mm":11,"holes":2,"material":"polyester resin","finish":"glossy"}'::jsonb,
    '{"moq":20000,"lead_time_days":25,"origin":"Italy"}'::jsonb),
  ('PRL-SNP-001','Polo Equestrian Metal Snap','prl-polo-equestrian-snap','Heavy-duty ring snap for outerwear with Polo Pony emboss.',
    '{"diameter_mm":15,"type":"ring snap","material":"brass","finish":"antique nickel"}'::jsonb,
    '{"moq":5000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-SNP-002','Polo Western Pearl Snap','prl-polo-western-pearl-snap','Pearl-cap snap fastener for western shirts.',
    '{"diameter_mm":17,"type":"pearl cap snap","material":"brass + acrylic","finish":"pearl white"}'::jsonb,
    '{"moq":4000,"lead_time_days":28,"origin":"Italy"}'::jsonb),
  ('PRL-RVT-001','Polo Embossed Denim Rivet','prl-polo-denim-rivet','Engraved Polo logo rivet for denim reinforcement.',
    '{"diameter_mm":9,"material":"copper alloy","finish":"antique copper"}'::jsonb,
    '{"moq":10000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-RVT-002','Polo Logo Cap Rivet','prl-polo-logo-cap-rivet','Polo wordmark cap rivet for accessories and bags.',
    '{"diameter_mm":10,"material":"brass","finish":"polished gold"}'::jsonb,
    '{"moq":8000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-EYE-001','Polo Brass Eyelet 5mm','prl-polo-brass-eyelet-5','Solid brass garment eyelet for cord drawstrings.',
    '{"inner_mm":5,"outer_mm":11,"material":"brass","finish":"antique brass"}'::jsonb,
    '{"moq":15000,"lead_time_days":25,"origin":"Italy"}'::jsonb),
  ('PRL-BKL-001','Polo Bridle Belt Buckle','prl-polo-bridle-buckle','Equestrian-inspired roller buckle for leather belts.',
    '{"width_mm":35,"material":"zinc alloy","finish":"antique brass"}'::jsonb,
    '{"moq":2000,"lead_time_days":35,"origin":"Italy"}'::jsonb),
  ('PRL-BKL-002','Polo D-Ring Webbing Buckle','prl-polo-d-ring-buckle','Twin D-ring buckle for canvas/webbing belts.',
    '{"width_mm":40,"material":"brass","finish":"matte gunmetal"}'::jsonb,
    '{"moq":3000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-ZPL-001','Polo Zipper Puller Pony','prl-polo-zipper-puller-pony','Die-cast Polo Pony zipper pull with leather tag.',
    '{"length_mm":35,"material":"zinc alloy + leather","finish":"antique gold"}'::jsonb,
    '{"moq":3000,"lead_time_days":35,"origin":"Italy"}'::jsonb),
  ('PRL-ZPL-002','Polo Wordmark Zipper Pull','prl-polo-wordmark-zipper-pull','Engraved wordmark slider for outerwear zippers.',
    '{"length_mm":30,"material":"zinc alloy","finish":"polished nickel"}'::jsonb,
    '{"moq":5000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-PCH-001','Polo Pony Embroidered Patch','prl-polo-pony-embroidered-patch','Iconic embroidered Polo Pony patch in classic navy.',
    '{"width_mm":55,"height_mm":40,"technique":"satin embroidery","backing":"iron-on"}'::jsonb,
    '{"moq":2000,"lead_time_days":25,"origin":"Vietnam"}'::jsonb),
  ('PRL-PCH-002','Polo Crest Woven Label','prl-polo-crest-woven-label','High-density woven label with Polo crest.',
    '{"width_mm":45,"height_mm":30,"technique":"high-density woven","backing":"sew-on"}'::jsonb,
    '{"moq":3000,"lead_time_days":25,"origin":"Vietnam"}'::jsonb),
  ('PRL-PCH-003','Polo Ralph Lauren Leather Patch','prl-polo-leather-patch','Debossed full-grain leather patch for denim waistband.',
    '{"width_mm":80,"height_mm":50,"material":"full-grain leather","finish":"vegetable tan"}'::jsonb,
    '{"moq":2000,"lead_time_days":35,"origin":"Italy"}'::jsonb),
  ('PRL-WEB-001','Polo Striped Webbing 38mm','prl-polo-striped-webbing-38','Signature navy/red/white striped webbing for belts and bags.',
    '{"width_mm":38,"material":"polyester jacquard","finish":"woven stripe"}'::jsonb,
    '{"moq":1000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-WEB-002','Polo Cotton Twill Tape','prl-polo-cotton-twill-tape','Branded cotton twill tape for inner construction.',
    '{"width_mm":15,"material":"cotton","finish":"natural printed"}'::jsonb,
    '{"moq":2000,"lead_time_days":20,"origin":"Vietnam"}'::jsonb),
  ('PRL-DRC-001','Polo Tipped Drawcord','prl-polo-tipped-drawcord','Round drawcord with metal tip stamped Polo.',
    '{"diameter_mm":4,"material":"polyester","finish":"matte"}'::jsonb,
    '{"moq":3000,"lead_time_days":25,"origin":"Italy"}'::jsonb),
  ('PRL-HDW-001','Polo Cord Stopper Logo','prl-polo-cord-stopper-logo','Spring cord stopper with engraved Polo logo.',
    '{"length_mm":22,"material":"zinc alloy","finish":"antique brass"}'::jsonb,
    '{"moq":4000,"lead_time_days":28,"origin":"Italy"}'::jsonb),
  ('PRL-HDW-002','Polo Bag Hook Swivel','prl-polo-bag-hook-swivel','Swivel snap hook for handbag straps.',
    '{"length_mm":45,"material":"zinc alloy","finish":"polished gold"}'::jsonb,
    '{"moq":2000,"lead_time_days":35,"origin":"Italy"}'::jsonb),
  ('PRL-HDW-003','Polo Magnetic Closure','prl-polo-magnetic-closure','Hidden magnetic snap closure for outerwear.',
    '{"diameter_mm":18,"material":"steel + neodymium","finish":"matte nickel"}'::jsonb,
    '{"moq":3000,"lead_time_days":30,"origin":"Italy"}'::jsonb),
  ('PRL-HDW-004','Polo Sliders 25mm','prl-polo-slider-25','Adjustable strap slider with Polo wordmark.',
    '{"width_mm":25,"material":"zinc alloy","finish":"antique brass"}'::jsonb,
    '{"moq":3000,"lead_time_days":30,"origin":"Italy"}'::jsonb)
)
insert into public.products (item_code, name, slug, description, brand_id, is_public, status, specifications, production)
select d.item_code, d.name, d.slug, d.description, b.id, false, 'active', d.specs, d.prod
from data d cross join brand b
on conflict (item_code) do update set
  name = excluded.name,
  slug = excluded.slug,
  description = excluded.description,
  brand_id = excluded.brand_id,
  is_public = false,
  status = 'active',
  specifications = excluded.specifications,
  production = excluded.production,
  updated_at = now();

-- 5. Primary category mapping
with polo_cat as (select id from public.product_categories where slug = 'polo-ralph-lauren')
insert into public.product_category_map (product_id, category_id, is_primary)
select p.id, pc.id, true
from public.products p cross join polo_cat pc
where p.brand_id = '11111111-1111-1111-1111-111111111111'
on conflict (product_id, category_id) do update set is_primary = true;

-- Secondary category mapping
with mapping(item_code, secondary_slug) as (values
  ('PRL-BTN-001','buttons'),('PRL-BTN-002','buttons'),('PRL-BTN-003','buttons'),
  ('PRL-BTN-004','buttons'),('PRL-BTN-005','buttons'),
  ('PRL-SNP-001','snap-buttons'),('PRL-SNP-002','snap-buttons'),
  ('PRL-RVT-001','rivets'),('PRL-RVT-002','rivets'),
  ('PRL-EYE-001','eyelets'),
  ('PRL-BKL-001','buckles'),('PRL-BKL-002','buckles'),
  ('PRL-ZPL-001','zipper-pullers'),('PRL-ZPL-002','zipper-pullers'),
  ('PRL-PCH-001','patches'),('PRL-PCH-002','patches'),('PRL-PCH-003','patches'),
  ('PRL-WEB-001','webbing'),('PRL-WEB-002','webbing'),
  ('PRL-DRC-001','drawcords'),
  ('PRL-HDW-001','hardware'),('PRL-HDW-002','hardware'),
  ('PRL-HDW-003','hardware'),('PRL-HDW-004','hardware')
)
insert into public.product_category_map (product_id, category_id, is_primary)
select p.id, c.id, false
from mapping m
join public.products p on p.item_code = m.item_code
join public.product_categories c on c.slug = m.secondary_slug
on conflict (product_id, category_id) do nothing;

-- 6. Brand library rows (one row per Polo product per Polo team_id)
insert into public.user_library_items (product_id, team_id, team_name, is_admin_default, is_favourite)
select p.id, '11111111-1111-1111-1111-111111111111'::uuid, 'Polo Ralph Lauren', false, false
from public.products p
where p.brand_id = '11111111-1111-1111-1111-111111111111'
  and not exists (
    select 1 from public.user_library_items uli
    where uli.product_id = p.id
      and uli.team_id = '11111111-1111-1111-1111-111111111111'::uuid
  );
