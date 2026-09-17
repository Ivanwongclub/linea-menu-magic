import { Input } from "@/components/ui/input";
import { useI18n } from "@/features/i18n/I18nProvider";
import { FinishFacetRail } from "@/components/admin/finish/FinishFacetRail";
import { FinishSwatchGrid } from "@/components/admin/finish/FinishSwatchGrid";
import { useFinishFilter } from "@/features/admin/hooks/useFinishFilter";
import { useFinishAxes } from "@/features/admin/hooks/useFinishes";
import type { PickerFinish } from "@/features/editor/hooks/useFinishOptions";

interface FinishSelectionPickerProps {
  finishes: PickerFinish[];
  selectedId: string | null;
  onSelect: (finish: PickerFinish) => void;
}

/**
 * Selection-mode finish picker: the same rail/grid/facet-search the CMS's
 * `FinishPicker` uses, but non-mutating — clicking a swatch calls
 * `onSelect`, nothing writes to `product_finishes` (R4). Progressive
 * disclosure: lives behind "Change finish" in a side sheet, never all
 * finishes inline in the panel.
 */
export function FinishSelectionPicker({ finishes, selectedId, onSelect }: FinishSelectionPickerProps) {
  const { t } = useI18n();
  const { data: axes } = useFinishAxes();
  const { search, setSearch, selected, toggleFacet, clearFacets, visible, countFor } = useFinishFilter(finishes);

  return (
    <div className="flex flex-col sm:flex-row gap-4 h-full min-h-0">
      {axes && <FinishFacetRail axes={axes} selected={selected} onToggle={toggleFacet} onClear={clearFacets} countFor={countFor} />}
      <div className="flex-1 min-h-0 flex flex-col gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("editor.finish.searchPlaceholder")}
          className="rounded-none"
        />
        <div className="flex-1 overflow-y-auto">
          <FinishSwatchGrid
            finishes={visible}
            attachedIds={new Set(selectedId ? [selectedId] : [])}
            onToggle={(f) => onSelect(f as PickerFinish)}
          />
        </div>
      </div>
    </div>
  );
}
