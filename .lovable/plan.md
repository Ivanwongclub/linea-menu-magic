## Problem

On the Woven Badges detail page, the left thumbnail strip with the "3D" tile is missing, unlike Eco Lace Trim which shows it.

Root cause: in `src/pages/ProductDetail.tsx`, the `HeroGallery` component only renders the left thumbnail rail when `images.length > 1`. The 3D tile lives inside that same rail, so single-image products never show it — even when `model_url` is set in the database (Woven Badges has `/models/metal-badge.obj` set correctly).

## Fix

Change the rail's visibility condition so it renders when there are multiple images **or** a 3D model is available.

In `src/pages/ProductDetail.tsx` (~line 62), update the desktop rail wrapper:

- From: `{images.length > 1 && ( ... )}`
- To:   `{(images.length > 1 || has3D) && ( ... )}`

Inside the rail, keep the existing `images.map(...)` (it naturally renders 1 thumb if there's only one image) and the existing `{has3D && ...}` 3D tile. The mobile horizontal thumbs block stays as-is (it only deals with images, not 3D).

## Verification

- `/designer-studio/products/badge-woven` now shows a single image thumbnail plus the "3D" tile in the left rail; clicking 3D opens the model viewer.
- `/designer-studio/products/eco-lace-trim` and other multi-image PDPs render unchanged.
- Products without `model_url` and only one image still show no rail (unchanged behaviour).
