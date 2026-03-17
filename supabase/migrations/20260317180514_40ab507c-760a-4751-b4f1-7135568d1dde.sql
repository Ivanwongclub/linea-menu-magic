
-- 1. design_sessions
CREATE TABLE public.design_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id text NOT NULL,
  name text NOT NULL,
  background_image_url text,
  background_image_width integer,
  background_image_height integer,
  thumbnail_url text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.design_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read design_sessions" ON public.design_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage design_sessions" ON public.design_sessions FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_design_sessions_updated_at
  BEFORE UPDATE ON public.design_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. design_layers
CREATE TABLE public.design_layers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.design_sessions(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  layer_order integer NOT NULL,
  name text,
  image_url text,
  x double precision NOT NULL DEFAULT 0.5,
  y double precision NOT NULL DEFAULT 0.5,
  scale double precision NOT NULL DEFAULT 1.0,
  rotation double precision NOT NULL DEFAULT 0,
  opacity double precision NOT NULL DEFAULT 1.0,
  flip_x boolean NOT NULL DEFAULT false,
  flip_y boolean NOT NULL DEFAULT false,
  is_visible boolean NOT NULL DEFAULT true,
  is_locked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.design_layers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read design_layers" ON public.design_layers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage design_layers" ON public.design_layers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. design_exports
CREATE TABLE public.design_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.design_sessions(id) ON DELETE CASCADE,
  export_url text,
  export_type text NOT NULL DEFAULT 'png',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.design_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read design_exports" ON public.design_exports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage design_exports" ON public.design_exports FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Enable realtime for design_layers (for collaborative editing)
ALTER PUBLICATION supabase_realtime ADD TABLE public.design_layers;

-- 5. Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('design-assets', 'design-assets', true);

CREATE POLICY "Public read design-assets" ON storage.objects FOR SELECT USING (bucket_id = 'design-assets');
CREATE POLICY "Authenticated upload design-assets" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'design-assets');
CREATE POLICY "Authenticated update design-assets" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'design-assets');
CREATE POLICY "Authenticated delete design-assets" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'design-assets');
