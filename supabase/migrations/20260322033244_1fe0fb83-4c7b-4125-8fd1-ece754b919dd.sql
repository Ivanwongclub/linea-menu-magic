ALTER TABLE public.design_layers
  ADD COLUMN IF NOT EXISTS layer_type text NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS text_content text,
  ADD COLUMN IF NOT EXISTS text_style jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS group_id text;