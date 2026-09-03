# M3 — /admin CMS

Build brief for Claude Code. WIN-CYC catalogue restructure, module 3 of 6.
M1 (schema) and M2 (data) are live. Nothing in this module changes the database.

---

## Context you need before starting

Read these first:
- `reports/P20-catalogue-restructure-audit.md` — why the current editor is being replaced
- `supabase/migrations/20260903130000_catalogue_schema_m1.sql` — the schema you are editing against
- `supabase/migrations/20260903170000_catalogue_data_m2.sql` — what data exists

Live state:
- `catalogue_editors` table gates all catalogue writes. `user_is_catalogue_editor(uuid)`
  is the predicate. One account is currently granted.
- 5 families, 25 active categories, 135 finishes (all `is_public = false`),
  25 draft seed products, 19 materials, 6 attachments, 5 compliance standards,
  8 finish axis tables.
- The existing 60 house products and ~28 Polo Ralph Lauren products remain
  `status = 'active'`. They are NOT to be touched by this module.

---

## Scope

Build a new admin CMS at `/admin`, separate from the Designer Studio.

Do NOT modify `src/components/designer-studio/products/*` in this module. The old
editor stays working until `/admin` is proven, then gets removed in a later pass.

---

## Requirements

### Route and access

- `/admin` with its own layout, not nested inside the Designer Studio.
- Its own login entry point. Staff and customers do not share a door.
- Access gated on a `catalogue_editors` row, NOT on brand membership. Do not
  reuse `RequireBrandAuth`.
- A user who is signed in but not a catalogue editor gets a clean "no access"
  page, not a broken screen or an infinite redirect.
- The database already enforces this. The route gate exists so people see a
  sensible message, not as the security boundary.

### Product editor

Every field is edited through a control matching its type. There is no free-text
key/value editor anywhere in this module.

**Identity:** `name`, `slug`, `item_code`, `description`, `status`, `is_public`

**Classification:** `category` (select, grouped by family), `material_id` (select),
`attachment_id` (select)

**Physical:** `face_style`, `hole_count`, `logo_customisable`

**Commercial:** `moq_qty` + `moq_unit`, `lead_time_min_days` + `lead_time_max_days`,
`sample_time_days`, `origin`

**Technical:** `tensile_strength`, `wash_resistance`, `nickel_release_compliant`,
compliance standards (multi-select into `product_compliance_map`)

**Size variants:** repeatable rows into `product_size_variants` —
`size_primary_mm`, `size_secondary_mm`, `size_label`, `weight_g`,
`thickness_mm`, one row flagged `is_default`. `size_ligne` is a generated column:
display it, never let it be edited.

**Colour, conditional on material:**
- If the product's material has `is_metal = true` → show the finish picker
  (below) writing to `product_finishes`, plus a `default_finish_id` selector
  limited to the finishes already attached.
- If `is_metal = false` → show a simple repeatable colour list writing to
  `product_colours` (name, zh_hant, zh_hans, hex).
- If no material is set → show neither, with a line explaining that material
  must be set first.

The database enforces this with triggers. If a write is rejected, surface the
error message rather than a generic failure — the trigger messages are written
to be read by a human.

**Publishing** is an explicit action, not a dropdown buried in a form. A product
cannot be published without an `item_code`; the database constraint
`published_needs_item_code` will reject it. Check before submitting and tell the
user what is missing.

### Finish picker

Used inside the product editor to attach finishes to a metal product.

- Shows finish swatches in a grid, using `hex_approx` until `swatch_url` exists.
- Filter rail down the side driven by the eight axis tables: process, base
  family, surface, tone, effect, tint, coating, pattern.
- Filters are rendered from whatever rows exist in those tables. Do not hardcode
  any axis value anywhere — admins can add new ones.
- Counts update as filters narrow, as in a normal faceted search.
- Free-text search over `cyc_code`, `factory_name_en` and `marketing_name`.
- Clicking a swatch toggles attachment. Attached finishes are reorderable.

### Finish manager

A separate screen for maintaining the 135 records themselves.

- Same facet filtering and search as the picker.
- Editable per finish: `marketing_name`, `marketing_name_zh_hant`,
  `marketing_name_zh_hans`, `swatch_url`, `hex_approx`, `status`, `is_public`,
  `notes`, `sort_order`.
- Read-only, clearly shown as such: `cyc_code`, `factory_name_en`,
  `factory_name_zh_hant`, `chart_page`. A trigger blocks changing `cyc_code`
  once set.
- Bulk toggle of `is_public` across a filtered selection. WIN-CYC needs to mark
  their sellable range and doing it 135 times individually will not happen.
- Create a new finish. `cyc_code` is optional but if omitted, `is_standard` must
  be false — there is a check constraint. Make this legible in the form rather
  than letting the constraint fire.

### Taxonomy manager

- Families: create, rename (all three languages), reorder, set segment, archive.
- Categories: same, plus reassign to a family.
- Materials: same, plus the `is_metal` flag — make clear in the UI that this
  controls whether finishes can be assigned.
- Attachments and compliance standards: same pattern.
- Finish axes: all eight, create/rename/reorder/deactivate.
- Deleting an axis value that is in use will be refused by the database
  (`ON DELETE RESTRICT`). Catch it and say how many finishes use it.
- `code` fields are immutable once set — a trigger enforces it. Show them as
  read-only after creation.

### Product list

- Table view, filterable by family, category, status, material.
- Shows `item_code`, name, category, status, `is_public`.
- Bulk status change and bulk publish.
- Clear visual distinction between draft, active and archived.

### Language

Every name field with `_zh_hant` / `_zh_hans` columns is edited side by side with
its English equivalent, in one form. Do not build a separate translation screen.

---

## Constraints

- Do not modify the Designer Studio or the public product pages. M4 and M5 cover
  those.
- Do not change any database schema. If you find something missing, report it
  rather than adding a migration.
- Do not touch `pdpSeedData.ts` or `pdpSeedImages.ts` — they are removed in M5,
  and removing them now breaks the live PDP.
- Regenerate `src/integrations/supabase/types.ts` from the live schema before
  starting. M1 added a lot of columns.

---

## Before you write code

Report back on:

1. Your proposed route and file structure for `/admin`.
2. How you intend to gate the route, given `catalogue_editors` is readable only
   as one's own row (a user can check whether *they* are an editor, and nothing
   else).
3. Which existing components can be reused as-is (form primitives, table, toast)
   versus what needs building.
4. Anything in the requirements above that conflicts with what is actually in the
   codebase, or that you think is the wrong design.
5. A proposed build order, so this lands in reviewable pieces rather than one
   large drop.

Do not start building until that report is reviewed.
