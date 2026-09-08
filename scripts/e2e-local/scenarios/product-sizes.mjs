// M5 item 5: the size selector, and the page chrome translations folded in.
//
// Weight and thickness are properties of a SIZE, so they move with the
// selection. The control opens on the variant the CMS flagged default,
// which is deliberately not the first here. A product with no variants
// renders no control at all.
import assert from "node:assert/strict";

export default async function ({ page, base, admin, h }) {
  const { data: seeds } = await admin
    .from("products")
    .select("id, slug, name, status, is_public, item_code")
    .like("slug", "sample-%")
    .order("slug")
    .limit(3);
  const [MANY, ONE, NONE] = seeds;

  const restore = async () => {
    for (const p of seeds) await admin.from("product_size_variants").delete().eq("product_id", p.id);
    for (const p of seeds) {
      await admin.from("products").update({ status: p.status, is_public: p.is_public, item_code: p.item_code }).eq("id", p.id);
    }
  };
  await restore();

  const ok = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
  try {
    for (const [i, p] of seeds.entries()) {
      ok(await admin.from("products").update({ status: "active", is_public: true, item_code: `E2E-SIZ-00${i + 1}` }).eq("id", p.id));
    }

    // size_ligne is generated from size_primary_mm, so it is read back, never set.
    const variants = ok(await admin.from("product_size_variants").insert([
      { product_id: MANY.id, size_primary_mm: 15, thickness_mm: 3, weight_g: 2.5, is_default: false, sort_order: 0 },
      { product_id: MANY.id, size_primary_mm: 20, thickness_mm: 3.5, weight_g: 4.1, is_default: true, sort_order: 1 },
      { product_id: MANY.id, size_primary_mm: 25, size_secondary_mm: 18, size_label: "Inner 25 mm", thickness_mm: 4, weight_g: 6, is_default: false, sort_order: 2 },
    ]).select("id, size_primary_mm, size_ligne, size_label, weight_g, thickness_mm, is_default, sort_order"));
    const byOrder = [...variants].sort((a, b) => a.sort_order - b.sort_order);
    const [small, medium, labelled] = byOrder;
    ok(await admin.from("product_size_variants").insert({ product_id: ONE.id, size_primary_mm: 12, weight_g: 1.2, is_default: true, sort_order: 0 }));

    const selector = page.getByTestId("size-selector");
    const options = page.getByTestId("size-option");
    const detail = (k) => page.getByTestId(`size-${k}`);
    const trim = (n) => String(Number(Number(n).toFixed(2)));
    const out = {};

    /* ---- three variants: opens on the default, which is not the first ---- */
    await page.goto(`${base}/products/${MANY.slug}`);
    await h.dismissCookies();
    await selector.waitFor({ timeout: 20000 });
    assert.equal(await options.count(), 3, "one option per variant");

    const selectedId = async () => (await page.locator('[data-testid="size-option"][data-selected="true"]').getAttribute("data-size-id"));
    assert.equal(await selectedId(), medium.id, "opens on the variant flagged is_default, not the first");
    assert.equal((await detail("weight").innerText()).includes(trim(medium.weight_g)), true, "weight is the default variant's");
    assert.equal((await detail("thickness").innerText()).includes(trim(medium.thickness_mm)), true, "thickness is the default variant's");

    // ligne is shown alongside millimetres on the round sizes
    const smallBtn = page.locator(`[data-size-id="${small.id}"]`);
    assert.equal((await smallBtn.innerText()).split("\n")[0].trim(), "15 mm");
    assert.ok((await smallBtn.innerText()).includes(`${trim(small.size_ligne)}L`), `ligne shown: ${await smallBtn.innerText()}`);

    // the labelled, non-round variant leads with its label and keeps the measurement
    const labelledBtn = page.locator(`[data-size-id="${labelled.id}"]`);
    const labelledText = await labelledBtn.innerText();
    assert.ok(labelledText.includes("Inner 25 mm"), "size_label leads for non-round hardware");
    assert.ok(labelledText.includes("25 × 18 mm"), "the measurement is still shown");
    assert.ok(!labelledText.includes("L"), "a ligne is not printed on non-round hardware");
    out.labels = { round: (await smallBtn.innerText()).replace(/\n/g, " · "), nonRound: labelledText.replace(/\n/g, " · ") };

    /* ---- selecting a size moves weight and thickness ---- */
    await smallBtn.click();
    await page.waitForFunction(
      (id) => document.querySelector('[data-testid="size-option"][data-selected="true"]')?.getAttribute("data-size-id") === id,
      small.id,
    );
    assert.ok((await detail("weight").innerText()).includes(trim(small.weight_g)), "weight followed the selection");
    assert.ok((await detail("thickness").innerText()).includes(trim(small.thickness_mm)), "thickness followed the selection");
    await labelledBtn.click();
    await page.waitForFunction(
      (id) => document.querySelector('[data-testid="size-option"][data-selected="true"]')?.getAttribute("data-size-id") === id,
      labelled.id,
    );
    assert.ok((await detail("weight").innerText()).includes(trim(labelled.weight_g)));
    out.weightFollowsSize = true;

    /* ---- one variant: still shown, it tells the buyer the size ---- */
    await page.goto(`${base}/products/${ONE.slug}`);
    await selector.waitFor({ timeout: 20000 });
    assert.equal(await options.count(), 1);
    assert.equal(await detail("thickness").count(), 0, "thickness is omitted when the variant has none");
    out.one = { options: 1 };

    /* ---- no variants: no control at all ---- */
    await page.goto(`${base}/products/${NONE.slug}`);
    await page.locator("#pdp-overview").waitFor({ timeout: 20000 });
    assert.equal(await selector.count(), 0, "no size control without variants");
    out.none = { selector: 0 };

    /* ---- the whole page speaks the interface language ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));
    await page.goto(`${base}/products/${MANY.slug}`);
    await selector.waitFor({ timeout: 20000 });
    const selectorText = await selector.innerText();
    for (const zh of ["尺寸", "重量", "厚度"]) {
      assert.ok(selectorText.includes(zh), `size control translated: ${zh}`);
    }
    const pageText = await page.evaluate(() => document.body.innerText);
    for (const zh of ["概覽", "規格", "索取報價"]) {
      assert.ok(pageText.includes(zh), `page chrome translated: ${zh}`);
    }
    // Related only renders when the category has siblings published
    if ((await page.locator("#pdp-related").count()) > 0) {
      assert.ok(pageText.includes("相關輔料"), "related heading translated");
      out.relatedRendered = true;
    }
    for (const en of ["Request Quote", "Related Trims", "Add to My Library", "Applications & End Uses"]) {
      assert.ok(!pageText.includes(en), `no English chrome left: ${en}`);
    }
    out.zhHant = { selector: selectorText.replace(/\n+/g, " | ") };

    return out;
  } finally {
    await restore();
  }
}
