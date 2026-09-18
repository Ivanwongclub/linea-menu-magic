/**
 * Zones (Phase 6b R2/R3): a named region of the part's own surface with an
 * appearance of its own — the two-tone axis-design §2 said would need CAD zone
 * masks. It does not: a zone is a set of *faces*, and the editor knows every
 * face of the model it loaded.
 *
 * Three ways to say which faces: a plane dragged along an axis, one or more
 * OBJ groups, or a brush. Whichever way, what renders is a face-index set
 * masking the part's material per fragment — geometry is never duplicated and
 * never cut.
 *
 * Faces are numbered globally, walking the model's groups in file order, so
 * one index set spans the whole part. Sets are stored as a run list —
 * `[start, length, start, length, …]` — because a plane or a group selects
 * long unbroken runs, and a painted patch selects a few short ones.
 *
 * Pure: no three.js and no DOM, so the node tests load this file.
 */

export type ZoneMethod = "plane" | "groups" | "paint";

/** Which way along the model the plane cuts, and which side the zone keeps. */
export interface ZonePlane {
  axis: "x" | "y" | "z";
  /** Model-frame height of the cut, mm. */
  at_mm: number;
  side: "above" | "below";
}

/** How many faces each group contributes, in file order. */
export type FaceCounts = number[];

export const totalFaces = (counts: FaceCounts): number => counts.reduce((sum, n) => sum + n, 0);

/** The global face index the first face of `group` has. */
export function groupFaceOffset(counts: FaceCounts, group: number): number {
  let offset = 0;
  for (let i = 0; i < group && i < counts.length; i++) offset += counts[i];
  return offset;
}

/** Sorted, de-duplicated indices → `[start, length, …]`. */
export function encodeRuns(indices: Iterable<number>): number[] {
  const sorted = [...new Set(indices)].sort((a, b) => a - b);
  const runs: number[] = [];
  let start = -1;
  let previous = -2;
  for (const index of sorted) {
    if (index !== previous + 1) {
      if (start >= 0) runs.push(start, previous - start + 1);
      start = index;
    }
    previous = index;
  }
  if (start >= 0) runs.push(start, previous - start + 1);
  return runs;
}

export function decodeRuns(runs: number[] | null | undefined): number[] {
  const out: number[] = [];
  for (let i = 0; i + 1 < (runs?.length ?? 0); i += 2) {
    const start = (runs as number[])[i];
    const length = (runs as number[])[i + 1];
    for (let k = 0; k < length; k++) out.push(start + k);
  }
  return out;
}

export function runsLength(runs: number[] | null | undefined): number {
  let total = 0;
  for (let i = 1; i < (runs?.length ?? 0); i += 2) total += (runs as number[])[i];
  return total;
}

/** Every face of the named groups, as a run list. */
export function facesForGroups(counts: FaceCounts, groups: number[]): number[] {
  const runs: number[] = [];
  for (const group of [...new Set(groups)].sort((a, b) => a - b)) {
    const count = counts[group] ?? 0;
    if (count > 0) runs.push(groupFaceOffset(counts, group), count);
  }
  return encodeRuns(decodeRuns(runs));
}

/**
 * The faces a plane keeps, given every face's centroid along the axis.
 * `centroids` is a flat array of `[x, y, z]` per face, in global face order.
 */
export function facesForPlane(centroids: Float32Array | number[], plane: ZonePlane): number[] {
  const axis = plane.axis === "x" ? 0 : plane.axis === "y" ? 1 : 2;
  const inside: number[] = [];
  for (let face = 0; face * 3 + axis < centroids.length; face++) {
    const value = centroids[face * 3 + axis];
    if (plane.side === "above" ? value >= plane.at_mm : value < plane.at_mm) inside.push(face);
  }
  return encodeRuns(inside);
}

/**
 * What the spec sheet says about the zones (R3): one sentence, in the order
 * they are applied — "rim: bright nickel; face: red copper".
 */
export function zonesSentence(zones: { name: string; finish: string | null }[]): string {
  return zones
    .filter((zone) => !!zone.finish)
    .map((zone) => `${zone.name}: ${zone.finish}`)
    .join("; ");
}

/**
 * Zones are exclusive (R2): a later zone wins where two overlap. Returns the
 * winning zone's slot per face (0 = the part's own finish), and the pairs that
 * overlapped so the strip can say so.
 */
export function resolveZones(faceCount: number, zoneRuns: (number[] | null | undefined)[]): { slots: Uint8Array; overlaps: [number, number][] } {
  const slots = new Uint8Array(faceCount);
  const overlaps: [number, number][] = [];
  const seen = new Map<number, number>();
  zoneRuns.forEach((runs, zone) => {
    for (const face of decodeRuns(runs)) {
      if (face < 0 || face >= faceCount) continue;
      const previous = seen.get(face);
      if (previous !== undefined && previous !== zone && !overlaps.some(([a, b]) => a === previous && b === zone)) overlaps.push([previous, zone]);
      seen.set(face, zone);
      slots[face] = zone + 1;
    }
  });
  return { slots, overlaps };
}
