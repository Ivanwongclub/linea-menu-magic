# WIN-CYC 3D Editor — Units, Scale, Ruler and Branding Recovery Rulings

How `obj_rhino_units_scale_research_findings_v2.md` and
`claude_code_3d_editor_units_scale_size_ruler_spec_v3.md` join the existing
plan. Where this document and those two conflict, this document wins; where
this document is silent, the spec wins on technique and
`wincyc-3d-editor-v3-review.md` wins on UX. `claude_code_master_prompt_3d_obj_editor.md`
is not a governing document: its upload-first sequence and Simple/Advanced UI
are superseded by the architecture and review documents.

---

## 1. The unit rule is adopted, and split by who is looking

The research finding stands: OBJ coordinates are not physical units until a
trusted source establishes the mapping, and the editor must never confuse

```
CHANGE DISPLAY UNIT  ≠  REINTERPRET OBJ UNIT  ≠  RESIZE MODEL
```

For this product the trusted source is the catalogue. A buyer configuring a
catalogue product must never be asked what unit an OBJ is in.

| Surface | Who | Units and scale behaviour |
|---|---|---|
| CMS model upload (`/admin`) | Catalogue editor | Full scale confirmation: raw bounding dimensions shown, interpretation proposed, confirm or calibrate by known dimension or two points. Stored on the product. |
| Catalogue path (editor from a product) | Buyer | Millimetres and ligne only. Scale is already confirmed on the product. No unit selector, no reinterpret, no resize. |
| Upload path (editor from a file) | Staff, prospects with CAD | The full spec: first-import dialog, `Scale: Confirmed / Unconfirmed`, display unit, reinterpret, resize with lock proportions, calibration. |

Rulings:

1. `products.model_scale_factor numeric` and `products.model_scale_status text
   check in ('confirmed','unconfirmed')` are added. The CMS upload field
   computes the raw bounding box, proposes `1 unit = 1 mm` when the raw
   primary dimension is within 2% of `size_primary_mm`, and otherwise
   proposes the factor that makes them equal. The catalogue editor confirms,
   calibrates, or leaves it unconfirmed.
2. The buyer path refuses to open a product whose scale is unconfirmed; it
   shows the empty state with the line "This product's 3D model is awaiting
   setup." Staff see the same product with the calibration controls.
3. Phase 2's force-rescale to `size_primary_mm` is replaced by the stored
   factor. It was the right interpretation for the seed product and the wrong
   mechanism.
4. Display units: mm and ligne on the buyer path (review §4 stands). cm, m and
   inch exist only on the upload path.
5. Millimetres remain the canonical internal unit once scale is confirmed.
   GLB export converts to metres. OBJ and STL export in millimetres.

## 2. Ruler: adopted for both paths, scoped by path

The Ruler ON/OFF toggle replaces the fixed measurement line under the
viewport. The measurement line's content becomes the ruler's default.

| Path | Ruler shows |
|---|---|
| Buyer | Overall size (diameter, thickness), branding radius, edge margin. Overall size mode only. Toggle in the viewport corner, off by default, state kept per design. |
| Upload | Everything in spec §18–§24: scope (whole model, visible, selection), modes (overall, point-to-point, bounding box, radius/diameter), measurement tool. |

The ruler is an overlay, never geometry, never exported. It updates with
scale, display unit and camera. Annotation rendering follows spec §23.

## 3. Numeric control and direct manipulation: both, one state

Review §1 ruled that spatial values are dragged on the model and shown in the
panel. The master prompt asks for exact numeric input on every parameter.
These are compatible and the ruling is both:

- Drag handles on the model are the first interaction and remain visible.
- Inside the "Position and curve" disclosure, each parameter uses the hybrid
  control from the master prompt: numeric input, slider, value label above
  the handle, vertical marker line. Numeric is authoritative; slider and
  handle are convenience.
- One shared parameter state. Dragging updates the number live; typing
  updates the model live.
- Parameters that get the hybrid control: radius, start angle, arc span, arc
  position, text size, letter spacing, baseline offset, emboss height,
  deboss depth. Depth stays a typed number first (review §1).
- Range controls (start/end angle) use the two-handle form.

Progressive disclosure stands (review §3). There is no Simple/Advanced mode;
spec §37 is not adopted.

## 4. Branding recovery: upload path, and a quiet seed for the catalogue path

The research addendum is right that an OBJ carrying existing branding can
yield a recovered profile: curve type, centre, radius, start and end angle,
arc span, direction, baseline, text height, occupied arc, spacing, surface
relation, raised or recessed, approximate relief, fit confidence. The Polo
button gives radius ≈ 5.04 raw units and relief ≈ 0.5 raw units.

Rulings:

1. Recovery, provenance labels (`Source / Recovered / User / Auto-fitted`),
   `Reset to recovered values`, and the four fit policies (preserve radius,
   preserve occupied arc, preserve both, manual) are built on the upload
   path, Phase 11. Default policy: preserve original radius.
2. The catalogue path never shows the analysis. When a catalogue product's
   OBJ contains branding groups, the CMS upload lets the catalogue editor
   mark them (multi-select in a group list, staff only). The editor then
   hides those groups for buyers and uses the recovered radius, start angle
   and relief as the defaults when a buyer adds text. The buyer sees a blank
   button and a text layer that lands where the factory's branding was.
3. Recovered values are labelled as recovered in the recipe and the spec
   sheet, never presented as CAD parameters.

## 5. Text geometry rules carried into Phase 4

From the master prompt, adopted as stated:

- Each glyph is placed and oriented independently along the path.
- Reversed curved text is corrected by glyph order, traversal direction,
  tangent orientation and rotation. Never by negative scale or mirroring.
  This is the same rule as the model-orientation ruling in Phase 3b.
- Emboss and deboss are non-destructive modifiers during editing and become
  real geometry only at bake, which happens at export or quote (review §7).
- Relief on curved surfaces is measured along the local surface normal.

## 6. Standing working rule

From the master prompt's working style, adopted for every phase:

No placeholder controls. A button, toggle or field that appears functional
but does nothing is a defect. If a feature cannot yet be completed it is
absent, not disabled-looking.

## 7. Revised phase table

| Phase | Content | Change from the architecture brief |
|---|---|---|
| 4 | Text layers: add text, straight and circular layout, drag handles, hybrid controls in disclosure, per-glyph placement, layer list in BRANDING. CMS scale confirmation and stored scale factor. Ruler toggle, buyer scope. | Adds §1.1–1.3, §2, §3, §5 |
| 5 | Relief: emboss/deboss per layer, depth, bevel, manufacturing warning strip with WIN-CYC thresholds. | Unchanged |
| 6 | Fill picker on deboss layers; occlusion bake moves to a worker. | Unchanged |
| 7 | Versions: named saves, snapshot, reload. | Unchanged |
| 8 | Shares. | Unchanged |
| 9 | Quote request and staff queue. | Unchanged |
| 10 | Spec sheet PDF, recovered values labelled. | Adds §4.3 |
| 11 | Upload path: scene tree, viewport selection, hover, hide/isolate, first-import dialog, full units and scale, calibration, full ruler, branding analysis and recovery, fit policies. | Absorbs the master prompt's Phases 1–3 |
| 12 | Bake and export: boolean, cleanup, bake scale, OBJ mm, GLB metres, STL. | Adds §1.5 |

## 8. What is not adopted

- Upload-first entry (master prompt objective). Catalogue first stands.
- Simple/Advanced UI (spec §37).
- cm, m and inch on the buyer path.
- The scene panel on the buyer path.
- Custom font upload and SVG logo paths in Phase 4; they are Phase 11 or v2.
- MTL support; not needed on either path.
