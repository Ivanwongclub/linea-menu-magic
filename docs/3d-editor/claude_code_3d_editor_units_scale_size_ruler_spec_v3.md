# Claude Code Build Spec — Units, Scale, Size Editing & Ruler for Web 3D OBJ Editor

**Date:** 17 September 2026  
**Scope:** Browser-based OBJ editor built with Three.js / React stack.  
**This is a standalone implementation specification.**

---

# 1. Goal

Implement a reliable **Units / Scale / Size / Measurement subsystem** for the web-based OBJ editor.

The subsystem must support:

- unitless OBJ imports
- physical-unit interpretation
- size calibration
- exact X/Y/Z size editing
- uniform and non-uniform scaling
- scale percentage/factor
- ruler ON/OFF in the viewport
- point-to-point measurement
- size display in mm/cm/m/inch
- undo/redo
- modifier-aware resizing
- correct OBJ and GLB export behavior

The user should always understand:

```text
What numerical size was imported?
What physical size is currently assumed?
Which unit is being displayed?
Am I only changing the unit label?
Am I reinterpreting the OBJ?
Am I physically resizing the model?
```

---

# 2. Non-Negotiable Rule

The application must make these three actions clearly different:

```text
CHANGE DISPLAY UNIT
≠
REINTERPRET OBJ UNIT
≠
RESIZE MODEL
```

Do not put all three behind one ambiguous `Units` dropdown.

---

# 3. OBJ Import Rule

OBJ is treated as **unitless geometry** unless a trusted application-specific metadata convention is available.

On import:

```text
OBJ
↓
Parse vertices / faces / groups
↓
Calculate raw dimensions
↓
Physical unit = UNKNOWN
↓
Allow user to:
- assume a unit
- calibrate a known dimension
- continue unconfirmed
```

Do not require `.MTL`.

Materials are unrelated to physical unit handling.

---

# 4. Reference OBJ for Testing

Use this project sample as a regression fixture:

```text
Polo Button 10.8 (1).obj
```

Known properties:

```text
Header:
# Rhino

Vertices:
17,171

Raw bounding-box size:
X = 14.995973 coordinate units
Y =  4.139496 coordinate units
Z = 14.995974 coordinate units
```

Do not hardcode a millimeter assumption for this model.

---

# 5. Canonical Physical Unit

Use **millimeters** as the internal canonical physical unit.

Recommended type model:

```ts
type PhysicalUnit = "mm" | "cm" | "m" | "inch" | "ft";
type DisplayUnit = "mm" | "cm" | "m" | "inch";

interface ModelScaleState {
  // The imported OBJ geometry remains recoverable.
  rawFormat: "obj";
  rawUnitLabel: "OBJ coordinate unit";

  // Interpretation of the raw coordinate.
  interpretedUnit: PhysicalUnit | "custom" | "unknown";
  rawUnitToMM: number | null;

  // Additional calibration multiplier.
  calibrationScale: number;

  // User resize transform.
  modelScale: {
    x: number;
    y: number;
    z: number;
  };

  // Display only.
  displayUnit: DisplayUnit;

  lockAspectRatio: boolean;
  scaleIsConfirmed: boolean;
}
```

Physical calculation:

```text
physical_mm
=
raw_coordinate
× rawUnitToMM
× calibrationScale
× modelScale
```

---

# 6. Unit Conversion Constants

```ts
const UNIT_TO_MM = {
  mm: 1,
  cm: 10,
  m: 1000,
  inch: 25.4,
  ft: 304.8,
};
```

Never round internal values to the visible UI precision.

---

# 7. First Import Dialog

After loading an OBJ:

```text
MODEL UNITS & SCALE

Source
OBJ

Embedded physical unit
Not available

Raw model dimensions
X  14.996
Y   4.139
Z  14.996
OBJ coordinate units

How should this model be interpreted?

1 OBJ unit =
[ 1.000 ] [ mm ▼ ]

Calculated size
X  14.996 mm
Y   4.139 mm
Z  14.996 mm

○ Confirm this scale
● Calibrate using a known dimension

[ Continue Without Confirming ]
[ Apply ]
```

If user continues without confirmation:

```text
Scale: ⚠ Unconfirmed
```

must remain visible somewhere in the editor.

Do not block basic viewing/editing.

---

# 8. Persistent Scale Status

Toolbar or sidebar should display:

```text
Scale: ✓ Confirmed
```

or:

```text
Scale: ⚠ Unconfirmed
```

Clicking it opens Units & Scale settings.

Precision features such as emboss/deboss should show a warning while scale is unconfirmed.

---

# 9. Display Unit

Display unit affects labels only.

Example:

```text
10.80 mm
→
1.08 cm
```

No model transform changes.

Suggested setting:

```text
Display Unit
[ mm ▼ ]
```

Supported:

- mm
- cm
- m
- inch

---

# 10. Reinterpret Raw OBJ Unit

This changes the meaning of one raw OBJ coordinate.

Example:

```text
Current:
1 OBJ unit = 1 mm

New:
1 OBJ unit = 1 cm
```

Physical size becomes 10× larger unless the user chooses physical-size preservation.

Show an explicit dialog:

```text
CHANGE MODEL UNIT

Current interpretation
1 OBJ unit = 1 mm

New interpretation
1 OBJ unit = 1 cm

What should happen?

● Keep the same physical size
  Convert scale automatically.

○ Keep the same numeric coordinate values
  Reinterpret the model and change physical size.

[ Cancel ] [ Apply ]
```

Default:

```text
Keep the same physical size
```

---

# 11. Model Size Panel

```text
MODEL SIZE

Display Unit
[ mm ▼ ]

X / Width
[ 14.996 ] mm

Y / Height
[  4.139 ] mm

Z / Depth
[ 14.996 ] mm

🔒 Lock Proportions

Uniform Scale
[ 100.00 ] %

Scale Factor
[ 1.00000 ]

Scale Around
[ Model Center ▼ ]

[ Calibrate... ]
[ Reset Scale ]
[ Bake Scale ]
```

Internally use X/Y/Z.

`Width / Height / Depth` are UI aliases only.

---

# 12. Uniform Resize

Default:

```text
Lock Proportions = ON
```

If current size is:

```text
X = 15
Y = 4
Z = 15
```

and X becomes:

```text
10.8
```

then:

```ts
factor = 10.8 / 15;
newY = 4 * factor;
newZ = 15 * factor;
```

All axes must scale uniformly.

Pseudocode:

```ts
function resizeUniformly(
  current: { x: number; y: number; z: number },
  axis: "x" | "y" | "z",
  target: number
) {
  const source = current[axis];

  if (!Number.isFinite(target) || target <= 0) {
    throw new Error("Target size must be greater than zero");
  }

  if (source <= 0) {
    throw new Error("Current model size is invalid");
  }

  const factor = target / source;

  return {
    x: current.x * factor,
    y: current.y * factor,
    z: current.z * factor,
  };
}
```

---

# 13. Non-Uniform Resize

When:

```text
Lock Proportions = OFF
```

allow independent X/Y/Z changes.

Before first non-uniform resize, show:

```text
⚠ Non-uniform scaling may deform:

- circles
- holes
- text
- logos
- bevels
- emboss/deboss
- manufacturing dimensions

[ Cancel ]
[ Continue ]
```

Do not silently distort precision models.

---

# 14. Scale Percentage and Scale Factor

Support:

```text
Scale
[ 72.019 ] %
```

and:

```text
Factor
[ 0.72019 ]
```

Rules:

```text
100% = imported/calibrated baseline
50%  = half physical size
200% = double physical size
```

Scope:

```text
Apply To

● Whole Model
○ Selected Object
○ Selected Groups
```

---

# 15. Scale Pivot

Allow:

```text
Scale Around

● Model Center
○ World Origin
○ Object Origin
○ Selected Point
```

Default:

```text
Model Center
```

---

# 16. Calibration by Known Dimension

Core feature.

Example:

```text
CALIBRATE SCALE

Current measured size
14.995973 OBJ coordinate units

Known real-world size
[ 10.800 ] [ mm ▼ ]

Scale mapping
1 OBJ unit = 0.720193 mm

[ Apply Calibration ]
```

If user provides raw measured distance `R` and known physical distance `P_mm`:

```text
rawUnitToMM = P_mm / R
```

If a previous interpretation already exists:

```text
calibrationScale
=
knownPhysicalDistanceMM
/
currentPhysicalDistanceMM
```

---

# 17. Two-Point Calibration

Required Phase 2 feature.

Workflow:

```text
Calibrate by Measurement
↓
Click Point A
↓
Click Point B
↓
Measure raw/model distance
↓
User enters true physical distance
↓
Calculate calibration scale
↓
Apply
```

UI:

```text
CALIBRATE BY TWO POINTS

Point A
✓ Selected

Point B
✓ Selected

Measured
10.423 OBJ units

This distance should be
[ 7.500 ] [ mm ▼ ]

[ Clear ]
[ Apply Calibration ]
```

Use Three.js `Raycaster` for picking mesh points.

Official docs:  
https://threejs.org/docs/pages/Raycaster.html

---

# 18. Ruler Toggle

Add an obvious viewport control:

```text
[ 📏 Ruler ]
```

or:

```text
Ruler  [ ON / OFF ]
```

### OFF

- no dimension lines
- no dimension labels
- clean preview

### ON

- show X/Y/Z overall size
- show dimension lines
- show arrows/end caps
- show unit suffix
- update live during resize

Example:

```text
                 14.996 mm
          ◄────────────────►

              ╭─────────╮
              │         │
   4.139 mm   │  MODEL  │
              │         │
              ╰─────────╯

          ◄────────────────►
                 14.996 mm
```

Ruler graphics must never become exported mesh geometry.

---

# 19. Ruler Settings

```text
RULER

☑ Show Ruler

Scope
[ Whole Model ▼ ]

Mode
[ Overall Size ▼ ]

Display Unit
[ mm ▼ ]

Precision
[ 2 ▼ ]

☑ Unit suffix
☑ Extension lines
☑ Dimension arrows
```

---

# 20. Ruler Scope

Support:

```text
Whole Model
Visible Geometry
Selection
```

### Whole Model

Measures all active model geometry.

Recommended default.

### Visible Geometry

Measures only meshes currently visible.

### Selection

Measures selected object(s)/OBJ group(s).

Useful for models containing many groups.

---

# 21. Measurement Modes

Recommended:

```text
Overall Size
Point-to-Point
Bounding Box
Radius / Diameter
```

### Overall Size

X/Y/Z overall dimensions.

### Point-to-Point

Click two points on mesh and show distance.

### Bounding Box

Show dimension cage around the model.

### Radius / Diameter

Advanced function.

Do not guess circular geometry unless detection confidence is adequate.

---

# 22. AABB vs OBB

Three.js `Box3` is axis aligned.

Example:

```ts
const box = new THREE.Box3().setFromObject(modelRoot);
const size = new THREE.Vector3();
box.getSize(size);
```

Official docs:  
https://threejs.org/docs/pages/Box3.html

Problem:

If geometry is physically rotated in world space, a world-axis AABB may become larger than the object's intrinsic dimensions.

Use oriented/local dimensions where needed.

Three.js OBB docs:  
https://threejs.org/docs/pages/OBB.html

Recommended semantics:

```text
Model Size
→ intrinsic/local physical dimensions

World Bounding Box
→ optional diagnostic measurement
```

Camera rotation must never change reported model dimensions.

---

# 23. Dimension Annotation Rendering

Dimension graphics should be viewport/UI objects, not product geometry.

Suggested architecture:

```text
Three.js model scene
+
dimension helper lines
+
CSS/HTML labels or text sprites
```

Possible state:

```ts
interface DimensionAnnotation {
  id: string;
  type: "overall" | "distance" | "radius" | "diameter";
  axis?: "x" | "y" | "z";
  start: THREE.Vector3;
  end: THREE.Vector3;
  valueMM: number;
  displayUnit: DisplayUnit;
  scope: "model" | "visible" | "selection";
}
```

Dimension-label font size should remain visually readable as camera zoom changes.

---

# 24. Measurement Tool

Separate from always-on ruler.

Toolbar:

```text
[ Select ]
[ Move ]
[ Rotate ]
[ Scale ]
[ Measure ]
[ 📏 Ruler ]
```

Measure workflow:

```text
Measure
↓
Click A
↓
Click B
↓
Show distance label
```

Optional future actions:

```text
Save Measurement
Delete Measurement
Clear All Measurements
```

---

# 25. Precision

Internal:

```text
floating point millimeters
```

Default display:

```text
2 or 3 decimal places
```

Settings:

```text
Precision
○ 0
○ 1
● 2
○ 3
○ 4
```

Display rounding must never modify actual geometry.

---

# 26. Branding / Emboss / Deboss Integration

Physical branding settings depend on confirmed scale.

Example:

```text
Text height    0.90 mm
Emboss height  0.30 mm
Deboss depth   0.25 mm
Edge margin    0.50 mm
```

If scale is unconfirmed:

```text
⚠ Model physical scale is unconfirmed.

Confirm or calibrate units before using
production-accurate emboss/deboss dimensions.
```

---

# 27. Resizing After Modifiers Exist

If model already contains non-destructive modifiers:

```text
Base Model
├── Tiffany — Emboss 0.30 mm
└── Blue — Deboss 0.25 mm
```

and user resizes model, show:

```text
RESIZE MODEL

Existing physical modifiers were found.

How should they behave?

● Scale everything proportionally
  Text size, placement, emboss height and
  deboss depth scale with the base model.

○ Preserve physical modifier dimensions
  Keep values such as 0.30 mm unchanged
  and recompute their placement.

[ Cancel ]
[ Resize ]
```

Do not silently change precision settings.

---

# 28. Recommended Workflow Order

Guide users toward:

```text
1. Upload OBJ
2. Establish / calibrate unit
3. Verify overall dimensions
4. Resize if necessary
5. Remove unwanted geometry
6. Add text/logo
7. Set emboss/deboss values
8. Validate geometry
9. Bake
10. Export
```

---

# 29. Non-Destructive Scaling

Do not rewrite imported vertices every time the user changes size.

During editing:

```ts
modelRoot.scale.set(sx, sy, sz);
```

or equivalent state-driven transform.

Keep original imported geometry recoverable.

---

# 30. Bake Scale

`Bake Scale` applies transform into geometry.

Workflow:

```text
Non-destructive transform
↓
Bake Scale
↓
Apply matrix to vertex positions
↓
Reset object scale to 1,1,1
↓
Recompute:
- bounding box
- normals where required
- BVH where required
- ruler values
- modifier placement
```

Before Bake:

- create Undo snapshot
- preserve original/import snapshot
- validate scale
- warn if modifier consequences exist

---

# 31. Reset Scale

`Reset Scale` returns the model to the confirmed/calibrated baseline physical size.

Do not confuse this with:

```text
Reset Unit Interpretation
```

These should be separate actions.

---

# 32. Undo / Redo

All physical sizing actions must participate in command history:

- assume unit
- reinterpret unit
- calibrate
- resize
- non-uniform resize
- reset scale
- bake scale
- modifier-resize policy

Suggested command:

```ts
interface UnitScaleCommand {
  previous: ModelScaleState;
  next: ModelScaleState;
  affectedObjectIds: string[];
  modifierPolicy?: "scale-with-model" | "preserve-physical";
}
```

Changing **display unit only** does not necessarily need to be a geometry-history command.

---

# 33. Export OBJ

OBJ has no standard physical-unit field.

Export dialog:

```text
EXPORT OBJ

OBJ does not store a standard physical unit.

Export coordinates as
[ Millimeters ▼ ]

Meaning
1 exported coordinate unit = 1 mm

Final size
10.800 × 2.981 × 10.800 mm

☑ Add informational comment
  # EditorUnits: mm

[ Export ]
```

A custom comment may help humans and this editor on re-import, but must be treated as **non-standard metadata**.

Never assume third-party OBJ software will honor it.

---

# 34. Export GLB / glTF

glTF defines all linear distances in **meters**.

Official specification:  
https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html

If canonical editor units are millimeters:

```ts
gltfMeters = millimeters / 1000;
```

Example:

```text
10.8 mm
→
0.0108 m in glTF
```

Ensure geometry and transforms are converted consistently.

---

# 35. Suggested Top Toolbar

```text
┌───────────────────────────────────────────────────────────┐
│ Select | Move | Rotate | Scale | Measure | 📏 Ruler      │
└───────────────────────────────────────────────────────────┘
```

When Ruler is ON, highlighted state should be visible.

---

# 36. Suggested Right Sidebar

```text
MODEL

Units & Scale
─────────────────────────
Scale Status
✓ Confirmed

Interpretation
1 OBJ unit =
[ 1.000 ] [ mm ▼ ]

Display Unit
[ mm ▼ ]

Dimensions
X [ 14.996 ] mm
Y [  4.139 ] mm
Z [ 14.996 ] mm

☑ Lock Proportions

Scale
[ 100.00 ] %

Factor
[ 1.00000 ]

Scale Around
[ Model Center ▼ ]

[ Calibrate... ]
[ Reset Scale ]
[ Bake Scale ]


Ruler
─────────────────────────
☑ Show Ruler

Scope
[ Whole Model ▼ ]

Mode
[ Overall Size ▼ ]

Precision
[ 2 ▼ ]
```

---

# 37. Simple vs Advanced UI

## Simple

Show:

- scale status
- current unit
- X/Y/Z dimensions
- lock proportions
- resize
- ruler toggle
- calibrate

## Advanced

Add:

- reinterpret unit
- raw-unit mapping
- calibration multiplier
- non-uniform scale
- pivot
- AABB/OBB diagnostics
- export coordinate convention
- precision
- modifier scaling policy

Do not overwhelm ordinary users with raw unit math.

---

# 38. Validation

Reject:

```text
size <= 0
scale = 0
NaN
Infinity
```

Negative scale should not be used as a normal sizing method.

Mirroring should be a separate explicit feature:

```text
Mirror X
Mirror Y
Mirror Z
```

This avoids accidental topology/orientation problems.

---

# 39. Performance

During interactive resize:

```text
drag / type
→ update object transform
→ update ruler
→ update dimensions
```

Do not continuously bake vertex positions.

On commit or Bake:

```text
perform expensive updates
```

including:

- geometry bake
- BVH rebuild
- modifier recomputation
- geometry validation

---

# 40. Acceptance Criteria

## Import

- [ ] OBJ loads without MTL.
- [ ] Raw X/Y/Z dimensions are calculated.
- [ ] No physical unit is silently assumed.
- [ ] User can assume a unit.
- [ ] User can calibrate.
- [ ] User can continue unconfirmed.

## Units

- [ ] Display-unit changes do not resize geometry.
- [ ] Unit reinterpretation is an explicit action.
- [ ] Physical-size-preserving unit conversion works.
- [ ] Reinterpretation warns about physical-size change.
- [ ] mm/cm/m/inch work.

## Size Editing

- [ ] X/Y/Z fields work.
- [ ] Lock proportions defaults ON.
- [ ] Locked resize is uniform.
- [ ] Unlocked resize warns before non-uniform scaling.
- [ ] Scale % works.
- [ ] Scale factor works.
- [ ] Scope can be whole model or selection.
- [ ] Pivot works.
- [ ] Reset Scale works.
- [ ] Bake Scale works.
- [ ] Undo/redo works.

## Calibration

- [ ] Known-dimension calibration works.
- [ ] Two-point calibration works.
- [ ] Viewport mesh picking works.
- [ ] Calibration updates ruler immediately.
- [ ] Calibration is undoable.

## Ruler

- [ ] Ruler ON/OFF exists in viewport.
- [ ] OFF completely hides measurement overlays.
- [ ] ON shows size.
- [ ] Ruler updates live during resize.
- [ ] Ruler respects display units.
- [ ] Whole Model scope works.
- [ ] Visible Geometry scope works.
- [ ] Selection scope works.
- [ ] Measurement labels stay readable while zooming.
- [ ] Ruler is never exported as geometry.

## Branding Integration

- [ ] Physical modifier values use canonical mm.
- [ ] Unconfirmed scale warning exists.
- [ ] Resize after modifiers asks how modifiers should behave.

## Export

- [ ] OBJ export states that OBJ is unitless.
- [ ] OBJ coordinate convention can be chosen.
- [ ] Optional informational unit comment works.
- [ ] GLB/glTF exports in meters.

---

# 41. Implementation Priority

## Phase 1 — Essential

1. raw bounding box
2. unit status
3. assume unit
4. display unit
5. uniform size editing
6. lock proportions
7. scale percentage
8. Ruler ON/OFF
9. X/Y/Z dimension overlay
10. known-dimension calibration
11. undo/redo
12. OBJ export convention

## Phase 2 — Recommended

13. two-point measure
14. two-point calibration
15. selection ruler
16. visible-geometry ruler
17. non-uniform scale
18. pivot
19. OBB/local dimensions
20. Bake Scale
21. modifier scaling policy

## Phase 3 — Advanced

22. radius/diameter measurement
23. saved measurement annotations
24. manufacturing feature-size validation
25. automatic circular-feature detection

---

# 42. Sources

Rhino Model Units:  
https://docs.mcneel.com/rhino/8/help/en-us/documentproperties/units.htm

McNeel — OBJ is unitless:  
https://discourse.mcneel.com/t/rhino-v5-obj-import-size-very-small/81531

McNeel — real-world unit handoff with OBJ:  
https://discourse.mcneel.com/t/need-real-world-units-for-augmented-reality-export/120518

McNeel — unit differences when importing OBJ:  
https://discourse.mcneel.com/t/units-are-differents-when-i-import-from-maya/164845

Wavefront OBJ format reference:  
https://www.loc.gov/preservation/digital/formats/fdd/fdd000507

Three.js Box3:  
https://threejs.org/docs/pages/Box3.html

Three.js OBB:  
https://threejs.org/docs/pages/OBB.html

Three.js Raycaster:  
https://threejs.org/docs/pages/Raycaster.html

Khronos glTF 2.0 units:  
https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html

---

# 43. Final Instruction to Claude Code

Implement this as a **non-destructive model-state subsystem**, not as ad-hoc scaling of vertex arrays.

The original imported OBJ must remain recoverable.

The UI should be simple, but the data model must preserve the distinction between:

```text
raw coordinate
physical interpretation
calibration
model scale
display unit
```

The strongest UX requirement is:

> The user must always be able to toggle the ruler and immediately see what physical size the model currently represents, while clearly understanding whether they are changing the display unit, reinterpreting the OBJ, or physically resizing the model.


---

# Addendum — Original Branding Reference Recovery and Professional Numeric Curve Editor

## 1. Core Requirement

When a user wants to remove existing branding and replace it with new branding, the editor should not discard the useful geometry of the original branding immediately.

Before removal:

```text
Existing branding
↓
Analyse original geometry
↓
Recover curve / placement / relief reference
↓
Save reference profile
↓
Remove branding
↓
Use profile as default for replacement branding
```

This allows a new brand to begin from the **same professional placement** as the original design.

Example:

```text
Original:
TOMMY ... curved around button

↓ Recover

Radius
Start angle
Arc span
Baseline position
Surface offset
Text height
Relief estimate

↓ Replace

TIFFANY BLUE
```

## 2. OBJ Does Not Store a Native "Curve Value"

Do not assume OBJ contains an editable parameter such as:

```text
curveRadius = 5.04
```

In most cases it contains only baked mesh geometry.

The editor should calculate a best-fit geometric curve from the selected branding.

Possible methods:

- connected-component centroid analysis
- glyph/component centre analysis
- least-squares circle fitting
- arc fitting
- spline fitting for non-circular paths
- RANSAC or robust fitting where geometry contains noise

For the currently tested Polo Button OBJ, geometric analysis recovered a branding reference radius of approximately:

```text
5.04 raw OBJ coordinate units
```

This should be shown as:

```text
Recovered Radius
5.04 model units
```

until physical scale is confirmed.

After scale calibration, show the converted physical value.

## 3. Recovered Branding Reference Profile

Use a persistent data structure such as:

```ts
interface BrandingReferenceProfile {
  id: string;

  sourceObjectIds: string[];

  pathType: "circle" | "arc" | "spline" | "unknown";

  // Recovered in model-local coordinates.
  centerLocal: {
    x: number;
    y: number;
    z: number;
  };

  radiusModelUnits?: number;

  startAngleDeg?: number;
  endAngleDeg?: number;
  arcSpanDeg?: number;

  direction?: "clockwise" | "counter-clockwise";

  baselineOffsetModelUnits?: number;

  surfaceNormal?: {
    x: number;
    y: number;
    z: number;
  };

  glyphMetrics?: {
    approximateHeightModelUnits?: number;
    occupiedArcLengthModelUnits?: number;
    averageSpacingModelUnits?: number;
    glyphAnglesDeg?: number[];
  };

  relief?: {
    classification: "raised" | "recessed" | "mixed" | "unknown";
    estimatedHeightModelUnits?: number;
    estimatedDepthModelUnits?: number;
  };

  fitQuality?: {
    rmsError?: number;
    maxError?: number;
    confidence?: "high" | "medium" | "low";
  };

  valueOrigin: "recovered-from-obj";
}
```

When units are confirmed, derive mm values from this profile rather than losing the original raw values.

## 4. Replacement Branding Workflow

Recommended user flow:

```text
1. Click old branding directly in viewport
2. Multi-select all branding groups
3. Click "Remove / Replace Branding"
4. Editor analyses selected geometry
5. Editor displays recovered values
6. User confirms removal
7. Add Branding panel opens
8. New text inherits recovered placement
9. User adjusts exact numeric values if required
```

Example UI:

```text
REPLACE BRANDING

Source:
28 selected branding groups

Recovered Layout:
Path             Circular / Arc
Radius           5.036 model units
Arc Position     ...
Arc Span         ...
Direction        Clockwise
Surface Fit      Detected

Recovered Relief:
Type             Raised
Estimated Relief ~0.5 model unit
Status           Measured from mesh

[ Keep Reference ]
[ Remove Branding ]
```

## 5. Professional Numeric Editor — Required

A mouse/pointer drag alone is **not sufficient** for curve editing.

Every geometric property must have an exact numeric field.

The viewport handle is a convenience only.

The numeric editor is the source of truth.

Recommended UI:

```text
CURVE / PATH

Path Type
[ Circular Arc ▼ ]

Radius
[ 5.0363 ] mm

Centre X
[ 0.0000 ] mm

Centre Y
[ 0.0000 ] mm

Start Angle
[ 72.500 ] °

End Angle
[ 287.500 ] °

Arc Span
[ 215.000 ] °

Rotation / Arc Position
[ 0.000 ] °

Direction
[ Clockwise ▼ ]

Baseline Offset
[ 0.0000 ] mm

[ Reset to Recovered Values ]
```

Precision should be configurable.

Recommended default:

```text
Length: 0.001 mm display/edit precision
Angle:  0.01°
```

The application should retain higher internal floating-point precision.

## 6. Pointer and Numeric Editor Must Stay Synchronized

If user drags a curve handle:

```text
Pointer drag
↓
calculate exact new geometric parameter
↓
numeric field updates immediately
```

If user types:

```text
Radius:
5.0363 → 5.2500
```

then:

```text
viewport updates immediately
```

Never maintain two independent states.

Use one central geometry parameter state.

## 7. Steppers and Keyboard Precision

Professional numeric fields should support:

```text
Arrow Up / Down
Shift + Arrow
Alt/Option + Arrow
```

Example behavior:

```text
Arrow:
±0.01 mm

Shift + Arrow:
±0.10 mm

Alt/Option + Arrow:
±0.001 mm
```

For angles:

```text
Arrow:
±0.1°

Shift + Arrow:
±1.0°

Alt/Option + Arrow:
±0.01°
```

Exact increments should be configurable.

## 8. Preserve Original Reference

When user edits recovered values, keep both:

```text
Recovered Radius:
5.0363 mm

Current Radius:
5.2500 mm
```

Provide:

```text
[ Reset to Original Reference ]
```

Do not overwrite the original recovered reference.

This enables controlled design iteration.

## 9. New Text Has Different Character Count

Replacement text will often have more or fewer characters than the original.

Example:

```text
Original:
TOMMY HILFIGER

Replacement:
TIFFANY BLUE
```

The curve itself and the text distribution are separate decisions.

Offer explicit layout policies:

```text
TEXT FIT POLICY

● Preserve original radius
  Adjust spacing / occupied angle to fit new text.

○ Preserve original occupied arc
  Adjust spacing and/or font size.

○ Preserve both radius and arc
  Auto-fit font size / spacing.

○ Manual
  User controls all values.
```

Never silently distort the glyphs.

## 10. More / Fewer Characters Must Not Change Radius Automatically Unless Requested

The default professional behavior should be:

```text
Recovered radius remains unchanged.
```

If text count changes:

```text
change glyph spacing
and/or
change arc coverage
and/or
change text size
```

based on the selected fit policy.

The user can then manually edit exact values.

A convenient pointer can adjust the curve, but that is secondary to exact fields.

## 11. Per-Glyph Numeric Data

Advanced mode should expose individual glyph placement.

Example:

```text
GLYPH TABLE

Char   Angle      X        Y       Rotation
T      72.50°   ...      ...       ...
I      88.24°   ...      ...       ...
F     103.85°   ...      ...       ...
```

Useful operations:

- edit individual angle
- edit tracking to next glyph
- reset one glyph
- align evenly
- distribute along arc
- copy/paste glyph spacing

This is particularly useful when automated curved text needs manual professional refinement.

## 12. Emboss / Deboss Values in Original OBJ

Do not expect fields such as:

```text
Emboss = 0.30 mm
Deboss = 0.25 mm
```

to exist in OBJ.

OBJ normally contains only the final geometry.

The editor may infer:

```text
Raised geometry
→ likely emboss / applied raised detail

Recessed geometry
→ likely deboss / engraving
```

Then estimate:

```text
raised height
or
recessed depth
```

relative to the underlying/reference surface.

These must be labelled:

```text
Estimated From Geometry
```

not:

```text
Original CAD Setting
```

## 13. Current Polo Button Example

For the current OBJ:

```text
object_1 → object_5
main button geometry

object_6 → object_33
branding-related geometry
```

The branding appears to be raised mesh geometry.

A practical recovered relief estimate is approximately:

```text
~0.5 raw OBJ coordinate unit
```

in many parts of the side-wall geometry.

This number is approximate because:

- the button surface is curved
- the branding follows the surface
- there may be bevel geometry
- tessellation changes local measurements
- OBJ stores the result, not the modelling operation

Therefore the editor UI should show something such as:

```text
Recovered Relief:
0.50 model units (estimated)

Source:
Measured from OBJ geometry

Confidence:
Medium
```

After model unit/scale calibration:

```text
Recovered Relief:
0.50 mm
```

only if the established conversion makes 1 model unit = 1 mm.

## 14. Relief Analysis Algorithm

For each selected branding component:

```text
1. Identify top-facing branding surface
2. Identify side-wall / boundary vertices
3. Find corresponding underlying model surface
4. Project along local surface normal
5. Measure signed distance
```

Signed distance:

```text
positive
→ raised

negative
→ recessed
```

Aggregate measurements robustly:

```text
median
10th–90th percentile
outlier rejection
```

Avoid reporting only maximum/minimum values because bevels and tessellation create outliers.

## 15. Curved Surface Requirement

Do not measure emboss height only along world X/Y/Z.

For a curved model:

```text
height/depth
```

should be measured approximately along the **local surface normal**.

This is important for:

- buttons
- rings
- jewellery
- cylinders
- curved product shells

## 16. Value Provenance

Every professional parameter should include provenance.

Recommended model:

```ts
type ValueOrigin =
  | "source-metadata"
  | "recovered-from-geometry"
  | "user-entered"
  | "auto-fitted";
```

Example UI:

```text
Radius
5.0363 mm
Recovered from geometry

Emboss Height
0.50 mm
Estimated from geometry

Text Size
0.92 mm
User entered
```

This avoids false precision.

## 17. Confidence / Fit Error

For recovered curve values, calculate and store fit error.

Example:

```text
Recovered Arc Radius
5.0363 mm

Fit RMS Error
0.014 mm

Confidence
High
```

If geometry is irregular:

```text
Confidence
Low

⚠ Original path may not be a true circle.
```

Allow conversion to:

```text
Custom Spline
```

instead of forcing a circular fit.

## 18. Units and Scale Integration

Recovered geometry values initially exist in raw model units.

Example:

```text
radiusRaw = 5.0363
reliefRaw = 0.50
```

After calibration:

```text
physicalValueMM
=
rawValue
× rawUnitToMM
× calibrationScale
× relevant model scale
```

When overall model size changes, the user must choose whether branding values:

```text
A. scale proportionally with model
or
B. preserve their physical dimensions
```

This is the same rule described in the Units / Scale specification.

## 19. Non-Destructive Reference Workflow

Do not permanently destroy recovered data after deleting branding.

Scene data can contain:

```text
Button
│
├── Original Branding Reference [hidden]
│    ├── recovered curve
│    ├── recovered placement
│    └── recovered relief
│
└── New Branding
     ├── Tiffany
     └── Blue
```

The reference object does not need to render by default.

The user can toggle:

```text
☐ Show Original Branding Reference
```

This is useful for visual comparison.

## 20. Overlay Comparison

Provide an optional comparison view:

```text
☑ Show Original Reference
```

Possible rendering:

```text
Old branding reference:
wireframe / translucent

New branding:
solid
```

This helps the user match:

- radius
- baseline
- centre
- spacing
- coverage

without restoring the old branding into the final export.

## 21. Acceptance Criteria

- [ ] Selecting old branding can run "Analyse Branding".
- [ ] Original branding is analysed before deletion.
- [ ] Circle/arc fitting produces numeric values.
- [ ] Fitted values include error/confidence.
- [ ] Original recovered values are preserved.
- [ ] Replacement text can inherit the recovered curve.
- [ ] Radius has an exact editable numeric field.
- [ ] Start/end angle and arc span have numeric fields.
- [ ] Pointer handles update numeric fields.
- [ ] Numeric edits update pointer/viewport handles.
- [ ] More/fewer characters do not silently change radius.
- [ ] User chooses text-fit policy.
- [ ] Raised/recessed geometry can be classified where possible.
- [ ] Relief/depth estimates are labelled as estimates.
- [ ] Relief uses local surface normals rather than only world-axis distance.
- [ ] Unit calibration updates recovered physical values.
- [ ] "Reset to Recovered Values" works.
- [ ] Original branding reference can be optionally shown as an overlay.

## 22. Product Principle

For imported OBJ assets:

> **Preserve the design intelligence that can be recovered from the old geometry before removing it.**

And:

> **Professional geometry controls must always have exact numeric values. Pointer dragging is an additional interaction, not the only method of editing.**


---

# Addendum — Hybrid Value Controls (Slider + Exact Numeric Input + Value Markers)

## 23. UI Pattern Requirement for Value Editing

For important geometric values, the editor should not rely on:

- pointer-only dragging in the viewport
- raw numeric input only
- a plain generic slider without context

Instead, use a **hybrid control pattern**:

```text
exact numeric input
+
slider / drag control
+
live value label
+
visual value marker / bar
```

This is especially appropriate for:

- curve radius
- arc start / end
- arc span
- arc position
- letter spacing
- text size
- emboss height
- deboss depth
- surface offset
- overall model scale
- calibration values
- ruler precision

## 24. Reference UX Pattern

Use a control style similar to the attached mobile example:

- slider track
- one or two draggable handles
- current values shown above the handles
- a small **vertical marker line / value bar** connecting the value label to the track
- clear visual distinction between active range and inactive range

Conceptually:

```text
          21            35
           │             │
───────────●─────────────●───────────
```

The vertical connector line is important because it visually ties the numeric value to the exact point on the slider.

For single-value controls:

```text
                5.04
                 │
───────────────●────────────────────
```

For two-value / range controls:

```text
          72.5°                 287.5°
            │                      │
────────────●──────────────────────●────────────
```

## 25. Rule — Slider Must Not Replace Exact Input

The slider is for convenient adjustment.

The exact numeric value remains the authoritative editable value.

Each control should therefore provide both:

### A. Direct manipulation

```text
drag handle
```

### B. Exact value input

```text
type:
5.0363
```

Example:

```text
Radius
[ 5.0363 ] mm
                5.04
                 │
───────────────●────────────────────
```

If the user drags the handle, the input field updates.

If the user types in the input field, the handle position updates.

## 26. Recommended Curve Control Layout

For curve-related properties, use a structured panel:

```text
CURVE / PATH

Radius
[ 5.0363 ] mm
                5.04
                 │
───────────────●────────────────────

Start Angle
[ 72.50 ] °
          72.5
            │
────────────●────────────────────────

End Angle
[ 287.50 ] °
                              287.5
                                │
────────────────────────────────●────

Arc Span
[ 215.00 ] °
                    215.0
                      │
─────────────────────●────────────────

Arc Position
[ 0.00 ] °
                 0
                 │
───────────────●────────────────────

Letter Spacing
[ 0.120 ] mm
                0.12
                 │
───────────────●────────────────────
```

For controls like:

- Start Angle + End Angle
- Min Age + Max Age
- Min Size + Max Size

use a **dual-handle range slider** with value labels above each handle and connector lines.

## 27. Recommended Emboss / Deboss Control Layout

```text
Emboss Height
[ 0.320 ] mm
                0.32
                 │
───────────────●────────────────────

Deboss Depth
[ 0.250 ] mm
               0.25
                 │
──────────────●─────────────────────
```

Recommended ranges should be context-aware.

For example, if the model is physically very small, the depth/height slider range should adapt accordingly rather than always using a huge global range.

## 28. Value Bar / Vertical Marker Requirement

The user specifically wants the value indicator to be visualized with a **vertical bar / line marker**, not merely changing the number in a separate field.

Requirement:

> Every slider-like control for important geometric values should show the current value directly above the handle, with a vertical line/marker visually connecting the label to the track.

This improves:

- readability
- precision perception
- mobile usability
- quick visual comparison
- understanding of two-handle range controls

This should apply to both desktop and mobile-responsive layouts.

## 29. Desktop and Mobile Behavior

### Desktop

Preferred layout:

```text
[ numeric input ] [ unit ]     slider with value labels
```

Example:

```text
Radius   [ 5.0363 ] [ mm ]
                    5.04
                     │
────────────────────●────────────────────
```

### Mobile / Narrow Layout

Stack controls:

```text
Radius
[ 5.0363 ] [ mm ]

                5.04
                 │
───────────────●────────────────────
```

The attached screenshot is a good mobile pattern reference.

## 30. Dual-Handle Range Slider Requirement

For paired values, use a proper two-thumb slider.

Examples:

- start / end angle
- min / max size
- age range (from the reference image)
- selection ranges
- allowable tolerance bands

UI pattern:

```text
     Start                 End
     72.5                 287.5
       │                     │
───────●─────────────────────●───────
```

Recommended rule:

- values must not overlap visually if possible
- when handles are close, labels may stack or offset intelligently
- both labels keep their own vertical marker line
- active range between the handles should use a highlighted track color

## 31. Track Styling and States

Each slider should visually distinguish:

- inactive range
- active value/range
- focused handle
- disabled state
- hovered state
- invalid state
- warning state

Recommended styling semantics:

```text
inactive track  = neutral gray
active track    = theme accent color
handle          = filled circle
value marker    = thin vertical line
value bubble    = compact number label
```

For example:

```text
neutral track: ───────────────
active track:  ═══════
handle:        ●
marker line:   │
```

## 32. Editing Precision

Sliders should support coarse adjustment, while inputs provide exact precision.

Also support keyboard/mouse precision modifiers.

Example:

```text
drag slider
→ coarse / fast

hold Shift
→ larger step

hold Alt/Option
→ fine adjustment
```

For numeric inputs:

- arrow up/down
- shift + arrow
- alt/option + arrow

This should integrate with the same value state.

## 33. Snapping and Soft Constraints

Optional enhancement:

- snap slider values to helpful increments
- show tick marks at meaningful values
- soft limits with manual override

Examples:

```text
Radius:
snap every 0.1 mm

Angle:
snap every 1°

Emboss / Deboss:
snap every 0.01 mm
```

But manual direct typing must still allow exact values.

## 34. UI Components To Standardize

Claude Code should implement a reusable component library for these controls.

Suggested components:

```ts
<ValueSlider />
<RangeValueSlider />
<UnitNumberInput />
<PrecisionNumberInput />
<ValueBadge />
<ValueMarker />
```

Suggested props:

```ts
interface ValueSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayUnit?: string;
  precision?: number;
  showValueMarker?: boolean;
  showValueLabel?: boolean;
  onChange: (value: number) => void;
}
```

For dual-handle sliders:

```ts
interface RangeValueSliderProps {
  label: string;
  minValue: number;
  maxValue: number;
  min: number;
  max: number;
  step: number;
  precision?: number;
  displayUnit?: string;
  showValueMarker?: boolean;
  showValueLabel?: boolean;
  onChange: (minValue: number, maxValue: number) => void;
}
```

## 35. Where This UI Pattern Must Be Used

At minimum, apply this pattern to:

### Units / Scale
- X size
- Y size
- Z size
- uniform scale %
- calibration known distance
- ruler precision

### Branding / Curve
- radius
- start angle
- end angle
- arc span
- arc position
- baseline offset
- letter spacing
- text size

### Relief / Geometry
- emboss height
- deboss depth
- bevel
- surface offset

This pattern is not mandatory for every obscure expert setting, but it should be standard for all frequently adjusted values.

## 36. Acceptance Criteria for Value Controls

- [ ] Important numeric geometry settings include an exact numeric input.
- [ ] Important numeric geometry settings include a slider or equivalent drag control.
- [ ] Slider values are shown directly above the handle.
- [ ] A vertical marker line connects each value label to the handle/track.
- [ ] Dual-range controls display two independent values and two marker lines.
- [ ] Dragging updates numeric fields live.
- [ ] Typing values updates slider positions live.
- [ ] Active range on dual sliders is visually highlighted.
- [ ] Mobile layout remains readable.
- [ ] Value labels avoid collision when handles are close.
- [ ] Keyboard precision stepping works.
- [ ] Units and precision formatting are consistent with the rest of the editor.

## 37. Product Principle

> **For professional geometry editing, every important value should be both visually draggable and numerically editable.**

And:

> **Show the value where the value lives — directly on the control with a visible marker line — not only in a detached number field.**
