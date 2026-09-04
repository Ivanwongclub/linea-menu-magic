// Phase 7: finish manager — filtered bulk is_public toggle, per-finish edit,
// create with the standard/code rule caught in words, first-time code set
// then locked.
import assert from "node:assert/strict";

export default async function ({ page, admin, editor, base, h }) {
  await admin.from("finishes").delete().eq("factory_name_en", "E2E Custom");
  await admin.from("finishes").update({ is_public: false }).neq("id", "00000000-0000-0000-0000-000000000000");
  const { count: total } = await admin.from("finishes").select("id", { count: "exact", head: true });

  await h.login(editor);
  await page.goto(`${base}/admin/finishes`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "Finishes" }).waitFor();
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="finish-row"]').length === n, total);
  const out = { total };

  /* ---- bulk is_public across a filtered selection ---- */
  const { data: hp } = await admin.from("finish_processes").select("id, code").eq("code", "HP").single();
  const { count: hpCount } = await admin.from("finishes").select("id", { count: "exact", head: true }).eq("process_id", hp.id);
  await page.getByTestId("facet-process-HP").getByRole("checkbox").click();
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="finish-row"]').length === n, hpCount);
  await page.getByTestId("select-all-filtered").click();
  await page.getByRole("button", { name: "Make public" }).click();
  await h.waitForToast(new RegExp(`${hpCount} made public`));
  let { count: publicCount } = await admin.from("finishes").select("id", { count: "exact", head: true }).eq("is_public", true);
  assert.equal(publicCount, hpCount, "exactly the filtered set went public");
  const { count: publicOutsideHp } = await admin.from("finishes").select("id", { count: "exact", head: true }).eq("is_public", true).neq("process_id", hp.id);
  assert.equal(publicOutsideHp, 0, "nothing outside the filter changed");
  await page.getByTestId("select-all-filtered").click();
  await page.getByRole("button", { name: "Make private" }).click();
  await h.waitForToast(new RegExp(`${hpCount} made private`));
  ({ count: publicCount } = await admin.from("finishes").select("id", { count: "exact", head: true }).eq("is_public", true));
  assert.equal(publicCount, 0);
  out.bulk = { filtered: hpCount };
  await page.getByRole("button", { name: "Clear" }).first().click();

  /* ---- edit an existing finish: read-only identity, editable rest ---- */
  await page.getByPlaceholder("Search code or name").fill("CYC-0001");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="finish-row"]').length === 1);
  await page.locator('[data-testid="finish-row"][data-code="CYC-0001"]').click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.getByTestId("finish-cyc-code-locked").count(), 1, "code shown locked");
  assert.equal(await page.getByTestId("finish-cyc-code").count(), 0, "no editable code input");
  await page.getByTestId("finish-marketing-hant").fill("測試鎳");
  await page.getByTestId("finish-hex").fill("#123456");
  await page.getByTestId("finish-notes").fill("e2e note");
  await h.selectOption(page.getByTestId("finish-status"), "Discontinued");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await h.waitForDialogClosed();
  const { data: edited } = await admin.from("finishes").select("cyc_code, marketing_name_zh_hant, hex_approx, notes, status, factory_name_en").eq("cyc_code", "CYC-0001").single();
  assert.equal(edited.marketing_name_zh_hant, "測試鎳");
  assert.equal(edited.hex_approx, "#123456");
  assert.equal(edited.notes, "e2e note");
  assert.equal(edited.status, "discontinued");
  assert.equal(edited.factory_name_en, "HP NICKEL", "factory name untouched");
  out.edited = edited;
  // restore so the picker scenarios see an active finish
  await admin.from("finishes").update({ status: "active" }).eq("cyc_code", "CYC-0001");
  await page.getByPlaceholder("Search code or name").fill("");

  /* ---- create: standard + no code is refused in words, then non-standard succeeds ---- */
  await page.getByRole("button", { name: "New finish" }).click();
  await page.getByRole("dialog").waitFor();
  await page.getByTestId("finish-factory-en").fill("E2E Custom");
  await page.getByTestId("finish-marketing-en").fill("E2E Custom");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  const refused = await h.waitForToast(/standard finish needs a CYC code/i);
  let { count: created } = await admin.from("finishes").select("id", { count: "exact", head: true }).eq("factory_name_en", "E2E Custom");
  assert.equal(created, 0, "nothing written when refused");
  await page.getByTestId("finish-is-standard").click();
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await h.waitForDialogClosed();
  const { data: custom } = await admin.from("finishes").select("id, cyc_code, is_standard").eq("factory_name_en", "E2E Custom").single();
  assert.equal(custom.cyc_code, null);
  assert.equal(custom.is_standard, false);
  out.create = { refusedWith: refused, thenCreated: custom };

  /* ---- first-time code set is allowed; after that it's locked ---- */
  await page.getByPlaceholder("Search code or name").fill("E2E Custom");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="finish-row"]').length === 1);
  await page.getByTestId("finish-row").click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.getByTestId("finish-cyc-code").count(), 1, "code editable while null");
  await page.getByTestId("finish-cyc-code").fill("CYC-9999");
  await page.getByRole("dialog").getByRole("button", { name: "Save", exact: true }).click();
  await h.waitForDialogClosed();
  const { data: promoted } = await admin.from("finishes").select("cyc_code").eq("id", custom.id).single();
  assert.equal(promoted.cyc_code, "CYC-9999");
  await page.getByTestId("finish-row").click();
  await page.getByRole("dialog").waitFor();
  assert.equal(await page.getByTestId("finish-cyc-code-locked").count(), 1, "locked after first set");
  out.promotedThenLocked = promoted.cyc_code;

  await admin.from("finishes").delete().eq("id", custom.id);
  return out;
}
