
-- ==========================================
-- LOOKUP / REFERENCE TABLES
-- ==========================================

-- Categories (hierarchical: parent_id allows nesting)
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read categories" ON public.categories FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Materials
CREATE TABLE public.materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_en text,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read materials" ON public.materials FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage materials" ON public.materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Tags (New Item, New Trend, Hot, Best Seller, Seasonal, etc.)
CREATE TABLE public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  color text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read tags" ON public.tags FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage tags" ON public.tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Industries / Applications
CREATE TABLE public.industries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  name_en text,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read industries" ON public.industries FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage industries" ON public.industries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Certifications
CREATE TABLE public.certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read certifications" ON public.certifications FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage certifications" ON public.certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- MAIN PRODUCTS TABLE
-- ==========================================

CREATE TYPE public.product_status AS ENUM ('draft', 'active', 'archived');

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_code text UNIQUE,
  name text NOT NULL,
  name_en text,
  slug text NOT NULL UNIQUE,
  description text,
  status public.product_status NOT NULL DEFAULT 'draft',

  -- Specifications (flat, nullable)
  spec_material text,
  spec_size text,
  spec_color text,
  spec_finish text,
  spec_weight text,
  spec_thickness text,
  spec_tensile_strength text,

  -- Pricing
  unit_price numeric(10,2),
  currency text NOT NULL DEFAULT 'USD',
  moq integer,
  price_breaks jsonb DEFAULT '[]'::jsonb,

  -- Production
  lead_time text,
  sample_time text,
  origin text,
  capacity text,

  -- Available colors as text array
  available_colors text[] DEFAULT '{}',

  -- Applications as text array
  applications text[] DEFAULT '{}',

  -- 3D model
  model_url text,

  -- Visibility
  is_public boolean NOT NULL DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can see active public products
CREATE POLICY "Public read active products" ON public.products
  FOR SELECT TO public
  USING (status = 'active' AND is_public = true);

-- Authenticated users can see all products
CREATE POLICY "Authenticated read all products" ON public.products
  FOR SELECT TO authenticated USING (true);

-- Authenticated users can manage products
CREATE POLICY "Authenticated manage products" ON public.products
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- PRODUCT IMAGES
-- ==========================================

CREATE TABLE public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  alt_text text,
  sort_order integer NOT NULL DEFAULT 0,
  is_thumbnail boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product images" ON public.product_images FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product images" ON public.product_images FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX idx_product_images_product_id ON public.product_images(product_id);

-- ==========================================
-- JUNCTION TABLES (M2M)
-- ==========================================

-- product_categories
CREATE TABLE public.product_categories (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_categories" ON public.product_categories FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_categories" ON public.product_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_materials
CREATE TABLE public.product_materials (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  material_id uuid NOT NULL REFERENCES public.materials(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, material_id)
);
ALTER TABLE public.product_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_materials" ON public.product_materials FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_materials" ON public.product_materials FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_tags
CREATE TABLE public.product_tags (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_tags" ON public.product_tags FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_tags" ON public.product_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_industries
CREATE TABLE public.product_industries (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  industry_id uuid NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, industry_id)
);
ALTER TABLE public.product_industries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_industries" ON public.product_industries FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_industries" ON public.product_industries FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- product_certifications
CREATE TABLE public.product_certifications (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  certification_id uuid NOT NULL REFERENCES public.certifications(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, certification_id)
);
ALTER TABLE public.product_certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read product_certifications" ON public.product_certifications FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated manage product_certifications" ON public.product_certifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- B2B: USER LIBRARY ITEMS (team-scoped)
-- ==========================================

CREATE TABLE public.user_library_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id text,
  team_name text,
  custom_brand text,
  custom_specs jsonb DEFAULT '{}'::jsonb,
  notes text,
  is_favorite boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
ALTER TABLE public.user_library_items ENABLE ROW LEVEL SECURITY;

-- Users can only see their own library items
CREATE POLICY "Users read own library items" ON public.user_library_items
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users manage own library items" ON public.user_library_items
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE TRIGGER update_user_library_items_updated_at
  BEFORE UPDATE ON public.user_library_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_library_items_user ON public.user_library_items(user_id);
CREATE INDEX idx_user_library_items_team ON public.user_library_items(team_id);

-- ==========================================
-- CUSTOMIZATION REQUESTS (schema only)
-- ==========================================

CREATE TYPE public.customization_status AS ENUM (
  'submitted',
  'model_uploaded',
  'design_confirmed',
  'ready_for_printing',
  'printing',
  'shipped',
  'sample_review',
  'production',
  'closed'
);

CREATE TABLE public.customization_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  team_id text,
  team_name text,
  quantity integer NOT NULL DEFAULT 1,
  target_price numeric(10,2),
  target_date date,
  notes text,
  status public.customization_status NOT NULL DEFAULT 'submitted',
  tracking_number text,
  estimated_delivery date,
  metadata jsonb DEFAULT '{}'::jsonb,
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
-- PRODUCT SEARCH INDEX
-- ==========================================
CREATE INDEX idx_products_status ON public.products(status);
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_item_code ON public.products(item_code);
CREATE INDEX idx_products_is_public ON public.products(is_public);

-- Storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for product-images bucket
CREATE POLICY "Public read product images storage" ON storage.objects
  FOR SELECT TO public USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated upload product images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Authenticated update product images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated delete product images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'product-images');
