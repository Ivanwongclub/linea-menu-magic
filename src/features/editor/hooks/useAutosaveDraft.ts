import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AutosaveStatus = "idle" | "saving" | "saved";

export interface DraftRecipe {
  size_variant_id: string | null;
  finish_id: string | null;
  colour_id: string | null;
}

const DEBOUNCE_MS = 2000;

/**
 * Signed-in designs write `draft_recipe` + `draft_updated_at`, debounced
 * 2s (R7). The first render after a design loads seeds `lastSaved` without
 * writing — that render reflects the row's own saved state, not a change.
 */
export function useAutosaveDraft(designId: string | null, recipe: DraftRecipe): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const hydrated = useRef(false);
  const lastSaved = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const payload = JSON.stringify(recipe);

  useEffect(() => {
    if (!designId) return;

    if (!hydrated.current) {
      hydrated.current = true;
      lastSaved.current = payload;
      return;
    }
    if (payload === lastSaved.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("saving");
      supabase
        .from("designs")
        .update({ draft_recipe: recipe, draft_updated_at: new Date().toISOString() })
        .eq("id", designId)
        .then(({ error }) => {
          lastSaved.current = payload;
          setStatus(error ? "idle" : "saved");
        });
    }, DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designId, payload]);

  return status;
}
