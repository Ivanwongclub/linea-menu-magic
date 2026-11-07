import type { DraftRecipe } from "./recipe.ts";
import { normalizeGradient, type ColourGradient, type GradientBounds } from "./gradient.ts";
import { normalizeHex } from "./pantone.ts";

export interface PaintGroupMember { kind: "part" | "layer"; id: string }
export interface PaintGroup {
  id: string;
  name: string;
  members: PaintGroupMember[];
  colour_hex?: string;
  gradient?: ColourGradient;
}

export const memberKey = (member: PaintGroupMember) => `${member.kind}:${member.id}`;

export function findMemberGroup(groups: PaintGroup[] | undefined, target: { kind: string; id: string } | null): PaintGroup | undefined {
  return target && (target.kind === "part" || target.kind === "layer")
    ? groups?.find(group => group.members.some(member => member.kind === target.kind && member.id === target.id)) : undefined;
}

export const groupForMember = (recipe: DraftRecipe, target: { kind: string; id: string } | null) => findMemberGroup(recipe.paint_groups, target);

/** Read older recipes unchanged; reject duplicate, dangling and nested members. */
export function normalizePaintGroups(value: unknown, layerIds: Set<string>): PaintGroup[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>(), used = new Set<string>();
  const groups: PaintGroup[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object" || typeof raw.id !== "string" || !raw.id || ids.has(raw.id) || !Array.isArray(raw.members)) continue;
    const members: PaintGroupMember[] = [];
    for (const member of raw.members) {
      if (!member || typeof member.id !== "string" || (member.kind !== "part" && member.kind !== "layer")) continue;
      if (member.kind === "part" ? !/^(0|[1-9]\d*)$/.test(member.id) : !layerIds.has(member.id)) continue;
      const key = memberKey(member);
      if (used.has(key)) continue;
      used.add(key);
      members.push({ kind: member.kind, id: member.id });
    }
    if (!members.length && raw.members.length) continue;
    ids.add(raw.id);
    const gradient = normalizeGradient(raw.gradient);
    const colour = typeof raw.colour_hex === "string" ? normalizeHex(raw.colour_hex) : null;
    groups.push({ id: raw.id, name: typeof raw.name === "string" && raw.name.trim() ? raw.name.trim().slice(0, 80) : `GP ${groups.length + 1}`, members, ...(gradient ? { gradient } : colour ? { colour_hex: colour } : {}) });
  }
  return groups;
}

/** Reapplying a group fill replaces its members' individual fills, never their materials. */
export function clearMemberPaint(recipe: DraftRecipe, group: PaintGroup): DraftRecipe {
  const parts = new Set(group.members.filter(member => member.kind === "part").map(member => member.id));
  const layers = new Set(group.members.filter(member => member.kind === "layer").map(member => member.id));
  const next = { ...recipe };
  let changed = false;
  for (const field of ["part_colours", "part_gradients"] as const) {
    if (!Object.keys(recipe[field] ?? {}).some(id => parts.has(id))) continue;
    const values = Object.fromEntries(Object.entries(recipe[field]!).filter(([id]) => !parts.has(id)));
    if (Object.keys(values).length) Object.assign(next, { [field]: values });
    else delete next[field];
    changed = true;
  }
  if (recipe.layers.some(layer => layers.has(layer.id) && (layer.appearance?.colour_hex || layer.appearance?.gradient))) {
    next.layers = recipe.layers.map(layer => {
      if (!layers.has(layer.id) || !layer.appearance) return layer;
      const appearance = { ...layer.appearance };
      delete appearance.colour_hex;
      delete appearance.gradient;
      return { ...layer, appearance };
    });
    changed = true;
  }
  return changed ? next : recipe;
}

export function putPaintGroup(recipe: DraftRecipe, value: PaintGroup): DraftRecipe {
  const occupied = new Set((recipe.paint_groups ?? []).filter(group => group.id !== value.id).flatMap(group => group.members.map(memberKey)));
  const group = normalizePaintGroups([{ ...value, members: value.members.filter(member => !occupied.has(memberKey(member))) }], new Set(recipe.layers.map(layer => layer.id)))[0];
  if (!group) return recipe;
  const groups = recipe.paint_groups ?? [];
  const previous = groups.find(candidate => candidate.id === group.id);
  const next = { ...recipe, paint_groups: groups.some(candidate => candidate.id === group.id) ? groups.map(candidate => candidate.id === group.id ? group : candidate) : [...groups, group] };
  const added = group.members.filter(member => !previous?.members.some(candidate => memberKey(candidate) === memberKey(member)));
  return group.gradient || group.colour_hex ? clearMemberPaint(next, { ...group, members: added }) : next;
}

export function removePaintGroup(recipe: DraftRecipe, id: string): DraftRecipe {
  if (!recipe.paint_groups?.some(group => group.id === id)) return recipe;
  const next = { ...recipe };
  const groups = recipe.paint_groups.filter(group => group.id !== id);
  if (groups.length) next.paint_groups = groups;
  else delete next.paint_groups;
  return next;
}

export function pruneGroupLayer(recipe: DraftRecipe, id: string): DraftRecipe {
  if (!recipe.paint_groups?.some(group => group.members.some(member => member.kind === "layer" && member.id === id))) return recipe;
  const next = { ...recipe };
  const groups = recipe.paint_groups.map(group => ({ ...group, members: group.members.filter(member => member.kind !== "layer" || member.id !== id) }));
  if (groups.length) next.paint_groups = groups;
  else delete next.paint_groups;
  return next;
}

/** One atomic drop: transfer membership, take the destination fill, and optionally sort. */
export function moveGroupMember(recipe: DraftRecipe, member: PaintGroupMember, groupId: string | null, overLayerId?: string): DraftRecipe {
  if (member.kind !== "part" && member.kind !== "layer") return recipe;
  if (member.kind === "part" ? !/^(0|[1-9]\d*)$/.test(member.id) : !recipe.layers.some(layer => layer.id === member.id)) return recipe;
  const destination = groupId === null ? undefined : recipe.paint_groups?.find(group => group.id === groupId);
  if (groupId !== null && !destination) return recipe;
  const previous = groupForMember(recipe, member);
  const transferred = (previous?.id ?? null) !== groupId;
  let next = recipe;
  if (transferred) {
    const groups = (recipe.paint_groups ?? []).map(group => {
      const members = group.members.filter(candidate => memberKey(candidate) !== memberKey(member));
      if (group.id === groupId) members.push({ ...member });
      return { ...group, members };
    });
    next = { ...recipe };
    if (groups.length) next.paint_groups = groups;
    else delete next.paint_groups;
    if (destination?.gradient || destination?.colour_hex) next = clearMemberPaint(next, { ...destination, members: [member] });
  }
  if (member.kind !== "layer") return next;
  const from = next.layers.findIndex(layer => layer.id === member.id);
  const target = overLayerId ? next.layers.findIndex(layer => layer.id === overLayerId) : -1;
  const overParent = overLayerId ? groupForMember(next, { kind: "layer", id: overLayerId }) : undefined;
  if (target >= 0 && target !== from && (overParent?.id ?? null) === groupId) {
    const layers = [...next.layers];
    const [layer] = layers.splice(from, 1);
    const index = transferred ? layers.findIndex(layer => layer.id === overLayerId) : target;
    layers.splice(index, 0, layer);
    return { ...next, layers };
  }
  if (transferred) {
    const ids = new Set(destination ? destination.members.filter(member => member.kind === "layer").map(member => member.id) : next.layers.filter(layer => !groupForMember(next, { kind: "layer", id: layer.id })).map(layer => layer.id));
    const layers = next.layers.filter(layer => layer.id !== member.id);
    const last = layers.reduce((index, layer, at) => ids.has(layer.id) ? at : index, -1);
    if (last >= 0) {
      layers.splice(last + 1, 0, next.layers[from]);
      return { ...next, layers };
    }
  }
  return next;
}

export function unionGradientBounds(values: (GradientBounds | undefined)[], fallback: GradientBounds): GradientBounds {
  const bounds = values.filter((value): value is GradientBounds => !!value && value.every(Number.isFinite));
  return bounds.length ? [Math.min(...bounds.map(value => value[0])), Math.min(...bounds.map(value => value[1])), Math.max(...bounds.map(value => value[2])), Math.max(...bounds.map(value => value[3]))] : [...fallback];
}
