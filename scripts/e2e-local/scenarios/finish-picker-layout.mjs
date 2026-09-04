// Finish picker layout: the attached list + default selector must sit BELOW a
// viewport-bounded picker, not above a 4,500px grid where nobody looks.
// (Regression for the production report "nothing renders below the grid".)
import assert from "node:assert/strict";

export default async function ({ page, admin, editor, h }) {
  await admin.from("product_materials").update({ is_metal: true }).in("name", ["Brass", "Stainless Steel", "Zinc Alloy"]);
  const { data: metal } = await admin.from("products").select("id").eq("slug", "sample-zipper-pullers-sliders").single();
  await admin.from("products").update({ default_finish_id: null }).eq("id", metal.id);
  await admin.from("product_finishes").delete().eq("product_id", metal.id);

  const viewport = { width: 1440, height: 900 };
  await page.setViewportSize(viewport);
  await h.login(editor);
  await h.openProduct(metal.id);
  await page.getByTestId("finish-section").waitFor();
  await page.getByTestId("finish-swatch").first().waitFor();
  await page.locator('[data-testid="finish-swatch"][data-code="CYC-0001"]').click();
  await page.locator('[data-testid="attached-finish"][data-code="CYC-0001"]').waitFor();
  await page.locator('[data-testid="finish-swatch"][data-code="CYC-0002"]').click();
  await page.locator('[data-testid="attached-finish"][data-code="CYC-0002"]').waitFor();

  // Page-absolute boxes so the comparison doesn't depend on scroll position.
  const abs = (sel) =>
    page.locator(sel).first().evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + window.scrollY), bottom: Math.round(r.bottom + window.scrollY), height: Math.round(r.height) };
    });
  const picker = await abs('[data-testid="finish-picker"]');
  const rail = await abs('[data-testid="finish-rail"]');
  const grid = await abs('[data-testid="finish-grid"]');
  const attachedSection = await abs('[data-testid="attached-section"]');
  const defaultSelect = await abs('[data-testid="default-finish-select"]');
  const attachedCountBadge = await page.getByTestId("finish-attached-count").innerText();

  assert.ok(rail.height <= viewport.height * 0.75, `rail is bounded (${rail.height}px)`);
  assert.ok(grid.height <= viewport.height * 0.75, `grid is bounded (${grid.height}px)`);
  assert.ok(attachedSection.top >= picker.bottom, "attached list renders below the picker");
  assert.ok(defaultSelect.top > attachedSection.top, "default selector is inside the attached section");
  assert.equal(await page.getByTestId("attached-finish").count(), 2);
  assert.match(attachedCountBadge, /2/, "running count visible in the picker header");

  await page.getByTestId("attached-section").scrollIntoViewIfNeeded();
  assert.ok(await page.getByTestId("default-finish-select").isVisible());

  return { pickerHeight: picker.height, railHeight: rail.height, gridHeight: grid.height, attachedBelowPickerBy: attachedSection.top - picker.bottom };
}
