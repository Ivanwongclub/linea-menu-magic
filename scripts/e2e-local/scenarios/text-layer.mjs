// Phase 4f — recipe v2, text layers, straight layout (E1 §5 row 4f,
// collisions 20–27, C10).
//
// Anonymous: add "POLO" → 4 glyph meshes; sign in → the claim inserts the
// anonymous recipe verbatim (read-back layers[0].content.value, version 2).
// Signed in: edit to "WINCYC" → autosave read-back → reload → 6 glyph meshes.
// A second layer is reordered by keyboard drag and deleted (read-backs). A
// variant switch scales size, not the stored depth-free angles (C10). A
// forced RLS denial (the design reassigned to another owner, so the update
// matches no row) shows "Not saved" and writes nothing; restoring the owner,
// the next change saves. An old v1 row opens with no layers and saves as v2.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { POLO_OBJ } from "../lib/calibration.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";

const OTHER = { email: "e2e-text-other-owner@local.test", password: "E2eOther!2026" };

async function ensureUser(admin, { email, password }) {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  if (!error) return data.user.id;
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const found = list.users.find((u) => u.email === email);
  if (!found) throw error;
  return found.id;
}

export default async function ({ page, base, admin, editor, h }) {
  const { data: products } = await admin
    .from("products")
    .select(
      "id, slug, name, item_code, model_storage_path, status, is_public, brand_id, " +
        "model_scale_status, model_scale_factor, model_scale_method, model_scale_reference_variant_id",
    )
    .like("slug", "sample-%")
    .order("slug")
    .limit(4);
  const product = products[3]; // distinct from editor-shell [0], editor-scale [1], ruler-buyer [2]
  const otherOwnerId = await ensureUser(admin, OTHER);

  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const modelPath = `models/${product.id}/e2e-text-layer.obj`;
  const uploaded = await admin.storage
    .from("product-models")
    .upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (uploaded.error) throw new Error(uploaded.error.message);

  const variants = await admin
    .from("product_size_variants")
    .insert([
      { product_id: product.id, size_label: "10.8mm", size_primary_mm: 10.8, is_default: true, sort_order: 900 },
      { product_id: product.id, size_label: "15mm", size_primary_mm: 15, is_default: false, sort_order: 901 },
    ])
    .select("id, size_primary_mm");
  if (variants.error) throw new Error(variants.error.message);
  const small = variants.data.find((v) => v.size_primary_mm === 10.8);
  const large = variants.data.find((v) => v.size_primary_mm === 15);

  const setModel = await admin
    .from("products")
    .update({ model_storage_path: modelPath, status: "active", is_public: true, brand_id: null, item_code: product.item_code ?? "E2E-TEXT-001" })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);
  const confirm = await admin
    .from("products")
    .update({ model_scale_status: "confirmed", model_scale_factor: factor, model_scale_method: "unit_mm", model_scale_reference_variant_id: small.id })
    .eq("id", product.id);
  if (confirm.error) throw new Error(confirm.error.message);

  const restore = async () => {
    await admin
      .from("products")
      .update({
        model_storage_path: product.model_storage_path,
        status: product.status,
        is_public: product.is_public,
        brand_id: product.brand_id,
        item_code: product.item_code,
        model_scale_status: product.model_scale_status ?? "unconfirmed",
        model_scale_factor: product.model_scale_factor ?? null,
        model_scale_method: product.model_scale_method ?? null,
        model_scale_reference_variant_id: product.model_scale_reference_variant_id ?? null,
      })
      .eq("id", product.id);
    await admin.storage.from("product-models").remove([modelPath]);
    await admin.from("designs").delete().eq("product_id", product.id).in("owner_id", [editor.userId, otherOwnerId]);
    await admin.from("product_size_variants").delete().in("id", [small.id, large.id]);
  };

  const readRecipe = async (designId) => {
    const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (error) throw new Error(error.message);
    return data.draft_recipe;
  };
  const waitForRecipe = async (designId, predicate, label, timeout = 12000) => {
    const deadline = Date.now() + timeout;
    let recipe;
    while (Date.now() < deadline) {
      recipe = await readRecipe(designId);
      if (predicate(recipe)) return recipe;
      await page.waitForTimeout(400);
    }
    throw new Error(`${label}: read-back never matched, last ${JSON.stringify(recipe)}`);
  };
  const viewport = () => page.getByTestId("editor-viewport");
  const glyphCount = async (n) => {
    await page.waitForFunction((want) => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-glyph-count") === String(want), n, {
      timeout: 20000,
    });
    return Number(await viewport().getAttribute("data-glyph-count"));
  };
  const saveStatus = (status) =>
    page.waitForFunction((want) => document.querySelector('[data-testid="autosave-status"]')?.getAttribute("data-status") === want, status, { timeout: 15000 });

  try {
    const url = `${base}/designer-studio/editor/new?product=${product.slug}`;

    /* ---- anonymous: empty branding, add text "POLO" ---- */
    await page.goto(url, { waitUntil: "networkidle" });
    await h.dismissCookies();
    await viewport().locator("canvas").first().waitFor({ timeout: 20000 });
    const branding = page.getByTestId("branding-group");
    await branding.waitFor({ timeout: 10000 });
    assert.equal(await page.getByTestId("text-layer-row").count(), 0, "a new design starts with no layers");
    for (const absent of [/emboss/i, /deboss/i, /engrav/i, /raised/i, /fill/i, /depth/i]) {
      assert.equal(await branding.getByText(absent).count(), 0, `no placeholder control matching ${absent}`);
    }

    await page.getByTestId("add-text").click();
    assert.equal(await page.getByTestId("text-layer-row").count(), 1, "Add text adds a layer row");
    assert.equal(await page.getByTestId("text-layer-row").first().getAttribute("data-selected"), "true", "the new layer is selected");
    await page.getByTestId("text-layer-content").fill("POLO");
    assert.equal(await glyphCount(4), 4, "anonymous POLO renders 4 glyph meshes");
    // Text size sits behind "Position and curve" since 4h.
    await page.getByTestId("position-and-curve-toggle").click();
    const sizeText = await page.getByTestId("pc-text-size-input").inputValue();
    assert.match(sizeText, /^1\.30$/, `text size shows 12% of 10.8 mm at 2 dp, got ${sizeText}`);
    const minDetAnon = Number(await viewport().getAttribute("data-min-world-determinant"));
    assert.ok(minDetAnon > 0, `no mirrored object in the scene (min det ${minDetAnon})`);

    /* ---- sign in: the claim inserts the anonymous recipe verbatim ---- */
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await h.login(editor);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    const claimed = await readRecipe(designId);
    assert.equal(claimed.recipe_version, 3, "claimed at the current recipe version");
    assert.equal(claimed.layers?.[0]?.content?.value, "POLO", "claimed layers[0].content.value = POLO");
    assert.equal(claimed.size_variant_id, small.id, "claimed size variant");

    /* ---- signed in: edit to WINCYC → autosave → read-back ---- */
    await viewport().locator("canvas").first().waitFor({ timeout: 20000 });
    await glyphCount(4);
    await page.getByTestId("text-layer-select").first().click();
    await page.getByTestId("text-layer-content").fill("WINCYC");
    const edited = await waitForRecipe(designId, (r) => r?.layers?.[0]?.content?.value === "WINCYC", "autosave WINCYC");
    assert.equal(edited.recipe_version, 3);
    await saveStatus("saved");

    /* ---- reload: 6 glyph meshes ---- */
    await page.reload({ waitUntil: "networkidle" });
    await viewport().locator("canvas").first().waitFor({ timeout: 20000 });
    assert.equal(await glyphCount(6), 6, "reload renders 6 glyph meshes for WINCYC");

    /* ---- font and text size: precision per C3, unrounded in the recipe ---- */
    await page.getByTestId("text-layer-select").first().click();
    await page.getByTestId("position-and-curve-toggle").click();
    const sizeField = page.getByTestId("pc-text-size-input");
    await sizeField.click();
    assert.match(await sizeField.inputValue(), /^\d+\.\d{3}$/, "3 dp while focused");
    await sizeField.fill("1.2345");
    await page.getByTestId("text-layer-content").click();
    assert.equal(await sizeField.inputValue(), "1.23", "2 dp at rest");
    await h.selectOption(page.getByTestId("text-layer-font"), "DM Serif Display");
    const sized = await waitForRecipe(
      designId,
      (r) => r?.layers?.[0]?.style?.text_size_mm === 1.2345 && r?.layers?.[0]?.content?.font?.key === "dm-serif-display",
      "text size + font",
    );
    assert.equal(sized.layers[0].style.text_size_mm, 1.2345, "recipe stores the unrounded value");
    await glyphCount(6);

    /* ---- second layer: reorder by drag (keyboard), then delete ---- */
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("BLUE");
    const two = await waitForRecipe(designId, (r) => r?.layers?.length === 2 && r.layers[1].content.value === "BLUE", "second layer");
    await glyphCount(10);
    await h.keyboardReorder(page.getByTestId("text-layer-handle").nth(1), "up", 1);
    const reordered = await waitForRecipe(designId, (r) => r?.layers?.[0]?.content?.value === "BLUE", "reorder");
    assert.deepEqual(reordered.layers.map((l) => l.content.value), ["BLUE", "WINCYC"], "drag reorder read-back");
    await page.getByTestId("text-layer-delete").first().click();
    const deleted = await waitForRecipe(designId, (r) => r?.layers?.length === 1, "delete");
    assert.equal(deleted.layers[0].content.value, "WINCYC", "the remaining layer is WINCYC");
    assert.equal(deleted.layers[0].id, two.layers[0].id, "the surviving layer keeps its id");
    await glyphCount(6);

    /* ---- variant switch: placement and size scale with the product (C10) ---- */
    const beforeSwitch = deleted.layers[0];
    await page.getByRole("radio", { name: /15mm/ }).click();
    const switched = await waitForRecipe(designId, (r) => r?.size_variant_id === large.id, "variant switch");
    const ratio = 15 / 10.8;
    assert.ok(Math.abs(switched.layers[0].style.text_size_mm - beforeSwitch.style.text_size_mm * ratio) < 1e-9, "text size scales with the variant");
    assert.ok(Math.abs(switched.layers[0].placement.radius_mm - beforeSwitch.placement.radius_mm * ratio) < 1e-9, "radius scales with the variant");
    assert.equal(switched.layers[0].placement.arc_position_deg, beforeSwitch.placement.arc_position_deg, "angles don't scale");
    // Phase 5: relief is physical — a variant switch never scales it (C10).
    assert.deepEqual(switched.layers[0].relief, beforeSwitch.relief, "relief depth and bevel stay physical across a variant switch");

    /* ---- forced RLS denial: "Not saved", nothing written; restored → saves ---- */
    const denied = await admin.from("designs").update({ owner_id: otherOwnerId }).eq("id", designId);
    if (denied.error) throw new Error(denied.error.message);
    await page.getByTestId("text-layer-select").first().click();
    await page.getByTestId("text-layer-content").fill("DENIED");
    await saveStatus("error");
    const statusText = await page.getByTestId("autosave-status").innerText();
    assert.match(statusText, /not saved/i, `status line shows Not saved, got ${statusText}`);
    assert.equal((await readRecipe(designId)).layers[0].content.value, "WINCYC", "the denied write left the row unchanged");
    const allowed = await admin.from("designs").update({ owner_id: editor.userId }).eq("id", designId);
    if (allowed.error) throw new Error(allowed.error.message);
    await page.getByTestId("text-layer-content").fill("WINCYC!");
    await waitForRecipe(designId, (r) => r?.layers?.[0]?.content?.value === "WINCYC!", "save after the denial");
    await saveStatus("saved");

    /* ---- an old v1 row opens with layers [] and saves as v2 ---- */
    const v1 = await admin
      .from("designs")
      .insert({
        name: "E2E v1 recipe",
        product_id: product.id,
        brand_id: null,
        owner_id: editor.userId,
        status: "draft",
        draft_recipe: { size_variant_id: small.id, finish_id: null, colour_id: null },
      })
      .select("id")
      .single();
    if (v1.error) throw new Error(v1.error.message);
    await page.goto(`${base}/designer-studio/editor/${v1.data.id}`, { waitUntil: "networkidle" });
    await viewport().locator("canvas").first().waitFor({ timeout: 20000 });
    await page.getByTestId("branding-group").waitFor({ timeout: 10000 });
    assert.equal(await page.getByTestId("text-layer-row").count(), 0, "a v1 row opens with no layers");
    await page.waitForTimeout(2600);
    assert.equal((await readRecipe(v1.data.id)).recipe_version, undefined, "opening a v1 row writes nothing by itself (hydration gate)");
    await page.getByTestId("ruler-toggle").click();
    const upgraded = await waitForRecipe(v1.data.id, (r) => r?.recipe_version === 3, "v1 → v3 on first change");
    assert.deepEqual(upgraded.layers, [], "saved v1 row has layers []");
    assert.equal(upgraded.view.ruler, true);

    return {
      designId,
      claimed: claimed.layers[0].content.value,
      edited: edited.layers[0].content.value,
      reordered: reordered.layers.map((l) => l.content.value),
      switchedTextSize: switched.layers[0].style.text_size_mm,
      notSaved: statusText,
      v1Upgraded: upgraded.recipe_version,
    };
  } finally {
    await restore();
  }
}
