import { useI18n } from "@/features/i18n/I18nProvider";
import { localizedName } from "@/features/admin/lib/localize";
import { FinishPicker } from "@/components/admin/finish/FinishPicker";
import { ColourListEditor } from "@/components/admin/product-editor/ColourListEditor";
import type { AdminProductDetail } from "@/features/admin/hooks/useAdminProduct";
import type { TaxonomyRow } from "@/features/admin/hooks/useFlatCrudTable";

interface Props {
  product: AdminProductDetail;
  /** Material currently chosen in the form (may differ from what's saved). */
  formMaterialId: string | null;
  materials: TaxonomyRow<"product_materials">[];
}

/**
 * Branches on the product's SAVED material — the same thing the database
 * triggers check — not the unsaved dropdown value, so what the editor can
 * do here always matches what a write will be allowed to do.
 */
export function ColourFinishSection({ product, formMaterialId, materials }: Props) {
  const { t, language } = useI18n();
  const saved = materials.find((m) => m.id === product.material_id) ?? null;
  const differs = (formMaterialId ?? null) !== (product.material_id ?? null);

  if (!saved) {
    return (
      <p className="text-sm text-muted-foreground" data-testid="colour-finish-no-material">
        {t("admin.cf.noMaterial")}
      </p>
    );
  }
  const name = localizedName(saved, language);

  return (
    <div className="space-y-4">
      {differs && (
        <p className="text-xs text-muted-foreground border border-border px-3 py-2">{t("admin.cf.differs", { name })}</p>
      )}
      {saved.is_metal ? (
        <div data-testid="finish-section" className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("admin.cf.metal", { name })}</p>
          <FinishPicker productId={product.id} defaultFinishId={product.default_finish_id} />
        </div>
      ) : (
        <div data-testid="colour-section" className="space-y-2">
          <p className="text-xs text-muted-foreground">{t("admin.cf.nonMetal", { name })}</p>
          <ColourListEditor productId={product.id} />
        </div>
      )}
    </div>
  );
}
