import { useId, useState } from "react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { normalizeHex } from "../lib/pantone";
import type { GradientBrightness } from "../lib/gradient";

export function GradientBrightnessControl({ brightness, onChange, onCommit, testIds = true }: { brightness: GradientBrightness; onChange: (value: GradientBrightness) => void; onCommit: () => void; testIds?: boolean }) {
  const { t } = useI18n();
  const id = useId();
  const [draft, setDraft] = useState<string | null>(null);
  const testId = (name: string) => testIds ? name : undefined;
  const change = (patch: Partial<GradientBrightness>) => onChange({ ...brightness, ...patch });
  return <div className="space-y-3" data-testid={testId("brightness-control")} data-colour={brightness.colour} data-from={brightness.from} data-to={brightness.to}>
    <div className="space-y-1">
      <label htmlFor={`${id}-base`} className="text-xs text-muted-foreground">{t("editor.gradient.brightnessBase")}</label>
      <div className="flex items-center gap-2">
        <input id={`${id}-base`} type="color" data-testid={testId("brightness-base-picker")} value={brightness.colour} onChange={event => change({ colour: event.currentTarget.value })} onBlur={onCommit} className="h-8 w-10 shrink-0 cursor-pointer border border-border bg-transparent p-0.5" />
        <input data-testid={testId("brightness-base-hex")} aria-label={t("editor.colour.hex")} value={draft ?? brightness.colour} maxLength={7} autoComplete="off" spellCheck={false} onFocus={() => setDraft(brightness.colour)} onChange={event => { setDraft(event.currentTarget.value); const colour = normalizeHex(event.currentTarget.value); if (colour) change({ colour }); }} onBlur={() => { setDraft(null); onCommit(); }} onKeyDown={event => { if (event.key === "Enter" && !event.nativeEvent.isComposing) event.currentTarget.blur(); }} className="min-w-0 flex-1 border border-border bg-transparent px-2 py-1.5 font-mono text-xs uppercase outline-none focus:border-foreground" />
      </div>
    </div>
    {(["from", "to"] as const).map(endpoint => <div key={endpoint} className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs"><label htmlFor={`${id}-${endpoint}`} className="text-muted-foreground">{t(`editor.gradient.brightness.${endpoint}`)}</label><span>{brightness[endpoint] > 0 ? "+" : ""}{brightness[endpoint]}%</span></div>
      <input id={`${id}-${endpoint}`} type="range" data-testid={testId(`brightness-${endpoint}`)} min={-100} max={100} step={1} value={brightness[endpoint]} onChange={event => change({ [endpoint]: Number(event.currentTarget.value) })} onPointerUp={onCommit} onKeyUp={onCommit} onBlur={onCommit} className="block w-full accent-blue-600" />
    </div>)}
    <p className="text-[11px] leading-relaxed text-muted-foreground">{t("editor.gradient.brightnessHint")}</p>
    <div className="flex gap-1.5">
      <button type="button" data-testid={testId("brightness-dark-light")} onClick={() => { change({ from: -50, to: 50 }); onCommit(); }} className="flex-1 border border-border px-2 py-1 text-xs hover:border-foreground">{t("editor.gradient.darkLight")}</button>
      <button type="button" data-testid={testId("brightness-light-dark")} onClick={() => { change({ from: 50, to: -50 }); onCommit(); }} className="flex-1 border border-border px-2 py-1 text-xs hover:border-foreground">{t("editor.gradient.lightDark")}</button>
    </div>
  </div>;
}
