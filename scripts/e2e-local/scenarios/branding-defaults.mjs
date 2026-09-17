// Phase 4j — catalogue branding defaults (E1 §5 row 4j, collisions 9–10,
// C8, C9; rulings §4).
//
// The Polo staged at 10.8 mm (factor 0.720193) with its 28 lettering groups
// marked and a reference recovered from the same geometry the CMS analyses:
//   1. Buyer (anonymous): the marked groups are not drawn — 5 of 33 meshes —
//      and there is no staff toggle.
//   2. Staff (catalogue editor): "Show original lettering" draws all 33 and
//      hides them again; the camera framing does not move (collision 10 —
//      the orientation was computed on the full model).
//   3. Add text lands where the factory branding was: read-back radius_mm =
//      5.048 raw × 0.720193 ± 0.01, centre, text size and relief converted at
//      the factor, `provenance` recovered on each; direction cw and the arc
//      position on the widest cluster of marked glyphs (the recovered arc
//      covers most of the circle — 4d ruling). Editing the radius makes that
//      one field `user` and leaves the others recovered.
//   4. The ruler adds the selected layer's branding radius, letter height and
//      edge margin (face radius − radius − text size / 2), no label overlaps.
//   5. Anti-brass render: with the lettering hidden and the occlusion bake
//      keyed by the hidden set (collision 9), the oxide in the former
//      lettering zone is within 5 L* of blank face, and varies no more
//      around that ring than blank face does. E1 words this as "within 5 L*
//      of the surrounding face"; the studio lights the disc with a radial
//      gradient (the profile in the result runs 61 L* at r 2.8 down to 39 at
//      r 4.4), so comparing a ring with the bands either side of it measures
//      that gradient, not the oxide. A baked-in ghost of the lettering is an
//      angular pattern at letter spacing, so this asserts the ring's
//      high-frequency variation (each angle minus a ±15° moving average, which
//      drops the studio's own gradient) against a control ring of the same
//      width on blank face, plus the two rings' means within 5 L*.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { POLO_OBJ, openEditor, pickProducts, sharp } from "../lib/calibration.mjs";
import { linearToLab, rgb255ToLinear } from "../lib/colour.mjs";
import { parseObjRawBounds } from "../../../src/features/admin/lib/objBounds.ts";
import { analyseBranding, listModelGroups } from "../../../src/features/admin/lib/brandingRecovery.ts";
import { angularClusters, faceAngle, largestCluster, recoveredSpanDeg } from "../../../src/features/editor/lib/recoveredPlacement.ts";

const MARKED = Array.from({ length: 28 }, (_, i) => i + 5);
const ANTI_BRASS = "CYC-0057";
const BODY_GROUPS = 5;

export default async function ({ page, base, admin, editor, h }) {
  const polo = readFileSync(POLO_OBJ, "utf8");
  const factor = 10.8 / parseObjRawBounds(polo).primary_raw;
  const root = new OBJLoader().parse(polo);
  const groups = listModelGroups(root);
  assert.equal(groups.length, 33, "the Polo has 33 groups");
  const analysis = analyseBranding(root, MARKED);
  assert.ok(analysis?.reference, "the fixture's lettering recovers a reference");
  const reference = analysis.reference;

  const { metal2 } = await pickProducts(admin);
  const product = metal2;
  const { data: finish } = await admin.from("finishes").select("id, is_public").eq("cyc_code", ANTI_BRASS).single();

  const modelPath = `models/${product.id}/e2e-branding-defaults.obj`;
  const up = await admin.storage.from("product-models").upload(modelPath, new Blob([polo], { type: "model/obj" }), { upsert: true, contentType: "model/obj" });
  if (up.error) throw new Error(up.error.message);
  await admin.from("finishes").update({ is_public: true }).eq("id", finish.id);
  const attach = await admin.from("product_finishes").insert({ product_id: product.id, finish_id: finish.id, sort_order: 900 });
  if (attach.error) throw new Error(attach.error.message);
  const variant = await admin
    .from("product_size_variants")
    .insert({ product_id: product.id, size_label: "10.8mm", size_primary_mm: 10.8, is_default: true, sort_order: 900 })
    .select("id")
    .single();
  if (variant.error) throw new Error(variant.error.message);
  const setModel = await admin
    .from("products")
    .update({
      model_storage_path: modelPath,
      status: "active",
      is_public: true,
      brand_id: null,
      item_code: product.item_code ?? "E2E-BRANDING-001",
      default_finish_id: finish.id,
    })
    .eq("id", product.id);
  if (setModel.error) throw new Error(setModel.error.message);
  // Own update: the reset trigger clears scale and branding when the path changes.
  const confirm = await admin
    .from("products")
    .update({
      model_scale_status: "confirmed",
      model_scale_factor: factor,
      model_scale_method: "known_dimension",
      model_scale_reference_variant_id: variant.data.id,
      model_branding_groups: MARKED.map((index) => ({ index, name: groups[index].name })),
      model_branding_reference: reference,
    })
    .eq("id", product.id);
  if (confirm.error) throw new Error(confirm.error.message);

  const restore = async () => {
    await admin.from("product_finishes").delete().eq("product_id", product.id).eq("finish_id", finish.id);
    await admin.from("finishes").update({ is_public: finish.is_public }).eq("id", finish.id);
    await admin
      .from("products")
      .update({
        model_storage_path: product.model_storage_path,
        status: product.status,
        is_public: product.is_public,
        brand_id: product.brand_id,
        item_code: product.item_code,
        default_finish_id: product.default_finish_id,
        model_scale_status: product.model_scale_status ?? "unconfirmed",
        model_scale_factor: product.model_scale_factor ?? null,
        model_scale_method: product.model_scale_method ?? null,
        model_scale_reference_variant_id: product.model_scale_reference_variant_id ?? null,
        model_branding_groups: [],
        model_branding_reference: null,
      })
      .eq("id", product.id);
    await admin.storage.from("product-models").remove([modelPath]);
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    await admin.from("product_size_variants").delete().eq("id", variant.data.id);
  };

  const viewport = () => page.getByTestId("editor-viewport");
  const url = `${base}/designer-studio/editor/new?product=${product.slug}`;
  const readLayer = async (designId) => {
    const { data, error } = await admin.from("designs").select("draft_recipe").eq("id", designId).single();
    if (error) throw new Error(error.message);
    return data.draft_recipe?.layers?.[0];
  };
  const waitForLayer = async (designId, predicate, label, timeout = 15000) => {
    const deadline = Date.now() + timeout;
    let layer;
    while (Date.now() < deadline) {
      layer = await readLayer(designId);
      if (layer && predicate(layer)) return layer;
      await page.waitForTimeout(300);
    }
    throw new Error(`${label}: read-back never matched, last ${JSON.stringify(layer)}`);
  };
  const meshCount = async () =>
    Number(await viewport().getAttribute("data-model-mesh-count"));
  const waitMeshCount = (n) =>
    page.waitForFunction((want) => document.querySelector('[data-testid="editor-viewport"]')?.getAttribute("data-model-mesh-count") === String(want), n, {
      timeout: 20000,
    });

  const out = {};
  try {
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);

    /* ---- 1. buyer: marked groups not drawn ---- */
    await page.goto(base, { waitUntil: "domcontentloaded" });
    await h.dismissCookies();
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(url, { waitUntil: "networkidle" });
    await viewport().locator("canvas").first().waitFor({ timeout: 30000 });
    await waitMeshCount(BODY_GROUPS);
    assert.equal(await viewport().getAttribute("data-model-mesh-total"), "33", "the file still has 33 groups");
    assert.equal(await page.getByTestId("original-lettering-toggle").count(), 0, "no staff toggle for a buyer");
    out.buyerMeshes = await meshCount();

    /* ---- 2. staff toggle, framing unmoved ---- */
    await h.login(editor);
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const designId = page.url().split("/").pop();
    const canvas = viewport().locator("canvas").first();
    await canvas.waitFor({ timeout: 30000 });
    await waitMeshCount(BODY_GROUPS);
    const homeBefore = await canvas.getAttribute("data-camera-home");
    await page.getByTestId("original-lettering-toggle").click();
    await waitMeshCount(33);
    await page.getByTestId("original-lettering-toggle").click();
    await waitMeshCount(BODY_GROUPS);
    assert.equal(await canvas.getAttribute("data-camera-home"), homeBefore, "showing the lettering never re-frames the camera");

    /* ---- 3. Add text: recovered defaults ---- */
    await page.getByTestId("add-text").click();
    await page.getByTestId("text-layer-content").fill("WINCYC");
    await page.getByTestId("text-layer-content").blur();
    const layer = await waitForLayer(designId, (l) => l.content.value === "WINCYC", "added text");
    const expectedRadius = reference.radius_raw * factor;
    assert.ok(Math.abs(reference.radius_raw - 5.048) <= 0.01, `the fixture's radius_raw is ${reference.radius_raw}`);
    assert.ok(Math.abs(layer.placement.radius_mm - expectedRadius) <= 0.01, `radius_mm ${layer.placement.radius_mm} vs ${expectedRadius}`);
    assert.equal(layer.placement.layout, "circle", "recovered branding starts on a circle");
    assert.equal(layer.provenance.radius_mm, "recovered");
    assert.equal(layer.provenance.centre_mm, "recovered");
    assert.equal(layer.provenance.text_size_mm, "recovered");
    assert.ok(Math.abs(layer.style.text_size_mm - reference.text_height_raw * factor) <= 1e-6, "text size at the factor");
    assert.equal(layer.relief.type, "emboss", "the factory lettering is raised");
    assert.ok(Math.abs(layer.relief.depth_mm - Math.abs(reference.relief_raw) * factor) <= 1e-6, "relief depth at the factor (physical, C10)");
    assert.equal(layer.provenance.depth_mm, "recovered");
    // 4d ruling: the recovered arc covers most of the circle, so cw at the widest cluster.
    const span = recoveredSpanDeg(reference);
    assert.ok(span > 180, `the fixture's recovered arc spans ${span.toFixed(1)}°`);
    assert.equal(layer.placement.direction, "cw");
    // The arc position is the widest cluster of the marked glyphs, computed
    // from the centres the scene reports (4 dp, hence the 0.01° tolerance),
    // not from the app.s own value.
    const centres = JSON.parse(await viewport().getAttribute("data-marked-centres"));
    assert.equal(centres.length, MARKED.length, "every marked group reported a centre");
    const cluster = largestCluster(angularClusters(centres.map(([x, y]) => faceAngle(x - layer.placement.centre_mm.x, y - layer.placement.centre_mm.y))));
    assert.ok(Math.abs(cluster.midDeg - layer.placement.arc_position_deg) <= 0.01, `arc position ${layer.placement.arc_position_deg} vs cluster ${cluster.midDeg}`);
    out.cluster = { midDeg: +cluster.midDeg.toFixed(2), extentDeg: +cluster.extentDeg.toFixed(2), count: cluster.count, spanDeg: +span.toFixed(1) };
    out.added = {
      radius_mm: layer.placement.radius_mm,
      text_size_mm: layer.style.text_size_mm,
      relief_mm: layer.relief.depth_mm,
      arc_position_deg: layer.placement.arc_position_deg,
      direction: layer.placement.direction,
      provenance: layer.provenance,
    };

    // Editing one recovered field marks only that field as the buyer's.
    await page.getByTestId("position-and-curve-toggle").click();
    await page.getByTestId("pc-radius-input").fill("4.2");
    await page.getByTestId("pc-radius-input").blur();
    const edited = await waitForLayer(designId, (l) => l.placement.radius_mm === 4.2, "edited radius");
    assert.equal(edited.provenance.radius_mm, "user", "an edited recovered field becomes user");
    assert.equal(edited.provenance.centre_mm, "recovered", "untouched fields keep their label");
    assert.equal(edited.provenance.text_size_mm, "recovered");

    /* ---- 4. ruler: the selected layer's dimensions ---- */
    await page.getByTestId("ruler-toggle").click();
    await page.getByTestId("ruler-branding-radius-label").waitFor({ timeout: 10000 });
    await page.waitForFunction(() => document.querySelector('[data-testid="ruler-edge-margin-label"]')?.style.visibility === "visible", null, { timeout: 10000 });
    const faceRadius = Number(await viewport().getAttribute("data-model-size-mm")) / 2;
    const value = async (testId) => Number(await page.getByTestId(testId).getAttribute("data-value-mm"));
    const rulerRadius = await value("ruler-branding-radius-label");
    const letterHeight = await value("ruler-letter-height-label");
    const edgeMargin = await value("ruler-edge-margin-label");
    assert.ok(Math.abs(rulerRadius - 4.2) <= 1e-6, `ruler radius ${rulerRadius}`);
    assert.ok(Math.abs(letterHeight - edited.style.text_size_mm) <= 1e-6, "letter height = the layer's text size");
    assert.ok(Math.abs(edgeMargin - (faceRadius - 4.2 - edited.style.text_size_mm / 2)) <= 0.01, `edge margin ${edgeMargin}`);
    assert.match(await page.getByTestId("ruler-edge-margin-label").innerText(), /Edge margin/);
    for (let i = 0; i < 6; i++) {
      const clashes = await page.evaluate(() => {
        const rects = [...document.querySelectorAll('[data-testid="ruler-labels"] > span')]
          .filter((el) => el.style.visibility === "visible")
          .map((el) => ({ id: el.dataset.testid, r: el.getBoundingClientRect() }));
        const handles = [...document.querySelectorAll('[data-testid="handle-arc"], [data-testid="handle-move"]')]
          .filter((el) => getComputedStyle(el).display !== "none")
          .map((el) => ({ id: el.dataset.testid, r: el.getBoundingClientRect() }));
        const hit = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const out = [];
        const all = [...rects, ...handles];
        for (let i = 0; i < rects.length; i++) {
          for (let j = 0; j < all.length; j++) {
            if (all[j] === rects[i]) continue;
            if (hit(rects[i].r, all[j].r)) out.push(`${rects[i].id}×${all[j].id}`);
          }
        }
        return { count: rects.length, clashes: out };
      });
      // Two product dimensions, the layer's three, and Phase 5's relief callout.
      assert.equal(clashes.count, 6, "two product dimensions, the layer's three and its relief");
      assert.deepEqual(clashes.clashes, [], "no ruler label overlaps another label or a handle");
      await page.waitForTimeout(300);
    }
    out.ruler = { rulerRadius, letterHeight, edgeMargin, faceRadius };
    await page.getByTestId("ruler-toggle").click();

    /* ---- 5. anti-brass: no phantom lettering in the oxide ---- */
    await admin.from("designs").delete().eq("product_id", product.id).eq("owner_id", editor.userId);
    const shotCanvas = await openEditor(page, `${url}&calibration=1`);
    await page.waitForFunction(() => document.querySelector('[data-testid="editor-viewport"] canvas')?.dataset.viewProjection != null, null, { timeout: 20000 });
    const vp = (await shotCanvas.getAttribute("data-view-projection")).split(",").map(Number);
    let faceSampleZ = Number(await viewport().getAttribute("data-face-z"));
    const shot = await shotCanvas.screenshot();
    let { data, info } = await sharp(shot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    const m = new THREE.Matrix4().fromArray(vp);
    const lightnessAt = (xMm, yMm) => {
      const p = new THREE.Vector3(xMm, yMm, faceSampleZ).applyMatrix4(m);
      const x = Math.round(((p.x + 1) / 2) * info.width);
      const y = Math.round(((1 - p.y) / 2) * info.height);
      if (x < 1 || y < 1 || x >= info.width - 1 || y >= info.height - 1) return null;
      const i = (y * info.width + x) * 3;
      return linearToLab(rgb255ToLinear([data[i], data[i + 1], data[i + 2]]))[0];
    };
    const ringSamples = (rInner, rOuter, stepDeg = 3) => {
      const bins = [];
      for (let a = 0; a < 360; a += stepDeg) {
        const values = [];
        for (let k = 0; k <= 4; k++) {
          const r = rInner + ((rOuter - rInner) * k) / 4;
          const l = lightnessAt(r * Math.sin((a * Math.PI) / 180), r * Math.cos((a * Math.PI) / 180));
          if (l != null) values.push(l);
        }
        if (values.length) bins.push(values.reduce((s, v) => s + v, 0) / values.length);
      }
      return bins;
    };
    const mean = (xs) => xs.reduce((s, v) => s + v, 0) / xs.length;
    /**
     * The oxide's high-frequency variation around a ring: each bin minus a
     * ±15° moving average. The studio's light varies slowly with angle and
     * drops out; a baked-in ghost of the lettering (letters every ~15°)
     * does not.
     */
    const detailRms = (bins) => {
      const half = 5; // bins of 3° → ±15°
      let sum = 0;
      for (let i = 0; i < bins.length; i++) {
        let local = 0;
        for (let k = -half; k <= half; k++) local += bins[(i + k + bins.length) % bins.length];
        const residual = bins[i] - local / (2 * half + 1);
        sum += residual * residual;
      }
      return Math.sqrt(sum / bins.length);
    };
    const R = reference.radius_raw * factor;
    const halfHeight = (reference.text_height_raw * factor) / 2;
    const zone = ringSamples(R - halfHeight, R + halfHeight);
    // A control ring of the same width on blank face, inside the lettering.
    const control = ringSamples(R - 1.0 - halfHeight, R - 1.0 + halfHeight);
    out.antiBrass = {
      letteringZoneMean: +mean(zone).toFixed(2),
      letteringZoneDetail: +detailRms(zone).toFixed(2),
      controlMean: +mean(control).toFixed(2),
      controlDetail: +detailRms(control).toFixed(2),
      radialProfile: [],
    };
    for (let r = 1.6; r <= 5.2; r += 0.2) out.antiBrass.radialProfile.push([+r.toFixed(1), +mean(ringSamples(r, r + 0.2)).toFixed(1)]);
    // The face is lit with a radial gradient (see the profile), so E1's
    // "zone vs the face around it" is measured around the ring, not across
    // it: lettering baked into the oxide shows up as angular variation.
    assert.ok(
      out.antiBrass.letteringZoneDetail - out.antiBrass.controlDetail <= 1.5,
      `the former lettering zone's fine variation is ${out.antiBrass.letteringZoneDetail} L* RMS against ${out.antiBrass.controlDetail} on blank face`,
    );
    assert.ok(
      Math.abs(out.antiBrass.letteringZoneMean - out.antiBrass.controlMean) <= 5,
      `the former lettering zone reads ${out.antiBrass.letteringZoneMean} L* against ${out.antiBrass.controlMean} on blank face`,
    );

    /* ---- 5b. the same measurement with the lettering shown: the detector works ---- */
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForURL((u) => /^\/designer-studio\/editor\/[0-9a-f-]{36}$/.test(u.pathname), { timeout: 20000 });
    const shownCanvas = viewport().locator("canvas").first();
    await shownCanvas.waitFor({ timeout: 30000 });
    await page.getByTestId("original-lettering-toggle").click();
    await waitMeshCount(33);
    const box = await shownCanvas.boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.up();
    await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
    await page.waitForTimeout(2500);
    const shownVp = (await shownCanvas.getAttribute("data-view-projection")).split(",").map(Number);
    const shownFaceZ = Number(await viewport().getAttribute("data-face-z"));
    const shownShot = await shownCanvas.screenshot();
    const shownRaw = await sharp(shownShot).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    m.fromArray(shownVp);
    data = shownRaw.data;
    info = shownRaw.info;
    faceSampleZ = shownFaceZ;
    const shownZone = ringSamples(R - halfHeight, R + halfHeight);
    out.antiBrass.letteringShownDetail = +detailRms(shownZone).toFixed(2);
    assert.ok(
      out.antiBrass.letteringShownDetail > out.antiBrass.letteringZoneDetail * 2,
      `with the lettering drawn the same ring reads ${out.antiBrass.letteringShownDetail} L* RMS — the check can see lettering`,
    );

    return out;
  } finally {
    await restore();
  }
}
