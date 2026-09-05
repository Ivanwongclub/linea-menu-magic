# M4 — Public catalogue on the new taxonomy

Build brief for Claude Code. WIN-CYC catalogue restructure, module 4 of 6.
M1 (schema), M2 (data) and M3 (the /admin CMS) are complete and live.

---

## Where things stand

- 5 families, 25 active categories, 20 old categories deactivated but retained
- 135 finishes with derived material parameters and a working swatch renderer
- 64 active house products, 24 Polo Ralph Lauren products, 25 draft seeds
- The public site still renders the OLD taxonomy from hardcoded config

The public catalogue has not been touched since this project began. Everything on
`/products` today reads `taxonomy.ts`, `Header.tsx`'s `MEGA_FAMILIES`, and
`useProducts.ts`'s `SEGMENT_TO_FAMILIES` — three sources that disagree with each
other and with the database.

---

## Step 0 — Relax the seed publish guard

Currently the product editor hides Publish on any `slug like 'sample-%'` product.
That was correct when all 25 were empty placeholders. Five now have item codes and
are being published deliberately.

Change the guard from a block to a warning: keep the explanatory note, keep the
bulk actions skipping seeds, but allow an individual seed to be published from the
editor after a confirmation dialog that says it will appear on the public site.

---

## Step 1 — One source of truth for the taxonomy

Delete the hardcoded trees. All of them.

- `src/features/products/taxonomy.ts` — `PRODUCT_FAMILIES`, `PRODUCT_SEGMENTS`,
  `PRODUCT_SEGMENT_DETAILS`
- `Header.tsx` — `MEGA_FAMILIES`, `MEGA_GRID_ITEMS`
- `useProducts.ts` — `SEGMENT_TO_FAMILIES`, including its dead `fashion` key

Replace with a single hook reading `product_families` and `product_categories`,
consumed by the sidebar, the mega-menu, and the filter logic. Grep for hardcoded
category slugs anywhere else in `src/` and report what you find before changing it.

Names come from the database in the current interface language, falling back
through the other Chinese script to English — the same `localize` helper the admin
module uses.

---

## Step 2 — Remap the existing products

64 active house products carry old category assignments. The mapping:

| Old category | Count | New category |
|---|---|---|
| Buckles, Toggles, Cord Ends, Cord Stoppers | 11 | Buckles & Cord Locks |
| Zipper Pullers | 9 | Zipper Pullers & Sliders |
| Eyelets, Rivets, Hook & Eyes | 6 | Eyelets & Rivets |
| Snap Buttons, Jeans Buttons | 5 | Snap Fasteners & Jeans Buttons |
| Webbing, Polypropylene & Cotton/Poly/TC Webbing | 4 | Polypropylene & Cotton/Poly/TC Webbing |
| Badges | 2 | Metal Pendants & Custom Brand Badges |
| Buttons, Shank Buttons | 13 | Metal & Shank Buttons — see note |

**The 13 buttons are parked, not classified.** Nothing in the data distinguishes
polyester from horn from metal, so they all go to Metal & Shank Buttons and
WIN-CYC re-sorts them in the CMS. Do not guess from product names.

**Hook & Eyes goes to Eyelets & Rivets, NOT Hook & Loop.** Garment hook-and-eye
closures are metal fasteners; Hook & Loop is velcro. This is a false-friend name
match the audit flagged.

**15 products have no home** — Other (10), Beads (2), Drawcords (2), Hardware (1).
Archive them: `status = 'archived'`, `is_public = false`. They are not deleted and
their images stay in storage.

Write this as a migration for review before applying. It changes live customer-
facing data.

**The archive step must carry `and brand_id is null`.** Polo Ralph Lauren's
products are a customer's catalogue and are never archived by us. This was the
blocking defect in M2's first draft.

---

## Step 3 — The sidebar and mega-menu

- Sidebar renders 5 families and 25 categories from the database
- Categories with zero published products are hidden from the public menu and
  sidebar automatically
- Product counts per category come from actual published products
- The mega-menu reads the same source

Empty-category hiding matters here: 18 of 25 will have nothing in them at launch.
Two entire families — Laces & Ribbons, and Zippers apart from pullers — will be
empty. The structure is correct and the content is a dependency on WIN-CYC.

---

## Step 4 — Finish facet filters

Add the eight finish axes as filters on `/products`, using the same
`useFinishFilter` hook the CMS picker uses. A product matches if any of its
attached finishes matches.

Only show the facet rail when the current category selection contains metal
products — the axes are meaningless when browsing lace.

---

## Step 5 — Fix the broken links

`Footer.tsx` and `home/ProductCategories.tsx` use hash-fragment links that filter
nothing. Replace with working query-string filters against the new categories.

---

## Constraints

- Do not touch the Designer Studio beyond what a taxonomy change forces
- Do not touch `pdpSeedData.ts` or `pdpSeedImages.ts` — M5 removes them, and
  removing them now breaks the live PDP
- Do not change the product detail page — that is M5
- Run `npm run e2e:types` after any migration
- Verify with the harness, including an anonymous read confirming archived and
  draft products do not appear

---

## Report before building

1. Every hardcoded category slug you found outside `taxonomy.ts`
2. What breaks in the Designer Studio when `taxonomy.ts` is deleted
3. The remap migration, for review, not applied
4. Your proposed build order

Do not start until that report is reviewed.
