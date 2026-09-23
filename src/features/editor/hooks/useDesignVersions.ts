import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { normalizeRecipe, type DraftRecipe } from "../lib/recipe";
import type { VersionSnapshot } from "../lib/versionSnapshot";

/** The list row: never the recipe or the snapshot, which are only read on reload. */
export interface DesignVersionRow {
  id: string;
  version_number: number;
  label: string | null;
  author_kind: "buyer" | "staff";
  created_at: string;
}

export interface DesignVersions {
  versions: DesignVersionRow[];
  /** `designs.current_version_id` — the last version saved, not the one being edited. */
  currentVersionId: string | null;
}

const versionsKey = (designId: string) => ["design-versions", designId];

async function fetchVersions(designId: string): Promise<DesignVersions> {
  const { data, error } = await supabase
    .from("design_versions")
    .select("id, version_number, label, author_kind, created_at")
    .eq("design_id", designId)
    .order("version_number", { ascending: false });
  if (error) throw new Error(error.message);

  const design = await supabase.from("designs").select("current_version_id").eq("id", designId).maybeSingle();
  if (design.error) throw new Error(design.error.message);

  return {
    versions: (data ?? []) as DesignVersionRow[],
    currentVersionId: (design.data?.current_version_id as string | null) ?? null,
  };
}

export function useDesignVersions(designId: string | null) {
  return useQuery({
    queryKey: versionsKey(designId ?? ""),
    queryFn: () => fetchVersions(designId as string),
    enabled: !!designId,
  });
}

/** Postgres unique violation — two saves racing for the same `version_number`. */
const UNIQUE_VIOLATION = "23505";
const MAX_ATTEMPTS = 3;

/**
 * A named save (Phase 7): the recipe as it stands plus a snapshot of
 * everything it points at, inserted as the next `version_number` for this
 * design.
 *
 * `version_number` is read then written rather than defaulted in the database,
 * so two clients saving at once can collide on `unique (design_id,
 * version_number)`. That collision is the correct answer — the loser re-reads
 * and takes the next number instead of overwriting a version it never saw.
 * A trigger would need a migration; this needs none, and the table is
 * insert-only anyway (Phase 1 grants no update or delete).
 */
export function useSaveVersion(designId: string | null, userId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      label,
      recipe,
      snapshot,
      authorKind = "buyer",
    }: {
      label: string;
      recipe: DraftRecipe;
      snapshot: VersionSnapshot;
      authorKind?: "buyer" | "staff";
    }): Promise<DesignVersionRow> => {
      if (!designId || !userId) throw new Error("A version needs a saved design and a signed-in author.");

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const last = await supabase
          .from("design_versions")
          .select("version_number")
          .eq("design_id", designId)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (last.error) throw new Error(last.error.message);

        const inserted = await supabase
          .from("design_versions")
          .insert({
            design_id: designId,
            version_number: (last.data?.version_number ?? 0) + 1,
            // An empty box is no name at all: the list then shows "Version n".
            label: label.trim() || null,
            recipe: recipe as unknown as Json,
            snapshot: snapshot as unknown as Json,
            author_kind: authorKind,
            created_by: userId,
          })
          .select("id, version_number, label, author_kind, created_at")
          .single();

        if (inserted.error) {
          if (inserted.error.code === UNIQUE_VIOLATION && attempt < MAX_ATTEMPTS - 1) continue;
          throw new Error(inserted.error.message);
        }

        // The design points at its newest version. A failure here leaves the
        // version saved and the pointer stale, which is the harmless way round.
        await supabase.from("designs").update({ current_version_id: inserted.data.id }).eq("id", designId);
        return inserted.data as DesignVersionRow;
      }
      throw new Error("Could not take a version number.");
    },
    onSuccess: () => {
      if (designId) queryClient.invalidateQueries({ queryKey: versionsKey(designId) });
    },
  });
}

/**
 * Reload: the version's stored recipe, read forward by `normalizeRecipe` like
 * any other stored recipe. The snapshot is not read here — it is what the
 * version *was*, and reloading puts the buyer back in the live editor.
 */
export async function fetchVersionRecipe(versionId: string): Promise<DraftRecipe> {
  const { data, error } = await supabase.from("design_versions").select("recipe").eq("id", versionId).single();
  if (error) throw new Error(error.message);
  return normalizeRecipe(data.recipe);
}
