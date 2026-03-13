import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Page } from "../types";

/** A page with just a hotlink count for the list view. */
export interface PageWithCount extends Omit<Page, "hotlinks"> {
  hotlink_count: number;
}

/** Fetch all pages (with hotlink counts) for a given brochure. */
export function usePages(brochureId: string | undefined) {
  return useQuery<PageWithCount[]>({
    queryKey: ["flipbook-pages", brochureId],
    enabled: !!brochureId,
    queryFn: async () => {
      if (!brochureId) return [];
      const { data, error } = await supabase
        .from("flipbook_pages")
        .select("*, flipbook_hotlinks(id)")
        .eq("brochure_id", brochureId)
        .order("page_number", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        brochure_id: row.brochure_id,
        page_number: row.page_number,
        image_url: row.image_url,
        hotlink_count: (row.flipbook_hotlinks ?? []).length,
      }));
    },
  });
}

export function usePageMutations(brochureId: string) {
  const qc = useQueryClient();
  const key = ["flipbook-pages", brochureId];

  const insertPage = useMutation({
    mutationFn: async (input: {
      brochure_id: string;
      image_url: string;
      page_number: number;
    }) => {
      const { data, error } = await supabase
        .from("flipbook_pages")
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const deletePage = useMutation({
    mutationFn: async (pageId: string) => {
      const { error } = await supabase
        .from("flipbook_pages")
        .delete()
        .eq("id", pageId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const reorderPages = useMutation({
    mutationFn: async (pages: { id: string; page_number: number }[]) => {
      // Batch update page numbers
      const promises = pages.map(({ id, page_number }) =>
        supabase
          .from("flipbook_pages")
          .update({ page_number })
          .eq("id", id)
      );
      const results = await Promise.all(promises);
      const err = results.find((r) => r.error);
      if (err?.error) throw err.error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { insertPage, deletePage, reorderPages };
}
