import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Brochure, BrochureStatus } from "../types";

interface UseBrochuresOptions {
  /** When true, fetches all statuses (for admin). Default: false (public, published only). */
  allStatuses?: boolean;
}

export function useBrochures({ allStatuses = false }: UseBrochuresOptions = {}) {
  return useQuery<Brochure[]>({
    queryKey: ["flipbook-brochures", { allStatuses }],
    queryFn: async () => {
      let query = supabase
        .from("flipbook_brochures")
        .select("*")
        .order("created_at", { ascending: false });

      if (!allStatuses) {
        query = query.eq("status", "published");
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data ?? []).map((row) => ({
        ...row,
        status: row.status as BrochureStatus,
      }));
    },
  });
}
