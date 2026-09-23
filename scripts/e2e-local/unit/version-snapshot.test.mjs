// Phase 7: what a saved version freezes (Phase 1 R2, Phase 4a R3).
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import { SNAPSHOT_VERSION, buildSnapshot } from "../../../src/features/editor/lib/versionSnapshot.ts";

const product = {
  id: "p1",
  slug: "polo-button",
  name: "Metal Shank Button",
  item_code: "WC-001",
  model_storage_path: "models/p1/polo.obj",
  model_scale_status: "confirmed",
  model_scale_factor: 0.42,
  model_scale_reference_variant_id: "v1",
  model_branding_group_indices: [3, 7],
  model_branding_reference: null,
  is_metal: true,
  default_finish_id: "f1",
  size_variants: [],
  colours: [],
};

const finish = {
  id: "f1",
  cyc_code: "CYC-0004",
  marketing_name: "Gun Metal",
  base_color_hex: "#4C5155",
  hex_approx: "#4C5155",
  metalness: 1,
  roughness: 0.2,
  anisotropy: 0,
  clearcoat: 0,
  clearcoat_roughness: 0,
  two_tone: false,
  oxide_color_hex: null,
  surface: { name: "Bright", code: "BRIGHT" },
};

const variant = { id: "v1", size_label: null, size_ligne: 24, size_primary_mm: 15.2 };
const savedAt = "2026-09-23T10:00:00.000Z";

test("a version freezes the product, the finish's material and the model's scale", () => {
  const snap = buildSnapshot({ product, finish, sizeVariant: variant, colour: null, savedAt });

  assert.equal(snap.snapshot_version, SNAPSHOT_VERSION);
  assert.equal(snap.saved_at, savedAt);
  assert.deepEqual(snap.product, { id: "p1", slug: "polo-button", name: "Metal Shank Button", item_code: "WC-001", is_metal: true });
  assert.equal(snap.finish.cyc_code, "CYC-0004");
  // Every column `finishMaterial` reads, so a recalibration cannot move a
  // version that was already saved.
  assert.deepEqual(snap.finish.material, {
    base_color_hex: "#4C5155",
    hex_approx: "#4C5155",
    metalness: 1,
    roughness: 0.2,
    anisotropy: 0,
    clearcoat: 0,
    clearcoat_roughness: 0,
    two_tone: false,
    oxide_color_hex: null,
    surface_code: "BRIGHT",
  });
  assert.deepEqual(snap.size_variant, { id: "v1", size_label: null, size_ligne: 24, size_primary_mm: 15.2 });
  assert.deepEqual(snap.model, {
    storage_path: "models/p1/polo.obj",
    sha256: null,
    scale_factor: 0.42,
    scale_status: "confirmed",
    scale_reference_variant_id: "v1",
    branding_group_indices: [3, 7],
  });
});

test("the snapshot is a copy: mutating the product afterwards does not move it", () => {
  const snap = buildSnapshot({ product, finish, sizeVariant: variant, colour: null, savedAt });
  product.model_branding_group_indices.push(9);
  assert.deepEqual(snap.model.branding_group_indices, [3, 7]);
  product.model_branding_group_indices.pop();
});

test("a non-metal product stores its colourway, never the picker's fallback finish", () => {
  const nonMetal = { ...product, is_metal: false };
  const snap = buildSnapshot({
    product: nonMetal,
    finish,
    sizeVariant: variant,
    colour: { id: "c1", name: "Ivory", hex: "#EFE9DD" },
    savedAt,
  });
  assert.equal(snap.finish, null, "no finish is claimed for a non-metal product");
  assert.deepEqual(snap.colour, { id: "c1", name: "Ivory", hex: "#EFE9DD" });
});

test("a metal product stores no colour, and a design with neither stores nulls", () => {
  const metal = buildSnapshot({ product, finish, sizeVariant: variant, colour: { id: "c1", name: "Ivory", hex: null }, savedAt });
  assert.equal(metal.colour, null);

  const bare = buildSnapshot({ product, finish: null, sizeVariant: null, colour: null, savedAt });
  assert.equal(bare.finish, null);
  assert.equal(bare.size_variant, null);
  assert.equal(bare.model.storage_path, "models/p1/polo.obj");
});
