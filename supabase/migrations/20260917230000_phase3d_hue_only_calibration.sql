-- Designer Studio Phase 3d — hue-only family calibration, physical lightness.
-- Supersedes 3c's saturation / value / offset fit.
-- Ref: docs/3d-editor/STATUS.md (Phase 3d).
--
--   R1  A plated family's L* is its metal's published reflectance under the
--       procedural studio and is never fitted. The calibration rotates the
--       CIELAB hue angle of the linear base colour at constant L*; chroma is
--       never raised — reduced only where a studio target needs it (bright
--       nickel's highlight) or the rotation leaves the gamut.
--   R2  Hue fitted from the family's glare-free chart rows, MATT / SAND /
--       BRUSHED surfaces preferred; glare-only families get no rotation.
--   R3  Two-tone: the buffed layer follows R1; the oxide layer takes its L*
--       from the chart (floored at 15) → finishes.oxide_color_hex.
--   R4  STAINLESS_STEEL is physical iron, no fit. TIN keeps 3c's
--       chart-derived value (0.1432).
--
-- src/features/finishes/metalReflectance.ts mirrors the derivation;
-- render-calibration.mjs asserts parity row for row. Painted rows unchanged.

begin;

-- ---------------------------------------------------------------------
-- Calibration table: hue shift, value (TIN only), oxide L*.
-- ---------------------------------------------------------------------
alter table public.finish_family_calibration
  drop column saturation,
  drop column offset_r,
  drop column offset_g,
  drop column offset_b,
  drop column residual_de2000,
  add column hue_shift_deg     numeric not null default 0,
  add column chroma_scale      numeric not null default 1 check (chroma_scale between 0 and 1),
  add column oxide_l           numeric,
  add column residual_hue_deg  numeric,
  add column residual_l        numeric;

comment on column public.finish_family_calibration.hue_shift_deg is
  'Degrees added to the CIELAB hue of the linear base colour at constant L* (Phase 3d R1).';
comment on column public.finish_family_calibration.chroma_scale is
  'Chroma multiplier, never above 1 (R1); below 1 only where a studio target requires it.';
comment on column public.finish_family_calibration.value is
  'Linear scale before the rotation. 1 except TIN (3c chart-derived reference, R4).';
comment on column public.finish_family_calibration.oxide_l is
  'Two-tone oxide layer L* from the chart, floored at 15 (R3). Null → buffed × 0.25.';
comment on column public.finish_family_calibration.residual_hue_deg is
  'Measured |rendered − chart| median hue angle over the fit rows.';
comment on column public.finish_family_calibration.residual_l is
  'Measured rendered median L* − physical L* (buffed layer).';

delete from public.finish_family_calibration;

-- Values from calibrate/fit-families.mjs (stepped to convergence, then measured
-- at these values); emitted by calibrate/refit.mjs. Residuals are measured.
insert into public.finish_family_calibration (base_family_code, hue_shift_deg, chroma_scale, value, oxide_l, rows_used, residual_hue_deg, residual_l, note) values
('ALLOY', 58.25, 1, 1, 15, 2, 0.03, 0.05, null),
  ('ANTI_BRASS', 23, 1, 1, 15, 1, 0.17, 0.15, null),
  ('ANTI_COPPER', -25.25, 1, 1, 15, 4, 0.05, 0.08, null),
  ('ANTI_SILVER', 172, 1, 1, 20.74, 2, 1.38, 0.08, null),
  ('BLACK_COPPER', -139.75, 1, 1, 15, 3, 0.46, 0.22, null),
  ('BRASS', 15.25, 1, 1, null, 3, 0.1, 0.1, null),
  ('GOLD', 26.25, 1, 1, 15, 4, 0.03, 0.17, null),
  ('GUN_METAL', -2.5, 1, 1, 15, 1, 4.28, -0.17, null),
  ('LIGHT_GOLD', 16, 1, 1, null, 3, 0.09, -0.08, null),
  ('NICKEL', -166.5, 0.35, 1, 15, 2, 6.65, -0.11, null),
  ('RED_COPPER', -1.5, 1, 1, null, 2, 0.13, -0.01, null),
  ('ROSE_GOLD', -87.5, 1, 1, null, 1, 0.37, 0.02, null),
  ('RUSTY_STEEL', -14.75, 1, 1, null, 1, 2.4, 0.04, null),
  ('STAINLESS_STEEL', 0, 1, 1, null, 0, null, 0.02, 'physical iron/steel, no fit; swatch CYC-0086 needs re-photographing (R4)'),
  ('TIN', 0, 1, 0.1432, 17.81, 0, null, 0.18, '3c chart-derived value kept (R4)');

alter table public.finishes
  add column if not exists oxide_color_hex text check (oxide_color_hex ~ '^#[0-9A-F]{6}$');

comment on column public.finishes.oxide_color_hex is
  'Two-tone rows: the oxide layer''s base colour (Phase 3d R3); null otherwise.';

-- ---------------------------------------------------------------------
-- CIELAB (D65) ↔ linear sRGB, and a hue/chroma placement that keeps L*.
-- ---------------------------------------------------------------------
create or replace function public.finish_linear_to_lab(p_r float8, p_g float8, p_b float8,
  out l float8, out a float8, out bb float8)
language plpgsql immutable
as $$
declare
  x float8 := 0.4124564 * p_r + 0.3575761 * p_g + 0.1804375 * p_b;
  y float8 := 0.2126729 * p_r + 0.7151522 * p_g + 0.072175 * p_b;
  z float8 := 0.0193339 * p_r + 0.119192 * p_g + 0.9503041 * p_b;
  fx float8; fy float8; fz float8;
begin
  x := x / 0.95047; z := z / 1.08883;
  fx := case when x > 216.0 / 24389 then cbrt(x) else (24389.0 / 27 * x + 16) / 116 end;
  fy := case when y > 216.0 / 24389 then cbrt(y) else (24389.0 / 27 * y + 16) / 116 end;
  fz := case when z > 216.0 / 24389 then cbrt(z) else (24389.0 / 27 * z + 16) / 116 end;
  l := 116 * fy - 16;
  a := 500 * (fx - fy);
  bb := 200 * (fy - fz);
end $$;

create or replace function public.finish_lab_to_linear(p_l float8, p_a float8, p_b float8,
  out r float8, out g float8, out b float8)
language plpgsql immutable
as $$
declare
  fy float8 := (p_l + 16) / 116;
  fx float8 := fy + p_a / 500;
  fz float8 := fy - p_b / 200;
  x float8; y float8; z float8;
begin
  x := (case when fx > 6.0 / 29 then fx * fx * fx else (116 * fx - 16) / (24389.0 / 27) end) * 0.95047;
  y :=  case when fy > 6.0 / 29 then fy * fy * fy else (116 * fy - 16) / (24389.0 / 27) end;
  z := (case when fz > 6.0 / 29 then fz * fz * fz else (116 * fz - 16) / (24389.0 / 27) end) * 1.08883;
  r :=  3.2404542 * x - 1.5371385 * y - 0.4985314 * z;
  g := -0.969266  * x + 1.8760108 * y + 0.041556  * z;
  b :=  0.0556434 * x - 0.2040259 * y + 1.0572252 * z;
end $$;

-- L* and hue fixed; the largest chroma ≤ p_chroma in gamut (20-step bisection).
create or replace function public.finish_lab_in_gamut(p_l float8, p_chroma float8, p_h float8,
  out r float8, out g float8, out b float8)
language plpgsql immutable
as $$
declare
  c record;
  lo float8 := 0;
  hi float8 := 1;
  mid float8;
  i int;
begin
  select * into c from public.finish_lab_to_linear(p_l, p_chroma * cos(p_h), p_chroma * sin(p_h));
  if c.r between 0 and 1 and c.g between 0 and 1 and c.b between 0 and 1 then
    r := c.r; g := c.g; b := c.b;
    return;
  end if;
  for i in 1..20 loop
    mid := (lo + hi) / 2;
    select * into c from public.finish_lab_to_linear(p_l, p_chroma * mid * cos(p_h), p_chroma * mid * sin(p_h));
    if c.r between 0 and 1 and c.g between 0 and 1 and c.b between 0 and 1 then lo := mid; else hi := mid; end if;
  end loop;
  select * into c from public.finish_lab_to_linear(p_l, p_chroma * lo * cos(p_h), p_chroma * lo * sin(p_h));
  r := c.r; g := c.g; b := c.b;
end $$;

-- ---------------------------------------------------------------------
-- Plated derivation: 3c's model with the calibration step replaced.
-- ---------------------------------------------------------------------
drop function if exists public.finish_derive(public.finishes);
drop function if exists public.finish_plated_material(text, text, text, text, text);

create or replace function public.finish_plated_material(
  p_base_family text,
  p_surface     text,
  p_tone        text,
  p_effect      text,
  p_tint        text,
  out base_color_hex      text,
  out metalness           numeric,
  out roughness           numeric,
  out anisotropy          numeric,
  out clearcoat           numeric,
  out clearcoat_roughness numeric,
  out two_tone            boolean,
  out oxide_color_hex     text
)
language plpgsql stable
as $$
declare
  metal text := 'nickel';
  blend_to text;
  blend_t float8 := 0;
  variant text;
  f0 record;
  f1 record;
  cal record;
  lab record;
  lin record;
  r float8; g float8; b float8;
  y float8; sat float8; val float8;
  ox_l float8;
  off float8[];
  code text;
begin
  two_tone := coalesce(p_tone, '') in ('ANTI', 'ANCIENT', 'DEEP', 'DARK')
           or coalesce(p_base_family, '') in ('ANTI_BRASS', 'ANTI_COPPER', 'ANTI_SILVER', 'BLACK_COPPER');

  case p_base_family
    when 'NICKEL'          then metal := 'nickel';
    when 'GUN_METAL'       then metal := 'black_nickel';
    when 'GOLD'            then metal := 'gold';
    when 'LIGHT_GOLD'      then metal := 'gold'; blend_to := 'silver'; blend_t := 0.35;
    when 'ROSE_GOLD'       then metal := 'gold'; blend_to := 'copper'; blend_t := 0.5;
    when 'BRASS'           then metal := 'brass';
    when 'ANTI_BRASS'      then metal := 'brass';
    when 'RED_COPPER'      then metal := 'copper';
    when 'ANTI_COPPER'     then metal := 'copper';
    when 'BLACK_COPPER'    then metal := 'copper';
    when 'TIN'             then metal := 'tin';
    when 'ANTI_SILVER'     then metal := 'silver';
    when 'ALLOY'           then metal := 'zinc';
    when 'STAINLESS_STEEL' then metal := 'iron';
    when 'RUSTY_STEEL'     then metal := 'iron'; variant := 'anti';
    else metal := 'nickel';
  end case;

  select * into f0 from public.finish_metal_f0(metal);
  r := f0.r; g := f0.g; b := f0.b;

  if blend_to is not null then
    select * into f1 from public.finish_metal_f0(blend_to);
    r := r + (f1.r - r) * blend_t;
    g := g + (f1.g - g) * blend_t;
    b := b + (f1.b - b) * blend_t;
  end if;

  if variant = 'anti' then
    sat := 0.9; val := 0.18;
    y := 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r := (y + (r - y) * sat) * val;
    g := (y + (g - y) * sat) * val;
    b := (y + (b - y) * sat) * val;
  end if;

  if p_base_family = 'GUN_METAL' then
    r := r * 0.96; b := b * 1.08;
  end if;

  foreach code in array array[
    case when coalesce(p_tone, '') in ('ANTI', 'ANCIENT', 'DEEP', 'DARK') then '' else coalesce(p_tone, '') end,
    coalesce(p_tint, '')
  ] loop
    off := case code
      when 'IMT'       then array[0.95, 0.95, 0.92]
      when 'LIGHT'     then array[1.10, 1.10, 1.10]
      when 'MEDIUM'    then array[0.70, 0.70, 0.70]
      when 'JAPAN'     then array[0.92, 0.88, 0.80]
      when 'COFFEE'    then array[0.88, 0.72, 0.56]
      when 'CHOCOLATE' then array[0.78, 0.60, 0.46]
      when 'PINK'      then array[1.06, 0.86, 0.90]
      when 'ORANGE'    then array[1.10, 0.84, 0.60]
      when 'GUN_METAL' then array[0.72, 0.74, 0.78]
      else null
    end;
    if off is not null then
      r := r * off[1]; g := g * off[2]; b := b * off[3];
    end if;
  end loop;

  -- Family calibration (3d R1): value (TIN only), then hue rotation at constant L*.
  select c.value::float8 as v, c.hue_shift_deg::float8 as dh, c.chroma_scale::float8 as cs, c.oxide_l::float8 as ol
  into cal
  from public.finish_family_calibration c
  where c.base_family_code = p_base_family;
  if found then
    if cal.v <> 1 then
      r := r * cal.v; g := g * cal.v; b := b * cal.v;
    end if;
    if cal.dh <> 0 or cal.cs <> 1 then
      select * into lab from public.finish_linear_to_lab(r, g, b);
      select * into lin from public.finish_lab_in_gamut(lab.l, sqrt(lab.a * lab.a + lab.bb * lab.bb) * cal.cs,
        atan2(lab.bb, lab.a) + cal.dh * pi() / 180);
      r := lin.r; g := lin.g; b := lin.b;
    end if;
  end if;

  base_color_hex := public.finish_linear_to_srgb_hex(r, g, b);

  -- Oxide layer (3d R3): chart L*, floored at 15; chroma scales with L*.
  if not two_tone then
    oxide_color_hex := null;
  elsif cal is null or cal.ol is null then
    oxide_color_hex := public.finish_linear_to_srgb_hex(r * 0.25, g * 0.25, b * 0.25);
  else
    select * into lab from public.finish_linear_to_lab(r, g, b);
    ox_l := greatest(15, cal.ol);
    select * into lin from public.finish_lab_in_gamut(ox_l,
      case when lab.l > 0 then sqrt(lab.a * lab.a + lab.bb * lab.bb) * ox_l / lab.l else 0 end,
      atan2(lab.bb, lab.a));
    oxide_color_hex := public.finish_linear_to_srgb_hex(lin.r, lin.g, lin.b);
  end if;

  metalness := 1;

  case coalesce(p_surface, 'BRIGHT')
    when 'BRUSHED'        then roughness := 0.35; anisotropy := 0.80;
    when 'CIRCLE_BRUSHED' then roughness := 0.35; anisotropy := 0.80;
    when 'MATT'           then roughness := 0.55; anisotropy := 0;
    when 'SAND'           then roughness := 0.70; anisotropy := 0;
    else                       roughness := 0.06; anisotropy := 0;   -- BRIGHT
  end case;
  if two_tone and p_surface is null then roughness := 0.30; end if;
  if p_base_family = 'GUN_METAL' then roughness := greatest(roughness, 0.15); end if;

  if p_effect = 'ENAMEL_DIP' then
    clearcoat := 1.0; clearcoat_roughness := 0.10;
  else
    clearcoat := 0; clearcoat_roughness := 0;
  end if;
end $$;

create or replace function public.finish_derive(p public.finishes,
  out base_color_hex text, out metalness numeric, out roughness numeric, out anisotropy numeric,
  out clearcoat numeric, out clearcoat_roughness numeric, out two_tone boolean, out oxide_color_hex text)
language plpgsql stable
security definer set search_path = public
as $$
declare
  d record;
begin
  if p.coating_id is not null then
    select * into d from public.finish_painted_material(
      p.cyc_code, (select code from public.finish_coatings where id = p.coating_id), p.hex_approx);
    two_tone := false;
    oxide_color_hex := null;
  else
    select * into d from public.finish_plated_material(
      (select code from public.finish_base_families where id = p.base_family_id),
      (select code from public.finish_surfaces      where id = p.surface_id),
      (select code from public.finish_tones         where id = p.tone_id),
      (select code from public.finish_effects       where id = p.effect_id),
      (select code from public.finish_tints         where id = p.tint_id));
    two_tone := d.two_tone;
    oxide_color_hex := d.oxide_color_hex;
  end if;
  base_color_hex := d.base_color_hex;
  metalness := d.metalness;
  roughness := d.roughness;
  anisotropy := d.anisotropy;
  clearcoat := d.clearcoat;
  clearcoat_roughness := d.clearcoat_roughness;
end $$;

create or replace function public.finishes_derive_material()
returns trigger language plpgsql
security definer set search_path = public
as $$
declare
  axes_changed boolean := true;
  explicit_values boolean := false;
  d record;
begin
  if tg_op = 'UPDATE' then
    axes_changed :=
         new.process_id     is distinct from old.process_id
      or new.base_family_id is distinct from old.base_family_id
      or new.surface_id     is distinct from old.surface_id
      or new.tone_id        is distinct from old.tone_id
      or new.effect_id      is distinct from old.effect_id
      or new.tint_id        is distinct from old.tint_id
      or new.coating_id     is distinct from old.coating_id
      or new.pattern_id     is distinct from old.pattern_id;
    explicit_values :=
         new.metalness           is distinct from old.metalness
      or new.roughness           is distinct from old.roughness
      or new.anisotropy          is distinct from old.anisotropy
      or new.base_color_hex      is distinct from old.base_color_hex
      or new.clearcoat           is distinct from old.clearcoat
      or new.clearcoat_roughness is distinct from old.clearcoat_roughness
      or new.two_tone            is distinct from old.two_tone
      or new.oxide_color_hex     is distinct from old.oxide_color_hex;
    if explicit_values then return new; end if;
    if not axes_changed and new.metalness is not null and new.base_color_hex is not null then return new; end if;
  elsif new.metalness is not null and new.roughness is not null and new.anisotropy is not null
        and new.base_color_hex is not null then
    return new;
  end if;

  select * into d from public.finish_derive(new);
  new.base_color_hex := d.base_color_hex;
  new.metalness := d.metalness;
  new.roughness := d.roughness;
  new.anisotropy := d.anisotropy;
  new.clearcoat := d.clearcoat;
  new.clearcoat_roughness := d.clearcoat_roughness;
  new.two_tone := d.two_tone;
  new.oxide_color_hex := d.oxide_color_hex;
  return new;
end $$;

create or replace function public.finish_recompute_materials()
returns int
language plpgsql
security definer set search_path = public
as $$
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
  where x.id = f.id;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.finish_recompute_materials() from public, anon, authenticated;
grant execute on function public.finish_recompute_materials() to service_role;

-- Plated rows only (R6); painted rows are left exactly as 3c wrote them.
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
