import { useCallback, useMemo, useState } from "react";
import {
  FINISH_AXES,
  emptySelection,
  type FacetSelection,
  type FinishAxisKey,
  type FinishRow,
} from "@/features/admin/hooks/useFinishes";

/**
 * Faceted search over the finish chart — one implementation shared by the
 * product editor's picker and the finish manager. Within an axis: OR.
 * Across axes: AND. Search covers cyc_code, factory_name_en, marketing_name.
 */
export function useFinishFilter(finishes: FinishRow[]) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<FacetSelection>(emptySelection);

  const term = search.trim().toLowerCase();
  const matchesSearch = useCallback(
    (f: FinishRow) =>
      !term ||
      (f.cyc_code ?? "").toLowerCase().includes(term) ||
      f.factory_name_en.toLowerCase().includes(term) ||
      f.marketing_name.toLowerCase().includes(term),
    [term],
  );

  const matchesAxes = useCallback(
    (f: FinishRow, except?: FinishAxisKey) =>
      FINISH_AXES.every((axis) => {
        if (axis.key === except) return true;
        const chosen = selected[axis.key];
        return chosen.length === 0 || chosen.includes(f[axis.fk] ?? "");
      }),
    [selected],
  );

  const visible = useMemo(
    () => finishes.filter((f) => matchesSearch(f) && matchesAxes(f)),
    [finishes, matchesSearch, matchesAxes],
  );

  // Counts narrow with the other axes and the search, ignoring the axis
  // being counted (so multi-select within an axis stays discoverable).
  const countFor = useCallback(
    (axis: FinishAxisKey, valueId: string) => {
      const fk = FINISH_AXES.find((a) => a.key === axis)!.fk;
      return finishes.filter((f) => f[fk] === valueId && matchesSearch(f) && matchesAxes(f, axis)).length;
    },
    [finishes, matchesSearch, matchesAxes],
  );

  const toggleFacet = useCallback(
    (axis: FinishAxisKey, id: string) =>
      setSelected((prev) => ({
        ...prev,
        [axis]: prev[axis].includes(id) ? prev[axis].filter((x) => x !== id) : [...prev[axis], id],
      })),
    [],
  );
  const clearFacets = useCallback(() => setSelected(emptySelection()), []);

  return { search, setSearch, selected, toggleFacet, clearFacets, visible, countFor };
}
