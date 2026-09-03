import { useMemo } from "react";
import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import { useFlatCrudTable } from "@/features/admin/hooks/useFlatCrudTable";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";

export default function CategoriesPanel() {
  const { query: familiesQuery } = useFlatCrudTable("product_families", { orderBy: "sort_order" });
  const families = useMemo(() => familiesQuery.data ?? [], [familiesQuery.data]);

  const fields: FlatCrudField[] = useMemo(
    () => [
      {
        type: "text",
        key: "slug",
        label: "Slug",
        required: true,
        lockAfterCreate: true,
        helperText: "Used in category filters elsewhere in the site — set once, not editable after creation.",
      },
      { type: "nameGroup", key: "name", label: "Name", required: true },
      {
        type: "select",
        key: "family_id",
        label: "Family",
        placeholder: "No family",
        allowNone: true,
        noneLabel: "— No family —",
        options: families.map((f) => ({ value: f.id, label: f.name })),
      },
    ],
    [families],
  );

  const familyName = (id: string | null) => families.find((f) => f.id === id)?.name ?? "—";

  return (
    <FlatCrudTable
      table="product_categories"
      itemLabel="category"
      fields={fields}
      hasSortOrder
      extraColumnLabel="Family"
      renderExtraCell={(row) => (
        <span className="text-sm text-muted-foreground">{familyName(row.family_id)}</span>
      )}
    />
  );
}
