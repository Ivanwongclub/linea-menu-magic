import { useI18n } from '@/features/i18n/I18nProvider';
import type { ProductSizeVariant } from '@/features/products/types';

interface Props {
  variants: ProductSizeVariant[];
  selected: ProductSizeVariant | null;
  onSelect: (id: string) => void;
}

/** Trims trailing zeros: 15.00 reads "15", 15.50 reads "15.5". */
const mm = (n: number) => String(Number(n.toFixed(2)));

/** The canonical measurement, which every variant carries. */
export function millimetres(v: ProductSizeVariant): string {
  return v.size_secondary_mm != null
    ? `${mm(v.size_primary_mm)} × ${mm(v.size_secondary_mm)} mm`
    : `${mm(v.size_primary_mm)} mm`;
}

/** Non-round hardware carries its own label; everything else reads in millimetres. */
export function variantLabel(v: ProductSizeVariant): string {
  return v.size_label?.trim() || millimetres(v);
}

/**
 * Ligne alongside the millimetres, and the millimetres alongside a label,
 * so a measurement is never hidden by a name.
 *
 * `size_ligne` is a generated column, so every row has one even when the
 * unit is meaningless: a ligne measures a button, not a D-ring. A row
 * carrying its own label is non-round hardware by definition, so the ligne
 * is suppressed there rather than printed as false precision.
 */
export function variantCaption(v: ProductSizeVariant): string {
  const label = v.size_label?.trim();
  if (label) return millimetres(v);
  return v.size_ligne != null ? `${mm(v.size_ligne)}L` : '';
}

/**
 * Size control for the detail page. Weight and thickness belong to a size,
 * never to a product, so they are shown here and move with the selection.
 * A product with no variants renders nothing at all.
 */
export default function SizeSelector({ variants, selected, onSelect }: Props) {
  const { t } = useI18n();
  if (variants.length === 0) return null;

  const active = selected ?? variants[0];
  const details = [
    active.weight_g != null ? { key: 'weight', label: t('product.size.weight'), value: `${mm(active.weight_g)} g` } : null,
    active.thickness_mm != null ? { key: 'thickness', label: t('product.size.thickness'), value: `${mm(active.thickness_mm)} mm` } : null,
  ].filter((d): d is { key: string; label: string; value: string } => d !== null);

  return (
    <div data-testid="size-selector" className="mb-5 pb-4 border-b border-border/50">
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2">{t('product.size.title')}</p>

      <div className="flex flex-wrap gap-2">
        {variants.map((v) => {
          const isActive = v.id === active.id;
          const caption = variantCaption(v);
          return (
            <button
              key={v.id}
              type="button"
              data-testid="size-option"
              data-size-id={v.id}
              data-selected={isActive}
              aria-pressed={isActive}
              onClick={() => onSelect(v.id)}
              className={`px-3 py-1.5 border text-left transition-colors duration-200 ${
                isActive
                  ? 'border-foreground bg-foreground text-background'
                  : 'border-border text-foreground hover:border-foreground'
              }`}
            >
              <span className="block text-[13px] font-medium leading-tight">{variantLabel(v)}</span>
              {caption && (
                <span className={`block text-[10px] leading-tight mt-0.5 ${isActive ? 'text-background/70' : 'text-muted-foreground'}`}>
                  {caption}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {details.length > 0 && (
        <div data-testid="size-details" className="flex flex-wrap gap-x-6 gap-y-1 mt-3">
          {details.map((d) => (
            <span key={d.key} data-testid={`size-${d.key}`} className="text-[11px] text-muted-foreground">
              <span className="uppercase tracking-[0.08em]">{d.label}</span>{' '}
              <span className="text-foreground font-medium">{d.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
