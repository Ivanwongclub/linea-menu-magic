import { Suspense, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Box } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { supabase } from "@/integrations/supabase/client";
import { StudioEnvironment } from "./StudioEnvironment";
import { EditorModel } from "./EditorModel";
import type { EditorColour } from "../hooks/useEditorProduct";
import type { PickerFinish } from "../hooks/useFinishOptions";

interface EditorViewportProps {
  modelStoragePath: string | null;
  sizePrimaryMm: number;
  isMetal: boolean;
  finish: PickerFinish | null;
  colour: EditorColour | null;
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
 * R2: no floating toolbar over the viewport — tools arrive with their
 * phases. R1: idle auto-rotate until the first pointer/wheel interaction,
 * then it stops for good; double-click re-frames via the camera's saved
 * state (set on model load in `EditorModel`).
 */
export function EditorViewport({ modelStoragePath, sizePrimaryMm, isMetal, finish, colour }: EditorViewportProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const [autoRotate, setAutoRotate] = useState(true);

  if (!modelStoragePath) {
    return <EmptyModelState />;
  }

  const url = supabase.storage.from("product-models").getPublicUrl(modelStoragePath).data.publicUrl;

  return (
    <div className="relative flex-1 bg-secondary/20">
      <Suspense fallback={<ViewportFallback />}>
        <Canvas
          camera={{ fov: 35, position: [20, 20, 60] }}
          dpr={[1, 2]}
          onDoubleClick={() => controlsRef.current?.reset()}
        >
          <StudioEnvironment />
          <EditorModel url={url} sizePrimaryMm={sizePrimaryMm} isMetal={isMetal} finish={finish} colour={colour} controlsRef={controlsRef} />
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            minDistance={sizePrimaryMm * 0.8 || 5}
            maxDistance={sizePrimaryMm * 12 || 400}
            autoRotate={autoRotate}
            autoRotateSpeed={0.6}
            onStart={() => setAutoRotate(false)}
          />
        </Canvas>
      </Suspense>
    </div>
  );
}
