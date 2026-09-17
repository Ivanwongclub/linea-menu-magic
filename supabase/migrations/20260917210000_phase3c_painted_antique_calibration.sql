-- Designer Studio Phase 3c — painted finishes from chart measurements,
-- antique two-tone, gun metal from a black-nickel reference, and per-family
-- calibration of plated finishes against the chart.
-- Ref: docs/3d-editor/STATUS.md (Phase 3c), R2–R5.
--
--   finish_swatch_measurements  docs/3d-editor/wincyc-swatch-measurements.csv,
--                               verbatim (135 rows). Painted base colours come
--                               from here; plated calibration targets too.
--   finish_family_calibration   per base family: saturation, value and a
--                               per-channel offset applied after the F0 /
--                               tone / tint model, fitted so a flat disc under
--                               the editor's procedural studio matches the
--                               family's median no-glare chart swatch (R4).
--                               Residuals are stored with the fit.
--   finishes.two_tone           antique finishes (R2): the editor mixes buffed
--                               metal and oxide (base × 0.25, roughness 0.55)
--                               by baked ambient occlusion.
--
-- src/features/finishes/metalReflectance.ts mirrors the plated derivation;
-- render-calibration.mjs asserts parity and the residuals.

begin;

-- ---------------------------------------------------------------------
-- Measurements
-- ---------------------------------------------------------------------
create table public.finish_swatch_measurements (
  cyc_code   text primary key,
  chart_page text not null,
  name_en    text not null,
  hex_srgb   text not null check (hex_srgb ~ '^#[0-9A-Fa-f]{6}$'),
  lum_p10    numeric not null,
  lum_p90    numeric not null,
  glare_flag boolean not null,
  notes      text
);

insert into public.finish_swatch_measurements (cyc_code, chart_page, name_en, hex_srgb, lum_p10, lum_p90, glare_flag, notes) values
  ('CYC-0001', 'P.01', 'HP NICKEL', '#1E2125', 25.2, 50.5, false, null),
  ('CYC-0002', 'P.01', 'HP BRUSHED NICKEL', '#E8D5BA', 153.2, 238.5, true, '31% of sampled px near clipping; wide luminance spread (85)'),
  ('CYC-0003', 'P.01', 'HP MATT NICKEL', '#6A696D', 75.1, 177.0, true, 'wide luminance spread (102)'),
  ('CYC-0004', 'P.01', 'HP GUN METAL', '#0D1324', 14.8, 21.8, false, null),
  ('CYC-0005', 'P.01', 'HP BRUSHED GUN METAL', '#3B3B3B', 27.8, 151.2, true, 'wide luminance spread (123)'),
  ('CYC-0006', 'P.01', 'HP MATT GUN METAL', '#30302C', 25.8, 106.9, true, 'wide luminance spread (81)'),
  ('CYC-0007', 'P.01', 'HP IMT ROSE GOLD', '#161617', 18.9, 26.3, false, null),
  ('CYC-0008', 'P.01', 'HP IMT BRUSHED ROSE GOLD', '#5A3C35', 47.2, 171.2, true, '3% of sampled px near clipping; wide luminance spread (124)'),
  ('CYC-0009', 'P.01', 'HP IMT MATT ROSE GOLD', '#C49E87', 92.1, 213.7, true, '26% of sampled px near clipping; wide luminance spread (122)'),
  ('CYC-0010', 'P.01', 'HP BRASS', '#212628', 32.0, 43.5, false, null),
  ('CYC-0011', 'P.01', 'HP BRUSHED BRASS', '#24251C', 32.0, 41.0, false, null),
  ('CYC-0012', 'P.01', 'HP MATT BRASS', '#3E3E34', 56.1, 74.6, false, null),
  ('CYC-0013', 'P.01', 'HP GOLD', '#171817', 19.7, 33.2, false, null),
  ('CYC-0014', 'P.01', 'HP BRUSHED GOLD', '#D6AF83', 66.4, 229.8, true, '34% of sampled px near clipping; wide luminance spread (163)'),
  ('CYC-0015', 'P.01', 'HP MATT GOLD', '#636E71', 75.1, 145.0, false, null),
  ('CYC-0016', 'P.01', 'HP LIGHT GOLD', '#111215', 14.8, 20.8, false, null),
  ('CYC-0017', 'P.01', 'HP BRUSHED LIGHT GOLD', '#473F38', 42.6, 197.2, true, '3% of sampled px near clipping; wide luminance spread (155)'),
  ('CYC-0018', 'P.01', 'HP MATT LIGHT GOLD', '#2D2928', 34.8, 51.4, false, null),
  ('CYC-0019', 'P.01', 'HP ROSE GOLD', '#221918', 13.3, 58.2, false, null),
  ('CYC-0020', 'P.01', 'HP BRUSHED ROSE GOLD', '#C08679', 112.5, 196.2, true, '15% of sampled px near clipping; wide luminance spread (84)'),
  ('CYC-0021', 'P.01', 'HP MATT ROSE GOLD', '#4C3F44', 44.6, 113.7, false, null),
  ('CYC-0022', 'P.01', 'HP IMT LIGHT GOLD', '#151615', 18.7, 26.7, false, null),
  ('CYC-0023', 'P.01', 'HP IMT BRUSHED LIGHT GOLD', '#4D5356', 69.4, 114.0, false, null),
  ('CYC-0024', 'P.01', 'HP IMT MATT LIGHT GOLD', '#3E3C36', 54.6, 65.2, false, null),
  ('CYC-0025', 'P.01', 'HP IMT GOLD', '#453120', 32.7, 108.2, true, 'wide luminance spread (75)'),
  ('CYC-0026', 'P.01', 'HP IMT BRUSHED GOLD', '#2F2314', 29.7, 44.2, false, null),
  ('CYC-0027', 'P.01', 'HP IMT BRUSHED GOLD MACL', '#47321A', 47.3, 58.8, false, null),
  ('CYC-0028', 'P.01', 'HP SAND NICKEL', '#2E2F30', 33.8, 58.5, false, null),
  ('CYC-0029', 'P.01', 'HP SAND GUN METAL', '#0F1114', 11.2, 21.0, false, null),
  ('CYC-0030', 'P.01', 'HP IMT LIGHT SAND GOLD', '#424444', 57.5, 82.0, false, null),
  ('CYC-0031', 'P.01', 'HP CIRCLE BRUSHED ANTI COPPER', '#23130F', 14.7, 47.6, false, null),
  ('CYC-0032', 'P.01', 'HP CIRCLE BRUSHED ANTI BRASS', '#1F1A14', 17.5, 53.8, false, null),
  ('CYC-0033', 'P.01', 'HP ANCIENT NICKEL', '#2D2F30', 26.8, 102.5, true, '3% of sampled px near clipping; wide luminance spread (76)'),
  ('CYC-0034', 'P.01', 'HP ANCIENT GUN METAL', '#05090C', 3.1, 21.8, false, null),
  ('CYC-0035', 'P.01', 'HP ANCIENT GOLD', '#232115', 19.0, 70.7, false, null),
  ('CYC-0036', 'P.02', 'NICKEL', '#3C3E41', 35.9, 217.0, true, '6% of sampled px near clipping; wide luminance spread (181)'),
  ('CYC-0037', 'P.02', 'BRUSHED NICKEL', '#64696D', 52.4, 242.2, true, '12% of sampled px near clipping; wide luminance spread (190)'),
  ('CYC-0038', 'P.02', 'MATT NICKEL', '#8F9092', 81.9, 225.6, true, '6% of sampled px near clipping; wide luminance spread (144)'),
  ('CYC-0039', 'P.02', 'DARK NICKEL', '#12161E', 13.3, 63.0, true, '3% of sampled px near clipping'),
  ('CYC-0040', 'P.02', 'MATT DARK NICKEL', '#1E222C', 23.7, 56.6, false, null),
  ('CYC-0041', 'P.02', 'BRUSHED DARK NICKEL', '#595958', 17.0, 225.6, true, '8% of sampled px near clipping; wide luminance spread (209)'),
  ('CYC-0042', 'P.02', 'ANTI NICKEL', '#313230', 18.9, 138.2, true, '4% of sampled px near clipping; wide luminance spread (119)'),
  ('CYC-0043', 'P.02', 'MATT LIGHT ANTI NICKEL', '#403F3C', 29.6, 134.6, true, '2% of sampled px near clipping; wide luminance spread (105)'),
  ('CYC-0044', 'P.02', 'BLACK COPPER', '#17191C', 15.0, 55.7, false, null),
  ('CYC-0045', 'P.02', 'IMT BLACK COPPER', '#070C14', 7.8, 16.3, false, null),
  ('CYC-0046', 'P.02', 'TIN', '#5A5C5E', 63.4, 133.0, false, null),
  ('CYC-0047', 'P.02', 'BLACK TIN', '#757573', 14.7, 197.9, true, '4% of sampled px near clipping; wide luminance spread (183)'),
  ('CYC-0048', 'P.02', 'OLD TIN', '#2A2C2C', 31.6, 71.5, false, null),
  ('CYC-0049', 'P.02', 'CONTRAST TIN', '#121315', 12.9, 80.7, false, null),
  ('CYC-0050', 'P.02', 'BLACK COVER NICKEL', '#13151B', 17.0, 59.2, false, null),
  ('CYC-0051', 'P.02', 'BRASS', '#2A2D30', 34.6, 87.5, false, null),
  ('CYC-0052', 'P.02', 'BRUSHED BRASS', '#4B5359', 62.0, 135.3, true, 'wide luminance spread (73)'),
  ('CYC-0053', 'P.02', 'MATT BRASS', '#333537', 14.1, 68.4, false, null),
  ('CYC-0054', 'P.02', 'OXIDE BRASS', '#17181B', 12.5, 33.8, false, null),
  ('CYC-0055', 'P.02', 'BLACK COVER BRASS', '#312B2D', 33.6, 85.4, false, null),
  ('CYC-0056', 'P.02', 'DARK ANTI BRASS', '#0F1011', 10.8, 21.7, false, null),
  ('CYC-0057', 'P.02', 'ANTI BRASS', '#25211B', 17.4, 42.5, false, null),
  ('CYC-0058', 'P.02', 'JAPAN ANTI BRASS', '#27231D', 18.3, 42.5, false, null),
  ('CYC-0059', 'P.02', 'BRUSHED ANTI BRASS', '#2D2E29', 17.2, 61.4, false, null),
  ('CYC-0060', 'P.02', 'OLD ANTI BRASS', '#312E28', 29.2, 53.5, false, null),
  ('CYC-0061', 'P.02', 'DISTRESS ANTI BRASS', '#0B0B0A', 5.8, 16.9, false, null),
  ('CYC-0062', 'P.02', 'GM ANTI BRASS', '#161715', 11.9, 29.7, false, null),
  ('CYC-0063', 'P.02', 'COFFEE ANTI BRASS', '#272828', 31.6, 47.5, false, null),
  ('CYC-0064', 'P.02', 'NICKEL BRASS', '#424443', 59.0, 107.1, false, null),
  ('CYC-0065', 'P.02', 'TIN BRASS', '#3A3D3D', 54.5, 103.2, false, null),
  ('CYC-0066', 'P.02', 'STONE WASH GOLD', '#1F201F', 4.8, 40.6, false, null),
  ('CYC-0067', 'P.02', 'CHOLCOLATE ANTI BRASS', '#23211D', 22.6, 44.3, false, null),
  ('CYC-0068', 'P.02', 'RED BRASS', '#493E3A', 57.3, 92.4, false, null),
  ('CYC-0069', 'P.02', 'GM ANTI COPPER', '#2D2F33', 33.9, 54.3, false, null),
  ('CYC-0070', 'P.02', 'ENAMEL ANTI BRASS', '#A8B5CB', 115.1, 200.9, true, 'wide luminance spread (86)'),
  ('CYC-0071', 'P.03', 'RED COPPER', '#ECAA74', 44.3, 214.1, true, '42% of sampled px near clipping; wide luminance spread (170)'),
  ('CYC-0072', 'P.03', 'MATT RED COPPER', '#DB9974', 82.6, 207.2, true, '29% of sampled px near clipping; wide luminance spread (125)'),
  ('CYC-0073', 'P.03', 'OXIDE RED COPPER', '#3D2D27', 28.9, 123.4, true, '3% of sampled px near clipping; wide luminance spread (95)'),
  ('CYC-0074', 'P.03', 'BLACK RED COPPER', '#1C191C', 12.7, 89.1, true, '3% of sampled px near clipping; wide luminance spread (76)'),
  ('CYC-0075', 'P.03', 'ORANGE RED COPPER', '#352320', 27.8, 72.6, false, null),
  ('CYC-0076', 'P.03', 'ANTI COPPER', '#2F231D', 6.8, 85.8, true, 'wide luminance spread (79)'),
  ('CYC-0077', 'P.03', 'JAPAN ANTI COPPER', '#3E3129', 18.7, 130.2, true, '4% of sampled px near clipping; wide luminance spread (111)'),
  ('CYC-0078', 'P.03', 'PINK ANTI COPPER', '#39211A', 10.5, 95.3, true, '3% of sampled px near clipping; wide luminance spread (85)'),
  ('CYC-0079', 'P.03', 'CHOLCOLATE ANTI COPPER', '#17181A', 8.5, 46.5, false, null),
  ('CYC-0080', 'P.03', 'BRUSHED ANTI COPPER', '#4A3D3C', 6.6, 132.3, true, '6% of sampled px near clipping; wide luminance spread (126)'),
  ('CYC-0081', 'P.03', 'STONE WASH RED', '#15110E', 8.7, 45.1, false, null),
  ('CYC-0082', 'P.03', 'DISTRESS ANTI COPPER', '#3F2B22', 10.8, 81.8, true, 'wide luminance spread (71)'),
  ('CYC-0083', 'P.03', 'OLD ANTI COPPER TIN', '#332019', 21.3, 130.7, true, 'wide luminance spread (109)'),
  ('CYC-0084', 'P.03', 'COPPER TIN', '#4A352F', 39.6, 118.7, true, 'wide luminance spread (79)'),
  ('CYC-0085', 'P.03', 'TIN RED COPPER', '#646B72', 49.8, 135.2, true, 'wide luminance spread (85)'),
  ('CYC-0086', 'P.03', 'STAINLESS STEEL', '#373537', 43.9, 110.4, true, '4% of sampled px near clipping'),
  ('CYC-0087', 'P.03', 'LIGHT ALLOY', '#616669', 80.1, 189.5, true, '3% of sampled px near clipping; wide luminance spread (109)'),
  ('CYC-0088', 'P.03', 'MEDIUM ALLOY', '#25272A', 4.4, 56.7, false, null),
  ('CYC-0089', 'P.03', 'DEEP ALLOY', '#13161B', 5.7, 33.9, false, null),
  ('CYC-0090', 'P.03', 'ENAMEL ANTI COPPER', '#2B2629', 24.8, 165.0, true, 'wide luminance spread (140)'),
  ('CYC-0091', 'P.03', 'ANTI SILVER', '#39393C', 5.1, 73.7, false, null),
  ('CYC-0092', 'P.03', 'IMT ANTI SILVER', '#2A2B2A', 10.5, 50.3, false, null),
  ('CYC-0093', 'P.03', 'ANTI GOLD', '#232019', 22.0, 49.7, false, null),
  ('CYC-0094', 'P.03', 'ANCIENT GOLD', '#1F1E1A', 22.7, 47.0, false, null),
  ('CYC-0095', 'P.03', 'GOLDED BRASS', '#27241A', 20.1, 93.7, true, 'wide luminance spread (74)'),
  ('CYC-0096', 'P.03', 'GOLD', '#574F41', 36.0, 103.6, false, null),
  ('CYC-0097', 'P.03', 'LIGHT GOLD', '#454B4D', 43.3, 97.5, false, null),
  ('CYC-0098', 'P.03', 'ROSE GOLD', '#393637', 26.7, 84.7, true, '2% of sampled px near clipping'),
  ('CYC-0099', 'P.03', 'BRUSHED GOLD', '#47443B', 47.4, 136.2, true, 'wide luminance spread (89)'),
  ('CYC-0100', 'P.03', 'MATT GOLD', '#424239', 47.9, 97.3, false, null),
  ('CYC-0101', 'P.03', 'IMT GOLD', '#6B5F41', 64.8, 126.7, true, '3% of sampled px near clipping'),
  ('CYC-0102', 'P.03', 'IMT LIGHT GOLD', '#484949', 42.7, 97.8, false, null),
  ('CYC-0103', 'P.03', 'IMT ROSE GOLD', '#4B4949', 40.9, 95.6, false, null),
  ('CYC-0104', 'P.03', 'BRUSHED ROSE GOLD', '#4A423E', 35.3, 155.0, true, '3% of sampled px near clipping; wide luminance spread (120)'),
  ('CYC-0105', 'P.03', 'RUSTY STEEL', '#0F1113', 9.9, 24.7, false, null),
  ('CYC-0106', 'P.04', 'WHITE ENAMEL', '#C1BFC6', 183.0, 200.2, false, null),
  ('CYC-0107', 'P.04', 'MATT WHITE ENAMEL', '#CBCCD4', 194.4, 212.1, false, null),
  ('CYC-0108', 'P.04', 'RUBBER WHITE', '#C8CCD3', 193.4, 210.7, false, null),
  ('CYC-0109', 'P.04', 'PEARL WHITE', '#BEC6DB', 188.4, 204.6, false, null),
  ('CYC-0110', 'P.04', 'SPRAY DOT ENAMEL', '#CCD9EF', 91.2, 228.6, true, 'position predicted from grid fit, not detected; 6% of sampled px near clipping; wide luminance spread (137)'),
  ('CYC-0111', 'P.04', 'BLACK ENAMEL', '#040403', 2.8, 6.0, false, null),
  ('CYC-0112', 'P.04', 'MATT BLACK ENAMEL', '#121212', 14.9, 20.9, false, null),
  ('CYC-0113', 'P.04', 'RUBBER BLACK', '#0D0E0F', 10.9, 16.8, false, null),
  ('CYC-0114', 'P.04', 'PEARL BLACK', '#04080B', 4.4, 11.3, false, null),
  ('CYC-0115', 'P.04', 'GRADIENT ENAMEL', '#282E35', 37.7, 53.0, false, null),
  ('CYC-0116', 'P.04', 'EP BLACK', '#060604', 3.8, 7.8, false, null),
  ('CYC-0117', 'P.04', 'MATT EP BLACK', '#0B0C0B', 7.9, 15.9, false, null),
  ('CYC-0118', 'P.04', 'SCREEN PRINT ENAMEL', '#131416', 3.9, 151.1, true, 'wide luminance spread (147)'),
  ('CYC-0119', 'P.04', 'RAINDROP ENAMEL', '#11151B', 18.0, 23.6, false, null),
  ('CYC-0120', 'P.04', 'CRACKED ENAMEL', '#192129', 8.1, 214.4, true, '5% of sampled px near clipping; wide luminance spread (206)'),
  ('CYC-0121', 'P.04', 'METALLIC SILVER', '#544948', 66.5, 89.3, false, null),
  ('CYC-0122', 'P.04', 'VELVET ENAMEL', '#0C0C0C', 8.9, 14.7, false, null),
  ('CYC-0123', 'P.04', 'METALLIC RED', '#170507', 3.7, 69.6, false, null),
  ('CYC-0124', 'P.04', 'FLUORESCENCE GREEN', '#BFDA52', 152.8, 225.9, true, '5% of sampled px near clipping; wide luminance spread (73)'),
  ('CYC-0125', 'P.04', 'IMT LEATHER ENAMEL', '#22272D', 9.9, 62.0, false, null),
  ('CYC-0126', 'P.04', 'WHITE GLITTER', '#302B25', 20.7, 81.6, false, null),
  ('CYC-0127', 'P.04', 'GOLD GLITTER', '#34291D', 18.7, 117.0, true, '4% of sampled px near clipping; wide luminance spread (98)'),
  ('CYC-0128', 'P.04', 'STONE WASH ENAMEL', '#A9ADB6', 127.0, 203.2, true, 'wide luminance spread (76)'),
  ('CYC-0129', 'P.04', 'TEA GOLD ENAMEL', '#3C3D35', 10.9, 186.4, true, 'wide luminance spread (176)'),
  ('CYC-0130', 'P.04', 'ANTI GOLD ENAMEL', '#333327', 9.1, 103.4, true, 'wide luminance spread (94)'),
  ('CYC-0131', 'P.04', 'BLUE CERAMIC', '#001D60', 19.4, 47.4, false, null),
  ('CYC-0132', 'P.04', 'ENAMEL EPOXY', '#1C1E1E', 5.5, 67.1, false, null),
  ('CYC-0133', 'P.04', 'ECO OXIDE LT ORG RED COPPER', '#30281F', 25.7, 57.4, false, null),
  ('CYC-0134', 'P.04', 'ECO BLACK COVER BRASS', '#090D0D', 3.9, 58.1, false, null),
  ('CYC-0135', 'P.04', 'ECO SPECKLE BLACK COPPER', '#0D1B25', 11.9, 35.5, false, null);

-- ---------------------------------------------------------------------
-- Per-family calibration (values from the Phase 3c fit)
-- ---------------------------------------------------------------------
create table public.finish_family_calibration (
  base_family_code text primary key,
  saturation       numeric not null default 1,
  value            numeric not null default 1,
  offset_r         numeric not null default 1,
  offset_g         numeric not null default 1,
  offset_b         numeric not null default 1,
  rows_used        int not null default 0,
  residual_de2000  numeric,
  note             text
);

insert into public.finish_family_calibration (base_family_code, saturation, value, offset_r, offset_g, offset_b, rows_used, residual_de2000, note) values
  ('LIGHT_GOLD', 0.4, 0.1242, 1, 1, 1, 7, 5.81, null),
  ('ALLOY', 0.9, 0.0609, 1, 1, 1, 2, 5.65, null),
  ('GOLD', 0.5, 0.0235, 1, 1, 1, 10, 5.52, null),
  ('TIN', 1, 0.1432, 1, 1, 1, 3, 4.54, null),
  ('GUN_METAL', 1, 0.2786, 1, 1, 1, 3, 0.25, null),
  ('NICKEL', 0.2, 0.1077, 1, 1, 1, 4, 4.67, null),
  ('ROSE_GOLD', 0.3, 0.1077, 1, 1, 1, 4, 6.09, null),
  ('BRASS', 0.25, 0.0934, 1, 1, 1, 11, 4.62, null),
  ('ANTI_BRASS', 1, 0.0153, 1, 1, 1, 10, 5.66, null),
  ('ANTI_SILVER', 1, 0.089, 1, 1, 1, 2, 2.68, null),
  ('STAINLESS_STEEL', 1, 0.1816, 1, 1, 1, 1, 4.39, 'no glare-free chart rows; fitted to glare rows'),
  ('RUSTY_STEEL', 1, 0.3064, 1, 1, 1, 1, 1.63, null),
  ('BLACK_COPPER', 0, 0.0638, 1, 1, 1.05, 3, 3.11, null),
  ('RED_COPPER', 0.9, 0.058, 1, 1, 1, 2, 4.7, null),
  ('ANTI_COPPER', 1, 0.01, 1, 1, 1, 4, 4.24, null);

-- Reference data: staff read it, nobody writes it from a client.
alter table public.finish_swatch_measurements enable row level security;
alter table public.finish_family_calibration enable row level security;
create policy "Catalogue editors read swatch measurements" on public.finish_swatch_measurements
  for select to authenticated using (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors read family calibration" on public.finish_family_calibration
  for select to authenticated using (public.user_is_catalogue_editor(auth.uid()));
revoke all on public.finish_swatch_measurements, public.finish_family_calibration from anon;
grant select on public.finish_swatch_measurements, public.finish_family_calibration to authenticated;
grant all on public.finish_swatch_measurements, public.finish_family_calibration to service_role;

alter table public.finishes
  add column if not exists two_tone boolean not null default false;

comment on column public.finishes.two_tone is
  'Antique finish (tone ANTI/ANCIENT/DEEP/DARK or base family ANTI_BRASS/ANTI_COPPER/ANTI_SILVER/BLACK_COPPER): '
  'the editor mixes buffed metal (base_color_hex, roughness) and oxide (base × 0.25, roughness 0.55) by baked ambient occlusion.';

-- ---------------------------------------------------------------------
-- F0: RTR4 Table 9.2 as in 3b, plus two references with no published F0.
--   tin          set from the chart's own TIN swatch (CYC-0046) — no
--                visible-range n,k for Sn is published in the references
--                checked (refractiveindex.info's Sn sets start at 730 nm;
--                physicallybased.info has no tin). Neutral; the family
--                calibration carries its brightness.
--   black_nickel gun-metal plating: nickel's luminance × 0.18, neutral.
-- ---------------------------------------------------------------------
create or replace function public.finish_metal_f0(p_metal text, out r float8, out g float8, out b float8)
language plpgsql immutable
as $$
begin
  case p_metal
    when 'gold'         then r := 1.000; g := 0.782; b := 0.344;
    when 'silver'       then r := 0.972; g := 0.960; b := 0.915;
    when 'copper'       then r := 0.955; g := 0.638; b := 0.538;
    when 'nickel'       then r := 0.660; g := 0.609; b := 0.526;
    when 'brass'        then r := 0.910; g := 0.778; b := 0.423;
    when 'iron'         then r := 0.562; g := 0.565; b := 0.578;
    when 'tin'          then r := 0.600; g := 0.600; b := 0.600;
    when 'zinc'         then r := 0.664; g := 0.824; b := 0.850;
    when 'aluminium'    then r := 0.913; g := 0.922; b := 0.924;
    when 'black_nickel' then r := 0.1105; g := 0.1105; b := 0.1105;
    else raise exception 'unknown metal %', p_metal;
  end case;
end $$;

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
  out two_tone            boolean
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
  r float8; g float8; b float8;
  y float8; sat float8; val float8;
  off float8[];
  code text;
begin
  two_tone := coalesce(p_tone, '') in ('ANTI', 'ANCIENT', 'DEEP', 'DARK')
           or coalesce(p_base_family, '') in ('ANTI_BRASS', 'ANTI_COPPER', 'ANTI_SILVER', 'BLACK_COPPER');

  -- Base family → metal, optional blend, optional darkened variant. Antique
  -- families use the bare metal: their darkness is the oxide mix (R2) plus
  -- the family calibration, not a variant.
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

  -- Gun metal: slight cool bias on the black-nickel reference (R3).
  if p_base_family = 'GUN_METAL' then
    r := r * 0.96; b := b * 1.08;
  end if;

  -- Tone (antique tones excepted — they are the two-tone mix), then tint.
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

  -- Family calibration (R4).
  select c.saturation::float8 as s, c.value::float8 as v, c.offset_r::float8 as orr, c.offset_g::float8 as og, c.offset_b::float8 as ob
  into cal
  from public.finish_family_calibration c
  where c.base_family_code = p_base_family;
  if found then
    y := 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r := (y + (r - y) * cal.s) * cal.v * cal.orr;
    g := (y + (g - y) * cal.s) * cal.v * cal.og;
    b := (y + (b - y) * cal.s) * cal.v * cal.ob;
  end if;

  base_color_hex := public.finish_linear_to_srgb_hex(r, g, b);
  metalness := 1;

  case coalesce(p_surface, 'BRIGHT')
    when 'BRUSHED'        then roughness := 0.35; anisotropy := 0.80;
    when 'CIRCLE_BRUSHED' then roughness := 0.35; anisotropy := 0.80;
    when 'MATT'           then roughness := 0.55; anisotropy := 0;
    when 'SAND'           then roughness := 0.70; anisotropy := 0;
    else                       roughness := 0.06; anisotropy := 0;   -- BRIGHT
  end case;
  -- Antique with no stated surface is buffed, not mirror (R2).
  if two_tone and p_surface is null then roughness := 0.30; end if;
  -- Gun metal roughness floor (R3).
  if p_base_family = 'GUN_METAL' then roughness := greatest(roughness, 0.15); end if;

  if p_effect = 'ENAMEL_DIP' then
    clearcoat := 1.0; clearcoat_roughness := 0.10;
  else
    clearcoat := 0; clearcoat_roughness := 0;
  end if;
end $$;

-- ---------------------------------------------------------------------
-- Painted (R5): base colour measured from the chart (glare rows included —
-- see STATUS.md), coating → roughness / clearcoat, metalness 0 except
-- METALLIC. hex_approx is kept, not rewritten.
-- ---------------------------------------------------------------------
create or replace function public.finish_painted_material(
  p_cyc_code   text,
  p_coating    text,
  p_hex_approx text,
  out base_color_hex      text,
  out metalness           numeric,
  out roughness           numeric,
  out anisotropy          numeric,
  out clearcoat           numeric,
  out clearcoat_roughness numeric
)
language plpgsql stable
as $$
begin
  select m.hex_srgb into base_color_hex from public.finish_swatch_measurements m where m.cyc_code = p_cyc_code;
  base_color_hex := upper(coalesce(base_color_hex, p_hex_approx));
  metalness := case when p_coating = 'METALLIC' then 0.6 else 0 end;
  anisotropy := 0;
  clearcoat := 0;
  clearcoat_roughness := 0;
  case p_coating
    when 'GLOSS_ENAMEL' then roughness := 0.15; clearcoat := 1; clearcoat_roughness := 0.10;
    when 'MATT_ENAMEL'  then roughness := 0.60;
    when 'RUBBER'       then roughness := 0.85;
    when 'PEARL'        then roughness := 0.30;
    when 'EP'           then roughness := 0.30;
    when 'GLITTER'      then roughness := 0.40;
    when 'VELVET'       then roughness := 0.95;
    when 'EPOXY'        then roughness := 0.05; clearcoat := 1; clearcoat_roughness := 0.10;
    when 'CERAMIC'      then roughness := 0.20;
    when 'METALLIC'     then roughness := 0.30;
    else                     roughness := 0.50;
  end case;
end $$;

-- ---------------------------------------------------------------------
-- One place that derives a row, used by the trigger and the recompute.
-- ---------------------------------------------------------------------
create or replace function public.finish_derive(p public.finishes,
  out base_color_hex text, out metalness numeric, out roughness numeric, out anisotropy numeric,
  out clearcoat numeric, out clearcoat_roughness numeric, out two_tone boolean)
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
  else
    select * into d from public.finish_plated_material(
      (select code from public.finish_base_families where id = p.base_family_id),
      (select code from public.finish_surfaces      where id = p.surface_id),
      (select code from public.finish_tones         where id = p.tone_id),
      (select code from public.finish_effects       where id = p.effect_id),
      (select code from public.finish_tints         where id = p.tint_id));
    two_tone := d.two_tone;
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
      or new.two_tone            is distinct from old.two_tone;
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
  return new;
end $$;

-- Recompute every row from the current tables. Service role only — used by
-- this migration and by the calibration harness after a refit.
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
      two_tone            = d.two_tone
  from public.finishes x
  cross join lateral public.finish_derive(x) d
  where x.id = f.id;
  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.finish_recompute_materials() from public, anon, authenticated;
grant execute on function public.finish_recompute_materials() to service_role;

select public.finish_recompute_materials();

commit;
