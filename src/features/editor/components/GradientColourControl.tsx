import { useId, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { gradientCss, type ColourGradient } from "../lib/gradient";
import { normalizeHex } from "../lib/pantone";

export function GradientColourControl({ gradient, onChange, onCommit, testIds = true }: { gradient: ColourGradient; onChange: (gradient: ColourGradient) => void; onCommit: () => void; testIds?: boolean }) {
  const { t } = useI18n();
  const id = useId();
  const testId = (name: string) => testIds ? name : undefined;
  const [stop, setStop] = useState<"from" | "to">("from");
  const [draft, setDraft] = useState<string | null>(null);
  const change = (patch: Partial<ColourGradient>) => onChange({ ...gradient, ...patch });
  const hex = gradient[stop];

  return (
    <div className="space-y-3" data-testid={testId("gradient-control")} data-from={gradient.from} data-to={gradient.to} data-angle={gradient.angle} data-midpoint={gradient.midpoint}>
      <div>
        <div className="h-8 border border-border" style={{ background: gradientCss({ ...gradient, angle: 0 }) }} data-testid={testId("gradient-preview")} aria-label={t("editor.gradient.preview")} />
        <div className="mt-1 flex items-center justify-between gap-2">
          {(["from", "to"] as const).map(endpoint => (
            <button key={endpoint} type="button" data-testid={testId(`gradient-stop-${endpoint}`)} aria-pressed={stop === endpoint} onClick={() => { setStop(endpoint); setDraft(null); }} className={`flex items-center gap-1.5 px-1 py-1 text-xs ${stop === endpoint ? "text-foreground underline underline-offset-4" : "text-muted-foreground"}`}>
              <span className={`h-4 w-4 border ${stop === endpoint ? "border-foreground ring-1 ring-foreground ring-offset-1" : "border-border"}`} style={{ background: gradient[endpoint] }} />
              {t(`editor.gradient.${endpoint}`)}
            </button>
          ))}
          <button type="button" data-testid={testId("gradient-reverse")} title={t("editor.gradient.reverse")} aria-label={t("editor.gradient.reverse")} onClick={() => { change({ from: gradient.to, to: gradient.from, midpoint: 1 - gradient.midpoint }); onCommit(); }} className="order-first px-1 py-1 text-muted-foreground hover:text-foreground">
            <ArrowLeftRight className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-colour`} className="sr-only">{t(`editor.gradient.${stop}`)}</label>
        <input id={`${id}-colour`} data-testid={testId("gradient-stop-picker")} type="color" value={hex} onChange={event => change({ [stop]: event.currentTarget.value })} onBlur={onCommit} className="h-8 w-10 shrink-0 cursor-pointer border border-border bg-transparent p-0.5" />
        <input data-testid={testId("gradient-stop-hex")} aria-label={t("editor.colour.hex")} value={draft ?? hex} maxLength={7} autoComplete="off" spellCheck={false} onFocus={() => setDraft(hex)} onChange={event => {
          const value = event.currentTarget.value;
          setDraft(value);
          const colour = normalizeHex(value);
          if (colour) change({ [stop]: colour });
        }} onBlur={() => { setDraft(null); onCommit(); }} onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) event.currentTarget.blur(); }} className="min-w-0 flex-1 border border-border bg-transparent px-2 py-1.5 font-mono text-xs uppercase outline-none focus:border-foreground" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <label htmlFor={`${id}-angle`} className="text-muted-foreground">{t("editor.gradient.angle")}</label>
          <span>{gradient.angle}°</span>
        </div>
        <input id={`${id}-angle`} data-testid={testId("gradient-angle")} type="range" min={0} max={359} step={1} value={gradient.angle} onChange={event => change({ angle: Number(event.currentTarget.value) })} onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit} className="block w-full accent-blue-600" />
        <div className="flex gap-1">
          {[0, 45, 90].map(angle => <button key={angle} type="button" data-testid={testId(`gradient-angle-${angle}`)} aria-pressed={gradient.angle === angle} onClick={() => { change({ angle }); onCommit(); }} className={`flex-1 border px-2 py-1 text-xs ${gradient.angle === angle ? "border-foreground bg-secondary" : "border-border text-muted-foreground"}`}>{angle}°</button>)}
        </div>
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs">
          <label htmlFor={`${id}-midpoint`} className="text-muted-foreground">{t("editor.gradient.midpoint")}</label>
          <span>{Math.round(gradient.midpoint * 100)}%</span>
        </div>
        <input id={`${id}-midpoint`} data-testid={testId("gradient-midpoint")} type="range" min={10} max={90} step={1} value={Math.round(gradient.midpoint * 100)} onChange={event => change({ midpoint: Number(event.currentTarget.value) / 100 })} onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit} className="block w-full accent-blue-600" />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button type="button" data-testid={testId("gradient-lighten")} onClick={() => { change({ to: "#FFFFFF" }); onCommit(); }} className="border border-border px-2 py-1 text-xs hover:border-foreground">{t("editor.gradient.toLight")}</button>
        <button type="button" data-testid={testId("gradient-darken")} onClick={() => { change({ to: "#000000" }); onCommit(); }} className="border border-border px-2 py-1 text-xs hover:border-foreground">{t("editor.gradient.toDark")}</button>
        <button type="button" data-testid={testId("gradient-black-white")} onClick={() => { onChange({ from: "#000000", to: "#FFFFFF", angle: gradient.angle, midpoint: 0.5 }); onCommit(); }} className="border border-border px-2 py-1 text-xs hover:border-foreground">{t("editor.gradient.blackWhite")}</button>
      </div>
    </div>
  );
}
