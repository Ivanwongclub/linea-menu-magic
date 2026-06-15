GRANT SELECT ON public.flipbook_brochures TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flipbook_brochures TO authenticated;
GRANT ALL ON public.flipbook_brochures TO service_role;

GRANT SELECT ON public.flipbook_pages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flipbook_pages TO authenticated;
GRANT ALL ON public.flipbook_pages TO service_role;

GRANT SELECT ON public.flipbook_hotlinks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.flipbook_hotlinks TO authenticated;
GRANT ALL ON public.flipbook_hotlinks TO service_role;