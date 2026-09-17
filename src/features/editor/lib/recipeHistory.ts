/**
 * Undo history over whole-recipe snapshots (4i R2). Pure: the store calls
 * these, the node tests load them directly (type-only imports).
 */
import type { DraftRecipe } from "./recipe";

/** Undo depth. */
export const HISTORY_LIMIT = 50;

export interface History {
  recipe: DraftRecipe;
  past: DraftRecipe[];
  future: DraftRecipe[];
  /** The recipe as of the last commit. */
  checkpoint: DraftRecipe;
}

export function sameRecipe(a: DraftRecipe, b: DraftRecipe): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

export function startHistory(recipe: DraftRecipe): History {
  return { recipe, past: [], future: [], checkpoint: recipe };
}

/** Pushes the checkpoint if `recipe` moved past it, then makes `recipe` the checkpoint. A live edit that landed back where it started is no entry. */
export function commitHistory(h: History): History {
  if (h.recipe === h.checkpoint) return h;
  if (sameRecipe(h.recipe, h.checkpoint)) return { ...h, recipe: h.checkpoint };
  return { recipe: h.recipe, past: [...h.past, h.checkpoint].slice(-HISTORY_LIMIT), future: [], checkpoint: h.recipe };
}

/** A discrete change: settle any live edit first, then record this one. */
export function applyDiscrete(h: History, next: (recipe: DraftRecipe) => DraftRecipe): History {
  const settled = commitHistory(h);
  const recipe = next(settled.recipe);
  return recipe === settled.recipe ? settled : commitHistory({ ...settled, recipe });
}

export function undoHistory(h: History): History {
  const settled = commitHistory(h);
  if (settled.past.length === 0) return settled;
  const previous = settled.past[settled.past.length - 1];
  return { recipe: previous, checkpoint: previous, past: settled.past.slice(0, -1), future: [settled.recipe, ...settled.future] };
}

export function redoHistory(h: History): History {
  if (!sameRecipe(h.recipe, h.checkpoint) || h.future.length === 0) return h;
  const [next, ...rest] = h.future;
  return { recipe: next, checkpoint: next, past: [...h.past, h.recipe].slice(-HISTORY_LIMIT), future: rest };
}

/** Undo is available when there is history or an uncommitted edit; redo only from a settled state. */
export const canUndo = (h: History) => h.past.length > 0 || !sameRecipe(h.recipe, h.checkpoint);
export const canRedo = (h: History) => h.future.length > 0 && sameRecipe(h.recipe, h.checkpoint);
