import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { useEditorStore } from "../../store/useEditorStore";
import { useFontMetrics } from "../../hooks/useFontMetrics";
import { letterSpacingForSpan, textArc } from "../../lib/textLayout";
import { isLogoLayer, logoHeightMm, type Layer, type LogoLayer, type TextLayer } from "../../lib/recipe";
import { ValueSlider } from "../controls/ValueSlider";
import { RangeValueSlider } from "../controls/RangeValueSlider";

const FIELD_LABEL = "text-[11px] uppercase tracking-[0.12em] text-muted-foreground";

/** Top arc reads clockwise from 12 o'clock; bottom arc reads counter-clockwise from 6 o'clock. */
const ARCS = [
  { value: "top", direction: "cw", arcPosition: 0, label: "editor.branding.arcTop" },
  { value: "bottom", direction: "ccw", arcPosition: 180, label: "editor.branding.arcBottom" },
] as const;

/**
 * The slider domain for angles: a top arc straddles 0°, so it lives on
 * −180…180; a bottom arc straddles 180°, so it lives on 0…360. Stored angles
 * are read into the domain; the recipe keeps whatever was written.
 */
function angleDomain(direction: TextLayer["placement"]["direction"]): [number, number] {
  return direction === "cw" ? [-180, 180] : [0, 360];
}

function intoDomain(deg: number, [min]: [number, number]): number {
  const d = (deg - min) % 360;
  return (d < 0 ? d + 360 : d) + min;
}

/**
 * "Position and curve" (v3-review §3; rulings §3): the spatial values behind
 * one disclosure row, each a hybrid control over the one recipe in the store
 * (addendum §6). Circle: arc switch, radius, start/end (C7: the midpoint is
 * stored, the span follows from the letters — widening the range spaces the
 * letters at a fixed radius, dragging the band moves the text), arc position.
 * Straight: centre X/Y and rotation. Both: text size, letter spacing,
 * baseline offset. Emboss/deboss ship with Phase 5 (rulings §6).
 */
function TextPlacementFields({ layer, faceDiameterMm }: { layer: TextLayer; faceDiameterMm: number }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);
  const beginDrag = useEditorStore((s) => s.beginDrag);
  const endDrag = useEditorStore((s) => s.endDrag);
  // Every control: live edits, one undo entry per committed edit or drag (4i).
  const history = { onCommit: commit, onDragStart: beginDrag, onDragEnd: endDrag };
  const metrics = useFontMetrics(layer.content.font.key);
  const p = layer.placement;
  const d = faceDiameterMm;
  const id = (name: string) => `${name}-${layer.id}`;

  const placement = (patch: Parameters<typeof updateLayer>[1]["placement"]) => updateLayer(layer.id, { placement: patch });
  const style = (patch: Parameters<typeof updateLayer>[1]["style"]) => updateLayer(layer.id, { style: patch });

  const domain = angleDomain(p.direction);
  const mid = intoDomain(p.arc_position_deg, domain);
  const span = metrics ? textArc(metrics, layer).spanDeg : 0;
  const low = mid - span / 2;
  const high = mid + span / 2;

  const onRange = (nextLow: number, nextHigh: number) => {
    const nextSpan = nextHigh - nextLow;
    const nextMid = (nextLow + nextHigh) / 2;
    if (metrics && Math.abs(nextSpan - span) > 1e-6) {
      updateLayer(layer.id, {
        placement: { arc_position_deg: nextMid },
        style: { letter_spacing_mm: letterSpacingForSpan(metrics, layer, nextSpan) },
      });
    } else {
      placement({ arc_position_deg: nextMid });
    }
  };

  const arc = p.direction === "cw" ? "top" : "bottom";

  return (
    <>

          {p.layout === "circle" ? (
            <>
              <div className="space-y-1.5">
                <span id={id("arc")} className={FIELD_LABEL}>
                  {t("editor.branding.arc")}
                </span>
                <div role="radiogroup" aria-labelledby={id("arc")} className="grid grid-cols-2 border border-border" data-testid="pc-arc">
                  {ARCS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      role="radio"
                      aria-checked={arc === option.value}
                      data-value={option.value}
                      onClick={() => {
                        placement({ direction: option.direction, arc_position_deg: option.arcPosition });
                        commit();
                      }}
                      className={cn(
                        "py-1.5 text-xs tracking-[0.05em] transition-colors",
                        arc === option.value ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {t(option.label)}
                    </button>
                  ))}
                </div>
              </div>
              <ValueSlider
                {...history}
                id={id("radius")}
                testId="pc-radius"
                label={t("editor.branding.radius")}
                unit="mm"
                value={p.radius_mm}
                min={0}
                max={d / 2}
                hardMin={0}
                exclusiveMin
                onChange={(radius_mm) => placement({ radius_mm })}
              />
              <RangeValueSlider
                {...history}
                id={id("arc-range")}
                testId="pc-arc-range"
                label={t("editor.branding.startEnd")}
                unit="deg"
                low={low}
                high={high}
                min={domain[0]}
                max={domain[1]}
                lowLabel={t(p.direction === "cw" ? "editor.branding.start" : "editor.branding.end")}
                highLabel={t(p.direction === "cw" ? "editor.branding.end" : "editor.branding.start")}
                swapInputs={p.direction === "ccw"}
                onChange={onRange}
              />
              <ValueSlider
                {...history}
                id={id("arc-position")}
                testId="pc-arc-position"
                label={t("editor.branding.arcPosition")}
                unit="deg"
                value={mid}
                min={domain[0]}
                max={domain[1]}
                onChange={(arc_position_deg) => placement({ arc_position_deg })}
              />
            </>
          ) : (
            <>
              <ValueSlider
                {...history}
                id={id("centre-x")}
                testId="pc-centre-x"
                label={t("editor.branding.centreX")}
                unit="mm"
                value={p.centre_mm.x}
                min={-d / 2}
                max={d / 2}
                onChange={(x) => placement({ centre_mm: { x, y: p.centre_mm.y } })}
              />
              <ValueSlider
                {...history}
                id={id("centre-y")}
                testId="pc-centre-y"
                label={t("editor.branding.centreY")}
                unit="mm"
                value={p.centre_mm.y}
                min={-d / 2}
                max={d / 2}
                onChange={(y) => placement({ centre_mm: { x: p.centre_mm.x, y } })}
              />
              <ValueSlider
                {...history}
                id={id("rotation")}
                testId="pc-rotation"
                label={t("editor.branding.rotation")}
                unit="deg"
                value={p.rotation_deg}
                min={-180}
                max={180}
                onChange={(rotation_deg) => placement({ rotation_deg })}
              />
            </>
          )}
          <ValueSlider
            {...history}
            id={id("text-size")}
            testId="pc-text-size"
            label={t("editor.branding.textSize")}
            unit="mm"
            value={layer.style.text_size_mm}
            min={0}
            max={0.3 * d}
            hardMin={0}
            exclusiveMin
            onChange={(text_size_mm) => style({ text_size_mm })}
          />
          <ValueSlider
            {...history}
            id={id("letter-spacing")}
            testId="pc-letter-spacing"
            label={t("editor.branding.letterSpacing")}
            unit="mm"
            value={layer.style.letter_spacing_mm}
            min={-0.05 * d}
            max={0.15 * d}
            onChange={(letter_spacing_mm) => style({ letter_spacing_mm })}
          />
      <ValueSlider
        {...history}
        id={id("baseline")}
        testId="pc-baseline"
        label={t("editor.branding.baselineOffset")}
        unit="mm"
        value={p.baseline_offset_mm}
        min={-0.1 * d}
        max={0.1 * d}
        onChange={(baseline_offset_mm) => placement({ baseline_offset_mm })}
      />
    </>
  );
}

/** A logo's placement (4k R3): centre, width and rotation — no curve. */
function LogoPlacementFields({ layer, faceDiameterMm }: { layer: LogoLayer; faceDiameterMm: number }) {
  const { t } = useI18n();
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const commit = useEditorStore((s) => s.commit);
  const beginDrag = useEditorStore((s) => s.beginDrag);
  const endDrag = useEditorStore((s) => s.endDrag);
  const history = { onCommit: commit, onDragStart: beginDrag, onDragEnd: endDrag };
  const p = layer.placement;
  const d = faceDiameterMm;
  const id = (name: string) => `${name}-${layer.id}`;
  const placement = (patch: Parameters<typeof updateLayer>[1]["placement"]) => updateLayer(layer.id, { placement: patch });

  return (
    <>
      <ValueSlider
        {...history}
        id={id("centre-x")}
        testId="pc-centre-x"
        label={t("editor.branding.centreX")}
        unit="mm"
        value={p.centre_mm.x}
        min={-d / 2}
        max={d / 2}
        onChange={(x) => placement({ centre_mm: { x, y: p.centre_mm.y } })}
      />
      <ValueSlider
        {...history}
        id={id("centre-y")}
        testId="pc-centre-y"
        label={t("editor.branding.centreY")}
        unit="mm"
        value={p.centre_mm.y}
        min={-d / 2}
        max={d / 2}
        onChange={(y) => placement({ centre_mm: { x: p.centre_mm.x, y } })}
      />
      <ValueSlider
        {...history}
        id={id("logo-width")}
        testId="pc-logo-width"
        label={t("editor.branding.logoWidth")}
        unit="mm"
        value={layer.content.width_mm}
        min={0}
        max={d}
        hardMin={0}
        exclusiveMin
        onChange={(width_mm) => updateLayer(layer.id, { content: { width_mm } })}
      />
      <p className="text-[11px] text-muted-foreground" data-testid="pc-logo-height">
        {t("editor.branding.logoHeightLine", { value: `${logoHeightMm(layer).toFixed(2)} mm` })}
      </p>
      <ValueSlider
        {...history}
        id={id("rotation")}
        testId="pc-rotation"
        label={t("editor.branding.rotation")}
        unit="deg"
        value={p.rotation_deg}
        min={-180}
        max={180}
        onChange={(rotation_deg) => placement({ rotation_deg })}
      />
    </>
  );
}

/**
 * The disclosure itself (v3-review §3): one row that opens the selected
 * layer's spatial values in place — a text layer's arc and size, or a logo's
 * centre, width and rotation.
 */
export function PositionAndCurve({ layer, faceDiameterMm }: { layer: Layer; faceDiameterMm: number }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const panelId = `position-curve-${layer.id}`;

  return (
    <div className="border-t border-border pt-2" data-testid="position-and-curve">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        data-testid="position-and-curve-toggle"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 py-1 text-left text-xs tracking-[0.05em] text-foreground"
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} strokeWidth={1.5} />
        {t("editor.branding.positionAndCurve")}
      </button>

      {open && (
        <div id={panelId} className="space-y-4 pt-2 min-w-0">
          {isLogoLayer(layer) ? (
            <LogoPlacementFields layer={layer} faceDiameterMm={faceDiameterMm} />
          ) : (
            <TextPlacementFields layer={layer} faceDiameterMm={faceDiameterMm} />
          )}
        </div>
      )}
    </div>
  );
}
