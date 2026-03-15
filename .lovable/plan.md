

## Plan: Replace Brochure 1 Images and Rename

### Current State
- Brochure 1 (id: `31e65670-ec13-4c35-9a44-aa756deddb75`, slug: `spring-collection-2025`) has 10 pages with picsum placeholder images
- User uploaded 10 product catalog images (buttons: B30-B34, RDEL series)

### Steps

**1. Copy uploaded images to project**
Copy all 10 images to `public/brochure-pages/` directory for direct serving.

**2. Update brochure metadata via SQL migration**
- Title: "Button Brochure" 
- Description: "Products featuring polyester and metal buttons"
- Slug: `button-brochure`

```sql
UPDATE flipbook_brochures 
SET title = 'Button Brochure',
    description = 'Products featuring polyester and metal buttons',
    slug = 'button-brochure'
WHERE id = '31e65670-ec13-4c35-9a44-aa756deddb75';
```

**3. Update page image URLs via SQL migration**
Update each of the 10 existing page records to point to the new images in order:
1. B30.jpg, 2. B31.jpg, 3. B32.jpg, 4. B33.jpg, 5. B34.jpg, 6. RDEL-07-10690.jpg, 7. RDEL-07-10691.jpg, 8. RDEL-07-10692.jpg, 9. RDEL-07-10695.jpg, 10. RDEL-11-11833.jpg

**4. Update cover image**
Set the brochure's `cover_image_url` to the first page image (B30.jpg).

**5. Update any hardcoded references**
- Check `UploadModal.tsx` which navigates to `spring-collection-2025` slug and update to `button-brochure`
- Check `brochures.ts` mock data if still referenced

### Files touched
- `public/brochure-pages/` (10 new image files)
- SQL migration (rename + update page URLs)
- `src/components/UploadModal.tsx` (update demo slug)
- `src/data/brochures.ts` (update if still used)

