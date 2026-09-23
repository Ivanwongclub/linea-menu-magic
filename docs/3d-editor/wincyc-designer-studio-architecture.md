# WIN-CYC Designer Studio — 3D Editor Architecture and Product Design

A build brief for a new session. Self-contained: assumes no knowledge of prior
conversations.

Companion documents:
- `wincyc-3d-editor-axis-design.md` — the axis model and how the finish
  catalogue feeds the editor
- `wincyc-3d-editor-v3-review.md` — UX critique of the capability summary
- `web_based_obj_editor_capabilities_summary_v3.md` — the geometry engineering

This document covers what those do not: where the editor lives, what it stores,
who may do what, and how a design survives being saved, shared, versioned and
quoted.

---

## Part 1 — The stack question, answered

### Short answer: same stack, no rewrite

The website runs on Lovable: Vite, React, TypeScript, Supabase, Tailwind,
shadcn/ui, TanStack Query. Every piece the editor needs is an npm package that
runs in that stack unchanged.

| Editor requirement | Fits Lovable's stack? |
|---|---|
| Three.js | Already a dependency — the existing 3D viewer uses r160 |
| React Three Fiber | It *is* React. No framework conflict |
| @react-three/drei | npm, React |
| three-mesh-bvh (fast raycasting) | npm, browser |
| three-bvh-csg (boolean ops) | npm, browser |
| Web Workers | Vite supports `new Worker(new URL(…), {type:'module'})` natively |
| OBJLoader, GLTF/STL exporters | Part of three.js examples |
| Zustand (editor state) | npm; coexists with TanStack Query |
| Font loading, glyph layout | FontLoader + custom code |
| File storage for OBJ, SVG, fonts | Supabase Storage — already in use |
| Auth, roles, row-level security | Supabase — already built for the catalogue |
| Save, versioning, archive | Postgres — already there |

Nothing here needs a server. CSG, glyph layout and export all run in the
browser, which is what the capability summary concluded and it is correct.

### Why a rewrite would be actively worse

The editor is not a standalone tool. It is a configurator over WIN-CYC's
catalogue, and that catalogue is already built in this codebase:

- 135 finishes with derived `metalness` / `roughness` / `anisotropy`
- The finish picker component with its eight filter axes
- The swatch renderer
- Products, size variants, materials with the `is_metal` gate
- Row-level security separating house products from each customer brand's

Rewriting the website in another stack means either rebuilding all of that, or
building an API layer between two applications and duplicating auth across them.
Both cost more than the problem they solve.

### The three real constraints, and their answers

**Bundle size.** Three.js plus the CSG and BVH libraries is roughly 900 KB
minified. A buyer browsing `/products` must not download it.

*Answer:* route-level code splitting. `React.lazy` on the editor route, which
the app already does for every other page. The catalogue's bundle does not
change.

**Heavy geometry blocking the UI.** A boolean subtraction on a dense mesh can
take seconds.

*Answer:* Web Workers for bake operations. Vite handles worker imports natively.
Live preview stays on the main thread using cheap approximations; the real CSG
runs in a worker only at bake.

**Lovable's AI authoring 3D code.** This is real and worth naming. Lovable is
good at React and forms and bad at glyph layout on a curved surface. That is a
constraint on *how you build*, not on what the stack can run.

*Answer:* Claude Code writes the editor. Lovable handles the surrounding app,
as it does today. This is already how the catalogue was built.

### Verdict

Same repo, same stack, new route. Not a separate application.

---

## Part 2 — Where it lives

### Route structure

```
/designer-studio                      existing workspace
/designer-studio/library              existing trim library
/designer-studio/composer             existing 2D brochure composer
/designer-studio/editor/:designId     NEW — the 3D editor
/designer-studio/designs              NEW — saved designs list
```

The editor is a surface within Designer Studio, not a replacement for it. The
existing composer lays trims out on a board; the editor configures one trim in
three dimensions. Different tools, same workspace, shared login.

### Two entry points

| Path | Who | What they see |
|---|---|---|
| From a catalogue product | Buyers | Product, finish, branding, quote. No scene tree. |
| From an uploaded OBJ | WIN-CYC staff, prospects with CAD | Full scene tree, cleanup, group selection, export |

This is the single most important interface decision. A garment buyer putting
their logo on a WIN-CYC button should never meet a 33-item group list. Same
engine, two surfaces.

---

## Part 3 — Data model

Five new tables. The existing `design_sessions` / `design_layers` /
`design_exports` serve the 2D composer and are left alone — conflating them
would tie two unrelated tools together.

### `designs`

The thing a user owns and returns to.

| Column | Notes |
|---|---|
| `id` | uuid pk |
| `name` | user-given, defaults from the product name |
| `product_id` | fk → products, null for an uploaded OBJ |
| `source_asset_id` | fk → design_assets, the uploaded OBJ when not from catalogue |
| `brand_id` | fk → brands, null for a WIN-CYC house design |
| `owner_id` | fk → auth.users, who created it |
| `current_version_id` | fk → design_versions |
| `status` | `draft` / `submitted` / `quoted` / `approved` / `archived` |
| `created_at`, `updated_at` | |

A design has exactly one product and many versions.

### `design_versions`

Immutable snapshots. This is where the reproducibility problem is solved.

| Column | Notes |
|---|---|
| `id` | uuid pk |
| `design_id` | fk → designs |
| `version_number` | int, monotonic per design |
| `label` | optional, e.g. "sent to Tiffany 12 Nov" |
| `recipe` | jsonb — the full configuration |
| `snapshot` | jsonb — denormalised copy of every referenced entity |
| `thumbnail_url` | rendered preview |
| `created_by` | fk → auth.users |
| `created_at` | |
| `is_autosave` | boolean |

**Why both `recipe` and `snapshot`.** The recipe references `finish_id`,
`product_id`, `size_variant_id`. Those rows can change — a marketing name is
edited, a finish is discontinued, a size variant is deleted. A version approved
in March must still show what was approved, in March's terms.

So the recipe keeps the ids, for linking and for re-quoting. The snapshot keeps
a frozen copy of the finish's name, code, hex and material parameters, the
product's name and item code, the size's measurements. Rendering uses the
snapshot. Links use the ids, and flag when the live row has diverged:

> This finish has been discontinued since this version was saved.

Without this, a customer opens an approved design a year later and sees
something different. That is the kind of failure that ends an engagement.

### `design_assets`

Uploaded files: logos, custom fonts, OBJ models.

| Column | Notes |
|---|---|
| `id` | uuid pk |
| `owner_id`, `brand_id` | who it belongs to |
| `kind` | `logo_svg` / `font` / `obj` / `texture` |
| `storage_path` | Supabase Storage |
| `original_filename`, `mime_type`, `size_bytes` | |
| `created_at` | |

Stored permanently until the owner deletes them, per the existing scope
decision. A brand's assets are reusable across their designs — a customer
uploads their logo once.

### `design_shares`

Explicit sharing beyond the owner and their brand.

| Column | Notes |
|---|---|
| `design_id`, `shared_with_user_id` | |
| `can_edit` | boolean |
| `created_by`, `created_at` | |

Keep this simple at v1. Brand membership covers most access; this is for
one-off cases such as showing a design to a colleague at another company.

### `design_quotes`

The output that matters.

| Column | Notes |
|---|---|
| `design_id`, `design_version_id` | the exact version quoted |
| `requested_by`, `requested_at` | |
| `quantity`, `notes` | |
| `status` | `pending` / `responded` / `accepted` / `declined` |
| `responded_by`, `responded_at`, `response_notes` | |

A quote is against a version, never against a design. The design keeps moving;
the quote does not.

---

## Part 4 — Roles and access

### The four roles

| Role | Mechanism | Can |
|---|---|---|
| Anonymous | none | Open the editor from a catalogue product, configure, see the result. Cannot save. |
| Brand member | `brand_memberships` | Everything above, plus save, version, share within their brand, request quotes |
| WIN-CYC sales | new `designer_staff` table, same shape as `catalogue_editors` | All of the above on any brand's designs; respond to quotes |
| Catalogue editor | `catalogue_editors` | Manage the catalogue itself; does not imply design access |

**Anonymous configuration is a deliberate recommendation.** A prospect who has
to sign up before seeing anything will not see anything. Let them configure,
then gate the save: "Sign in to save this design." The configuration survives the
sign-in via session storage.

If WIN-CYC objects on confidentiality grounds, the fallback is anonymous access
to a small demo set of products rather than the whole catalogue.

### Row-level security

The same two-tier pattern the catalogue uses, which is already proven:

```sql
-- designs: readable by owner, their brand, or staff
create policy "read own, brand, or staff" on designs
for select to authenticated using (
  owner_id = auth.uid()
  or (brand_id is not null and user_has_brand(auth.uid(), brand_id))
  or user_is_designer_staff(auth.uid())
  or exists (select 1 from design_shares s
             where s.design_id = designs.id
               and s.shared_with_user_id = auth.uid())
);
```

Versions, assets and quotes inherit visibility by joining back to their design —
the same shape as `product_images` joining to `products`. That pattern was
written and verified for the catalogue; reuse it rather than inventing a second
one.

**Important:** brand isolation is not cosmetic. Adidas must not see Nike's
designs, and the database must enforce that, not the interface.

---

## Part 5 — Saving, versioning and archiving

### Three kinds of save

**Autosave.** Continuous, debounced to a few seconds, writing to
`designs.current_version_id` with `is_autosave = true`. The user never loses
work and never presses a button.

**Named version.** Explicit. "Save version" with an optional label. Creates an
immutable row the user can return to. This is what happens before sending
something to a customer.

**Automatic version on significant events.** Requesting a quote, exporting, or
sharing all snapshot a version first, so there is always a record of exactly what
was sent.

### Version history

```
Tiffany Blue — shank button
  v4  current           2 hours ago     autosave
  v3  Sent to Tiffany   12 Nov          Leo
  v2  Deeper engraving  11 Nov          Leo
  v1  First draft       8 Nov           Leo
```

Each row: preview thumbnail, label, author, date. Actions: view, restore,
duplicate as new design, compare.

**Restore creates a new version rather than rewinding.** History is never
destroyed. v5 becomes a copy of v3's recipe, and v4 remains in the list.

**Autosaves are pruned.** Keep the last ten per design plus every named version
indefinitely. Otherwise a long editing session leaves hundreds of rows nobody
will read.

### Archive, not delete

`status = 'archived'`. Disappears from the default list, restorable, never
removed.

**A design with an accepted quote cannot be deleted at all**, only archived. It
is a commercial record.

Hard delete exists only for staff, on designs with no quote history, and it
cascades to versions and unshared assets.

---

## Part 6 — The quote flow

This is what makes the editor a business tool rather than a toy, and the
capability summary does not mention it at all — it ends at "export OBJ".

```
Buyer configures
      ↓
Request quote  →  version snapshotted, design status = submitted
      ↓
WIN-CYC sales sees it in a queue with the full spec:
      SKU · size · finish code · branding operations · depths · fill code
      ↓
Responds with price and lead time
      ↓
Buyer accepts  →  status = approved, spec sheet PDF issued
```

**The spec sheet is the deliverable.** A PDF carrying:

- Product name, item code, size in mm and ligne
- Finish: name plus its full axis description (process, base family, surface,
  tone), and the factory name in Chinese
- Each branding element: content, operation, depth, position, fill code
- Rendered views: top, angled, and a section showing relief depth
- The version number and date

A WIN-CYC production person receiving that needs no interpretation. The axis
description identifies the finish exactly — "Hanger plating · Nickel · Brushed"
is not the same finish as the roll-plated equivalent, and the sheet says so
without anyone quoting a catalogue code.

**No catalogue codes appear anywhere in the editor**, including search. The
interface speaks in names and axes; `finish_id` is stored in the recipe as the
link. See §12 of the axis document.

---

## Part 7 — Performance architecture

### Bundle

```
/products, /admin, everything else     unchanged
/designer-studio/editor                +~900 KB, lazy-loaded
```

`React.lazy` on the editor route. The three.js chunk loads when someone opens
the editor and never before.

### Rendering

- One neutral studio HDRI, fixed. Metals are unreadable without an environment
  map, and a varying one makes the same finish look different on different pages.
- `MeshPhysicalMaterial` driven by the finish record's three columns.
- `anisotropyRotation` for brushed finishes — that directional sheen is what
  distinguishes brushed from polished, and a scalar roughness cannot express it.

### Geometry

- `three-mesh-bvh` for raycasting. Essential for surface-conform and for hover
  highlighting at interactive rates.
- Live preview uses a cheap approximation: text as a separate floating mesh,
  no boolean. Visually close enough to judge position and size.
- Real CSG runs in a Web Worker, at bake, with a progress indicator. Users
  tolerate a wait they can see.

### Assets

- OBJ models in Supabase Storage, cached by the browser and by a CDN.
- Thumbnails rendered client-side at save and uploaded, so the design list does
  not need to instantiate WebGL for every row.

---

## Part 8 — Build sequence

Each phase ends in something demonstrable.

| Phase | Contents | Ends with |
|---|---|---|
| 1 | Schema, RLS, roles | Tables exist, policies verified |
| 2 | Editor shell, route, lazy load, catalogue entry | A product loads and renders in its default finish |
| 3 | Finish picker integration | Changing the finish changes the render |
| 4 | Text: content, font, straight and circular layout | Text sits on the button |
| 5 | Direct manipulation: drag to position, size, curve | The panel shrinks to four controls |
| 6 | Emboss and deboss via CSG in a worker | Real recessed geometry |
| 7 | Fill on deboss layers | Two-tone without CAD masks |
| 8 | Save, autosave, version history, restore | Work survives a reload |
| 9 | Archive, share, design list | A workspace rather than a single editor |
| 10 | Quote flow and spec sheet | The business output |
| 11 | Upload path: OBJ, scene tree, cleanup | WIN-CYC's own staff can use it |
| 12 | Export OBJ / GLB / STL | Secondary, for people who want geometry |

Phases 1–7 produce a usable configurator. Phases 8–10 make it a product. Phase
11 is the WIN-CYC-internal tool and depends on their CAD cooperation, which is
the one external dependency.

---

## Part 9 — Decisions needed before building

Each carries a recommendation. Accept the batch or override individually.

**1. Anonymous configuration.** *Recommend allow, gate the save.* A prospect
forced to register before seeing anything will not see anything. Fallback if
WIN-CYC objects: a demo subset of products.

**2. Autosave granularity.** *Recommend debounced continuous autosave, ten
retained per design, named versions kept forever.* Users should not have to
think about saving.

**3. Who may respond to quotes.** *Recommend a `designer_staff` table separate
from `catalogue_editors`.* Managing the product catalogue and quoting a customer
are different jobs; conflating them means every catalogue editor sees commercial
enquiries.

**4. Brand assignment on save.** *Recommend a design belongs to the creator's
brand automatically; staff choose explicitly.* A customer's design is their
brand's; a salesperson configuring for a prospect needs to say who it is for.

**5. Version snapshot depth.** *Recommend snapshotting product, finish, size and
fill in full.* Storage is cheap; a design that renders differently a year later
is not.

**6. Spec sheet format.** *Recommend PDF with rendered views.* It gets forwarded,
printed and attached to purchase orders. HTML does not survive that.

**7. Where the 2D composer sits.** *Recommend leaving it untouched.* Different
tool, different tables. Deciding whether the two eventually merge is a product
question for later, not an architecture constraint now.

---

## Part 10 — What depends on WIN-CYC

Worth naming, since it determines what can be built without them.

**Needs nothing from them:**

- The entire catalogue entry path, all finishes, all rendering
- Text, curved text, emboss, deboss, fill, export
- Save, versioning, archive, sharing, quotes
- Everything in phases 1–10

**Needs them:**

| Dependency | Gates | Size |
|---|---|---|
| Per-process minimum feature sizes | Manufacturing warnings | One number per process — small |
| Which finishes are sellable | Trimming 135 to a real range | An afternoon in the CMS — small |
| OBJ re-export with named groups | Phase 11, removing existing branding | Their CAD team, per SKU — medium |
| Zone masks for undecorated two-tone | Nickel top, copper bottom on a plain blank | Large — defer indefinitely |

The first two are trivial asks and unblock real quality. The third gates only
phase 11. The fourth was previously bundled with the third when asking them; they
should be separated, because refusing the fourth does not require refusing the
third.

---

## Summary

The website's stack runs the editor without modification. The editor belongs in
the same repository as a lazy-loaded route, because it is a configurator over a
catalogue that already exists there, with auth, roles and row-level security
already built and proven.

Five new tables carry designs, versions, assets, shares and quotes. Versions
store both references and a frozen snapshot, so an approved design still renders
as approved a year later.

Phases 1 to 7 produce a working configurator with no external dependency. Phases
8 to 10 make it a business tool. Phase 11 is the only part that needs WIN-CYC's
CAD team.
