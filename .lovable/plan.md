

## Plan: Tighten Products Mega Menu Layout

### Problem
The screenshot shows a large blank gap between the text columns (Hardware, Soft Trims, Branding Trims) and the image panel on the right. The `gap-16` (4rem) between columns plus `ml-auto` on the image pushes it to the far right, leaving dead space in the middle.

### Recommended Layout
- Remove `ml-auto` from the image panel so it sits right next to the text columns
- Reduce `gap-16` to `gap-10` between the flex children
- Reduce image from `w-[480px]` to `w-[400px]` for better proportion
- Keep `items-start` alignment

### Changes — `src/components/layout/Header.tsx`

1. **Line 403** — Change `gap-16` to `gap-10`:
   ```
   flex items-start gap-10
   ```

2. **Line 466** — Remove `ml-auto`, reduce width from `480px` to `400px`:
   ```
   flex-shrink-0 w-[400px] flex flex-col
   ```

### Files modified
- `src/components/layout/Header.tsx` — two small class changes

