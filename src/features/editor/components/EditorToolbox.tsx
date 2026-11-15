import { useEffect, useRef, useState } from "react";
import { MousePointer2, PaintBucket, Pipette } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../store/useEditorStore";

type ColourTool = "eyedropper" | "bucket";

/** Left rail. Select is its own slot. Eyedropper and paint share one slot. */
export function EditorToolbox() {
  const { t } = useI18n();
  const eyedropper = useEditorStore((s) => s.eyedropperArmed);
  const bucket = useEditorStore((s) => s.paintBucketArmed);
  const notice = useEditorStore((s) => s.eyedropperNotice);
  const setTool = useEditorStore((s) => s.setEditorTool);
  const [slot, setSlot] = useState<ColourTool>("eyedropper");
  const [open, setOpen] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const shown: ColourTool = eyedropper ? "eyedropper" : bucket ? "bucket" : slot;
  const face = (on: boolean) => `flex h-9 w-9 items-center justify-center border border-foreground ${on ? "bg-foreground text-background" : "text-foreground hover:bg-secondary"}`;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!group.current?.contains(event.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const pick = (tool: ColourTool) => {
    setSlot(tool);
    setTool(tool);
    setOpen(false);
  };

  return (
    <div role="toolbar" aria-label={t("editor.tools.title")} data-testid="editor-toolbox" className="absolute inset-y-0 left-0 z-20 flex w-12 flex-col items-center border-r border-foreground bg-background py-2">
      <button type="button" data-testid="tool-select" aria-pressed={!eyedropper && !bucket} aria-label={t("editor.tools.select")} title={t("editor.tools.select")} onClick={() => { setOpen(false); setTool("select"); }} className={face(!eyedropper && !bucket)}>
        <MousePointer2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <div ref={group} className="relative -mt-px" data-testid="tool-colour-slot" data-tool={shown}>
        <button type="button" data-testid={shown === "eyedropper" ? "eyedropper-button" : "tool-bucket"} aria-pressed={eyedropper || bucket} aria-label={shown === "eyedropper" ? t("editor.colour.eyedropper") : t("editor.tools.bucket")} title={shown === "eyedropper" ? t("editor.colour.eyedropper") : t("editor.tools.bucket")} onClick={() => pick(shown)} className={face(eyedropper || bucket)}>
          {shown === "eyedropper" ? <Pipette className="h-4 w-4" strokeWidth={1.5} /> : <PaintBucket className="h-4 w-4" strokeWidth={1.5} />}
        </button>
        <button type="button" data-testid="tool-slot-switch" aria-expanded={open} aria-label={t("editor.tools.switchColour")} title={t("editor.tools.switchColour")} onClick={() => setOpen((value) => !value)} className={`absolute bottom-0 right-0 flex h-3 w-3 items-end justify-end ${eyedropper || bucket ? "text-background" : "text-foreground"}`}>
          <span className="block h-0 w-0 border-b-[5px] border-l-[5px] border-b-current border-l-transparent" />
        </button>
        {open && (
          <div role="menu" data-testid="tool-slot-menu" className="absolute left-full top-0 z-30 ml-1 flex w-max flex-col border border-foreground bg-background text-foreground">
            <button type="button" role="menuitem" data-testid="tool-slot-eyedropper" onClick={() => pick("eyedropper")} className={`flex items-center gap-2 whitespace-nowrap px-2 py-1.5 text-xs hover:bg-secondary ${shown === "eyedropper" ? "bg-secondary" : ""}`}>
              <Pipette className="h-4 w-4" strokeWidth={1.5} />
              {t("editor.colour.eyedropper")}
            </button>
            <button type="button" role="menuitem" data-testid="tool-slot-bucket" onClick={() => pick("bucket")} className={`flex items-center gap-2 whitespace-nowrap border-t border-foreground px-2 py-1.5 text-xs hover:bg-secondary ${shown === "bucket" ? "bg-secondary" : ""}`}>
              <PaintBucket className="h-4 w-4" strokeWidth={1.5} />
              {t("editor.tools.bucket")}
            </button>
          </div>
        )}
      </div>
      {notice && (
        <div className="mt-auto flex w-full flex-col items-center gap-1 px-1 pb-1" data-testid="eyedropper-swatch" data-hex={notice.hex}>
          <span className="h-8 w-8 border border-foreground" style={{ background: notice.hex }} />
          <span className="text-center font-mono text-[9px] leading-none text-foreground">{notice.hex}</span>
        </div>
      )}
    </div>
  );
}
