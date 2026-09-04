import { useMemo } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";

export default function ComplianceStandardsPanel() {
  const { t } = useI18n();
  const fields: FlatCrudField[] = useMemo(
    () => [
      { type: "code", key: "code", label: t("admin.tax.code"), required: true },
      { type: "nameGroup", key: "name", label: t("admin.tax.name"), required: true },
    ],
    [t],
  );
  return (
    <FlatCrudTable
      table="compliance_standards"
      itemLabel={t("admin.item.standard")}
      itemLabelPlural={t("admin.item.standards")}
      fields={fields}
      hasSortOrder
    />
  );
}
