import { useEffect, useRef, useState, type PointerEvent, type ReactElement } from "react";
import { BoxSelect, Eraser, MousePointer2, PaintBucket, Pipette } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useEditorStore } from "../store/useEditorStore";

type ColourTool = "eyedropper" | "bucket" | "eraser";

/** Left rail. Select and same-colour are their own slots. Eyedropper, paint, and eraser share one. */
export function EditorToolbox() {
  const { t } = useI18n();
  const eyedropper = useEditorStore((s) => s.eyedropperArmed);
  const bucket = useEditorStore((s) => s.paintBucketArmed);
  const eraser = useEditorStore((s) => s.eraserArmed);
  const sameColour = useEditorStore((s) => s.sameColourArmed);
  const matched = useEditorStore((s) => s.matchedPartIndices);
  const notice = useEditorStore((s) => s.eyedropperNotice);
  const viewportBackgroundHex = useEditorStore((s) => s.viewportBackgroundHex);
  const setViewportBackgroundHex = useEditorStore((s) => s.setViewportBackgroundHex);
  const setTool = useEditorStore((s) => s.setEditorTool);
  const [slot, setSlot] = useState<ColourTool>("eyedropper");
  const [open, setOpen] = useState(false);
  const group = useRef<HTMLDivElement>(null);
  const shown: ColourTool = eyedropper ? "eyedropper" : bucket ? "bucket" : eraser ? "eraser" : slot;
  const idle = !eyedropper && !bucket && !eraser && !sameColour;
  const face = (on: boolean) => `flex h-9 w-9 items-center justify-center border border-foreground ${on ? "bg-foreground text-background" : "text-foreground hover:bg-secondary"}`;
  const tools = {
    eyedropper: { icon: Pipette, label: t("editor.colour.eyedropper"), tip: t("editor.tools.eyedropperTip"), testId: "eyedropper-button", menuId: "tool-slot-eyedropper" },
    bucket: { icon: PaintBucket, label: t("editor.tools.bucket"), tip: t("editor.tools.bucketTip"), testId: "tool-bucket", menuId: "tool-slot-bucket" },
    eraser: { icon: Eraser, label: t("editor.tools.eraser"), tip: t("editor.tools.eraserTip"), testId: "tool-eraser", menuId: "tool-slot-eraser" },
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
      <ToolTip label={t("editor.tools.select")} tip={t("editor.tools.selectTip")}>
        <button type="button" data-testid="tool-select" aria-pressed={idle} aria-label={t("editor.tools.select")} onClick={() => { setOpen(false); setTool("select"); }} className={face(idle)}>
          <MousePointer2 className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </ToolTip>
      <ToolTip label={t("editor.tools.sameColour")} tip={t("editor.tools.sameColourTip")}>
        <button type="button" data-testid="tool-same-colour" aria-pressed={sameColour} aria-label={t("editor.tools.sameColour")} onClick={() => { setOpen(false); setTool(sameColour ? "select" : "sameColour"); }} className={`-mt-px ${face(sameColour)}`}>
          <BoxSelect className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </ToolTip>
      <div ref={group} className="relative -mt-px" data-testid="tool-colour-slot" data-tool={shown}>
        <ToolTip label={current.label} tip={current.tip} extra={t("editor.tools.slotTip")} disabled={open}>
          <button type="button" data-testid={current.testId} data-switch="tool-slot-switch" aria-pressed={eyedropper || bucket || eraser} aria-expanded={open} aria-label={current.label} onPointerDown={openSlot} onClick={openSlot} className={`relative ${face(eyedropper || bucket || eraser)}`}>
            <CurrentIcon className="h-4 w-4" strokeWidth={1.5} />
            <span className={`pointer-events-none absolute bottom-0.5 right-0.5 block h-0 w-0 border-b-[5px] border-l-[5px] border-l-transparent ${eyedropper || bucket || eraser ? "border-b-background" : "border-b-foreground"}`} />
          </button>
        </ToolTip>
        {open && (
          <div role="menu" data-testid="tool-slot-menu" className="absolute left-full top-0 z-30 ml-1 flex w-max flex-col border border-foreground bg-background text-foreground">
            {(Object.keys(tools) as ColourTool[]).map((tool, index) => {
              const item = tools[tool];
              const Icon = item.icon;
              return (
                <ToolTip key={tool} label={item.label} tip={item.tip}>
                  <button type="button" role="menuitem" data-testid={item.menuId} onClick={() => pick(tool)} className={`flex items-center gap-2 whitespace-nowrap px-2 py-1.5 text-xs hover:bg-secondary ${index > 0 ? "border-t border-foreground" : ""} ${shown === tool ? "bg-secondary" : ""}`}>
                    <Icon className="h-4 w-4" strokeWidth={1.5} />
                    {item.label}
                  </button>
                </ToolTip>
              );
            })}
          </div>
        )}
      </div>
      <div className="mt-auto flex w-full flex-col items-center gap-2 px-1 pb-1">
        {matched.length > 1 && (
          <span className="text-center text-[9px] leading-none text-foreground" data-testid="same-colour-count">{t("editor.tools.sameColourCount", { count: matched.length })}</span>
        )}
        {notice && (
          <div className="flex w-full flex-col items-center gap-1" data-testid="eyedropper-swatch" data-hex={notice.hex}>
            <span className="h-8 w-8 border border-foreground" style={{ background: notice.hex }} />
            <span className="text-center font-mono text-[9px] leading-none text-foreground">{notice.hex}</span>
          </div>
        )}
        <ToolTip label={t("editor.tools.canvasBackground")} tip={t("editor.tools.canvasBackgroundTip")}>
          <label className="flex w-full cursor-pointer flex-col items-center gap-1" aria-label={t("editor.tools.canvasBackground")}>
            <input type="color" data-testid="viewport-background" value={viewportBackgroundHex} onChange={(event) => setViewportBackgroundHex(event.currentTarget.value)} className="h-8 w-8 cursor-pointer border border-foreground bg-transparent p-0" />
            <span className="text-center text-[9px] leading-none text-muted-foreground">{t("editor.tools.canvasBackgroundShort")}</span>
          </label>
        </ToolTip>
      </div>
    </div>
  );
}

function ToolTip({
  label,
  tip,
  extra,
  children,
  side = "right",
  disabled,
}: {
  label: string;
  tip: string;
  extra?: string;
  children: ReactElement;
  side?: "right" | "left" | "top" | "bottom";
  disabled?: boolean;
}) {
  return (
    <Tooltip delayDuration={250} open={disabled ? false : undefined}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent
        side={side}
        sideOffset={8}
        className="max-w-[13rem] rounded-none border-foreground bg-background px-2 py-1.5 text-foreground shadow-none"
        data-testid="tool-tip"
      >
        <p className="text-xs font-medium leading-tight">{label}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{tip}</p>
        {extra && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{extra}</p>}
      </TooltipContent>
    </Tooltip>
  );
}
