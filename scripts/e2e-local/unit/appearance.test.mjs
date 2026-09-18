// Phase 6a: the Pantone lookup and hex entry (R3), the v2 → v3 recipe read
// (R5), and the relief/appearance reconciliation Printed depends on (R1).
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { PANTONE_COATED, isHex, normalizeHex, normalizePantone, pantoneHex, resolveCustomColour } from "../../../src/features/editor/lib/pantone.ts";
import {
  DEFAULT_APPEARANCE,
  applyLayerPatch,
  layerAppearance,
  layerRelief,
  newLogoLayer,
  newTextLayer,
  normalizeRecipe,
  reconcileAppearance,
} from "../../../src/features/editor/lib/recipe.ts";
import { manufacturingWarnings } from "../../../src/features/editor/lib/manufacturing.ts";

test("R3: a Pantone code is canonicalised before it is looked up", () => {
  assert.equal(normalizePantone("185 c"), "185 C");
  assert.equal(normalizePantone("PANTONE 185 C"), "185 C");
  assert.equal(normalizePantone("  185  "), "185 C");
  assert.equal(normalizePantone("black 6 c"), "BLACK 6 C");
  assert.equal(normalizePantone("cool grey 9"), "COOL GRAY 9 C", "the other spelling reaches the same code");
  assert.equal(normalizePantone("#E4002B"), null, "a hex is not a code");
  assert.equal(normalizePantone("not a colour"), null);
  assert.equal(normalizePantone(""), null);
});

test("R3: a code in the bundled table resolves; one outside it does not", () => {
  assert.equal(pantoneHex("185 C"), PANTONE_COATED["185 C"]);
  assert.equal(pantoneHex("pantone 185"), PANTONE_COATED["185 C"], "however it was typed");
  assert.equal(pantoneHex("1234 C"), null, "an unknown code has no colour of its own");
  assert.equal(pantoneHex("nonsense"), null);
});

test("R3: hex entry, with or without the hash, three digits or six", () => {
  assert.equal(normalizeHex("#e4002b"), "#E4002B");
  assert.equal(normalizeHex("e4002b"), "#E4002B");
  assert.equal(normalizeHex("#f00"), "#FF0000");
  assert.equal(normalizeHex("#ff00"), null);
  assert.equal(normalizeHex("red"), null);
  assert.equal(isHex("#FFF"), true);
  assert.equal(isHex("#GGG"), false);
});

test("R3: a known code wins, an unknown code keeps the buyer's hex, a picked colour stands alone", () => {
  assert.deepEqual(resolveCustomColour({ pantone: "185 C", hex: "#000000" }), { pantone: "185 C", hex: PANTONE_COATED["185 C"] });
  assert.deepEqual(resolveCustomColour({ pantone: "1234 C", hex: "#123456" }), { pantone: "1234 C", hex: "#123456" });
  assert.equal(resolveCustomColour({ pantone: "1234 C" }), null, "a code with no colour behind it is not a colour");
  assert.deepEqual(resolveCustomColour({ hex: "#abc" }), { pantone: null, hex: "#AABBCC" });
  assert.equal(resolveCustomColour({}), null);
});

test("R5: a v2 recipe reads forward — every layer gets the appearance it implied", () => {
  const v2 = {
    recipe_version: 2,
    size_variant_id: "size",
    finish_id: "finish",
    colour_id: null,
    view: { ruler: true },
    layers: [
      {
        id: "a",
        kind: "text",
        visible: true,
        content: { type: "text", value: "POLO", font: { source: "bundled", key: "poppins-semibold" } },
        style: { text_size_mm: 1.2, letter_spacing_mm: 0 },
        placement: { layout: "straight", centre_mm: { x: 0, y: 0 }, rotation_deg: 0, radius_mm: 3, arc_position_deg: 0, direction: "cw", baseline_offset_mm: 0, conform: true },
        relief: { type: "deboss", depth_mm: 0.25, bevel_mm: 0.05 },
        fill: null,
      },
    ],
  };
  const upgraded = normalizeRecipe(v2);
  assert.equal(upgraded.recipe_version, 3);
  assert.equal(upgraded.size_variant_id, "size");
  assert.equal(upgraded.view.ruler, true);
  assert.deepEqual(upgraded.layers[0].appearance, DEFAULT_APPEARANCE, "a v2 layer was the part's own finish");
  assert.deepEqual(upgraded.layers[0].relief, { type: "deboss", depth_mm: 0.25, bevel_mm: 0.05 }, "and its relief is untouched");
  // v1 and nonsense still read as an empty v3.
  assert.deepEqual(normalizeRecipe({ finish_id: "f" }).layers, []);
  assert.equal(normalizeRecipe(null).recipe_version, 3);
});

test("R1: Printed is a relief type and an appearance at once", () => {
  const layer = newTextLayer("l", 10.8, "POLO");
  assert.equal(layerAppearance(layer).mode, "part");

  const printed = applyLayerPatch(layer, { relief: { type: "printed" } });
  assert.equal(layerAppearance(printed).mode, "printed", "choosing Printed in the relief control sets the appearance");

  const backToRaised = applyLayerPatch(printed, { relief: { type: "emboss" } });
  assert.equal(layerAppearance(backToRaised).mode, "part", "and leaving it puts the appearance back");

  const viaAppearance = applyLayerPatch(layer, { appearance: { mode: "printed" } });
  assert.equal(layerRelief(viaAppearance).type, "printed", "choosing Printed in the appearance control sets the relief");

  const painted = applyLayerPatch(viaAppearance, { appearance: { mode: "paint", finish_id: "black-enamel" } });
  assert.equal(layerRelief(painted).type, "emboss", "leaving Printed leaves flat behind");
  assert.equal(layerAppearance(painted).finish_id, "black-enamel");

  // A printed layer that carried a colour keeps it when it stops being printed.
  const printedWithColour = applyLayerPatch(painted, { appearance: { mode: "printed" } });
  const unprinted = applyLayerPatch(printedWithColour, { relief: { type: "deboss" } });
  assert.equal(layerAppearance(unprinted).mode, "paint", "the colour it was printed in becomes its paint");
  assert.equal(reconcileAppearance(layerRelief(unprinted), layerAppearance(unprinted), "relief").appearance.mode, "paint");
});

test("R1: a new layer is the part's own finish, and a logo's too", () => {
  assert.deepEqual(newTextLayer("t", 10.8).appearance, DEFAULT_APPEARANCE);
  assert.deepEqual(newLogoLayer("l", 10.8, 2, "asset").appearance, DEFAULT_APPEARANCE);
});

test("R4: printed layers answer to the print minimum, and a custom colour is information", () => {
  const base = newTextLayer("l", 15, "POLO", null, 0.15);
  const plating = { name: "Roll Plating", min_feature_mm: 0.2, min_deboss_depth_mm: 0.2, max_deboss_depth_mm: 0.5 };
  const print = { name: "Painting", min_feature_mm: 0.35, min_deboss_depth_mm: null, max_deboss_depth_mm: null };
  const printed = applyLayerPatch(base, { relief: { type: "printed" } });

  const lines = manufacturingWarnings([{ layer: printed, strokeMm: 0.3 }], plating, null, print);
  assert.deepEqual(
    lines.map((l) => [l.kind, l.severity, l.limitMm]),
    [["stroke", "warning", 0.35]],
    "0.30 mm of ink is under the print line's 0.35 mm, and no depth is checked",
  );
  assert.equal(lines[0].key, "editor.manufacturing.printStroke");

  // With no print thresholds set there is nothing to say about ink.
  assert.deepEqual(manufacturingWarnings([{ layer: printed, strokeMm: 0.3 }], plating, null, null), []);

  const custom = applyLayerPatch(printed, { appearance: { custom: { pantone: "185 C", hex: "#E4002B" } } });
  const withCustom = manufacturingWarnings([{ layer: custom, strokeMm: 1 }], plating, null, print);
  assert.deepEqual(
    withCustom.map((l) => [l.kind, l.severity, l.colour]),
    [["customColour", "info", "185 C"]],
    "a custom colour is confirmed, not corrected",
  );
});
