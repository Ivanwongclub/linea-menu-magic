import { useMemo } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedName } from "@/features/admin/lib/localize";
import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import { useFlatCrudTable } from "@/features/admin/hooks/useFlatCrudTable";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";

export default function CategoriesPanel() {
  const { t, language } = useI18n();
  const { query: familiesQuery } = useFlatCrudTable("product_families", { orderBy: "sort_order" });
  const families = useMemo(() => familiesQuery.data ?? [], [familiesQuery.data]);

  const fields: FlatCrudField[] = useMemo(
    () => [
      {
        type: "text",
        key: "slug",
        label: t("admin.tax.slug"),
        required: true,
        lockAfterCreate: true,
        helperText: t("admin.tax.slugHintCategory"),
      },
      { type: "nameGroup", key: "name", label: t("admin.tax.name"), required: true },
      {
        type: "select",
        key: "family_id",
        label: t("admin.tax.family"),
        placeholder: t("admin.tax.noFamilyPlaceholder"),
        allowNone: true,
        noneLabel: t("admin.tax.noFamily"),
        options: families.map((f) => ({ value: f.id, label: localizedName(f, language) })),
      },
    ],
    [families, t, language],
  );

  const familyName = (id: string | null) => {
    const f = families.find((x) => x.id === id);
    return f ? localizedName(f, language) : "—";
  };

  return (
    <FlatCrudTable
      table="product_categories"
      itemLabel={t("admin.item.category")}
      itemLabelPlural={t("admin.item.categories")}
      fields={fields}
      hasSortOrder
      extraColumnLabel={t("admin.tax.family")}
      renderExtraCell={(row) => <span className="text-sm text-muted-foreground">{familyName(row.family_id)}</span>}
    />
  );
}
