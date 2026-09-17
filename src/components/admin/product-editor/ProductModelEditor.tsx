import { lazy, Suspense, useEffect, useRef, useState, type DragEvent } from "react";
import { toast } from "sonner";
import { Box, CheckCircle2, Loader2, Trash2, UploadCloud } from "lucide-react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { describeSupabaseError } from "@/components/admin/shared/supabaseError";
import { supabase } from "@/integrations/supabase/client";
import { useProductModel, useProductModelScale, type ScaleMethod } from "@/features/admin/hooks/useProductModel";
import { proposeScaleFactor } from "@/features/admin/lib/objBounds";
import { useI18n } from "@/features/i18n/I18nProvider";
import { ProductBrandingMarks } from "./ProductBrandingMarks";

// R15: the R3F chunk never loads with the rest of the admin bundle — only
// once the panel's preview is opened.
const ProductModelPreview = lazy(() => import("./ProductModelPreview"));

const METHOD_KEY: Record<ScaleMethod, string> = {
  unit_mm: "admin.model.scale.methodUnitMm",
  known_dimension: "admin.model.scale.methodKnownDimension",
  two_point: "admin.model.scale.methodTwoPoint",
};

/**
 * "3D model (.obj)" upload — one file, immediate write, following
 * ProductImagesEditor's pattern (storage object first, then the row).
 * The editor (src/features/editor/**) loads from `model_storage_path`; a
 * product with none shows an empty state there, never a demo mesh.
 *
 * Phase 4a adds the scale confirmation panel (units rulings §1.1): raw
 * dimensions parsed at upload, a reference-variant picker (Q2: defaults to
 * the default variant), the proposed interpretation (spec §7/§16, C2), and
 * two write paths — Confirm or Calibrate by known dimension. Leaving it
 * unconfirmed is simply not doing either; the buyer editor refuses an
 * unconfirmed product (Phase 4b).
 */
export function ProductModelEditor({ productId, modelStoragePath }: { productId: string; modelStoragePath: string | null }) {
  const { t } = useI18n();
  const { upload, remove } = useProductModel(productId);
  const { scale, variants, confirmUnitScale, calibrateKnownDimension, calibrateTwoPoint, markUnconfirmed } = useProductModelScale(productId);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = upload.isPending || remove.isPending;

  const [referenceVariantId, setReferenceVariantId] = useState<string | null>(null);
  const [calibrating, setCalibrating] = useState(false);
  const [knownMm, setKnownMm] = useState("");

  const [previewOpen, setPreviewOpen] = useState(false);
  const [twoPointMode, setTwoPointMode] = useState(false);
  const [pointA, setPointA] = useState<THREE.Vector3 | null>(null);
  const [pointB, setPointB] = useState<THREE.Vector3 | null>(null);
  const [twoPointMm, setTwoPointMm] = useState("");
  const [brandingMarked, setBrandingMarked] = useState<number[]>([]);
  const measuredRaw = pointA && pointB ? pointA.distanceTo(pointB) : null;

  const variantOptions = variants.data ?? [];
  const defaultVariantId = variantOptions.find((v) => v.is_default)?.id ?? variantOptions[0]?.id ?? null;

  useEffect(() => {
    if (referenceVariantId) return;
    setReferenceVariantId(scale.data?.model_scale_reference_variant_id ?? defaultVariantId);
    // Only seed once the data we default from has arrived.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale.data?.model_scale_reference_variant_id, defaultVariantId]);

  // A new or removed file resets confirmation (the `products_reset_model_scale`
  // trigger) — the preview's local picking state has to follow it, or a stale
  // pair of points would measure the wrong geometry.
  useEffect(() => {
    setTwoPointMode(false);
    setPointA(null);
    setPointB(null);
    setTwoPointMm("");
    setCalibrating(false);
    setBrandingMarked([]);
  }, [modelStoragePath]);

  const onError = (error: unknown) => toast.error(describeSupabaseError(error as { message: string; code?: string }));

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".obj")) {
      toast.error(`${file.name}: only .obj files are accepted`);
      return;
    }
    upload.mutate(
      { file, previousPath: modelStoragePath },
      {
        onSuccess: () => toast.success("3D model uploaded"),
        onError,
      },
    );
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const rawBounds = scale.data?.model_raw_bounds ?? null;
  const referenceVariant = variantOptions.find((v) => v.id === referenceVariantId) ?? null;
  const primaryRaw = rawBounds?.primary_raw ?? null;
  const proposal = primaryRaw != null && referenceVariant ? proposeScaleFactor(primaryRaw, referenceVariant.size_primary_mm) : null;

  const confirmed = scale.data?.model_scale_status === "confirmed";
  const modelUrl = modelStoragePath ? supabase.storage.from("product-models").getPublicUrl(modelStoragePath).data.publicUrl : null;

  return (
    <div className="space-y-4" data-testid="model-section">
      {modelStoragePath ? (
        <div className="flex items-center justify-between border border-border p-3" data-testid="model-current">
          <div className="flex items-center gap-2 min-w-0">
            <Box className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            <span className="text-sm text-foreground truncate font-mono">{modelStoragePath.split("/").pop()}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 text-xs" disabled={busy} onClick={() => inputRef.current?.click()}>
              Replace
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              aria-label="Remove 3D model"
              disabled={busy}
              onClick={() =>
                remove.mutate(modelStoragePath, {
                  onSuccess: () => toast.success("3D model removed"),
                  onError,
                })
              }
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          data-testid="model-dropzone"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          className={cn("border border-dashed p-6 text-center cursor-pointer transition-colors border-border hover:border-foreground/50")}
        >
          {upload.isPending ? (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Uploading…
            </div>
          ) : (
            <div className="space-y-1">
              <UploadCloud className="w-5 h-5 mx-auto text-muted-foreground" strokeWidth={1.5} />
              <p className="text-sm text-foreground">Drop a .obj file, or click to choose</p>
            </div>
          )}
        </div>
      )}
      <input
        ref={inputRef}
        data-testid="model-input"
        type="file"
        accept=".obj"
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />

      {modelStoragePath && rawBounds && (
        <div className="space-y-3 border border-border p-3" data-testid="model-scale-panel">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">{t("admin.model.scale.title")}</span>
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium",
                confirmed ? "text-emerald-600" : "text-amber-600",
              )}
              data-testid="model-scale-status"
              data-status={scale.data?.model_scale_status ?? "unconfirmed"}
            >
              {confirmed && <CheckCircle2 className="w-3.5 h-3.5" />}
              {t(confirmed ? "admin.model.scale.statusConfirmed" : "admin.model.scale.statusUnconfirmed")}
            </span>
          </div>

          <p className="text-xs text-muted-foreground font-mono" data-testid="model-scale-raw-dimensions">
            {t("admin.model.scale.rawDimensionsLine", {
              x: (rawBounds.max[0] - rawBounds.min[0]).toFixed(3),
              y: (rawBounds.max[1] - rawBounds.min[1]).toFixed(3),
              z: (rawBounds.max[2] - rawBounds.min[2]).toFixed(3),
            })}
          </p>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            data-testid="model-scale-preview-toggle"
            onClick={() => setPreviewOpen((v) => !v)}
          >
            {t(previewOpen ? "admin.model.scale.hidePreview" : "admin.model.scale.showPreview")}
          </Button>

          {previewOpen && modelUrl && (
            <Suspense fallback={<div className="h-[38rem] max-w-3xl mx-auto flex items-center justify-center text-xs text-muted-foreground border border-border">{t("admin.model.scale.previewLoading")}</div>}>
              <ProductModelPreview
                url={modelUrl}
                picking={twoPointMode}
                highlightIndices={brandingMarked}
                pointA={pointA}
                pointB={pointB}
                onPick={(point) => {
                  if (!pointA) setPointA(point);
                  else if (!pointB) setPointB(point);
                }}
              />
            </Suspense>
          )}

          {confirmed ? (
            <div className="text-sm text-foreground space-y-1">
              <div data-testid="model-scale-factor">{t("admin.model.scale.factorLine", { factor: scale.data!.model_scale_factor!.toFixed(6) })}</div>
              <div className="text-xs text-muted-foreground">
                {scale.data?.model_scale_method ? t(METHOD_KEY[scale.data.model_scale_method]) : null}
                {scale.data?.model_scale_method === "two_point" ? ` · ${t("admin.model.scale.twoPointPrecision")}` : null}
                {referenceVariant ? ` · ${referenceVariant.size_label ?? `${referenceVariant.size_primary_mm} mm`}` : null}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                disabled={markUnconfirmed.isPending}
                data-testid="model-scale-mark-unconfirmed"
                onClick={() =>
                  markUnconfirmed.mutate(undefined, {
                    onSuccess: () => toast.success(t("admin.model.scale.markedUnconfirmed")),
                    onError,
                  })
                }
              >
                {t("admin.model.scale.markUnconfirmed")}
              </Button>
            </div>
          ) : variantOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">{t("admin.model.scale.noVariants")}</p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">{t("admin.model.scale.referenceVariant")}</Label>
                <Select value={referenceVariantId ?? undefined} onValueChange={setReferenceVariantId}>
                  <SelectTrigger className="h-9 text-sm" data-testid="model-scale-reference-variant">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {variantOptions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.size_label ?? `${v.size_primary_mm} mm`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {proposal && referenceVariant && (
                <p className="text-xs text-muted-foreground" data-testid="model-scale-proposal">
                  {proposal.withinBand
                    ? t("admin.model.scale.residualWithinBand", {
                        measured: primaryRaw!.toFixed(3),
                        reference: referenceVariant.size_primary_mm.toFixed(2),
                        residual: `${proposal.residual >= 0 ? "+" : ""}${(proposal.residual * 100).toFixed(2)}%`,
                      })
                    : t("admin.model.scale.proposalOutsideBand", {
                        factor: proposal.factor.toFixed(6),
                        reference: referenceVariant.size_primary_mm.toFixed(2),
                        raw: primaryRaw!.toFixed(3),
                      })}
                </p>
              )}

              {!calibrating && !twoPointMode ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    className="h-8 text-xs"
                    disabled={!proposal || !referenceVariantId || confirmUnitScale.isPending}
                    data-testid="model-scale-confirm-button"
                    onClick={() =>
                      proposal &&
                      referenceVariantId &&
                      confirmUnitScale.mutate(
                        { factor: proposal.factor, referenceVariantId },
                        { onSuccess: () => toast.success(t("admin.model.scale.confirmed")), onError },
                      )
                    }
                  >
                    {t("admin.model.scale.confirm")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    data-testid="model-scale-calibrate-toggle"
                    onClick={() => setCalibrating(true)}
                  >
                    {t("admin.model.scale.calibrate")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    data-testid="model-scale-two-point-toggle"
                    onClick={() => {
                      setTwoPointMode(true);
                      setPreviewOpen(true);
                    }}
                  >
                    {t("admin.model.scale.calibrateTwoPoint")}
                  </Button>
                </div>
              ) : twoPointMode ? (
                <div className="space-y-2 border-t border-border pt-2" data-testid="model-scale-two-point-panel">
                  <p className="text-xs text-muted-foreground" data-testid="two-point-a-status">
                    {t("admin.model.scale.twoPointPointA")}:{" "}
                    {t(pointA ? "admin.model.scale.twoPointSelected" : "admin.model.scale.twoPointNotSelected")}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="two-point-b-status">
                    {t("admin.model.scale.twoPointPointB")}:{" "}
                    {t(pointB ? "admin.model.scale.twoPointSelected" : "admin.model.scale.twoPointNotSelected")}
                  </p>
                  {measuredRaw != null && (
                    <p className="text-sm text-foreground" data-testid="two-point-measured">
                      {t("admin.model.scale.twoPointMeasuredLine", { measured: measuredRaw.toFixed(3) })} · {t("admin.model.scale.twoPointPrecision")}
                    </p>
                  )}
                  <Label className="text-xs">{t("admin.model.scale.twoPointDistanceLabel")}</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={twoPointMm}
                    onChange={(e) => setTwoPointMm(e.target.value)}
                    className="h-8 text-sm"
                    data-testid="model-scale-two-point-input"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      data-testid="model-scale-two-point-clear"
                      onClick={() => {
                        setPointA(null);
                        setPointB(null);
                      }}
                    >
                      {t("admin.model.scale.twoPointClear")}
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      disabled={calibrateTwoPoint.isPending}
                      data-testid="model-scale-two-point-apply"
                      onClick={() => {
                        const known = Number(twoPointMm);
                        if (!Number.isFinite(known) || known <= 0 || !referenceVariantId || measuredRaw == null) {
                          toast.error(t("admin.model.scale.twoPointRequired"));
                          return;
                        }
                        calibrateTwoPoint.mutate(
                          { knownMm: known, measuredRaw, referenceVariantId },
                          {
                            onSuccess: () => {
                              toast.success(t("admin.model.scale.calibrated"));
                              setTwoPointMode(false);
                              setPointA(null);
                              setPointB(null);
                              setTwoPointMm("");
                            },
                            onError,
                          },
                        );
                      }}
                    >
                      {t("admin.model.scale.twoPointApply")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      data-testid="model-scale-two-point-leave-unconfirmed"
                      onClick={() => {
                        setTwoPointMode(false);
                        setPointA(null);
                        setPointB(null);
                        setTwoPointMm("");
                      }}
                    >
                      {t("admin.model.scale.leaveUnconfirmed")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 border-t border-border pt-2">
                  <Label className="text-xs">{t("admin.model.scale.knownDimensionLabel")}</Label>
                  <Input
                    type="number"
                    step="0.001"
                    min="0"
                    value={knownMm}
                    onChange={(e) => setKnownMm(e.target.value)}
                    className="h-8 text-sm"
                    data-testid="model-scale-known-dimension-input"
                  />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="h-8 text-xs"
                      disabled={calibrateKnownDimension.isPending}
                      data-testid="model-scale-apply-calibration"
                      onClick={() => {
                        const known = Number(knownMm);
                        if (!Number.isFinite(known) || known <= 0 || !referenceVariantId || primaryRaw == null) {
                          toast.error(t("admin.model.scale.knownDimensionRequired"));
                          return;
                        }
                        calibrateKnownDimension.mutate(
                          { knownMm: known, primaryRawUnits: primaryRaw, referenceVariantId },
                          {
                            onSuccess: () => {
                              toast.success(t("admin.model.scale.calibrated"));
                              setCalibrating(false);
                              setKnownMm("");
                            },
                            onError,
                          },
                        );
                      }}
                    >
                      {t("admin.model.scale.applyCalibration")}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-xs"
                      data-testid="model-scale-leave-unconfirmed"
                      onClick={() => {
                        setCalibrating(false);
                        setKnownMm("");
                      }}
                    >
                      {t("admin.model.scale.leaveUnconfirmed")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {modelStoragePath && rawBounds && modelUrl && (
        <ProductBrandingMarks
          productId={productId}
          modelUrl={modelUrl}
          confirmedFactor={confirmed ? scale.data?.model_scale_factor ?? null : null}
          marked={brandingMarked}
          onMarkedChange={setBrandingMarked}
          onOpen={() => setPreviewOpen(true)}
        />
      )}
    </div>
  );
}
