import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";

const FIELDS: FlatCrudField[] = [
  { type: "code", key: "code", label: "Code", required: true },
  { type: "nameGroup", key: "name", label: "Name", required: true },
];

export default function ComplianceStandardsPanel() {
  return (
    <FlatCrudTable table="compliance_standards" itemLabel="compliance standard" fields={FIELDS} hasSortOrder />
  );
}
