// Phase 4k: SVG validation before an upload, the logo layer's defaults and
// its ruler dimensions, and the 4j tie rule for recovered clusters (R5).
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MAX_LOGO_BYTES, pathsAreClosed, validateLogoSvg } from "../../../src/features/editor/lib/logoSvg.ts";
import { applyLayerPatch, logoHeightMm, newLogoLayer, scaleLayers } from "../../../src/features/editor/lib/recipe.ts";
import { edgeMarginMm, layerDimensions } from "../../../src/features/editor/lib/layerMeasurements.ts";
import { dragPatch, layerHandles, startProgress } from "../../../src/features/editor/lib/handleGeometry.ts";
import { CLUSTER_TIE_DEG, largestCluster } from "../../../src/features/editor/lib/recoveredPlacement.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const fixture = (name) => readFileSync(path.join(ROOT, "scripts/e2e-local/fixtures", name), "utf8");
const close = (a, b, eps, msg) => assert.ok(Math.abs(a - b) <= eps, `${msg}: ${a} vs ${b}`);

test("the valid fixture passes; the fixture with <text> is named as the reason", () => {
  const valid = fixture("logo-valid.svg");
  assert.deepEqual(validateLogoSvg(valid, Buffer.byteLength(valid)), { ok: true });
  const invalid = fixture("logo-invalid.svg");
  assert.deepEqual(validateLogoSvg(invalid, Buffer.byteLength(invalid)), { ok: false, reason: "element", element: "text" });
});

test("only outlines, closed, under 200 KB (R1)", () => {
  const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">${body}</svg>`;
  const ok = wrap('<path d="M0 0 H10 V10 H0 Z"/>');
  assert.equal(validateLogoSvg(ok, 100).ok, true);
  assert.equal(validateLogoSvg(ok, MAX_LOGO_BYTES + 1).reason, "tooLarge");
  assert.equal(validateLogoSvg("not an svg at all", 20).reason, "notSvg");
  for (const [body, element] of [
    ['<image href="x.png"/><path d="M0 0 H1 V1 H0 Z"/>', "image"],
    ['<linearGradient id="g"/><path d="M0 0 H1 V1 H0 Z"/>', "lineargradient"],
    ['<filter id="f"/><path d="M0 0 H1 V1 H0 Z"/>', "filter"],
    ['<mask id="m"/><path d="M0 0 H1 V1 H0 Z"/>', "mask"],
  ]) {
    assert.deepEqual(validateLogoSvg(wrap(body), 200), { ok: false, reason: "element", element }, element);
  }
  assert.equal(validateLogoSvg(wrap('<path d="M0 0 H10 V10"/>'), 100).reason, "openPath", "an open path is refused");
  assert.equal(validateLogoSvg(wrap('<path d="M0 0 H10 V10 H0 Z M2 2 H4 V4"/>'), 100).reason, "openPath", "every subpath must close");
  assert.equal(validateLogoSvg(wrap("<title>Empty</title>"), 100).reason, "empty");
  assert.equal(validateLogoSvg(wrap('<rect x="0" y="0" width="4" height="4"/>'), 100).ok, true, "basic shapes are outlines too");
  assert.equal(pathsAreClosed("M0 0 H1 V1 H0 Z"), true);
});

test("a new logo layer: 40% of the face, centred, height from the aspect", () => {
  const layer = newLogoLayer("l", 10.8, 100 / 60, "asset-1");
  close(layer.content.width_mm, 0.4 * 10.8, 1e-9, "width");
  close(logoHeightMm(layer), 0.4 * 10.8 / (100 / 60), 1e-9, "height");
  assert.equal(layer.content.asset_id, "asset-1");
  assert.deepEqual(layer.placement.centre_mm, { x: 0, y: 0 });
  assert.equal(layer.placement.rotation_deg, 0);
  assert.equal(layer.placement.layout, "free");
  assert.equal(layer.placement.conform, true);
  // A variant switch scales a logo like it scales text (C10).
  const [scaled] = scaleLayers([layer], 2);
  close(scaled.content.width_mm, layer.content.width_mm * 2, 1e-9, "scaled width");
  assert.equal(scaled.content.aspect, layer.content.aspect, "aspect is scale-free");
});

test("corner drag scales the width about the centre, aspect kept", () => {
  const layer = newLogoLayer("l", 10.8, 2, "a");
  const handles = layerHandles(layer);
  assert.deepEqual(handles.move, { x: 0, y: 0 });
  close(handles.size.x, layer.content.width_mm / 2, 1e-9, "corner x");
  close(handles.size.y, logoHeightMm(layer) / 2, 1e-9, "corner y");
  const start = { kind: "size", layer, at: handles.size };
  const patch = dragPatch(start, startProgress(start), { x: handles.size.x * 2, y: handles.size.y * 2 });
  close(patch.content.width_mm, layer.content.width_mm * 2, 1e-9, "doubled width");
  const grown = applyLayerPatch(layer, patch);
  close(grown.content.aspect, layer.content.aspect, 1e-12, "aspect untouched");
});

test("a logo's ruler dimensions: width, height, edge margin to its farthest corner", () => {
  const layer = newLogoLayer("l", 10.8, 2, "a");
  const dims = layerDimensions(layer, 5.4);
  assert.deepEqual(
    dims.map((d) => d.kind),
    ["logoWidth", "logoHeight", "edgeMargin"],
  );
  close(dims[0].valueMm, layer.content.width_mm, 1e-9, "width");
  close(dims[1].valueMm, logoHeightMm(layer), 1e-9, "height");
  const corner = Math.hypot(layer.content.width_mm / 2, logoHeightMm(layer) / 2);
  close(dims[2].valueMm, 5.4 - corner, 1e-9, "edge margin");
  close(edgeMarginMm(layer, 5.4), dims[2].valueMm, 1e-12, "same formula");
});

test("R5: clusters within 20° of extent tie, and the one nearest 0° wins", () => {
  const cluster = (midDeg, extentDeg, count) => ({ midDeg, extentDeg, count, startDeg: midDeg - extentDeg / 2 });
  const top = cluster(10, 44, 4);
  const bottom = cluster(140, 60, 8);
  assert.ok(bottom.extentDeg - top.extentDeg <= CLUSTER_TIE_DEG, "the Polo's two clusters are a tie");
  assert.equal(largestCluster([bottom, top]), top, "the cluster nearest 12 o'clock wins the tie");
  assert.equal(largestCluster([top, bottom]), top, "order doesn't matter");
  // Outside the tie band the widest still wins.
  assert.equal(largestCluster([cluster(10, 20, 3), cluster(200, 90, 9)]).midDeg, 200);
});
