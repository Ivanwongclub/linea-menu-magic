#!/usr/bin/env node
/**
 * Grant CMS Admin (catalogue_editors) via the Supabase service role.
 *
 * Usage:
 *   SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   CMS_ADMIN_EMAIL=person@company.com \
 *   node deploy/scripts/grant-cms-admin.mjs
 *
 * Optional:
 *   CMS_ADMIN_PASSWORD=...   # create the Auth user if missing (confirmed)
 *   ALSO_DESIGNER_STAFF=1    # also upsert designer_staff
 *
 * Never commit real service role keys or passwords.
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.API_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY;
const email = (process.env.CMS_ADMIN_EMAIL || "").trim().toLowerCase();
const password = process.env.CMS_ADMIN_PASSWORD || "";
const alsoStaff = process.env.ALSO_DESIGNER_STAFF === "1";

function fail(message) {
  console.error(message);
  process.exit(1);
}

if (!url) fail("Missing SUPABASE_URL (or API_URL).");
if (!key) fail("Missing SUPABASE_SERVICE_ROLE_KEY (or SERVICE_ROLE_KEY).");
if (!email || !email.includes("@")) fail("Missing or invalid CMS_ADMIN_EMAIL.");

const admin = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function findUserIdByEmail() {
  // Paginate — projects can have more than one page of users.
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((user) => (user.email || "").toLowerCase() === email);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureUser() {
  let userId = await findUserIdByEmail();
  if (userId) return { userId, created: false };

  if (!password) {
    fail(
      `No Auth user for ${email}. Create the user in the Dashboard first, or set CMS_ADMIN_PASSWORD to create one.`,
    );
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return { userId: data.user.id, created: true };
}

const { userId, created } = await ensureUser();

const { error: grantError } = await admin.from("catalogue_editors").upsert({ user_id: userId });
if (grantError) fail(`catalogue_editors upsert failed: ${grantError.message}`);

if (alsoStaff) {
  const { error: staffError } = await admin.from("designer_staff").upsert({ user_id: userId });
  if (staffError) fail(`designer_staff upsert failed: ${staffError.message}`);
}

const { data: row, error: readError } = await admin
  .from("catalogue_editors")
  .select("user_id, granted_at")
  .eq("user_id", userId)
  .maybeSingle();
if (readError) fail(`verify failed: ${readError.message}`);

console.log(
  JSON.stringify(
    {
      ok: true,
      email,
      userId,
      authUserCreated: created,
      catalogueEditor: !!row,
      grantedAt: row?.granted_at ?? null,
      designerStaff: alsoStaff,
    },
    null,
    2,
  ),
);
