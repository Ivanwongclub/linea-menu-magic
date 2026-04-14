

## Plan: Regenerate All Product Images with Reference-Accurate Style

### Problem
The current AI-generated images don't match the real product photography style shown in the uploaded references. The references show:
- Multiple pieces (5-10) scattered naturally at varied angles — some face-up, some tilted, some showing backs/shanks
- A warm off-white background (not stark pure white)
- Higher camera angle (~25-30°), showing more depth and dimension
- Very realistic metal surface rendering with crisp engraving detail
- Natural, relaxed clustering — not rigid geometric arrangements
- Soft natural shadows under each piece independently

### What changes

**1. Rewrite the master prompt template in the edge function**

The current prompt says "Single product or small cluster of 2-3 identical pieces" which produces sparse, stiff compositions. Replace with a prompt that closely describes the reference photos:

```
Professional product photography for a fashion hardware B2B catalogue.
{SUBJECT LINE}. {CATEGORY EXTRA}.
Off-white studio background with a very slight warm tone.
Show 5-8 pieces of the same product scattered naturally across the frame at varied angles — some face-up showing the engraved or textured face, some tilted at 20-40° to show depth and side profile, and at least one flipped to show the back or shank/post.
Soft diffused overhead studio lighting creating gentle gradients across curved metal surfaces.
Each piece casts its own soft individual drop shadow.
Camera angle approximately 25-30° above the surface — elevated enough to show depth but not a flat overhead lay.
Products fill 70-80% of frame with natural spacing between pieces.
Extremely sharp focus on surface detail: engraving lines, casting texture, knurled edges, enamel fills, plating finish.
Metal rendering: polished gold = mirror-bright warm reflections, antique brass = warm matte with subtle patina, gunmetal = dark cool reflective, nickel/silver = bright cool specular, rose gold = warm pink-tinted reflections.
Square 1:1 format. Photorealistic. No text, no hands, no garments, no props.
```

**2. Update CATEGORY_EXTRAS for more natural compositions**

Revise to match the multi-piece scattered style seen in references:
- Buttons: "Scatter 5-6 shank buttons at varied angles. Show ornate engraved crest faces on most, flip 1-2 to reveal the shank loop underneath. Mix of sizes if possible."
- Eyelets: "Scatter 15-20 eyelets and grommets in assorted sizes and colors (include painted colors like red, blue, teal, pink alongside metal finishes). Show both round and oval/oblong shapes. Some face-up, some showing barrel depth."
- Cord Stoppers: "Show 8-10 cord stoppers/locks in different shapes (barrel, cube, sphere, flat disc) and finishes (gold, gunmetal, silver, one colored). Scatter naturally with varied angles."

**3. Use higher-quality model**

Switch from `google/gemini-2.5-flash-image` to `google/gemini-3-pro-image-preview` for more photorealistic output that better matches the reference style.

**4. Regenerate all Track A local assets (21 files)**

Re-run all 17 product + 4 material texture generations with the updated prompts, overwriting existing files.

**5. Regenerate all Track B database images (54 products)**

Invoke the updated edge function in batches to regenerate all product images in Supabase Storage.

**6. No code changes needed beyond the edge function**

Header.tsx, HeroSection.tsx, productImage.ts, and display components remain as-is since file paths and import structure are unchanged.

### Files modified
- `supabase/functions/generate-product-images/index.ts` — rewritten prompt template and category extras
- `src/assets/products/*.jpg` — 17 files regenerated
- `src/assets/materials/*.jpg` — 4 files regenerated
- Supabase Storage — 54 product images regenerated

### Execution order
1. Deploy updated edge function with new prompts
2. Regenerate Track A local assets using the same prompt style via direct AI calls
3. Regenerate Track B database images via edge function batches

