// Phase 6: colour list (non-metal), finish picker (metal), and the three metal-gate triggers.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

export default async function ({ page, admin, editor, status, h }) {
  // --- state: mirror the live correction (M2's on-conflict skipped pre-existing metals)
  await admin.from("product_materials").update({ is_metal: true }).in("name", ["Brass", "Stainless Steel", "Zinc Alloy"]);
  const { data: nonMetal } = await admin.from("products").select("id, slug, material_id").eq("slug", "sample-hook-and-loop").single();
  const { data: metal } = await admin.from("products").select("id, slug, material_id").eq("slug", "sample-zipper-pullers-sliders").single();
  await admin.from("product_colours").delete().eq("product_id", nonMetal.id);
  await admin.from("products").update({ default_finish_id: null }).eq("id", metal.id);
  await admin.from("product_finishes").delete().eq("product_id", metal.id);
  const { data: nylon } = await admin.from("product_materials").select("id, name, is_metal").eq("name", "Nylon").single();
  assert.equal(nylon.is_metal, false);

  await h.login(editor);
  const out = {};

  /* ---------------- A. colours on a non-metal product ---------------- */
  await h.openProduct(nonMetal.id);
  await page.getByTestId("colour-section").waitFor();
  assert.equal(await page.getByTestId("finish-section").count(), 0);

  await page.getByRole("button", { name: "Add colour" }).click();
  await page.getByPlaceholder("e.g. Navy").last().fill("Navy");
  await page.getByPlaceholder("繁體").last().fill("海軍藍");
  await page.getByPlaceholder("简体").last().fill("海军蓝");
  await page.getByPlaceholder("#RRGGBB").last().fill("#1a2b5c");
  await page.getByRole("button", { name: "Add colour" }).click();
  await page.getByPlaceholder("e.g. Navy").last().fill("Sand");
  await page.getByPlaceholder("#RRGGBB").last().fill("#D8C7A1");
  await page.getByRole("button", { name: "Save colours" }).click();
  await h.waitForToast(/Colours saved/);

  let { data: colours } = await admin.from("product_colours").select("*").eq("product_id", nonMetal.id).order("sort_order");
  assert.equal(colours.length, 2, "two colours inserted");
  for (const c of colours) assert.match(c.id, /^[0-9a-f-]{36}$/, "real uuid from default");
  assert.deepEqual(colours.map((c) => [c.name, c.name_zh_hant, c.name_zh_hans, c.hex]), [
    ["Navy", "海軍藍", "海军蓝", "#1A2B5C"],
    ["Sand", null, null, "#D8C7A1"],
  ]);

  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("colour-section").waitFor();
  await page.getByPlaceholder("e.g. Navy").first().fill("Navy Blue");
  await page.getByLabel("Remove colour").last().click();
  await page.getByRole("button", { name: "Save colours" }).click();
  await h.waitForToast(/Colours saved/);
  ({ data: colours } = await admin.from("product_colours").select("*").eq("product_id", nonMetal.id).order("sort_order"));
  assert.equal(colours.length, 1);
  assert.equal(colours[0].name, "Navy Blue");
  out.colours = colours.map((c) => ({ name: c.name, hex: c.hex }));

  /* ---------------- B. finishes on a metal product ---------------- */
  await h.openProduct(metal.id);
  await page.getByTestId("finish-section").waitFor();
  assert.equal(await page.getByTestId("colour-section").count(), 0);

  const { count: totalFinishes } = await admin.from("finishes").select("id", { count: "exact", head: true });
  await page.getByTestId("finish-swatch").first().waitFor();
  assert.equal(await page.getByTestId("finish-swatch").count(), totalFinishes, "editor sees every finish despite is_public=false");
  out.finishesShown = totalFinishes;

  // Facet: pick the first process value that has finishes, check grid + a cross-axis count
  const { data: processes } = await admin.from("finish_processes").select("id, code, name").order("sort_order");
  const { data: surfaces } = await admin.from("finish_surfaces").select("id, code, name").order("sort_order");
  const proc = processes[0];
  const { count: procCount } = await admin.from("finishes").select("id", { count: "exact", head: true }).eq("process_id", proc.id);
  await page.getByTestId(`facet-process-${proc.code}`).getByRole("checkbox").click();
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="finish-swatch"]').length === n, procCount);
  // Pick a surface that actually co-occurs with this process so the check is non-trivial.
  let surf = null;
  let crossCount = 0;
  for (const s of surfaces) {
    const { count } = await admin.from("finishes").select("id", { count: "exact", head: true }).eq("process_id", proc.id).eq("surface_id", s.id);
    if (count > 0) {
      surf = s;
      crossCount = count;
      break;
    }
  }
  assert.ok(surf, "some surface co-occurs with the first process");
  assert.ok(crossCount < procCount, "narrowed count is strictly smaller than the process alone");
  const shownCross = Number(await page.getByTestId(`facet-surface-${surf.code}`).getByTestId("facet-count").innerText());
  assert.equal(shownCross, crossCount, "facet counts narrow with the other axes");
  out.facet = { process: proc.code, gridCount: procCount, [`surface:${surf.code}`]: shownCross };
  await page.getByRole("button", { name: "Clear" }).click();

  // Search
  await page.getByPlaceholder("Search code or name").fill("CYC-0001");
  await page.waitForFunction(() => document.querySelectorAll('[data-testid="finish-swatch"]').length === 1);
  await page.getByPlaceholder("Search code or name").fill("");

  // Attach two, read back
  await page.locator('[data-testid="finish-swatch"][data-code="CYC-0001"]').click();
  await page.locator('[data-testid="attached-finish"][data-code="CYC-0001"]').waitFor();
  await page.locator('[data-testid="finish-swatch"][data-code="CYC-0002"]').click();
  await page.locator('[data-testid="attached-finish"][data-code="CYC-0002"]').waitFor();
  const { data: f1 } = await admin.from("finishes").select("id").eq("cyc_code", "CYC-0001").single();
  const { data: f2 } = await admin.from("finishes").select("id").eq("cyc_code", "CYC-0002").single();
  let { data: links } = await admin.from("product_finishes").select("finish_id, sort_order").eq("product_id", metal.id).order("sort_order");
  assert.deepEqual(links, [{ finish_id: f1.id, sort_order: 0 }, { finish_id: f2.id, sort_order: 1 }]);

  // Reorder by keyboard: pick up the second row, move it up, drop
  const handle = page.locator('[data-testid="attached-finish"][data-code="CYC-0002"]').getByLabel("Drag to reorder");
  await handle.focus();
  await page.keyboard.press("Space");
  await page.waitForTimeout(150);
  await page.keyboard.press("ArrowUp");
  await page.waitForTimeout(150);
  await page.keyboard.press("Space");
  await page.waitForFunction(() => document.querySelector('[data-testid="attached-finish"]')?.getAttribute("data-code") === "CYC-0002");
  await page.waitForTimeout(500);
  ({ data: links } = await admin.from("product_finishes").select("finish_id, sort_order").eq("product_id", metal.id).order("sort_order"));
  assert.deepEqual(links, [{ finish_id: f2.id, sort_order: 0 }, { finish_id: f1.id, sort_order: 1 }], "reorder persisted");

  // Default limited to attached
  await page.getByTestId("default-finish-select").click();
  const options = await page.getByRole("option").allInnerTexts();
  assert.equal(options.length, 3, "none + the two attached");
  await page.getByRole("option", { name: /CYC-0002/ }).click();
  await page.waitForFunction(() => !!document.querySelector('[data-testid="attached-finish"][data-code="CYC-0002"]')?.textContent?.includes("Default"));
  let { data: prod } = await admin.from("products").select("default_finish_id, material_id").eq("id", metal.id).single();
  assert.equal(prod.default_finish_id, f2.id);

  /* ---------------- C. the metal gate, all three triggers ---------------- */
  // (3) default set + material → non-metal: check_default_finish_requires_metal_material
  await h.selectOption(page.getByTestId("material-select"), /^Nylon/);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const t3 = await h.waitForToast(/default_finish_id cannot be set/);
  ({ data: prod } = await admin.from("products").select("default_finish_id, material_id").eq("id", metal.id).single());
  assert.equal(prod.material_id, metal.material_id, "material unchanged after refusal");

  // (2) default cleared, finishes still attached + material → non-metal: check_material_change_preserves_finishes
  await page.getByTestId("default-finish-select").click();
  await page.getByRole("option", { name: /No default/ }).click();
  await page.waitForFunction(() => !document.querySelector('[data-testid="attached-finish"][data-code="CYC-0002"]')?.textContent?.includes("Default"));
  await h.selectOption(page.getByTestId("material-select"), /^Nylon/);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const t2 = await h.waitForToast(/finish\(es\) attached/);
  assert.match(t2, /has 2 finish\(es\) attached/);
  assert.match(t2, /material must remain metal/);
  ({ data: prod } = await admin.from("products").select("material_id").eq("id", metal.id).single());
  assert.equal(prod.material_id, metal.material_id);

  // (1) attach to a non-metal product: check_finish_requires_metal_material.
  // The UI never offers this (the section branches on material), so exercise
  // the same client call the hook makes, as the editor, and check what comes back.
  const asEditor = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
  const { error: signInError } = await asEditor.auth.signInWithPassword({ email: editor.email, password: editor.password });
  assert.equal(signInError, null);
  const { error: gate1 } = await asEditor.from("product_finishes").insert({ product_id: nonMetal.id, finish_id: f1.id, sort_order: 0 });
  assert.ok(gate1, "insert refused");
  assert.equal(gate1.code, "P0001", "raised by the trigger, so describeSupabaseError relays it verbatim");
  assert.match(gate1.message, /is not flagged is_metal — finishes cannot be assigned/);
  const { count: leaked } = await admin.from("product_finishes").select("finish_id", { count: "exact", head: true }).eq("product_id", nonMetal.id);
  assert.equal(leaked, 0);

  out.metalGate = { defaultTrigger: t3, materialChangeTrigger: t2, attachToNonMetal: gate1.message };

  // Detach both, read back empty
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("finish-section").waitFor();
  await page.getByLabel("Detach CYC-0002").click();
  await page.locator('[data-testid="attached-finish"][data-code="CYC-0002"]').waitFor({ state: "detached" });
  await page.getByLabel("Detach CYC-0001").click();
  await page.locator('[data-testid="attached-finish"][data-code="CYC-0001"]').waitFor({ state: "detached" });
  const { count: remaining } = await admin.from("product_finishes").select("finish_id", { count: "exact", head: true }).eq("product_id", metal.id);
  assert.equal(remaining, 0);

  return out;
}
