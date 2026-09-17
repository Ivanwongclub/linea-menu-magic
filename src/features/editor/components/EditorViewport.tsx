import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Box } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useI18n } from "@/features/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { EditorModel, type RulerMeasurements } from "./EditorModel";
import type { TextSceneReport } from "./branding/TextLayerMeshes";
import type { TextLayer } from "../lib/recipe";
import { RulerLabels, RulerOverlay, type RulerLabelElements } from "./RulerOverlay";
import { RulerToggle } from "./RulerToggle";
import type { EditorColour } from "../hooks/useEditorProduct";
import type { PickerFinish } from "../hooks/useFinishOptions";
import { GL_SETTINGS } from "../lib/renderSettings";
import { ProceduralStudio } from "./ProceduralStudio";
import { CameraReport } from "./CameraReport";

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
  layers: TextLayer[];
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
}: EditorViewportProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [modelSizeMm, setModelSizeMm] = useState<number | null>(null);
  const [rulerMeasurements, setRulerMeasurements] = useState<RulerMeasurements | null>(null);
  const [textReport, setTextReport] = useState<TextSceneReport | null>(null);
  const rulerLabels = useRef<RulerLabelElements>({ diameter: null, thickness: null });
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
    <div
      className="relative flex-1 min-h-0 overflow-hidden bg-secondary"
      data-testid="editor-viewport"
      data-model-size-mm={modelSizeMm != null ? modelSizeMm.toFixed(2) : undefined}
      // Scene read-backs for the text scenarios: the rendered glyphs and the no-mirroring check.
      data-glyph-count={textReport?.glyphMeshCount}
      data-min-world-determinant={textReport?.minWorldDeterminant}
      data-glyphs={textReport ? JSON.stringify(textReport.glyphs) : undefined}
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
            layers={layers}
            onTextReport={setTextReport}
          />
          {ruler && rulerMeasurements && <RulerOverlay measurements={rulerMeasurements} labels={rulerLabels} />}
          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.08}
            autoRotate={autoRotate}
            autoRotateSpeed={0.6}
            onStart={() => setAutoRotate(false)}
          />
        </Canvas>
      </Suspense>
      {ruler && rulerMeasurements && (
        <RulerLabels measurements={rulerMeasurements} sizeLigne={sizeLigne} sizeLabel={sizeLabel} labels={rulerLabels} />
      )}
      {!calibration && <RulerToggle active={ruler} onToggle={onRulerToggle} />}
    </div>
  );
}
