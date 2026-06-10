-- Harden editor_sessions: authenticated-only, own-rows-only

-- 1. Remove permissive policies
DROP POLICY IF EXISTS "Insert own sessions" ON public.editor_sessions;
DROP POLICY IF EXISTS "Public read anon sessions" ON public.editor_sessions;

-- 2. Recreate insert policy: authenticated users, own user_id only
CREATE POLICY "Insert own sessions"
  ON public.editor_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3. Remove anon access entirely
REVOKE SELECT, INSERT ON public.editor_sessions FROM anon;

-- 4. Clean up accumulated anonymous rows
DELETE FROM public.editor_sessions WHERE user_id IS NULL;
