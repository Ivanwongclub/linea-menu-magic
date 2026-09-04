import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type FinishRow = Database["public"]["Tables"]["finishes"]["Row"];

/**
 * The eight facet axes. Only the table→FK wiring lives here; every value
 * (HP, NICKEL, BRUSHED, …) is read from the tables at runtime so admins can
 * add new ones without a code change.
 */
export const FINISH_AXES = [
  { key: "process", table: "finish_processes", fk: "process_id", label: "Process" },
  { key: "base_family", table: "finish_base_families", fk: "base_family_id", label: "Base family" },
  { key: "surface", table: "finish_surfaces", fk: "surface_id", label: "Surface" },
  { key: "tone", table: "finish_tones", fk: "tone_id", label: "Tone" },
  { key: "effect", table: "finish_effects", fk: "effect_id", label: "Effect" },
  { key: "tint", table: "finish_tints", fk: "tint_id", label: "Tint" },
  { key: "coating", table: "finish_coatings", fk: "coating_id", label: "Coating" },
  { key: "pattern", table: "finish_patterns", fk: "pattern_id", label: "Pattern" },
] as const;

export type FinishAxis = (typeof FINISH_AXES)[number];
export type FinishAxisKey = FinishAxis["key"];

export interface AxisValue {
  id: string;
  code: string;
  name: string;
  name_zh_hant: string | null;
  name_zh_hans: string | null;
  sort_order: number;
  is_active: boolean;
}

export type AxisValues = Record<FinishAxisKey, AxisValue[]>;

/** Selected value ids per axis in the picker's filter rail. */
export type FacetSelection = Record<FinishAxisKey, string[]>;

export const emptySelection = (): FacetSelection =>
  Object.fromEntries(FINISH_AXES.map((a) => [a.key, []])) as FacetSelection;

/** All finishes. The read policy lets catalogue editors see every row, is_public or not. */
export function useFinishes() {
  return useQuery({
    queryKey: ["admin-finishes"],
    queryFn: async (): Promise<FinishRow[]> => {
      const { data, error } = await supabase.from("finishes").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useFinishAxes() {
  return useQuery({
    queryKey: ["admin-finish-axes"],
    queryFn: async (): Promise<AxisValues> => {
      const entries = await Promise.all(
        FINISH_AXES.map(async (axis) => {
          const { data, error } = await supabase
            .from(axis.table)
            .select("id, code, name, name_zh_hant, name_zh_hans, sort_order, is_active")
            .order("sort_order", { ascending: true });
          if (error) throw error;
          return [axis.key, (data ?? []) as unknown as AxisValue[]] as const;
        }),
      );
      return Object.fromEntries(entries) as AxisValues;
    },
  });
}

export const finishDisplayName = (f: FinishRow) => f.marketing_name || f.factory_name_en;

/** hex_approx until swatch_url exists; neutral grey when neither is set. */
export const finishSwatchStyle = (f: FinishRow) =>
  f.swatch_url
    ? { backgroundImage: `url(${f.swatch_url})`, backgroundSize: "cover" }
    : { backgroundColor: f.hex_approx ?? "#d4d4d4" };
