

# Remove Hero Sections, Add Subtle Breadcrumbs

## Overview
Replace all hero/banner sections on non-homepage pages with a simple, subtle breadcrumb navigation. This creates a cleaner, more utilitarian feel and lets content speak for itself.

## Pages to Modify

### 1. `src/pages/Products.tsx`
- Remove the hero `<section>` (lines 145-161) with bg-secondary, large heading, subtitle
- Add a simple breadcrumb bar: `Home > Products` with small top padding (`pt-8 pb-4 px-6`)

### 2. `src/pages/About.tsx`
- Remove the hero `<section>` (lines 37-58) with accent lines, LetterReveal, subtitle
- Add breadcrumb: `Home > About`

### 3. `src/pages/Sustainability.tsx`
- Remove the hero `<section>` (lines 96-120) with accent lines, LetterReveal, subtitle
- Add breadcrumb: `Home > Sustainability`

### 4. `src/pages/News.tsx`
- Remove the hero `<section>` (lines 39-55)
- Add breadcrumb: `Home > News`

### 5. `src/pages/Contact.tsx`
- Remove the hero `<section>` (lines 58-84) with background image overlay
- Add breadcrumb: `Home > Contact`

### 6. `src/pages/about/Factory.tsx`
- Remove the hero `<section>` (lines 58-80) with background image
- Add breadcrumb: `Home > About > Factory`

### 7. `src/pages/about/Certificates.tsx`
- Remove the hero `<section>` (lines 90-106)
- Add breadcrumb: `Home > About > Certificates`

### 8. `src/pages/about/OurStory.tsx`
- Already uses `PageHeader` component — replace with breadcrumb: `Home > About > Our Story`

### 9. `src/pages/about/Sustainability.tsx`
- Already uses `PageHeader` — replace with breadcrumb: `Home > About > Sustainability`

## Breadcrumb Style
- Use existing `Breadcrumb` components from `@/components/ui/breadcrumb`
- Minimal layout: `pt-8 pb-4 px-6 lg:px-8` wrapper, `max-w-7xl mx-auto`
- Small muted text, chevron separators — consistent with existing `CategoryHeader` and `ProductInfo` usage
- Also include a simple page title below the breadcrumb: `text-2xl font-light` — keeps orientation without the heavy hero

## Cleanup
- Remove unused `heroRef`/`heroVisible` scroll animation refs from each page
- Remove `LetterReveal` import from pages that no longer use it (if not used elsewhere in the file)

