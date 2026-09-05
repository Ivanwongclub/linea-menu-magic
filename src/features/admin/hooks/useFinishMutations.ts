import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { resizeImage } from "@/features/images/resizeImage";
import { removeFromBucket, storagePathFromPublicUrl, uploadToBucket } from "@/features/images/storage";

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

  /**
   * Photographed swatch: resize in the browser, upload, point swatch_url at
   * it. A previous photo in our bucket is removed once the new one is live.
   */
  const uploadSwatch = useMutation({
    mutationFn: async ({ finishId, file, previousUrl }: { finishId: string; file: File; previousUrl: string | null }) => {
      const resized = await resizeImage(file);
      const path = `finishes/${finishId}/${Date.now()}.${resized.ext}`;
      const url = await uploadToBucket(path, resized.blob, resized.contentType);
      const { error } = await supabase.from("finishes").update({ swatch_url: url }).eq("id", finishId);
      if (error) throw error;
      const oldPath = previousUrl ? storagePathFromPublicUrl(previousUrl) : null;
      if (oldPath && oldPath !== path) await removeFromBucket(oldPath);
      return url;
    },
    onSuccess: invalidate,
  });

  const removeSwatch = useMutation({
    mutationFn: async ({ finishId, url }: { finishId: string; url: string }) => {
      // Object first, then the column — same ordering rule as product images.
      const path = storagePathFromPublicUrl(url);
      if (path) await removeFromBucket(path);
      const { error } = await supabase.from("finishes").update({ swatch_url: null }).eq("id", finishId);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { create, update, bulkSetPublic, uploadSwatch, removeSwatch };
}
