

# Replace Text Logo with Generated SVG Image

## What changes

1. **Create `/public/wincyc.svg`** — Generate an SVG file with "WIN-CYC" (bold) and "Group Limited" (small caps) styled to match the current text logo, black fill for the normal version.

2. **Create `/public/wincyc-white.svg`** — Same logo but with white fill, for use on dark backgrounds (hero transparent header, footer).

3. **Update Header logo** (`src/components/layout/Header.tsx`, lines 204-220):
   - Replace the text-based `<div>` with an `<img>` tag
   - Use `wincyc-white.svg` when `isTransparent`, `wincyc.svg` otherwise
   - Size: `h-10` (40px), auto width

4. **Update Footer logo** (`src/components/layout/Footer.tsx`, lines 13-25):
   - Replace the text-based `<div>` with `<img src="/wincyc-white.svg" />`
   - Size: `h-8` (32px), auto width

5. **Update BrandLogo component** (`src/components/viewer/BrandLogo.tsx`):
   - Replace text rendering with the SVG image, using variant prop to pick white/dark version

## Technical notes
- SVGs will use Poppins-style geometry matching the current font rendering
- Both SVGs have transparent backgrounds (no rect fill)
- The `isTransparent` conditional in the header switches between the two SVG variants

