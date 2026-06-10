-- The OBJ previously attached to the D-ring buckle product is actually a button.
-- Rename the product and align its content; remove 3D models that are low quality.

-- 1. Rename product and rewrite content (keyed by current slug)
UPDATE public.products
SET
  name = 'Button',
  name_en = 'Button',
  slug = 'metal-button',
  description = 'Classic metal button in zinc alloy with a polished dome face. Available in multiple plated finishes and sizes for shirts, jackets and outerwear.',
  specifications = jsonb_build_object(
    'material', 'Zinc Alloy',
    'finish', 'Polished Nickel',
    'size', '15mm (24L)',
    'weight', '2.8g',
    'thickness', '2.5mm',
    'attachment', 'Sew-Through',
    'color_options', jsonb_build_array('Polished Nickel', 'Antique Brass', 'Gunmetal', 'Matte Black'),
    'size_options', jsonb_build_array('11.5mm (18L)', '15mm (24L)', '20mm (32L)', '25mm (40L)')
  )
WHERE slug = 'metal-d-ring-buckle';

-- 2. Remove 3D viewing from low-quality models (keyed by model file, slug-independent)
UPDATE public.products
SET model_url = NULL
WHERE model_url LIKE '%cord-stopper.obj' OR model_url LIKE '%metal-badge.obj';
