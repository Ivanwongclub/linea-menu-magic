// M5 item 3: the detail-page gallery, and the empty state that replaces
// the fabricated seed photographs.
//
// Three products: one with three images (primary is NOT first in sort
// order, so the two fields are shown to be independent), one with a single
// image (no thumbnail strip), and one with none (deliberate empty state).
// Also asserts no bundled stock photograph reaches the page any more.
import assert from "node:assert/strict";
import sharp from "sharp";

const BUCKET = "product-assets";
const COLOURS = ["#8899aa", "#aa8899", "#99aa88"];

export default async function ({ page, base, admin, h }) {
  const { data: seeds } = await admin
    .from("products")
    .select("id, slug, name, status, is_public, item_code, product_category_map(is_primary, product_categories(name))")
    .like("slug", "sample-%")
    .order("slug")
    .limit(3);
  assert.equal(seeds.length, 3, "need three seeds");
  const [THREE, ONE, NONE] = seeds;
  const categoryName = (p) => p.product_category_map.find((m) => m.is_primary)?.product_categories?.name
    ?? p.product_category_map[0]?.product_categories?.name ?? null;

  const objectPaths = [];
  const upload = async (product, index) => {
    const buf = await sharp({ create: { width: 600, height: 600, channels: 3, background: COLOURS[index] } }).png().toBuffer();
    const path = `images/${product.id}/e2e-gallery-${index}.png`;
    const { error } = await admin.storage.from(BUCKET).upload(path, buf, { contentType: "image/png", upsert: true });
    if (error) throw error;
    objectPaths.push(path);
    return admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  };

  const restore = async () => {
    for (const p of seeds) await admin.from("product_images").delete().eq("product_id", p.id);
    if (objectPaths.length) await admin.storage.from(BUCKET).remove(objectPaths);
    for (const p of seeds) {
      await admin.from("products").update({ status: p.status, is_public: p.is_public, item_code: p.item_code }).eq("id", p.id);
    }
  };
  await restore();

  const ok = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
  try {
    for (const [i, p] of seeds.entries()) {
      ok(await admin.from("products").update({ status: "active", is_public: true, item_code: `E2E-GAL-00${i + 1}` }).eq("id", p.id));
    }

    // THREE: sort order 0,1,2 — but the PRIMARY is the middle one.
    const urls = [await upload(THREE, 0), await upload(THREE, 1), await upload(THREE, 2)];
    ok(await admin.from("product_images").insert([
      { product_id: THREE.id, url: urls[0], sort_order: 0, is_primary: false, alt_text: "Front face, brushed" },
      { product_id: THREE.id, url: urls[1], sort_order: 1, is_primary: true, alt_text: "Reverse, shank detail" },
      { product_id: THREE.id, url: urls[2], sort_order: 2, is_primary: false, alt_text: null },
    ]));
    // ONE: a single image, so there must be no thumbnail strip
    const single = await upload(ONE, 0);
    ok(await admin.from("product_images").insert({ product_id: ONE.id, url: single, sort_order: 0, is_primary: true, alt_text: "Only view" }));

    const out = {};
    const hero = page.getByTestId("gallery-hero");
    const strip = page.getByTestId("gallery-strip");
    const empty = page.getByTestId("gallery-empty");

    /* ---- three images: primary opens, sort_order orders the strip ---- */
    await page.goto(`${base}/products/${THREE.slug}`);
    await h.dismissCookies();
    await hero.waitFor({ timeout: 20000 });
    const heroSrc = () => hero.locator("img").getAttribute("src");
    assert.match(await heroSrc(), /e2e-gallery-1\.png$/, "hero opens on the PRIMARY image, not the first by sort order");
    assert.equal(await hero.locator("img").getAttribute("alt"), "Reverse, shank detail", "editor alt_text is used");
    await strip.waitFor();
    const thumbs = strip.getByTestId("gallery-thumb");
    assert.equal(await thumbs.count(), 3, "one thumbnail per image");
    const thumbSrcs = await thumbs.locator("img").evaluateAll((els) => els.map((e) => e.getAttribute("src")));
    assert.deepEqual(
      thumbSrcs.map((s) => s.match(/e2e-gallery-(\d)\.png/)[1]),
      ["0", "1", "2"],
      "the strip follows sort_order",
    );
    // click the third: hero swaps, and the missing alt_text falls back to a description
    await thumbs.nth(2).click();
    await page.waitForFunction(() => document.querySelector('[data-testid="gallery-hero"] img')?.getAttribute("src")?.endsWith("e2e-gallery-2.png"));
    assert.match(await hero.locator("img").getAttribute("alt"), /view 3$/, "generated alt text when the editor wrote none");
    out.three = { thumbs: 3, primaryOpensHero: true };

    /* ---- lightbox: opens, counts, navigates, zooms ---- */
    await hero.click();
    const lightbox = page.getByTestId("gallery-lightbox");
    await lightbox.waitFor({ timeout: 10000 });
    assert.equal((await page.getByTestId("gallery-counter").textContent()).trim(), "3 / 3");
    const lightboxImg = lightbox.locator("img");
    assert.equal(await lightboxImg.getAttribute("data-zoomed"), "false");
    await lightboxImg.click({ position: { x: 40, y: 40 } });
    await page.waitForFunction(() => document.querySelector('[data-testid="gallery-lightbox"] img')?.getAttribute("data-zoomed") === "true");
    const transform = await lightboxImg.evaluate((el) => el.style.transform);
    assert.match(transform, /scale\(2\.5\)/, "clicking the image zooms it");
    await page.getByRole("button", { name: "Next image" }).click();
    await page.waitForFunction(() => document.querySelector('[data-testid="gallery-counter"]')?.textContent.trim() === "1 / 3");
    assert.equal(await lightboxImg.getAttribute("data-zoomed"), "false", "zoom resets when the image changes");
    await page.keyboard.press("Escape");
    await lightbox.waitFor({ state: "hidden", timeout: 10000 });
    out.lightbox = { zoom: transform, navigates: true, escCloses: true };

    /* ---- one image: no thumbnail strip at all ---- */
    await page.goto(`${base}/products/${ONE.slug}`);
    await hero.waitFor({ timeout: 20000 });
    assert.equal(await strip.count(), 0, "a single image renders no thumbnail strip");
    assert.equal(await empty.count(), 0);
    out.one = { strip: 0 };

    /* ---- no images: a deliberate empty state, no stand-in photograph ---- */
    await page.goto(`${base}/products/${NONE.slug}`);
    await empty.waitFor({ timeout: 20000 });
    assert.equal(await hero.count(), 0, "no hero button without an image");
    assert.equal(await strip.count(), 0, "no empty thumbnail strip");
    assert.equal(await empty.locator("img").count(), 0, "the empty state is typographic, not an image");
    const emptyText = await empty.innerText();
    // the label is CSS-uppercased, and innerText returns rendered text
    assert.ok(/photography in preparation/i.test(emptyText), "states plainly that photography is pending");
    assert.ok(emptyText.includes("E2E-GAL-003"), "carries the item code");
    const cat = categoryName(NONE);
    if (cat) assert.ok(emptyText.includes(cat), "carries the category");
    assert.ok(/samples/i.test(emptyText), "offers a physical sample");
    out.empty = { text: emptyText.replace(/\n+/g, " | ") };

    /* ---- nothing bundled from the deleted seed maps reaches the page ---- */
    const srcs = await page.locator("main img, section img").evaluateAll((els) => els.map((e) => e.getAttribute("src") ?? ""));
    assert.ok(!srcs.some((s) => s.includes("/assets/products/")), `no bundled stock photograph: ${srcs.join(" ")}`);

    /* ---- the empty state speaks the interface language ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));
    await page.goto(`${base}/products/${NONE.slug}`);
    await empty.waitFor({ timeout: 20000 });
    const zhText = await empty.innerText();
    assert.ok(zhText.includes("產品照片準備中"), "Traditional Chinese empty state");
    out.emptyZhHant = zhText.split("\n").find((l) => l.includes("準備中"));

    return out;
  } finally {
    await restore();
  }
}
