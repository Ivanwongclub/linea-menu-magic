import { Suspense, useCallback, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Box } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useI18n } from "@/features/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { EditorModel, type RulerMeasurements } from "./EditorModel";
import type { TextSceneReport } from "./branding/BrandingMeshes";
import type { Layer } from "../lib/recipe";
import { RulerLabels, RulerOverlay, newRulerLabelElements } from "./RulerOverlay";
import { RulerToggle } from "./RulerToggle";
import { OriginalLetteringToggle } from "./OriginalLetteringToggle";
import type { EditorColour } from "../hooks/useEditorProduct";
import type { PickerFinish } from "../hooks/useFinishOptions";
import { GL_SETTINGS } from "../lib/renderSettings";
import { ProceduralStudio } from "./ProceduralStudio";
import { CameraReport } from "./CameraReport";
import { HandleProjector, HandlesOverlay, newHandleBridge, newHandleElements } from "./branding/Handles";
import { useEditorStore } from "../store/useEditorStore";
import { useLogoSources } from "../hooks/useLogoAssets";
import { ManufacturingStrip } from "./ManufacturingStrip";
import type { ProcessThresholds } from "../lib/manufacturing";

interface EditorViewportProps {
  modelStoragePath: string | null;
  scaleStatus: "confirmed" | "unconfirmed";
  scaleFactor: number | null;
  variantScale: number;
  sizePrimaryMm: number;
  sizeLigne: number | null;
  sizeLabel: string | null;
  isMetal: boolean;
  finish: PickerFinish | null;
  colour: EditorColour | null;
  productId: string;
  isCatalogueEditor: boolean;
  ruler: boolean;
  onRulerToggle: () => void;
  layers: Layer[];
  /** The product's marked branding groups (4d); hidden in the buyer view (4j). */
  markedGroupIndices: number[];
  /** Catalogue editors and designer staff may show the original lettering. */
  canShowOriginal: boolean;
  /** The selected finish's process and its tolerances — the strip's thresholds (Phase 5 R3). */
  process: ProcessThresholds | null;
}

function ViewportFallback() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-16 h-16 bg-foreground/[0.06] border border-foreground/10 animate-pulse" />
    </div>
  );
}

/** Never a demo mesh — a product with no uploaded model gets an empty state (v3-review §10). */
function EmptyModelState() {
  const { t } = useI18n();
  return (
    <div className="flex-1 flex items-center justify-center px-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="mx-auto w-12 h-12 flex items-center justify-center border border-foreground">
          <Box className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-light tracking-wide text-foreground">{t("editor.viewport.noModelTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("editor.viewport.noModelBody")}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * A model exists but its scale isn't confirmed (units rulings §1.2): same
 * empty-state shape as no model at all, no canvas either way. Catalogue
 * editors — the only role that can write the CMS's scale panel (Q1) — get a
 * link back to it; everyone else (buyer, designer staff who aren't catalogue
 * editors) sees the plain copy.
 */
function AwaitingSetupState({ productId, isCatalogueEditor }: { productId: string; isCatalogueEditor: boolean }) {
  const { t } = useI18n();
  return (
    <div className="flex-1 flex items-center justify-center px-6" data-testid="editor-awaiting-setup">
      <div className="max-w-sm text-center space-y-4">
        <div className="mx-auto w-12 h-12 flex items-center justify-center border border-foreground">
          <Box className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-light tracking-wide text-foreground">{t("editor.viewport.awaitingSetupTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("editor.viewport.awaitingSetupBody")}</p>
        </div>
        {isCatalogueEditor && (
          <Link
            to={`/admin/products/${productId}`}
            className="inline-block text-xs uppercase tracking-[0.1em] underline underline-offset-4"
          >
            {t("editor.viewport.awaitingSetupCmsLink")}
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * R2: no floating toolbar over the viewport — tools arrive with their
 * phases. R1: idle auto-rotate until the first pointer/wheel interaction,
 * then it stops for good; double-click re-frames via the camera's saved
 * state (set on model load in `EditorModel`).
 */
export function EditorViewport({
  modelStoragePath,
  scaleStatus,
  scaleFactor,
  variantScale,
  sizePrimaryMm,
  sizeLigne,
  sizeLabel,
  isMetal,
  finish,
  colour,
  productId,
  isCatalogueEditor,
  ruler,
  onRulerToggle,
  layers,
  markedGroupIndices,
  canShowOriginal,
  process,
}: EditorViewportProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [modelSizeMm, setModelSizeMm] = useState<number | null>(null);
  const [rulerMeasurements, setRulerMeasurements] = useState<RulerMeasurements | null>(null);
  const [textReport, setTextReport] = useState<TextSceneReport | null>(null);
  const rulerLabels = useRef(newRulerLabelElements());
  const [faceZ, setFaceZ] = useState<number | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);
  const [meshCount, setMeshCount] = useState<{ drawn: number; total: number } | null>(null);
  const onMeshCount = useCallback((drawn: number, total: number) => setMeshCount({ drawn, total }), []);
  const handleBridge = useRef(newHandleBridge());
  const handleElements = useRef(newHandleElements());
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const modelFrame = useEditorStore((s) => s.modelFrame);
  const logoSources = useLogoSources(layers);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId) ?? null;
  const selectedRelief = textReport?.reliefs.find((r) => r.layerId === selectedLayerId) ?? null;
  // Calibration screenshots composite any DOM over the canvas; `?calibration=1` hides the viewport chrome.
  const calibration = useSearchParams()[0].get("calibration") === "1";

  if (!modelStoragePath) {
    return <EmptyModelState />;
  }

  if (scaleStatus !== "confirmed" || scaleFactor == null) {
    return <AwaitingSetupState productId={productId} isCatalogueEditor={isCatalogueEditor} />;
  }

  const url = supabase.storage.from("product-models").getPublicUrl(modelStoragePath).data.publicUrl;

  // Transparent canvas over the site's secondary token: the backdrop is the
  // design system's own colour, never tone-mapped (R2).
  return (
    <>
    <div
      className="relative flex-1 min-h-0 overflow-hidden bg-secondary"
      data-testid="editor-viewport"
      data-model-size-mm={modelSizeMm != null ? modelSizeMm.toFixed(2) : undefined}
      // Scene read-backs for the text scenarios: the rendered glyphs and the no-mirroring check.
      data-glyph-count={textReport?.glyphMeshCount}
      data-logo-count={textReport?.logoMeshCount}
      data-logos={textReport ? JSON.stringify(textReport.logos) : undefined}
      // Drawn part meshes vs the file's groups: the buyer view hides the marked branding (4j).
      data-model-mesh-count={meshCount?.drawn}
      data-face-z={faceZ ?? undefined}
      // Face-frame centres of the marked branding groups (4j): what Add text's arc position is derived from.
      data-marked-centres={modelFrame?.markedGlyphCentres.length ? JSON.stringify(modelFrame.markedGlyphCentres.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)])) : undefined}
      data-model-mesh-total={meshCount?.total}
      data-min-world-determinant={textReport?.minWorldDeterminant}
      data-glyphs={textReport ? JSON.stringify(textReport.glyphs) : undefined}
      // What each layer's relief actually became on screen (Phase 5 R7).
      data-reliefs={textReport ? JSON.stringify(textReport.reliefs) : undefined}
    >
      <Suspense fallback={<ViewportFallback />}>
        <Canvas
          camera={{ fov: 35, position: [20, 20, 60] }}
          dpr={[1, 2]}
          gl={GL_SETTINGS}
          onDoubleClick={() => controlsRef.current?.reset()}
        >
          <ProceduralStudio />
          <CameraReport />
          <EditorModel
            url={url}
            scaleFactor={scaleFactor}
            variantScale={variantScale}
            sizePrimaryMm={sizePrimaryMm}
            isMetal={isMetal}
            finish={finish}
            colour={colour}
            controlsRef={controlsRef}
            onModelSizeMm={setModelSizeMm}
            onRulerMeasurements={ruler ? setRulerMeasurements : undefined}
            onFaceZ={setFaceZ}
            markedGroupIndices={markedGroupIndices}
            hideMarked={!(canShowOriginal && showOriginal)}
            onMeshCount={onMeshCount}
            layers={layers}
            logoSources={logoSources}
            onTextReport={setTextReport}
          />
          {ruler && rulerMeasurements && (
            <RulerOverlay
              measurements={rulerMeasurements}
              labels={rulerLabels}
              obstacles={handleBridge}
              layer={selectedLayer}
              faceZ={faceZ ?? rulerMeasurements.maxZ}
              relief={selectedRelief}
            />
          )}
          {!calibration && faceZ != null && (
            <HandleProjector layer={selectedLayer} faceZ={faceZ} bridge={handleBridge} elements={handleElements} />
          )}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            // Selecting a layer is an interaction too: nothing turns under a handle drag (4i).
            autoRotate={autoRotate && !selectedLayerId}
            autoRotateSpeed={0.6}
            onStart={() => setAutoRotate(false)}
          />
        </Canvas>
      </Suspense>
      {!calibration && faceZ != null && selectedLayer && (
        <HandlesOverlay key={selectedLayer.id} layer={selectedLayer} bridge={handleBridge} elements={handleElements} />
      )}
      {ruler && rulerMeasurements && (
        <RulerLabels measurements={rulerMeasurements} sizeLigne={sizeLigne} sizeLabel={sizeLabel} labels={rulerLabels} layer={selectedLayer} relief={selectedRelief} />
      )}
      {!calibration && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
          {canShowOriginal && markedGroupIndices.length > 0 && (
            <OriginalLetteringToggle active={showOriginal} onToggle={() => setShowOriginal((v) => !v)} />
          )}
          <RulerToggle active={ruler} onToggle={onRulerToggle} />
        </div>
      )}
      </div>
      {/* The manufacturing strip is chrome: the calibration screenshots keep the canvas they were measured on. */}
      {!calibration && (
        <ManufacturingStrip layers={layers} process={process} faceRadiusMm={modelSizeMm != null ? modelSizeMm / 2 : null} logoSources={logoSources} />
      )}
    </>
  );
}
