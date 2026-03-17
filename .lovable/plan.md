

## Problem

The Polo Button OBJ file has large geometry dimensions in world units. The camera starts at position `[0, 1.5, 3]`, which places it **inside** the model, causing the zoomed-in/clipped view shown in the screenshot.

## Solution

Normalize the OBJ model size in `OBJModelLoader.tsx` after loading. Compute the bounding box, then scale the model so it fits within a consistent size (e.g., radius ~1.5 units), regardless of the original OBJ dimensions.

### Changes

**`src/components/designer-studio/OBJModelLoader.tsx`**
- After cloning and applying materials, compute the bounding box of the model
- Calculate the max dimension and derive a scale factor to normalize to ~1.5 units
- Apply the scale to the cloned object

This is a ~5-line addition in the `useMemo` block:

```ts
// After traverse, normalize size
const box = new THREE.Box3().setFromObject(clone);
const size = box.getSize(new THREE.Vector3());
const maxDim = Math.max(size.x, size.y, size.z);
const scale = 2 / maxDim; // fit within ~2 units
clone.scale.setScalar(scale);
```

No other files need changes. The `<Center>` component already handles centering the model at origin.

