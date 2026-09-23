# OBJ / Rhino Units & Scale — Research Findings

**Date:** 17 September 2026  
**Purpose:** Separate research note for the browser-based 3D OBJ editor.

## Key Findings

### 1. Rhino has a formal model unit system

Rhino has a document-level **Model Units** setting. The model can be authored in millimeters, centimeters, meters, inches, feet, and other units.

When changing the Rhino unit system, Rhino can scale the geometry so that the same real-world physical size is preserved.

Official source:  
https://docs.mcneel.com/rhino/8/help/en-us/documentproperties/units.htm

### 2. OBJ does not reliably carry physical units

Wavefront OBJ stores numeric geometry coordinates, but it does not have a standard physical-unit field that says those coordinates are millimeters, centimeters, inches, etc.

McNeel/Rhino staff explicitly describe OBJ as **unitless**.

Sources:

- https://discourse.mcneel.com/t/rhino-v5-obj-import-size-very-small/81531
- https://discourse.mcneel.com/t/need-real-world-units-for-augmented-reality-export/120518
- https://discourse.mcneel.com/t/units-are-differents-when-i-import-from-maya/164845
- https://www.loc.gov/preservation/digital/formats/fdd/fdd000507

### 3. Therefore Rhino units and OBJ coordinates are not the same concept

Example:

```text
Rhino document:
Model Units = millimeters

A vertex coordinate:
10.8

Meaning inside Rhino:
10.8 mm

Export to OBJ:
v 10.8 ...

The OBJ keeps:
10.8

But the standard OBJ does not retain:
"this is millimeters"
```

The receiving application must know or establish how the raw coordinate values should be interpreted.

### 4. The editor can still calculate numerical dimensions

The browser can calculate the model's bounding box directly from OBJ vertices.

Three.js `Box3` can calculate an axis-aligned bounding box and return its X/Y/Z size.

Source:  
https://threejs.org/docs/pages/Box3.html

For rotated objects, an oriented bounding box can be more appropriate:

https://threejs.org/docs/pages/OBB.html

### 5. Reference file checked in this project

File:

```text
Polo Button 10.8 (1).obj
```

Header:

```text
# Rhino
```

Vertex count:

```text
17,171
```

Raw bounding-box coordinates:

```text
X: -9.402863 → 5.593110
Y:  0.113983 → 4.253479
Z: -7.641930 → 7.354043
```

Raw bounding-box size:

```text
X = 14.995973 coordinate units
Y =  4.139496 coordinate units
Z = 14.995974 coordinate units
```

These are **coordinate-unit dimensions**, not proven millimeter dimensions.

The filename contains `10.8`, but the software must not infer that `10.8` is the total diameter or the physical unit.

### 6. Four different concepts must stay separate

The editor must distinguish:

```text
1. Raw OBJ coordinate
2. Physical-unit interpretation
3. Display unit
4. Model resize / scale
```

Example:

```text
Raw width = 15 coordinate units

Interpret 1 OBJ unit = 1 mm
→ physical width = 15 mm

Interpret 1 OBJ unit = 1 cm
→ physical width = 150 mm

Change display from mm to cm
15 mm → 1.5 cm
→ physical size does NOT change

Resize width from 15 mm to 10.8 mm
→ physical size DOES change
```

### 7. The viewport should have a Ruler ON/OFF toggle

Required UX:

```text
[ 📏 Ruler ]
```

Ruler OFF:

```text
Clean 3D preview
No measurement overlays
```

Ruler ON:

```text
Show X / Y / Z physical dimensions
Show dimension lines and labels around model
Update live while resizing
```

The ruler is visualization only and must never become exported model geometry.

### 8. Size calibration should be a first-class function

Because OBJ is unitless, the editor should let the user calibrate the model from a known real-world dimension.

Example:

```text
Current measured distance:
14.996 OBJ units

Known real size:
10.800 mm

Apply calibration
```

A stronger method is two-point calibration:

```text
Click point A
Click point B
Enter actual distance
Editor calculates scale automatically
```

Three.js `Raycaster` can be used for picking points on a mesh:

https://threejs.org/docs/pages/Raycaster.html

### 9. Internal canonical unit should be millimeters

For this product, millimeters are the best canonical physical unit because the target workflow includes:

- buttons
- jewellery
- product components
- emboss
- deboss
- engraving
- small manufacturing dimensions

Values such as:

```text
Emboss height = 0.30 mm
Deboss depth = 0.25 mm
Edge margin = 0.50 mm
```

only have reliable meaning after physical scale has been confirmed.

### 10. glTF / GLB export has different unit semantics

glTF defines linear distances in **meters**.

Source:  
https://registry.khronos.org/glTF/specs/2.0/glTF-2.0.html

Therefore, if the editor works internally in millimeters:

```text
10.8 mm
→ 0.0108 meters in glTF
```

The GLB/glTF exporter must perform that conversion.

## Core Product Rule

> **OBJ coordinate units are not physical units until a user or trusted source establishes the mapping.**

And the UI must never confuse:

```text
CHANGE DISPLAY UNIT
≠
REINTERPRET OBJ UNIT
≠
RESIZE MODEL
```


---

# Addendum — Recovering Original Branding Geometry Parameters from OBJ

## Key Finding

A Wavefront OBJ does **not** preserve the original CAD/modelling operation history.

Therefore, an OBJ normally does **not** contain semantic parameters such as:

```text
Curve Radius = 5.00 mm
Arc Span = 240°
Emboss Height = 0.30 mm
Deboss Depth = 0.20 mm
```

as editable named values.

Instead, the OBJ contains the **final tessellated geometry**:

- vertex coordinates
- faces
- normals, where present
- object/group structure
- optional texture/material references

The editor can often **reverse-engineer useful values from that final geometry**, but those values must be labelled as measured/inferred values rather than original CAD parameters.

## Findings From the Current Polo Button OBJ

For:

```text
Polo Button 10.8 (1).obj
```

the branding geometry is separated from the main model into many OBJ groups. The previously analysed structure was:

```text
object_1 → object_5
main button geometry

object_6 → object_33
branding-related geometry
```

The OBJ does not contain literal metadata terms such as:

```text
emboss
deboss
curve
radius
depth
```

The original branding path can nevertheless be estimated from the positions of the branding geometry.

A geometric circle fit to the branding-group positions gave an approximate reference radius of:

```text
≈ 5.04 raw OBJ coordinate units
```

This is a **recovered geometric value**, not an explicit value stored in the OBJ.

The exact physical value in millimeters cannot be known until the OBJ unit/scale is established.

Example:

```text
Recovered raw radius:
5.04 OBJ units

If:
1 OBJ unit = 1 mm

then:
Recovered physical radius ≈ 5.04 mm
```

If the model is later calibrated to another scale, the physical radius must update accordingly.

## Emboss / Deboss Information in OBJ

OBJ also does not normally preserve:

```text
operation = emboss
operation = deboss
extrusion height = X
engraving depth = Y
```

What can be detected is the **resulting geometry**.

For raised branding:

```text
base surface
↓
side walls
↓
top surface
```

the editor can estimate a relief height by comparing the branding geometry against the underlying model surface.

For recessed branding:

```text
original surface
↓
engraved / recessed floor
```

the editor can estimate a depth by reconstructing or sampling the surrounding original surface and comparing it to the recessed geometry.

These are reconstructed measurements.

They are not guaranteed to be the same numeric parameter that the original designer entered in Rhino, Blender, CAD software, etc.

## Current Polo Button Branding Relief

The current branding appears to be **raised geometry**, not a semantic "emboss" instruction stored in the file.

Analysis of the branding side-wall geometry indicates a relief on the order of approximately:

```text
~0.5 raw OBJ coordinate unit
```

in many areas.

This should be treated as an **estimated relief from final mesh geometry**, not as proof that the original modeller entered exactly `0.5` as an emboss parameter.

Reasons the measured mesh may vary include:

- curved underlying surface
- bevels
- tessellation
- surface-following text
- Boolean result geometry
- local topology
- export precision

## Product Requirement

When the editor removes existing branding, it should **first analyse and preserve a reference profile**.

Do not simply delete the selected mesh and throw away all geometric information.

Recommended process:

```text
Select existing branding
↓
Analyse geometry
↓
Recover reference parameters
↓
Store Branding Reference Profile
↓
Remove / hide old branding
↓
Add replacement branding using recovered profile
```

Suggested recoverable properties:

```text
Reference Curve
- fitted centre
- radius
- start angle
- end angle
- arc span
- clockwise / counter-clockwise direction
- baseline offset

Typography Geometry
- approximate character height
- occupied arc length
- average glyph spacing
- per-glyph centre angle
- per-glyph orientation

Surface Relationship
- surface normal
- surface offset
- surface-conform behaviour
- local projection direction

Relief
- raised / recessed / ambiguous classification
- estimated emboss relief
- estimated deboss depth
- bevel estimate where detectable

Quality
- curve fitting error
- confidence level
```

## Important Terminology

The UI should clearly distinguish:

```text
SOURCE VALUE
A true stored parameter from a source format that supports it.

RECOVERED VALUE
Measured or fitted from final OBJ geometry.

USER VALUE
A value intentionally entered/adjusted in this editor.
```

For ordinary OBJ files, most curve and relief values will be:

```text
Recovered Value
```

not:

```text
Source Value
```

This distinction is important for professional use.
