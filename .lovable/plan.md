

# Large Typography Headings & Section Redesign

## Overview
Implement bold, oversized typography for section headings across the homepage and products page, with each section getting a distinct heading style to create visual variety and editorial impact.

## Heading Styles Per Section

### 1. HeroSection — Giant stacked display type
- Increase to `text-6xl md:text-7xl lg:text-8xl` with tight letter-spacing
- Use ultra-light weight with one word bold for contrast
- Keep the existing parallax and scroll indicator

### 2. ProductCategories — Horizontal rule + massive serif heading
- Heading `text-5xl md:text-6xl lg:text-7xl` in serif font (Libre Caslon Text)
- Add horizontal accent lines flanking the subtitle
- Remove the small "Collection" subtitle, replace with a thin tracked uppercase label integrated with lines

### 3. HeritageSection — Outlined/stroke text heading
- Heading `text-5xl md:text-6xl lg:text-7xl` 
- Style "Our Story" with `-webkit-text-stroke` for an outlined/hollow effect on part of the heading
- Keep the image + "45 Years" badge layout

### 4. SustainabilitySection — Split large heading
- Heading `text-5xl md:text-6xl lg:text-7xl`
- "Our" in light weight, "Commitment" in bold — two-line split
- Add a vertical teal accent bar to the left of the heading

### 5. DesignerCTA — All-caps condensed massive heading
- Heading `text-5xl md:text-6xl lg:text-7xl` uppercase with extreme tracking `tracking-[0.15em]`
- Bold weight, white on dark background
- More dramatic presence for the CTA section

### 6. ContactSection — Elegant italic serif heading
- Heading `text-5xl md:text-6xl lg:text-7xl` in serif font with italic style
- Paired with small sans-serif uppercase subtitle above

### 7. Products page hero — Oversized number-style heading
- Main heading `text-5xl md:text-6xl lg:text-7xl` bold
- Products page category headings (`ProductCategory`) bumped to `text-4xl md:text-5xl`

## Navigation Menu Text
- Increase desktop nav link text from `text-sm` to `text-base` for better presence in the Header component

## Files to Modify
1. `src/components/layout/Header.tsx` — nav link size
2. `src/components/home/HeroSection.tsx` — giant display heading
3. `src/components/home/ProductCategories.tsx` — serif + accent lines heading
4. `src/components/home/HeritageSection.tsx` — outlined text heading
5. `src/components/home/SustainabilitySection.tsx` — split weight heading with accent bar
6. `src/components/home/DesignerCTA.tsx` — all-caps condensed heading
7. `src/components/home/ContactSection.tsx` — italic serif heading
8. `src/pages/Products.tsx` — oversized product page headings
9. `src/index.css` — add utility class for text-stroke/outlined heading if needed

