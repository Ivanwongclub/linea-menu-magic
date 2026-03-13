import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Brochure } from "../types";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export function useBrochureMutations() {
  const qc = useQueryClient();

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["flipbook-brochures"] });
    qc.invalidateQueries({ queryKey: ["flipbook-brochure"] });
  };

  const createBrochure = useMutation({
    mutationFn: async (input: TablesInsert<"flipbook_brochures">) => {
      const { data, error } = await supabase
        .from("flipbook_brochures")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as Brochure;
    },
    onSuccess: invalidate,
  });

  const updateBrochure = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: TablesUpdate<"flipbook_brochures"> & { id: string }) => {
      const { data, error } = await supabase
        .from("flipbook_brochures")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as Brochure;
    },
    onSuccess: invalidate,
  });

  const deleteBrochure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flipbook_brochures")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { createBrochure, updateBrochure, deleteBrochure };
}
