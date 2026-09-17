-- Designer Studio Phase 3b — plated finishes from measured metal reflectance.
-- Ref: docs/3d-editor/STATUS.md (Phase 3b), R3/R4.
--
-- The derivation stays in the database so the CMS swatch and the 3D editor
-- read the same numbers. Plated finishes (coating_id is null) now take:
--   base colour  measured linear-RGB F0 of the real metal (Real-Time
--                Rendering 4th ed., Table 9.2, after Hoffman, SIGGRAPH 2015),
--                blended / darkened per base family, tone and tint applied as
--                fixed multipliers, converted to an sRGB hex
--   roughness /  from the surface axis alone
--   anisotropy
--   clearcoat    1.0 / 0.1 for enamel-dip
-- Painted finishes (coating_id not null) are untouched: they keep
-- finish_material_params() (20260904150000) and their hex_approx, which is
-- copied into base_color_hex so readers need only one column. Painted
-- calibration is Phase 3c.
--
-- src/features/finishes/metalReflectance.ts mirrors these tables;
-- scripts/e2e-local/scenarios/render-calibration.mjs asserts they agree.
-- hex_approx is not rewritten for plated rows — it stays the CMS's editable
-- fallback / filter colour.

begin;

alter table public.finishes
  add column if not exists base_color_hex text,
  add column if not exists clearcoat numeric(3,2) not null default 0,
  add column if not exists clearcoat_roughness numeric(3,2) not null default 0;

alter table public.finishes
  add constraint finishes_clearcoat_range check (clearcoat between 0 and 1),
  add constraint finishes_clearcoat_roughness_range check (clearcoat_roughness between 0 and 1),
  add constraint finishes_base_color_hex_format check (base_color_hex is null or base_color_hex ~ '^#[0-9A-Fa-f]{6}$');

comment on column public.finishes.base_color_hex is
  'sRGB hex base colour for rendering. Plated: derived from measured metal F0 '
  '(finish_plated_material). Painted: copied from hex_approx.';

-- ---------------------------------------------------------------------
-- Measured F0, linear RGB. Tin is a placeholder (platinum's F0) — it is not
-- in RTR4 Table 9.2.
-- ---------------------------------------------------------------------
create or replace function public.finish_metal_f0(p_metal text, out r float8, out g float8, out b float8)
language plpgsql immutable
as $$
begin
  case p_metal
    when 'gold'      then r := 1.000; g := 0.782; b := 0.344;
    when 'silver'    then r := 0.972; g := 0.960; b := 0.915;
    when 'copper'    then r := 0.955; g := 0.638; b := 0.538;
    when 'nickel'    then r := 0.660; g := 0.609; b := 0.526;
    when 'brass'     then r := 0.910; g := 0.778; b := 0.423;
    when 'iron'      then r := 0.562; g := 0.565; b := 0.578;
    when 'tin'       then r := 0.673; g := 0.637; b := 0.585;
    when 'zinc'      then r := 0.664; g := 0.824; b := 0.850;
    when 'aluminium' then r := 0.913; g := 0.922; b := 0.924;
    else raise exception 'unknown metal %', p_metal;
  end case;
end $$;

create or replace function public.finish_linear_to_srgb_hex(p_r float8, p_g float8, p_b float8)
returns text
language plpgsql immutable
as $$
declare
  ch float8;
  s float8;
  out_hex text := '#';
begin
  foreach ch in array array[p_r, p_g, p_b] loop
    ch := least(1, greatest(0, ch));
    if ch <= 0.0031308 then s := 12.92 * ch; else s := 1.055::float8 * power(ch, 1.0::float8 / 2.4::float8) - 0.055::float8; end if;
    out_hex := out_hex || lpad(upper(to_hex(round((s * 255)::numeric)::int)), 2, '0');
  end loop;
  return out_hex;
end $$;

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
  out clearcoat_roughness numeric
)
language plpgsql immutable
as $$
declare
  metal text := 'nickel';
  blend_to text;
  blend_t float8 := 0;
  variant text;
  f0 record;
  f1 record;
  r float8; g float8; b float8;
  y float8; sat float8; val float8;
  off float8[];
  code text;
begin
  -- Base family → metal, optional blend, optional darkened variant
  -- (anti: saturation 0.9 × value 0.18; black: saturation 0 × value 0.13 —
  -- set against chart photos of CYC-0057 and CYC-0004; provisional until 3c).
  case p_base_family
    when 'NICKEL'          then metal := 'nickel';
    when 'GUN_METAL'       then metal := 'nickel'; variant := 'black';
    when 'GOLD'            then metal := 'gold';
    when 'LIGHT_GOLD'      then metal := 'gold'; blend_to := 'silver'; blend_t := 0.35;
    when 'ROSE_GOLD'       then metal := 'gold'; blend_to := 'copper'; blend_t := 0.5;
    when 'BRASS'           then metal := 'brass';
    when 'ANTI_BRASS'      then metal := 'brass'; variant := 'anti';
    when 'RED_COPPER'      then metal := 'copper';
    when 'ANTI_COPPER'     then metal := 'copper'; variant := 'anti';
    when 'BLACK_COPPER'    then metal := 'copper'; variant := 'black';
    when 'TIN'             then metal := 'tin';
    when 'ANTI_SILVER'     then metal := 'silver'; variant := 'anti';
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

  if variant is not null then
    if variant = 'anti' then sat := 0.9; val := 0.18; else sat := 0; val := 0.13; end if;
    y := 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r := (y + (r - y) * sat) * val;
    g := (y + (g - y) * sat) * val;
    b := (y + (b - y) * sat) * val;
  end if;

  -- Tone, then tint: fixed per-channel multipliers.
  foreach code in array array[coalesce(p_tone, ''), coalesce(p_tint, '')] loop
    off := case code
      when 'IMT'       then array[0.95, 0.95, 0.92]
      when 'DARK'      then array[0.40, 0.40, 0.40]
      when 'LIGHT'     then array[1.10, 1.10, 1.10]
      when 'MEDIUM'    then array[0.70, 0.70, 0.70]
      when 'DEEP'      then array[0.55, 0.55, 0.55]
      when 'ANTI'      then array[0.20, 0.19, 0.17]
      when 'ANCIENT'   then array[0.17, 0.15, 0.12]
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

  base_color_hex := public.finish_linear_to_srgb_hex(r, g, b);
  metalness := 1;

  case coalesce(p_surface, 'BRIGHT')
    when 'BRUSHED'        then roughness := 0.35; anisotropy := 0.80;
    when 'CIRCLE_BRUSHED' then roughness := 0.35; anisotropy := 0.80;
    when 'MATT'           then roughness := 0.55; anisotropy := 0;
    when 'SAND'           then roughness := 0.70; anisotropy := 0;
    else                       roughness := 0.06; anisotropy := 0;   -- BRIGHT
  end case;

  if p_effect = 'ENAMEL_DIP' then
    clearcoat := 1.0; clearcoat_roughness := 0.10;
  else
    clearcoat := 0; clearcoat_roughness := 0;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Trigger: plated rows derive from finish_plated_material(); painted rows
-- keep finish_material_params() and mirror hex_approx into base_color_hex.
-- Hand-set values in the same statement are still respected.
-- ---------------------------------------------------------------------
create or replace function public.finishes_derive_material()
returns trigger language plpgsql
security definer set search_path = public
as $$
declare
  axes_changed boolean := true;
  explicit_values boolean := false;
  painted boolean := new.coating_id is not null;
  p record;
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
      or new.clearcoat_roughness is distinct from old.clearcoat_roughness;

    -- A painted row's colour follows its hex_approx unless set explicitly.
    if painted and new.hex_approx is distinct from old.hex_approx
       and new.base_color_hex is not distinct from old.base_color_hex then
      new.base_color_hex := new.hex_approx;
    end if;

    if explicit_values then return new; end if;
    if not axes_changed and new.metalness is not null and (painted or new.base_color_hex is not null) then
      return new;
    end if;
  elsif new.metalness is not null and new.roughness is not null and new.anisotropy is not null
        and new.base_color_hex is not null then
    return new;   -- insert with explicit values
  end if;

  if painted then
    select m.metalness, m.roughness, m.anisotropy into p
    from public.finish_material_params(
      (select code from public.finish_processes     where id = new.process_id),
      (select code from public.finish_base_families where id = new.base_family_id),
      (select code from public.finish_surfaces      where id = new.surface_id),
      (select code from public.finish_tones         where id = new.tone_id),
      (select code from public.finish_effects       where id = new.effect_id),
      (select code from public.finish_tints         where id = new.tint_id),
      (select code from public.finish_coatings      where id = new.coating_id),
      (select code from public.finish_patterns      where id = new.pattern_id)
    ) m;
    new.metalness := p.metalness;
    new.roughness := p.roughness;
    new.anisotropy := p.anisotropy;
    new.base_color_hex := new.hex_approx;
    new.clearcoat := 0;
    new.clearcoat_roughness := 0;
  else
    select * into p
    from public.finish_plated_material(
      (select code from public.finish_base_families where id = new.base_family_id),
      (select code from public.finish_surfaces      where id = new.surface_id),
      (select code from public.finish_tones         where id = new.tone_id),
      (select code from public.finish_effects       where id = new.effect_id),
      (select code from public.finish_tints         where id = new.tint_id)
    );
    new.base_color_hex := p.base_color_hex;
    new.metalness := p.metalness;
    new.roughness := p.roughness;
    new.anisotropy := p.anisotropy;
    new.clearcoat := p.clearcoat;
    new.clearcoat_roughness := p.clearcoat_roughness;
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Recompute every plated row; painted rows only gain base_color_hex.
-- (Writing the columns explicitly takes the trigger's hand-set path, so
-- these values are stored as computed here.)
-- ---------------------------------------------------------------------
update public.finishes f
set base_color_hex      = p.base_color_hex,
    metalness           = p.metalness,
    roughness           = p.roughness,
    anisotropy          = p.anisotropy,
    clearcoat           = p.clearcoat,
    clearcoat_roughness = p.clearcoat_roughness
from public.finishes x
  left join public.finish_base_families bf on bf.id = x.base_family_id
  left join public.finish_surfaces      su on su.id = x.surface_id
  left join public.finish_tones         tn on tn.id = x.tone_id
  left join public.finish_effects       ef on ef.id = x.effect_id
  left join public.finish_tints         ti on ti.id = x.tint_id
  cross join lateral public.finish_plated_material(bf.code, su.code, tn.code, ef.code, ti.code) p
where x.id = f.id
  and x.coating_id is null;

update public.finishes
set base_color_hex = hex_approx
where coating_id is not null;

commit;
