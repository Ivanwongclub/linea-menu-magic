-- Designer Studio Phase 3e — chroma-gated hue calibration.
-- Ref: docs/3d-editor/STATUS.md (Phase 3e).
--
--   R1  A family's hue is fitted from the chart only when the median CIELAB C*
--       of its R2 rows (glare-free; MATT / SAND / BRUSHED / CIRCLE_BRUSHED
--       preferred) is ≥ 7 (ruled up from 5: at 5 gold (C* 5.2) and rose gold
--       (6.7) were fitted to lime and mauve). Below that the photo's hue is the
--       room's tint and the family stays physical: hue_shift_deg 0,
--       chroma_scale 1. Fitted: ANTI_COPPER, RED_COPPER.
--   R3  Calibration values rewritten; the 108 plated rows recomputed (count
--       asserted); painted rows untouched.
--
-- The derivation (finish_plated_material) is unchanged from 3d; only the
-- table's values move. finishes.oxide_color_hex (3d) is now rendered by the
-- editor (lib/twoTone.ts).

begin;

alter table public.finish_family_calibration
  add column chart_chroma numeric;

comment on column public.finish_family_calibration.chart_chroma is
  'Median CIELAB C* of the family''s R2 chart rows; hue is fitted only when ≥ 7 (Phase 3e R1).';

delete from public.finish_family_calibration;

-- Values from calibrate/fit-families.mjs, measured at these values; emitted
-- by calibrate/refit.mjs.
insert into public.finish_family_calibration (base_family_code, hue_shift_deg, chroma_scale, value, oxide_l, rows_used, residual_hue_deg, residual_l, chart_chroma, note) values
('ALLOY', 0, 1, 1, 15, 0, null, 0, 3.13, 'chart C* 3.13 < 7; physical hue and chroma (3e R1)'),
  ('ANTI_BRASS', 0, 1, 1, 15, 0, null, 0, 4.29, 'chart C* 4.29 < 7; physical hue and chroma (3e R1)'),
  ('ANTI_COPPER', -12.5, 1, 1, 15, 1, 1.09, 0.07, 9.3, null),
  ('ANTI_SILVER', 0, 1, 1, 20.74, 0, null, 0, 1.42, 'chart C* 1.42 < 7; physical hue and chroma (3e R1)'),
  ('BLACK_COPPER', 0, 1, 1, 15, 0, null, 0, 4.61, 'chart C* 4.61 < 7; physical hue and chroma (3e R1)'),
  ('BRASS', 0, 1, 1, null, 0, null, 0, 6.36, 'chart C* 6.36 < 7; physical hue and chroma (3e R1)'),
  ('GOLD', 0, 1, 1, 15, 0, null, 0, 5.23, 'chart C* 5.23 < 7; physical hue and chroma (3e R1)'),
  ('GUN_METAL', 0, 1, 1, 15, 0, null, 0, 1.99, 'chart C* 1.99 < 7; physical hue and chroma (3e R1)'),
  ('LIGHT_GOLD', 0, 1, 1, null, 0, null, 0, 3.08, 'chart C* 3.08 < 7; physical hue and chroma (3e R1)'),
  ('NICKEL', 0, 1, 1, 15, 0, null, 0, 4.07, 'chart C* 4.07 < 7; physical hue and chroma (3e R1)'),
  ('RED_COPPER', -1.5, 1, 1, null, 2, 0.13, 0.3, 8.67, null),
  ('ROSE_GOLD', 0, 1, 1, null, 0, null, 0, 6.68, 'chart C* 6.68 < 7; physical hue and chroma (3e R1)'),
  ('RUSTY_STEEL', 0, 1, 1, null, 0, null, 0, 1.41, 'chart C* 1.41 < 7; physical hue and chroma (3e R1)'),
  ('STAINLESS_STEEL', 0, 1, 1, null, 0, null, 0, 1.63, 'physical iron/steel, no fit; swatch CYC-0086 needs re-photographing (R4)'),
  ('TIN', 0, 1, 0.1432, 17.81, 0, null, 0, 1.37, '3c chart-derived value kept (R4)');

do $$
declare
  n int;
begin
  update public.finishes f
  set base_color_hex      = d.base_color_hex,
      metalness           = d.metalness,
      roughness           = d.roughness,
      anisotropy          = d.anisotropy,
      clearcoat           = d.clearcoat,
      clearcoat_roughness = d.clearcoat_roughness,
      two_tone            = d.two_tone,
      oxide_color_hex     = d.oxide_color_hex
  from public.finishes x
  cross join lateral public.finish_derive(x) d
  where x.id = f.id and x.coating_id is null;
  get diagnostics n = row_count;
  if n <> 108 then raise exception 'expected 108 plated rows, recomputed %', n; end if;
end $$;

commit;
