import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookX } from "lucide-react";
import { useBrochure } from "@/features/flipbook/hooks/useBrochure";
import { useIsMobile } from "@/hooks/use-mobile";
import FlipbookViewer, {
  type FlipbookViewerHandle,
} from "@/features/flipbook/components/FlipbookViewer";
import ViewerToolbar from "@/components/ViewerToolbar";
import ThumbnailStrip from "@/features/flipbook/components/ThumbnailStrip";

const PRELOAD_COUNT = 4;
const SITE_NAME = "Linea Jewelry";

export default function BrochureViewer() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const embedMode = searchParams.get("embed") === "true";

  const { data: brochure, isLoading, error } = useBrochure(slug);
  const isMobile = useIsMobile();

  const [currentSpread, setCurrentSpread] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHotlinks, setShowHotlinks] = useState(false);
  const [thumbnailCollapsed, setThumbnailCollapsed] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<FlipbookViewerHandle>(null);

  const totalPages = brochure?.pages.length ?? 0;
  const maxSpread = isMobile
    ? totalPages - 1
    : Math.max(Math.ceil(totalPages / 2) - 1, 0);
  const canGoBack = currentSpread > 0;
  const canGoForward = currentSpread < maxSpread;

  /* ---- fullscreen ---- */
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ---- document title ---- */
  useEffect(() => {
    if (brochure) document.title = `${brochure.title} | ${SITE_NAME}`;
    return () => {
      document.title = SITE_NAME;
    };
  }, [brochure]);

  /* ---- preload first N images ---- */
  useEffect(() => {
    if (!brochure) return;
    const toLoad = brochure.pages.slice(0, PRELOAD_COUNT);
    let loaded = 0;
    toLoad.forEach((page) => {
      const img = new Image();
      img.onload = img.onerror = () => {
        loaded++;
        if (loaded >= toLoad.length) setImagesReady(true);
      };
      img.src = page.image_url;
    });
  }, [brochure]);

  /* ---- loading ---- */
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-white/50 text-sm animate-pulse">Loading brochure…</div>
      </div>
    );
  }

  /* ---- error / not found ---- */
  if (error || !brochure) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: "#1a1a2e" }}>
        <BookX size={48} className="text-white/30" />
        <div className="text-center">
          <p className="text-white/70 text-lg mb-2">Brochure not found</p>
          <p className="text-white/40 text-sm mb-6">The brochure you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/brochures"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Brochures
          </Link>
        </div>
      </div>
    );
  }

  /* ---- image preload gate ---- */
  if (!imagesReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        <p className="text-white/60 text-sm">{brochure.title}</p>
      </div>
    );
  }

  /* ---- embed mode ---- */
  if (embedMode) {
    return (
      <div ref={containerRef} className="h-screen flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
        <ViewerToolbar
          title={brochure.title}
          currentSpread={currentSpread}
          totalPages={totalPages}
          isMobile={isMobile}
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onPrev={() => viewerRef.current?.goPrev()}
          onNext={() => viewerRef.current?.goNext()}
          zoom={zoom}
          onZoomChange={setZoom}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onJumpToPage={setCurrentSpread}
          showHotlinks={showHotlinks}
          onToggleHotlinks={() => setShowHotlinks((v) => !v)}
          embedMode
        />
        <main className="flex-1 flex items-center justify-center overflow-hidden">
          <FlipbookViewer
            ref={viewerRef}
            brochure={brochure}
            embedMode
            currentSpread={currentSpread}
            onSpreadChange={setCurrentSpread}
            showHotlinks={showHotlinks}
          />
        </main>
      </div>
    );
  }

  /* ---- full viewer ---- */
  return (
    <div ref={containerRef} className="min-h-screen flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
      <header className={`flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0 ${isFullscreen && isMobile ? "hidden" : ""}`}>
        <Link
          to="/brochures"
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Brochures</span>
        </Link>
        <div className="w-24" />
      </header>

      <ViewerToolbar
        title={brochure.title}
        currentSpread={currentSpread}
        totalPages={totalPages}
        isMobile={isMobile}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onPrev={() => viewerRef.current?.goPrev()}
        onNext={() => viewerRef.current?.goNext()}
        zoom={zoom}
        onZoomChange={setZoom}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        onJumpToPage={setCurrentSpread}
        showHotlinks={showHotlinks}
        onToggleHotlinks={() => setShowHotlinks((v) => !v)}
      />

      <main className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div
          className="w-full h-full flex items-center justify-center"
          style={{
            transform: `scale(${zoom / 100})`,
            transition: "transform 200ms ease-out",
            transformOrigin: "center center",
          }}
        >
          <FlipbookViewer
            ref={viewerRef}
            brochure={brochure}
            currentSpread={currentSpread}
            onSpreadChange={setCurrentSpread}
            showHotlinks={showHotlinks}
          />
        </div>
      </main>

      <ThumbnailStrip
        pages={brochure.pages}
        currentSpread={currentSpread}
        onSpreadSelect={setCurrentSpread}
        collapsed={thumbnailCollapsed}
        onToggleCollapse={() => setThumbnailCollapsed((v) => !v)}
        isMobile={isMobile}
        isFullscreen={isFullscreen}
      />
    </div>
  );
}
