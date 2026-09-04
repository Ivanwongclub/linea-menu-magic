-- Finishes: three-parameter material model (metalness, roughness,
-- anisotropy) for the swatch renderer — and, later, M4/M5 and the 3D
-- editor's PBR presets, which read the same three columns.
--
-- Every hex_approx swatch today is a flat block, so Brushed Nickel and Matt
-- Nickel look identical. What distinguishes finishes is contrast behaviour,
-- not average brightness: a polished surface is a mirror (it measures
-- near-black, #41403E for nickel, because it reflects the room) with one
-- narrow hard highlight; matt is a near-flat field; brushed smears the
-- highlight into a directional band; sand is fine stochastic grain with no
-- specular point. Three numbers carry that:
--
--   metalness   0..1  how much of the reflection is the metal's own colour
--                     (1 = plating; ~0.1 = paint/enamel over the part)
--   roughness   0..1  how spread the highlight is (0.08 = mirror, 0.35 =
--                     brushed band, 0.70 = matt field, 0.95 = sand grain)
--   anisotropy  0..1  how directional the highlight is (0.85 = brushed)
--
-- Renderer contract (the module reads only these three plus hex_approx):
--   roughness <= 0.15                      → narrow hard specular, dark body
--   anisotropy >= 0.5                      → highlight stretched into a band
--   roughness >= 0.90 and metalness >= 0.5 → stochastic grain, no highlight
--   otherwise                              → broad soft highlight per roughness
--
-- The values are DERIVED from the axis values by finish_material_params()
-- — the rules live in that one function. A trigger keeps them current when
-- a finish's axes change, but respects an explicit hand-set value: an
-- UPDATE that sets metalness/roughness/anisotropy directly is stored as-is,
-- so staff can tune an odd finish without the derivation overwriting it.
-- Anything the rules don't name (a new axis value added in /admin) simply
-- inherits its process/surface baseline — nothing breaks, it just isn't
-- special-cased until a rule is added here.
--
-- Not applied automatically: migration for review.

begin;

alter table public.finishes
  add column if not exists metalness  numeric(3,2),
  add column if not exists roughness  numeric(3,2),
  add column if not exists anisotropy numeric(3,2);

-- ---------------------------------------------------------------------
-- The rules. Pure function of the eight axis codes (null = not set).
-- Applied in order; later steps refine earlier ones; clamped at the end.
-- ---------------------------------------------------------------------
create or replace function public.finish_material_params(
  p_process     text,
  p_base_family text,
  p_surface     text,
  p_tone        text,
  p_effect      text,
  p_tint        text,   -- colour only; no effect on the material model
  p_coating     text,
  p_pattern     text,
  out metalness  numeric,
  out roughness  numeric,
  out anisotropy numeric
)
language plpgsql immutable
as $$
declare
  m numeric;
  r numeric;
  a numeric := 0;
begin
  -- 1. Process: plating is metal; paint is a coloured layer over the part.
  if p_process = 'PAINT' then
    m := 0.10; r := 0.50;          -- painted baseline; the coating refines roughness
  else
    m := 1.00; r := 0.08;          -- HP / ROLL / ECO plating, polished by default
  end if;

  -- 2. Surface. No surface on the chart means bright.
  case coalesce(p_surface, 'BRIGHT')
    when 'BRIGHT'         then r := least(r, 0.08);
    when 'MATT'           then r := 0.70;
    when 'SAND'           then r := 0.95;
    when 'BRUSHED'        then r := 0.35; a := 0.85;
    when 'CIRCLE_BRUSHED' then r := 0.35; a := 0.85;   -- direction is the renderer's choice
    else null;
  end case;

  -- 3. Base family: the antiqued families are oxidised, so duller and less metallic.
  if p_base_family in ('ANTI_BRASS', 'ANTI_COPPER', 'BLACK_COPPER', 'ANTI_SILVER') then
    r := r + 0.25; m := m - 0.10;
  end if;
  if p_base_family = 'RUSTY_STEEL' then m := 0.30; r := 0.90; a := 0; end if;
  if p_base_family = 'TIN' then r := greatest(r, 0.30); end if;   -- tin never truly mirrors

  -- 4. Tone: antique / ancient tones oxidise the same way.
  if p_tone in ('ANTI', 'ANCIENT') then r := r + 0.25; m := m - 0.10; end if;

  -- 5. Effect.
  case p_effect
    when 'OXIDE'      then r := r + 0.20; m := m - 0.15;
    when 'DISTRESS'   then r := r + 0.20;
    when 'STONE_WASH' then r := r + 0.20;
    when 'SPECKLE'    then r := r + 0.15;
    when 'ENAMEL_DIP' then m := 0.15; r := 0.20; a := a * 0.4;   -- enamel over the metal
    when 'IRIDESCENT' then m := 0.80; r := 0.15;
    else null;   -- BLACK_COVER / TIN_COVER / NICKEL_COVER / CONTRAST: a plating layer, no change
  end case;

  -- 6. Coating: the coat is what the eye sees, so it sets the model; a coat
  --    over brushing mostly hides the brushing.
  case p_coating
    when 'GLOSS_ENAMEL' then m := 0.10; r := 0.15; a := a * 0.4;
    when 'MATT_ENAMEL'  then m := 0.10; r := 0.70; a := a * 0.4;
    when 'RUBBER'       then m := 0.05; r := 0.80; a := 0;
    when 'PEARL'        then m := 0.40; r := 0.30; a := a * 0.4;
    when 'EP'           then r := greatest(r * 0.8, 0.12); a := a * 0.7;   -- clear electrophoretic lacquer over metal
    when 'GLITTER'      then m := 0.60; r := 0.50; a := 0;
    when 'VELVET'       then m := 0.00; r := 0.95; a := 0;
    when 'EPOXY'        then m := 0.10; r := 0.10; a := a * 0.4;
    when 'CERAMIC'      then m := 0.10; r := 0.40; a := 0;
    when 'METALLIC'     then m := 0.70; r := 0.35; a := 0;               -- metallic paint
    else null;
  end case;

  -- 7. Pattern: texture on the surface; imitation leather is its own material.
  if p_pattern = 'IMT_LEATHER' then
    m := 0.10; r := 0.70; a := 0;
  elsif p_pattern is not null then
    r := r + 0.10;   -- SPRAY_DOT, RAINDROP, CRACKED, GRADIENT, SCREEN_PRINT, STONE_WASH
  end if;

  metalness  := round(least(1, greatest(0, m)), 2);
  roughness  := round(least(1, greatest(0, r)), 2);
  anisotropy := round(least(1, greatest(0, a)), 2);
end $$;

-- ---------------------------------------------------------------------
-- Keep the columns current when a finish's axes change; respect hand-set
-- values. security definer for the same reason as M1's gate triggers —
-- the axis lookups must see the real rows regardless of the caller's RLS.
-- ---------------------------------------------------------------------
create or replace function public.finishes_derive_material()
returns trigger language plpgsql
security definer set search_path = public
as $$
declare
  axes_changed boolean;
  explicit_values boolean;
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
         new.metalness  is distinct from old.metalness
      or new.roughness  is distinct from old.roughness
      or new.anisotropy is distinct from old.anisotropy;

    -- Hand-tuned in this statement: keep what was set.
    if explicit_values then return new; end if;
    -- Nothing relevant changed and values exist: nothing to do.
    if not axes_changed and new.metalness is not null then return new; end if;
  elsif new.metalness is not null and new.roughness is not null and new.anisotropy is not null then
    return new;   -- insert with explicit values
  end if;

  select p.metalness, p.roughness, p.anisotropy
  into new.metalness, new.roughness, new.anisotropy
  from public.finish_material_params(
    (select code from public.finish_processes     where id = new.process_id),
    (select code from public.finish_base_families where id = new.base_family_id),
    (select code from public.finish_surfaces      where id = new.surface_id),
    (select code from public.finish_tones         where id = new.tone_id),
    (select code from public.finish_effects       where id = new.effect_id),
    (select code from public.finish_tints         where id = new.tint_id),
    (select code from public.finish_coatings      where id = new.coating_id),
    (select code from public.finish_patterns      where id = new.pattern_id)
  ) p;
  return new;
end $$;

drop trigger if exists trg_finishes_derive_material on public.finishes;
create trigger trg_finishes_derive_material
  before insert or update on public.finishes
  for each row execute function public.finishes_derive_material();

-- ---------------------------------------------------------------------
-- Backfill all existing rows from their axes.
-- ---------------------------------------------------------------------
update public.finishes f
set metalness = p.metalness, roughness = p.roughness, anisotropy = p.anisotropy
from public.finishes x
  left join public.finish_processes     pr on pr.id = x.process_id
  left join public.finish_base_families bf on bf.id = x.base_family_id
  left join public.finish_surfaces      su on su.id = x.surface_id
  left join public.finish_tones         tn on tn.id = x.tone_id
  left join public.finish_effects       ef on ef.id = x.effect_id
  left join public.finish_tints         ti on ti.id = x.tint_id
  left join public.finish_coatings      co on co.id = x.coating_id
  left join public.finish_patterns      pa on pa.id = x.pattern_id
  cross join lateral public.finish_material_params(
    pr.code, bf.code, su.code, tn.code, ef.code, ti.code, co.code, pa.code) p
where x.id = f.id;

alter table public.finishes
  alter column metalness  set not null,
  alter column roughness  set not null,
  alter column anisotropy set not null,
  add constraint finishes_metalness_range  check (metalness  between 0 and 1),
  add constraint finishes_roughness_range  check (roughness  between 0 and 1),
  add constraint finishes_anisotropy_range check (anisotropy between 0 and 1);

commit;

-- To eyeball the four canonical nickels after applying:
--   select cyc_code, factory_name_en, hex_approx, metalness, roughness, anisotropy
--   from public.finishes where cyc_code in ('CYC-0001','CYC-0002','CYC-0003','CYC-0028')
--   order by cyc_code;
-- And the spread across the chart:
--   select roughness, anisotropy, count(*) from public.finishes group by 1,2 order by 1,2;
