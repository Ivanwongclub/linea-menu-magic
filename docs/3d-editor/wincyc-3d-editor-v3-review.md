# WIN-CYC 3D Editor — v3 Review and UX Counter-Proposal

Analysis of `web_based_obj_editor_capabilities_summary_v3.md`. Companion to
`wincyc-3d-editor-axis-design.md`, which covers the axis model.

---

## The contradiction at the centre of the document

§30 states the key product principle:

> Simple visual editing for users who do not want to use Blender or CAD software.
> The editor should hide unnecessary technical complexity.

§14A then shows the branding panel: **31 controls visible at once**, including
Arc Span, Arc Position, Bevel Steps, Curve Steps, and Use Surface Normal.

Both cannot be true. That panel is a CAD panel. A garment buyer who opened it
would close the tab.

§14Z tries to resolve this with a Simple/Advanced toggle. That is the usual
escape hatch and it does not work, for two reasons. Simple Mode as listed still
carries nine controls. And a mode switch asks the user to decide what they need
before they know what the tool does — the one decision a novice cannot make.

Everything below follows from taking §30 seriously.

---

## 1. The panel is the wrong primary interface

**Counter-proposal: direct manipulation first, numbers second.**

§14O already has the answer and buries it as one section among thirty. Look at
what the panel asks a user to type:

| Control | What it actually is |
|---|---|
| Radius 5.04 mm | How far from centre — *drag it* |
| Start Angle 75° | Where it begins — *drag it* |
| Arc Span 210° | How far round — *drag it* |
| Offset X / Y | Where it sits — *drag it* |
| Rotation | Which way up — *drag it* |
| Size 1.00 mm | How big — *drag a corner* |

Six of the panel's most prominent fields are spatial properties of a thing the
user can see. Typing 5.04 into a box to position text on a button you are
looking at is an interaction from 1995.

**Ruling: those values are set on the model and shown in the panel, not the
reverse.** The number field remains — for precision, for repeatability, for
someone matching a previous order — but it is the confirmation, not the input.

What survives as panel-first: the text itself, the font, emboss or deboss, and
the depth. Depth stays a number because 0.30mm is not draggable at any sane
zoom, and because it is the value the factory quotes from.

---

## 2. "Keep text readable" should not be a checkbox

§10 proposes `☑ Keep text readable` as an option.

**No user wants mirrored, upside-down branding.** Making it optional means
someone will turn it off by accident and not understand what happened. It is
correct behaviour, not a preference.

**Ruling: always on. No control.** If a legitimate mirrored case ever appears —
it will not, for branding — it belongs behind an advanced escape, not on the
main panel.

The same test applies to `☑ Follow surface` and `☑ Use surface normal`. On a
curved button, text that does not follow the surface floats or sinks. That is
never what someone wants. Both should be on, always, with no control.

That removes three checkboxes from §14A and one whole decision the user cannot
meaningfully make.

---

## 3. Progressive disclosure instead of Simple/Advanced modes

**Counter-proposal: one panel that grows in place.**

```
BRANDING
┌─────────────────────────────────┐
│ Text   [ TIFFANY BLUE        ]  │
│ Font   [ Helvetica Neue    ▼ ]  │
│                                 │
│ TIFFANY    ● Raised  ○ Engraved │
│            Depth  [ 0.30 mm  ]  │
│                                 │
│ BLUE       ○ Raised  ● Engraved │
│            Depth  [ 0.25 mm  ]  │
│            Fill   [ ▪ Black  ▼] │
│                                 │
│ ▸ Position and curve            │
│ ▸ Geometry quality              │
└─────────────────────────────────┘
```

Four decisions visible. Everything else is behind two disclosure rows that
reveal inline, in place, without changing mode.

The user never chooses a mode. They ask for more and get more. Someone who never
opens those rows gets a correct result, because every hidden value has a
defensible default derived from the model — radius from the blank's diameter,
start angle from the top, size from the available arc.

---

## 4. Units: mm and ligne, nothing else

§14Q proposes mm, cm and inch.

Centimetres are never used for trim. Inches appear in US size ordering but never
for emboss depth. Three unit systems on a 0.25mm value is an invitation to enter
0.25 inches and produce a button-shaped crater.

**Ruling: millimetres only for all geometry.** Diameter additionally shows ligne,
because that is how buttons are actually specified — 24L is 15.24mm, and the
catalogue already carries both.

§14R's measurement-aware branding is the genuinely useful idea in that group. It
should not be an advanced feature:

```
Button 15 mm (24L) · branding radius 5.04 mm · edge margin 0.60 mm
```

One line under the viewport, always visible. It tells a buyer whether the text
fits before they discover it does not.

---

## 5. Promote the manufacturing checks

§14S and §14T are the most valuable sections in the document and they sit at
position 19 of 27 in a subsection.

For a sales tool over a real factory, "deboss depth exceeds wall thickness" is
not a nicety. It is the difference between a quote WIN-CYC can honour and one
they cannot.

**Ruling: the checks are a permanent strip, not a pre-bake dialog.**

```
⚠ Letter stroke 0.14 mm — below the 0.20 mm minimum for roll plating
```

Live, under the viewport, updating as the user drags.

**Ruling: the thresholds are WIN-CYC's, not the user's.** §14T proposes
"Minimum Feature Size [0.20mm]" as a configurable field. The default must be
their real minimum, per process, stored in the database next to the finish
record — roll plating and hanger plating do not tolerate the same detail. A
buyer should never be setting a manufacturing tolerance.

This is also a small, concrete ask of WIN-CYC: one number per process. Far
easier than zone masks.

---

## 6. Group selection belongs to one user, not both

§3A is a good addition and the viewport-first selection model is right. But the
33-group problem has a simpler answer than a better tree.

**A buyer starting from the catalogue should never see groups at all.** They are
not removing branding from a CAD file; they are putting their logo on a button
WIN-CYC already makes. The group tree is for the "remove existing branding" case,
which is WIN-CYC's own staff and prospects arriving with their own OBJ.

**Ruling: two entry points, two interfaces.**

| Path | Sees |
|---|---|
| From the catalogue | Product, finish, branding, quote. No scene tree. |
| From an upload | Full scene tree, cleanup, group selection, export. |

Same engine, different surface. This halves the interface most users meet, and
it is the same split as the catalogue-first entry point in the axis document.

---

## 7. Remove the Preview button

§14A's panel ends with `[ Reset ] [ Preview ] [ Apply ]`.

§14N correctly separates live preview from final bake. But if the preview is
live, a Preview button does nothing the user has not already seen. And Apply
suggests a commitment that §18's non-destructive model explicitly avoids.

**Ruling: one action, and it is not in the branding panel.** Preview is
continuous. Bake happens once, at export or quote, on the whole recipe. The
panel needs no verb at all.

This matters more than it sounds. Two buttons that both seem to mean "do it" is
the most common source of a user not knowing whether their change took effect.

---

## 8. Presets should be WIN-CYC's, and saveable

§14P's examples — "Small Raised Text", "Jewellery Engraving", "Laser-Style
Engraving Preview" — are 3D-tool presets. They describe the tool, not the
business.

**Counter-proposal, two tiers:**

**Factory presets**, authored by WIN-CYC in the CMS: their standard branding
treatments, each a real depth and bevel they know they can produce. Perhaps six.

**Saved recipes**, the stronger one: a recipe is already a JSON document
referencing a SKU, a finish and a set of operations. Saving it and reloading it
is nearly free.

```
Recent
  Tiffany — button branding, Nov 2026
  Adidas — shank button, circular
```

For a repeat customer, "same as last time, new finish" is the most common real
request. No preset list serves that; a saved recipe does.

---

## 9. Appearance is still absent

§21 is unchanged from v1: four sliders and three presets, "gold preview, silver
preview, plastic preview".

Meanwhile §14 grew to 27 subsections on text geometry.

The imbalance is worth naming. The branding tool is now specified in more detail
than most commercial 3D software, while the thing a buyer decides first — what
finish the button is in — remains three fake materials.

The axis document covers the fix: 135 real CYC codes, rendered from
`metalness` / `roughness` / `anisotropy`, picked through the same component the
CMS already uses. It is mostly reuse. It should be in the MVP.

---

## 10. Four things the document does not mention

**Empty state.** What does the editor show before anything is added? For the
catalogue path it should be the product in its default finish, rotating slowly,
with one call to action. The document jumps straight to a loaded model.

**Undo in the panel.** §19 lists undo/redo; §14A offers `[ Reset ]`, which is
destructive and different. A user who nudges the radius wrong wants Cmd+Z, not
to lose all their settings.

**Touch.** Sales people demonstrate on tablets. Drag handles sized for a mouse
fail under a finger, and there is no hover state to preview with. Worth a ruling
now, even if the ruling is "desktop only at v1".

**Who is looking.** The recipe should record whether it was made by a WIN-CYC
salesperson or a customer. Those produce different follow-ups, and the field
costs nothing to add later — but only if it is designed in now.

---

## 11. Revised MVP

§14AA lists 30 items for the branding tool alone. Cut to what a buyer needs to
produce a quotable spec:

| # | Item | Note |
|---|---|---|
| 1 | Start from a catalogue product | Loads model, size, material |
| 2 | Finish picker, 8 filter axes | Reuse the CMS component |
| 3 | Render from the three material columns | Replaces the 12 presets |
| 4 | Add text | Content, font, size |
| 5 | Straight and circular layout | Custom path is later |
| 6 | Drag to position, size and curve | Handles, not fields |
| 7 | Readable and surface-follow always on | No controls |
| 8 | Emboss / deboss per word | The panel's only real decision |
| 9 | Depth in mm | Typed, because factories quote it |
| 10 | Fill on deboss layers | PAINT finishes, same picker |
| 11 | Live preview | Continuous, no button |
| 12 | Manufacturing warning strip | WIN-CYC's thresholds |
| 13 | Measurement line | Diameter, radius, edge margin |
| 14 | Undo / redo | |
| 15 | Save and reload recipe | Repeat orders are the common case |
| 16 | Request quote with spec sheet | The actual output |
| 17 | Export OBJ / GLB / STL | Secondary |

Seventeen items, and items 2, 3 and 10 are largely components already running in
production.

Everything in §14A–14AA not listed here — arc span, bevel steps, curve steps,
per-character kerning, glyph-level surface modes, custom fonts, SVG paths — is
correct engineering and belongs in the advanced disclosure or in v2. None of it
should be visible on first open.

---

## 12. Summary of rulings

1. Spatial values are dragged on the model; the panel shows them
2. Keep-readable, follow-surface and use-normal are always on, no controls
3. Progressive disclosure in one panel, not Simple/Advanced modes
4. Millimetres only, with ligne shown for diameter
5. Manufacturing checks are a live strip, with WIN-CYC's thresholds
6. Buyers never see the scene tree; uploaders get the full one
7. No Preview button — preview is continuous, bake happens at export
8. Presets are WIN-CYC's, plus saved recipes for repeat orders
9. The finish axis goes in the MVP, not §21's three fake materials
10. Rule on empty state, undo, touch and author identity now
11. MVP is 17 items, not 30
