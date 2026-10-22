import type { AppLanguage } from "../../i18n/translations";
import type { EditorColour } from "../hooks/useEditorProduct";

/** Design colours for an imported file, independent of any catalogue product. */
export const BASIC_LOCAL_COLOURS = [
  { id: "local-colour-black", name: "Black", name_zh_hant: "黑色", name_zh_hans: "黑色", hex: "#111111", sort_order: 0 },
  { id: "local-colour-white", name: "White", name_zh_hant: "白色", name_zh_hans: "白色", hex: "#FFFFFF", sort_order: 1 },
  { id: "local-colour-grey", name: "Grey", name_zh_hant: "灰色", name_zh_hans: "灰色", hex: "#808080", sort_order: 2 },
  { id: "local-colour-navy", name: "Navy", name_zh_hant: "海軍藍", name_zh_hans: "海军蓝", hex: "#000080", sort_order: 3 },
  { id: "local-colour-red", name: "Red", name_zh_hant: "紅色", name_zh_hans: "红色", hex: "#FF0000", sort_order: 4 },
] as const;

export function getLocalModelColours(language: AppLanguage): EditorColour[] {
  return BASIC_LOCAL_COLOURS.map((colour) => ({
    id: colour.id,
    name: language === "zh-Hant" ? colour.name_zh_hant : language === "zh-Hans" ? colour.name_zh_hans : colour.name,
    hex: colour.hex,
    sort_order: colour.sort_order,
  }));
}
