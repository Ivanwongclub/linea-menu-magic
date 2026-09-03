// One-off bootstrap: creates/activates the demo Polo user, sets its password,
// ensures brand membership and grants catalogue-editor (super admin) access.
// Idempotent — safe to invoke multiple times.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const email = "demo.polo@wincyc.com";
  const password = "$Support1";
  const POLO_BRAND_ID = "11111111-1111-1111-1111-111111111111";

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  // 1. Find or create user
  let userId: string | null = null;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);

  if (existing) {
    userId = existing.id;
    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
      ban_duration: "none",
    });
    if (error) return json({ ok: false, step: "update_user", error: error.message }, 500);
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) return json({ ok: false, step: "create_user", error: error.message }, 500);
    userId = created.user!.id;
  }

  // 2. Brand membership (owner)
  const { error: memErr } = await admin
    .from("brand_memberships")
    .upsert(
      { user_id: userId, brand_id: POLO_BRAND_ID, role: "owner" },
      { onConflict: "user_id,brand_id" },
    );
  if (memErr) return json({ ok: false, step: "membership", error: memErr.message }, 500);

  // 3. Catalogue editor (super admin)
  const { error: edErr } = await admin
    .from("catalogue_editors")
    .upsert({ user_id: userId }, { onConflict: "user_id", ignoreDuplicates: true });
  if (edErr) return json({ ok: false, step: "catalogue_editor", error: edErr.message }, 500);

  return json({ ok: true, userId, email });
});
