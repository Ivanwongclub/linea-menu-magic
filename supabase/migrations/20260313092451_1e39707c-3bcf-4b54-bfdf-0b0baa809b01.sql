-- 1. flipbook_brochures
CREATE TABLE public.flipbook_brochures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  slug TEXT UNIQUE NOT NULL,
  cover_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.flipbook_brochures ENABLE ROW LEVEL SECURITY;

-- 2. flipbook_pages
CREATE TABLE public.flipbook_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brochure_id UUID NOT NULL REFERENCES public.flipbook_brochures(id) ON DELETE CASCADE,
  page_number INT NOT NULL,
  image_url TEXT NOT NULL
);

ALTER TABLE public.flipbook_pages ENABLE ROW LEVEL SECURITY;

-- 3. flipbook_hotlinks
CREATE TABLE public.flipbook_hotlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES public.flipbook_pages(id) ON DELETE CASCADE,
  label TEXT,
  url TEXT,
  x DOUBLE PRECISION,
  y DOUBLE PRECISION,
  width DOUBLE PRECISION,
  height DOUBLE PRECISION
);

ALTER TABLE public.flipbook_hotlinks ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_flipbook_brochures_updated_at
  BEFORE UPDATE ON public.flipbook_brochures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: Public SELECT on published brochures
CREATE POLICY "Public can view published brochures"
  ON public.flipbook_brochures FOR SELECT
  USING (status = 'published');

-- RLS: Public SELECT on pages of published brochures
CREATE POLICY "Public can view pages of published brochures"
  ON public.flipbook_pages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.flipbook_brochures
      WHERE id = brochure_id AND status = 'published'
    )
  );

-- RLS: Authenticated full access to all three tables
CREATE POLICY "Authenticated full access brochures"
  ON public.flipbook_brochures FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access pages"
  ON public.flipbook_pages FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated full access hotlinks"
  ON public.flipbook_hotlinks FOR ALL
  TO authenticated USING (true) WITH CHECK (true);

-- Storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('flipbook-assets', 'flipbook-assets', true);

CREATE POLICY "Public read flipbook assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'flipbook-assets');

CREATE POLICY "Authenticated upload flipbook assets"
  ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'flipbook-assets');

CREATE POLICY "Authenticated update flipbook assets"
  ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'flipbook-assets');

CREATE POLICY "Authenticated delete flipbook assets"
  ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'flipbook-assets');