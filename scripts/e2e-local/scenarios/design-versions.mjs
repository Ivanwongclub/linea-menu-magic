// Phase 7a — named saves, the snapshot they freeze, reload, and the design list.
//
//   1. An anonymous /new has no socket at all: nothing to version, nothing to
//      save (E2 U8, standing ruling 1).
//   2. A named save writes one `design_versions` row — version 1, the recipe as
//      it stands, and a snapshot of everything it points at (Phase 1 R2,
//      Phase 4a R3) — and the design points at it.
//   3. A second save takes version 2, not 1: the number comes from the table,
//      and `unique (design_id, version_number)` is what keeps it honest.
//   4. Reload puts version 1's recipe back as the working draft, autosave
//      writes it to `draft_recipe`, and undo takes the buyer back — reloading
//      is an edit, not a new session.
//   5. A version is immutable: the buyer is offered no rename and no delete,
//      and `authenticated` is granted neither.
//   6. The design list shows the design, its version count, and opens it.
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { addSampleText, openEditorFor, readRecipe, stageAppearance, waitForRecipe } from "../lib/appearance.mjs";

/** Opens the Versions body inside the Output dock. */
async function openVersions(page) {
  if ((await page.getByTestId("output-body").count()) === 0) {
    await page.getByTestId("output-toggle").click();
    await page.getByTestId("output-body").waitFor({ timeout: 20000 });
  }
  await page.getByTestId("versions-section").waitFor({ timeout: 20000 });
  // An empty list and a list not yet read look the same on screen.
  await page.waitForFunction(() => document.querySelector('[data-testid="versions-section"]')?.getAttribute("data-loading") === "false", null, {
    timeout: 30000,
  });
}

async function saveVersion(page, label) {
  const before = await page.getByTestId("version-row").count();
  await page.getByTestId("version-label-input").fill(label);
  await page.getByTestId("version-save").click();
  await page.waitForFunction((n) => document.querySelectorAll('[data-testid="version-row"]').length === n + 1, before, { timeout: 30000 });
}

const rowsOf = (page) =>
  page.locator('[data-testid="version-row"]').evaluateAll((els) =>
    els.map((el) => ({
      number: Number(el.getAttribute("data-version-number")),
      name: el.querySelector('[data-testid="version-name"]').textContent.trim(),
      current: el.getAttribute("data-current") === "true",
      loaded: el.getAttribute("data-loaded") === "true",
    })),
  );

export default async function ({ page, base, admin, editor, status, h }) {
  const { product, restore } = await stageAppearance(admin, "sample-horn-shell-buttons", "e2e-design-versions.obj");
  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);

    /* ---- 1. anonymous: no design, so no socket ---- */
    await page.goto(`${base}/designer-studio/editor/new?product=${product.slug}`, { waitUntil: "networkidle" });
    await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 40000 });
    assert.equal(await page.getByTestId("output-dock").count(), 0, "an empty socket is not rendered (U8, standing ruling 1)");
    out.anonymous = "no Versions / Output socket";
    await page.evaluate(() => window.sessionStorage.clear());

    /* ---- 2. a named save ---- */
    await h.login(editor);
    await page.setViewportSize({ width: 1280, height: 900 });
    const designId = await openEditorFor(page, base, product);
    await addSampleText(page, "V1");
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "V1", "the first layer");

    await openVersions(page);
    assert.equal(await page.getByTestId("version-empty").count(), 1, "a design with no versions says so");
    await saveVersion(page, "First idea");

    const { data: v1rows, error: v1error } = await admin
      .from("design_versions")
      .select("id, version_number, label, author_kind, recipe, snapshot, created_by")
      .eq("design_id", designId)
      .order("version_number");
    if (v1error) throw new Error(v1error.message);
    assert.equal(v1rows.length, 1, "one row per save");
    const [v1] = v1rows;
    assert.equal(v1.version_number, 1);
    assert.equal(v1.label, "First idea");
    assert.equal(v1.author_kind, "buyer");
    assert.equal(v1.created_by, editor.userId);
    assert.equal(v1.recipe.layers[0].content.value, "V1", "the recipe is frozen as it stood");
    // The snapshot is the version's own copy of every entity it points at.
    assert.equal(v1.snapshot.product.id, product.id);
    assert.equal(v1.snapshot.product.item_code, product.item_code ?? v1.snapshot.product.item_code);
    assert.ok(v1.snapshot.finish?.material, "the finish's material columns are frozen (Phase 1 R2)");
    assert.equal(typeof v1.snapshot.finish.material.metalness, "number");
    assert.ok(v1.snapshot.model.storage_path.endsWith("e2e-design-versions.obj"), "and the OBJ it renders from");
    assert.equal(v1.snapshot.model.scale_status, "confirmed", "with the scale that was confirmed at the time (4a R3)");
    assert.ok(v1.snapshot.size_variant.size_primary_mm > 0);

    const { data: afterFirst } = await admin.from("designs").select("current_version_id").eq("id", designId).single();
    assert.equal(afterFirst.current_version_id, v1.id, "the design points at its newest version");
    assert.deepEqual(await rowsOf(page), [{ number: 1, name: "First idea", current: true, loaded: true }]);
    out.save = { version: 1, label: v1.label, snapshotKeys: Object.keys(v1.snapshot).sort() };

    /* ---- 3. the second save takes the next number ---- */
    await page.getByTestId("text-layer-content").fill("V2");
    await page.getByTestId("text-layer-content").blur();
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "V2", "the second state");
    await saveVersion(page, "");

    const rows = await rowsOf(page);
    assert.deepEqual(
      rows.map((r) => r.number),
      [2, 1],
      "newest first, numbered from the table",
    );
    assert.equal(rows[0].name, "Version 2", "an unnamed save is shown by its number");
    assert.equal(rows[0].current, true, "and is what the design now points at");
    assert.equal(rows[1].current, false);
    out.numbering = rows.map((r) => r.number);

    /* ---- 4. reload is an edit: the draft goes back, and undo returns ---- */
    await page.locator('[data-testid="version-row"][data-version-number="1"]').getByTestId("version-reload").click();
    await page.waitForFunction(
      () => document.querySelector('[data-testid="text-layer-content"]')?.value === "V1",
      null,
      { timeout: 30000 },
    );
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "V1", "the reloaded draft");
    const reloaded = await rowsOf(page);
    assert.equal(reloaded.find((r) => r.number === 1).loaded, true, "the list says which version the draft came from");
    assert.equal(reloaded.find((r) => r.number === 1).current, false, "reloading does not move the design's pointer");

    await page.getByTestId("undo").click();
    await page.waitForFunction(() => document.querySelector('[data-testid="text-layer-content"]')?.value === "V2", null, { timeout: 20000 });
    const undone = await readRecipe(admin, designId);
    assert.equal(undone.layers[0].content.value, "V2", "undo takes the reload back like any other edit");
    await page.locator('[data-testid="version-row"][data-version-number="1"]').getByTestId("version-reload").click();
    await waitForRecipe(page, admin, designId, (r) => r.layers?.[0]?.content?.value === "V1", "reloaded again");
    out.reload = "version 1 became the draft, undo returned to V2";

    /* ---- 5. a version is immutable ---- */
    assert.equal(await page.getByTestId("version-delete").count(), 0, "no delete is offered");
    assert.equal(await page.getByTestId("version-rename").count(), 0, "and no rename");
    const asEditor = createClient(status.API_URL, status.ANON_KEY, { auth: { persistSession: false } });
    const signIn = await asEditor.auth.signInWithPassword({ email: editor.email, password: editor.password });
    if (signIn.error) throw new Error(signIn.error.message);
    const update = await asEditor.from("design_versions").update({ label: "renamed" }).eq("id", v1.id).select("id");
    const remove = await asEditor.from("design_versions").delete().eq("id", v1.id).select("id");
    assert.deepEqual(
      { updated: update.data?.length ?? 0, removed: remove.data?.length ?? 0 },
      { updated: 0, removed: 0 },
      "and the version's own owner is granted neither (Phase 1: select and insert only)",
    );
    const { data: stillThere } = await admin.from("design_versions").select("id, label").eq("id", v1.id).single();
    assert.equal(stillThere.label, "First idea", "the row is untouched");
    out.immutable = "no rename, no delete, in the UI or the grant";

    /* ---- 6. the design list ---- */
    await page.goto(`${base}/designer-studio/designs`, { waitUntil: "networkidle" });
    const row = page.locator(`[data-testid="design-row"][data-design-id="${designId}"]`);
    await row.waitFor({ timeout: 30000 });
    assert.equal(await row.getByTestId("design-meta").getAttribute("data-versions"), "2", "the list counts the saved versions");
    await row.getByTestId("design-open").click();
    await page.waitForURL((u) => u.pathname === `/designer-studio/editor/${designId}`, { timeout: 30000 });
    await page.getByTestId("editor-viewport").locator("canvas").first().waitFor({ timeout: 40000 });
    out.list = "the design lists with 2 versions and opens from it";

    return out;
  } finally {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await restore();
  }
}
