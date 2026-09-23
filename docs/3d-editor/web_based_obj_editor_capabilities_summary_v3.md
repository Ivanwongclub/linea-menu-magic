# Web-Based OBJ Editor — Capability Summary & Recommended Scope

## Project Goal

Build a browser-based 3D editor focused on practical `.OBJ` editing, branding replacement, text/logo placement, emboss/deboss operations, cleanup, and export.

The editor is **not intended to replace Blender**. The goal is to provide a focused workflow for users who need to modify existing OBJ models directly in the browser.

A typical use case:

```text
Upload OBJ
↓
Inspect model
↓
Remove existing branding / unwanted parts
↓
Add new text or logo
↓
Curve / position it on the surface
↓
Emboss or Deboss
↓
Preview
↓
Bake geometry
↓
Export OBJ / GLB / STL
```

## 1. Input Formats

### MVP

Primary input:

- `.OBJ`

The current workflow does **not require `.MTL`**.

The editor should be fully usable with geometry-only OBJ files.

### Future Support

Later versions may support:

- `.MTL`
- texture images
- `.GLB`
- `.GLTF`
- `.STL`
- `.PLY`
- `.3MF`

If an OBJ has no MTL, the editor should simply apply a default preview material.

```text
OBJ only
↓
Default neutral material
↓
Editable geometry
```

If MTL support is added later:

```text
OBJ
+
MTL
+
Textures
↓
Material-aware preview
```

## 2. 3D Viewing

The editor should provide standard browser-based 3D controls:

- rotate
- zoom
- pan
- perspective view
- orthographic view
- front / back / top / bottom / left / right views
- wireframe mode
- solid shaded mode
- normal preview
- grid
- axis helper
- reset camera
- fit object to view

Useful information:

- vertex count
- face / triangle count
- object count
- group count
- bounding-box dimensions
- model centre
- overall scale

## 3. OBJ Structure Inspection

OBJ files may contain:

- multiple objects
- multiple groups
- disconnected mesh islands
- one fused mesh

The editor should analyse this automatically.

Example:

```text
Imported OBJ
│
├── object_1
├── object_2
├── object_3
├── object_4
└── object_5
```

If everything is inside one object, the editor should optionally detect disconnected geometry islands.

```text
Mesh001
│
├── Island 1
├── Island 2
├── Island 3
└── Island 4
```

This is particularly useful for AI-generated or converted OBJ models.

### Reference OBJ Tested During This Discussion

The uploaded sample:

```text
Polo Button 10.8 (1).obj
```

contains:

- **33 OBJ groups**
- group names: `object_1` through `object_33`
- **17,171 vertices**
- **17,198 OBJ face records**

This demonstrates why the editor must not rely only on a dropdown or long object list for selection.

The editor should automatically parse and expose **all objects/groups found in the OBJ**.

Important terminology:

- OBJ files contain objects/groups, not application-style "layers" in the strict sense.
- In the UI, these can still be presented as a familiar **Scene / Objects / Layers panel**.
- Every imported object/group should receive a stable internal ID so selection in the viewport and selection in the panel always stay synchronized.

## 3A. Direct Pointer Selection in the 3D Viewport

**Direct click/tap selection on the actual 3D model should be a core interaction and the primary selection method.**

The user should not need to find an object from a dropdown first.

Expected workflow:

```text
Move pointer over model
↓
Object under pointer highlights
↓
Click
↓
That object/group becomes selected
↓
Matching item is highlighted in Scene panel
↓
Transform / Hide / Delete / Isolate become available
```

Recommended desktop interactions:

- hover = highlight object under pointer
- click = select object
- `Shift + click` = add/remove from multi-selection
- click empty space = clear selection
- double-click = isolate or focus selected object
- right-click = object context menu
- `F` = frame/focus selected object
- `Delete` / `Backspace` = delete selected object, with Undo support

Recommended pointer-selection implementation:

```text
Pointer position
↓
Three.js Raycaster
↓
Intersect visible meshes
↓
Resolve hit Mesh to imported OBJ object/group ID
↓
Update central selection state
↓
Highlight object in viewport
+
scroll/highlight matching object in Scene panel
```

For performance on more complex models:

```text
Three.js Raycaster
+
three-mesh-bvh
```

can be used to accelerate picking.

### Selection Must Work Both Ways

The Scene panel and the viewport must be synchronized.

#### Viewport → Scene panel

```text
Click geometry
↓
Select object
↓
Automatically highlight / scroll to object_17 in panel
```

#### Scene panel → Viewport

```text
Click object_17
↓
Highlight corresponding geometry in viewport
↓
Optionally frame selected object
```

This means the object list is an **inspection and management tool**, not the only selection mechanism.

### Handling 33, 100, or More Groups

For a file with 33 groups, displaying all groups is reasonable, but the panel should not be a simple dropdown.

Recommended UI:

```text
SCENE
[ Search objects... ]

▼ Imported OBJ
   ○ object_1
   ○ object_2
   ○ object_3
   ...
   ● object_17   ← currently selected in viewport
   ...
   ○ object_33
```

Useful controls:

- collapsible tree
- search by object/group name
- filter visible / hidden / selected
- show object count
- eye icon for visibility
- lock icon
- isolate
- rename
- multi-select
- delete
- frame selected
- sort by original OBJ order

For hundreds of objects, use a virtualized list rather than rendering every row at once.

### Overlapping Geometry

Sometimes several objects may overlap underneath the pointer.

The editor should provide a way to resolve this.

Possible UX:

```text
Click
↓
Closest visible object selected
```

Optional advanced functions:

- cycle through objects under pointer
- `Alt/Option + click` to select-through
- temporary popover showing all hit objects
- X-ray selection mode

Example:

```text
Objects under pointer:

1. object_12
2. object_14
3. object_21
```

The normal click should still select the closest visible surface.

### Group vs Mesh-Island Selection

Selection should support more than one level.

Recommended modes:

```text
OBJECT MODE
Select imported OBJ object/group

ISLAND MODE
Select disconnected connected-component geometry

FACE MODE
Select individual triangles/faces
```

For the MVP, **Object Mode** is essential.

Island Mode is highly useful when an OBJ contains one group but several disconnected pieces.

Face Mode can be added later.

### Hover Highlight

Before clicking, the geometry underneath the pointer should visibly highlight.

Possible methods:

- outline
- emissive highlight
- temporary material
- edge overlay

This greatly improves usability because the user can see exactly which geometry will be selected before clicking.

### Example With the 33-Group Button OBJ

Instead of:

```text
Open dropdown
↓
Try object_1
↓
Wrong
↓
Try object_2
↓
Wrong
↓
...
```

the intended workflow is:

```text
Rotate button
↓
Hover over branding letter
↓
Letter highlights
↓
Click
↓
Corresponding OBJ group selected
↓
Shift-click other branding pieces
↓
Delete
```

This is especially important for workflows such as removing existing logos or branding from an imported OBJ.

## 4. Object-Level Editing

Basic editing should include:

- **direct pointer/raycast selection in the 3D viewport**
- automatically list every imported OBJ object/group in the Scene panel
- synchronize viewport selection with Scene-panel selection
- select object
- multi-select
- hover highlight
- hide
- show
- isolate
- delete
- duplicate
- rename
- move
- rotate
- scale
- reset transform
- merge selected objects
- separate disconnected geometry
- centre object
- align object

Transform gizmos should support:

```text
Move
Rotate
Scale
```

## 5. Mesh Cleanup

Useful cleanup features include:

- detect disconnected geometry
- detect floating parts
- delete unwanted components
- remove duplicate vertices
- weld nearby vertices
- recalculate normals
- fix flipped normals
- remove degenerate triangles
- basic hole detection
- basic hole filling
- mesh simplification / decimation
- basic mesh validation

## 6. Face / Geometry Editing

A later or advanced editor mode may include:

- face selection
- box selection
- lasso selection
- connected-face selection
- delete selected faces
- extract selected faces
- split selected geometry
- basic vertex movement
- basic edge movement
- simple extrude
- simple inset
- simple hole filling

For the first version, object-level editing and Boolean-based operations are more important.

## 7. Remove Existing Branding or Objects

### Case A — Branding is a separate object

```text
Select branding
↓
Delete
```

### Case B — Branding is a disconnected mesh island

The editor can detect connected components and allow the user to remove the island.

### Case C — Branding is fused into the main mesh

A Boolean / mesh-editing workflow is required.

Possible tools:

- Boolean subtraction
- face delete
- surface repair
- local patching

## 8. Add New Text

The editor should support adding 3D text.

Functions:

- enter text
- select font
- upload custom font
- font size
- letter spacing
- word spacing
- text thickness
- text depth
- position
- rotation
- scale
- alignment

Text should remain editable until the user chooses to bake it into the model.

```text
Text:
[Tiffany Blue]

Font:
[Custom / Standard]

Size:
[1.00]

Spacing:
[0.12]

Depth:
[0.30 mm]
```

## 9. Curved / Circular Text

This is a key feature.

The editor should support:

- straight text
- curved text
- circular text
- text along an arc
- adjustable radius
- adjustable arc angle
- adjustable start angle
- clockwise / counter-clockwise direction
- letter spacing
- per-letter rotation
- per-letter position

Important implementation principle:

**Each glyph should be handled separately.**

Do not create one long text mesh and bend it afterward.

Instead:

```text
T
i
f
f
a
n
y
```

Each character has its own:

- position
- rotation
- scale
- curve angle
- surface normal
- operation type

## 10. Keep Text Readable

The editor must avoid mirrored or upside-down curved text.

A useful option:

```text
☑ Keep text readable
```

This should automatically determine whether glyph order and orientation need to change.

Do **not** solve text direction using negative scale such as:

```text
scale.x = -1
```

because that mirrors the geometry.

Instead, correct:

- glyph order
- arc traversal direction
- rotation
- tangent orientation

Top arc:

```text
TIFFANY
```

Bottom arc should still read normally:

```text
BLUE
```

rather than appearing mirrored or upside down.

## 11. Surface Conforming

On curved models, text cannot simply sit on one flat plane.

The editor should support:

```text
☑ Follow surface
```

or:

```text
Conform to Surface
```

Possible workflow:

```text
Text glyph
↓
Raycast toward mesh
↓
Find surface point
↓
Find surface normal
↓
Align glyph
↓
Apply offset
```

This avoids:

- floating letters
- letters penetrating too deeply
- inconsistent emboss height

This is important for curved products such as buttons, rings, jewellery, cylindrical products, packaging, and curved metal parts.

## 12. Emboss

Emboss means raised geometry.

Workflow:

```text
2D text / SVG
↓
Extrude
↓
Position on object
↓
Preview
↓
Boolean Union
↓
Final raised geometry
```

Controls:

- emboss height
- bevel
- bevel size
- bevel thickness
- surface offset

Example:

```text
Tiffany
→ Emboss
→ Height: 0.30 mm
```

For preview, the text may temporarily remain a separate mesh.

Only when the user clicks `Apply / Bake` should the editor perform the final Boolean union.

## 13. Deboss / Engraving

Deboss means recessed geometry.

It should be implemented as a real Boolean subtraction.

```text
Text
↓
Create cutter geometry
↓
Push cutter into surface
↓
Boolean Subtract
↓
Recessed text
```

Controls:

- deboss depth
- bevel
- cutter depth
- surface offset

Example:

```text
Blue
→ Deboss
→ Depth: 0.25 mm
```

Simply moving text below the surface is **not enough**.

The final OBJ must contain actual recessed geometry.

## 14. Mixed Emboss + Deboss

The editor should allow different text ranges to use different operations.

Example:

```text
Tiffany → Emboss
Blue    → Deboss
```

Possible data structure:

```js
branding = {
  text: "Tiffany Blue",

  curve: {
    type: "circle",
    radius: 5.04,
    startAngle: 70,
    direction: "clockwise"
  },

  segments: [
    {
      text: "Tiffany",
      operation: "emboss",
      depth: 0.30
    },
    {
      text: "Blue",
      operation: "deboss",
      depth: 0.25
    }
  ]
}
```

The user may select specific text and assign:

- emboss
- deboss
- surface-only
- separate mesh

This can work per word, letter, or text segment.


## 14A. Branding / Text Tool — Detailed UI Configuration

The editor should include a dedicated **Add Branding / Add Text** panel rather than exposing only basic text fields.

A recommended first-pass UI:

```text
Add Branding
┌──────────────────────────────────┐
│ TEXT                             │
│ [ Tiffany Blue                ]  │
│                                  │
│ Font          [ Choose Font ▼ ]  │
│ Weight        [ Regular      ▼ ]  │
│ Size          [ 1.00 mm       ]  │
│ Letter Space  [ 0.12 mm       ]  │
│ Word Space    [ 0.30 mm       ]  │
│                                  │
│ LAYOUT                           │
│ ○ Straight                       │
│ ● Curved                         │
│ ○ Full Circle                    │
│ ○ Custom Path                    │
│                                  │
│ Radius        [ 5.04 mm       ]  │
│ Arc Span      [ 210°          ]  │
│ Arc Position  [ 0°            ]  │
│ Start Angle   [ 75°           ]  │
│ Direction     [ Clockwise   ▼ ]  │
│ Alignment     [ Center      ▼ ]  │
│                                  │
│ ORIENTATION                      │
│ ☑ Keep text readable             │
│ ☑ Follow surface                 │
│ ☑ Use surface normal             │
│ [ Flip text direction ]          │
│                                  │
│ POSITION                         │
│ Offset X      [ 0.00 mm       ]  │
│ Offset Y      [ 0.00 mm       ]  │
│ Surface Gap   [ 0.00 mm       ]  │
│ Rotation      [ 0°            ]  │
│                                  │
│ SELECTED TEXT                    │
│ [ Tiffany ] [ Blue ]             │
│                                  │
│ Tiffany                          │
│ ● Emboss                         │
│ ○ Deboss                         │
│ ○ Surface only                   │
│ ○ Separate mesh                  │
│ Height        [ 0.32 mm       ]  │
│                                  │
│ Blue                             │
│ ○ Emboss                         │
│ ● Deboss                         │
│ ○ Surface only                   │
│ ○ Separate mesh                  │
│ Depth         [ 0.25 mm       ]  │
│                                  │
│ GEOMETRY                         │
│ Bevel         [ 0.03 mm       ]  │
│ Bevel Steps   [ 2             ]  │
│ Curve Steps   [ 12            ]  │
│ Quality       [ High         ▼ ]  │
│                                  │
│ [ Reset ] [ Preview ] [ Apply ]  │
└──────────────────────────────────┘
```

A more compact version can also be provided when fewer controls are needed:

```text
ADD TEXT

Text:
[Tiffany Blue                 ]

Font:
[Choose Font ▼]

Style:
○ Raised
○ Engraved
○ Separate Mesh

Curve:
[────●────────]

Radius:
[──────●──────]

Letter spacing:
[────●────────]

Depth:
[──●──────────]

[ Apply ]
```

The compact panel is useful for beginners, while an **Advanced** panel can expose precision controls.

---

## 14B. Text Content Controls

The branding editor should support:

- text input
- multiline text where relevant
- uppercase / lowercase / title case
- font family
- custom font upload
- font weight
- font style
- size
- character spacing
- word spacing
- line spacing
- horizontal alignment
- vertical alignment
- baseline offset
- kerning on/off
- per-character kerning adjustment
- reset typography

Recommended controls:

```text
Text
[ Tiffany Blue ]

Font
[ Helvetica Neue ▼ ]

Weight
[ Regular ▼ ]

Size
[ 1.00 mm ]

Letter spacing
[ 0.12 mm ]

Word spacing
[ 0.30 mm ]

Kerning
☑ Auto
```

Future support may include:

- `.TTF`
- `.OTF`
- web fonts
- reusable brand-font library

---

## 14C. Layout Modes

The editor should support multiple text layout modes.

### Straight

```text
TIFFANY BLUE
```

### Curved / Arc

```text
       TIFFANY BLUE
     ╭──────────────╮
```

### Full Circle

```text
       TIFFANY
    ╭───────────╮
   │             │
    ╰── BLUE ───╯
```

### Custom Path

Future advanced mode:

```text
SVG path
or
user-drawn spline
↓
text follows path
```

Recommended layout selector:

```text
Layout
○ Straight
● Curved
○ Full Circle
○ Custom Path
```

---

## 14D. Curve and Arc Controls

Curved text should have dedicated geometric controls.

Required controls:

- radius
- arc span
- start angle
- end angle
- arc position
- clockwise / counter-clockwise direction
- inside / outside curve
- centre alignment
- start alignment
- end alignment
- reverse path
- flip orientation
- curve intensity shortcut
- auto-fit to selected surface

Example:

```text
Radius
[ 5.04 mm ]

Arc Span
[ 210° ]

Start Angle
[ 75° ]

Direction
[ Clockwise ▼ ]

Alignment
[ Center ▼ ]

☑ Keep readable
```

A visual circular handle should also be considered:

```text
        ● Start
      ╭────────╮
     │  MODEL   │
      ╰────────╯
          ● End
```

The user should be able to drag start/end handles directly in the viewport.

---

## 14E. Positioning Controls

The user should be able to position branding numerically and visually.

Controls:

- X offset
- Y offset
- Z / surface offset
- rotation
- scale
- radial position
- distance from object edge
- align to selected face
- centre on object
- snap to surface
- snap to object centre
- snap to axis
- drag directly in viewport

Example:

```text
Position X    [ 0.00 mm ]
Position Y    [ 0.00 mm ]
Surface Gap   [ 0.00 mm ]
Rotation      [ 0.0°    ]
```

Direct manipulation should remain available:

```text
Click branding
↓
Transform gizmo
↓
Drag / rotate / scale
```

Numeric controls are important for precision.

---

## 14F. Surface-Follow Controls

The `Follow Surface` option should expose more than a single checkbox in Advanced mode.

Recommended options:

```text
Surface Fit
☑ Follow surface
☑ Align to surface normal

Projection Direction
[ Auto ▼ ]

Surface Offset
[ 0.00 mm ]

Sampling Quality
[ High ▼ ]

Conform Mode
○ Per glyph
● Per vertex
○ Rigid glyph
```

Possible conform modes:

### Per Glyph

Each letter remains rigid but follows the local surface normal.

Good for:

- clean industrial branding
- moderate curvature

### Per Vertex

The actual text mesh bends to the surface.

Good for:

- strongly curved surfaces
- cylinders
- rings

### Rigid Glyph

Letters remain completely flat but are individually positioned.

Good for:

- shallow surfaces
- fast preview

---

## 14G. Keep Text Readable / Orientation Controls

This should be a core setting.

Recommended controls:

```text
Orientation

☑ Keep text readable
☑ Prevent mirror
☑ Keep front-facing

[ Reverse character order ]
[ Flip baseline ]
[ Flip 180° ]
```

The system should automatically prevent:

- mirrored text
- upside-down text
- reversed bottom-arc lettering

Do not use negative scaling to fix direction.

Use:

- path traversal direction
- glyph order
- tangent orientation
- rotation
- surface normal

---

## 14H. Per-Word / Per-Range / Per-Letter Selection

The editor should allow the user to apply different geometry operations to different parts of the text.

Selection levels:

```text
Whole Text
Word
Character Range
Individual Character
```

Example:

```text
Tiffany Blue
███████ ████
   ↑      ↑

Emboss   Deboss
```

Recommended interaction:

```text
Selected text:
[Tiffany]

Style:
● Emboss
○ Deboss
○ Surface only
○ Separate mesh
```

Then:

```text
Selected text:
[Blue]

Style:
○ Emboss
● Deboss
○ Surface only
○ Separate mesh
```

The viewport should visually show which text segment is selected.

---

## 14I. Branding Operation Modes

Each text or logo segment should support:

### Emboss

Raised physical geometry.

```text
Base model
+
Text geometry
=
Raised branding
```

### Deboss

Recessed physical geometry.

```text
Base model
-
Text cutter
=
Engraved branding
```

### Surface Only

Text is positioned visually on the surface but not Boolean-baked.

Useful for:

- preview
- placement
- design review

### Separate Mesh

Text remains independent geometry.

Useful for:

- later editing
- exporting separate parts
- downstream CAD work

Recommended control:

```text
Style

○ Emboss
○ Deboss
○ Surface only
○ Separate mesh
```

---

## 14J. Emboss Configuration

Emboss should have more controls than height alone.

Recommended settings:

```text
Emboss

Height
[ 0.30 mm ]

Base Penetration
[ 0.05 mm ]

Bevel
[ 0.03 mm ]

Bevel Steps
[ 2 ]

☑ Union on Bake
```

Useful options:

- height
- base penetration
- bevel size
- bevel thickness
- bevel steps
- soften top edges
- union on bake
- leave separate
- draft angle (future)

Base penetration is useful because the raised text should slightly intersect the base before Boolean union.

---

## 14K. Deboss Configuration

Recommended controls:

```text
Deboss

Depth
[ 0.25 mm ]

Cutter Extra Depth
[ 0.20 mm ]

Bevel
[ 0.02 mm ]

Bottom Style
[ Flat ▼ ]

☑ Subtract on Bake
```

Possible controls:

- depth
- cutter penetration
- bevel
- bevel steps
- flat bottom
- rounded bottom
- V-groove / engraving profile (future)
- minimum wall thickness warning
- subtract on bake

---

## 14L. Bevel and Edge Controls

Text quality depends heavily on edge treatment.

Recommended:

```text
Bevel
[ 0.03 mm ]

Bevel Thickness
[ 0.03 mm ]

Bevel Steps
[ 2 ]

Edge Style
○ Sharp
● Soft
○ Rounded
```

For manufacturing, this can prevent unrealistically sharp lettering.

---

## 14M. Quality / Geometry Resolution

The editor should expose quality presets.

Example:

```text
Geometry Quality
○ Draft
● Standard
○ High
○ Ultra
```

Internally this may control:

- curve segments
- extrusion segments
- bevel segments
- surface-conform sampling
- Boolean precision

Recommended workflow:

```text
Editing
→ Draft / Standard

Final Bake
→ High
```

This keeps the viewport responsive.

---

## 14N. Live Preview vs Final Bake

This distinction is important.

### Live Preview

Should be fast.

Possible shortcuts:

- separate text mesh
- temporary depth
- no Boolean yet
- lower curve resolution
- lower conform resolution

### Final Bake

Should apply:

- final surface projection
- Boolean union / subtraction
- high-resolution geometry
- normal recalculation
- cleanup
- validation

UX:

```text
[ Preview ]
```

updates the interactive model.

```text
[ Apply ]
```

updates the non-destructive modifier state.

```text
[ Bake ]
```

creates final geometry.

The user should not need to run expensive Boolean operations every time they move a slider.

---

## 14O. Visual Handles in the 3D Viewport

Not every setting should require typing a number.

Curved text should expose interactive handles.

Possible viewport controls:

```text
             Arc Radius Handle
                    ●
                  ╱
        T I F F A N Y

     ● Start              End ●

             ⟳ Rotate
```

Direct handles can control:

- arc start
- arc end
- radius
- rotation
- position
- scale
- surface offset

Numeric values in the side panel should update live while dragging.

---

## 14P. Presets

Useful presets can make the editor much easier for non-technical users.

Examples:

```text
Preset
[ Product Branding ▼ ]

- Small Raised Text
- Deep Engraving
- Circular Button Text
- Jewellery Engraving
- Logo Emboss
- Laser-Style Engraving Preview
```

A preset should simply populate editable values.

It should never lock the user into fixed settings.

---

## 14Q. Units and Precision

The editor should support precise physical units.

Recommended:

```text
Units
○ mm
○ cm
○ inch
```

Default for product/manufacturing use:

```text
mm
```

Recommended precision:

```text
0.01 mm
```

Advanced input can allow:

```text
0.001 mm
```

The UI should clearly distinguish:

- text size
- emboss height
- deboss depth
- surface offset
- curve radius

---

## 14R. Measurement-Aware Branding

A useful advanced feature is to relate text dimensions to the actual model size.

Example:

```text
Button diameter:
10.8 mm

Branding radius:
5.04 mm

Text height:
0.95 mm
```

Possible functions:

- fit text to selected circumference
- fit within selected width
- auto-centre on circular object
- maintain minimum edge distance
- show margin from model edge

Example:

```text
Edge Margin
[ 0.60 mm ]
```

---

## 14S. Collision and Geometry Warnings

The editor should detect obvious problems before Bake.

Warnings may include:

```text
⚠ Text intersects hole
⚠ Deboss depth exceeds wall thickness
⚠ Letter stroke is too thin
⚠ Geometry extends outside model
⚠ Boolean operation may fail
⚠ Text contains self-intersections
⚠ Surface curvature is too high for current text size
```

Do not necessarily block the user, but show the warning clearly.

---

## 14T. Minimum Feature Size / Manufacturing Check

For manufacturing-oriented workflows, a useful future setting is:

```text
Minimum Feature Size
[ 0.20 mm ]
```

The editor can warn when:

- strokes are too thin
- gaps are too small
- emboss is too shallow
- engraving is too narrow

This should be configurable because requirements depend on the production process.

---

## 14U. Custom Font Upload

Users should be able to upload a brand font.

Future supported formats:

- TTF
- OTF
- WOFF / WOFF2 where practical

Workflow:

```text
Upload Font
↓
Parse font outlines
↓
Generate glyph Shapes
↓
Extrude / curve / conform
```

The editor should store the font as part of the non-destructive branding modifier.

---

## 14V. SVG / Logo Configuration

Logos should have a similar configuration panel.

Example:

```text
ADD LOGO

Source
[ Upload SVG ]

Layout
○ Flat
● Follow surface

Style
● Emboss
○ Deboss
○ Separate mesh

Width
[ 4.00 mm ]

Height
[ Auto ]

Depth
[ 0.30 mm ]

Rotation
[ 0° ]

Surface Offset
[ 0.00 mm ]

[ Preview ] [ Apply ]
```

Future controls:

- preserve aspect ratio
- simplify SVG
- path cleanup
- fill / outline mode
- invert logo
- remove internal holes
- merge paths

---

## 14W. Branding Layer / Modifier Model

Branding should appear in the Scene panel as its own editable object or modifier.

Example:

```text
SCENE

▼ Button
   object_1
   object_2
   ...

▼ Branding
   ▼ Tiffany Blue
      Tiffany — Emboss 0.30 mm
      Blue    — Deboss 0.25 mm

   ▼ Logo
      SVG Logo — Emboss 0.20 mm
```

Selecting a branding layer should reopen its settings.

This is preferable to baking it immediately.

---

## 14X. Duplicate / Copy Branding

Useful workflow:

```text
Select Branding
↓
Duplicate
↓
Move to another position
```

Possible actions:

- duplicate branding
- copy settings
- paste settings
- mirror placement without mirroring text
- save branding preset
- apply same branding to another uploaded OBJ

This could become valuable for batch product customization.

---

## 14Y. Reset and Revert Controls

The branding panel should include:

```text
[ Reset Position ]
[ Reset Curve ]
[ Reset Typography ]
[ Reset Geometry ]
[ Reset All ]
```

The user should also be able to:

```text
Disable modifier
Enable modifier
Delete modifier
Duplicate modifier
```

---

## 14Z. Suggested Beginner vs Advanced UI

To avoid overwhelming users, use two levels.

### Simple Mode

```text
Text
Font
Size
Straight / Curved
Emboss / Deboss
Depth
Position
Preview
Apply
```

### Advanced Mode

Adds:

- exact radius
- arc start/end
- path direction
- glyph spacing
- surface conform mode
- per-word/per-letter operation
- bevel
- sampling quality
- Boolean settings
- minimum feature size
- geometry warnings

This gives non-technical users a simple workflow while still supporting precision work.

---

## 14AA. Recommended Branding Tool MVP

For the first version, the Branding Tool should include:

1. text input
2. font selection
3. custom font upload
4. font size
5. letter spacing
6. straight / curved layout
7. curve radius
8. start angle
9. arc span
10. clockwise / counter-clockwise
11. keep text readable
12. follow surface
13. X / Y position
14. surface offset
15. rotation
16. whole-text selection
17. per-word selection
18. emboss
19. deboss
20. surface-only preview
21. separate-mesh mode
22. emboss height
23. deboss depth
24. bevel
25. geometry quality
26. live preview
27. apply as non-destructive modifier
28. bake
29. undo / redo
30. reset controls

Later versions can add:

- per-character editing
- custom path
- spline editing
- SVG path text
- advanced engraving profiles
- automatic feature-size checks
- batch branding

---

## 15. Add Logos / SVG

The editor can also support logos.

Recommended workflow:

```text
Upload SVG
↓
Convert SVG paths to shapes
↓
Extrude
↓
Position
↓
Emboss / Deboss
↓
Bake
```

Controls:

- position
- rotation
- scale
- depth
- emboss
- deboss
- surface conform

## 16. Boolean Editing

Core Boolean modes:

### Union

Used for:

- raised branding
- added decorative parts
- embossed text

```text
Button + Text = Embossed Button
```

### Subtract

Used for:

- deboss
- engraving
- holes
- cut-outs

```text
Button - Text Cutter = Debossed Button
```

### Intersect

Possible advanced feature for:

- shape extraction
- cutting workflows

## 17. Primitive Cutters

Useful future tools:

- box cutter
- sphere cutter
- cylinder cutter
- plane cut
- custom SVG cutter

These can support:

- holes
- trimming
- cut-outs
- decorative recesses
- simple model cleanup

## 18. Non-Destructive Editing

This is strongly recommended.

The editor should preserve the original imported geometry and store editing operations separately.

```text
Original OBJ
│
├── Remove Existing Branding
│
├── Add Branding
│   ├── Tiffany
│   │   └── Emboss 0.30 mm
│   │
│   └── Blue
│       └── Deboss 0.25 mm
│
└── Add Logo
    └── Emboss 0.20 mm
```

The user can later change:

```text
Blue depth
0.25 mm
↓
0.18 mm
```

without rebuilding the whole model manually.

Only when the user chooses:

```text
Bake
Export
Finalize
```

should the editor permanently apply Boolean operations.

## 19. Undo / Redo

The user should be able to undo:

- delete
- move
- rotate
- scale
- add text
- text edits
- emboss/deboss settings
- branding removal
- Boolean operation
- logo placement

Recommended:

```text
Undo
Redo
History
```

## 20. Measurements

Useful production-oriented features:

- width
- height
- depth
- radius
- diameter
- point-to-point distance
- bounding box
- scale to exact size
- display unit in mm
- centre at origin
- reset scale
- align to axes

## 21. Materials and Appearance

Materials are mainly for preview and do not necessarily change physical geometry.

Even without `.MTL`, the editor can apply default preview materials.

Possible controls:

- base colour
- metalness
- roughness
- transparency
- environment map
- lighting
- plastic preview
- silver preview
- gold preview
- matte preview

Current MVP:

```text
OBJ only
↓
Default neutral material
```

Future:

```text
OBJ + MTL + textures
↓
Original material preview
```

## 22. Export

Recommended export formats:

### OBJ

Primary compatibility format.

### GLB

Recommended modern web format.

Advantages:

- geometry
- materials
- compact package
- good for browser preview
- good for web applications

### STL

Useful for:

- manufacturing
- 3D printing
- geometry-only workflow

Possible future support:

- PLY
- 3MF
- GLTF

## 23. Recommended Browser Technology Stack

```text
Frontend
React / Next.js

3D Engine
Three.js

React 3D Layer
React Three Fiber

Helpers / Controls
@react-three/drei

Transforms
TransformControls

OBJ Import
OBJLoader

Internal Geometry
Three.js BufferGeometry

Text
FontLoader
ShapeGeometry
ExtrudeGeometry

Curved Text
Custom glyph layout engine

Surface Conforming
Raycaster
three-mesh-bvh

Boolean
three-bvh-csg

State Management
Zustand

Undo / Redo
Command history

Heavy Geometry Processing
Web Workers

Export
OBJExporter
GLTFExporter
STLExporter
```

## 24. Important Architecture Decision

Do not use OBJ as the live internal editing format.

Recommended workflow:

```text
OBJ Upload
↓
OBJLoader
↓
Three.js BufferGeometry
↓
Editor
↓
Modifiers / Text / Boolean Operations
↓
Bake
↓
Export
↓
OBJ / GLB / STL
```

OBJ should be treated mainly as:

- import format
- export format

The editor should operate on Three.js geometry internally.

## 25. Browser vs Server Processing

For normal-sized OBJ models, most operations can happen entirely inside the browser.

Benefits:

- no server upload required
- faster interaction
- better privacy
- lower server cost

Browser-side operations may include:

- OBJ parsing
- object selection
- transforms
- text creation
- curved text
- surface raycasting
- basic cleanup
- Boolean operations
- export

For very high-poly models, Web Workers should be used to avoid freezing the UI.

A future server-side processing option may be considered for extremely large or complex models.

## 26. Recommended MVP

The detailed Branding Tool configuration described in Sections 14A–14AA should be treated as part of the product specification. The MVP may expose a simplified subset in the default UI while keeping precision controls under an Advanced panel.


The first practical version should focus on a narrow, useful workflow.

1. Upload OBJ
2. Display and inspect model
3. Automatically parse and list every OBJ object/group
4. Direct click/tap selection on geometry using raycasting
5. Hover highlight before selection
6. Synchronize viewport selection with Scene/Object panel
7. Search/filter object list
8. Multi-select with Shift-click
9. Hide / isolate
10. Delete object
11. Detect disconnected mesh parts
12. Move / rotate / scale
13. Add text
14. Choose font
15. Curved / circular text
16. Adjust curve radius
17. Adjust start angle
18. Adjust letter spacing
19. Keep text readable
20. Follow surface
21. Emboss
22. Deboss
23. Mixed emboss/deboss by text segment
24. Add SVG logo
25. Undo / redo
26. Preview changes
27. Bake geometry
28. Export OBJ
29. Export GLB
30. Export STL

## 27. Example Target Workflow

```text
Upload:
Polo Button 10.8.obj

↓
Inspect model groups

↓
Select existing branding

↓
Delete branding

↓
Add new text:
"Tiffany Blue"

↓
Set:
Layout = Circular
Radius = approximately original branding radius
Keep Readable = ON
Follow Surface = ON

↓
Select:
"Tiffany"
Operation = Emboss
Height = 0.30 mm

↓
Select:
"Blue"
Operation = Deboss
Depth = 0.25 mm

↓
Preview

↓
Adjust:
Font
Spacing
Radius
Position
Depth

↓
Bake

↓
Export:
OBJ
GLB
STL
```

## 28. Features Not Recommended for MVP

Avoid turning the first version into a full Blender replacement.

Do not prioritise:

- sculpting
- full vertex modelling
- advanced edge modelling
- subdivision modelling
- retopology
- UV unwrapping
- animation
- rigging
- skinning
- NURBS
- parametric CAD
- advanced CAD constraints
- advanced mesh repair
- procedural modelling

## 29. Product Positioning

The editor can be positioned as a:

> **Focused browser-based OBJ customisation and branding editor**

rather than:

> **Full 3D modelling software**

Its strongest workflow is:

```text
Existing 3D model
↓
Clean
↓
Remove old branding
↓
Add new branding
↓
Emboss / Deboss
↓
Export
```

This is particularly suitable for:

- buttons
- jewellery
- accessories
- metal parts
- promotional items
- packaging components
- product samples
- branded product prototypes

## 30. Key Product Principle

The most important design principle should be:

> **Simple visual editing for users who do not want to use Blender or CAD software.**

The editor should hide unnecessary technical complexity.

A user should be able to:

```text
Upload
Select
Delete
Add Text
Curve
Emboss / Deboss
Export
```

without needing professional 3D modelling knowledge.
