// M5 item 7: a product with `brand_id` set belongs to that brand.
//
// Four viewers, checked at the API boundary and then in the real page:
// an anonymous visitor and a signed-in outsider must get a not-found page,
// never a partial render or an error; a brand member sees it normally; a
// catalogue editor sees it too, which is what the CMS depends on.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const MEMBER = { email: "e2e-brand-member@local.test", password: "E2eMember!2026" };
const OUTSIDER = { email: "e2e-outsider@local.test", password: "E2eOutsider!2026" };

export default async function ({ page, base, admin, editor, status, h }) {
  const { data: product } = await admin
    .from("products")
    .select("id, slug, name, status, is_public, item_code, brand_id")
    .like("slug", "sample-%")
    .order("slug")
    .limit(1)
    .single();

  /* ---- a brand, a member, and an outsider who belongs to nothing ---- */
  let { data: brand } = await admin.from("brands").select("id, slug").eq("slug", "e2e-brand").maybeSingle();
  let createdBrand = false;
  if (!brand) {
    const created = await admin.from("brands").insert({ name: "E2E Brand", slug: "e2e-brand", is_active: true }).select("id, slug").single();
    if (created.error) throw new Error(created.error.message);
    brand = created.data;
    createdBrand = true;
  }

  const ensureUser = async ({ email, password }) => {
    const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
    if (!error) return data.user.id;
    const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const found = list.users.find((u) => u.email === email);
    if (!found) throw error;
    return found.id;
  };
  const memberId = await ensureUser(MEMBER);
  const outsiderId = await ensureUser(OUTSIDER);
  await admin.from("brand_memberships").delete().in("user_id", [memberId, outsiderId]);
  const membership = await admin.from("brand_memberships").insert({ brand_id: brand.id, user_id: memberId, role: "member" });
  if (membership.error) throw new Error(membership.error.message);
  // the outsider is deliberately a member of nothing and not a catalogue editor
  await admin.from("catalogue_editors").delete().in("user_id", [memberId, outsiderId]);

  const restore = async () => {
    await admin.from("products").update({
      brand_id: product.brand_id, status: product.status, is_public: product.is_public, item_code: product.item_code,
    }).eq("id", product.id);
    await admin.from("brand_memberships").delete().in("user_id", [memberId, outsiderId]);
    await admin.auth.admin.deleteUser(memberId).catch(() => {});
    await admin.auth.admin.deleteUser(outsiderId).catch(() => {});
    if (createdBrand) await admin.from("brands").delete().eq("id", brand.id);
  };

  try {
    const set = await admin.from("products").update({
      brand_id: brand.id, status: "active", is_public: false, item_code: "E2E-BRD-001",
    }).eq("id", product.id);
    if (set.error) throw new Error(set.error.message);

    /* ---- API boundary: who can read the row at all ---- */
    const asUser = async (creds) => {
      const client = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
      const { error } = await client.auth.signInWithPassword(creds);
      if (error) throw new Error(`sign in ${creds.email}: ${error.message}`);
      return client;
    };
    const readSlug = async (client) => {
      const { data, error } = await client.from("products").select("id, name").eq("slug", product.slug).maybeSingle();
      if (error) throw new Error(error.message);
      return data;
    };
    const anon = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
    const api = {
      anonymous: await readSlug(anon),
      outsider: await readSlug(await asUser(OUTSIDER)),
      member: await readSlug(await asUser(MEMBER)),
      editor: await readSlug(await asUser({ email: editor.email, password: editor.password })),
    };
    assert.equal(api.anonymous, null, "anonymous cannot read a brand product");
    assert.equal(api.outsider, null, "a signed-in outsider cannot read it either");
    assert.ok(api.member?.id === product.id, "a brand member can");
    assert.ok(api.editor?.id === product.id, "and so can a catalogue editor");
    const out = { api: Object.fromEntries(Object.entries(api).map(([k, v]) => [k, v ? "visible" : "not found"])) };

    /* ---- the page: not found, not a partial render, not an error ---- */
    const url = `${base}/products/${product.slug}`;
    const notFound = page.getByText("Product not found");
    const assertNotFound = async (who) => {
      await page.goto(url);
      await notFound.waitFor({ timeout: 20000 });
      const text = await page.evaluate(() => document.body.innerText);
      assert.ok(!text.includes(product.name), `${who}: the product name must not leak`);
      assert.ok(!text.includes("E2E-BRD-001"), `${who}: the item code must not leak`);
      assert.equal(await page.getByTestId("spec-table").count(), 0, `${who}: nothing partially rendered`);
      assert.equal(await page.getByTestId("gallery-hero").count(), 0, `${who}: no gallery`);
      assert.equal(await page.getByTestId("gallery-empty").count(), 0, `${who}: not even the empty state`);
      assert.ok(!/error|something went wrong/i.test(text), `${who}: reads as not found, not as a failure`);
    };

    await page.goto(`${base}/products`);
    await h.dismissCookies();
    await assertNotFound("anonymous");

    // sign in through the real Designer Studio form as the outsider
    const signIn = async ({ email, password }) => {
      await page.goto(`${base}/designer-studio/login`, { waitUntil: "networkidle" });
      await h.dismissCookies();
      await page.fill("#email", email);
      await page.fill("#password", password);
      await page.click("button[type=submit]");
      await page.waitForURL((u) => !u.pathname.includes("/login"), { timeout: 20000 });
    };
    const signOut = async () => {
      await page.context().clearCookies();
      await page.goto(base);
      await page.evaluate(() => { window.localStorage.clear(); window.sessionStorage.clear(); });
    };

    await signIn(OUTSIDER);
    await assertNotFound("signed-in outsider");
    await signOut();

    /* ---- the member sees the product normally ---- */
    await signIn(MEMBER);
    await page.goto(url);
    await page.getByRole("heading", { level: 1, name: product.name }).first().waitFor({ timeout: 20000 });
    const memberText = await page.evaluate(() => document.body.innerText);
    assert.ok(memberText.includes("E2E-BRD-001"), "the member sees the item code");
    assert.ok(!memberText.includes("Product not found"));
    out.member = { heading: product.name, itemCode: true };
    await signOut();

    /* ---- and so does a catalogue editor ---- */
    await h.login(editor);
    await page.goto(url);
    await page.getByRole("heading", { level: 1, name: product.name }).first().waitFor({ timeout: 20000 });
    out.editor = { heading: product.name };

    return out;
  } finally {
    await restore();
  }
}
