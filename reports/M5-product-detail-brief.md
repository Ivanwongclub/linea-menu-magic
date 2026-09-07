# M5 — Product detail page

Build brief for Claude Code. WIN-CYC catalogue restructure, module 5 of 6, and
the last of the build.

M1 (schema), M2 (data), M3 (the /admin CMS, phases 1–8) and M4 (public catalogue)
are complete and live.

---

## Where things stand

- 46+ published products on the new taxonomy, 5 families, 25 categories
- 135 finishes, 35 currently public, with a working swatch renderer
- Typed product fields, size variants, colours, finishes, images — all editable
  in the CMS
- The product detail page has not been touched since this project began

`ProductDetail.tsx` still renders the JSON `specifications` blob, still reads
`pdpSeedData.ts` fallbacks, and still shows a single image. Everything the CMS
now stores is invisible on the page that customers actually read.

---

## Step 1 — Remove the fabricated content

`pdpSeedData.ts` and `pdpSeedImages.ts` supply invented specifications and images
to 19 product slugs, unconditionally, on the public route `/products/:slug`.
P20 established this reaches production.

Delete both files and every consumer. A field with no value renders as absent —
never as a fabricated placeholder.

Before deleting, report which of the 19 slugs still exist and whether any live
product would lose its only image, so we know what breaks.

Note: M4 updated `pdpSeedImages.categoryFallbacks` to the new slugs as a stopgap.
That goes too. The replacement for a product with no images is a neutral
placeholder, not a category-guessed photograph.

---

## Step 2 — Retire the legacy override columns

`name_en` and `description_en` are written on every save purely to keep the
storefront's `name_en ?? name` working. The trilingual migration made `name` the
English base.

Change the storefront to read `name` / `name_zh_hant` / `name_zh_hans` through
the same `localizedName` helper the rest of the app uses, then stop writing the
legacy columns in the CMS. Leave the columns in place — dropping them is a
separate decision.

---

## Step 3 — The image gallery

- Hero image with a thumbnail strip below it, click to swap.
- Click the hero to open a lightbox with zoom. Trim buyers examine surface
  texture and edge finish closely; a 600px image does not let them.
- Order and primary come from `product_images.sort_order` and `is_primary`.
- `alt_text` is used, not ignored.
- Degrade cleanly to a single image, and to a neutral placeholder with no images
  at all. Do not render an empty thumbnail strip. Many products have no
  photography.
- Serve through `getProductImageUrl` so the render/image transform path is used.

Remove the "MATERIALS" stock-texture card. A generic brushed-metal photograph
captioned "Metal" tells a buyer less than the word "Metal" alone.

---

## Step 4 — The specification table

Replace the JSON dump with the typed fields.

**Overview block** — stop repeating the table below it. Cut Material, Finish,
Size and Weight. Keep MOQ and Lead Time, which appear nowhere else and are the
first things a buyer scans for. Add `item_code`.

**Technical Specifications** — Material, Attachment, Face style, Hole count,
Logo customisable, Tensile strength, Wash resistance, Origin, Sample time,
Nickel release compliance, and compliance standards as badges.

Render a field only when it has a value. Most products will show few — that is
honest, and it is what the CMS exists to fix.

---

## Step 5 — Size selector

- A control listing the product's `product_size_variants`, defaulting to
  `is_default`.
- Selecting a size updates the displayed weight and thickness. These are
  properties of a size, never of a product.
- Show `size_ligne` alongside millimetres where present, and `size_label` for
  non-round hardware.
- Hide the whole control when a product has no size variants.

---

## Step 6 — Colour and finish

Branch on the product's material, the same rule the CMS and the database triggers
use.

**Metal products** — swatch row of the attached public finishes, rendered
through the shared `src/features/finishes` module. Each swatch shows its
marketing name and CYC code. The default finish is selected on load. Selecting a
finish updates the displayed finish name and code; it does not swap the hero
image, since per-finish photography does not exist.

**Non-metal products** — the `product_colours` list, rendered as named chips with
their hex.

**Neither** — render nothing. No empty section, no placeholder.

Add a line stating that swatches are indicative and physical samples are
available. The swatch colours are computed approximations, and a buyer who
approves rose gold from a rendered gradient is a returns problem.

---

## Step 7 — Brand-scoped products

A product with `brand_id` set is visible only to that brand's members. Confirm
the PDP handles this: a brand member sees it normally, everyone else gets a
not-found page rather than a partially-rendered one or an error.

---

## Constraints

- Do not change the schema. Report anything missing rather than adding a
  migration.
- Do not change the CMS beyond Step 2's stop-writing-legacy-columns.
- Keep the page working for products with almost no data. That is the common
  case: 41 of 65 house products have no images, and most have no size variants,
  finishes or typed specs yet.
- Verify with the harness. Include a product with full data and a product with
  only a name and category, and confirm both render sensibly.

---

## Report before building

1. Which of the 19 seed-data slugs still exist, and what any of them would lose.
2. Everything that reads `specifications` or `production` JSON outside
   ProductDetail, since those consumers need the same treatment or an explicit
   decision to leave them.
3. What the page looks like for a product with no images, no sizes, no finishes
   and no typed specs — the majority case today.
4. Your proposed build order.

Do not start until that report is reviewed.
