import { test } from "node:test";
import assert from "node:assert/strict";
import { defaultPartName, normalizePartNames, partDisplayName, renamePartName } from "../../../src/features/editor/lib/partNames.ts";
import { normalizeRecipe } from "../../../src/features/editor/lib/recipe.ts";

test("unnamed parts use one-based Object labels", () => {
  assert.equal(defaultPartName(0), "Object 1");
  assert.equal(defaultPartName(1), "Object 2");
  assert.equal(partDisplayName(0, ""), "Object 1");
  assert.equal(partDisplayName(2, "Named mesh"), "Named mesh");
});

test("part renames are trimmed and empty input restores the fallback", () => {
  const renamed = renamePartName({}, 1, "  Front plate  ");
  assert.deepEqual(renamed, { "1": "Front plate" });
  assert.equal(partDisplayName(1, "Object 2", renamed), "Front plate");
  assert.deepEqual(renamePartName(renamed, 1, "   "), {});
});

test("part names survive recipe normalization and ignore malformed entries", () => {
  const recipe = normalizeRecipe({
    recipe_version: 3,
    view: {},
    layers: [],
    part_names: { "0": "  Face  ", "1": "", bad: "No", "-1": "No", "2": 42 },
  });
  assert.deepEqual(recipe.part_names, { "0": "Face" });
  assert.deepEqual(normalizePartNames(null), {});
});
