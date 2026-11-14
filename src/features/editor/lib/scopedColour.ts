import { newZone, type DraftRecipe, type LayerAppearance } from "./recipe.ts";
import { normalizeHex } from "./pantone.ts";
import { normalizeGradient, type ColourGradient } from "./gradient.ts";
import { clearMemberPaint, groupForMember, memberGradientColour } from "./paintGroups.ts";
import { MAX_ZONES } from "./shaderPatch.ts";

export type ColourTarget = { kind: "part" | "layer" | "zone" | "group"; id: string };

export function colourOverride(recipe: DraftRecipe, target: ColourTarget | null): string | undefined {
  if (!target) return recipe.base_colour_hex;
  if (target.kind === "part") return recipe.part_colours?.[target.id];
  if (target.kind === "layer") return recipe.layers.find(layer => layer.id === target.id)?.appearance?.colour_hex;
  if (target.kind === "group") return recipe.paint_groups?.find(group => group.id === target.id)?.colour_hex;
  return recipe.zones?.find(zone => zone.id === target.id)?.appearance.colour_hex;
}

export function gradientOverride(recipe: DraftRecipe, target: ColourTarget | null): ColourGradient | undefined {
  if (!target) return recipe.base_gradient;
  if (target.kind === "part") return recipe.part_gradients?.[target.id];
  if (target.kind === "layer") return recipe.layers.find(layer => layer.id === target.id)?.appearance?.gradient;
  if (target.kind === "group") return recipe.paint_groups?.find(group => group.id === target.id)?.gradient;
  return recipe.zones?.find(zone => zone.id === target.id)?.appearance.gradient;
}

export function hasColourOverride(recipe: DraftRecipe, target: ColourTarget | null): boolean {
  if (target) return !!colourOverride(recipe, target) || !!gradientOverride(recipe, target);
  return !!recipe.base_colour_hex || !!recipe.base_gradient || hasScopedPaint(recipe);
}

function hasScopedPaint(recipe: DraftRecipe): boolean {
  return !!Object.keys(recipe.part_colours ?? {}).length || !!Object.keys(recipe.part_gradients ?? {}).length || recipe.layers.some(layer => !!layer.appearance?.colour_hex || !!layer.appearance?.gradient) || !!recipe.zones?.some(zone => !!zone.appearance.colour_hex || !!zone.appearance.gradient) || !!recipe.paint_groups?.some(group => group.gradient || group.colour_hex);
}

function withPaint(appearance: LayerAppearance, hex: string | null, gradient: ColourGradient | null): LayerAppearance {
  const next = { ...appearance };
  delete next.colour_hex;
  delete next.gradient;
  if (hex) next.colour_hex = hex;
  if (gradient) next.gradient = gradient;
  return next;
}

/** An explicit whole-model fill replaces earlier scoped fills, retaining all materials. */
function applyPaint(recipe: DraftRecipe, target: ColourTarget | null, hex: string | null, gradient: ColourGradient | null): DraftRecipe {
  const same = (colourOverride(recipe, target) ?? null) === hex && JSON.stringify(gradientOverride(recipe, target) ?? null) === JSON.stringify(gradient);
  if (target?.kind === "group") {
    const group = recipe.paint_groups?.find(group => group.id === target.id);
    if (!group) return recipe;
    const updated = { ...group };
    delete updated.colour_hex;
    delete updated.gradient;
    if (!gradient) delete updated.gradient_mode;
    if (hex) updated.colour_hex = hex;
    if (gradient) updated.gradient = gradient;
    const next = same ? recipe : { ...recipe, paint_groups: recipe.paint_groups!.map(group => group.id === target.id ? updated : group) };
    return hex || gradient ? clearMemberPaint(next, group) : next;
  }
  if (same && (target || !hasScopedPaint(recipe))) return recipe;
  if (!target) {
    const next = { ...recipe };
    delete next.base_colour_hex;
    delete next.base_gradient;
    delete next.part_colours;
    delete next.part_gradients;
    if (hex) next.base_colour_hex = hex;
    if (gradient) next.base_gradient = gradient;
    if (hasScopedPaint(recipe)) {
      next.layers = recipe.layers.map(layer => layer.appearance?.colour_hex || layer.appearance?.gradient ? { ...layer, appearance: withPaint(layer.appearance, null, null) } : layer);
      next.zones = recipe.zones?.map(zone => zone.appearance.colour_hex || zone.appearance.gradient ? { ...zone, appearance: withPaint(zone.appearance, null, null) } : zone);
      if (recipe.paint_groups) next.paint_groups = recipe.paint_groups.map(group => {
        const copy = { ...group };
        delete copy.colour_hex;
        delete copy.gradient;
        delete copy.gradient_mode;
        return copy;
      });
    }
    return next;
  }
  if (target.kind === "part") {
    if (!/^(0|[1-9]\d*)$/.test(target.id)) return recipe;
    const colours = { ...recipe.part_colours }, gradients = { ...recipe.part_gradients };
    delete colours[target.id];
    delete gradients[target.id];
    if (hex) colours[target.id] = hex;
    if (gradient) gradients[target.id] = gradient;
    const next = { ...recipe };
    if (Object.keys(colours).length) next.part_colours = colours;
    else delete next.part_colours;
    if (Object.keys(gradients).length) next.part_gradients = gradients;
    else delete next.part_gradients;
    return next;
  }
  if (target.kind === "layer") {
    if (!recipe.layers.some(layer => layer.id === target.id)) return recipe;
    return { ...recipe, layers: recipe.layers.map(layer => layer.id === target.id ? { ...layer, appearance: withPaint(layer.appearance, hex, gradient) } : layer) };
  }
  if (!recipe.zones?.some(zone => zone.id === target.id)) return recipe;
  return { ...recipe, zones: recipe.zones.map(zone => zone.id === target.id ? { ...zone, appearance: withPaint(zone.appearance, hex, gradient) } : zone) };
}

export function applyScopedColour(recipe: DraftRecipe, target: ColourTarget | null, value: string | null): DraftRecipe {
  const hex = value === null ? null : normalizeHex(value);
  return value !== null && !hex ? recipe : applyPaint(recipe, target, hex, null);
}

export function applyScopedGradient(recipe: DraftRecipe, target: ColourTarget | null, value: ColourGradient | null): DraftRecipe {
  const gradient = value === null ? null : normalizeGradient(value);
  return value !== null && !gradient ? recipe : applyPaint(recipe, target, null, gradient);
}

function cloneGradient(gradient: ColourGradient): ColourGradient {
  return { ...gradient, ...(gradient.brightness ? { brightness: { ...gradient.brightness } } : {}) };
}

function singlePartZone(recipe: DraftRecipe, id: string) {
  return [...(recipe.zones ?? [])].reverse().find((zone) => zone.method === "groups" && zone.groups?.length === 1 && String(zone.groups[0]) === id);
}

/** The fill this part actually shows, including a group or whole-model colour it inherits. */
function resolvedPartPaint(recipe: DraftRecipe, id: string): { hex: string | null; gradient: ColourGradient | null } {
  const target = { kind: "part" as const, id };
  const ownGradient = gradientOverride(recipe, target);
  const ownHex = colourOverride(recipe, target);
  if (ownGradient) return { hex: null, gradient: cloneGradient(ownGradient) };
  if (ownHex) return { hex: ownHex, gradient: null };
  const group = groupForMember(recipe, target);
  const memberHex = memberGradientColour(group, target, recipe.layers);
  if (memberHex) return { hex: memberHex, gradient: null };
  if (group?.colour_hex) return { hex: group.colour_hex, gradient: null };
  if (group?.gradient) return { hex: null, gradient: cloneGradient(group.gradient) };
  const zone = singlePartZone(recipe, id);
  if (zone?.appearance.gradient) return { hex: null, gradient: cloneGradient(zone.appearance.gradient) };
  if (zone?.appearance.colour_hex) return { hex: zone.appearance.colour_hex, gradient: null };
  if (recipe.base_gradient) return { hex: null, gradient: cloneGradient(recipe.base_gradient) };
  if (recipe.base_colour_hex) return { hex: recipe.base_colour_hex, gradient: null };
  return { hex: null, gradient: null };
}

function materialOf(appearance: LayerAppearance): LayerAppearance {
  return { mode: appearance.mode, finish_id: appearance.finish_id, custom: appearance.custom ? { ...appearance.custom } : null };
}

/** A copied part look. It is not saved; paste writes it onto the part you choose. */
export interface PartStyleClip {
  sourceIndex: number;
  sourceName: string;
  hex: string | null;
  gradient: ColourGradient | null;
  material: LayerAppearance | null;
}

export function capturePartStyle(recipe: DraftRecipe, index: number, name: string, fallbackHex: string | null): PartStyleClip {
  const paint = resolvedPartPaint(recipe, String(index));
  const sourceZone = singlePartZone(recipe, String(index));
  return {
    sourceIndex: index,
    sourceName: name,
    hex: paint.gradient ? null : paint.hex ?? fallbackHex,
    gradient: paint.gradient,
    material: sourceZone && sourceZone.appearance.mode !== "part" ? materialOf(sourceZone.appearance) : null,
  };
}

/** Put a copied look onto the chosen parts. One recipe update, so one undo. */
export function applyPartStyleClip(recipe: DraftRecipe, clip: PartStyleClip, targetIndices: number[]): DraftRecipe {
  const targets = [...new Set(targetIndices.filter((index) => index !== clip.sourceIndex && Number.isInteger(index) && index >= 0))];
  if (!targets.length) return recipe;
  let next = recipe;
  for (const index of targets) next = applyPaint(next, { kind: "part", id: String(index) }, clip.gradient ? null : clip.hex, clip.gradient);
  let zones = [...(next.zones ?? [])];
  for (const index of targets) {
    const id = String(index);
    const existing = [...zones].reverse().find((zone) => zone.method === "groups" && zone.groups?.length === 1 && String(zone.groups[0]) === id);
    if (!clip.material) {
      if (existing) zones = zones.filter((zone) => zone.id !== existing.id);
      continue;
    }
    if (existing) zones = zones.map((zone) => (zone.id === existing.id ? { ...zone, appearance: { ...clip.material! } } : zone));
    else if (zones.length < MAX_ZONES) zones.push({ ...newZone(crypto.randomUUID(), id, "groups"), groups: [index], appearance: { ...clip.material } });
  }
  return { ...next, zones };
}

/** Switch the GP distribution and reapply its fill in one undoable operation. */
export function applyGroupGradientMode(recipe: DraftRecipe, id: string, mode: "continuous" | "members", value: ColourGradient): DraftRecipe {
  const gradient = normalizeGradient(value);
  if (!gradient || !recipe.paint_groups?.some(group => group.id === id)) return recipe;
  const next = applyScopedGradient(recipe, { kind: "group", id }, gradient);
  const groups = next.paint_groups!.map(group => {
    if (group.id !== id) return group;
    const copy = { ...group };
    if (mode === "members") copy.gradient_mode = "members";
    else delete copy.gradient_mode;
    return copy;
  });
  return { ...next, paint_groups: groups };
}
