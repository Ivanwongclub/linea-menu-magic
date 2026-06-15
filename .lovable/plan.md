## Problem

The `/ecollections` page renders "No catalogues published yet" even though the database has 3 published brochures (Zip, Lace, Button Collection).

Root cause: `public.flipbook_brochures` and `public.flipbook_pages` have **no GRANTs** to the API roles (`anon`, `authenticated`, `service_role`). Supabase's Data API (PostgREST) requires GRANTs *in addition to* RLS — without them, every query returns empty results regardless of policy. The RLS policy "Public can view published brochures" is correctly defined but never reached.

`flipbook_hotlinks` likely has the same issue and is needed by the viewer.

## Fix (single migration)

```sql
-- Brochures: public reads published rows, authenticated users manage
GRANT SELECT ON public.flipbook_brochures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flipbook_brochures TO authenticated;
GRANT ALL ON public.flipbook_brochures TO service_role;

-- Pages: same access pattern (needed for cover thumbnails + viewer)
GRANT SELECT ON public.flipbook_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flipbook_pages TO authenticated;
GRANT ALL ON public.flipbook_pages TO service_role;

-- Hotlinks: needed when viewing a brochure
GRANT SELECT ON public.flipbook_hotlinks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flipbook_hotlinks TO authenticated;
GRANT ALL ON public.flipbook_hotlinks TO service_role;
```

## Verification

After the migration:
1. Reload `/ecollections` — the three published brochures (Zip, Lace, Button Collection) should appear as cards.
2. Click into one — flipbook viewer should load pages and hotlinks.

No frontend code changes required. Existing RLS policies remain unchanged and continue to gate writes.
