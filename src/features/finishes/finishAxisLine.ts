import type { AppLanguage } from "@/features/i18n/translations";
import type { PickerFinish } from "@/features/editor/hooks/useFinishOptions";

function pick(language: AppLanguage, name: { name: string; name_zh_hant: string | null; name_zh_hans: string | null } | null): string | null {
  if (!name) return null;
  if (language === "zh-Hant") return name.name_zh_hant || name.name;
  if (language === "zh-Hans") return name.name_zh_hans || name.name;
  return name.name;
}

/** "Hanger plating · Nickel · Brushed · …" — every populated axis, in a fixed order (R4). */
export function finishAxisLine(finish: PickerFinish, language: AppLanguage): string {
  return [finish.process, finish.base_family, finish.surface, finish.tone, finish.effect, finish.tint, finish.coating, finish.pattern]
    .map((axis) => pick(language, axis))
    .filter((name): name is string => !!name)
    .join(" · ");
}

export function finishMarketingName(finish: PickerFinish, language: AppLanguage): string {
  if (language === "zh-Hant") return finish.marketing_name_zh_hant || finish.marketing_name;
  if (language === "zh-Hans") return finish.marketing_name_zh_hans || finish.marketing_name;
  return finish.marketing_name;
}
