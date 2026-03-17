import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Brochure, BrochureStatus } from "../types";

interface UseBrochuresOptions {
  /** When true, fetches all statuses (for admin). Default: false (public, published only). */
  allStatuses?: boolean;
}

export interface BrochureWithMeta extends Brochure {
  first_page_url: string | null;
  page_count: number;
}

export function useBrochures({ allStatuses = false }: UseBrochuresOptions = {}) {
  return useQuery<BrochureWithMeta[]>({
    queryKey: ["flipbook-brochures", { allStatuses }],
    queryFn: async () => {
      let query = supabase
        .from("flipbook_brochures")
        .select("*, flipbook_pages(image_url, page_number)")
        .order("created_at", { ascending: false });

      if (!allStatuses) {
        query = query.eq("status", "published");
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row: any) => {
        const pages = row.flipbook_pages ?? [];
        const sorted = [...pages].sort((a: any, b: any) => a.page_number - b.page_number);
        const { flipbook_pages, ...rest } = row;
        return {
          ...rest,
          status: row.status as BrochureStatus,
          first_page_url: sorted[0]?.image_url ?? null,
          page_count: pages.length,
        };
      });
    },
  });
}
