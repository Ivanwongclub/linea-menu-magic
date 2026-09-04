import { useMemo } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import { Badge } from "@/components/ui/badge";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";
import type { TaxonomyRow } from "@/features/admin/hooks/useFlatCrudTable";

export default function MaterialsPanel() {
  const { t } = useI18n();
  const fields: FlatCrudField[] = useMemo(
    () => [
      { type: "nameGroup", key: "name", label: t("admin.tax.name"), required: true },
      { type: "text", key: "slug", label: t("admin.tax.slug"), helperText: t("admin.tax.slugHintMaterial") },
      { type: "switch", key: "is_metal", label: t("admin.tax.metal"), helperText: t("admin.tax.metalHint") },
      { type: "switch", key: "is_sustainable", label: t("admin.tax.sustainable"), helperText: t("admin.tax.sustainableHint") },
    ],
    [t],
  );

  return (
    <FlatCrudTable
      table="product_materials"
      itemLabel={t("admin.item.material")}
      itemLabelPlural={t("admin.item.materials")}
      fields={fields}
      extraColumnLabel={t("admin.tax.flags")}
      renderExtraCell={(row: TaxonomyRow<"product_materials">) => (
        <div className="flex items-center gap-1">
          {row.is_metal && <Badge className="text-[10px]">{t("admin.tax.metal")}</Badge>}
          {row.is_sustainable && (
            <Badge variant="outline" className="text-[10px]">
              {t("admin.tax.sustainable")}
            </Badge>
          )}
          {!row.is_metal && !row.is_sustainable && <span className="text-xs text-muted-foreground">—</span>}
        </div>
      )}
    />
  );
}
