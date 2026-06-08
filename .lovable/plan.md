## Fix: "All" = 1 per family, family chips = full family

**File:** `src/pages/DesignerStudioTrimLibrary.tsx`

Update the `displayProducts` useMemo so the 1-per-family cap only applies when neither a family chip nor the brand-badge chip is active. When a family chip is selected, return all products from that family unchanged.

### Logic
```text
if (activeFamily || activeBrandBadge) {
  displayProducts = products            // show everything from current filter
} else {
  displayProducts = 1 per family        // curated overview for "All"
}
```

### Result
- **All chip** → 3 cards (one per family, prefer ones with 3D model)
- **Hardware / Soft Trims / Branding Trims chip** → every product in that family
- **Brand badge chip** → every brand product
- Search still narrows within the current view
