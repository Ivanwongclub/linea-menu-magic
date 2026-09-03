import { FlatCrudTable } from "@/components/admin/shared/FlatCrudTable";
import type { FlatCrudField } from "@/components/admin/shared/flatCrudFields";

const FIELDS: FlatCrudField[] = [
  {
    type: "text",
    key: "slug",
    label: "Slug",
    required: true,
    lockAfterCreate: true,
    helperText: "Used in URLs and category groupings elsewhere in the site — set once, not editable after creation.",
  },
  { type: "nameGroup", key: "name", label: "Name", required: true },
  { type: "text", key: "tagline", label: "Tagline" },
  {
    type: "select",
    key: "segment",
    label: "Segment",
    required: true,
    // Fixed 3-value CHECK constraint on the column, not a lookup table —
    // hardcoding this (unlike the finish axis facets) mirrors the schema itself.
    options: [
      { value: "apparel", label: "Apparel" },
      { value: "beauty", label: "Beauty" },
      { value: "material", label: "Material" },
    ],
  },
];

export default function FamiliesPanel() {
  return <FlatCrudTable table="product_families" itemLabel="family" fields={FIELDS} hasSortOrder />;
}
