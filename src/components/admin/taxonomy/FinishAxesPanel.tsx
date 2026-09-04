import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/features/i18n/I18nProvider";
import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FINISH_AXES } from "@/features/admin/hooks/useFinishes";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";

/** Singular/plural item keys per axis, keyed by FINISH_AXES.key. */
const ITEM_KEYS: Record<(typeof FINISH_AXES)[number]["key"], [string, string]> = {
  process: ["admin.item.process", "admin.item.processes"],
  base_family: ["admin.item.baseFamily", "admin.item.baseFamilies"],
  surface: ["admin.item.surface", "admin.item.surfaces"],
  tone: ["admin.item.tone", "admin.item.tones"],
  effect: ["admin.item.effect", "admin.item.effects"],
  tint: ["admin.item.tint", "admin.item.tints"],
  coating: ["admin.item.coating", "admin.item.coatings"],
  pattern: ["admin.item.pattern", "admin.item.patterns"],
};

/**
 * One FlatCrudTable instance per axis, swapped via tabs — the 8 finish facet
 * tables are structurally identical (code/name×3/sort_order/is_active), so
 * FINISH_AXES is the single place that knows all 8 exist.
 */
export default function FinishAxesPanel() {
  const { t } = useI18n();
  const [active, setActive] = useState<string>(FINISH_AXES[0].table);
  const fields: FlatCrudField[] = useMemo(
    () => [
      { type: "code", key: "code", label: t("admin.tax.code"), required: true },
      { type: "nameGroup", key: "name", label: t("admin.tax.name"), required: true },
    ],
    [t],
  );

  return (
    <Tabs value={active} onValueChange={setActive}>
      <TabsList className="flex-wrap h-auto">
        {FINISH_AXES.map((axis) => (
          <TabsTrigger key={axis.table} value={axis.table}>
            {t(`admin.axis.${axis.key}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      {FINISH_AXES.map((axis) => (
        <TabsContent key={axis.table} value={axis.table} className="pt-4">
          <FlatCrudTable
            table={axis.table}
            itemLabel={t(ITEM_KEYS[axis.key][0])}
            itemLabelPlural={t(ITEM_KEYS[axis.key][1])}
            fields={fields}
            hasSortOrder
            checkUsageBeforeDelete={async (id) => {
              const { count, error } = await supabase
                .from("finishes")
                .select("id", { count: "exact", head: true })
                .eq(axis.fk, id);
              if (error) throw error;
              return count ?? 0;
            }}
            usageNoun={t("admin.item.finishes")}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
