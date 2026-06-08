CREATE TABLE public.editor_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  product_slug text,
  product_name text NOT NULL,
  model_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.editor_sessions TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.editor_sessions TO authenticated;
GRANT ALL ON public.editor_sessions TO service_role;

ALTER TABLE public.editor_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Insert own sessions"
  ON public.editor_sessions FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Read own sessions"
  ON public.editor_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Public read anon sessions"
  ON public.editor_sessions FOR SELECT
  TO anon
  USING (user_id IS NULL);

CREATE INDEX idx_editor_sessions_user ON public.editor_sessions(user_id, created_at DESC);