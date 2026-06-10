# P4b — editor_sessions Hardening: Audit Report

**Date:** 2026-06-11  
**Branch:** main  
**Prerequisite:** P4 merged  
**Files touched:** `src/pages/DesignerStudioEditor.tsx`, `supabase/migrations/20260611120000_harden_editor_sessions.sql` (new)

---

## 1. Pre-change audit outputs

```
# grep -n "editor_sessions" src/pages/DesignerStudioEditor.tsx
33:      .from("editor_sessions")
50:        .from("editor_sessions")

# cat supabase/migrations/20260608111030_942289fc-5040-40c4-b74f-753a0b8c1e7a.sql
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
```

All four pre-change facts confirmed:
- ✅ Insert effect fired whenever `model` exists, with `user_id: authSession?.user?.id ?? null` (could write null)
- ✅ History query had no `.eq('user_id', …)` filter — relied solely on RLS
- ✅ Policies: INSERT `WITH CHECK (true)` to `public`; SELECT `user_id = auth.uid()` to `authenticated`; SELECT `user_id IS NULL` to `anon`
- ✅ `anon` role had `SELECT, INSERT` grants on the table

---

## 2. Changes applied

### git diff src/pages/DesignerStudioEditor.tsx

```diff
@@ -26,13 +26,13 @@ const DesignerStudioEditor = () => {
-  // Save editor session on mount (only when a model is loaded)
+  // Save editor session when a model is loaded by an authenticated user
   useEffect(() => {
-    if (!model) return;
+    if (!model || !authSession?.user?.id) return;
     supabase
       .from("editor_sessions")
       .insert({
-        user_id: authSession?.user?.id ?? null,
+        user_id: authSession.user.id,
         product_slug: slug,
         product_name: name ?? "Untitled",
         model_url: model,
@@ -41,7 +41,7 @@ const DesignerStudioEditor = () => {
     // eslint-disable-next-line react-hooks/exhaustive-deps
-  }, [model]);
+  }, [model, authSession?.user?.id]);

   const { data: sessions = [] } = useQuery({
     queryKey: ["editor-sessions", authSession?.user?.id],
@@ -49,6 +49,7 @@ const DesignerStudioEditor = () => {
       const { data } = await supabase
         .from("editor_sessions")
         .select("*")
+        .eq("user_id", authSession!.user!.id)
         .order("created_at", { ascending: false })
         .limit(20);
       return data ?? [];
```

### supabase/migrations/20260611120000_harden_editor_sessions.sql (new file, shown in full)

```sql
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
```

---

## 3. Verification results

### tsc --noEmit
**PASS** — no output (clean, zero errors). TypeScript accepts `authSession.user.id` inside the effect body because the `!authSession?.user?.id` early-return narrows the type to non-null on the path that reaches the insert. The `authSession!.user!.id` non-null assertion in the query function is sound because `enabled: !!authSession?.user?.id` guarantees both are non-null when the function executes.

### eslint src/pages/DesignerStudioEditor.tsx
**PASS** — no output (zero errors or warnings).

### npm run build
**PASS** — `✓ 2871 modules transformed`, `✓ built in 4.67s`. No new chunks; pre-existing large-chunk warnings unchanged.

---

### Logic checks

**1. Guest loads a model: NO insert call fires (trace the early return)?**  
✅ YES.  
Effect at line 31: `if (!model || !authSession?.user?.id) return;`. For a guest, `authSession` is `null` → `authSession?.user?.id` is `undefined` → `!undefined` is `true` → the condition is true → the function returns immediately. The Supabase `.insert()` call is never reached.

**2. Authed user loads a model: insert fires with `user_id = authSession.user.id`, never null?**  
✅ YES.  
When both `model` and `authSession?.user?.id` are truthy, the early return does not trigger. The insert object (line 35) uses `user_id: authSession.user.id` — the `?.` optional chain and `?? null` fallback are gone. TypeScript verifies this is `string` (non-nullable) because the `!authSession?.user?.id` guard preceding it proves `authSession.user.id` exists on the execution path.

**3. History query filters `user_id` client-side AND remains RLS-protected server-side?**  
✅ YES.  
- Client: `.eq("user_id", authSession!.user!.id)` added at line 52 — PostgREST translates this to `WHERE user_id = '<uid>'` in the SQL query.  
- Server: the existing `"Read own sessions"` policy (`USING (user_id = auth.uid())`) in the original migration remains untouched — the hardening migration does not drop or modify it. Two independent ownership checks: client filter + server RLS. Either one alone would be sufficient; both together provide defense in depth.

**4. Migration drops both permissive policies, recreates authenticated-only insert with own-uid check, revokes anon grants, deletes null-user rows — in that order?**  
✅ YES. The migration is ordered as specified:  
1. `DROP POLICY IF EXISTS "Insert own sessions"` — removes the `TO public WITH CHECK (true)` policy  
2. `DROP POLICY IF EXISTS "Public read anon sessions"` — removes the anon SELECT policy  
3. `CREATE POLICY "Insert own sessions" … TO authenticated WITH CHECK (user_id = auth.uid())` — authenticated-only, own-uid check  
4. `REVOKE SELECT, INSERT ON public.editor_sessions FROM anon` — removes anon role grants  
5. `DELETE FROM public.editor_sessions WHERE user_id IS NULL` — purges existing anonymous rows  

The `IF EXISTS` on the DROPs makes the migration idempotent on the policy names. The `REVOKE` at step 4 happens after the new policy is in place, so there is no window where inserts are unprotected.

**5. Does the guest → login → return round trip (P4 nudge) still produce a session insert after login?**  
✅ YES — and this required the dependency array fix.

**Trace:**  
- Guest opens `/designer-studio/editor?model=…` → `model` is non-null, `authSession` is null → early return, no insert.  
- Guest clicks "Sign in to save your design" → navigates to `/designer-studio/login?next=/designer-studio/editor?model=…`.  
- After successful login, `DesignerStudioLogin.tsx` calls `navigate(next, { replace: true })` → user lands back on `/designer-studio/editor?model=…`.  
- `DesignerStudioEditor` re-mounts (React Router replaces the route). On mount, `authSession` is now the logged-in session. The effect runs with both `model` truthy and `authSession?.user?.id` truthy → the early return does NOT trigger → the insert fires with the correct `user_id`.

**Why the dep array change matters:** If the dependency array had remained `[model]` only, the effect would only re-fire when `model` changes. Since `model` does not change on the return navigation (the same URL is restored), the effect would **not** re-run and the session insert would be silently dropped. By adding `authSession?.user?.id` to the deps (line 44: `}, [model, authSession?.user?.id]`), the effect re-runs whenever the auth identity changes — which is exactly what happens after login returns the user to this page.

**Final dependency array:** `[model, authSession?.user?.id]`

---

## 4. Deployment note

This change consists of:
- A client-side code change (already safe to ship — guests are silently blocked at the JS level even before the migration applies).
- A database migration (`20260611120000_harden_editor_sessions.sql`) that must be applied to the Supabase project.

**Lovable.dev sync:** Lovable applies migrations from the `supabase/migrations/` folder automatically when it detects new files on sync. After pushing to GitHub and Lovable syncing, the migration will run.

**Manual application (if needed):** Run via the Supabase SQL editor or `supabase db push` from the project root.

**Safe window:** Until the migration is applied, the client changes are already in effect (no new anonymous rows from this client), but the old permissive policies remain live in the database. Existing anonymous rows are not yet purged. The client and migration are independently safe — there is no state where applying only one causes a regression.

---

## 5. Residual risks for P5

- **`authSession` initialization race:** On first render, `useAuth()` may briefly return `session: null` while Supabase resolves the persisted session from local storage. If a returning authenticated user navigates directly to the editor, `authSession` starts as null, the effect skips, then `authSession` resolves. Since `authSession?.user?.id` is now in the dep array, the effect will re-run once the session resolves and fire the insert correctly. No gap in behavior — this is an improvement over the pre-P4b state.
- **Duplicate session rows on fast re-navigation:** If an authed user navigates away and back to the same `?model=` URL quickly, the effect fires twice (once per mount). The table has no `UNIQUE (user_id, model_url)` constraint, so duplicate rows accumulate. A deduplication strategy (upsert by `(user_id, model_url)` or a time-window check) is a future enhancement.
- **`editor_sessions` SELECT policy scope:** The existing `"Read own sessions"` policy grants SELECT to `authenticated` using `user_id = auth.uid()`. After the migration, anon has no SELECT grant at all. Any unexpected code path that tries to query this table as anon will get a permission denied error (not a silent empty result). This is the desired behavior but should be confirmed in integration testing.
- **Hardcoded English strings on this page** (carry-forward from P4): "Sign in to save your design", "No model loaded", "Browse Trim Library" — i18n deferred to a later phase.
