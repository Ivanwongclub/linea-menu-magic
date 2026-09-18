import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FINISH_OPTION_SELECT, type PickerFinish } from "./useFinishOptions";

/**
 * Every public finish, for the per-layer appearance picker (Phase 6a R2).
 *
 * A layer's plating or ink is not constrained by what the *product* has
 * attached — a buyer may want black enamel lettering on a button whose
 * attached list is all platings — so this is the whole public catalogue, and
 * the picker filters it by process: `HP`/`ROLL`/`ECO` for a plated layer,
 * `PAINT` for a colour (axis-design §1: fill is the same table, filtered).
 */
export const PLATED_PROCESSES = ["HP", "ROLL", "ECO"] as const;
export const PAINT_PROCESS = "PAINT";

export type AppearanceFinishGroup = "plated" | "paint";

export function finishesForGroup(finishes: PickerFinish[], group: AppearanceFinishGroup): PickerFinish[] {
  return finishes.filter((f) => {
    const code = f.process?.code;
    if (!code) return false;
    return group === "paint" ? code === PAINT_PROCESS : (PLATED_PROCESSES as readonly string[]).includes(code);
  });
}

async function fetchPublicFinishes(): Promise<PickerFinish[]> {
  const { data, error } = await supabase.from("finishes").select(FINISH_OPTION_SELECT).eq("is_public", true).order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as PickerFinish[];
}

export function usePublicFinishes() {
  return useQuery({ queryKey: ["editor-public-finishes"], queryFn: fetchPublicFinishes, staleTime: 5 * 60 * 1000 });
}
