import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { BrochureWithPages, BrochureStatus, Page, HotLink } from "../types";

export function useBrochure(slug: string | undefined) {
  return useQuery<BrochureWithPages | null>({
    queryKey: ["flipbook-brochure", slug],
    enabled: !!slug,
    queryFn: async () => {
      if (!slug) return null;

      // 1. Fetch brochure by slug
      const { data: brochure, error: bErr } = await supabase
        .from("flipbook_brochures")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (bErr) throw bErr;
      if (!brochure) return null;

      // 2. Fetch pages ordered by page_number
      const { data: pagesRaw, error: pErr } = await supabase
        .from("flipbook_pages")
        .select("*")
        .eq("brochure_id", brochure.id)
        .order("page_number", { ascending: true });

      if (pErr) throw pErr;

      const pages: Page[] = pagesRaw ?? [];

      // 3. Fetch all hotlinks for these pages in one query
      if (pages.length > 0) {
        const pageIds = pages.map((p) => p.id);
        const { data: hotlinks, error: hErr } = await supabase
          .from("flipbook_hotlinks")
          .select("*")
          .in("page_id", pageIds);

        if (hErr) throw hErr;

        // Group hotlinks by page_id
        const hotlinkMap = new Map<string, HotLink[]>();
        (hotlinks ?? []).forEach((hl) => {
          const list = hotlinkMap.get(hl.page_id) ?? [];
          list.push(hl);
          hotlinkMap.set(hl.page_id, list);
        });

        pages.forEach((page) => {
          page.hotlinks = hotlinkMap.get(page.id) ?? [];
        });
      }

      return {
        ...brochure,
        status: brochure.status as BrochureStatus,
        pages,
      };
    },
  });
}
