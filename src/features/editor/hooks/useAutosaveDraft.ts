import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { DraftRecipe } from "../lib/recipe";

export type { DraftRecipe } from "../lib/recipe";
export type AutosaveStatus = "idle" | "saving" | "saved" | "error";

const DEBOUNCE_MS = 2000;

/**
 * Signed-in designs write `draft_recipe` + `draft_updated_at`, debounced
 * 2s (R7). Hydration waits for the store to be initialised for this design
 * (collision 24): the first payload seen after `hydratedFor === designId` is
 * the row's own state and seeds `lastSaved` without a write. `lastSaved`
 * only advances when the write lands (collision 25) — an RLS-filtered
 * update returns no error and no row, so a missing row is a failure too —
 * and a failure shows as "not saved" until the next change retries it.
 */
export function useAutosaveDraft(designId: string | null, recipe: DraftRecipe, hydratedFor: string | null): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const hydrated = useRef<string | null>(null);
  const lastSaved = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const payload = JSON.stringify(recipe);

  useEffect(() => {
    if (!designId || hydratedFor !== designId) return;

    if (hydrated.current !== designId) {
      hydrated.current = designId;
      lastSaved.current = payload;
      setStatus("idle");
      return;
    }
    if (payload === lastSaved.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("saving");
      supabase
        .from("designs")
        .update({ draft_recipe: JSON.parse(payload), draft_updated_at: new Date().toISOString() })
        .eq("id", designId)
        .select("id")
        .then(({ data, error }) => {
          if (error || !data || data.length === 0) {
            setStatus("error");
            return;
          }
          lastSaved.current = payload;
          setStatus("saved");
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [designId, hydratedFor, payload]);

  return status;
}
