import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FinishInsert = Database["public"]["Tables"]["finishes"]["Insert"];
export type FinishUpdate = Database["public"]["Tables"]["finishes"]["Update"];

/**
 * Writes for the finish manager. cyc_code is guarded by prevent_code_change
 * (immutable once non-null) and is_standard/cyc_code by the
 * standard_finish_needs_code check — the form validates both in words
 * first; anything that still slips through is relayed via describeSupabaseError.
 */
export function useFinishMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-finishes"] });

  const create = useMutation({
    mutationFn: async (values: FinishInsert) => {
      const { data, error } = await supabase.from("finishes").insert(values).select("id").single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: FinishUpdate }) => {
      const { error } = await supabase.from("finishes").update(values).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const bulkSetPublic = useMutation({
    mutationFn: async ({ ids, isPublic }: { ids: string[]; isPublic: boolean }) => {
      const { error } = await supabase.from("finishes").update({ is_public: isPublic }).in("id", ids);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, bulkSetPublic };
}
