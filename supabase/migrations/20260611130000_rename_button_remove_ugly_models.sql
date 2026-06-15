-- Corrected 2026-06-15 (P19): §1 no longer reassigns model_url because the
-- /models/d-ring-buckle.obj file is a D-ring shape, not a button. metal-button
-- keeps its existing model_url which points at the real button OBJ
-- (currently /models/Polo_Button_10.8.obj in production).

-- 1. Hero product: rename ONLY — model_url is preserved.
UPDATE public.products
SET
  name = 'Button',
  name_en = 'Button',
  is_customizable = true,
  description = 'Classic metal button in zinc alloy with a polished dome face. Available in multiple plated finishes and sizes for shirts, jackets and outerwear.'
WHERE slug = 'metal-button';

-- 2. Remove low-quality 3D models (cord stopper, woven badge)
UPDATE public.products
SET model_url = NULL
WHERE model_url LIKE '%cord-stopper.obj' OR model_url LIKE '%metal-badge.obj';

-- 3. Remove broken 3D references (OBJ files absent from /public/models)
UPDATE public.products
SET model_url = NULL
WHERE model_url IN (
  '/models/hardware.obj',
  '/models/zipper.obj',
  '/models/hw-snap-002.obj',
  '/models/button.obj',
  '/models/zip-n3-002.obj'
);

-- 4. Remove mismatched model (zipper puller displaying a button OBJ)
UPDATE public.products
SET model_url = NULL
WHERE slug = 'metal-zipper-puller';
