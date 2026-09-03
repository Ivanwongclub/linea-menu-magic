# M1 — Catalogue Schema Migration: Review (NOT APPLIED)

**Date:** 2026-09-03
**Branch:** main
**Type:** Review only. No migration file created, nothing executed. Verified against `src/integrations/supabase/types.ts`, all 19 files in `supabase/migrations/`, and the actual CMS write paths (`ProductEditor.tsx`, `ProductCatalogTab.tsx`, `ImportTab.tsx`, `TaxonomyTab.tsx`, `useProducts.ts`, `useProductTaxonomy.ts`, `useProduct.ts`).
**Caveat:** the client noted the live `products` SELECT policy (`"Authed read published + own brand + editor products"`, gating draft visibility on `user_is_catalogue_editor()`) already diverges from the tracked file at `20260903120000_catalogue_rls_hardening.sql`. Everything below is checked against tracked migration history plus `types.ts`; where live state could plausibly differ further (only `user_is_catalogue_editor()`'s existence matters for M1, and that's confirmed live per the client), I say so.

---

## Answers to the seven checks

### 1. Do all referenced tables/columns exist as assumed?

Checked every column M1 assumes pre-exists, against `types.ts`:

- **`products`** (`types.ts:710-730`): has `id, item_code, name, name_en, slug, description, description_en, status, is_public, is_customizable, specifications, production, thumbnail_url, model_url, sort_order, brand_id, created_at, updated_at`. **None** of the columns M1 adds (`sku, material_id, attachment_id, default_finish_id, face_style, hole_count, logo_customisable, moq_qty, moq_unit, lead_time_min_days, lead_time_max_days, wash_resistance, nickel_release_compliant`) exist yet — every `ADD COLUMN IF NOT EXISTS` is genuinely additive, no silent no-op risk.
- **`products.status`** (`types.ts:727`): typed as plain `string` — **there is no DB-level enum or CHECK constraint on `status`**, and never has been (confirmed across all prior migrations; the original `product_status` enum from the first schema attempt was dropped in `20260316105731...sql:35` and replaced with an unconstrained `text` column). The application-layer closed set is exactly `{'draft', 'active', 'archived'}`, confirmed by: `ProductEditor.tsx:116` (`useState<"draft" | "active" | "archived">`), `ProductCatalogTab.tsx:209` (`handleBulkStatus = async (status: "active" | "draft" | "archived")`), and `ImportTab.tsx:81` (`if (!["draft", "active", "archived", ""].includes(raw.status ?? ""))`). **`'active'` is correctly identified as the published state** — this matches every existing RLS policy that uses `status = 'active' AND is_public = true` as "published" (e.g. `20260422182607...sql:57-59`). `published_needs_sku`'s assumption is correct.
- **`product_categories`** (`types.ts:408-433`): has `id, name, slug, sort_order, icon_url, created_at`. None of `family_id, name_zh_hant, name_zh_hans, is_active` exist — additive, confirmed.
- **`product_materials`** (`types.ts:638-658`): has `id, name, slug, is_sustainable`. None of `is_metal, name_zh_hant, name_zh_hans` exist — additive, confirmed.

**Conclusion: no column-existence problems.**

### 2. Collisions with existing objects

Grepped every migration file for each name M1 introduces (functions, indexes, constraints, triggers, tables):

- Function `prevent_code_change` — no prior definition, no collision.
- `user_is_catalogue_editor` — already exists (confirmed live per your note, and tracked at `20260903120000...sql:39`); M1 only **calls** it, never redefines it — no collision, correct reuse.
- Indexes (`idx_categories_family`, `idx_finishes_process`, `idx_finishes_base`, `idx_finishes_surface`, `idx_product_colours_product`, `idx_size_variants_product`, `idx_one_default_size`, `idx_products_sku`) — zero hits anywhere else.
- Constraints (`published_needs_sku`, `standard_finish_needs_code`) — zero hits.
- Triggers (`trg_attachments_code`, `trg_finishes_code`, `trg_finish_*_code` ×8) — zero hits.
- Tables (all 16 new ones) — zero hits; none pre-exist.
- Policy names in the §9 loop can't collide with anything: the 16 tables are brand-new (no pre-existing policy to clash with), and the three *altered* tables (`products`, `product_categories`, `product_materials`) get **no new policies at all** in this migration — M1 never touches their RLS.

**Conclusion: no naming collisions found against tracked history.**

### 3. Is the `size_ligne` generated column valid?

**Yes — no defect.** `round((size_mm / 0.635)::numeric, 1)`:
- `0.635` is an unadorned decimal literal → Postgres types it as `numeric` by default (not `float8`), so `size_mm / 0.635` is `numeric / numeric` — exact decimal division, no floating-point error.
- `round(numeric, integer)` is a real, long-standing built-in signature.
- Both the numeric division operator and `round(numeric, int)` are marked `IMMUTABLE` in Postgres's catalog — the expression only references `size_mm` (same row) and constants, so it satisfies `GENERATED ALWAYS ... STORED`'s immutability requirement.
- `GENERATED ... STORED` has been supported since Postgres 12; not independently verifiable against the live project's exact version from this environment, but this is a long-stable feature well below any realistic Supabase-supported floor.

I looked for a trap here and didn't find one — this expression is correct as written.

### 4. Does `prevent_code_change()` work?

**No — confirmed broken, and it's the most severe defect in this migration.**

```sql
create or replace function public.prevent_code_change()
returns trigger language plpgsql as $$
begin
  if tg_argv[0] = 'code' and new.code is distinct from old.code then ...
  if tg_argv[0] = 'cyc_code' and new.cyc_code is distinct from old.cyc_code then ...
```

Both `if` statements are **top-level, unconditional, sequential** — the second one is reached on *every* invocation regardless of what the first one did. PL/pgSQL's lazy-compilation rule ("an expression is only prepared the first time that statement executes") applies to *statements inside a branch that's never taken* — it does not save you here, because reaching an `IF` statement at all requires evaluating its condition, and evaluating the condition requires *preparing* it via the SQL parser first. Short-circuit evaluation of `AND` happens at runtime, over an *already-parsed* expression tree — it doesn't prevent the parser from needing to resolve every field reference in that expression up front. `new.cyc_code` doesn't exist on `product_attachments`' (or any of the 8 axis tables') row type; `new.code` doesn't exist on `finishes`' row type. Either way, the very first `UPDATE` on any of the 9 tables this trigger is attached to raises `record "new" has no field "cyc_code"` (or `"code"`) and fails — **for every update, not just ones that touch the code column.**

This directly breaks a stated requirement: *"Axis values may be renamed but not deleted while a finish references them"* — a rename (touching only `name`) would hit this bug too, since the second `IF`'s condition is evaluated regardless.

**Fix** — stop referencing static field names; look the named column up dynamically via `to_jsonb`, which doesn't require the field to exist at parse time:

```sql
create or replace function public.prevent_code_change()
returns trigger language plpgsql as $$
declare
  col text := tg_argv[0];
begin
  if (to_jsonb(new) ->> col) is distinct from (to_jsonb(old) ->> col) then
    raise exception '% is immutable (id %)', col, old.id;
  end if;
  return new;
end $$;
```

Every table this is attached to has an `id` column, so `old.id` is safe everywhere. Verified this only needs the one function rewritten — no trigger-attachment statements need to change.

### 5. Will the §9 RLS loop succeed?

**It will execute without a SQL error** — `user_is_catalogue_editor()` already exists live and is only called, not redefined, so there's no collision or missing-function failure.

**But it produces the wrong policy on 5 of the 16 tables.** See defects #2 and #4 below — this is the second most severe problem in the migration.

### 6. What breaks in existing code?

Checked every consumer that reads or writes `products`/`product_categories`/`product_materials`:

- **Reads are unaffected.** `useProducts.ts`, `useProduct.ts`, `useProductTaxonomy.ts`, and `ProductCatalogTab.tsx` all use **explicit column lists** in every `.select(...)` call (verified — no `select('*')` anywhere in these files), so new nullable/defaulted columns simply aren't fetched. No runtime change, no crash. (`types.ts` will need regenerating for the new columns/tables to become usable in TypeScript-checked code, but that's a dev-tooling step, not a runtime break.)
- **Writes are unaffected by the column additions themselves** — every new column on `products` is either nullable or `NOT NULL ... DEFAULT`, so `ProductEditor.tsx`'s `productData` payload (`~line 211-224`, confirmed it does not set any of the new columns) and `ImportTab.tsx`'s `productRows` (`ImportTab.tsx:118-125`, same) continue to insert successfully without modification.
- **`published_needs_sku` is the one real break, and it's severe.** `sku` is a brand-new column; nothing in the repo has ever set it. `ProductEditor.tsx` has a status `<Select>` allowing `"active"` (`ProductEditor.tsx:412`) with **no `sku` input field anywhere in the file** (confirmed by grep — `sku` appears nowhere in `ProductEditor.tsx`). `ImportTab.tsx`'s CSV template/columns (`ImportTab.tsx:16`) and insert payload (`ImportTab.tsx:118-125`) have no `sku` field either. Consequences:
  - The moment this migration lands, **every currently-active product has `sku = NULL`** (no backfill statement exists in M1).
  - `NOT VALID` on the constraint (correctly used, to avoid the migration itself failing/locking against existing data) only skips the *initial* validation scan — it does **not** exempt future writes. Every subsequent `UPDATE` to an existing active-status row is checked, regardless of which columns actually changed.
  - Concretely: `ProductCatalogTab.tsx:177` (`is_public` toggle, `.update({ is_public: next })`) will fail with a raw Postgres CHECK-violation error for **any existing active product**, since the row's `status` stays `'active'` and `sku` stays `NULL`. Same for any other in-place edit via `ProductEditor.tsx` that doesn't first set `status` away from `'active'`.
  - CSV imports of new rows with `status: "active"` (`ImportTab.tsx`) will fail at insert for the same reason — `toast.error` surfaces it gracefully (confirmed error handling exists), but bulk "active" imports are effectively broken until `sku` is wired in.
  - **This needs a plan before the migration is safe to apply**: either (a) a backfill statement for existing active rows (see "would design differently" — possibly `sku = item_code` if that's an acceptable stand-in), or (b) shipping a `sku` input in `ProductEditor.tsx`/`ImportTab.tsx` in the same change window, or (c) both. Landing the constraint with neither will visibly break the CMS for anyone editing an existing published product.
- **AI image-gen edge function** (`ProductCatalogTab.tsx:472-483`) — not re-checked in this pass; same "unable to determine service-role vs. client-JWT" caveat as the P21 report.

### 7. What's missing relative to the stated requirements?

Requirement-by-requirement:

- **"5 families, 25 subcategories... families as their own table with segment, tagline, sort order"** — satisfied (`product_families`). Minor: `segment text not null default 'apparel'` has no CHECK against the known finite set (`apparel`/`beauty`/`material`) — cheap to add, not required by the letter of the requirement.
- **"English, Traditional Chinese and Simplified Chinese names on every taxonomy and finish table"** — **two concrete misses**:
  - `compliance_standards` gets only `name` — no `name_zh_hant`/`name_zh_hans` at all, even though it's created in the same migration as every other correctly-trilingual lookup table.
  - `finishes.factory_name_zh` is a **single** Chinese column, not split into `factory_name_zh_hant`/`factory_name_zh_hans` — inconsistent with `marketing_name_zh_hant`/`marketing_name_zh_hans` in the *same table*, and doesn't satisfy "Traditional Chinese and Simplified Chinese" for that field.
  - Separately (style, not a miss): `product_categories`/`product_materials` gain `name_zh_hant`/`name_zh_hans` alongside their existing bare `name` (implicitly English) with no `name_en` column, while `products` and `finishes.factory_name_en` use an explicit `_en` suffix. Two different "what counts as the English name" conventions coexist across the schema.
- **"Typed product specification fields replacing the free-text JSON blob"** — partially covered. Checked every key actually seen in real data (the Polo Ralph Lauren seed migration and `pdpSeedData.ts`, both audited in the P20 report) against M1's new columns:
  - Covered: `material`→`material_id`, `finish`→`finishes`/`default_finish_id`/`product_finishes`, `size`→`size_mm`, `weight`→`weight_g`, `thickness`→`thickness_mm`, `attachment`/`construction`→`attachment_id`, `color_options`→`product_colours`, `holes`→`hole_count`, `moq`→`moq_qty`/`moq_unit`, `lead_time`/`lead_time_days`→`lead_time_min_days`/`lead_time_max_days` (an improvement — a range instead of one value).
  - **Not covered by any new column**: `tensileStrength` (used in `pdpSeedData.ts` and the legacy spec shape), and from `production`: `sample_time`, `origin`, `capacity`. These would either need to stay indefinitely in the legacy `specifications`/`production` JSON, or get typed columns. Worth a decision, not silently dropping them.
  - **Real gap, not just an omission**: `product_size_variants` models exactly one scalar, `size_mm` (justified by the ligne/button convention). The real seed data also has `width_mm`, `height_mm`, `length_mm`, `inner_mm`, `outer_mm` — dimensions that don't collapse into a single "size." This matters concretely for the target category structure from the P20 audit: **D-Rings & O-Rings** need inner+outer diameter, **Metal Pendants & Custom Brand Badges** need width×height — neither fits a single `size_mm`/`size_ligne` pair. As designed, `product_size_variants` only really serves round/button-like items.
  - `products.specifications`/`.production` are left in place (reasonable for a phased cutover) but nothing in M1 marks them deprecated or backfills the new columns from them — and `ProductEditor.tsx`'s `KeyValueEditor` (still fully free-text, untouched by M1) remains live in parallel, so staff can keep typing arbitrary keys into the old JSON blob *at the same time* the new typed columns exist, which risks the same field (e.g. weight) being recorded in two places that drift apart. Worth flagging as a rollout risk, not a schema defect.
- **"135 CYC finish records across 8 facet axes... axes cannot be enums"** — satisfied; 8 axis tables, all normal lookup tables, not Postgres enums.
- **"A finish may exist without a CYC code... must then be flagged non-standard"** — satisfied correctly: `standard_finish_needs_code check (is_standard = false or cyc_code is not null)` plus a plain (nullable-friendly) `unique` on `cyc_code` is exactly right — multiple `NULL` cyc_codes don't violate uniqueness, and the CHECK forces `is_standard = false` whenever `cyc_code IS NULL`.
- **"Axis values may be renamed but not deleted while a finish references them"** — the delete-protection half is satisfied (`on delete restrict` on all 8 axis FKs on `finishes`). The rename half is currently broken by the trigger bug (#4 above) but will work once that's fixed.
- **"Codes... immutable once created"** — intent is right (`BEFORE UPDATE` trigger, not `BEFORE INSERT`), implementation is broken (#4).
- **"Finishes apply only to metal products... gate is a data property on the material, not a hardcoded category list"** — the data property exists (`product_materials.is_metal`), which correctly avoids a hardcoded category list. **But nothing enforces it** — no constraint or trigger stops a `product_finishes` row (or `products.default_finish_id`) from being attached to a product whose material has `is_metal = false`, or no material at all. As written, the "gate" is descriptive metadata only; enforcement is left entirely to future application code. Given the requirement explicitly calls this out as a design principle (not hardcoding), I'd expect it to actually gate something at the DB layer — flagging as a real gap, not just a nice-to-have.
- **"sku unique, entered manually by an admin, required to publish but optional on draft"** — the mechanism is correct (partial unique index skipping `NULL`, CHECK constraint on `status`) — but see #6: no backfill, no FE field, immediate operational freeze.
- **"All new tables readable publicly, writable only by catalogue editors"** — the *taxonomy/lookup* tables (`product_families`, `product_attachments`, `compliance_standards`, the 8 axis tables, `finishes`) correctly get this treatment. The *product-linked* tables (`product_compliance_map`, `product_finishes`, `product_colours`, `product_size_variants`) should **not** get a blanket `using (true)` read policy — see Defect #2, this is a real privacy regression, not just a missing nice-to-have.
- **CMS reachability** — confirmed concretely, not just assumed: `TaxonomyTab.tsx:284-321` hardcodes the column list for `product_categories` (`name, slug, sort_order` — no `family_id`/zh/`is_active`) and `product_materials` (`name, slug, is_sustainable` — no `is_metal`/zh). None of the 16 new tables, nor any of the new `products` columns, have any CMS surface at all after M1. This is expected for a schema-only module, but it means the requirement *"admins can add new axis values and new finishes through the CMS"* is **not yet met** by M1 alone — flagging explicitly so it isn't assumed done once the schema lands.

---

## (a) Defects, ranked by severity

| # | Severity | Defect |
|---|---|---|
| 1 | **Critical** | `prevent_code_change()` fails on *every* `UPDATE` to any of the 9 tables it's attached to (`product_attachments` + 8 finish axis tables + `finishes`), not just code changes — because both of its `IF` conditions are unconditionally evaluated and each references a column that doesn't exist on every attached table. Breaks the explicit "axis values may be renamed" requirement outright. |
| 2 | **Critical** | Privacy regression: `product_compliance_map`, `product_finishes`, `product_colours`, `product_size_variants` get `for select to public using (true)` via the generic §9 loop, with no join back to the parent product's `status`/`is_public`/`brand_id`. This is exactly the bug class P21 fixed for `product_images` — a draft or brand-private product (e.g. the Polo Ralph Lauren catalogue) would leak its finishes, colours, and size/weight data to anonymous visitors even though the product row itself stays hidden. |
| 3 | **Critical** | `published_needs_sku`, landed with no backfill and no `sku` input anywhere in `ProductEditor.tsx`/`ImportTab.tsx`, freezes every existing active product against any future `UPDATE` (not just publish actions) — including `ProductCatalogTab.tsx`'s `is_public` toggle — the instant this migration is applied. |
| 4 | **High** | `finishes.is_public boolean` is defined but never referenced by any policy — the §9 loop gives `finishes` the same blanket `using (true)` read as pure lookup tables, silently ignoring a column that was clearly added for exactly this purpose. |
| 5 | **High** | `compliance_standards` has no `name_zh_hant`/`name_zh_hans` — misses the "every taxonomy and finish table" trilingual requirement, inconsistently with every other new lookup table in the same migration. |
| 6 | **High** | `finishes.factory_name_zh` is one column, not split into `_zh_hant`/`_zh_hans` — inconsistent with `marketing_name`'s correct split two fields over in the same table, and doesn't satisfy the stated Traditional+Simplified requirement for that field. |
| 7 | **High** | `product_size_variants` cannot represent non-round hardware (D-rings/O-rings, badges, buckles) that needs width×height or inner/outer diameter rather than a single `size_mm`/`size_ligne` pair — a real modeling gap against the target category structure, not just a missing nice-to-have. |
| 8 | **Medium** | The metal-only finish gate (`product_materials.is_metal`) is descriptive data only — nothing in the DB stops a non-metal (or material-less) product from being assigned a finish. |
| 9 | **Medium** | Known, currently-used spec/production keys with no typed-column home: `tensileStrength`, `sample_time`, `origin`, `capacity`. |
| 10 | **Low** | Naming-convention inconsistency for "the English name" across the schema (`products.name`/`.name_en` vs. `product_categories.name` with no `name_en` vs. `finishes.factory_name_en` vs. `finishes.marketing_name` with no `_en` suffix at all). |
| 11 | **Low** | `product_families.segment` has no CHECK against its known finite value set. |

---

## (b) What I'd design differently, and why

- **Resolve `sku` vs. `item_code` before adding either constraint.** The app already has a unique, admin-entered product-code column (`item_code` — `types.ts:719`, deeply wired into `ProductEditor.tsx`, `ProductCatalogTab.tsx` search/display, `ImportTab.tsx`, and `useProducts.ts`'s search filter). The requirement describes `sku` in almost identical terms ("unique, entered manually by an admin"). Introducing a second, currently-unused, unique identifier column risks two overlapping "the product's code" fields with no stated distinction. I'd either (a) confirm `sku` is a genuinely different concept (e.g. a new customer-facing catalogue numbering scheme distinct from WIN-CYC's internal manufacturing code) and document that difference, or (b) just repurpose `item_code` as the "sku" the requirement means and skip adding a new column at all. Either way, the backfill question for existing active rows has to be answered explicitly before `published_needs_sku` is safe.
- **Don't apply one blanket RLS shape to all 16 new tables.** The §9 loop's `for select to public using (true)` is right for the 12 pure lookup/taxonomy tables but wrong for the 4 product-linked ones. I'd split §9 into two loops — the existing generic one for lookup tables, and a hand-written per-table policy (mirroring the `product_images` fix from P21) for anything carrying a `product_id`.
- **Enforce the metal-only gate, not just record it.** Given the requirement explicitly frames this as "a data property, not a hardcoded list" — implying it should actually *do* something — I'd add a trigger on `product_finishes` (and a CHECK-via-trigger on `products.default_finish_id`) that rejects the write if the product's `material_id` doesn't resolve to `is_metal = true`. Sketch in §(c).
- **Make `prevent_code_change` reusable safely** via `to_jsonb`, not per-table hardcoded field names — the current design's *intent* (one generic trigger function, parameterized by column name) is good and worth keeping; only the implementation is wrong.
- **Give `product_size_variants` room for non-round dimensions** rather than assuming everything reduces to one `size_mm`. I'd add nullable `width_mm`, `height_mm`, `inner_mm`, `outer_mm` alongside the existing `size_mm`/`size_ligne`, and treat `size_ligne` as populated only when `size_mm` is (i.e. leave `size_mm` nullable too, generated column already handles `NULL` input → `NULL` output correctly). This keeps the ligne convention for buttons while not forcing every hardware category into the same box.

---

## (c) Corrected SQL for the confirmed defects

Only the unambiguous bugs (not the open design questions above) — for your review, not yet staged as a migration file.

**Fix #1 — `prevent_code_change()`:**

```sql
create or replace function public.prevent_code_change()
returns trigger language plpgsql as $$
declare
  col text := tg_argv[0];
begin
  if (to_jsonb(new) ->> col) is distinct from (to_jsonb(old) ->> col) then
    raise exception '% is immutable (id %)', col, old.id;
  end if;
  return new;
end $$;
```

No changes needed to any `create trigger` statement — they already pass the right column name as `tg_argv[0]`.

**Fix #2 — split §9 so product-linked tables get parent-scoped read, not blanket public read; and give `finishes` an `is_public`-aware policy instead of the loop's blanket one:**

```sql
-- Pure lookup/taxonomy tables — unchanged from the original §9 loop.
do $$
declare t text;
begin
  foreach t in array array[
    'product_families','product_attachments','compliance_standards',
    'finish_processes','finish_base_families','finish_surfaces','finish_tones',
    'finish_effects','finish_tints','finish_coatings','finish_patterns'
  ] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy %I on public.%I for select to public using (true)',
      'Public read '||t, t);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors insert '||t, t);
    execute format('create policy %I on public.%I for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors update '||t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors delete '||t, t);
  end loop;
end $$;

-- finishes — same write policies, but read respects is_public (and lets
-- catalogue editors see everything, including drafts, for the CMS).
alter table public.finishes enable row level security;

create policy "Public read published finishes" on public.finishes
  for select to public
  using (is_public = true or public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors insert finishes" on public.finishes
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update finishes" on public.finishes
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete finishes" on public.finishes
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- Product-linked tables — read must mirror the parent product's own
-- visibility, exactly like the product_images fix in P21.
do $$
declare t text;
begin
  foreach t in array array[
    'product_compliance_map','product_finishes','product_colours','product_size_variants'
  ] loop
    execute format('alter table public.%I enable row level security', t);

    execute format($f$
      create policy %I on public.%I for select to anon
      using (exists (
        select 1 from public.products p
        where p.id = %I.product_id
          and p.status = 'active' and p.is_public = true and p.brand_id is null
      ))$f$, 'Anon read '||t||' of public active products', t, t);

    execute format($f$
      create policy %I on public.%I for select to authenticated
      using (exists (
        select 1 from public.products p
        where p.id = %I.product_id
          and (p.brand_id is null or public.user_has_brand(auth.uid(), p.brand_id))
      ))$f$, 'Authed read '||t||' of house + own brand products', t, t);

    execute format('create policy %I on public.%I for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors insert '||t, t);
    execute format('create policy %I on public.%I for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors update '||t, t);
    execute format('create policy %I on public.%I for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()))',
      'Catalogue editors delete '||t, t);
  end loop;
end $$;
```

Note: `product_compliance_map`/`product_finishes`/`product_colours`/`product_size_variants` all name their FK column `product_id` consistently, so the single dynamic-`%I` template works for all four unmodified.

**Optional sketch, not included above — DB-level metal-only gate (your call whether to include; adds real complexity for a rule that could instead live in application code):**

```sql
create or replace function public.check_finish_requires_metal_material()
returns trigger language plpgsql as $$
begin
  if not exists (
    select 1 from public.products p
    join public.product_materials m on m.id = p.material_id
    where p.id = new.product_id and m.is_metal = true
  ) then
    raise exception 'product % has no metal material — finishes cannot be assigned', new.product_id;
  end if;
  return new;
end $$;

create trigger trg_product_finishes_requires_metal
  before insert or update on public.product_finishes
  for each row execute function public.check_finish_requires_metal_material();
```

(A matching check for `products.default_finish_id` would need to live in a `BEFORE INSERT OR UPDATE ON products` trigger instead, since that's a column on `products` itself, not a join table — happy to draft it if you want this enforced.)

---

## What I'm not resolving unilaterally

Per your instruction to disagree plainly rather than silently work around a wrong design: I have **not** added `sku` backfill SQL, **not** added the `tensileStrength`/`sample_time`/`origin`/`capacity` columns, and **not** widened `product_size_variants` with `width_mm`/`height_mm`/`inner_mm`/`outer_mm` in the corrected SQL above — these are open design questions (§(b)) that change the shape of the migration more than a bug fix should, and I'd rather you decide them than have me guess. Let me know which of these you want folded in, and I'll produce the full corrected M1 file for review before anything is staged or applied.
