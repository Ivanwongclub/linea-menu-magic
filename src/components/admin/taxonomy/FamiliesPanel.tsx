import { useMemo } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";

export default function FamiliesPanel() {
  const { t } = useI18n();
  const fields: FlatCrudField[] = useMemo(
    () => [
      {
        type: "text",
        key: "slug",
        label: t("admin.tax.slug"),
        required: true,
        lockAfterCreate: true,
        helperText: t("admin.tax.slugHintFamily"),
      },
      { type: "nameGroup", key: "name", label: t("admin.tax.name"), required: true },
      { type: "text", key: "tagline", label: t("admin.tax.tagline") },
      {
        type: "select",
        key: "segment",
        label: t("admin.tax.segment"),
        required: true,
        // Fixed 3-value CHECK constraint on the column, not a lookup table —
        // hardcoding this (unlike the finish axis facets) mirrors the schema itself.
        options: [
          { value: "apparel", label: t("admin.segment.apparel") },
          { value: "beauty", label: t("admin.segment.beauty") },
          { value: "material", label: t("admin.segment.material") },
        ],
      },
    ],
    [t],
  );

  return (
    <FlatCrudTable
      table="product_families"
      itemLabel={t("admin.item.family")}
      itemLabelPlural={t("admin.item.families")}
      fields={fields}
      hasSortOrder
    />
  );
}
