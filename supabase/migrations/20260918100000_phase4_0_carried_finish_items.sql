-- Designer Studio Phase 4.0 — carried finish items.
-- Ref: reports/E1-plan-integration.md §5 (Phase 4 build units, row 4.0),
-- docs/3d-editor/STATUS.md (Phase 4.0). Physical-model changes only; the
-- calibration table (finish_family_calibration) is untouched.
--
--   R1  ROSE_GOLD's gold→copper blend moves from t = 0.5 (3b) to t = 0.7 —
--       3e open question 1: physical rose gold reads peach-gold at 0.5,
--       judged on the contact sheet against the pink-copper target.
--   R2  Two-tone rows' buffed layer darkens: L* = 0.7 × its physical L*
--       (the same L* the derivation would produce with no two-tone rows at
--       all), chroma scaled in the same proportion, hue kept. This is the
--       antique buffed metal reading darker than a bright plate of the same
--       family, not a calibration fit. The oxide layer's target L* (chart-
--       derived, floored at 15) is unaffected: its chroma/L* ratio to the
--       buffed layer is scale-invariant, so darkening the buffed input
--       leaves the oxide's own output L* exactly where it was.
--
-- src/features/finishes/metalReflectance.ts mirrors both changes;
-- render-calibration.mjs asserts DB/TS parity row for row and refreshes
-- reports/4-materials.png (the 3e twelve cells); family-calibration.mjs
-- asserts the buffed/oxide relationship above.

begin;

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
    when 'ROSE_GOLD'       then metal := 'gold'; blend_to := 'copper'; blend_t := 0.7;  -- 4.0 R1: was 0.5
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

  -- 4.0 R2: two-tone buffed layer darkens to 0.7 × its physical L*, chroma
  -- scaled in the same proportion, hue kept. Scale-invariant, so the oxide
  -- computation below (which derives its own target L* from these r,g,b)
  -- lands on the same oxide colour either way.
  if two_tone then
    select * into lab from public.finish_linear_to_lab(r, g, b);
    select * into lin from public.finish_lab_in_gamut(lab.l * 0.7, sqrt(lab.a * lab.a + lab.bb * lab.bb) * 0.7, atan2(lab.bb, lab.a));
    r := lin.r; g := lin.g; b := lin.b;
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

-- Plated rows only (R6 in 3c); painted rows are untouched.
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
