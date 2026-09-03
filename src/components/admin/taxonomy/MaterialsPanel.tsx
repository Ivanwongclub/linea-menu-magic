import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import { Badge } from "@/components/ui/badge";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";
import type { TaxonomyRow } from "@/features/admin/hooks/useFlatCrudTable";

const FIELDS: FlatCrudField[] = [
  { type: "nameGroup", key: "name", label: "Name", required: true },
  {
    type: "text",
    key: "slug",
    label: "Slug",
    helperText:
      "Used by the material filter on the public site. Not DB-locked like the code fields elsewhere, since existing materials still need this backfilled — but changing it after the fact silently breaks any link or bookmark filtered on the old value.",
  },
  {
    type: "switch",
    key: "is_metal",
    label: "Metal",
    helperText:
      "Controls whether finishes can be attached to a product using this material — the database only allows product_finishes rows (and a default finish) when the product's material is flagged metal here. Non-metal products get a plain colour list instead.",
  },
];

export default function MaterialsPanel() {
  return (
    <FlatCrudTable
      table="product_materials"
      itemLabel="material"
      fields={FIELDS}
      extraColumnLabel="Metal"
      renderExtraCell={(row: TaxonomyRow<"product_materials">) =>
        row.is_metal ? (
          <Badge className="text-[10px]">Metal</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      }
    />
  );
}
