
-- Allow public/anon access to design_sessions for prototype
CREATE POLICY "Public read design_sessions"
ON public.design_sessions FOR SELECT TO anon
USING (true);

CREATE POLICY "Public manage design_sessions"
ON public.design_sessions FOR ALL TO anon
USING (true) WITH CHECK (true);

-- Same for design_layers
CREATE POLICY "Public read design_layers"
ON public.design_layers FOR SELECT TO anon
USING (true);

CREATE POLICY "Public manage design_layers"
ON public.design_layers FOR ALL TO anon
USING (true) WITH CHECK (true);

-- Same for design_exports
CREATE POLICY "Public read design_exports"
ON public.design_exports FOR SELECT TO anon
USING (true);

CREATE POLICY "Public manage design_exports"
ON public.design_exports FOR ALL TO anon
USING (true) WITH CHECK (true);

-- Same for user_library_items (so library loads for anon)
CREATE POLICY "Public read library items"
ON public.user_library_items FOR SELECT TO anon
USING (true);

CREATE POLICY "Public manage library items"
ON public.user_library_items FOR ALL TO anon
USING (true) WITH CHECK (true);
