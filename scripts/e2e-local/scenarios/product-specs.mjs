// M5 item 4: the specification table.
//
// The JSON blobs are no longer read, the typed columns drive the table,
// a field with no value renders as absent, the Overview block stops
// repeating the table below it, both compliance systems show labelled
// apart (ruling 3), `logo_customisable` never shows (ruling 4), and the
// material line falls back to the legacy map when the typed column is
// empty (ruling 2).
import assert from "node:assert/strict";

const JSON_TRAP = { size: "99mm FROM JSON", finish: "JSON FINISH VALUE", weight: "9.9g JSON" };
const JSON_PROD_TRAP = { capacity: "JSON CAPACITY", origin: "JSON ORIGIN" };

export default async function ({ page, base, admin, h }) {
  const { data: seeds } = await admin
    .from("products")
    .select("id, slug, name, status, is_public, item_code, material_id, attachment_id, specifications, production")
    .like("slug", "sample-%")
    .order("slug")
    .limit(3);
  const [FULL, BARE, LEGACY_MAT] = seeds;

  const { data: metals } = await admin.from("product_materials").select("id, name").eq("is_metal", true).limit(1);
  const { data: others } = await admin.from("product_materials").select("id, name").neq("id", metals[0].id).limit(1);
  const { data: attachments } = await admin.from("product_attachments").select("id, name").limit(1);
  const { data: standards } = await admin.from("compliance_standards").select("id, code, name").limit(1);
  let certifications = null;
  let createdCertId = null;
  assert.ok(metals?.length && others?.length && attachments?.length && standards?.length, "reference data");

  const restore = async () => {
    await admin.from("product_compliance_map").delete().eq("product_id", FULL.id);
    await admin.from("product_certification_map").delete().eq("product_id", FULL.id);
    await admin.from("product_material_map").delete().eq("product_id", LEGACY_MAT.id);
    if (createdCertId) await admin.from("product_certifications").delete().eq("id", createdCertId);
    for (const p of seeds) {
      await admin.from("products").update({
        status: p.status, is_public: p.is_public, item_code: p.item_code,
        material_id: p.material_id, attachment_id: p.attachment_id,
        specifications: p.specifications, production: p.production,
        face_style: null, hole_count: null, tensile_strength: null, wash_resistance: null,
        origin: null, sample_time_days: null, nickel_release_compliant: null,
        moq_qty: null, moq_unit: null, lead_time_min_days: null, lead_time_max_days: null,
      }).eq("id", p.id);
    }
  };
  await restore();

  // Only after the pre-run cleanup, which would otherwise delete it: the
  // legacy certifications table is empty on the local stack.
  ({ data: certifications } = await admin.from("product_certifications").select("id, abbreviation, name").limit(1));
  if (!certifications?.length) {
    const created = await admin
      .from("product_certifications")
      .insert({ name: "E2E Recycled Standard", abbreviation: "E2EGRS" })
      .select("id, abbreviation, name")
      .single();
    if (created.error) throw new Error(created.error.message);
    certifications = [created.data];
    createdCertId = created.data.id;
  }

  const ok = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
  try {
    /* FULL: every typed column, both compliance systems, and JSON blobs that must be ignored */
    ok(await admin.from("products").update({
      status: "active", is_public: true, item_code: "E2E-SPC-001",
      material_id: metals[0].id, attachment_id: attachments[0].id,
      face_style: "Flat", hole_count: 4, tensile_strength: "≥ 90 N",
      wash_resistance: "40 wash cycles", origin: "Dongguan, China",
      sample_time_days: 7, nickel_release_compliant: true,
      moq_qty: 5000, moq_unit: "pcs", lead_time_min_days: 15, lead_time_max_days: 20,
      specifications: JSON_TRAP, production: JSON_PROD_TRAP,
    }).eq("id", FULL.id));
    ok(await admin.from("product_compliance_map").insert({ product_id: FULL.id, standard_id: standards[0].id }));
    ok(await admin.from("product_certification_map").insert({ product_id: FULL.id, certification_id: certifications[0].id }));

    /* BARE: published, nothing typed, but a JSON blob that must still not render */
    ok(await admin.from("products").update({
      status: "active", is_public: true, item_code: "E2E-SPC-002",
      material_id: null, attachment_id: null, specifications: JSON_TRAP, production: JSON_PROD_TRAP,
    }).eq("id", BARE.id));

    /* LEGACY_MAT: no typed material, only a row in the legacy map */
    ok(await admin.from("products").update({
      status: "active", is_public: true, item_code: "E2E-SPC-003", material_id: null,
    }).eq("id", LEGACY_MAT.id));
    ok(await admin.from("product_material_map").insert({ product_id: LEGACY_MAT.id, material_id: others[0].id }));

    const out = {};
    const table = page.getByTestId("spec-table");
    const row = (k) => page.getByTestId(`spec-row-${k}`);
    const overview = page.locator("#pdp-overview");

    /* ---- FULL ---- */
    await page.goto(`${base}/products/${FULL.slug}`);
    await h.dismissCookies();
    await table.waitFor({ timeout: 20000 });

    const keys = await page.locator('[data-testid^="spec-row-"]').evaluateAll((els) =>
      els.map((e) => e.getAttribute("data-testid").replace("spec-row-", "")),
    );
    assert.deepEqual(
      keys,
      ["material", "attachment", "face_style", "hole_count", "tensile_strength", "wash_resistance", "origin", "sample_time", "nickel_release"],
      "typed rows, in reading order",
    );
    const value = async (k) => (await row(k).locator("dd").textContent()).trim();
    assert.equal(await value("material"), metals[0].name);
    assert.equal(await value("attachment"), attachments[0].name);
    assert.equal(await value("hole_count"), "4");
    assert.equal(await value("sample_time"), "7 days", "days are formatted, not raw");
    assert.equal(await value("nickel_release"), "Compliant", "the boolean reads as words");
    assert.equal(await value("origin"), "Dongguan, China", "the typed column wins over the JSON blob");
    out.rows = keys;

    // ruling 4: an untouched column default is not data
    const tableText = await table.innerText();
    assert.ok(!/logo/i.test(tableText), "logo_customisable is never rendered");

    // the JSON blobs are gone from the page entirely
    const pageText = await page.evaluate(() => document.body.innerText);
    for (const trap of [...Object.values(JSON_TRAP), ...Object.values(JSON_PROD_TRAP)]) {
      assert.ok(!pageText.includes(trap), `JSON blob value "${trap}" must not render`);
    }
    assert.ok(!/Production & Ordering/i.test(pageText), "the JSON production section is gone");

    // ruling 3: both systems, labelled apart
    await page.getByTestId("spec-standards").waitFor();
    await page.getByTestId("spec-certifications").waitFor();
    assert.ok((await page.getByTestId("spec-standards").innerText()).includes(standards[0].name.toUpperCase()) ||
      (await page.getByTestId("spec-standards").innerText()).length > 0, "standard badge rendered");
    assert.ok((await page.getByTestId("spec-certifications").innerText()).includes(certifications[0].abbreviation), "certification badge rendered");
    out.compliance = {
      standards: (await page.getByTestId("spec-standards").innerText()).trim(),
      certifications: (await page.getByTestId("spec-certifications").innerText()).trim(),
    };

    // Overview: item code, MOQ, lead time — and nothing the table already says
    const overviewText = await overview.innerText();
    assert.ok(overviewText.includes("E2E-SPC-001"), "item code added to Overview");
    assert.ok(overviewText.includes("5,000 pcs"), "MOQ formatted with its unit");
    assert.ok(overviewText.includes("15–20 days"), "lead time formatted as a range");
    for (const repeated of ["Material", "Finish", "Size", "Weight"]) {
      assert.ok(!new RegExp(`\\b${repeated}\\b`, "i").test(overviewText), `Overview no longer repeats ${repeated}`);
    }
    out.overview = overviewText.replace(/\n+/g, " | ");

    /* ---- BARE: no table, no compliance, Overview carries the code alone ---- */
    await page.goto(`${base}/products/${BARE.slug}`);
    await page.locator("#pdp-overview").waitFor({ timeout: 20000 });
    assert.equal(await table.count(), 0, "no specification table when nothing is recorded");
    assert.equal(await page.getByTestId("spec-standards").count(), 0);
    assert.equal(await page.getByTestId("spec-certifications").count(), 0);
    const bareText = await page.evaluate(() => document.body.innerText);
    for (const trap of Object.values(JSON_TRAP)) assert.ok(!bareText.includes(trap), "no JSON on a bare product either");
    assert.ok(!/Specifications/i.test(await page.locator("nav").last().innerText()), "the section nav drops the empty section");
    out.bare = { table: 0 };

    /* ---- LEGACY_MAT: ruling 2, the legacy map still shows a material ---- */
    await page.goto(`${base}/products/${LEGACY_MAT.slug}`);
    await table.waitFor({ timeout: 20000 });
    assert.equal(await value("material"), others[0].name, "material falls back to the legacy map");
    out.legacyMaterial = others[0].name;

    /* ---- Traditional Chinese labels ---- */
    await page.addInitScript(() => window.localStorage.setItem("wincyc.language", "zh-Hant"));
    await page.goto(`${base}/products/${FULL.slug}`);
    await table.waitFor({ timeout: 20000 });
    const zhLabels = await page.locator('[data-testid^="spec-row-"] dt').evaluateAll((els) => els.map((e) => e.textContent.trim()));
    assert.ok(zhLabels.includes("材質"), `material label translated: ${zhLabels.join(",")}`);
    assert.ok(zhLabels.includes("產地"), "origin label translated");
    assert.equal(await value("sample_time"), "7 天", "days unit translated");
    assert.equal(await value("nickel_release"), "符合", "boolean translated");
    out.zhHant = zhLabels;

    return out;
  } finally {
    await restore();
  }
}
