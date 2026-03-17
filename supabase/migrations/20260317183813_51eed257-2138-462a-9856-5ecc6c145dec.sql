
ALTER TABLE public.user_library_items
ADD COLUMN IF NOT EXISTS is_admin_default boolean DEFAULT false;

ALTER TABLE public.user_library_items
ADD COLUMN IF NOT EXISTS downloadable_files jsonb DEFAULT '[]'::jsonb;

-- Add unique constraint for upsert safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_library_items_product_id_team_id_key'
  ) THEN
    ALTER TABLE public.user_library_items
    ADD CONSTRAINT user_library_items_product_id_team_id_key UNIQUE (product_id, team_id);
  END IF;
END $$;
