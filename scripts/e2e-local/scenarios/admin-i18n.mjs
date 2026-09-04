// i18n: the CMS renders in the language stored by the shared I18nProvider,
// and the header switcher changes it live.
import assert from "node:assert/strict";

export default async function ({ page, admin, editor, base, h }) {
  const { data: product } = await admin.from("products").select("id").eq("slug", "sample-hook-and-loop").single();

  // Same storage key the rest of the site uses.
  await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));

  await page.goto(`${base}/admin/login`, { waitUntil: "networkidle" });
  await h.dismissCookies();
  assert.ok(await page.getByRole("heading", { name: "WIN-CYC 管理後台" }).isVisible(), "login page in Traditional Chinese");
  await page.fill("#email", editor.email);
  await page.fill("#password", editor.password);
  await page.getByRole("button", { name: "登入" }).click();
  await page.waitForURL(/\/admin\/products$/, { timeout: 20000 });

  await page.getByRole("heading", { name: "產品" }).waitFor();
  const out = { productsHeading: "產品" };

  await page.goto(`${base}/admin/taxonomy`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "分類" }).waitFor();
  assert.ok(await page.getByRole("tab", { name: "系列" }).isVisible());

  await page.goto(`${base}/admin/products/${product.id}`, { waitUntil: "networkidle" });
  await page.getByRole("heading", { name: "基本資料" }).waitFor({ timeout: 20000 });
  assert.ok(await page.getByRole("heading", { name: "顏色與表面處理" }).isVisible());
  assert.ok(await page.getByRole("button", { name: "儲存", exact: true }).isVisible());

  // Switch to Simplified through the real header switcher, then to English.
  await page.getByRole("button", { name: /切換語言|Switch language/ }).click();
  await page.getByRole("menuitem", { name: /简体|Simplified|簡體/ }).click();
  await page.getByRole("heading", { name: "基本信息" }).waitFor();
  out.afterSwitchToHans = "基本信息";

  await page.getByRole("button", { name: /切换语言|Switch language/ }).click();
  await page.getByRole("menuitem", { name: /English|英文|英語|英语/ }).click();
  await page.getByRole("heading", { name: "Identity" }).waitFor();
  out.afterSwitchToEn = "Identity";

  const stored = await page.evaluate(() => window.localStorage.getItem("wincyc.language"));
  assert.equal(stored, "en", "choice persisted to the shared key");
  return out;
}
