# WIN-CYC 3D Editor — Axis Model and Configuration Design

How the finish taxonomy (CYC-0001 to CYC-0135) and the OBJ editing capability
document combine into one coherent product.

---

## The problem with two documents

The capability summary describes a **geometry** editor: upload OBJ, remove
branding, add text, emboss, deboss, export. Appearance appears once, in §21, as
four sliders and three presets — "gold preview, silver preview, plastic preview".

The catalogue work produced the opposite: 135 real factory finishes with derived
render parameters, and nothing about geometry.

They are orthogonal, and neither is complete alone. A buyer choosing a button is
making one decision about shape and a separate decision about surface. The editor
has to model both, and the recipe it produces has to name both in terms WIN-CYC's
factory can quote.

---

## 1. The axis model

The earlier six-axis taxonomy — material · plating · texture · relief · fill ·
top coat — sent to WIN-CYC mixes the two concerns and splits things the factory
treats as one. Three of its six axes are already a single field in the catalogue.

### Recommended six axes

| # | Axis | Kind | Source | Scope |
|---|---|---|---|---|
| 1 | **Blank** | Geometry + spec | Catalogue SKU or uploaded OBJ | Whole part |
| 2 | **Finish** | Appearance | One catalogue finish, HP/ROLL/ECO | Whole part |
| 3 | **Content** | Decoration | Text or SVG | Per layer |
| 4 | **Relief** | Geometry | Emboss / deboss / flat | Per layer |
| 5 | **Fill** | Appearance | One catalogue finish, PAINT process | Per deboss layer |
| 6 | **Placement** | Geometry | Position, curve, conform | Per layer |

Two of these are new thinking; the rest are the old taxonomy tightened.

### Why plating, texture and top coat collapse into one axis

WIN-CYC's chart already encodes all three as single records. "Brushed Nickel"
under hanger plating is one finish; "Imitation Brushed Gold" with a matt lacquer
is another. The customer does not pick a base, then a surface, then a coat — they
pick a finish, and its axes describe it.

Letting a user compose those three axes freely would let them build finishes
WIN-CYC does not make. The 135-code list cannot. That is the whole value of a
controlled vocabulary, and it is why the CMS picker uses the eight axes as
*filters* rather than as choices.

**Ruling: the editor's finish control is the CMS finish picker, unchanged.** Same
component, same eight filter axes, same swatch renderer. A user narrows to
"brushed" and "brass" and picks one of four real codes.

### Why fill is the same catalogue, filtered differently

Page 4 of the chart — 27 records under the PAINT process — is enamels, ceramics,
glitter and epoxy. Those are exactly what goes into a recessed area: black
enamel, blue ceramic, epoxy.

**Ruling: Finish filters `process in (HP, ROLL, ECO)`. Fill filters
`process = PAINT`.** One table, one picker component, one swatch renderer, two
process filters. Nothing new to build or maintain.

---

## 2. The two-tone problem, and why it is now solvable

WIN-CYC achieves two-tone plating with selective masks on a unified die-cast
blank, not with split meshes. The earlier plan to ask their CAD team for
`face_upper` / `face_lower` groups was retracted, and they have declined to
produce per-SKU zone masks.

That looked like a blocker. It is not, for the cases that matter.

**When the editor debosses text, it creates those faces.** Boolean subtraction
through `three-bvh-csg` produces new geometry the editor generated and can tag.
The recessed region is known without any information from CAD.

So:

```
Blank           → finish (whole part)
Deboss recess   → fill (a PAINT finish) or the same finish
Emboss relief   → same finish as the blank, or a second finish
```

A gold button with black enamel lettering is expressible today, per-SKU masks or
not, because the editor knows which faces it cut.

**What still needs WIN-CYC:** two-tone on regions the editor did not create —
nickel top, copper bottom on a plain blank. That needs either a named group in
the OBJ or a mask. It is a smaller ask than a full zone-mask programme, and it
can wait.

---

## 3. Order of operations

The editor must model the factory sequence, or it will show things that cannot be
made.

```
1. Blank is die-cast or stamped     — geometry exists, including relief
2. Relief is part of the die        — emboss and deboss are in the blank
3. Plating is applied               — covers the whole part, recesses included
4. Enamel fill is applied after     — into the recesses only
5. Top coat, if any                 — over everything
```

Two consequences for the UI.

**Relief comes before finish in the flow, even though finish is chosen first in
the panel.** Plating thickness is measured in microns, so relief geometry is
unaffected by the finish choice. The preview can update either in any order.

**Fill is only meaningful over a plated recess.** The chart confirms this: 撈油
(ENAMEL_DIP) is an *effect* on a plated finish — Enamel Anti Copper is anti
copper with enamel. So fill sits on top of the finish, never instead of it.

**Ruling: fill is disabled unless that layer's relief is deboss.** Greyed with a
one-line reason, not hidden — hiding it makes the dependency invisible.

---

## 4. Rendering: replace the presets

The editor has 12 hand-tuned PBR presets. The `finishes` table now carries
`metalness`, `roughness` and `anisotropy` on all 135 records, derived from the
axes by a trigger that recomputes whenever an axis changes.

Three.js `MeshPhysicalMaterial` takes all three directly, and r155+ supports
anisotropy natively (`anisotropy`, `anisotropyRotation`).

```js
const m = new THREE.MeshPhysicalMaterial({
  color: finish.hex_approx,
  metalness: finish.metalness,
  roughness: finish.roughness,
  anisotropy: finish.anisotropy,
  anisotropyRotation: brushDirection,   // from the surface axis
  envMap: studioEnv,
});
```

**Ruling: delete the 12 presets.** Render from the record. Consequences:

- Any of 135 finishes renders, not 12 approximations
- When WIN-CYC adds finish 136 in the CMS, the editor gets it with no code change
- The swatch on the catalogue page and the 3D preview use the same three numbers,
  so they cannot disagree
- `anisotropyRotation` gives brushed finishes their directional sheen, which a
  scalar roughness cannot

**Environment map matters more than the parameters.** A mirror finish reflects
its surroundings — that is why polished nickel photographs near-black in a dim
room and bright in a lightbox. Ship one neutral studio HDRI and do not let it
vary per product, or the same finish will look different on different pages.

---

## 5. Entry point: catalogue first, upload second

The capability document opens with "Upload OBJ". For a general tool that is
right. For WIN-CYC it is backwards.

Their buyer does not have an OBJ file. They have a garment and a need for a
button. The editor is a sales tool over WIN-CYC's own catalogue.

**Ruling: two entry points, catalogue first.**

```
Start from a product   →  pick from the catalogue, model and specs load
Start from a file      →  upload OBJ, no catalogue link, export only
```

The first path produces a quotable spec. The second is a utility for WIN-CYC's
own staff and for prospects with their own CAD.

This also solves a problem the document does not address: **what the editor
outputs.** It ends at "Export OBJ / GLB / STL". Those are files, not orders.

---

## 6. The recipe, and what it must reference

The non-destructive editing model in §18 is right and should be kept. What it
stores needs tightening.

```jsonc
{
  "product_id": "uuid",          // a real catalogue SKU
  "item_code": "FST-BTN-001",
  "size_variant_id": "uuid",     // 15mm / 24L, from product_size_variants
  "finish_id": "uuid",           // a catalogue finish, not the string "silver"
  "layers": [
    {
      "content": { "type": "text", "value": "TIFFANY" },
      "placement": { "curve": "circle", "radius_mm": 5.04,
                     "start_angle": 70, "direction": "cw",
                     "conform": true },
      "relief": { "type": "emboss", "depth_mm": 0.30, "bevel_mm": 0.05 },
      "fill": null
    },
    {
      "content": { "type": "text", "value": "BLUE" },
      "placement": { "curve": "circle", "radius_mm": 5.04,
                     "start_angle": 250, "direction": "ccw",
                     "conform": true },
      "relief": { "type": "deboss", "depth_mm": 0.25 },
      "fill": { "finish_id": "uuid" }   // a PAINT-process finish
    }
  ]
}
```

**Every appearance value is a foreign key, never a free string.** That is what
makes the output quotable: a WIN-CYC salesperson receiving this recipe has a SKU,
a size, two finishes with their full axis description, and two depths. No
interpretation needed.

**Ruling: the primary export is the recipe plus a spec sheet, not a mesh.** OBJ,
GLB and STL stay as secondary exports for people who want the geometry.

---

## 7. Configuration panel design

Four groups, in the order a buyer decides.

```
┌─ PRODUCT ────────────────────────────┐
│ Metal Shank Button      FST-BTN-001  │
│ Size   ○ 15mm (24L)  ● 20mm (31.5L)  │
│ Material  Zinc Alloy                 │
└──────────────────────────────────────┘

┌─ FINISH ─────────────────────────────┐
│ [filter rail]  [swatch grid]         │
│ Selected: Brushed Nickel             │
│ Hanger plating · Nickel · Brushed    │
│ Swatches are indicative.             │
│ Physical samples on request.         │
└──────────────────────────────────────┘

┌─ BRANDING ───────────────────────────┐
│ + Add text   + Add logo              │
│                                      │
│ ▸ TIFFANY      emboss 0.30mm     ⋮⋮  │
│ ▸ BLUE         deboss 0.25mm     ⋮⋮  │
│     fill  Black Enamel               │
└──────────────────────────────────────┘

┌─ OUTPUT ─────────────────────────────┐
│ Request sample   Request quote       │
│ Download  OBJ · GLB · STL            │
└──────────────────────────────────────┘
```

### Rulings on the panel

- **Finish is one control, not three.** The eight axes live inside the picker as
  filters. A user ticks Brushed and Nickel and picks from what remains. No
  catalogue codes appear anywhere in the editor — see §12.
- **Only compatible finishes are offered.** A non-metal blank gets the product
  colour list, not platings. The `is_metal` gate the database already enforces.
- **Only public finishes are offered.** 35 of 135 are public today. The rest are
  manufacturing capability WIN-CYC has not marked sellable.
- **Relief is per layer, never global.** Mixed emboss and deboss on one part is
  the common case — the document's own example has it.
- **Fill is nested under its layer**, disabled unless relief is deboss.
- **Depths in millimetres, sizes in millimetres with ligne beneath.** Buttons are
  specified in lignes; 24L is 15.24mm. The catalogue already carries both.

---

## 8. What the MVP list is missing

The 26-item MVP in §26 is entirely geometry. It has no finish step at all, which
means the first shippable version would render everything in default grey.

**Recommended additions, in priority order:**

| # | Addition | Why |
|---|---|---|
| 1 | Start from catalogue product | Without it, the editor is not a WIN-CYC tool |
| 2 | Finish picker with the 8 filter axes | The component already exists in the CMS |
| 3 | Render from metalness/roughness/anisotropy | Replaces the 12 presets, 135 finishes work |
| 4 | Fill picker on deboss layers | PAINT-process finishes, same component |
| 5 | Size variant selector | Changes the model scale and the quoted spec |
| 6 | Recipe export + spec sheet | The actual business output |
| 7 | Studio HDRI environment | Metals are unreadable without one |

Items 2, 3 and 4 are largely reuse. The finish picker, the swatch renderer and
the material parameters are all built and running in production.

---

## 9. What still depends on WIN-CYC

Worth stating plainly, since the engagement is in a go/no-go state.

**Needs nothing from them — buildable now:**

- Blank, finish, fill, placement axes
- All 135 finishes with correct rendering
- Catalogue entry point, size variants, recipe export
- Text, curved text, emboss, deboss, boolean, export

**Needs them:**

| Dependency | For | Size of ask |
|---|---|---|
| OBJ re-export with named groups | Removing existing branding cleanly | Medium — their CAD team, per SKU |
| Which finishes are sellable | Trimming 135 to a real range | Small — one afternoon in the CMS |
| Zone masks for non-decorated two-tone | Nickel top / copper bottom on a plain blank | Large — defer |
| Product photography | Everything, including the catalogue | Large, and already the biggest gap |

The middle two are small. The first is the one that actually gates the branding-
removal workflow, and it is worth separating from the zone-mask question they
already refused — they are different asks and were previously bundled.

---

## 10. Summary of rulings

1. Six axes: blank, finish, content, relief, fill, placement
2. Finish is one catalogue record, not three composable axes
3. The eight chart axes are filters inside the picker, not choices
4. Fill is the PAINT-process subset of the same finish table
5. Fill requires deboss; disabled with a reason otherwise
6. Recessed regions come from the boolean, not from CAD masks
7. Delete the 12 PBR presets; render from the three derived columns
8. One neutral studio HDRI, fixed across the product
9. Catalogue entry first, file upload second
10. Every appearance value in the recipe is a foreign key
11. The primary output is a quotable spec, not a mesh
12. No catalogue codes in the editor — the axes are the identification
