import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { FinishRow } from "@/features/admin/hooks/useFinishes";

export interface AxisName {
  name: string;
  name_zh_hant: string | null;
  name_zh_hans: string | null;
  code?: string;
}

/**
 * A `finishes` row plus each axis's name columns nested under the same keys
 * `useFinishFilter`'s `FINISH_AXES` reads by (`f[axis.fk]`, unaffected —
 * those stay as the plain `*_id` scalar columns `select *` returns
 * alongside these aliases). Satisfies `FinishRow` structurally, so it can
 * feed `useFinishFilter`/`FinishFacetRail`/`FinishSwatchGrid` unchanged.
 */
/** The process axis also carries WIN-CYC's manufacturing tolerances (Phase 1 R3; Phase 5 R3). */
export interface ProcessAxis extends AxisName {
  min_feature_mm: number | null;
  min_deboss_depth_mm: number | null;
  max_deboss_depth_mm: number | null;
}

export type PickerFinish = FinishRow & {
  process: ProcessAxis | null;
  base_family: AxisName | null;
  surface: AxisName | null;
  tone: AxisName | null;
  effect: AxisName | null;
  tint: AxisName | null;
  coating: AxisName | null;
  pattern: AxisName | null;
};

const AXIS_NAME_COLS = "name, name_zh_hant, name_zh_hans";

const FINISH_OPTION_SELECT = `
  *,
  process:finish_processes!process_id ( ${AXIS_NAME_COLS}, code, min_feature_mm, min_deboss_depth_mm, max_deboss_depth_mm ),
  base_family:finish_base_families!base_family_id ( ${AXIS_NAME_COLS}, code ),
  surface:finish_surfaces!surface_id ( ${AXIS_NAME_COLS}, code ),
  tone:finish_tones!tone_id ( ${AXIS_NAME_COLS}, code ),
  effect:finish_effects!effect_id ( ${AXIS_NAME_COLS} ),
  tint:finish_tints!tint_id ( ${AXIS_NAME_COLS} ),
  coating:finish_coatings!coating_id ( ${AXIS_NAME_COLS} ),
  pattern:finish_patterns!pattern_id ( ${AXIS_NAME_COLS} )
`;

/**
 * R4: source list is the product's attached *public* finishes; if none are
 * attached, every public finish (there is no "metal" flag on `finishes`
 * itself — every row in this table is a plating/paint finish for metal
 * hardware, so "public metal finishes" and "public finishes" are the same
 * set, per axis-design §7's "only public finishes are offered" ruling).
 */
async function fetchFinishOptions(productId: string): Promise<PickerFinish[]> {
  const attached = await supabase
    .from("product_finishes")
    .select(`sort_order, finishes!inner ( ${FINISH_OPTION_SELECT} )`)
    .eq("product_id", productId)
    .eq("finishes.is_public", true)
    .order("sort_order", { ascending: true });
  if (attached.error) throw new Error(attached.error.message);

  const attachedFinishes = (attached.data ?? [])
    .map((row) => row.finishes as unknown as PickerFinish | null)
    .filter((f): f is PickerFinish => !!f);
  if (attachedFinishes.length > 0) return attachedFinishes;

  const fallback = await supabase
    .from("finishes")
    .select(FINISH_OPTION_SELECT)
    .eq("is_public", true)
    .order("sort_order", { ascending: true });
  if (fallback.error) throw new Error(fallback.error.message);
  return (fallback.data ?? []) as unknown as PickerFinish[];
}

export function useFinishOptions(productId: string | null, isMetal: boolean) {
  return useQuery({
    queryKey: ["editor-finish-options", productId],
    queryFn: () => fetchFinishOptions(productId as string),
    enabled: !!productId && isMetal,
  });
}
