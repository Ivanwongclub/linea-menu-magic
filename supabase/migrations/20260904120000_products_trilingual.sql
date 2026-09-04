-- Products: proper trilingual name/description, matching taxonomy, finishes
-- and axes. Products are the one entity customers actually read and were the
-- least translatable thing in the database — `name` plus a legacy `name_en`
-- override, no Chinese columns at all.
--
-- name_en / description_en are NOT dropped. The storefront still reads
-- `name_en ?? name`; retiring that is M5's job. After this migration `name`
-- is the English base and name_en is redundant wherever it was set.
--
-- Backfill, in order, for name and then description:
--   1. Where the override is set and differs from the base, AND the base
--      contains CJK text, preserve the base into *_zh_hant before it is
--      overwritten (only if *_zh_hant is still null). Without this step the
--      copy in (2) would silently discard a Chinese name. Guarded on CJK so a
--      merely-different English base is not mistaken for Traditional Chinese.
--   2. Where the override is set and differs from the base, copy it into the
--      base so the base is English.
-- Idempotent: add-if-not-exists, and step 2 makes step 1's condition false,
-- so re-running changes nothing.
--
-- To see what it will touch before applying:
--   select id, slug, name, name_en, name ~ '[㐀-鿿]' as base_is_cjk
--   from public.products where name_en is not null and name_en <> name;
--   select id, slug, left(description, 40), left(description_en, 40)
--   from public.products where description_en is not null and description_en <> description;

begin;

alter table public.products
  add column if not exists name_zh_hant text,
  add column if not exists name_zh_hans text,
  add column if not exists description_zh_hant text,
  add column if not exists description_zh_hans text;

-- ---- name ----
update public.products
set name_zh_hant = name
where name_en is not null
  and name_en <> name
  and name_zh_hant is null
  and name ~ '[㐀-鿿]';

update public.products
set name = name_en
where name_en is not null
  and name_en <> name;

-- ---- description ----
update public.products
set description_zh_hant = description
where description_en is not null
  and description is not null
  and description_en <> description
  and description_zh_hant is null
  and description ~ '[㐀-鿿]';

update public.products
set description = description_en
where description_en is not null
  and (description is null or description_en <> description);

commit;
