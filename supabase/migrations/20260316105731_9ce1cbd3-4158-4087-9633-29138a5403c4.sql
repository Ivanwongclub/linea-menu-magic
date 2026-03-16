
-- ==========================================
-- DROP PREVIOUS SCHEMA (from earlier migration)
-- ==========================================

-- Drop storage policies from old bucket
DROP POLICY IF EXISTS "Public read product images storage" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete product images" ON storage.objects;

-- Drop junction tables
DROP TABLE IF EXISTS public.product_certifications CASCADE;
DROP TABLE IF EXISTS public.product_industries CASCADE;
DROP TABLE IF EXISTS public.product_tags CASCADE;
DROP TABLE IF EXISTS public.product_materials CASCADE;
DROP TABLE IF EXISTS public.product_categories CASCADE;

-- Drop dependent tables
DROP TABLE IF EXISTS public.customization_requests CASCADE;
DROP TABLE IF EXISTS public.user_library_items CASCADE;
DROP TABLE IF EXISTS public.product_images CASCADE;

-- Drop main products table
DROP TABLE IF EXISTS public.products CASCADE;

-- Drop lookup tables
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.industries CASCADE;
DROP TABLE IF EXISTS public.certifications CASCADE;

-- Drop old enums
DROP TYPE IF EXISTS public.product_status CASCADE;
DROP TYPE IF EXISTS public.customization_status CASCADE;

-- ==========================================
-- 1. LOOKUP / TAXONOMY TABLES
-- ==========================================

CREATE TABLE public.product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  icon_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_categories" ON public.product_categories FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_categories" ON public.product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE,
  is_sustainable boolean NOT NULL DEFAULT false
);
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_materials" ON public.product_materials FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_materials" ON public.product_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE,
  sort_order integer NOT NULL DEFAULT 0
);
ALTER TABLE public.product_industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_industries" ON public.product_industries FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_industries" ON public.product_industries FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  abbreviation text,
  logo_url text
);
ALTER TABLE public.product_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_certifications" ON public.product_certifications FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_certifications" ON public.product_certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text UNIQUE,
  color text
);
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_tags" ON public.product_tags FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_tags" ON public.product_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 6. CORE PRODUCTS TABLE
-- ==========================================

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE,
  name text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  description text,
  description_en text,
  status text NOT NULL DEFAULT 'draft',
  is_public boolean NOT NULL DEFAULT true,
  is_customizable boolean NOT NULL DEFAULT false,
  specifications jsonb,
  production jsonb,
  thumbnail_url text,
  model_url text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active products" ON public.products
  FOR SELECT TO public
  USING (status = 'active' AND is_public = true);

CREATE POLICY "Authenticated read all products" ON public.products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated manage products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_item_code ON public.products(item_code);
CREATE INDEX idx_products_is_public ON public.products(is_public);

-- ==========================================
-- 7-11. JUNCTION TABLES (M2M)
-- ==========================================

CREATE TABLE public.product_category_map (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  PRIMARY KEY (product_id, category_id)
);
ALTER TABLE public.product_category_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_category_map" ON public.product_category_map FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_category_map" ON public.product_category_map FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_material_map (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.product_materials(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, material_id)
);
ALTER TABLE public.product_material_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_material_map" ON public.product_material_map FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_material_map" ON public.product_material_map FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_industry_map (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  industry_id uuid NOT NULL REFERENCES public.product_industries(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, industry_id)
);
ALTER TABLE public.product_industry_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_industry_map" ON public.product_industry_map FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_industry_map" ON public.product_industry_map FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_certification_map (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES public.product_certifications(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, certification_id)
);
ALTER TABLE public.product_certification_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_certification_map" ON public.product_certification_map FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_certification_map" ON public.product_certification_map FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.product_tag_map (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
ALTER TABLE public.product_tag_map ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_tag_map" ON public.product_tag_map FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_tag_map" ON public.product_tag_map FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 12. PRODUCT IMAGES
-- ==========================================

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  alt_text text,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_images" ON public.product_images FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- ==========================================
-- 13. USER LIBRARY ITEMS (B2B)
-- ==========================================

CREATE TABLE public.user_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  team_id uuid NOT NULL,
  team_name text,
  custom_name text,
  custom_description text,
  custom_brand text,
  custom_specs jsonb DEFAULT '{}'::jsonb,
  notes text,
  is_favourite boolean NOT NULL DEFAULT false,
  added_at timestamptz NOT NULL DEFAULT now(),
  added_by uuid,
  UNIQUE (product_id, team_id)
);
ALTER TABLE public.user_library_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read library items" ON public.user_library_items
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage library items" ON public.user_library_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX idx_user_library_items_team ON public.user_library_items(team_id);
CREATE INDEX idx_user_library_items_product ON public.user_library_items(product_id);

-- ==========================================
-- 14. CUSTOMIZATION REQUESTS
-- ==========================================

CREATE TABLE public.customization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text UNIQUE,
  product_id uuid REFERENCES public.products(id),
  team_id uuid,
  user_id uuid,
  status text NOT NULL DEFAULT 'draft',
  requirements jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.customization_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own requests" ON public.customization_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own requests" ON public.customization_requests
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_customization_requests_updated_at
  BEFORE UPDATE ON public.customization_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_customization_requests_user ON public.customization_requests(user_id);
CREATE INDEX idx_customization_requests_product ON public.customization_requests(product_id);
CREATE INDEX idx_customization_requests_status ON public.customization_requests(status);

-- ==========================================
-- STORAGE BUCKET: product-assets
-- ==========================================

INSERT INTO storage.buckets (id, name, public) VALUES ('product-assets', 'product-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read product-assets" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-assets');

CREATE POLICY "Authenticated upload product-assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-assets');

CREATE POLICY "Authenticated update product-assets" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-assets');

CREATE POLICY "Authenticated delete product-assets" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-assets');
