// Phase 6b: the run-list encoding a zone's faces are stored as (R3) and the
// plane classification the height split uses (R2).
// Run: node --test "scripts/e2e-local/unit/*.test.mjs"
import { test } from "node:test";
import assert from "node:assert/strict";
import {
  decodeRuns,
  encodeRuns,
  facesForGroups,
  facesForPlane,
  groupFaceOffset,
  resolveZones,
  runsLength,
  totalFaces,
  zonesSentence,
} from "../../../src/features/editor/lib/zones.ts";

test("R3: faces encode as runs and come back unchanged", () => {
  assert.deepEqual(encodeRuns([0, 1, 2, 7, 8, 20]), [0, 3, 7, 2, 20, 1]);
  assert.deepEqual(decodeRuns([0, 3, 7, 2, 20, 1]), [0, 1, 2, 7, 8, 20]);
  // Out of order and repeated in, sorted and unique out.
  assert.deepEqual(encodeRuns([5, 4, 4, 6, 1]), [1, 1, 4, 3]);
  assert.deepEqual(encodeRuns([]), []);
  assert.deepEqual(decodeRuns(null), []);
  assert.equal(runsLength([0, 3, 7, 2]), 5);
  assert.equal(runsLength(undefined), 0);
});

test("R3: a long run costs two numbers, which is the point", () => {
  const solid = Array.from({ length: 5000 }, (_, i) => i + 100);
  assert.deepEqual(encodeRuns(solid), [100, 5000], "a plane or a part is one run");
  const speckled = [1, 3, 5, 7];
  assert.equal(encodeRuns(speckled).length, 8, "a brush stroke is a few short ones");
});

test("R2: a group's faces are its own slice of the global order", () => {
  const counts = [4, 6, 2];
  assert.equal(totalFaces(counts), 12);
  assert.equal(groupFaceOffset(counts, 0), 0);
  assert.equal(groupFaceOffset(counts, 1), 4);
  assert.equal(groupFaceOffset(counts, 2), 10);
  assert.deepEqual(facesForGroups(counts, [1]), [4, 6]);
  assert.deepEqual(facesForGroups(counts, [0, 2]), [0, 4, 10, 2]);
  // Neighbouring groups merge into one run.
  assert.deepEqual(facesForGroups(counts, [0, 1]), [0, 10]);
  assert.deepEqual(facesForGroups(counts, []), []);
});

test("R2: the plane keeps the side it is told to, by face centroid", () => {
  //            face 0 (z 2)   face 1 (z 0)   face 2 (z -2)
  const centroids = [0, 0, 2, 0, 0, 0, 0, 0, -2];
  assert.deepEqual(facesForPlane(centroids, { axis: "z", at_mm: 0, side: "above" }), [0, 2], "on the plane counts as above");
  assert.deepEqual(facesForPlane(centroids, { axis: "z", at_mm: 0, side: "below" }), [2, 1]);
  assert.deepEqual(facesForPlane(centroids, { axis: "z", at_mm: 3, side: "above" }), []);
  // The axis is the model's, not the screen's.
  assert.deepEqual(facesForPlane([2, 0, 0, -2, 0, 0], { axis: "x", at_mm: 0, side: "above" }), [0, 1]);
});

test("R2: zones are exclusive — the later one wins, and the overlap is reported", () => {
  const { slots, overlaps } = resolveZones(6, [
    [0, 4], // faces 0–3
    [2, 3], // faces 2–4
  ]);
  assert.deepEqual([...slots], [1, 1, 2, 2, 2, 0], "the second zone takes the faces they share");
  assert.deepEqual(overlaps, [[0, 1]]);

  const clean = resolveZones(6, [[0, 2], [4, 2]]);
  assert.deepEqual(clean.overlaps, [], "zones that don't touch don't warn");
  assert.deepEqual([...clean.slots], [1, 1, 0, 0, 2, 2]);

  // A face beyond the model is ignored rather than written out of bounds.
  const stray = resolveZones(2, [[0, 10]]);
  assert.deepEqual([...stray.slots], [1, 1]);
});

test("R3: the spec sheet reads as one sentence, in the order they are applied", () => {
  assert.equal(
    zonesSentence([
      { name: "rim", finish: "Bright Nickel" },
      { name: "face", finish: "Red Copper" },
    ]),
    "rim: Bright Nickel; face: Red Copper",
  );
  assert.equal(zonesSentence([{ name: "rim", finish: null }]), "", "a zone with nothing chosen says nothing");
});
