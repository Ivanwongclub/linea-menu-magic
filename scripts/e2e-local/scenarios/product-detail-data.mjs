// M5 item 1: the detail page's data plumbing.
//
// No UI change yet, so this verifies the layer that changed: the single
// query `useProduct` issues, as an ANONYMOUS viewer with RLS applied. It
// builds three products (fully populated, bare, non-metal with colours),
// loads each detail page in a real browser, and asserts the response the
// page actually received carries every embed the later steps need.
//
// It also covers the two cases the mapper is responsible for:
//   - a finish that is not public comes back as a NULL embed and is dropped
//   - a product the viewer may not see is "not found", not an error
import assert from "node:assert/strict";

const PRODUCT_QUERY = (url) => url.includes("/rest/v1/products?") && url.includes("product_size_variants");

export default async function ({ page, base, admin, h }) {
  const { data: seeds } = await admin
    .from("products")
    .select("id, slug, name, status, is_public, item_code, material_id, default_finish_id, description, origin, moq_qty, moq_unit, lead_time_min_days, lead_time_max_days, tensile_strength, wash_resistance, face_style, hole_count, attachment_id, sample_time_days, nickel_release_compliant")
    .like("slug", "sample-%")
    .order("slug");
  assert.ok(seeds.length >= 3, "need three seeds");

  const { data: metals } = await admin.from("product_materials").select("id, name").eq("is_metal", true).limit(1);
  const { data: nonMetals } = await admin.from("product_materials").select("id, name").eq("is_metal", false).limit(1);
  const { data: attachments } = await admin.from("product_attachments").select("id, code, name").limit(1);
  const { data: standards } = await admin.from("compliance_standards").select("id, code, name").limit(1);
  const { data: allFinishes } = await admin.from("finishes").select("id, cyc_code, marketing_name, is_public, hex_approx").order("sort_order").limit(3);
  assert.ok(metals?.length && nonMetals?.length && attachments?.length && standards?.length && allFinishes.length === 3, "need reference data");

  const [FULL, BARE, COLOURED] = seeds;
  const [f1, f2, fPrivate] = allFinishes;
  const touched = [FULL, BARE, COLOURED];

  const restore = async () => {
    await admin.from("product_finishes").delete().eq("product_id", FULL.id);
    await admin.from("product_size_variants").delete().eq("product_id", FULL.id);
    await admin.from("product_compliance_map").delete().eq("product_id", FULL.id);
    await admin.from("product_colours").delete().eq("product_id", COLOURED.id);
    for (const f of allFinishes) await admin.from("finishes").update({ is_public: f.is_public }).eq("id", f.id);
    // default_finish_id must clear before material_id, or the metal gate rejects it
    for (const p of touched) await admin.from("products").update({ default_finish_id: null }).eq("id", p.id);
    for (const p of touched) {
      await admin.from("products").update({
        status: p.status, is_public: p.is_public, item_code: p.item_code, material_id: p.material_id,
        description: p.description, origin: p.origin, moq_qty: p.moq_qty, moq_unit: p.moq_unit,
        lead_time_min_days: p.lead_time_min_days, lead_time_max_days: p.lead_time_max_days,
        tensile_strength: p.tensile_strength, wash_resistance: p.wash_resistance, face_style: p.face_style,
        hole_count: p.hole_count, attachment_id: p.attachment_id, sample_time_days: p.sample_time_days,
        nickel_release_compliant: p.nickel_release_compliant,
      }).eq("id", p.id);
    }
  };
  await restore();

  const ok = (r) => { if (r.error) throw new Error(r.error.message); return r.data; };
  try {
    /* ---- FULL: every typed field, both kinds of finish, sizes, compliance ---- */
    ok(await admin.from("products").update({
      status: "active", is_public: true, item_code: "E2E-PDP-001",
      material_id: metals[0].id, attachment_id: attachments[0].id,
      description: "A fully populated product for the detail page.",
      face_style: "Flat", hole_count: 4, tensile_strength: "≥ 90 N",
      wash_resistance: "40 wash cycles", origin: "Dongguan, China",
      sample_time_days: 7, nickel_release_compliant: true,
      moq_qty: 5000, moq_unit: "pcs", lead_time_min_days: 15, lead_time_max_days: 20,
    }).eq("id", FULL.id));
    ok(await admin.from("finishes").update({ is_public: true }).in("id", [f1.id, f2.id]));
    ok(await admin.from("finishes").update({ is_public: false }).eq("id", fPrivate.id));
    ok(await admin.from("product_finishes").insert([
      { product_id: FULL.id, finish_id: f1.id, sort_order: 0 },
      { product_id: FULL.id, finish_id: f2.id, sort_order: 1 },
      { product_id: FULL.id, finish_id: fPrivate.id, sort_order: 2 },
    ]));
    ok(await admin.from("products").update({ default_finish_id: f2.id }).eq("id", FULL.id));
    // size_ligne is generated from size_primary_mm — never inserted
    ok(await admin.from("product_size_variants").insert([
      { product_id: FULL.id, size_primary_mm: 15, thickness_mm: 3, weight_g: 2.5, is_default: true, sort_order: 0 },
      { product_id: FULL.id, size_primary_mm: 20, thickness_mm: 3.5, weight_g: 4.1, is_default: false, sort_order: 1 },
    ]));
    ok(await admin.from("product_compliance_map").insert({ product_id: FULL.id, standard_id: standards[0].id }));

    /* ---- BARE: name and category only ---- */
    ok(await admin.from("products").update({
      status: "active", is_public: true, item_code: "E2E-PDP-002",
      material_id: null, attachment_id: null, description: null, face_style: null, hole_count: null,
      tensile_strength: null, wash_resistance: null, origin: null, sample_time_days: null,
      nickel_release_compliant: null, moq_qty: null, moq_unit: null,
      lead_time_min_days: null, lead_time_max_days: null,
    }).eq("id", BARE.id));

    /* ---- COLOURED: non-metal with a colour list ---- */
    ok(await admin.from("products").update({
      status: "active", is_public: true, item_code: "E2E-PDP-003", material_id: nonMetals[0].id,
    }).eq("id", COLOURED.id));
    ok(await admin.from("product_colours").insert([
      { product_id: COLOURED.id, name: "Ivory", hex: "#F4F0E6", sort_order: 0 },
      { product_id: COLOURED.id, name: "Charcoal", hex: "#36393B", sort_order: 1 },
    ]));

    // The detail route is lazily loaded, so arm the wait before navigating.
    // The related-products query hits the same table but asks for no
    // variants, which is what tells the two apart.
    // maybeSingle() on a GET asks for an array and unwraps client-side, so
    // the body on the wire is a one-element array, not an object.
    const load = async (slug) => {
      const response = page.waitForResponse((r) => PRODUCT_QUERY(r.url()) && r.status() === 200, { timeout: 30000 });
      await page.goto(`${base}/products/${slug}`);
      const body = await (await response).json();
      const row = Array.isArray(body) ? body[0] : body;
      assert.ok(row, `the page received a row for ${slug}`);
      return row;
    };

    await page.goto(`${base}/products`);
    await h.dismissCookies();

    /* ---- FULL ---- */
    const full = await load(FULL.slug);
    assert.equal(full.material?.is_metal, true, "typed material embed, flagged metal");
    assert.equal(full.attachment?.code, attachments[0].code, "attachment embed");
    assert.equal(full.product_size_variants.length, 2, "size variants");
    assert.equal(full.product_compliance_map.length, 1, "compliance standard");
    assert.equal(full.default_finish_id, f2.id, "default finish recorded");
    assert.deepEqual(
      [full.face_style, full.hole_count, full.origin, full.moq_qty, full.lead_time_min_days, full.nickel_release_compliant],
      ["Flat", 4, "Dongguan, China", 5000, 15, true],
      "typed specification columns arrive",
    );
    // the RLS case the mapper handles: three attachments, one finish not public
    assert.equal(full.product_finishes.length, 3, "all three attachments are readable");
    const visible = full.product_finishes.filter((pf) => pf.finishes);
    assert.equal(visible.length, 2, "the private finish comes back as a null embed");
    assert.ok(!visible.some((pf) => pf.finishes.id === fPrivate.id), "and it is not the private one");
    assert.ok(visible.every((pf) => typeof pf.finishes.metalness === "number" && "hex_approx" in pf.finishes), "swatch fields present");
    await page.getByRole("heading", { level: 1, name: FULL.name }).first().waitFor({ timeout: 10000 });
    const out = {
      full: {
        slug: FULL.slug,
        material: full.material.name,
        sizes: full.product_size_variants.length,
        attachedFinishes: full.product_finishes.length,
        visibleFinishes: visible.map((pf) => pf.finishes.cyc_code ?? pf.finishes.marketing_name),
        compliance: full.product_compliance_map.length,
      },
    };

    /* ---- BARE ---- */
    const bare = await load(BARE.slug);
    assert.equal(bare.material, null, "no typed material");
    assert.equal(bare.product_material_map.length, 0, "no legacy material either");
    assert.equal(bare.attachment, null);
    assert.deepEqual(
      [bare.product_size_variants.length, bare.product_colours.length, bare.product_finishes.length, bare.product_compliance_map.length],
      [0, 0, 0, 0],
      "nothing attached",
    );
    assert.ok([bare.face_style, bare.origin, bare.moq_qty, bare.tensile_strength].every((v) => v === null), "typed columns null");
    await page.getByRole("heading", { level: 1, name: BARE.name }).first().waitFor({ timeout: 10000 });
    out.bare = { slug: BARE.slug, renders: true };

    /* ---- COLOURED ---- */
    const coloured = await load(COLOURED.slug);
    assert.equal(coloured.material?.is_metal, false, "non-metal material");
    assert.equal(coloured.product_colours.length, 2, "colour list");
    assert.deepEqual(coloured.product_colours.map((c) => c.hex).sort(), ["#36393B", "#F4F0E6"]);
    out.coloured = { slug: COLOURED.slug, colours: coloured.product_colours.map((c) => c.name) };

    /* ---- not found, not an error: unknown slug and a draft product ---- */
    await page.goto(`${base}/products/no-such-product-at-all`);
    await page.getByText("Product not found").waitFor({ timeout: 20000 });
    ok(await admin.from("products").update({ status: "draft" }).eq("id", BARE.id));
    await page.goto(`${base}/products/${BARE.slug}`);
    await page.getByText("Product not found").waitFor({ timeout: 20000 });
    out.notFound = { unknownSlug: true, draftProduct: true };

    return out;
  } finally {
    await restore();
  }
}
