import { useEffect, useRef, useState, type MouseEvent } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { useCatalogueEditorStatus } from "@/features/admin/hooks/useCatalogueEditorStatus";
import { useModelGroups } from "@/features/admin/hooks/useModelGroups";
import { useProductBranding } from "@/features/admin/hooks/useProductModel";
import type { BrandingReference } from "@/features/admin/lib/brandingRecovery";
import { useI18n } from "@/features/i18n/I18nProvider";

interface ProductBrandingMarksProps {
  productId: string;
  modelUrl: string;
  /** mm per raw unit when the scale is confirmed, else null (raw-only display). */
  confirmedFactor: number | null;
  marked: number[];
  onMarkedChange: (indices: number[]) => void;
  /** Called when the group list opens, so the preview can show the highlight. */
  onOpen: () => void;
  /** The result on screen (stored reference, or this session's low-confidence one) — the preview draws its ring. */
  onResultChange: (reference: BrandingReference | null) => void;
  /** "Preview as buyer": hide the marked groups in the preview. */
  previewAsBuyer: boolean;
  onPreviewAsBuyerChange: (on: boolean) => void;
}

/**
 * Phase 4d: the model's OBJ groups (index, name, vertex count) with
 * multi-select (click toggles, shift-click applies to the range from the last
 * click), and one explicit "Analyse branding" action that recovers the text
 * path from the marked groups and saves marks and reference together (E1
 * §5 row 4d). Catalogue editors only — the one role that can write
 * `products` (4a Q1).
 */
export function ProductBrandingMarks({
  productId,
  modelUrl,
  confirmedFactor,
  marked,
  onMarkedChange,
  onOpen,
  onResultChange,
  previewAsBuyer,
  onPreviewAsBuyerChange,
}: ProductBrandingMarksProps) {
  const { t } = useI18n();
  const { isEditor, loading: editorLoading } = useCatalogueEditorStatus();
  const [open, setOpen] = useState(false);
  const [analysing, setAnalysing] = useState(false);
  const [lowResult, setLowResult] = useState<BrandingReference | null>(null);
  const lastClicked = useRef<number | null>(null);
  const seeded = useRef(false);

  const { branding, saveBranding } = useProductBranding(productId);
  const groups = useModelGroups(modelUrl, open);

  const saved = branding.data;
  useEffect(() => {
    if (seeded.current || !saved) return;
    seeded.current = true;
    onMarkedChange(saved.model_branding_groups.map((m) => m.index));
    // Seed the selection once from the stored marks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved]);

  const reference = saved?.model_branding_reference ?? null;
  const shownResult = reference ?? lowResult;
  useEffect(() => {
    onResultChange(shownResult);
  }, [shownResult, onResultChange]);

  if (editorLoading || !isEditor) return null;

  const markedSet = new Set(marked);
  const groupList = groups.data?.groups ?? [];

  const onRowClick = (index: number, event: MouseEvent) => {
    const next = new Set(markedSet);
    const target = !markedSet.has(index);
    if (event.shiftKey && lastClicked.current !== null) {
      const [from, to] = [Math.min(lastClicked.current, index), Math.max(lastClicked.current, index)];
      for (let i = from; i <= to; i++) {
        if (target) next.add(i);
        else next.delete(i);
      }
    } else if (target) next.add(index);
    else next.delete(index);
    lastClicked.current = index;
    onMarkedChange([...next].sort((a, b) => a - b));
  };

  const analyse = async () => {
    if (!groups.data || !marked.length) return;
    setAnalysing(true);
    try {
      const recovery = await import("@/features/admin/lib/brandingRecovery");
      const analysis = recovery.analyseBranding(groups.data.root, marked);
      if (!analysis) return;
      const marks = marked.map((index) => ({ index, name: groupList[index]?.name ?? `group_${index + 1}` }));
      await saveBranding.mutateAsync({ marks, reference: analysis.reference });
      setLowResult(analysis.reference ? null : analysis.result);
      toast.success(t("admin.model.branding.saved"));
    } catch (error) {
      toast.error(describeSupabaseError(error as { message: string; code?: string }));
    } finally {
      setAnalysing(false);
    }
  };

  const savedMarkCount = saved?.model_branding_groups.length ?? 0;

  return (
    <div className="space-y-3 border border-border p-3" data-testid="model-branding-panel">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">{t("admin.model.branding.title")}</span>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          data-testid="model-branding-toggle"
          onClick={() => {
            if (!open) onOpen();
            setOpen((v) => !v);
          }}
        >
          {t(open ? "admin.model.branding.hideGroups" : "admin.model.branding.showGroups")}
        </Button>
      </div>

      {open &&
        (groups.isLoading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> {t("admin.model.branding.loadingGroups")}
          </div>
        ) : groups.error ? (
          <p className="text-xs text-destructive">{t("admin.model.branding.loadFailed")}</p>
        ) : (
          <>
            <p className="text-xs text-muted-foreground">{t("admin.model.branding.hint")}</p>
            <div className="max-h-72 overflow-y-auto border border-border divide-y divide-border" data-testid="model-branding-groups">
              {groupList.map((g) => {
                const isMarked = markedSet.has(g.index);
                return (
                  <button
                    key={g.index}
                    type="button"
                    data-testid="model-branding-group"
                    data-index={g.index}
                    aria-pressed={isMarked}
                    onClick={(e) => onRowClick(g.index, e)}
                    className={cn(
                      "w-full grid grid-cols-[3rem_1fr_auto] gap-2 px-2 py-1.5 text-left text-xs font-mono select-none",
                      isMarked ? "bg-primary text-primary-foreground" : "hover:bg-secondary",
                    )}
                  >
                    <span className={isMarked ? "text-primary-foreground/70" : "text-muted-foreground"}>{g.index}</span>
                    <span className="truncate">{g.name}</span>
                    <span className={isMarked ? "text-primary-foreground/70" : "text-muted-foreground"}>
                      {t("admin.model.branding.vertexCount", { count: g.vertexCount })}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground" data-testid="model-branding-marked-count">
                {t("admin.model.branding.markedCount", { count: marked.length })}
              </span>
              <Button
                size="sm"
                className="h-8 text-xs"
                disabled={!marked.length || analysing}
                data-testid="model-branding-analyse"
                onClick={analyse}
              >
                {analysing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {t("admin.model.branding.analyse")}
              </Button>
            </div>
          </>
        ))}

      {(savedMarkCount > 0 || marked.length > 0) && (
        <label className="flex items-center justify-between gap-3 text-xs text-foreground">
          <span>{t("admin.model.branding.previewAsBuyer")}</span>
          <Switch data-testid="model-branding-buyer-preview" checked={previewAsBuyer} onCheckedChange={onPreviewAsBuyerChange} />
        </label>
      )}

      {reference ? (
        <BrandingResult reference={reference} confirmedFactor={confirmedFactor} />
      ) : lowResult ? (
        <div className="space-y-2">
          <p className="text-xs text-amber-700" data-testid="model-branding-low-confidence">
            {t("admin.model.branding.lowConfidence")}
          </p>
          <BrandingDetails reference={lowResult} confirmedFactor={confirmedFactor} />
        </div>
      ) : savedMarkCount > 0 ? (
        <p className="text-xs text-amber-700" data-testid="model-branding-low-confidence">
          {t("admin.model.branding.lowConfidence")}
        </p>
      ) : null}
    </div>
  );
}

/** Lengths as the sentence reads them: mm at 1 dp once the scale is confirmed, raw units before. */
function useLength(confirmedFactor: number | null) {
  const { t } = useI18n();
  return (raw: number) =>
    confirmedFactor != null
      ? t("admin.model.branding.lengthMm", { value: (raw * confirmedFactor).toFixed(1) })
      : t("admin.model.branding.lengthRaw", { value: raw.toFixed(1) });
}

/**
 * The analysis in one sentence (4h R6) — "Lettering found on a 5.0 mm ring,
 * 1.7 mm tall, raised 0.3 mm. Buyers' text will start here." — with the
 * confidence only when it isn't high, and the raw numbers behind Details.
 */
function BrandingResult({ reference, confirmedFactor }: { reference: BrandingReference; confirmedFactor: number | null }) {
  const { t } = useI18n();
  const length = useLength(confirmedFactor);
  const relief = reference.relief_raw;
  const sentence = [
    t("admin.model.branding.sentenceRing", { radius: length(reference.radius_raw) }),
    reference.text_height_raw != null ? t("admin.model.branding.sentenceTall", { height: length(reference.text_height_raw) }) : "",
    relief != null && Math.abs(relief) > 0
      ? t(relief > 0 ? "admin.model.branding.sentenceRaised" : "admin.model.branding.sentenceRecessed", { relief: length(Math.abs(relief)) })
      : "",
    t("admin.model.branding.sentenceEnd"),
  ].join("");

  return (
    <div className="space-y-1.5 text-xs" data-testid="model-branding-result" data-confidence={reference.confidence}>
      <p className="text-sm text-foreground" data-testid="model-branding-sentence">
        {sentence}
      </p>
      {reference.confidence !== "high" && (
        <p className="text-muted-foreground" data-testid="model-branding-confidence-line">
          {t("admin.model.branding.confidenceLine", { level: t(`admin.model.branding.confidence_${reference.confidence}`) })}
        </p>
      )}
      <BrandingDetails reference={reference} confirmedFactor={confirmedFactor} />
    </div>
  );
}

function BrandingDetails({ reference, confirmedFactor }: { reference: BrandingReference; confirmedFactor: number | null }) {
  const { t } = useI18n();
  const fitted = reference.radius_raw > 0;
  const length = (raw: number | null) => {
    if (raw == null) return "—";
    const rawText = `${raw.toFixed(3)} ${t("admin.model.branding.rawUnits")}`;
    return confirmedFactor != null ? `${rawText} · ${(raw * confirmedFactor).toFixed(3)} mm` : rawText;
  };
  const rows: [string, string, string][] = [
    ["radius", t("admin.model.branding.radius"), fitted ? length(reference.radius_raw) : "—"],
    [
      "angles",
      t("admin.model.branding.angles"),
      fitted ? `${reference.start_angle_deg.toFixed(1)}° → ${reference.end_angle_deg.toFixed(1)}°` : "—",
    ],
    ["direction", t("admin.model.branding.direction"), t(reference.direction === "cw" ? "admin.model.branding.directionCw" : "admin.model.branding.directionCcw")],
    ["height", t("admin.model.branding.textHeight"), length(reference.text_height_raw)],
    ["relief", t("admin.model.branding.relief"), length(reference.relief_raw)],
    ["confidence", t("admin.model.branding.confidence"), t(`admin.model.branding.confidence_${reference.confidence}`)],
    ["rms", t("admin.model.branding.rms"), fitted ? length(reference.fit_rms_raw) : "—"],
  ];
  return (
    <details className="group text-xs" data-testid="model-branding-details">
      <summary className="cursor-pointer select-none text-muted-foreground hover:text-foreground">{t("admin.model.branding.details")}</summary>
      <div className="space-y-1 pt-1.5">
        <p className="text-muted-foreground">{t("admin.model.branding.provenance")}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5">
          {rows.map(([key, label, value]) => (
            <div key={key} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-mono" data-testid={`model-branding-${key}`}>
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {confirmedFactor == null && <p className="text-muted-foreground">{t("admin.model.branding.rawOnly")}</p>}
      </div>
    </details>
  );
}
