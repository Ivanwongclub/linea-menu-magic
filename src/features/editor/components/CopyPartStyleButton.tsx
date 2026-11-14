import { ClipboardPaste, Copy } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../store/useEditorStore";

/** Copy remembers this part. On a different part the same button pastes. */
export function CopyPartStyleButton({ index }: { index: number }) {
  const { t } = useI18n();
  const clip = useEditorStore((s) => s.copiedPartStyle);
  const copy = useEditorStore((s) => s.copyPartStyle);
  const paste = useEditorStore((s) => s.pastePartStyle);
  const isSource = clip?.sourceIndex === index;
  const canPaste = !!clip && !isSource;

  return (
    <div className="space-y-1.5" data-testid="copy-part-style" data-index={index} data-mode={canPaste ? "paste" : isSource ? "copied" : "copy"}>
      <button
        type="button"
        data-testid="copy-part-style-button"
        onClick={() => (canPaste ? paste(index) : copy(index))}
        className="flex w-full items-center justify-center gap-1.5 border border-foreground bg-foreground px-3 py-2 text-sm text-background"
      >
        {canPaste ? <ClipboardPaste className="h-4 w-4" strokeWidth={1.5} /> : <Copy className="h-4 w-4" strokeWidth={1.5} />}
        {t(canPaste ? "editor.parts.pasteStyle" : isSource ? "editor.parts.copiedShort" : "editor.parts.copyStyle")}
      </button>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {canPaste ? t("editor.parts.pasteHint", { name: clip.sourceName }) : t(isSource ? "editor.parts.copiedHint" : "editor.parts.copyStyleHint")}
      </p>
    </div>
  );
}
