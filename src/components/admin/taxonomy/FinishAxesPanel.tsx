import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";
import type { TaxonomyTableName } from "@/features/admin/hooks/useFlatCrudTable";

const FIELDS: FlatCrudField[] = [
  { type: "code", key: "code", label: "Code", required: true },
  { type: "nameGroup", key: "name", label: "Name", required: true },
];

interface AxisConfig {
  table: TaxonomyTableName;
  label: string;
  /** The FK column on `finishes` this axis is referenced by. */
  fkColumn: string;
}

const AXES: AxisConfig[] = [
  { table: "finish_processes", label: "Process", fkColumn: "process_id" },
  { table: "finish_base_families", label: "Base Family", fkColumn: "base_family_id" },
  { table: "finish_surfaces", label: "Surface", fkColumn: "surface_id" },
  { table: "finish_tones", label: "Tone", fkColumn: "tone_id" },
  { table: "finish_effects", label: "Effect", fkColumn: "effect_id" },
  { table: "finish_tints", label: "Tint", fkColumn: "tint_id" },
  { table: "finish_coatings", label: "Coating", fkColumn: "coating_id" },
  { table: "finish_patterns", label: "Pattern", fkColumn: "pattern_id" },
];

/**
 * One FlatCrudTable instance per axis, swapped via tabs — the 8 finish facet
 * tables are structurally identical (code/name×3/sort_order/is_active), so
 * this is the only place that needs to know all 8 exist.
 */
export default function FinishAxesPanel() {
  const [active, setActive] = useState<string>(AXES[0].table);

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList className="flex-wrap h-auto">
        {AXES.map((axis) => (
          <TabsTrigger key={axis.table} value={axis.table}>
            {axis.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {AXES.map((axis) => (
        <TabsContent key={axis.table} value={axis.table} className="pt-4">
          <FlatCrudTable
            table={axis.table}
            itemLabel={axis.label.toLowerCase()}
            fields={FIELDS}
            hasSortOrder
            checkUsageBeforeDelete={async (id) => {
              const { count, error } = await supabase
                .from("finishes")
                .select("id", { count: "exact", head: true })
                .eq(axis.fkColumn, id);
              if (error) throw error;
              return count ?? 0;
            }}
            usageNounPlural="finishes"
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
