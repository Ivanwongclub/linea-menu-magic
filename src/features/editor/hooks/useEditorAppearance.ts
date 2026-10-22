import { useMemo } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../store/useEditorStore";
import { getLocalModelColours } from "../lib/localModelAppearance";
import type { EditorColour, EditorProduct } from "./useEditorProduct";
import { useFinishOptions, type PickerFinish } from "./useFinishOptions";
import { usePublicFinishes } from "./usePublicFinishes";

/** Local files have their own appearance options; the catalogue item is untouched. */
export function useEditorAppearance(product: EditorProduct | undefined) {
  const { language } = useI18n();
  const localModel = useEditorStore((s) => s.localModel);
  const finishId = useEditorStore((s) => s.recipe.finish_id);
  const colourId = useEditorStore((s) => s.recipe.colour_id);
  const setFinishId = useEditorStore((s) => s.setFinishId);
  const setColourId = useEditorStore((s) => s.setColourId);
  const setLocalAppearanceMode = useEditorStore((s) => s.setLocalAppearanceMode);
  const { data: catalogueFinishes = [] } = useFinishOptions(product?.id ?? null, !!product?.is_metal && !localModel);
  const { data: publicFinishes = [] } = usePublicFinishes();
  const localColours = useMemo(() => getLocalModelColours(language), [language]);

  const appearanceMode = localModel?.appearanceMode ?? (product?.is_metal ? "finish" : "colour");
  const isMetal = appearanceMode === "finish";
  const finishOptions = localModel ? publicFinishes : catalogueFinishes;
  const colours = localModel ? localColours : product?.colours ?? [];
  const defaultFinish = localModel
    ? finishOptions.find((finish) => finish.cyc_code === "CYC-0002")
    : finishOptions.find((finish) => finish.id === product?.default_finish_id);
  const selectedFinish = isMetal ? finishOptions.find((finish) => finish.id === finishId) ?? defaultFinish ?? finishOptions[0] ?? null : null;
  const selectedColour = colours.find((colour) => colour.id === colourId) ?? colours[0] ?? null;

  return {
    finishOptions,
    selectedFinish,
    colours,
    selectedColour,
    isMetal,
    localModel,
    appearanceMode,
    setAppearanceMode: setLocalAppearanceMode,
    onSelectFinish: (finish: PickerFinish) => {
      setFinishId(finish.id);
    },
    onSelectColour: (colour: EditorColour) => {
      setColourId(colour.id);
    },
  };
}
