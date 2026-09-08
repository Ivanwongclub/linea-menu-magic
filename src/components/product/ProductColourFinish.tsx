import { useState } from 'react';
import { FinishSwatch } from '@/features/finishes/FinishSwatch';
import { useI18n } from '@/features/i18n/I18nProvider';
import { localizedFinishName, localizedName } from '@/features/admin/lib/localize';
import { isMetalProduct } from '@/features/products/utils/productMaterial';
import type { Product } from '@/features/products/types';

/**
 * Colour or finish, branching on the product's material exactly as the CMS
 * and the database triggers do: a product may carry finishes only when its
 * typed material is flagged metal.
 *
 * Metal products show their attached public finishes as rendered swatches.
 * Non-metal products show their colour list. A product that is neither, or
 * that has nothing attached, renders nothing at all: no empty section and
 * no placeholder.
 *
 * Selecting a finish changes the named finish and its code. It never swaps
 * the hero image, because per-finish photography does not exist.
 */
export default function ProductColourFinish({ product }: { product: Product }) {
  const { t, language } = useI18n();
  const [finishId, setFinishId] = useState<string | null>(null);

  const finishes = product.finishes ?? [];
  const colours = product.colours ?? [];
  const indicative = <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">{t('product.swatch.indicative')}</p>;

  if (isMetalProduct(product)) {
    if (finishes.length === 0) return null;
    const selected = finishes.find((f) => f.id === finishId) ?? finishes.find((f) => f.is_default) ?? finishes[0];
    const selectedName = localizedFinishName(selected, language);

    return (
      <div data-testid="finish-section" className="mb-5 pb-4 border-b border-border/50">
        <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2">{t('product.finish.title')}</p>

        <div className="flex flex-wrap gap-2">
          {finishes.map((f) => {
            const isActive = f.id === selected.id;
            const name = localizedFinishName(f, language);
            return (
              <button
                key={f.id}
                type="button"
                data-testid="finish-swatch"
                data-finish-id={f.id}
                data-selected={isActive}
                aria-pressed={isActive}
                aria-label={name}
                title={f.cyc_code ? `${name} · ${f.cyc_code}` : name}
                onClick={() => setFinishId(f.id)}
                className={`h-11 w-11 p-0.5 border transition-colors duration-200 ${
                  isActive ? 'border-foreground' : 'border-border hover:border-foreground/50'
                }`}
              >
                <FinishSwatch finish={f} className="w-full h-full" title={name} />
              </button>
            );
          })}
        </div>

        <p data-testid="finish-selected" className="mt-2.5 flex items-baseline gap-2 flex-wrap">
          <span className="text-[13px] font-medium text-foreground">{selectedName}</span>
          {selected.cyc_code && (
            <span data-testid="finish-code" className="text-[11px] font-mono text-muted-foreground">
              {selected.cyc_code}
            </span>
          )}
        </p>
        {indicative}
      </div>
    );
  }

  if (colours.length === 0) return null;

  return (
    <div data-testid="colour-section" className="mb-5 pb-4 border-b border-border/50">
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2">{t('product.colour.title')}</p>

      <div className="flex flex-wrap gap-2">
        {colours.map((c) => (
          <span
            key={c.id}
            data-testid="colour-chip"
            data-colour-id={c.id}
            className="inline-flex items-center gap-2 border border-border px-2.5 py-1"
          >
            {c.hex && (
              <span
                data-testid="colour-dot"
                aria-hidden="true"
                className="h-3.5 w-3.5 border border-border/70 shrink-0"
                style={{ backgroundColor: c.hex }}
              />
            )}
            <span className="text-[13px] text-foreground">{localizedName(c, language)}</span>
            {c.hex && <span className="text-[10px] font-mono text-muted-foreground uppercase">{c.hex}</span>}
          </span>
        ))}
      </div>
      {indicative}
    </div>
  );
}
