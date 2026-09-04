// Product editor content tabs: name/description per language under
// English / 繁體 / 简体; everything else outside and always visible; the header
// language switcher changes the interface only, never the tab being edited.
import assert from "node:assert/strict";

export default async function ({ page, admin, editor, h }) {
  const { data: product } = await admin.from("products").select("id, name").eq("slug", "sample-hook-and-loop").single();
  await admin
    .from("products")
    .update({ name_zh_hant: null, name_zh_hans: null, description_zh_hant: null, description_zh_hans: null, description: null })
    .eq("id", product.id);

  await h.login(editor);
  await h.openProduct(product.id);
  await page.getByTestId("content-section").waitFor();

  // English tab is the default and carries the base name
  assert.equal(await page.getByTestId("content-tab-en").getAttribute("aria-selected"), "true");
  assert.equal(await page.getByTestId("content-name-en").inputValue(), product.name);
  assert.match(await page.getByTestId("content-tab-zh-Hant").innerText(), /empty/, "empty marker on untranslated tab");

  // Fill Traditional and Simplified through their tabs
  await page.getByTestId("content-tab-zh-Hant").click();
  await page.getByTestId("content-name-zh-Hant").fill("魔術貼樣品");
  await page.getByTestId("content-description-zh-Hant").fill("繁體描述");
  await page.getByTestId("content-tab-zh-Hans").click();
  await page.getByTestId("content-name-zh-Hans").fill("魔术贴样品");

  // Non-translatable fields are visible regardless of the active tab
  assert.ok(await page.getByTestId("material-select").isVisible(), "material select visible on a Chinese tab");
  assert.ok(await page.getByRole("heading", { name: "Identity" }).isVisible());

  // Header switcher: interface language changes, the content tab does not
  await page.getByRole("button", { name: /Switch language/ }).click();
  await page.getByRole("menuitem", { name: /Traditional Chinese/ }).click();
  await page.getByRole("heading", { name: "內容" }).waitFor();
  assert.equal(await page.getByTestId("content-tab-zh-Hans").getAttribute("aria-selected"), "true", "still on 简体 after UI switch");
  assert.equal(await page.getByTestId("content-name-zh-Hans").inputValue(), "魔术贴样品", "typed value survived the UI switch");
  await page.getByRole("button", { name: /切換語言/ }).click();
  await page.getByRole("menuitem", { name: /English|英文|英語/ }).click();
  await page.getByRole("heading", { name: "Content" }).waitFor();
  assert.equal(await page.getByTestId("content-tab-zh-Hans").getAttribute("aria-selected"), "true");

  // Save and read back
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await h.waitForToast(/^Saved\.$/);
  const { data: saved } = await admin
    .from("products")
    .select("name, name_en, name_zh_hant, name_zh_hans, description, description_en, description_zh_hant, description_zh_hans")
    .eq("id", product.id)
    .single();
  assert.equal(saved.name, product.name);
  assert.equal(saved.name_zh_hant, "魔術貼樣品");
  assert.equal(saved.name_zh_hans, "魔术贴样品");
  assert.equal(saved.description_zh_hant, "繁體描述");
  assert.equal(saved.description_zh_hans, null);
  assert.equal(saved.name_en, saved.name, "legacy override kept in step with the English base");

  // Reload: tabs no longer marked empty, values persist
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("content-section").waitFor();
  assert.doesNotMatch(await page.getByTestId("content-tab-zh-Hant").innerText(), /empty/);
  await page.getByTestId("content-tab-zh-Hant").click();
  assert.equal(await page.getByTestId("content-name-zh-Hant").inputValue(), "魔術貼樣品");

  await admin.from("products").update({ name_zh_hant: null, name_zh_hans: null, description_zh_hant: null }).eq("id", product.id);
  return { saved };
}
