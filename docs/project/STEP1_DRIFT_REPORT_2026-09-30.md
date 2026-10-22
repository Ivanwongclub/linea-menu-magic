# Step 1 hosted/local schema and security drift report

**Date:** 2026-09-30
**Repository:** `linea-menu-magic`
**Supabase project ref:** `otkuqwpsgxzlaxbclbfi`
**Scope:** read-only reconciliation of local migrations, the legacy workspace tables, Designer Studio tables, RLS intent, and editor storage paths.

## Authority and evidence boundary

The hosted Supabase evidence supplied for this review describes current live behavior. Repository migrations are the controlled source for future schema changes after drift is reconciled. No hosted query, SQL write, migration, policy change, Docker operation, or application-code change was made during this review.

The hosted facts below are supplied evidence, not an independently queried catalog: the local Supabase CLI remains unauthenticated (`LegacyPlatformAuthRequiredError: Access token not provided`). Consequently, this report can prove ledger/version and policy contradictions against the supplied evidence, but cannot prove whether a missing migration was manually applied outside the ledger or whether the hosted grants/schema happen to be equivalent.

Supplied hosted evidence:

- migration ledger has 14 rows; latest version is `20260615193612`;
- RLS is enabled on all 55 listed public/storage tables;
- `design_sessions`, `design_layers`, and `design_exports` have permissive authenticated `ALL` policies with `USING (true)` and `WITH CHECK (true)`;
- `design-assets` is public and `design-uploads` is private.

## 2026-10-01 Lovable SQL Editor export supplement

The owner-supplied Lovable SQL Editor exports add the following hosted evidence. They are recorded as supplied evidence; no hosted query or write was performed here.

### Hosted grants and effective legacy policy shape

The full public-table grants export lists `authenticated` with `SELECT`, `INSERT`, `UPDATE`, and `DELETE` on each of `public.design_sessions`, `public.design_layers`, and `public.design_exports`. It also lists `TRUNCATE`; that is a catalog grant entry and is **not** described here as a normal Supabase REST API capability. Actual API exposure and runtime behavior for each role remain unverified.

For all three legacy tables, the policy export shows:

- a permissive `authenticated` `ALL` policy with `USING (true)` and `WITH CHECK (true)`; and
- a broad `authenticated` `SELECT` policy.

Together with the grants, this confirms that the hosted policy/grant configuration is broader than the repository’s final intended brand-scoped policy history. It does not by itself prove a public data breach: anonymous grants/policies, API gateway behavior, authenticated identity claims, and runtime role tests were not supplied. It also does not establish that `design-assets` contains any new-editor uploads.

### Hosted columns export and structural comparison

The hosted columns export confirms hosted structures for all eight requested tables. The local migration baseline used for comparison is recorded below; hosted runtime constraints, indexes, defaults, comments, triggers, and foreign-key actions still require a complete catalog export to verify independently.

| Table | Hosted/export-confirmed structural fields | Local migration baseline |
|---|---|---|
| `designs` | `id`, `name`, `product_id`, `source_asset_id`, `brand_id`, `owner_id`, `current_version_id`, `status`, `draft_recipe`, `draft_updated_at`, `created_at`, `updated_at` | Same fields in `20260917120000_designer_studio_phase1.sql`; local status check is `draft/submitted/quoted/approved/archived`; current-version FK is added after versions are created |
| `design_versions` | `id`, `design_id`, `version_number`, `label`, `recipe`, `snapshot`, `thumbnail_url`, `author_kind`, `created_by`, `created_at` | Same fields; local `author_kind` check is `buyer/staff`; `(design_id, version_number)` is unique; local policy makes versions immutable to clients |
| `design_shares` | `id`, `design_id`, `shared_with_user_id`, `can_edit`, `created_by`, `created_at` | Same fields; local `(design_id, shared_with_user_id)` is unique and both design and user reference `auth.users`/`designs` |
| `design_quotes` | `id`, `design_id`, `design_version_id`, `requested_by`, `requested_at`, `quantity`, `notes`, `status`, `responded_by`, `responded_at`, `response_notes` | Same fields; local status check is `pending/responded/accepted/declined`; design-version deletion is restricted |
| `design_assets` | `id`, `owner_id`, `brand_id`, `kind`, `storage_path`, `original_filename`, `mime_type`, `size_bytes`, `created_at` | Same fields; local kind check is `logo_svg/font/obj/texture`; owner and brand indexes are defined |
| `design_sessions` | `id`, `team_id`, `name`, `background_image_url`, `background_image_width`, `background_image_height`, `thumbnail_url`, `status`, `created_by`, `created_at`, `updated_at` | Same fields in `20260317180514_…sql`; `team_id` is text and the local policy hardening gates it through brand membership |
| `design_layers` | `id`, `session_id`, `product_id`, `layer_order`, `name`, `image_url`, `x`, `y`, `scale`, `rotation`, `opacity`, `flip_x`, `flip_y`, `is_visible`, `is_locked`, `created_at` | Same fields; session deletion cascades and product deletion sets `product_id` null |
| `design_exports` | `id`, `session_id`, `export_url`, `export_type`, `created_at` | Same fields; `export_type` defaults to `png`; session deletion cascades |

The columns evidence therefore removes the earlier uncertainty about whether the eight named hosted tables are structurally present: the hosted export confirms them. It does not prove that the Phase 1 migration ran through the hosted ledger, because the supplied ledger still ends at `20260615193612`; it also does not prove full constraint/policy/grant equivalence for the five new tables.

The hosted columns/grants exports do not establish actual Supabase REST exposure, PostgREST role switching, or behavior for anonymous, outsider, member, manager, catalogue-editor, or staff identities. Those remain role-test gaps. No conclusion is made about which objects are stored in `design-assets`; local application tracing still maps new-editor logo uploads to `design-uploads`.

## 2026-10-07 CSV export supplement

The owner-supplied CSV exports add the following hosted evidence. They are recorded as observed database metadata, not as proof of object contents or runtime behavior.

### Constraints

The hosted database export reports **34 constraints** across the eight requested design tables: primary-key, foreign-key, `CHECK`, and `UNIQUE` constraints. These observed constraints must be preserved as PostgreSQL migration requirements for any future RDS migration. The RDS work should reproduce the observed constraint names/semantics and validate them against the application’s write paths before deployment.

The export does not show a database constraint proving that `design_quotes.design_version_id` belongs to the same `design_id` as the quote, nor a constraint proving that `designs.current_version_id` belongs to that design. This is not classified as a defect: application-level enforcement, triggers, or other runtime checks were not included in the export and remain unverified.

### Storage policies

The `storage.objects` policy export reports public `SELECT` policies for `design-assets`, `flipbook-assets`, `product-assets`, and `product-models`.

- `design-assets` and `flipbook-assets` authenticated upload/update/delete policies check only `bucket_id`; the export shows no owner or path predicate in those policy expressions. These rules require explicit role testing before any security conclusion is made.
- `design-uploads` uses first-folder-segment checks. Reads allow the object owner, a user with the relevant brand access, or designer staff. Writes allow the object owner, a brand manager/owner, or designer staff.
- Product asset/model writes are limited to catalogue editors, consistent with the observed product storage policy shape.

The CSV exports do not show object contents and do not prove runtime behavior, PostgREST exposure, signed-URL behavior, or effective role switching. No confirmed breach is claimed. No policy change is recommended from these exports alone. In particular, the public `design-assets` policy does not establish that new-editor uploads are present there; local application tracing still maps new-editor logo uploads to `design-uploads`.

## Local migration inventory and version comparison

The local repository contains 34 migration files. Their filename/version inventory is:

```text
20260313092451_1e39707c-3bcf-4b54-bfdf-0b0baa809b01.sql
20260313100725_c773c122-b8be-4000-b135-145f58c642cb.sql
20260316105420_813b4c53-72ea-4da3-9d5a-b4c8ed20e720.sql
20260316105731_9ce1cbd3-4158-4087-9633-29138a5403c4.sql
20260316153312_98ff5378-b30a-469d-b99d-54bb656f4c02.sql
20260317180514_40ab507c-760a-4751-b4f1-7135568d1dde.sql
20260317183813_51eed257-2138-462a-9856-5ecc6c145dec.sql
20260317184925_7f2410ed-5015-49e5-9718-82b4f6b76380.sql
20260322033244_1fe0fb83-4c7b-4125-8fd1-ece754b919dd.sql
20260414175102_8877a0aa-8e5a-48c8-a039-541ee0f13383.sql
20260422182607_d0d7b60f-2b15-4f33-95c0-8335ad14d795.sql
20260422192314_9de125c2-55ff-4293-9b8a-bc81b135e1c9.sql
20260423090500_5f4de5d0-24b3-4ac5-9f95-a59fef6a18dd.sql
20260608111030_942289fc-5040-40c4-b74f-753a0b8c1e7a.sql
20260611120000_harden_editor_sessions.sql
20260611130000_rename_button_remove_ugly_models.sql
20260615120000_workspace_role_and_team_hardening.sql
20260615193616_d57be32f-3a77-484d-a8ed-5b7bab98235c.sql
20260903120000_catalogue_rls_hardening.sql
20260903130000_catalogue_schema_m1.sql
20260903170000_catalogue_data_m2.sql
20260903180000_taxonomy_is_active.sql
20260904090000_finish_axes_zh_hans.sql
20260904120000_products_trilingual.sql
20260904150000_finish_material_params.sql
20260905120000_remap_house_products.sql
20260917120000_designer_studio_phase1.sql
20260917150000_phase2_retire_editor_sessions.sql
20260917180000_phase3b_metal_reflectance.sql
20260917210000_phase3c_painted_antique_calibration.sql
20260917230000_phase3d_hue_only_calibration.sql
20260918090000_phase3e_chroma_gated_calibration.sql
20260918100000_phase4_0_carried_finish_items.sql
20260918110000_phase4a_model_scale.sql
```

Version conclusion:

| Evidence | Finding | Status |
|---|---|---|
| Hosted ledger: 14 rows, latest `20260615193612` | Exact hosted 14-version filename list was not supplied | Exact one-to-one ledger comparison remains pending read-only hosted access |
| Local `20260615193616_…sql` | Numerically later than hosted latest; it has no references to the seven target design tables | Local history diverges from the supplied hosted ledger boundary |
| Local `20260917120000_designer_studio_phase1.sql` | Four months later than hosted latest and explicitly identified by local project docs | Absent from the supplied hosted ledger |
| Local migrations through `20260918110000` | Additional local-only versions follow Phase 1 | Also absent from the supplied hosted ledger |

The supplied evidence therefore establishes that the local Phase 1 migration is not present in the reported hosted migration history. It does **not** distinguish among “not applied,” “applied outside the migration ledger,” or “recreated manually with equivalent objects.” That distinction requires hosted catalog inspection of the tables, columns, constraints, functions, policies, grants, buckets, and migration ledger itself.

## SQL comparison for the requested tables

### Legacy workspace tables

The target legacy tables are created in `20260317180514_40ab507c-760a-4751-b4f1-7135568d1dde.sql`:

- `design_sessions`: UUID key; `team_id text not null`; name, background image URL/dimensions, thumbnail, status, creator, timestamps. RLS enabled. Initial authenticated read and `ALL` policies are `USING (true)` / `WITH CHECK (true)`.
- `design_layers`: UUID key; `session_id` cascades to `design_sessions`; product, ordering, transform, visibility, and lock fields. RLS enabled. Initial authenticated read and `ALL` policies are broad true predicates.
- `design_exports`: UUID key; `session_id` cascades to `design_sessions`; URL/type/timestamp. RLS enabled. Initial authenticated read and `ALL` policies are broad true predicates.

The policy history is explicit:

1. `20260317184925_7f2410ed-5015-49e5-9718-82b4f6b76380.sql` added anonymous public read and manage policies for all three tables.
2. `20260422182607_d0d7b60f-2b15-4f33-95c0-8335ad14d795.sql` dropped those anonymous policies.
3. `20260423090500_5f4de5d0-24b3-4ac5-9f95-a59fef6a18dd.sql` replaced the broad authenticated policies with per-operation policies gated by `user_has_brand_text(auth.uid(), team_id)` for sessions, and by the parent session’s team membership for layers and exports.
4. `20260615120000_workspace_role_and_team_hardening.sql` dropped any leftover anonymous policies and revoked all privileges on the three tables from `anon`; it leaves the brand-scoped authenticated policies as the intended enforcement layer.

This local end state does not match the supplied hosted evidence of permissive authenticated `ALL` true policies. Because PostgreSQL permissive policies are OR-combined, any such true policy defeats narrower policies for the same role and operation, subject to the role’s table grants. This is an effective-access contradiction, not merely a naming difference.

### Designer Studio tables

`20260917120000_designer_studio_phase1.sql` is the only local migration that creates the requested new tables:

| Table | Local SQL shape and intended ownership | Local RLS/grants |
|---|---|---|
| `designs` | Owner, optional `brand_id`, product/source asset, status, draft recipe, current version | Authenticated select for owner/brand/shared/staff; insert/update for owner, brand manager/owner, or designer staff; no client delete (archive instead) |
| `design_versions` | Immutable named/event snapshots tied to a design; author and version number | Select through design visibility; insert for owner/brand manager/owner/staff; no update/delete policy |
| `design_assets` | Reusable owner/brand-scoped `logo_svg`, `font`, `obj`, or `texture`; private storage path | Select for owner/brand/staff; insert/update/delete for owner/brand manager/owner/staff |
| `design_quotes` | Design/version quote request; owner/brand member creates; staff responds | Select through design visibility; insert for owner/brand member/staff; update for designer staff only |
| `design_shares` | Design recipient plus `can_edit`; unique design/recipient pair | Recipient or design owner/brand manager/staff can read; owner/brand manager/staff can insert/delete |

The migration revokes these new tables from `anon`, grants only the listed authenticated operations, and grants service role full access. It also creates `designer_staff`, `user_is_designer_staff`, `user_has_brand_role`, and `user_has_design_share` helpers. `20260918110000_phase4a_model_scale.sql` only extends the documented `design_versions.snapshot` shape; it does not establish Phase 1 in the hosted ledger.

No local migration after Phase 1 was found to create or replace any of the seven requested tables. `20260917150000_phase2_retire_editor_sessions.sql` is a separate later migration and does not make the Phase 1 ledger discrepancy disappear.

### Reconciliation result

The requested schema is **not reconciled** from the available evidence:

- `design_sessions`, `design_layers`, and `design_exports` exist in local history and their intended final policies are brand-scoped, but hosted evidence says broad authenticated access remains effective.
- `designs`, `design_versions`, `design_assets`, `design_quotes`, and `design_shares` are introduced by the local Phase 1 migration, whose version is later than the supplied hosted latest. Their hosted presence, columns, constraints, grants, and policies are unknown.
- The Phase 1 migration may have been applied manually or through another deployment path, but there is no evidence here to claim that it was.
- RLS enabled on 55 hosted tables confirms row-security is on, not that the effective policy set is restrictive or matches local SQL.

## Local application use and ownership intent

The legacy composer uses the three broad-policy tables in:

- `src/pages/DesignerStudioWorkspace.tsx` and `src/features/designer/pages/ComposerPage.tsx` for session selection, updates, background uploads, exports, and share state;
- `src/features/designer/hooks/useDesignSessions.ts`, `useDesignSession.ts`, and `useDesignExports.ts` for session, layer, and export reads/writes;
- `src/features/designer/components/ComposerSessionList.tsx` and `src/components/designer-studio/CompositionPickerDialog.tsx` for session lists and picker flows.

The intended owner is the authenticated user’s brand/team composition. The app adds `.eq('team_id', teamId)` to important session updates, but that client filter is only defense in depth; the local intended security boundary is the database brand-membership predicate.

The new editor code uses the Phase 1 tables from `src/features/editor` and the Designer Studio design pages. `designs` and versions are owned by the authenticated designer or staff; brand managers/owners have brand-scoped control; shares grant visibility to a recipient; assets are reusable owner/brand resources; quotes are buyer/brand requests with staff response. This ownership model is materially narrower than a blanket authenticated `ALL` policy on the legacy tables.

## Access matrix

The “hosted evidence” column is deliberately limited to what was supplied. For the legacy tables, a true authenticated policy means the policy predicate allows every row/operation for any role that has the underlying table grant; exact grants and role-specific tests remain unresolved.

| Persona | Hosted evidence for legacy tables | Local intended legacy access | Local intended new-editor access | Unresolved |
|---|---|---|---|---|
| Anonymous | No hosted anon policy/grant evidence supplied | Denied after anon policy removal/revoke | Denied by explicit revoke | Hosted anon grants/policies |
| Authenticated outsider | Broad authenticated true policy would allow all rows/operations if granted | Denied for another brand’s `team_id` | Denied unless explicit share/visibility applies; no write | Hosted grants and actual role test |
| Authenticated brand member | Broad true policy is broader than intended | Full CRUD for own brand/team rows | Read visible brand/owned/shared designs; create quotes; owner writes | Hosted effective combination and membership mapping |
| Brand manager/owner | Same broad policy evidence | Own brand/team CRUD | Brand-scoped design/version/asset/share operations | Hosted role grants and role helper state |
| Catalogue editor | No evidence this role changes legacy access | Only if separately a brand member | No design-table special grant; may write `product-models` storage | Hosted catalogue-editor grants/policies |
| Designer staff/staff | No evidence of a separate staff policy on legacy tables | Legacy access still depends on brand predicate | Global new-editor access where local staff helper applies; staff quote updates | Hosted staff role/helper and table grants |

No policy should be dropped or retained as a final decision from this matrix alone. The next decision requires effective grants, product intent, and authenticated role tests for anonymous, outsider, member, manager, catalogue-editor, and staff identities.

## Storage and editor upload map

| Application path | Bucket | Object path | Local/hosted visibility evidence |
|---|---|---|---|
| Legacy composer background in `src/features/designer/pages/ComposerPage.tsx` | `design-assets` | `backgrounds/<session-id>/<timestamp>-<filename>` | Local bucket is public; hosted evidence says `design-assets` public. Composer stores a public URL in `design_sessions.background_image_url`. |
| Legacy composer PNG export in `ComposerPage.tsx` | `design-assets` | `exports/<session-id>/<timestamp>.png` | Same public bucket; export upload is a storage side effect and is not recorded in `design_exports` in this path. |
| New editor logo/raster upload in `src/features/editor/hooks/useLogoUpload.ts` | `design-uploads` | `<brand-id-or-owner-uid>/logos/<asset-id>.<svg\|png\|jpg\|bin>` | Local bucket is private and path-scoped; hosted evidence says private. The upload is followed by a `design_assets` row. |
| CMS product image/thumbnail upload in `src/components/designer-studio/products/ProductEditor.tsx` | `product-assets` | `images/<product-id>/<timestamp>.<ext>` and `thumbnails/<product-id>/<timestamp>.<ext>` | Public product media path; not the private Designer Studio asset bucket. |
| Product OBJ/model upload in `src/features/admin/hooks/useProductModel.ts` | `product-models` | `models/<product-id>/<timestamp>.obj` | Local Phase 1 bucket is public-read and catalogue-editor write/update/delete. Hosted bucket policy was not independently queried. |
| Flipbook image upload in `src/features/flipbook/upload.ts` | `flipbook-assets` | Flipbook helper-defined path | Separate flipbook flow, not a Designer Studio design asset; included to avoid conflating editor-adjacent uploads. |

The new editor’s private upload path is therefore `design-uploads`, while the legacy composer’s public background/export path is `design-assets`. Product models and CMS product media use separate buckets and must not be treated as evidence that Phase 1’s private design asset policy is live.

## Required next read-only evidence

To close Step 1 without making hosted changes, obtain read-only access for project `otkuqwpsgxzlaxbclbfi` sufficient to inspect:

1. `supabase_migrations.schema_migrations`, including all 14 hosted versions and names;
2. `pg_class.relrowsecurity`, `pg_policies`, and policy permissiveness/roles/expressions for all requested tables;
3. `information_schema.table_privileges` or equivalent effective grants for `anon`, `authenticated`, and `service_role`;
4. columns, constraints, indexes, and helper functions for the five Phase 1 tables;
5. `storage.buckets`, `storage.objects` policies, and bucket visibility for `design-assets`, `design-uploads`, `product-models`, and `product-assets`;
6. edge-function deployment/configuration metadata without reading secrets;
7. controlled role fixtures or safe read-only role tests for the six personas in the matrix.

Until those reads are available, the safe conclusion is hosted/local drift with unresolved outside-ledger/manual-equivalence status. No SQL or policy remediation is recommended in this report.
