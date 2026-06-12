import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
    <div className="relative w-full aspect-[4/3] border border-border bg-secondary/40 overflow-hidden">
      {ready ? (
        <Suspense fallback={<Poster />}>
          <Model3DViewer
            hasModel
            modelUrl="/models/d-ring-buckle.obj"
            modelType="button"
          />
        </Suspense>
      ) : (
        <Poster />
      )}
      <div className="absolute bottom-3 right-3 pointer-events-none">
        <Link to={HERO_EDITOR_URL} className="pointer-events-auto">
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] uppercase tracking-[0.14em] bg-background/90 backdrop-blur-sm"
          >
            {t("studioIntro.customizeThis")}
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Poster() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
      <div className="w-20 h-20 rounded-full bg-foreground/[0.06] border border-foreground/10 animate-pulse" />
      <p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/50">
        Interactive 3D
      </p>
    </div>
  );
}
