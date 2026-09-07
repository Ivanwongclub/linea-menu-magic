// M5 item 2: the legacy `name_en` / `description_en` overrides are retired.
//
// The storefront reads `name` / `name_zh_hant` / `name_zh_hans` through
// `localizedName`, and the CMS clears the overrides on save so nothing
// downstream can read a stale duplicate of a name that has since changed.
//
// Proved by planting a DELIBERATELY WRONG override in the database: if any
// storefront surface still preferred it, that text would appear on screen.
import assert from "node:assert/strict";

const STALE_NAME = "STALE OVERRIDE MUST NOT RENDER";
const STALE_DESC = "Stale description override that must not render.";
const ZH_HANT = "樣品名稱繁體";
const ZH_HANS = "样品名称简体";

export default async function ({ page, base, admin, editor, h }) {
  const { data: product } = await admin
    .from("products")
    .select("id, slug, name, name_en, description, description_en, name_zh_hant, name_zh_hans, description_zh_hant, status, is_public, item_code")
    .eq("slug", "sample-bows-trimmings")
    .single();

  const restore = () =>
    admin.from("products").update({
      name: product.name, name_en: product.name_en, description: product.description,
      description_en: product.description_en, name_zh_hant: product.name_zh_hant,
      name_zh_hans: product.name_zh_hans, description_zh_hant: product.description_zh_hant,
      status: product.status, is_public: product.is_public, item_code: product.item_code,
    }).eq("id", product.id);
  await restore();

  const ok = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
  try {
    ok(await admin.from("products").update({
      status: "active", is_public: true, item_code: "E2E-LEG-001",
      description: "English description from the base column.",
      name_zh_hant: ZH_HANT, name_zh_hans: ZH_HANS,
      description_zh_hant: "繁體描述來自新欄位。",
      // the trap: a stale override, as a renamed product would have today
      name_en: STALE_NAME, description_en: STALE_DESC,
    }).eq("id", product.id));

    const bodyText = () => page.evaluate(() => document.body.innerText);
    const out = { base: product.name };

    /* ---- detail page, English: the base name, never the override ---- */
    await page.goto(`${base}/products/${product.slug}`);
    await h.dismissCookies();
    await page.getByRole("heading", { level: 1, name: product.name }).first().waitFor({ timeout: 20000 });
    let text = await bodyText();
    assert.ok(!text.includes(STALE_NAME), "detail page ignores the stale name override");
    assert.ok(!text.includes(STALE_DESC), "detail page ignores the stale description override");
    assert.ok(text.includes("English description from the base column."), "description comes from the base column");

    /* ---- detail page, 繁體: the Traditional columns ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));
    await page.goto(`${base}/products/${product.slug}`);
    await page.getByRole("heading", { level: 1, name: ZH_HANT }).first().waitFor({ timeout: 20000 });
    text = await bodyText();
    assert.ok(text.includes("繁體描述來自新欄位。"), "Traditional description renders");
    assert.ok(!text.includes(STALE_NAME) && !text.includes(STALE_DESC), "overrides ignored in 繁體 too");
    out.zhHant = ZH_HANT;

    /* ---- listing card follows the same helper ---- */
    await page.goto(`${base}/products?search=${encodeURIComponent(ZH_HANT)}`);
    await page.locator(`a[href="/products/${product.slug}"]`).first().waitFor({ timeout: 20000 });
    text = await bodyText();
    assert.ok(text.includes(ZH_HANT), "card shows the Traditional name");
    assert.ok(!text.includes(STALE_NAME), "card ignores the override");
    out.searchByChineseName = true;

    /* ---- search still works on the English base and the item code ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "en"));
    for (const term of [product.name, "E2E-LEG-001"]) {
      await page.goto(`${base}/products?search=${encodeURIComponent(term)}`);
      await page.locator(`a[href="/products/${product.slug}"]`).first().waitFor({ timeout: 20000 });
    }

    /* ---- the CMS clears the overrides on save ---- */
    const renamed = `${product.name} Renamed`;
    await h.login(editor);
    await h.openProduct(product.id);
    await page.getByTestId("content-section").waitFor();
    await page.getByTestId("content-name-en").fill(renamed);
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await h.waitForToast(/^Saved\.$/);

    const saved = ok(await admin
      .from("products")
      .select("name, name_en, description, description_en, name_zh_hant, name_zh_hans")
      .eq("id", product.id)
      .single());
    assert.equal(saved.name, renamed, "the base name is what changed");
    assert.equal(saved.name_en, null, "name_en cleared, not left stale");
    assert.equal(saved.description_en, null, "description_en cleared");
    assert.equal(saved.name_zh_hant, ZH_HANT, "the trilingual columns are untouched");
    assert.equal(saved.name_zh_hans, ZH_HANS);
    out.afterSave = { name: saved.name, name_en: saved.name_en, description_en: saved.description_en };

    /* ---- and the storefront shows the new name ---- */
    await page.goto(`${base}/products/${product.slug}`);
    await page.getByRole("heading", { level: 1, name: renamed }).first().waitFor({ timeout: 20000 });
    text = await bodyText();
    assert.ok(!text.includes(STALE_NAME), "no trace of the override after the save");

    return out;
  } finally {
    await restore();
  }
}
