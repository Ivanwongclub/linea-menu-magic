import type { AppLanguage } from "@/features/i18n/translations";

interface Trilingual {
  name: string;
  name_zh_hant?: string | null;
  name_zh_hans?: string | null;
}

/**
 * Display name for a taxonomy row in the current UI language, falling back
 * through the other Chinese script and then English — so a row that only
 * has Traditional filled in still reads in Simplified mode.
 */
export function localizedName(row: Trilingual, language: AppLanguage): string {
  if (language === "zh-Hant") return row.name_zh_hant || row.name_zh_hans || row.name;
  if (language === "zh-Hans") return row.name_zh_hans || row.name_zh_hant || row.name;
  return row.name;
}

interface TrilingualText {
  description?: string | null;
  description_zh_hant?: string | null;
  description_zh_hans?: string | null;
}

/**
 * Body text in the current UI language, with the same fallback chain as
 * `localizedName`. Returns undefined when nothing is written, so callers
 * can omit the block rather than render an empty paragraph.
 */
export function localizedDescription(row: TrilingualText, language: AppLanguage): string | undefined {
  const en = row.description || undefined;
  if (language === "zh-Hant") return row.description_zh_hant || row.description_zh_hans || en;
  if (language === "zh-Hans") return row.description_zh_hans || row.description_zh_hant || en;
  return en;
}

interface FinishNames {
  marketing_name: string;
  marketing_name_zh_hant?: string | null;
  marketing_name_zh_hans?: string | null;
  factory_name_en: string;
}

export function localizedFinishName(f: FinishNames, language: AppLanguage): string {
  const en = f.marketing_name || f.factory_name_en;
  if (language === "zh-Hant") return f.marketing_name_zh_hant || f.marketing_name_zh_hans || en;
  if (language === "zh-Hans") return f.marketing_name_zh_hans || f.marketing_name_zh_hant || en;
  return en;
}
