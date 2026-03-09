

# Full Design System Redesign Following Frameless Asia Pacific

## Analysis of Frameless Website

From deep study of frameless-asia-pacific.com, the key design characteristics are:

**Visual Direction**: Clean, modern, industrial-fashion aesthetic. White background, black text, minimal color. Teal/cyan accent (`#26B4C5`) used sparingly. No warm neutrals -- pure black and white contrast.

**Typography**: Sans-serif only. The site uses a geometric/grotesque sans-serif throughout (similar to Poppins or DM Sans). Both headings and body use the same family at different weights. Headings are bold, large, with tight line-height. Body text is light weight, generous line-height.

**Navigation**: Clean horizontal nav, logo left, links center, two CTA buttons right ("Contact" filled black, "B2B login" outlined). No language switcher visible. Simple hover states. White background, no border.

**Buttons**: Rounded pill-shaped (large border-radius ~30px). Primary: black fill with white text. Secondary: outlined black. Accent: teal/cyan fill. No red.

**Layout**: Full-width sections, generous whitespace. Hero is a large slider with text left + product image right on light gray background. Process section uses numbered steps (01, 02, 03) with images. Product grid is 4-column with square images.

**Footer**: The site is a single-page layout with sections flowing into each other. Contact section has office locations with country flags. Newsletter subscription area with dark background. Career section at bottom.

**Color Palette**:
- Background: `#FFFFFF` (pure white)
- Text: `#212121` (near-black)
- Accent: `#26B4C5` (teal/cyan)
- Section BG alt: `#F5F5F5` (light gray)
- Buttons: `#000000` fill, `#FFFFFF` text

---

## Implementation Plan

Given the scope, this will be broken into multiple steps. Here is the full plan for Phase 1 (foundation):

### 1. Replace Font System

**Current**: Cormorant Garamond (serif headings) + Inter (body) + Noto Sans TC (Chinese)
**New**: Poppins (all headings & body, matching Frameless geometric style) + Noto Sans TC (Chinese retained)

Files to change:
- `index.html` -- replace Google Fonts `<link>` tags
- `tailwind.config.ts` -- update `fontFamily` to remove serif, set Poppins as primary sans
- `src/index.css` -- update `body` and `h1-h6` font-family rules to use Poppins

### 2. Replace Color System

**Current**: Warm neutrals with HSL vars, brand-red accent (#EC1C24), corporate-gold/bronze
**New**: Monochrome + teal accent

Update `src/index.css` CSS variables:
```
--background: 0 0% 100%        (pure white)
--foreground: 0 0% 13%          (#212121)
--primary: 0 0% 0%              (black)
--primary-foreground: 0 0% 100% (white)
--accent: 184 66% 46%           (#26B4C5 teal)
--accent-foreground: 0 0% 100%
--secondary: 0 0% 96%           (#F5F5F5)
--muted: 0 0% 94%
--muted-foreground: 0 0% 45%
--border: 0 0% 90%
```

Remove `brand-red`, `corporate-gold/bronze/cream`, `green-*` CSS vars and Tailwind color extensions. Replace with a single `accent-teal` or just use `accent`.

### 3. Update Button System

Replace rounded-md pill style. Update `src/components/ui/button.tsx`:
- Default variant: black bg, white text, `rounded-full` (pill shape)
- Outline variant: black border, transparent bg, `rounded-full`
- New accent variant: teal bg, white text, `rounded-full`
- Remove red glow/pulse utilities from `src/index.css`

### 4. Redesign Header

Update `src/components/layout/Header.tsx`:
- White bg, no border-bottom (or very subtle)
- Logo left: WIN-CYC text in black (remove red color)
- Center nav links: Products, About, Production, Sustainability, News, Designer Studio
- Right: "Contact" button (filled black pill) + "B2B Login" button (outlined black pill)
- Remove language switcher from header (move to footer or remove)
- Remove brand-red accent from all header elements

### 5. Redesign Footer

Update `src/components/layout/Footer.tsx`:
- Light background (white or very light gray) instead of dark `bg-foreground`
- Clean 4-column grid: Company info, Navigation, Products, Contact
- Remove certification badges from footer (move to dedicated page)
- Use teal accent for hover states instead of red
- Simpler, more minimal layout

### 6. Update Global CSS Utilities

In `src/index.css`:
- Remove `.link-elegant` red underline animation, replace with black or teal
- Remove `.accent-line` red gradient, replace with neutral
- Remove `.btn-elegant` old button style
- Remove `.btn-red-glow`, `.btn-red-pulse` utilities
- Update `.card-hover` to simpler shadow
- Update `.text-display` to use Poppins bold instead of Cormorant serif
- Update `.text-subtitle` tracking style

### 7. Update Component Typography

All components using `font-serif` or `font-chinese` explicitly:
- Replace `font-serif` with `font-sans` everywhere
- Keep `font-chinese` for explicit Chinese text blocks
- Update heading sizes to match Frameless scale (larger, bolder)

### Files Affected (Phase 1)

| File | Change |
|------|--------|
| `index.html` | Replace font CDN links |
| `src/index.css` | Full CSS variable overhaul, utility classes |
| `tailwind.config.ts` | Font families, color palette, remove unused |
| `src/components/ui/button.tsx` | Pill shape, new variants |
| `src/components/layout/Header.tsx` | Full redesign |
| `src/components/layout/Footer.tsx` | Full redesign |
| `src/components/home/HeroSection.tsx` | Remove red accents, update typography |
| `src/components/home/ProductCategories.tsx` | Update card styling |
| `src/components/home/HeritageSection.tsx` | Typography updates |
| `src/components/home/DesignerCTA.tsx` | Button/color updates |
| `src/components/home/SustainabilitySection.tsx` | Remove green palette, use teal |
| `src/components/home/ContactSection.tsx` | Update styling |

This is a large multi-file change. I recommend implementing it in 2-3 steps:
1. Foundation (CSS vars, fonts, Tailwind config, button component)
2. Header + Footer redesign
3. Homepage sections update

