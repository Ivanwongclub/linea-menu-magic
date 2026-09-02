# P21 — Catalogue RLS Hardening: Findings + Migration

**Date:** 2026-09-02 (revised 2026-09-03 per client rulings)
**Branch:** main
**Type:** Findings report + final migration SQL.
**Follows up on:** `reports/P20-catalogue-restructure-audit.md`, Blocker #7 ("RLS is `FOR ALL USING(true) WITH CHECK(true)` on `products` and every taxonomy table")
**Status:** Revised per client rulings below. Migration file staged at `supabase/migrations/20260903120000_catalogue_rls_hardening.sql`. **`catalogue_editors` is not seeded** — pending two named accounts. See the "Applying this migration" section at the end for what could and could not be executed from this environment.

---

## Revision history

- **2026-09-02, v1:** Original proposal used a dedicated `wincyc-staff` pseudo-brand row (via the existing `brands`/`brand_memberships`/`brand_role` schema) and a brand-scoped `user_is_catalogue_editor()`.
- **2026-09-03, v2 (this version) — client rulings applied:**
  1. **Replaced the pseudo-brand approach with a dedicated `catalogue_editors` table.** Reason (client's, verified below): `AuthProvider.tsx:91` sets `const primaryBrand = brands[0] ?? null;`, and `primaryBrand` is consumed in 8 files (`AuthProvider.tsx` itself plus `Header.tsx`, `BrochuresPanel.tsx`, `CompositionPickerDialog.tsx`, `ComposerPage.tsx`, `DesignerStudioTrimLibrary.tsx`, `DesignerStudioWorkspace.tsx`, `ProductDetail.tsx` — confirmed by grep). A `wincyc-staff` brand membership would sit in the same `brands[]` array as any real customer-brand membership a staff account might also hold, making `brands[0]` — and therefore every one of those 8 consumers' idea of "which brand is this user working as" — order-dependent and non-deterministic. A dedicated table sidesteps this entirely: it carries no brand identity, so it cannot leak into `primaryBrand`.
  2. **Included the two previously-flagged-but-excluded gaps:** the `product-assets` storage bucket write policies, and the `product_images` read policy (rewritten to respect the parent product's `status`/`is_public`/`brand_id` instead of `USING (true)`). Exact policy shown in §3 before being placed in the migration file, per instruction.
  3. **Kept** the broadened `products` SELECT policy for draft/archived visibility — unchanged from v1.

---

## 1. The existing role mechanism (unchanged from v1 — restated for context)

- **`public.brand_role`** enum: `'member' | 'manager' | 'owner'` — `supabase/migrations/20260422182607_d0d7b60f-2b15-4f33-95c0-8335ad14d795.sql:18`.
- **`public.brands`** / **`public.brand_memberships`** (`...20260422182607...sql:2-28`) — per-brand role assignment only. One real brand exists in seed data: `polo-ralph-lauren`.
- **`public.user_has_brand(_user_id, _brand_id)`** (`...20260422182607...sql:38-46`) — any membership on a specific brand. Used for `products`, `user_library_items`, `design_sessions`/`design_layers`/`design_exports` (via the text-keyed `user_has_brand_text`, `20260423090500...sql:6-19`).
- **`public.user_is_brand_manager_or_owner(_user_id)`** (`20260615120000_workspace_role_and_team_hardening.sql:22-35`) — manager/owner of *any* brand; written for `flipbook_*`, a global resource with no `team_id`.
- **Frontend already loads role data** (`AuthProvider.tsx:5-9,33-53`) but no products/taxonomy CMS component reads it.
- **No membership is ever seeded with `role = 'manager'` or `'owner'`** in any migration — only `'member'` (`20260422192314...sql:17-28`). This remains the biggest pre-existing operational fact: nobody currently qualifies for elevated catalogue access under any mechanism, old or new.

**Decision (v2):** none of the above is reused for the catalogue-editor check. A **new, single-purpose table** is added instead — per the client's ruling, not because the brand schema was unusable in principle (v1 showed it could be scoped safely against cross-brand leakage), but because it has a side effect (polluting `brands[]`/`primaryBrand`) that the brand schema cannot avoid by construction. This is the "show why the existing one cannot serve" case: it's not a security or query problem, it's that `brand_memberships` is *observed by the frontend as brand identity*, and a staff grant is not a brand identity.

---

## 2. Every table currently carrying an open write policy (unchanged from v1 — restated for context)

### `FOR ALL TO authenticated USING (true) WITH CHECK (true)` — active, all in `supabase/migrations/20260316105731_9ce1cbd3-4158-4087-9633-29138a5403c4.sql`

| Table | Policy name | Line |
|---|---|---|
| `products` | `Authenticated manage products` | 126-127 |
| `product_images` | `Authenticated manage product_images` | 203 |
| `product_categories` | `Authenticated manage product_categories` | 52 |
| `product_materials` | `Authenticated manage product_materials` | 62 |
| `product_industries` | `Authenticated manage product_industries` | 72 |
| `product_certifications` | `Authenticated manage product_certifications` | 82 |
| `product_tags` | `Authenticated manage product_tags` | 92 |
| `product_category_map` | `Authenticated manage product_category_map` | 150 |
| `product_material_map` | `Authenticated manage product_material_map` | 159 |
| `product_industry_map` | `Authenticated manage product_industry_map` | 168 |
| `product_certification_map` | `Authenticated manage product_certification_map` | 177 |
| `product_tag_map` | `Authenticated manage product_tag_map` | 186 |

### Already fixed (context / cross-check — unchanged)

`flipbook_brochures`/`flipbook_pages`/`flipbook_hotlinks`, `design_sessions`/`design_layers`/`design_exports`, `user_library_items`, `editor_sessions` — all previously tightened; `customization_requests` was never open. See v1 history for exact migration citations (unchanged, omitted here for brevity).

### Now in scope (v2 — previously flagged, now included per ruling 2)

- **`product-assets` storage bucket** — `Authenticated upload/update/delete product-assets` (`20260316105731...sql:278-285`), `TO authenticated`, no ownership/role check. This is the actual path `ProductEditor.tsx` uses for image/thumbnail upload.
- **`product_images` SELECT** — `Public read product_images` (`20260316105731...sql:202`), `TO public USING (true)`, no join back to the parent product's `status`/`is_public`/`brand_id`. An anonymous visitor who has (or enumerates) a `product_id` for a draft or brand-private product (e.g. the Polo Ralph Lauren private catalogue) can read that product's images directly even though the `products` row itself is correctly hidden.

Still explicitly **not** in scope (not raised in either ruling): `flipbook-assets` and `design-assets` storage buckets remain open to any authenticated user — flagged again for visibility, not included.

---

## 3. Exact `product_images` read policy (shown before inclusion, per instruction)

Replaces the single `Public read product_images ... TO public USING (true)` policy with two policies that mirror `products`' own two-tier split exactly (anon gets the public-active-house subset; authenticated gets house-regardless-of-status plus their own brand's rows) — so an image is visible if and only if its parent product row would be:

```sql
drop policy if exists "Public read product_images" on public.product_images;

create policy "Anon read images of public active products"
on public.product_images
for select
to anon
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'active'
      and p.is_public = true
      and p.brand_id is null
  )
);

create policy "Authed read images of house + own brand products"
on public.product_images
for select
to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (p.brand_id is null or public.user_has_brand(auth.uid(), p.brand_id))
  )
);
```

This is self-consistent with the RLS already on `products`: the anon `EXISTS` predicate matches exactly the rows `"Anon read public active products"` allows anon to read directly; the authenticated `EXISTS` predicate matches exactly `"Authed read house + own brand products"` (§4). No privilege escalation — an image is never visible to a role that couldn't already see its parent product row by querying `products` directly. The same subquery-against-a-sibling-RLS-table pattern is already established in this codebase (`flipbook_pages`'s `"Public can view pages of published brochures"`, `supabase/migrations/20260313092451_1e39707c-3bcf-4b54-bfdf-0b0baa809b01.sql:57-65`).

---

## 4. Full final migration

Staged at `supabase/migrations/20260903120000_catalogue_rls_hardening.sql` (full contents below — identical to the file). `catalogue_editors` is created empty; no accounts are granted by this migration.

```sql
-- Catalogue RLS hardening (P21)
-- 1. Dedicated catalogue_editors table (no brand pseudo-membership — see
--    P21 report §1 for why brand_memberships was rejected: primaryBrand
--    = brands[0] would become non-deterministic for any staff account
--    that also holds a real customer-brand membership).
-- 2. Restrict INSERT/UPDATE/DELETE on products, product_images, and all
--    taxonomy/mapping tables to catalogue editors.
-- 3. Broaden authenticated SELECT on products so draft/archived house
--    products remain visible to CMS staff of any (or no) elevated role.
-- 4. Fix product_images SELECT to respect the parent product's visibility.
-- 5. Tighten the product-assets storage bucket to catalogue editors.
--
-- catalogue_editors is NOT seeded here — grants are added separately by
-- direct SQL once specific accounts are named.

-- ---------------------------------------------------------------------
-- 1. catalogue_editors
-- ---------------------------------------------------------------------
create table public.catalogue_editors (
  user_id uuid primary key references auth.users(id) on delete cascade,
  granted_at timestamptz not null default now()
);

alter table public.catalogue_editors enable row level security;

create policy "Users read own catalogue editor grant"
on public.catalogue_editors
for select
to authenticated
using (user_id = auth.uid());

-- No insert/update/delete policy for any client role: RLS default-denies
-- all writes. Grants are made only via direct SQL (service role / migrations).
revoke all on public.catalogue_editors from anon;

-- ---------------------------------------------------------------------
-- 2. Catalogue-editor predicate
-- ---------------------------------------------------------------------
create or replace function public.user_is_catalogue_editor(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.catalogue_editors where user_id = _user_id
  );
$$;

grant execute on function public.user_is_catalogue_editor(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 3. products
-- ---------------------------------------------------------------------
drop policy if exists "Authed read public + own brand products" on public.products;
drop policy if exists "Authenticated manage products" on public.products;

create policy "Authed read house + own brand products"
on public.products
for select
to authenticated
using (
  brand_id is null
  or public.user_has_brand(auth.uid(), brand_id)
);

create policy "Catalogue editors insert products"
on public.products
for insert
to authenticated
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors update products"
on public.products
for update
to authenticated
using (public.user_is_catalogue_editor(auth.uid()))
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors delete products"
on public.products
for delete
to authenticated
using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 4. product_images — read policy rewritten to respect parent visibility;
--    write policies gated to catalogue editors.
-- ---------------------------------------------------------------------
drop policy if exists "Public read product_images" on public.product_images;
drop policy if exists "Authenticated manage product_images" on public.product_images;

create policy "Anon read images of public active products"
on public.product_images
for select
to anon
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and p.status = 'active'
      and p.is_public = true
      and p.brand_id is null
  )
);

create policy "Authed read images of house + own brand products"
on public.product_images
for select
to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_images.product_id
      and (p.brand_id is null or public.user_has_brand(auth.uid(), p.brand_id))
  )
);

create policy "Catalogue editors insert product_images"
on public.product_images
for insert
to authenticated
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors update product_images"
on public.product_images
for update
to authenticated
using (public.user_is_catalogue_editor(auth.uid()))
with check (public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors delete product_images"
on public.product_images
for delete
to authenticated
using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 5. Taxonomy tables — "Public read *" left as-is.
-- ---------------------------------------------------------------------

-- product_categories
drop policy if exists "Authenticated manage product_categories" on public.product_categories;
create policy "Catalogue editors insert product_categories" on public.product_categories
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_categories" on public.product_categories
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_categories" on public.product_categories
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_materials
drop policy if exists "Authenticated manage product_materials" on public.product_materials;
create policy "Catalogue editors insert product_materials" on public.product_materials
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_materials" on public.product_materials
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_materials" on public.product_materials
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_industries
drop policy if exists "Authenticated manage product_industries" on public.product_industries;
create policy "Catalogue editors insert product_industries" on public.product_industries
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_industries" on public.product_industries
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_industries" on public.product_industries
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_certifications
drop policy if exists "Authenticated manage product_certifications" on public.product_certifications;
create policy "Catalogue editors insert product_certifications" on public.product_certifications
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_certifications" on public.product_certifications
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_certifications" on public.product_certifications
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_tags
drop policy if exists "Authenticated manage product_tags" on public.product_tags;
create policy "Catalogue editors insert product_tags" on public.product_tags
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_tags" on public.product_tags
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_tags" on public.product_tags
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 6. Mapping (junction) tables — "Public read *" left as-is.
-- ---------------------------------------------------------------------

-- product_category_map
drop policy if exists "Authenticated manage product_category_map" on public.product_category_map;
create policy "Catalogue editors insert product_category_map" on public.product_category_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_category_map" on public.product_category_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_category_map" on public.product_category_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_material_map
drop policy if exists "Authenticated manage product_material_map" on public.product_material_map;
create policy "Catalogue editors insert product_material_map" on public.product_material_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_material_map" on public.product_material_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_material_map" on public.product_material_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_industry_map
drop policy if exists "Authenticated manage product_industry_map" on public.product_industry_map;
create policy "Catalogue editors insert product_industry_map" on public.product_industry_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_industry_map" on public.product_industry_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_industry_map" on public.product_industry_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_certification_map
drop policy if exists "Authenticated manage product_certification_map" on public.product_certification_map;
create policy "Catalogue editors insert product_certification_map" on public.product_certification_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_certification_map" on public.product_certification_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_certification_map" on public.product_certification_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- product_tag_map
drop policy if exists "Authenticated manage product_tag_map" on public.product_tag_map;
create policy "Catalogue editors insert product_tag_map" on public.product_tag_map
  for insert to authenticated with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors update product_tag_map" on public.product_tag_map
  for update to authenticated using (public.user_is_catalogue_editor(auth.uid())) with check (public.user_is_catalogue_editor(auth.uid()));
create policy "Catalogue editors delete product_tag_map" on public.product_tag_map
  for delete to authenticated using (public.user_is_catalogue_editor(auth.uid()));

-- ---------------------------------------------------------------------
-- 7. product-assets storage bucket
-- ---------------------------------------------------------------------
drop policy if exists "Authenticated upload product-assets" on storage.objects;
drop policy if exists "Authenticated update product-assets" on storage.objects;
drop policy if exists "Authenticated delete product-assets" on storage.objects;

create policy "Catalogue editors upload product-assets" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-assets' and public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors update product-assets" on storage.objects
  for update to authenticated
  using (bucket_id = 'product-assets' and public.user_is_catalogue_editor(auth.uid()));

create policy "Catalogue editors delete product-assets" on storage.objects
  for delete to authenticated
  using (bucket_id = 'product-assets' and public.user_is_catalogue_editor(auth.uid()));

-- End of migration. catalogue_editors is intentionally left empty —
-- grant specific accounts via a follow-up statement, e.g.:
--   insert into public.catalogue_editors (user_id)
--   select id from auth.users where email = '<staff email>';
```

---

## 5. What would break

1. **Immediately after applying, nobody can write to the catalogue via the CMS.** `catalogue_editors` starts empty. Someone must add the two named accounts (pending from the client) before the CMS is usable for writes again.
2. **`ProductCatalogTab.tsx`'s draft/archived filters stay working** for all authenticated users regardless of editor status, because of the broadened `"Authed read house + own brand products"` policy (kept from v1, unchanged rationale).
3. **Non-editor authenticated users keep full access to the CMS UI, but every write fails** with a graceful `toast.error(...)` — confirmed non-crashing in every write path (`ProductCatalogTab.tsx:179-180,195-196,216-217`; `TaxonomyTab.tsx:75-76,88-89,102-103`; `ImportTab.tsx:134-135,196-197`; `ProductEditor.tsx` save/delete paths). Buttons remain visible/clickable for non-editors — a frontend follow-up (hiding/disabling based on editor status), not attempted here since it wasn't asked.
4. **`ProductCatalogTab.tsx`'s AI image-generation button** (edge function `generate-product-images`) — not traced into the function's implementation; **UNABLE TO DETERMINE** whether it writes via the caller's JWT (subject to these policies) or a `service_role` key (bypasses RLS). Unchanged from v1.
5. **No impact to any public-facing page** — confirmed by grep that only the four CMS files write to these 12 tables (plus JS `Set.delete()` calls elsewhere, unrelated to Supabase).
6. **`product_images` read tightening (new in v2) — checked, no impact.** `useProducts.ts`/`useProduct.ts` always join `product_images` through `products` in the same query (nested select), so a hidden parent product never surfaces its images via those hooks either way. `grep -rn "from(\"product_images\")\|from('product_images')" src/` finds exactly one standalone (non-joined) query: `ProductEditor.tsx:182`, `select("id, url, sort_order, is_primary").eq("product_id", productId)` — this runs only inside the authenticated CMS editor, on a `productId` the editor already loaded from the authenticated-visible catalog (itself gated by `"Authed read house + own brand products"`), so it resolves under the new `"Authed read images of house + own brand products"` policy exactly as before. No anon or public-page code fetches `product_images` outside a `products` join.
7. **No impact to `user_library_items`, `design_sessions`, `design_exports`, `customization_requests`, `editor_sessions`, or `flipbook_*`.**

## 6. Where the front end currently relies on the open policy

Unchanged from v1: `ProductEditor.tsx`, `ProductCatalogTab.tsx`, `TaxonomyTab.tsx`, `ImportTab.tsx` are the only consumers whose writes are affected. No public/anonymous page relies on the open write policy.

---

## Applying this migration

**File staged:** `supabase/migrations/20260903120000_catalogue_rls_hardening.sql` (contents identical to §4 above). This follows the same convention as every other file in `supabase/migrations/`.

**What could not be done from this environment:** this repository has no Supabase CLI installed, no linked Supabase project session, no `SUPABASE_SERVICE_ROLE_KEY`, and no Postgres connection string available locally — `.env` contains only `VITE_SUPABASE_URL` and the anon/publishable key (`VITE_SUPABASE_PUBLISHABLE_KEY`), which cannot execute DDL or create RLS policies against project `otkuqwpsgxzlaxbclbfi`. I could not execute this migration against the live database, and have not attempted to. The file is staged and ready; it needs to reach the live project through whatever path this repo's other 18 migrations got there (Lovable's own sync on push/deploy, `supabase db push` from a linked CLI session, or pasting into the Supabase SQL editor).

**`catalogue_editors` seeding:** not included in the staged file — pending the two account identifiers.
