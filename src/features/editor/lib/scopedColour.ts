import type { DraftRecipe, LayerAppearance } from "./recipe.ts";
import { normalizeHex } from "./pantone.ts";

export type ColourTarget = { kind: "part" | "layer" | "zone"; id: string };

export function colourOverride(recipe: DraftRecipe, target: ColourTarget | null): string | undefined {
  if (!target) return recipe.base_colour_hex;
  if (target.kind === "part") return recipe.part_colours?.[target.id];
  if (target.kind === "layer") return recipe.layers.find(layer => layer.id === target.id)?.appearance?.colour_hex;
  return recipe.zones?.find(zone => zone.id === target.id)?.appearance.colour_hex;
}

export function hasColourOverride(recipe: DraftRecipe, target: ColourTarget | null): boolean {
  if (target) return !!colourOverride(recipe, target);
  return !!recipe.base_colour_hex || !!Object.keys(recipe.part_colours ?? {}).length || recipe.layers.some(layer => !!layer.appearance?.colour_hex) || !!recipe.zones?.some(zone => !!zone.appearance.colour_hex);
}

function withColour(appearance: LayerAppearance, hex: string | null): LayerAppearance {
  const next = { ...appearance };
  if (hex) next.colour_hex = hex;
  else delete next.colour_hex;
  return next;
}

/** A live colour edit; an explicit whole-model edit replaces earlier scoped tints. */
export function applyScopedColour(recipe: DraftRecipe, target: ColourTarget | null, value: string | null): DraftRecipe {
  const hex = value === null ? null : normalizeHex(value);
  if (value !== null && !hex) return recipe;
  if (target && (colourOverride(recipe, target) ?? null) === hex) return recipe;
  if (!target) {
    const scoped = !!Object.keys(recipe.part_colours ?? {}).length || recipe.layers.some(layer => !!layer.appearance?.colour_hex) || !!recipe.zones?.some(zone => !!zone.appearance.colour_hex);
    if ((recipe.base_colour_hex ?? null) === hex && !scoped) return recipe;
    const next = { ...recipe };
    if (hex) next.base_colour_hex = hex;
    else delete next.base_colour_hex;
    delete next.part_colours;
    if (scoped) {
      next.layers = recipe.layers.map(layer => layer.appearance?.colour_hex ? { ...layer, appearance: withColour(layer.appearance, null) } : layer);
      next.zones = recipe.zones?.map(zone => zone.appearance.colour_hex ? { ...zone, appearance: withColour(zone.appearance, null) } : zone);
    }
    return next;
  }
  if (target.kind === "part") {
    if (!/^(0|[1-9]\d*)$/.test(target.id)) return recipe;
    const colours = { ...recipe.part_colours };
    if (hex) colours[target.id] = hex;
    else delete colours[target.id];
    const next = { ...recipe };
    if (Object.keys(colours).length) next.part_colours = colours;
    else delete next.part_colours;
    return next;
  }
  if (target.kind === "layer") {
    if (!recipe.layers.some(layer => layer.id === target.id)) return recipe;
    return { ...recipe, layers: recipe.layers.map(layer => layer.id === target.id ? { ...layer, appearance: withColour(layer.appearance, hex) } : layer) };
  }
  if (!recipe.zones?.some(zone => zone.id === target.id)) return recipe;
  return { ...recipe, zones: recipe.zones.map(zone => zone.id === target.id ? { ...zone, appearance: withColour(zone.appearance, hex) } : zone) };
}
