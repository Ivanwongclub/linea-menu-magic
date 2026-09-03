-- Finish axis values: populate name_zh_hans from name_zh_hant.
-- M2 seeded the 8 finish axis tables with Traditional Chinese only (the
-- source chart is Traditional); Simplified was left null on every row.
-- Each value below is the Simplified form of the M2 name_zh_hant. Where
-- Traditional and Simplified are identical the same string is written so
-- the column is populated rather than left looking unfilled.
--
-- Keyed by code, guarded on name_zh_hans is null: idempotent, and never
-- overwrites a value staff have since entered through /admin.

begin;

-- finish_processes
update public.finish_processes t set name_zh_hans = v.hans
from (values
  ('HP',    '挂电'),     -- 掛電
  ('ROLL',  '滚电'),     -- 滾電
  ('PAINT', '喷漆'),     -- 噴漆
  ('ECO',   '环保镀')    -- 環保鍍
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

-- finish_base_families
update public.finish_base_families t set name_zh_hans = v.hans
from (values
  ('NICKEL',          '叻'),       -- 叻 (no simplified form)
  ('GUN_METAL',       '枪'),       -- 槍
  ('GOLD',            '真金'),     -- 真金 (same)
  ('LIGHT_GOLD',      '浅金'),     -- 淺金
  ('ROSE_GOLD',       '玫瑰金'),   -- 玫瑰金 (same)
  ('BRASS',           '青铜'),     -- 青銅
  ('ANTI_BRASS',      '青古'),     -- 青古 (same)
  ('RED_COPPER',      '红铜'),     -- 紅銅
  ('ANTI_COPPER',     '红古'),     -- 紅古
  ('BLACK_COPPER',    '黑古'),     -- 黑古 (same)
  ('TIN',             '锡'),       -- 錫
  ('ANTI_SILVER',     '古银'),     -- 古銀
  ('ALLOY',           '合金'),     -- 合金 (same)
  ('STAINLESS_STEEL', '不锈钢'),   -- 不鏽鋼
  ('RUSTY_STEEL',     '铁锈')      -- 鐵鏽
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

-- finish_surfaces
update public.finish_surfaces t set name_zh_hans = v.hans
from (values
  ('BRIGHT',         '光'),        -- 光 (same)
  ('BRUSHED',        '扫尼龙'),    -- 掃尼龍
  ('MATT',           '哑'),        -- 啞
  ('SAND',           '喷沙'),      -- 噴沙
  ('CIRCLE_BRUSHED', '圈扫尼龙')   -- 圈掃尼龍
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

-- finish_tones
update public.finish_tones t set name_zh_hans = v.hans
from (values
  ('IMT',     '仿'),     -- 仿 (same)
  ('DARK',    '深'),     -- 深 (same)
  ('LIGHT',   '浅'),     -- 淺
  ('MEDIUM',  '中'),     -- 中 (same)
  ('DEEP',    '深'),     -- 深 (same)
  ('ANTI',    '古'),     -- 古 (same)
  ('ANCIENT', '远古')    -- 遠古
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

-- finish_effects
update public.finish_effects t set name_zh_hans = v.hans
from (values
  ('DISTRESS',     '溅泥'),   -- 濺泥
  ('STONE_WASH',   '石磨'),   -- 石磨 (same)
  ('OXIDE',        '氧化'),   -- 氧化 (same)
  ('BLACK_COVER',  '黑面'),   -- 黑面 (same)
  ('TIN_COVER',    '锡面'),   -- 錫面
  ('NICKEL_COVER', '代叻'),   -- 代叻 (same)
  ('CONTRAST',     '鸳鸯'),   -- 鴛鴦
  ('ENAMEL_DIP',   '捞油'),   -- 撈油
  ('IRIDESCENT',   '彩'),     -- 彩 (same)
  ('SPECKLE',      '斑点')    -- 斑點
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

-- finish_tints
update public.finish_tints t set name_zh_hans = v.hans
from (values
  ('JAPAN',     '日本'),     -- 日本 (same)
  ('COFFEE',    '咖啡'),     -- 咖啡 (same)
  ('CHOCOLATE', '朱古力'),   -- 朱古力 (same; Cantonese term kept as-is)
  ('PINK',      '粉红'),     -- 粉紅
  ('ORANGE',    '橙'),       -- 橙 (same)
  ('GUN_METAL', '枪')        -- 槍
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

-- finish_coatings
update public.finish_coatings t set name_zh_hans = v.hans
from (values
  ('GLOSS_ENAMEL', '光油'),     -- 光油 (same)
  ('MATT_ENAMEL',  '哑油'),     -- 啞油
  ('RUBBER',       '橡胶油'),   -- 橡膠油
  ('PEARL',        '珠光油'),   -- 珠光油 (same)
  ('EP',           '电泳'),     -- 電泳
  ('GLITTER',      '闪粉胶'),   -- 閃粉膠
  ('VELVET',       '绒毛油'),   -- 絨毛油
  ('EPOXY',        '滴胶'),     -- 滴膠
  ('CERAMIC',      '陶瓷'),     -- 陶瓷 (same)
  ('METALLIC',     '金属油')    -- 金屬油
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

-- finish_patterns
update public.finish_patterns t set name_zh_hans = v.hans
from (values
  ('SPRAY_DOT',    '粉点'),   -- 粉點
  ('RAINDROP',     '雨点'),   -- 雨點
  ('CRACKED',      '裂纹'),   -- 裂紋
  ('GRADIENT',     '阴阳'),   -- 陰陽
  ('SCREEN_PRINT', '移印'),   -- 移印 (same)
  ('STONE_WASH',   '打残'),   -- 打殘
  ('IMT_LEATHER',  '仿皮')    -- 仿皮 (same)
) as v(code, hans)
where t.code = v.code and t.name_zh_hans is null;

commit;
