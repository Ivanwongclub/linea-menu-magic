import { useRef, useState } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../../store/useEditorStore";
import type { TextLayer } from "../../lib/recipe";

/** Share one text value between the inline editor and Properties; defer IME drafts until confirmed. */
export function LayerTextInput({ layer, id, testId, className, autoFocus = false, onFinish }: {
  layer: TextLayer;
  id?: string;
  testId: string;
  className?: string;
  autoFocus?: boolean;
  onFinish?: () => void;
}) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const select = useEditorStore((s) => s.select);
  const commit = useEditorStore((s) => s.commit);
  const composing = useRef(false);
  const [composition, setComposition] = useState<string | null>(null);
  const update = (value: string) => updateLayer(layer.id, { content: { value } });

  return (
    <input
      id={id}
      data-testid={testId}
      data-layer-text-input="true"
      aria-label={t("editor.branding.text")}
      autoFocus={autoFocus}
      autoComplete="off"
      spellCheck={false}
      placeholder={t("editor.branding.emptyLayer")}
      value={composition ?? layer.content.value}
      onFocus={() => select({ kind: "layer", id: layer.id })}
      onChange={(event) => {
        const value = event.currentTarget.value;
        if (composing.current) setComposition(value);
        else update(value);
      }}
      onCompositionStart={(event) => {
        composing.current = true;
        setComposition(event.currentTarget.value);
      }}
      onCompositionEnd={(event) => {
        composing.current = false;
        setComposition(null);
        update(event.currentTarget.value);
      }}
      onBlur={(event) => {
        // Some IMEs blur without a final compositionend when another item is selected.
        if (composing.current) {
          composing.current = false;
          setComposition(null);
          update(event.currentTarget.value);
        }
        commit();
        onFinish?.();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Enter" || composing.current || event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
        event.preventDefault();
        commit();
        if (onFinish) event.currentTarget.blur();
      }}
      className={className}
    />
  );
}
