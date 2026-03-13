import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HotLink } from "../types";

export function useHotlinks(pageId: string | undefined) {
  return useQuery<HotLink[]>({
    queryKey: ["flipbook-hotlinks", pageId],
    enabled: !!pageId,
    queryFn: async () => {
      if (!pageId) return [];
      const { data, error } = await supabase
        .from("flipbook_hotlinks")
        .select("*")
        .eq("page_id", pageId);
      if (error) throw error;
      return (data ?? []) as HotLink[];
    },
  });
}

export function useHotlinkMutations(pageId: string) {
  const qc = useQueryClient();
  const key = ["flipbook-hotlinks", pageId];

  const insertHotlink = useMutation({
    mutationFn: async (input: {
      page_id: string;
      label: string | null;
      url: string | null;
      x: number;
      y: number;
      width: number;
      height: number;
    }) => {
      const { data, error } = await supabase
        .from("flipbook_hotlinks")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      // Also refresh page list to update hotlink counts
      qc.invalidateQueries({ queryKey: ["flipbook-pages"] });
    },
  });

  const updateHotlink = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      label?: string | null;
      url?: string | null;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }) => {
      const { error } = await supabase
        .from("flipbook_hotlinks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deleteHotlink = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("flipbook_hotlinks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["flipbook-pages"] });
    },
  });

  return { insertHotlink, updateHotlink, deleteHotlink };
}
