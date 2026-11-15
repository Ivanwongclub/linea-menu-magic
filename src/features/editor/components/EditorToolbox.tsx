import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Eraser, MousePointer2, PaintBucket, Pipette } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../store/useEditorStore";

type ColourTool = "eyedropper" | "bucket" | "eraser";

/** Left rail. Select is its own slot. Eyedropper, paint, and eraser share one slot. */
export function EditorToolbox() {
  const { t } = useI18n();
  const eyedropper = useEditorStore((s) => s.eyedropperArmed);
  const bucket = useEditorStore((s) => s.paintBucketArmed);
  const eraser = useEditorStore((s) => s.eraserArmed);
  const notice = useEditorStore((s) => s.eyedropperNotice);
  const viewportBackgroundHex = useEditorStore((s) => s.viewportBackgroundHex);
  const setViewportBackgroundHex = useEditorStore((s) => s.setViewportBackgroundHex);
  const setTool = useEditorStore((s) => s.setEditorTool);
  const [slot, setSlot] = useState<ColourTool>("eyedropper");
  const [open, setOpen] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const shown: ColourTool = eyedropper ? "eyedropper" : bucket ? "bucket" : eraser ? "eraser" : slot;
  const face = (on: boolean) => `flex h-9 w-9 items-center justify-center border border-foreground ${on ? "bg-foreground text-background" : "text-foreground hover:bg-secondary"}`;
  const tools = {
    eyedropper: { icon: Pipette, label: t("editor.colour.eyedropper"), testId: "eyedropper-button", menuId: "tool-slot-eyedropper" },
    bucket: { icon: PaintBucket, label: t("editor.tools.bucket"), testId: "tool-bucket", menuId: "tool-slot-bucket" },
    eraser: { icon: Eraser, label: t("editor.tools.eraser"), testId: "tool-eraser", menuId: "tool-slot-eraser" },
  } as const;
  const current = tools[shown];
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!group.current?.contains(event.target as Node)) setOpen(false);
    };
    const id = window.setTimeout(() => window.addEventListener("pointerdown", close), 0);
    return () => {
      window.clearTimeout(id);
      window.removeEventListener("pointerdown", close);
    };
  }, [open]);

  const pick = (tool: ColourTool) => {
    setSlot(tool);
    setTool(tool);
    setOpen(false);
  };
  const openSlot = (event: PointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setOpen(true);
    setTool(shown);
  };

  return (
    <div role="toolbar" aria-label={t("editor.tools.title")} data-testid="editor-toolbox" className="absolute inset-y-0 left-0 z-20 flex w-12 flex-col items-center border-r border-foreground bg-background py-2">
      <button type="button" data-testid="tool-select" aria-pressed={!eyedropper && !bucket && !eraser} aria-label={t("editor.tools.select")} title={t("editor.tools.select")} onClick={() => { setOpen(false); setTool("select"); }} className={face(!eyedropper && !bucket && !eraser)}>
        <MousePointer2 className="h-4 w-4" strokeWidth={1.5} />
      </button>
      <div ref={group} className="relative -mt-px" data-testid="tool-colour-slot" data-tool={shown}>
        <button type="button" data-testid={current.testId} data-switch="tool-slot-switch" aria-pressed={eyedropper || bucket || eraser} aria-expanded={open} aria-label={current.label} title={t("editor.tools.switchColour")} onPointerDown={openSlot} onClick={openSlot} className={`relative ${face(eyedropper || bucket || eraser)}`}>
          <CurrentIcon className="h-4 w-4" strokeWidth={1.5} />
          <span className={`pointer-events-none absolute bottom-0.5 right-0.5 block h-0 w-0 border-b-[5px] border-l-[5px] border-l-transparent ${eyedropper || bucket || eraser ? "border-b-background" : "border-b-foreground"}`} />
        </button>
        {open && (
          <div role="menu" data-testid="tool-slot-menu" className="absolute left-full top-0 z-30 ml-1 flex w-max flex-col border border-foreground bg-background text-foreground">
            {(Object.keys(tools) as ColourTool[]).map((tool, index) => {
              const item = tools[tool];
              const Icon = item.icon;
              return (
                <button key={tool} type="button" role="menuitem" data-testid={item.menuId} onClick={() => pick(tool)} className={`flex items-center gap-2 whitespace-nowrap px-2 py-1.5 text-xs hover:bg-secondary ${index > 0 ? "border-t border-foreground" : ""} ${shown === tool ? "bg-secondary" : ""}`}>
                  <Icon className="h-4 w-4" strokeWidth={1.5} />
                  {item.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-auto flex w-full flex-col items-center gap-2 px-1 pb-1">
        {notice && (
          <div className="flex w-full flex-col items-center gap-1" data-testid="eyedropper-swatch" data-hex={notice.hex}>
            <span className="h-8 w-8 border border-foreground" style={{ background: notice.hex }} />
            <span className="text-center font-mono text-[9px] leading-none text-foreground">{notice.hex}</span>
          </div>
        )}
        <label className="flex w-full cursor-pointer flex-col items-center gap-1" title={t("editor.tools.canvasBackground")} aria-label={t("editor.tools.canvasBackground")}>
          <input type="color" data-testid="viewport-background" value={viewportBackgroundHex} onChange={(event) => setViewportBackgroundHex(event.currentTarget.value)} className="h-8 w-8 cursor-pointer border border-foreground bg-transparent p-0" />
          <span className="text-center text-[9px] leading-none text-muted-foreground">{t("editor.tools.canvasBackgroundShort")}</span>
        </label>
      </div>
    </div>
  );
}
