// Phase 1: designer studio RLS, checked at the API boundary (no editor UI
// exists yet — that is Phase 2). Proves:
//   - a brand A member cannot read a brand B design, and vice versa
//   - designer staff reads both
//   - anonymous reads none
//   - an owner with brand_id null reads their own design
//   - a brand member cannot update a quote; staff can
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const MEMBER_A = { email: "e2e-brand-a-member@local.test", password: "E2eMemberA!2026" };
const MEMBER_B = { email: "e2e-brand-b-member@local.test", password: "E2eMemberB!2026" };
const STAFF = { email: "e2e-designer-staff@local.test", password: "E2eStaff!2026" };
const OWNER = { email: "e2e-design-owner@local.test", password: "E2eOwner!2026" };

export default async function ({ admin, status }) {
  const ensureUser = async ({ email, password }) => {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (!error) return data.user.id;
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = list.users.find((u) => u.email === email);
    if (!found) throw error;
    return found.id;
  };

  const ensureBrand = async (slug, name) => {
    const { data: existing } = await admin.from("brands").select("id, slug").eq("slug", slug).maybeSingle();
    if (existing) return existing;
    const created = await admin.from("brands").insert({ name, slug, is_active: true }).select("id, slug").single();
    if (created.error) throw new Error(created.error.message);
    return created.data;
  };

  const memberAId = await ensureUser(MEMBER_A);
  const memberBId = await ensureUser(MEMBER_B);
  const staffId = await ensureUser(STAFF);
  const ownerId = await ensureUser(OWNER);

  const brandA = await ensureBrand("e2e-brand-a", "E2E Brand A");
  const brandB = await ensureBrand("e2e-brand-b", "E2E Brand B");

  await admin.from("brand_memberships").delete().in("user_id", [memberAId, memberBId, staffId, ownerId]);
  await admin.from("designer_staff").delete().eq("user_id", staffId);

  const membershipA = await admin.from("brand_memberships").insert({ brand_id: brandA.id, user_id: memberAId, role: "member" });
  if (membershipA.error) throw new Error(membershipA.error.message);
  const membershipB = await admin.from("brand_memberships").insert({ brand_id: brandB.id, user_id: memberBId, role: "member" });
  if (membershipB.error) throw new Error(membershipB.error.message);
  const staffGrant = await admin.from("designer_staff").insert({ user_id: staffId });
  if (staffGrant.error) throw new Error(staffGrant.error.message);

  const insertDesign = async (name, brand_id, owner_id) => {
    const { data, error } = await admin
      .from("designs")
      .insert({ name, brand_id, owner_id, status: "draft" })
      .select("id, name")
      .single();
    if (error) throw new Error(error.message);
    return data;
  };
  const designA = await insertDesign("E2E Design A", brandA.id, memberAId);
  const designB = await insertDesign("E2E Design B", brandB.id, memberBId);
  const designOwner = await insertDesign("E2E Owner Design", null, ownerId);

  const version = await admin
    .from("design_versions")
    .insert({
      design_id: designB.id,
      version_number: 1,
      recipe: {},
      snapshot: {},
      author_kind: "buyer",
      created_by: memberBId,
    })
    .select("id")
    .single();
  if (version.error) throw new Error(version.error.message);

  const quote = await admin
    .from("design_quotes")
    .insert({ design_id: designB.id, design_version_id: version.data.id, requested_by: memberBId, quantity: 10 })
    .select("id, status")
    .single();
  if (quote.error) throw new Error(quote.error.message);

  const asUser = async (creds) => {
    const client = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithPassword(creds);
    if (error) throw new Error(`sign in ${creds.email}: ${error.message}`);
    return client;
  };
  const anon = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
  const memberAClient = await asUser(MEMBER_A);
  const memberBClient = await asUser(MEMBER_B);
  const staffClient = await asUser(STAFF);
  const ownerClient = await asUser(OWNER);

  const readDesign = async (client, id) => {
    const { data, error } = await client.from("designs").select("id").eq("id", id).maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  };

  try {
    /* ---- brand isolation: A cannot see B, B cannot see A ---- */
    assert.equal(await readDesign(memberAClient, designB.id), null, "brand A member cannot read brand B's design");
    assert.ok((await readDesign(memberAClient, designA.id))?.id === designA.id, "brand A member reads their own brand's design");
    assert.equal(await readDesign(memberBClient, designA.id), null, "brand B member cannot read brand A's design");
    assert.ok((await readDesign(memberBClient, designB.id))?.id === designB.id, "brand B member reads their own brand's design");

    /* ---- staff reads both ---- */
    assert.ok((await readDesign(staffClient, designA.id))?.id === designA.id, "designer staff reads brand A's design");
    assert.ok((await readDesign(staffClient, designB.id))?.id === designB.id, "designer staff reads brand B's design");

    /* ---- anon reads none ---- */
    const anonResults = await Promise.all(
      [designA.id, designB.id, designOwner.id].map((id) => anon.from("designs").select("id").eq("id", id).maybeSingle())
    );
    for (const { error } of anonResults) {
      assert.ok(error, "anon is revoked at the grant level, not merely filtered by RLS");
      assert.match(error.message, /permission denied/i);
    }

    /* ---- owner with null brand reads their own design ---- */
    assert.ok((await readDesign(ownerClient, designOwner.id))?.id === designOwner.id, "owner reads their own brand-less design");
    assert.equal(await readDesign(ownerClient, designA.id), null, "that owner is not a member of brand A");

    /* ---- brand member cannot update a quote; staff can ---- */
    const memberUpdate = await memberBClient
      .from("design_quotes")
      .update({ status: "responded", response_notes: "member tried" })
      .eq("id", quote.data.id)
      .select("id");
    assert.equal(memberUpdate.data?.length ?? 0, 0, "a brand member cannot update a quote, even their own brand's");

    const staffUpdate = await staffClient
      .from("design_quotes")
      .update({ status: "responded", response_notes: "staff responded" })
      .eq("id", quote.data.id)
      .select("id, status");
    if (staffUpdate.error) throw new Error(staffUpdate.error.message);
    assert.equal(staffUpdate.data?.[0]?.status, "responded", "staff can update the quote");

    return {
      brandIsolation: "A blind to B, B blind to A",
      staff: "reads both brands",
      anon: "permission denied on all three",
      ownerNullBrand: "reads own design only",
      quotes: "member update blocked, staff update succeeds",
    };
  } finally {
    await admin.from("design_quotes").delete().eq("id", quote.data.id);
    await admin.from("design_versions").delete().eq("id", version.data.id);
    await admin.from("designs").delete().in("id", [designA.id, designB.id, designOwner.id]);
    await admin.from("brand_memberships").delete().in("user_id", [memberAId, memberBId]);
    await admin.from("designer_staff").delete().eq("user_id", staffId);
    await admin.auth.admin.deleteUser(memberAId).catch(() => {});
    await admin.auth.admin.deleteUser(memberBId).catch(() => {});
    await admin.auth.admin.deleteUser(staffId).catch(() => {});
    await admin.auth.admin.deleteUser(ownerId).catch(() => {});
  }
}
