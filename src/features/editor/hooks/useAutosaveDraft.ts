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
 *
 * 4i: while a drag is in progress (`paused`) nothing is scheduled; the
 * pointer-up bumps `flushSeq` and the drag's end state is written at once —
 * one write per drag, however long it lasted.
 */
export function useAutosaveDraft(
  designId: string | null,
  recipe: DraftRecipe,
  hydratedFor: string | null,
  { paused = false, flushSeq = 0 }: { paused?: boolean; flushSeq?: number } = {},
): AutosaveStatus {
  const [status, setStatus] = useState<AutosaveStatus>("idle");
  const hydrated = useRef<string | null>(null);
  const lastSaved = useRef<string>("");
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const flushedSeq = useRef(flushSeq);
  // A write in flight, and the newest payload: an edit made while a write is
  // out — even one back to the last saved state, like an undo — is checked
  // again when it lands, never dropped.
  const inFlight = useRef<string | null>(null);
  const latest = useRef("");
  const [recheck, setRecheck] = useState(0);

  const payload = JSON.stringify(recipe);
  latest.current = payload;

  useEffect(() => {
    if (!designId || hydratedFor !== designId) return;

    if (hydrated.current !== designId) {
      hydrated.current = designId;
      lastSaved.current = payload;
      setStatus("idle");
      return;
    }
    if (paused) {
      if (timer.current) clearTimeout(timer.current);
      return;
    }
    const flush = flushSeq !== flushedSeq.current;
    flushedSeq.current = flushSeq;
    if (payload === lastSaved.current && inFlight.current === null) return;
    if (payload === inFlight.current) return;

    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setStatus("saving");
      inFlight.current = payload;
      supabase
        .from("designs")
        .update({ draft_recipe: JSON.parse(payload), draft_updated_at: new Date().toISOString() })
        .eq("id", designId)
        .select("id")
        .then(({ data, error }) => {
          inFlight.current = null;
          if (error || !data || data.length === 0) {
            setStatus("error");
            return;
          }
          lastSaved.current = payload;
          setStatus("saved");
          if (latest.current !== payload) setRecheck((n) => n + 1);
        });
    }, flush ? 0 : DEBOUNCE_MS);

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [designId, hydratedFor, payload, paused, flushSeq, recheck]);

  return status;
}
