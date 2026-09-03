-- M2 — WIN-CYC catalogue data
-- Seeds taxonomy (families, categories, materials, attachments, compliance
-- standards, 8 finish axes, 135 finish records) and 25 draft seed products —
-- one per new category, name/category/material only. Every spec field is
-- left null deliberately: a null renders as absent, an invented number renders
-- as a commercial claim. published_needs_item_code keeps them off the public
-- site. Changes NOTHING about the existing 60 products — they are untouched
-- and remain status='active' after this migration.
--
-- Archiving the existing 60 products is deliberately NOT done here. Per M2
-- review ruling 2026-09-03: it moves to its own migration, released alongside
-- M4 once the front end reads the new taxonomy and real published products
-- exist to replace them. THAT FUTURE MIGRATION MUST FILTER ON
-- "brand_id is null" — Polo Ralph Lauren's products (seeded
-- 20260422192314_9de125c2-55ff-4293-9b8a-bc81b135e1c9.sql, brand_id
-- '11111111-1111-1111-1111-111111111111', item codes PRL-*) are a customer's
-- catalogue, not ours, and must never be swept into a house-catalogue archive.

begin;

-- ============ 1. families ============
insert into public.product_families (slug,name,name_zh_hant,name_zh_hans,segment,sort_order)
  values ('soft-trims-webbing-tape','Soft Trims — Webbing & Tape','軟輔料 — 織帶及膠帶','软辅料 — 织带及胶带','apparel',1) on conflict (slug) do nothing;
insert into public.product_families (slug,name,name_zh_hant,name_zh_hans,segment,sort_order)
  values ('laces-ribbons','Laces & Ribbons','花邊及絲帶','花边及丝带','apparel',2) on conflict (slug) do nothing;
insert into public.product_families (slug,name,name_zh_hant,name_zh_hans,segment,sort_order)
  values ('metal-hardware-accessories','Metal & Hardware Accessories','金屬及五金配件','金属及五金配件','apparel',3) on conflict (slug) do nothing;
insert into public.product_families (slug,name,name_zh_hant,name_zh_hans,segment,sort_order)
  values ('buttons','Buttons','鈕扣','纽扣','apparel',4) on conflict (slug) do nothing;
insert into public.product_families (slug,name,name_zh_hant,name_zh_hans,segment,sort_order)
  values ('zippers','Zippers','拉鏈','拉链','apparel',5) on conflict (slug) do nothing;

-- ============ 2. categories (25) ============
-- Existing 17 leaf categories are deactivated, not deleted: product_category_map
-- rows still reference them and the archived products keep their history.
update public.product_categories set is_active = false;

insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'hook-and-loop','Hook & Loop','魔術貼','魔术贴',f.id,1,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'elastic-tape-braided-elastic','Elastic Tape & Braided Elastic','鬆緊帶及編織鬆緊','松紧带及编织松紧',f.id,2,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'bias-mattress-tape','Bias & Mattress Tape','斜紋帶及床墊帶','斜纹带及床垫带',f.id,3,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'pp-cotton-poly-tc-webbing','Polypropylene & Cotton/Poly/TC Webbing','丙綸及棉/滌/TC織帶','丙纶及棉/涤/TC织带',f.id,4,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'bag-case-sofa-webbing','Bag, Case & Sofa Webbing','箱包及沙發織帶','箱包及沙发织带',f.id,5,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'camouflage-reflective-webbing','Camouflage & Reflective Webbing/Vest','迷彩及反光織帶／背心','迷彩及反光织带／背心',f.id,6,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'trousers-waistband-labels','Trousers Waistband & Labels','褲頭及嘜頭','裤头及唛头',f.id,7,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'traditional-jacquard-tape','Traditional Jacquard Tape','傳統提花帶','传统提花带',f.id,8,true from public.product_families f where f.slug='soft-trims-webbing-tape'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'cotton-nylon-lace','Cotton & Nylon Lace','棉及尼龍花邊','棉及尼龙花边',f.id,9,true from public.product_families f where f.slug='laces-ribbons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'elastic-lace-embroidered-net','Elastic Lace & Embroidered Net','彈力花邊及繡花網','弹力花边及绣花网',f.id,10,true from public.product_families f where f.slug='laces-ribbons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'satin-grosgrain-velvet-ribbons','Satin, Grosgrain & Velvet Ribbons','緞帶、羅紋帶及絲絨帶','缎带、罗纹带及丝绒带',f.id,11,true from public.product_families f where f.slug='laces-ribbons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'bows-trimmings','Bows & Trimmings','蝴蝶結及飾邊','蝴蝶结及饰边',f.id,12,true from public.product_families f where f.slug='laces-ribbons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'd-rings-o-rings','D-Rings & O-Rings','D 扣及 O 圈','D 扣及 O 圈',f.id,13,true from public.product_families f where f.slug='metal-hardware-accessories'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'buckles-cord-locks','Buckles & Cord Locks','插扣及繩扣','插扣及绳扣',f.id,14,true from public.product_families f where f.slug='metal-hardware-accessories'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'eyelets-rivets','Eyelets & Rivets','雞眼及鉚釘','鸡眼及铆钉',f.id,15,true from public.product_families f where f.slug='metal-hardware-accessories'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'metal-pendants-brand-badges','Metal Pendants & Custom Brand Badges','金屬吊飾及訂製品牌章','金属吊饰及订制品牌章',f.id,16,true from public.product_families f where f.slug='metal-hardware-accessories'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'polyester-buttons','Polyester Buttons','樹脂鈕扣','树脂纽扣',f.id,17,true from public.product_families f where f.slug='buttons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'metal-shank-buttons','Metal & Shank Buttons','金屬及腳鈕','金属及脚纽',f.id,18,true from public.product_families f where f.slug='buttons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'horn-shell-buttons','Horn & Shell Buttons','牛角及貝殼鈕','牛角及贝壳纽',f.id,19,true from public.product_families f where f.slug='buttons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'snap-fasteners-jeans-buttons','Snap Fasteners & Jeans Buttons','四合扣及牛仔鈕','四合扣及牛仔纽',f.id,20,true from public.product_families f where f.slug='buttons'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'metal-zippers','Metal Zippers','金屬拉鏈','金属拉链',f.id,21,true from public.product_families f where f.slug='zippers'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'nylon-coil-zippers','Nylon Coil Zippers','尼龍拉鏈','尼龙拉链',f.id,22,true from public.product_families f where f.slug='zippers'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'plastic-vislon-zippers','Plastic/Vislon Zippers','塑鋼拉鏈','塑钢拉链',f.id,23,true from public.product_families f where f.slug='zippers'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'waterproof-invisible-zippers','Waterproof & Invisible Zippers','防水及隱形拉鏈','防水及隐形拉链',f.id,24,true from public.product_families f where f.slug='zippers'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;
insert into public.product_categories (slug,name,name_zh_hant,name_zh_hans,family_id,sort_order,is_active)
  select 'zipper-pullers-sliders','Zipper Pullers & Sliders','拉頭及拉片','拉头及拉片',f.id,25,true from public.product_families f where f.slug='zippers'
  on conflict (slug) do update set name=excluded.name, name_zh_hant=excluded.name_zh_hant,
    name_zh_hans=excluded.name_zh_hans, family_id=excluded.family_id,
    sort_order=excluded.sort_order, is_active=true;

-- ============ 3. materials — is_metal drives the finish gate ============
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Zinc Alloy','zinc-alloy','鋅合金','锌合金',true) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Brass','brass','黃銅','黄铜',true) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Stainless Steel','stainless-steel','不鏽鋼','不锈钢',true) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Aluminium','aluminium','鋁','铝',true) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Iron','iron','鐵','铁',true) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Polyester','polyester','聚酯','聚酯',false) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Nylon','nylon','尼龍','尼龙',false) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Cotton','cotton','棉','棉',false) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Horn','horn','牛角','牛角',false) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Shell','shell','貝殼','贝壳',false) on conflict (name) do nothing;
insert into public.product_materials (name,slug,name_zh_hant,name_zh_hans,is_metal)
  values ('Rubber','rubber','橡膠','橡胶',false) on conflict (name) do nothing;

-- ============ 4. attachments ============
insert into public.product_attachments (code,name,name_zh_hant,name_zh_hans,sort_order)
  values ('SEW_THROUGH','Sew-Through','四孔／兩孔','四孔／两孔',1) on conflict (code) do nothing;
insert into public.product_attachments (code,name,name_zh_hant,name_zh_hans,sort_order)
  values ('SHANK','Shank','腳鈕','脚纽',2) on conflict (code) do nothing;
insert into public.product_attachments (code,name,name_zh_hant,name_zh_hans,sort_order)
  values ('TACK','Tack','釘裝','钉装',3) on conflict (code) do nothing;
insert into public.product_attachments (code,name,name_zh_hant,name_zh_hans,sort_order)
  values ('SNAP','Snap','四合扣','四合扣',4) on conflict (code) do nothing;
insert into public.product_attachments (code,name,name_zh_hant,name_zh_hans,sort_order)
  values ('RIVET','Rivet','鉚釘','铆钉',5) on conflict (code) do nothing;
insert into public.product_attachments (code,name,name_zh_hant,name_zh_hans,sort_order)
  values ('SEW_ON','Sew-On','車縫','车缝',6) on conflict (code) do nothing;

-- ============ 5. compliance standards ============
insert into public.compliance_standards (code,name,sort_order) values ('REACH','REACH',1) on conflict (code) do nothing;
insert into public.compliance_standards (code,name,sort_order) values ('CPSIA','CPSIA',2) on conflict (code) do nothing;
insert into public.compliance_standards (code,name,sort_order) values ('OEKO_TEX','Oeko-Tex Standard 100',3) on conflict (code) do nothing;
insert into public.compliance_standards (code,name,sort_order) values ('PROP65','California Prop 65',4) on conflict (code) do nothing;
insert into public.compliance_standards (code,name,sort_order) values ('EN1811','EN 1811 Nickel Release',5) on conflict (code) do nothing;

-- ============ 6. finish axes ============
-- finish_processes
insert into public.finish_processes (code,name,name_zh_hant,sort_order) values ('HP','Hanger Plating','掛電',1) on conflict (code) do nothing;
insert into public.finish_processes (code,name,name_zh_hant,sort_order) values ('ROLL','Roll Plating','滾電',2) on conflict (code) do nothing;
insert into public.finish_processes (code,name,name_zh_hant,sort_order) values ('PAINT','Painting','噴漆',3) on conflict (code) do nothing;
insert into public.finish_processes (code,name,name_zh_hant,sort_order) values ('ECO','Eco Plating','環保鍍',4) on conflict (code) do nothing;
-- finish_base_families
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('NICKEL','Nickel','叻',1) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('GUN_METAL','Gun Metal','槍',2) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('GOLD','Gold','真金',3) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('LIGHT_GOLD','Light Gold','淺金',4) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('ROSE_GOLD','Rose Gold','玫瑰金',5) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('BRASS','Brass','青銅',6) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('ANTI_BRASS','Anti Brass','青古',7) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('RED_COPPER','Red Copper','紅銅',8) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('ANTI_COPPER','Anti Copper','紅古',9) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('BLACK_COPPER','Black Copper','黑古',10) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('TIN','Tin','錫',11) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('ANTI_SILVER','Anti Silver','古銀',12) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('ALLOY','Alloy','合金',13) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('STAINLESS_STEEL','Stainless Steel','不鏽鋼',14) on conflict (code) do nothing;
insert into public.finish_base_families (code,name,name_zh_hant,sort_order) values ('RUSTY_STEEL','Rusty Steel','鐵鏽',15) on conflict (code) do nothing;
-- finish_surfaces
insert into public.finish_surfaces (code,name,name_zh_hant,sort_order) values ('BRIGHT','Bright','光',1) on conflict (code) do nothing;
insert into public.finish_surfaces (code,name,name_zh_hant,sort_order) values ('BRUSHED','Brushed','掃尼龍',2) on conflict (code) do nothing;
insert into public.finish_surfaces (code,name,name_zh_hant,sort_order) values ('MATT','Matt','啞',3) on conflict (code) do nothing;
insert into public.finish_surfaces (code,name,name_zh_hant,sort_order) values ('SAND','Sand','噴沙',4) on conflict (code) do nothing;
insert into public.finish_surfaces (code,name,name_zh_hant,sort_order) values ('CIRCLE_BRUSHED','Circle Brushed','圈掃尼龍',5) on conflict (code) do nothing;
-- finish_tones
insert into public.finish_tones (code,name,name_zh_hant,sort_order) values ('IMT','Imitation','仿',1) on conflict (code) do nothing;
insert into public.finish_tones (code,name,name_zh_hant,sort_order) values ('DARK','Dark','深',2) on conflict (code) do nothing;
insert into public.finish_tones (code,name,name_zh_hant,sort_order) values ('LIGHT','Light','淺',3) on conflict (code) do nothing;
insert into public.finish_tones (code,name,name_zh_hant,sort_order) values ('MEDIUM','Medium','中',4) on conflict (code) do nothing;
insert into public.finish_tones (code,name,name_zh_hant,sort_order) values ('DEEP','Deep','深',5) on conflict (code) do nothing;
insert into public.finish_tones (code,name,name_zh_hant,sort_order) values ('ANTI','Anti','古',6) on conflict (code) do nothing;
insert into public.finish_tones (code,name,name_zh_hant,sort_order) values ('ANCIENT','Ancient','遠古',7) on conflict (code) do nothing;
-- finish_effects
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('DISTRESS','Distress','濺泥',1) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('STONE_WASH','Stone Wash','石磨',2) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('OXIDE','Oxide','氧化',3) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('BLACK_COVER','Black Cover','黑面',4) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('TIN_COVER','Tin Cover','錫面',5) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('NICKEL_COVER','Nickel Cover','代叻',6) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('CONTRAST','Contrast','鴛鴦',7) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('ENAMEL_DIP','Enamel Dip','撈油',8) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('IRIDESCENT','Iridescent','彩',9) on conflict (code) do nothing;
insert into public.finish_effects (code,name,name_zh_hant,sort_order) values ('SPECKLE','Speckle','斑點',10) on conflict (code) do nothing;
-- finish_tints
insert into public.finish_tints (code,name,name_zh_hant,sort_order) values ('JAPAN','Japan','日本',1) on conflict (code) do nothing;
insert into public.finish_tints (code,name,name_zh_hant,sort_order) values ('COFFEE','Coffee','咖啡',2) on conflict (code) do nothing;
insert into public.finish_tints (code,name,name_zh_hant,sort_order) values ('CHOCOLATE','Chocolate','朱古力',3) on conflict (code) do nothing;
insert into public.finish_tints (code,name,name_zh_hant,sort_order) values ('PINK','Pink','粉紅',4) on conflict (code) do nothing;
insert into public.finish_tints (code,name,name_zh_hant,sort_order) values ('ORANGE','Orange','橙',5) on conflict (code) do nothing;
insert into public.finish_tints (code,name,name_zh_hant,sort_order) values ('GUN_METAL','Gun Metal','槍',6) on conflict (code) do nothing;
-- finish_coatings
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('GLOSS_ENAMEL','Gloss Enamel','光油',1) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('MATT_ENAMEL','Matt Enamel','啞油',2) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('RUBBER','Rubber','橡膠油',3) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('PEARL','Pearl','珠光油',4) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('EP','Electrophoresis','電泳',5) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('GLITTER','Glitter','閃粉膠',6) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('VELVET','Velvet','絨毛油',7) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('EPOXY','Epoxy','滴膠',8) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('CERAMIC','Ceramic','陶瓷',9) on conflict (code) do nothing;
insert into public.finish_coatings (code,name,name_zh_hant,sort_order) values ('METALLIC','Metallic','金屬油',10) on conflict (code) do nothing;
-- finish_patterns
insert into public.finish_patterns (code,name,name_zh_hant,sort_order) values ('SPRAY_DOT','Spray Dot','粉點',1) on conflict (code) do nothing;
insert into public.finish_patterns (code,name,name_zh_hant,sort_order) values ('RAINDROP','Raindrop','雨點',2) on conflict (code) do nothing;
insert into public.finish_patterns (code,name,name_zh_hant,sort_order) values ('CRACKED','Cracked','裂紋',3) on conflict (code) do nothing;
insert into public.finish_patterns (code,name,name_zh_hant,sort_order) values ('GRADIENT','Gradient','陰陽',4) on conflict (code) do nothing;
insert into public.finish_patterns (code,name,name_zh_hant,sort_order) values ('SCREEN_PRINT','Screen Print','移印',5) on conflict (code) do nothing;
insert into public.finish_patterns (code,name,name_zh_hant,sort_order) values ('STONE_WASH','Stone Wash','打殘',6) on conflict (code) do nothing;
insert into public.finish_patterns (code,name,name_zh_hant,sort_order) values ('IMT_LEATHER','Imitation Leather','仿皮',7) on conflict (code) do nothing;

-- ============ 7. finishes (135) ============
-- is_public = false for every record: the chart is WIN-CYC's full manufacturing
-- capability, not their sellable range. Staff enable the sellable set in the CMS.
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0001',true,'HP NICKEL','掛無叻叻','Nickel','掛無叻叻','P.01','#C7CBCD',false,1,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='NICKEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0002',true,'HP BRUSHED NICKEL','掛無叻叻掃尼龍','Brushed Nickel','掛無叻叻掃尼龍','P.01','#C7CBCD',false,2,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0003',true,'HP MATT NICKEL','掛無叻啞叻','Matt Nickel','掛無叻啞叻','P.01','#C7CBCD',false,3,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0004',true,'HP GUN METAL','掛無叻槍','Gun Metal','掛無叻槍','P.01','#4C5155',false,4,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GUN_METAL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0005',true,'HP BRUSHED GUN METAL','掛無叻槍掃尼龍','Brushed Gun Metal','掛無叻槍掃尼龍','P.01','#4C5155',false,5,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GUN_METAL'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0006',true,'HP MATT GUN METAL','掛無叻啞槍','Matt Gun Metal','掛無叻啞槍','P.01','#4C5155',false,6,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GUN_METAL'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0007',true,'HP IMT ROSE GOLD','掛無叻仿玫瑰金','Imitation Rose Gold','掛無叻仿玫瑰金','P.01','#B99483',false,7,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ROSE_GOLD'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0008',true,'HP IMT BRUSHED ROSE GOLD','掛無叻仿玫瑰金掃尼龍','Imitation Brushed Rose Gold','掛無叻仿玫瑰金掃尼龍','P.01','#B99483',false,8,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ROSE_GOLD'),(select id from public.finish_surfaces where code='BRUSHED'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0009',true,'HP IMT MATT ROSE GOLD','掛無叻啞仿玫瑰金','Imitation Matt Rose Gold','掛無叻啞仿玫瑰金','P.01','#B99483',false,9,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ROSE_GOLD'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0010',true,'HP BRASS','掛無叻青銅','Brass','掛無叻青銅','P.01','#A99450',false,10,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='BRASS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0011',true,'HP BRUSHED BRASS','掛無叻青銅掃尼龍','Brushed Brass','掛無叻青銅掃尼龍','P.01','#A99450',false,11,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0012',true,'HP MATT BRASS','掛無叻啞青銅','Matt Brass','掛無叻啞青銅','P.01','#A99450',false,12,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0013',true,'HP GOLD','掛無叻真金','Gold','掛無叻真金','P.01','#C6A64E',false,13,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0014',true,'HP BRUSHED GOLD','掛無叻真金掃尼龍','Brushed Gold','掛無叻真金掃尼龍','P.01','#C6A64E',false,14,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0015',true,'HP MATT GOLD','掛無叻啞真金','Matt Gold','掛無叻啞真金','P.01','#C6A64E',false,15,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0016',true,'HP LIGHT GOLD','掛無叻淺金','Light Gold','掛無叻淺金','P.01','#E6D9AF',false,16,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_tones where code='LIGHT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0017',true,'HP BRUSHED LIGHT GOLD','掛無叻淺金掃尼龍','Brushed Light Gold','掛無叻淺金掃尼龍','P.01','#E6D9AF',false,17,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_surfaces where code='BRUSHED'),(select id from public.finish_tones where code='LIGHT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0018',true,'HP MATT LIGHT GOLD','掛無叻啞淺金','Matt Light Gold','掛無叻啞淺金','P.01','#E6D9AF',false,18,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_tones where code='LIGHT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0019',true,'HP ROSE GOLD','掛無叻玫瑰金','Rose Gold','掛無叻玫瑰金','P.01','#C08B73',false,19,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ROSE_GOLD')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0020',true,'HP BRUSHED ROSE GOLD','掛無叻玫瑰金掃尼龍','Brushed Rose Gold','掛無叻玫瑰金掃尼龍','P.01','#C08B73',false,20,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ROSE_GOLD'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0021',true,'HP MATT ROSE GOLD','掛無叻啞玫瑰金','Matt Rose Gold','掛無叻啞玫瑰金','P.01','#C08B73',false,21,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ROSE_GOLD'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0022',true,'HP IMT LIGHT GOLD','掛無叻仿淺金','Imitation Light Gold','掛無叻仿淺金','P.01','#D6C89B',false,22,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0023',true,'HP IMT BRUSHED LIGHT GOLD','掛無叻仿淺金掃尼龍','Imitation Brushed Light Gold','掛無叻仿淺金掃尼龍','P.01','#D6C89B',false,23,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_surfaces where code='BRUSHED'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0024',true,'HP IMT MATT LIGHT GOLD','掛無叻啞仿淺金','Imitation Matt Light Gold','掛無叻啞仿淺金','P.01','#D6C89B',false,24,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0025',true,'HP IMT GOLD','掛無叻仿金','Imitation Gold','掛無叻仿金','P.01','#BDA460',false,25,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0026',true,'HP IMT BRUSHED GOLD','掛無叻仿金掃尼龍','Imitation Brushed Gold','掛無叻仿金掃尼龍','P.01','#BDA460',false,26,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_surfaces where code='BRUSHED'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id,coating_id) values ('CYC-0027',true,'HP IMT BRUSHED GOLD MACL','掛無叻仿金掃尼龍啞油','Imitation Brushed Gold Macl','掛無叻仿金掃尼龍啞油','P.01','#BDA460',false,27,'MACL unexplained on chart; 啞油 in Chinese read as a matt top-coat.',(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_surfaces where code='BRUSHED'),(select id from public.finish_tones where code='IMT'),(select id from public.finish_coatings where code='MATT_ENAMEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0028',true,'HP SAND NICKEL','掛無叻叻噴沙','Sand Nickel','掛無叻叻噴沙','P.01','#C7CBCD',false,28,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='SAND')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0029',true,'HP SAND GUN METAL','掛無叻槍噴沙','Sand Gun Metal','掛無叻槍噴沙','P.01','#4C5155',false,29,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GUN_METAL'),(select id from public.finish_surfaces where code='SAND')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0030',true,'HP IMT LIGHT SAND GOLD','掛無叻仿淺金噴沙','Imitation Light Sand Gold','掛無叻仿淺金噴沙','P.01','#BDA460',false,30,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_surfaces where code='SAND'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0031',true,'HP CIRCLE BRUSHED ANTI COPPER','掛紅古銅圈掃尼龍','Circle Brushed Anti Copper','掛紅古銅圈掃尼龍','P.01','#7B5342',false,31,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_surfaces where code='CIRCLE_BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0032',true,'HP CIRCLE BRUSHED ANTI BRASS','掛紅青古圈掃尼龍','Circle Brushed Anti Brass','掛紅青古圈掃尼龍','P.01','#6B6247',false,32,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_surfaces where code='CIRCLE_BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0033',true,'HP ANCIENT NICKEL','溜叻','Ancient Nickel','溜叻','P.01','#979797',false,33,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_tones where code='ANCIENT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0034',true,'HP ANCIENT GUN METAL','溜槍','Ancient Gun Metal','溜槍','P.01','#1D1D1D',false,34,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GUN_METAL'),(select id from public.finish_tones where code='ANCIENT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0035',true,'HP ANCIENT GOLD','溜金','Ancient Gold','溜金','P.01','#7E692F',false,35,null,(select id from public.finish_processes where code='HP'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_tones where code='ANCIENT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0036',true,'NICKEL','無叻叻','Nickel','無叻叻','P.02','#C7CBCD',false,36,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0037',true,'BRUSHED NICKEL','無叻叻掃尼龍','Brushed Nickel','無叻叻掃尼龍','P.02','#C7CBCD',false,37,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0038',true,'MATT NICKEL','無叻啞叻','Matt Nickel','無叻啞叻','P.02','#C7CBCD',false,38,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0039',true,'DARK NICKEL','無叻深黑叻','Dark Nickel','無叻深黑叻','P.02','#9BA2A6',false,39,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_tones where code='DARK')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0040',true,'MATT DARK NICKEL','無叻啞深黑叻','Matt Dark Nickel','無叻啞深黑叻','P.02','#9BA2A6',false,40,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_tones where code='DARK')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0041',true,'BRUSHED DARK NICKEL','無叻黑叻掃尼龍','Brushed Dark Nickel','無叻黑叻掃尼龍','P.02','#9BA2A6',false,41,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='BRUSHED'),(select id from public.finish_tones where code='DARK')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0042',true,'ANTI NICKEL','無叻淺黑叻','Anti Nickel','無叻淺黑叻','P.02','#AAABAC',false,42,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_tones where code='ANTI')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id,tone_id) values ('CYC-0043',true,'MATT LIGHT ANTI NICKEL','無叻啞淺黑叻','Matt Light Anti Nickel','無叻啞淺黑叻','P.02','#DFE1E2',false,43,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_tones where code='LIGHT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0044',true,'BLACK COPPER','無叻黑古','Black Copper','無叻黑古','P.02','#302B28',false,44,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BLACK_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0045',true,'IMT BLACK COPPER','無叻防黑古','Imitation Black Copper','無叻防黑古','P.02','#313131',false,45,'Chinese 防 (anti-tarnish) translated as IMT; likely a typo for 仿.',(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BLACK_COPPER'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0046',true,'TIN','無叻錫','Tin','無叻錫','P.02','#A9ABA7',false,46,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='TIN')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0047',true,'BLACK TIN','無叻黑錫','Black Tin','無叻黑錫','P.02','#A9ABA7',false,47,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='TIN')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0048',true,'OLD TIN','無叻老錫','Old Tin','無叻老錫','P.02','#8A8A8A',false,48,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='TIN'),(select id from public.finish_tones where code='ANTI')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0049',true,'CONTRAST TIN','無叻鴛鴦錫','Contrast Tin','無叻鴛鴦錫','P.02','#A9ABA7',false,49,'鴛鴦 = two-tone. Facets cannot express two base colours; swatch carries the meaning.',(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='TIN'),(select id from public.finish_effects where code='CONTRAST')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0050',true,'BLACK COVER NICKEL','無叻黑面代叻','Black Cover Nickel','無叻黑面代叻','P.02','#A5A6A6',false,50,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='NICKEL'),(select id from public.finish_effects where code='BLACK_COVER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0051',true,'BRASS','無叻青銅','Brass','無叻青銅','P.02','#A99450',false,51,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0052',true,'BRUSHED BRASS','無叻青銅掃尼龍','Brushed Brass','無叻青銅掃尼龍','P.02','#A99450',false,52,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0053',true,'MATT BRASS','無叻啞青銅','Matt Brass','無叻啞青銅','P.02','#A99450',false,53,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0054',true,'OXIDE BRASS','無叻氧化青銅','Oxide Brass','無叻氧化青銅','P.02','#74673D',false,54,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_effects where code='OXIDE')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0055',true,'BLACK COVER BRASS','無叻黑面青銅','Black Cover Brass','無叻黑面青銅','P.02','#74673D',false,55,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_effects where code='BLACK_COVER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0056',true,'DARK ANTI BRASS','無叻深青古','Dark Anti Brass','無叻深青古','P.02','#393526',false,56,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_tones where code='DARK')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0057',true,'ANTI BRASS','無叻青古','Anti Brass','無叻青古','P.02','#6B6247',false,57,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0058',true,'JAPAN ANTI BRASS','無叻日本青古','Japan Anti Brass','無叻日本青古','P.02','#6B6247',false,58,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_tints where code='JAPAN')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0059',true,'BRUSHED ANTI BRASS','無叻青古掃尼龍','Brushed Anti Brass','無叻青古掃尼龍','P.02','#6B6247',false,59,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0060',true,'OLD ANTI BRASS','無叻光青古','Old Anti Brass','無叻光青古','P.02','#6B6247',false,60,'Chinese 光 (bright) vs English OLD. Chinese taken as truth. Confirm with WIN-CYC.',(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_surfaces where code='BRIGHT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0061',true,'DISTRESS ANTI BRASS','無叻濺泥青古','Distress Anti Brass','無叻濺泥青古','P.02','#6F6957',false,61,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_effects where code='DISTRESS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0062',true,'GM ANTI BRASS','無叻槍青古','Gun Metal Anti Brass','無叻槍青古','P.02','#44423A',false,62,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_tints where code='GUN_METAL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0063',true,'COFFEE ANTI BRASS','無叻咖啡青古','Coffee Anti Brass','無叻咖啡青古','P.02','#5B5237',false,63,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_tints where code='COFFEE')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0064',true,'NICKEL BRASS','無叻青銅代叻','Nickel Brass','無叻青銅代叻','P.02','#A99450',false,64,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0065',true,'TIN BRASS','無叻青銅錫','Tin Brass','無叻青銅錫','P.02','#A99450',false,65,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0066',true,'STONE WASH GOLD','無叻石磨金','Stone Wash Gold','無叻石磨金','P.02','#C2A965',false,66,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_effects where code='STONE_WASH')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0067',true,'CHOLCOLATE ANTI BRASS','無叻棕紅青古','Chocolate Anti Brass','無叻棕紅青古','P.02','#524A31',false,67,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS'),(select id from public.finish_tints where code='CHOCOLATE')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0068',true,'RED BRASS','無叻紅青銅','Red Brass','無叻紅青銅','P.02','#A99450',false,68,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0069',true,'GM ANTI COPPER','無叻槍紅古','Gun Metal Anti Copper','無叻槍紅古','P.02','#513F38',false,69,'Printed in the P.02 brass block but the name is a copper finish. Name wins over page position.',(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_tints where code='GUN_METAL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0070',true,'ENAMEL ANTI BRASS','無叻青古撈油','Enamel Anti Brass','無叻青古撈油','P.02','#6B6247',false,70,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_BRASS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0071',true,'RED COPPER','無叻紅銅','Red Copper','無叻紅銅','P.03','#B4714B',false,71,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RED_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0072',true,'MATT RED COPPER','無叻啞紅古銅','Matt Red Copper','無叻啞紅古銅','P.03','#B4714B',false,72,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RED_COPPER'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0073',true,'OXIDE RED COPPER','無叻氧化紅銅','Oxide Red Copper','無叻氧化紅銅','P.03','#7D523A',false,73,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RED_COPPER'),(select id from public.finish_effects where code='OXIDE')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0074',true,'BLACK RED COPPER','無叻黑面紅銅','Black Red Copper','無叻黑面紅銅','P.03','#B4714B',false,74,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RED_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0075',true,'ORANGE RED COPPER','無叻橙紅銅','Orange Red Copper','無叻橙紅銅','P.03','#C67547',false,75,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RED_COPPER'),(select id from public.finish_tints where code='ORANGE')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0076',true,'ANTI COPPER','無叻紅古','Anti Copper','無叻紅古','P.03','#7B5342',false,76,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0077',true,'JAPAN ANTI COPPER','無叻日本紅古','Japan Anti Copper','無叻日本紅古','P.03','#7B5342',false,77,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_tints where code='JAPAN')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0078',true,'PINK ANTI COPPER','無叻粉紅古','Pink Anti Copper','無叻粉紅古','P.03','#976048',false,78,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_tints where code='PINK')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tint_id) values ('CYC-0079',true,'CHOLCOLATE ANTI COPPER','無叻朱古力紅古','Chocolate Anti Copper','無叻朱古力紅古','P.03','#603D2E',false,79,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_tints where code='CHOCOLATE')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0080',true,'BRUSHED ANTI COPPER','無叻紅古掃尼龍','Brushed Anti Copper','無叻紅古掃尼龍','P.03','#7B5342',false,80,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0081',true,'STONE WASH RED','無叻石磨紅','Stone Wash Red','無叻石磨紅','P.03','#7F5F51',false,81,'No base family stated in either language. Inferred from neighbours CYC-0080 / CYC-0082.',(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_effects where code='STONE_WASH')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0082',true,'DISTRESS ANTI COPPER','無叻濺泥紅古','Distress Anti Copper','無叻濺泥紅古','P.03','#7F5F51',false,82,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER'),(select id from public.finish_effects where code='DISTRESS')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0083',true,'OLD ANTI COPPER TIN','無叻紅古老錫','Old Anti Copper Tin','無叻紅古老錫','P.03','#7B5342',false,83,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0084',true,'COPPER TIN','無叻紅銅錫','Copper Tin','無叻紅銅錫','P.03','#B4714B',false,84,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RED_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0085',true,'TIN RED COPPER','無叻錫面紅銅','Tin Red Copper','無叻錫面紅銅','P.03','#B4714B',false,85,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RED_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0086',true,'STAINLESS STEEL','無叻不鏽鋼','Stainless Steel','無叻不鏽鋼','P.03','#B4B8BB',false,86,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='STAINLESS_STEEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0087',true,'LIGHT ALLOY','無叻淺合金','Light Alloy','無叻淺合金','P.03','#A5A7AA',false,87,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ALLOY'),(select id from public.finish_tones where code='LIGHT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0088',true,'MEDIUM ALLOY','無叻中合金','Medium Alloy','無叻中合金','P.03','#8E9194',false,88,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ALLOY'),(select id from public.finish_tones where code='MEDIUM')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0089',true,'DEEP ALLOY','無叻深合金','Deep Alloy','無叻深合金','P.03','#65686B',false,89,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ALLOY'),(select id from public.finish_tones where code='DEEP')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0090',true,'ENAMEL ANTI COPPER','無叻紅古撈油','Enamel Anti Copper','無叻紅古撈油','P.03','#7B5342',false,90,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_COPPER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0091',true,'ANTI SILVER','無叻古銀','Anti Silver','無叻古銀','P.03','#999A95',false,91,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_SILVER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0092',true,'IMT ANTI SILVER','無叻仿古銀','Imitation Anti Silver','無叻仿古銀','P.03','#9C9C9C',false,92,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ANTI_SILVER'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0093',true,'ANTI GOLD','無叻古金','Anti Gold','無叻古金','P.03','#9E8338',false,93,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_tones where code='ANTI')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0094',true,'ANCIENT GOLD','無叻遠古金','Ancient Gold','無叻遠古金','P.03','#7E692F',false,94,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_tones where code='ANCIENT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0095',true,'GOLDED BRASS','無叻彩青銅','Iridescent Brass','彩青銅','P.03','#A99450',false,95,'Printed English ''GOLDED BRASS'' is not a word; 彩 = iridescent. Marketing name diverges from chart English.',(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_effects where code='IRIDESCENT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0096',true,'GOLD','無叻真金','Gold','無叻真金','P.03','#C6A64E',false,96,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='GOLD')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0097',true,'LIGHT GOLD','無叻淺金','Light Gold','無叻淺金','P.03','#E6D9AF',false,97,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_tones where code='LIGHT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0098',true,'ROSE GOLD','無叻玫瑰金','Rose Gold','無叻玫瑰金','P.03','#C08B73',false,98,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ROSE_GOLD')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0099',true,'BRUSHED GOLD','無叻真金掃尼龍','Brushed Gold','無叻真金掃尼龍','P.03','#C6A64E',false,99,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0100',true,'MATT GOLD','無叻啞金','Matt Gold','無叻啞金','P.03','#C6A64E',false,100,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_surfaces where code='MATT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0101',true,'IMT GOLD','無叻仿金','Imitation Gold','無叻仿金','P.03','#BDA460',false,101,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='GOLD'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0102',true,'IMT LIGHT GOLD','無叻仿淺金','Imitation Light Gold','無叻仿淺金','P.03','#D6C89B',false,102,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='LIGHT_GOLD'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,tone_id) values ('CYC-0103',true,'IMT ROSE GOLD','無叻仿玫瑰金','Imitation Rose Gold','無叻仿玫瑰金','P.03','#B99483',false,103,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ROSE_GOLD'),(select id from public.finish_tones where code='IMT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,surface_id) values ('CYC-0104',true,'BRUSHED ROSE GOLD','無叻玫瑰金掃尼龍','Brushed Rose Gold','無叻玫瑰金掃尼龍','P.03','#C08B73',false,104,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='ROSE_GOLD'),(select id from public.finish_surfaces where code='BRUSHED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id) values ('CYC-0105',true,'RUSTY STEEL','無叻鐵鏽','Rusty Steel','無叻鐵鏽','P.03','#6E4F3E',false,105,null,(select id from public.finish_processes where code='ROLL'),(select id from public.finish_base_families where code='RUSTY_STEEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0106',true,'WHITE ENAMEL','白色光油','White Enamel','白色光油','P.04','#F1F1EF',false,106,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,surface_id,coating_id) values ('CYC-0107',true,'MATT WHITE ENAMEL','白色啞油','Matt White Enamel','白色啞油','P.04','#F1F1EF',false,107,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_coatings where code='MATT_ENAMEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0108',true,'RUBBER WHITE','白色橡膠油','Rubber White','白色橡膠油','P.04','#F1F1EF',false,108,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='RUBBER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0109',true,'PEARL WHITE','白色珠光油','Pearl White','白色珠光油','P.04','#F1F1EF',false,109,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='PEARL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id,pattern_id) values ('CYC-0110',true,'SPRAY DOT ENAMEL','粉點漆','Spray Dot Enamel','粉點漆','P.04','#8A8A88',false,110,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL'),(select id from public.finish_patterns where code='SPRAY_DOT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0111',true,'BLACK ENAMEL','黑色光油','Black Enamel','黑色光油','P.04','#171717',false,111,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,surface_id,coating_id) values ('CYC-0112',true,'MATT BLACK ENAMEL','黑色啞油','Matt Black Enamel','黑色啞油','P.04','#171717',false,112,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_coatings where code='MATT_ENAMEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0113',true,'RUBBER BLACK','黑色橡膠油','Rubber Black','黑色橡膠油','P.04','#171717',false,113,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='RUBBER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0114',true,'PEARL BLACK','黑色珠光油','Pearl Black','黑色珠光油','P.04','#171717',false,114,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='PEARL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id,pattern_id) values ('CYC-0115',true,'GRADIENT ENAMEL','陰陽色','Gradient Enamel','陰陽色','P.04','#8A8A88',false,115,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL'),(select id from public.finish_patterns where code='GRADIENT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0116',true,'EP BLACK','光泳','Ep Black','光泳','P.04','#171717',false,116,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='EP')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,surface_id,coating_id) values ('CYC-0117',true,'MATT EP BLACK','啞泳','Matt Ep Black','啞泳','P.04','#171717',false,117,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_surfaces where code='MATT'),(select id from public.finish_coatings where code='EP')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id,pattern_id) values ('CYC-0118',true,'SCREEN PRINT ENAMEL','噴油移印','Screen Print Enamel','噴油移印','P.04','#8A8A88',false,118,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL'),(select id from public.finish_patterns where code='SCREEN_PRINT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id,pattern_id) values ('CYC-0119',true,'RAINDROP ENAMEL','雨點漆','Raindrop Enamel','雨點漆','P.04','#8A8A88',false,119,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL'),(select id from public.finish_patterns where code='RAINDROP')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id,pattern_id) values ('CYC-0120',true,'CRACKED ENAMEL','裂紋漆','Cracked Enamel','裂紋漆','P.04','#8A8A88',false,120,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL'),(select id from public.finish_patterns where code='CRACKED')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0121',true,'METALLIC SILVER','銀色金屬油','Metallic Silver','銀色金屬油','P.04','#C3C6C8',false,121,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='METALLIC')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0122',true,'VELVET ENAMEL','絨毛油','Velvet Enamel','絨毛油','P.04','#8A8A88',false,122,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='VELVET')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0123',true,'METALLIC RED','金屬紅色','Metallic Red','金屬紅色','P.04','#A61F44',false,123,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='METALLIC')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id) values ('CYC-0124',true,'FLUORESCENCE GREEN','螢光綠','Fluorescence Green','螢光綠','P.04','#C6DE28',false,124,null,(select id from public.finish_processes where code='PAINT')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,tone_id,coating_id,pattern_id) values ('CYC-0125',true,'IMT LEATHER ENAMEL','仿皮油','Imitation Leather Enamel','仿皮油','P.04','#8E8E8E',false,125,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_tones where code='IMT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL'),(select id from public.finish_patterns where code='IMT_LEATHER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0126',true,'WHITE GLITTER','白色閃粉膠','White Glitter','白色閃粉膠','P.04','#F1F1EF',false,126,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLITTER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0127',true,'GOLD GLITTER','金色閃粉膠','Gold Glitter','金色閃粉膠','P.04','#8C7A45',false,127,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLITTER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,effect_id,coating_id,pattern_id) values ('CYC-0128',true,'STONE WASH ENAMEL','噴油打殘','Stone Wash Enamel','噴油打殘','P.04','#939393',false,128,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_effects where code='STONE_WASH'),(select id from public.finish_coatings where code='GLOSS_ENAMEL'),(select id from public.finish_patterns where code='STONE_WASH')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0129',true,'TEA GOLD ENAMEL','茶金','Tea Gold Enamel','茶金','P.04','#9A8248',false,129,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='GLOSS_ENAMEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,tone_id,coating_id) values ('CYC-0130',true,'ANTI GOLD ENAMEL','古金','Anti Gold Enamel','古金','P.04','#605433',false,130,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_tones where code='ANTI'),(select id from public.finish_coatings where code='GLOSS_ENAMEL')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0131',true,'BLUE CERAMIC','陶瓷藍','Blue Ceramic','陶瓷藍','P.04','#1B5FC1',false,131,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='CERAMIC')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,coating_id) values ('CYC-0132',true,'ENAMEL EPOXY','抹油滴膠','Enamel Epoxy','抹油滴膠','P.04','#8A8A88',false,132,null,(select id from public.finish_processes where code='PAINT'),(select id from public.finish_coatings where code='EPOXY')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0133',true,'ECO OXIDE LT ORG RED COPPER','環保鍍氧化淺橙紅銅','Eco Oxide Light Orange Red Copper','環保鍍氧化淺橙紅銅','P.04','#7D523A',false,133,null,(select id from public.finish_processes where code='ECO'),(select id from public.finish_base_families where code='RED_COPPER'),(select id from public.finish_effects where code='OXIDE')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0134',true,'ECO BLACK COVER BRASS','環保鍍黑面青銅','Eco Black Cover Brass','環保鍍黑面青銅','P.04','#74673D',false,134,null,(select id from public.finish_processes where code='ECO'),(select id from public.finish_base_families where code='BRASS'),(select id from public.finish_effects where code='BLACK_COVER')) on conflict (cyc_code) do nothing;
insert into public.finishes (cyc_code,is_standard,factory_name_en,factory_name_zh_hant,marketing_name,marketing_name_zh_hant,chart_page,hex_approx,is_public,sort_order,notes,process_id,base_family_id,effect_id) values ('CYC-0135',true,'ECO SPECKLE BLACK COPPER','環保鍍斑點黑紅銅','Eco Speckle Black Copper','環保鍍斑點黑紅銅','P.04','#302B28',false,135,null,(select id from public.finish_processes where code='ECO'),(select id from public.finish_base_families where code='BLACK_COPPER'),(select id from public.finish_effects where code='SPECKLE')) on conflict (cyc_code) do nothing;

-- ============ 8. seed products (25, one per category) ============
-- Name, category and material only. item_code is null so published_needs_item_code
-- blocks publication until a real code is entered.
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-hook-and-loop','Sample — Hook & Loop Tape','draft',false,(select id from public.product_materials where name='Nylon')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-hook-and-loop' and c.slug='hook-and-loop'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-elastic-tape-braided-elastic','Sample — Braided Elastic Tape','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-elastic-tape-braided-elastic' and c.slug='elastic-tape-braided-elastic'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-bias-mattress-tape','Sample — Bias Tape','draft',false,(select id from public.product_materials where name='Cotton')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-bias-mattress-tape' and c.slug='bias-mattress-tape'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-pp-cotton-poly-tc-webbing','Sample — Polypropylene Webbing','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-pp-cotton-poly-tc-webbing' and c.slug='pp-cotton-poly-tc-webbing'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-bag-case-sofa-webbing','Sample — Bag Webbing','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-bag-case-sofa-webbing' and c.slug='bag-case-sofa-webbing'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-camouflage-reflective-webbing','Sample — Reflective Webbing','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-camouflage-reflective-webbing' and c.slug='camouflage-reflective-webbing'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-trousers-waistband-labels','Sample — Trousers Waistband','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-trousers-waistband-labels' and c.slug='trousers-waistband-labels'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-traditional-jacquard-tape','Sample — Jacquard Tape','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-traditional-jacquard-tape' and c.slug='traditional-jacquard-tape'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-cotton-nylon-lace','Sample — Cotton Lace','draft',false,(select id from public.product_materials where name='Cotton')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-cotton-nylon-lace' and c.slug='cotton-nylon-lace'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-elastic-lace-embroidered-net','Sample — Embroidered Net','draft',false,(select id from public.product_materials where name='Nylon')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-elastic-lace-embroidered-net' and c.slug='elastic-lace-embroidered-net'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-satin-grosgrain-velvet-ribbons','Sample — Satin Ribbon','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-satin-grosgrain-velvet-ribbons' and c.slug='satin-grosgrain-velvet-ribbons'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-bows-trimmings','Sample — Ribbon Bow','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-bows-trimmings' and c.slug='bows-trimmings'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-d-rings-o-rings','Sample — D-Ring','draft',false,(select id from public.product_materials where name='Zinc Alloy')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-d-rings-o-rings' and c.slug='d-rings-o-rings'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-buckles-cord-locks','Sample — Side Release Buckle','draft',false,(select id from public.product_materials where name='Zinc Alloy')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-buckles-cord-locks' and c.slug='buckles-cord-locks'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-eyelets-rivets','Sample — Eyelet','draft',false,(select id from public.product_materials where name='Brass')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-eyelets-rivets' and c.slug='eyelets-rivets'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-metal-pendants-brand-badges','Sample — Brand Badge','draft',false,(select id from public.product_materials where name='Zinc Alloy')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-metal-pendants-brand-badges' and c.slug='metal-pendants-brand-badges'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-polyester-buttons','Sample — Polyester Button','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-polyester-buttons' and c.slug='polyester-buttons'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-metal-shank-buttons','Sample — Metal Shank Button','draft',false,(select id from public.product_materials where name='Zinc Alloy')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-metal-shank-buttons' and c.slug='metal-shank-buttons'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-horn-shell-buttons','Sample — Horn Button','draft',false,(select id from public.product_materials where name='Horn')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-horn-shell-buttons' and c.slug='horn-shell-buttons'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-snap-fasteners-jeans-buttons','Sample — Jeans Button','draft',false,(select id from public.product_materials where name='Brass')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-snap-fasteners-jeans-buttons' and c.slug='snap-fasteners-jeans-buttons'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-metal-zippers','Sample — Metal Zipper','draft',false,(select id from public.product_materials where name='Brass')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-metal-zippers' and c.slug='metal-zippers'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-nylon-coil-zippers','Sample — Nylon Coil Zipper','draft',false,(select id from public.product_materials where name='Nylon')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-nylon-coil-zippers' and c.slug='nylon-coil-zippers'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-plastic-vislon-zippers','Sample — Vislon Zipper','draft',false,(select id from public.product_materials where name='Polyester')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-plastic-vislon-zippers' and c.slug='plastic-vislon-zippers'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-waterproof-invisible-zippers','Sample — Invisible Zipper','draft',false,(select id from public.product_materials where name='Nylon')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-waterproof-invisible-zippers' and c.slug='waterproof-invisible-zippers'
  on conflict do nothing;
insert into public.products (slug,name,status,is_public,material_id)
  select 'sample-zipper-pullers-sliders','Sample — Zipper Puller','draft',false,(select id from public.product_materials where name='Zinc Alloy')
  on conflict (slug) do nothing;
insert into public.product_category_map (product_id,category_id)
  select p.id,c.id from public.products p, public.product_categories c
  where p.slug='sample-zipper-pullers-sliders' and c.slug='zipper-pullers-sliders'
  on conflict do nothing;

commit;
