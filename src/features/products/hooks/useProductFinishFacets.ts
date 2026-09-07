import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FINISH_AXES,
  emptySelection,
  useFinishAxes,
  useFinishes,
  type AxisValues,
  type FacetSelection,
  type FinishAxisKey,
} from "@/features/admin/hooks/useFinishes";
import { useFinishFilter } from "@/features/admin/hooks/useFinishFilter";
import { localizedName } from "@/features/admin/lib/localize";
import type { AppLanguage } from "@/features/i18n/translations";
import { useCatalogueTaxonomy } from "./useCatalogueTaxonomy";
import { NO_MATCH, resolveCategoryScope } from "./useProducts";
import type { ProductFilters } from "../types";

/** A uuid that no row carries: forces "no products" through an `in (…)` on a uuid column. */
const NO_FINISH = "00000000-0000-0000-0000-000000000000";

/** Selected axis values in the URL, by axis key → value CODES (readable, stable). */
export type FinishFacetCodes = Partial<Record<FinishAxisKey, string[]>>;

interface VisibleProduct {
  id: string;
  is_metal: boolean;
}

/**
 * Finish facets on the public listing (M4 Step 4). Reuses the CMS picker's
 * `useFinishFilter` (OR within an axis, AND across axes) over the finishes
 * actually attached to visible products in the current category scope. A
 * product matches if ANY of its attached finishes matches. The rail is only
 * offered while the scope contains metal products — the axes mean nothing
 * on lace — or while a selection is active and needs clearing.
 */
export function useProductFinishFacets(
  filters: Pick<ProductFilters, "family" | "categories" | "segments" | "finishes">,
  setFilters: (updates: Partial<ProductFilters>) => void,
  language: AppLanguage,
) {
  const taxonomy = useCatalogueTaxonomy();
  const finishesQuery = useFinishes();
  const axesQuery = useFinishAxes();

  // Visible products with their material's metal flag (RLS + explicit filters).
  const productsQuery = useQuery({
    queryKey: ["public-products-metal"],
    staleTime: 60 * 1000,
    queryFn: async (): Promise<VisibleProduct[]> => {
      const { data, error } = await supabase
        .from("products")
        // products → product_materials exists twice (material_id and the legacy map); pin the direct one
        .select("id, product_materials!material_id(is_metal)")
        .eq("status", "active")
        .eq("is_public", true);
      if (error) throw error;
      return (data ?? []).map((row) => ({
        id: row.id,
        is_metal: (row.product_materials as { is_metal: boolean } | null)?.is_metal === true,
      }));
    },
  });
  // Category membership by slug, and attached finishes, for those products.
  const membershipQuery = useQuery({
    queryKey: ["public-category-membership"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_category_map").select("product_id, product_categories!inner(slug)");
      if (error) throw error;
      return (data ?? []).map((r) => ({ product_id: r.product_id, slug: (r.product_categories as { slug: string }).slug }));
    },
  });
  const attachmentsQuery = useQuery({
    queryKey: ["public-product-finishes"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_finishes").select("product_id, finish_id");
      if (error) throw error;
      return data ?? [];
    },
  });

  const loading =
    taxonomy.loading || finishesQuery.isLoading || axesQuery.isLoading || productsQuery.isLoading || membershipQuery.isLoading || attachmentsQuery.isLoading;

  /* ---- scope: visible products in the current category selection ---- */
  const scope = useMemo(() => {
    const visible = new Map((productsQuery.data ?? []).map((p) => [p.id, p]));
    const resolved = taxonomy.loading
      ? undefined
      : resolveCategoryScope(filters, taxonomy.categorySlugsForFamily, taxonomy.categorySlugsForSegment);
    if (resolved === undefined) return [...visible.values()];
    if (resolved[0] === NO_MATCH) return [];
    const wanted = new Set(resolved);
    const ids = new Set((membershipQuery.data ?? []).filter((m) => wanted.has(m.slug)).map((m) => m.product_id));
    return [...ids].map((id) => visible.get(id)).filter((p): p is VisibleProduct => !!p);
  }, [productsQuery.data, membershipQuery.data, taxonomy, filters]);

  const hasMetal = scope.some((p) => p.is_metal);

  const attachedByFinish = useMemo(() => {
    const inScope = new Set(scope.map((p) => p.id));
    const byFinish = new Map<string, Set<string>>();
    for (const a of attachmentsQuery.data ?? []) {
      if (!inScope.has(a.product_id)) continue;
      if (!byFinish.has(a.finish_id)) byFinish.set(a.finish_id, new Set());
      byFinish.get(a.finish_id)!.add(a.product_id);
    }
    return byFinish;
  }, [scope, attachmentsQuery.data]);

  const finishesInScope = useMemo(
    () => (finishesQuery.data ?? []).filter((f) => attachedByFinish.has(f.id)),
    [finishesQuery.data, attachedByFinish],
  );

  /* ---- axis values: only those carried by a finish in scope ---- */
  const axes = useMemo<AxisValues>(() => {
    const all = axesQuery.data;
    const out = Object.fromEntries(FINISH_AXES.map((a) => [a.key, []])) as AxisValues;
    if (!all) return out;
    for (const axis of FINISH_AXES) {
      const used = new Set(finishesInScope.map((f) => f[axis.fk]).filter(Boolean));
      out[axis.key] = (all[axis.key] ?? []).filter((v) => used.has(v.id));
    }
    return out;
  }, [axesQuery.data, finishesInScope]);

  /* ---- URL codes ↔ value ids ---- */
  const codeToId = useCallback(
    (axis: FinishAxisKey, code: string) => axesQuery.data?.[axis]?.find((v) => v.code === code)?.id,
    [axesQuery.data],
  );
  const idToCode = useCallback(
    (axis: FinishAxisKey, id: string) => axesQuery.data?.[axis]?.find((v) => v.id === id)?.code,
    [axesQuery.data],
  );
  const selected = useMemo<FacetSelection>(() => {
    const sel = emptySelection();
    for (const axis of FINISH_AXES) {
      sel[axis.key] = (filters.finishes?.[axis.key] ?? []).map((code) => codeToId(axis.key, code)).filter((id): id is string => !!id);
    }
    return sel;
  }, [filters.finishes, codeToId]);

  const onChange = useCallback(
    (next: FacetSelection) => {
      const codes: FinishFacetCodes = {};
      for (const axis of FINISH_AXES) {
        const list = next[axis.key].map((id) => idToCode(axis.key, id)).filter((c): c is string => !!c);
        if (list.length) codes[axis.key] = list;
      }
      setFilters({ finishes: Object.keys(codes).length ? codes : undefined });
    },
    [idToCode, setFilters],
  );

  const filter = useFinishFilter(finishesInScope, { selected, onChange });
  const anySelected = FINISH_AXES.some((a) => selected[a.key].length > 0);

  /* ---- products that carry a matching finish ---- */
  const finishIds = useMemo<string[] | undefined>(() => {
    if (!anySelected) return undefined;
    const ids = filter.visible.map((f) => f.id);
    return ids.length ? ids : [NO_FINISH];
  }, [anySelected, filter.visible]);

  const labelFor = useCallback(
    (axis: FinishAxisKey, code: string) => {
      const v = axesQuery.data?.[axis]?.find((x) => x.code === code);
      return v ? localizedName(v, language) : code;
    },
    [axesQuery.data, language],
  );
  const toggleByCode = useCallback(
    (axis: FinishAxisKey, code: string) => {
      const id = codeToId(axis, code);
      if (id) filter.toggleFacet(axis, id);
    },
    [codeToId, filter],
  );

  return {
    loading,
    showRail: !loading && (hasMetal || anySelected),
    hasMetal,
    axes,
    selected,
    anySelected,
    toggle: filter.toggleFacet,
    toggleByCode,
    clear: filter.clearFacets,
    countFor: filter.countFor,
    /** Hand to useProducts: undefined = no finish filter; a list = products with any of these finishes. */
    finishIds,
    labelFor,
  };
}

export type ProductFinishFacets = ReturnType<typeof useProductFinishFacets>;
