// Phase 4d: brandingRecovery on synthetic geometry of known radius, span,
// reading direction and relief. Run: node --test scripts/e2e-local/unit/
//
// The part: a 16 × 16 × 1 raw-unit plate, face on +Z (plate top at z = 0.5),
// and eight 0.8 × 1.2 glyph boxes laid clockwise on a radius-5 circle from
// 300° to 60° (0° = +Y, clockwise viewed from +Z), standing RELIEF above the
// plate. Glyph boxes are oriented radially, so each glyph's radial extent is
// 1.2 (plus the corner overhang of its 0.8 width).
import { test } from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  analyseBranding,
  bandMedian,
  confidenceFor,
  coveringArc,
  kasaCircleFit,
  listModelGroups,
} from "../../../src/features/admin/lib/brandingRecovery.ts";

const RADIUS = 5;
const START = 300;
const SPAN = 120;
const GLYPHS = 8;
const WIDTH = 0.8;
const HEIGHT = 1.2;
const RELIEF = 0.35;
const PLATE_TOP = 0.5;

function mesh(geometry, name) {
  const m = new THREE.Mesh(geometry.toNonIndexed(), new THREE.MeshBasicMaterial());
  m.name = name;
  return m;
}

/** A glyph box whose top face sits at `topZ`, centred on the circle at clockwise angle `deg`. */
function glyph(deg, topZ, depth, name) {
  const geometry = new THREE.BoxGeometry(WIDTH, HEIGHT, depth);
  const rad = THREE.MathUtils.degToRad(deg);
  // BoxGeometry's local +Y becomes the radial direction.
  geometry.rotateZ(-rad);
  geometry.translate(RADIUS * Math.sin(rad), RADIUS * Math.cos(rad), topZ - depth / 2);
  return mesh(geometry, name);
}

function part({ order = "cw", topZ = PLATE_TOP + RELIEF, depth = RELIEF + 0.2, positions } = {}) {
  const root = new THREE.Group();
  root.add(mesh(new THREE.BoxGeometry(16, 16, 1), "plate"));
  const angles = positions ?? Array.from({ length: GLYPHS }, (_, i) => (START + (SPAN * i) / (GLYPHS - 1)) % 360);
  const ordered = order === "cw" ? angles : [...angles].reverse();
  ordered.forEach((deg, i) => root.add(glyph(deg, topZ, depth, `glyph_${i + 1}`)));
  return root;
}

const glyphIndices = Array.from({ length: GLYPHS }, (_, i) => i + 1);
const angleDiff = (a, b) => Math.abs(((a - b + 540) % 360) - 180);

test("Kåsa recovers an exact circle", () => {
  const points = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return [3 + 4 * Math.cos(a), -2 + 4 * Math.sin(a)];
  });
  const fit = kasaCircleFit(points);
  assert.ok(Math.abs(fit.cx - 3) < 1e-9 && Math.abs(fit.cy + 2) < 1e-9);
  assert.ok(Math.abs(fit.radius - 4) < 1e-9);
  assert.ok(fit.rms < 1e-9);
  assert.equal(kasaCircleFit(points.slice(0, 2)), null, "fewer than three points can't fit");
});

test("band median ignores the outer 10% on each side", () => {
  const values = [...Array(80).fill(0.5), -50, -40, -30, -20, -10, 10, 20, 30, 40, 50];
  assert.equal(bandMedian(values), 0.5);
  assert.equal(bandMedian([]), null);
});

test("confidence thresholds follow E1 §3.2 (1% / 3% of the radius)", () => {
  assert.equal(confidenceFor(0.049, 5), "high");
  assert.equal(confidenceFor(0.1, 5), "medium");
  assert.equal(confidenceFor(0.2, 5), "low");
});

test("covering arc crosses 0°", () => {
  const arc = coveringArc([350, 10, 30, 340]);
  assert.equal(arc.start, 340);
  assert.equal(arc.span, 50);
});

test("group list is file order with vertex counts", () => {
  const groups = listModelGroups(part());
  assert.equal(groups.length, GLYPHS + 1);
  assert.deepEqual(groups[0], { index: 0, name: "plate", vertexCount: 36 });
  assert.equal(groups[1].name, "glyph_1");
});

test("raised clockwise text: radius, span, direction, height, relief, confidence", () => {
  const analysis = analyseBranding(part(), glyphIndices, "2026-09-18T00:00:00.000Z");
  const r = analysis.result;
  assert.equal(r.algorithm, "kasa-circle-v1");
  assert.equal(r.origin, "recovered-from-geometry");
  assert.deepEqual(r.face_normal_raw.map((v) => Math.round(v)), [0, 0, 1]);
  assert.deepEqual(r.angle_zero_raw.map((v) => Math.round(v)), [0, 1, 0]);
  // Each glyph's radial centroid sits just outside the path by its corner overhang.
  assert.ok(Math.abs(r.radius_raw - RADIUS) / RADIUS < 0.01, `radius ${r.radius_raw}`);
  assert.equal(r.direction, "cw");
  // Covering arc = centre span + one glyph's angular width at its inner corners.
  const glyphWidthDeg = THREE.MathUtils.radToDeg(2 * Math.atan(WIDTH / 2 / (RADIUS - HEIGHT / 2)));
  assert.ok(angleDiff(r.start_angle_deg, START - glyphWidthDeg / 2) < 0.5, `start ${r.start_angle_deg}`);
  assert.ok(angleDiff(r.end_angle_deg, (START + SPAN + glyphWidthDeg / 2) % 360) < 0.5, `end ${r.end_angle_deg}`);
  assert.ok(Math.abs(r.text_height_raw - HEIGHT) < 0.05, `text height ${r.text_height_raw}`);
  assert.ok(Math.abs(r.relief_raw - RELIEF) < 1e-6, `relief ${r.relief_raw}`);
  assert.ok(Math.abs(r.centre_raw[0]) < 0.02 && Math.abs(r.centre_raw[1]) < 0.02, `centre ${r.centre_raw}`);
  assert.equal(r.confidence, "high");
  assert.equal(analysis.reference, r, "a confident result is the stored reference");
});

test("reversed glyph order reads counter-clockwise, start and end swap", () => {
  const cw = analyseBranding(part(), glyphIndices).result;
  const ccw = analyseBranding(part({ order: "ccw" }), glyphIndices).result;
  assert.equal(ccw.direction, "ccw");
  assert.ok(angleDiff(ccw.start_angle_deg, cw.end_angle_deg) < 1e-6);
  assert.ok(angleDiff(ccw.end_angle_deg, cw.start_angle_deg) < 1e-6);
});

test("recessed text measures negative relief", () => {
  const depth = 0.3;
  const r = analyseBranding(part({ topZ: PLATE_TOP - depth, depth: 0.2 }), glyphIndices).result;
  assert.ok(Math.abs(r.relief_raw + depth) < 1e-6, `relief ${r.relief_raw}`);
});

test("glyphs off any common circle are low confidence and store no reference (C9)", () => {
  const root = part();
  // Pull alternate glyphs in to ~radius 2.75 (scaling about the circle centre).
  root.children.slice(1).forEach((m, i) => {
    if (i % 2) m.geometry.scale(0.55, 0.55, 1);
  });
  const analysis = analyseBranding(root, glyphIndices);
  assert.equal(analysis.result.confidence, "low");
  assert.equal(analysis.reference, null);
});

test("fewer than three marked groups can't establish a text path", () => {
  const analysis = analyseBranding(part(), [1, 2]);
  assert.equal(analysis.result.confidence, "low");
  assert.equal(analysis.reference, null);
  assert.equal(analyseBranding(part(), []), null);
});
