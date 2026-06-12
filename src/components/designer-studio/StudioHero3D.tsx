import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/I18nProvider";

const Model3DViewer = lazy(() => import("@/components/designer-studio/Model3DViewer"));

export const HERO_EDITOR_URL =
  "/designer-studio/editor?model=/models/d-ring-buckle.obj&product=metal-button&name=Button";

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
    <div className="relative w-full aspect-[4/3] border border-border bg-secondary/40 overflow-hidden rounded-none">
      {/* Stage content (poster or 3D) */}
      <div className="absolute inset-0">
        {ready ? (
          <Suspense fallback={<PosterStage />}>
            <Model3DViewer
              hasModel
              modelUrl="/models/d-ring-buckle.obj"
              modelType="button"
            />
          </Suspense>
        ) : (
          <PosterStage />
        )}
      </div>

      {/* Eyebrow — top-left, single inset */}
      <div className="absolute top-5 left-5 right-5 pointer-events-none">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Interactive 3D
        </p>
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
  );
}

function PosterStage() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="w-20 h-20 bg-foreground/[0.06] border border-foreground/10 animate-pulse rounded-none" />
    </div>
  );
}
