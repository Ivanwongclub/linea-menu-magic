import type { Product } from '../types';
import type { AppLanguage } from '@/features/i18n/translations';
import { localizedName } from '@/features/admin/lib/localize';
import { resolveProductMaterials } from './productMaterial';

export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export interface SpecRow {
  /** Stable identifier, used as a React key and a test hook. */
  key: string;
  label: string;
  value: string;
}

/** Minimum order, e.g. "5,000 pcs". Null when no quantity is recorded. */
export function formatMoq(product: Product): string | null {
  if (product.moq_qty == null) return null;
  const qty = product.moq_qty.toLocaleString();
  return product.moq_unit ? `${qty} ${product.moq_unit}` : qty;
}

/** "15–20 days", or "15 days" when only one bound is recorded. */
export function formatLeadTime(product: Product, t: Translate): string | null {
  const min = product.lead_time_min_days;
  const max = product.lead_time_max_days;
  if (min == null && max == null) return null;
  if (min != null && max != null && max !== min) return t('product.spec.dayRange', { min, max });
  return t('product.spec.days', { count: (min ?? max) as number });
}

/**
 * The typed specification rows, in reading order, skipping anything with
 * no value. Most products return very few, which is honest: the columns
 * exist so WIN-CYC can fill them, not so the page can look full.
 *
 * `logo_customisable` is deliberately absent. It sits at its column
 * default of true on every product, so rendering it would put an identical
 * line on all of them and discriminate nothing (M5 ruling 4). It returns
 * when an editor sets it deliberately.
 */
export function buildSpecRows(product: Product, language: AppLanguage, t: Translate): SpecRow[] {
  const rows: SpecRow[] = [];
  const push = (key: string, labelKey: string, value: string | number | null | undefined) => {
    if (value === null || value === undefined || value === '') return;
    rows.push({ key, label: t(labelKey), value: String(value) });
  };

  const materials = resolveProductMaterials(product);
  push('material', 'product.spec.material', materials.map((m) => localizedName(m, language)).join(', ') || null);
  push('attachment', 'product.spec.attachment', product.attachment ? localizedName(product.attachment, language) : null);
  push('face_style', 'product.spec.faceStyle', product.face_style);
  push('hole_count', 'product.spec.holeCount', product.hole_count);
  push('tensile_strength', 'product.spec.tensileStrength', product.tensile_strength);
  push('wash_resistance', 'product.spec.washResistance', product.wash_resistance);
  push('origin', 'product.spec.origin', product.origin);
  push(
    'sample_time',
    'product.spec.sampleTime',
    product.sample_time_days != null ? t('product.spec.days', { count: product.sample_time_days }) : null,
  );
  if (product.nickel_release_compliant != null) {
    push(
      'nickel_release',
      'product.spec.nickelRelease',
      t(product.nickel_release_compliant ? 'product.spec.compliant' : 'product.spec.nonCompliant'),
    );
  }
  return rows;
}
