import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/I18nProvider";

const Model3DViewer = lazy(() => import("@/components/designer-studio/Model3DViewer"));

// P19: hero points at the actual button OBJ (was /models/d-ring-buckle.obj which
// is a D-ring shape, not a button). P18 B2: `color` is the polished-brass tone the
// editor applies on deep-link so the customise experience opens in the same family
// as what the hero renders.
export const HERO_EDITOR_URL =
  "/designer-studio/editor?model=/models/Polo_Button_10.8.obj&product=metal-button&name=Button&color=%23C9A961";

export default function StudioHero3D() {
  const { t } = useI18n();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof (window as Window & { requestIdleCallback?: (cb: () => void) => void }).requestIdleCallback === "function") {
      (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(
        () => setReady(true),
      );
    } else {
      const id = setTimeout(() => setReady(true), 300);
      return () => clearTimeout(id);
    }
  }, []);

  return (
    <div className="border border-border bg-secondary/40 overflow-hidden rounded-none">
      {/* Frame header — inside the border, single inset (P18 A4). Replaces the floating
          "Interactive 3D" eyebrow which collided with Model3DViewer's own "Drag to rotate…"
          hint at the same top-left corner. */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-background">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          {t("studioIntro.heroFrameTitle")}
        </h3>
      </div>

      {/* Stage — fixed aspect ratio so the frame stays the same shape between poster and 3D states */}
      <div className="relative w-full aspect-[4/3]">
        <div className="absolute inset-0">
          {ready ? (
            <Suspense fallback={<PosterStage />}>
              <Model3DViewer
                hasModel
                modelUrl="/models/Polo_Button_10.8.obj"
                modelType="button"
                showMetadata={false}
              />
            </Suspense>
          ) : (
            <PosterStage />
          )}
        </div>

        {/* CTA — bottom-right, single p-5 inset. Only one customize control on the stage;
            the Model3DViewer renders its own bottom-left "Drag to rotate…" hint when mounted. */}
        <div className="absolute bottom-5 right-5">
          <Link to={HERO_EDITOR_URL}>
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] uppercase tracking-[0.14em] bg-background/90 backdrop-blur-sm rounded-none"
            >
              {t("studioIntro.customizeThis")}
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function PosterStage() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="w-20 h-20 bg-foreground/[0.06] border border-foreground/10 animate-pulse rounded-none" />
    </div>
  );
}
