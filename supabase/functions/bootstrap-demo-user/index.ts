// One-off bootstrap: creates demo Polo user + brand membership.
// Safe to invoke multiple times — idempotent on user existence + membership.
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
  const password = "PoloDemo2026!";
  const POLO_BRAND_ID = "11111111-1111-1111-1111-111111111111";

  // 1. Find or create user
  let userId: string | null = null;
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const existing = list?.users?.find((u) => u.email?.toLowerCase() === email);
  if (existing) {
    userId = existing.id;
  } else {
    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (error) {
      return new Response(JSON.stringify({ ok: false, step: "create_user", error: error.message }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
    userId = created.user!.id;
  }

  // 2. Insert membership if not exists
  const { error: memErr } = await admin
    .from("brand_memberships")
    .upsert(
      { user_id: userId, brand_id: POLO_BRAND_ID, role: "member" },
      { onConflict: "user_id,brand_id", ignoreDuplicates: true },
    );

  if (memErr) {
    return new Response(JSON.stringify({ ok: false, step: "membership", error: memErr.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  return new Response(JSON.stringify({ ok: true, userId, email }), {
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });
});
