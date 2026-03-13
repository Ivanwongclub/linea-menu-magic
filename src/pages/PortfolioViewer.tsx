import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, BookX, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { useBrochure } from "@/hooks/useBrochure";
import { useIsMobile } from "@/hooks/use-mobile";
import FlipbookViewer from "@/components/FlipbookViewer";
import ViewerToolbar from "@/components/ViewerToolbar";
import ThumbnailStrip from "@/components/ThumbnailStrip";

const PRELOAD_COUNT = 4;

const PortfolioViewer = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const { brochure, loading, error } = useBrochure(id);
  const isMobile = useIsMobile();
  const [currentSpread, setCurrentSpread] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [showHotlinks, setShowHotlinks] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const maxSpread = brochure
    ? isMobile
      ? brochure.pages.length - 1
      : Math.ceil(brochure.pages.length / 2) - 1
    : 0;

  const canGoBack = currentSpread > 0;
  const canGoForward = currentSpread < maxSpread;

  const goNext = useCallback(() => {
    if (canGoForward) setCurrentSpread((s) => s + 1);
  }, [canGoForward]);

  const goPrev = useCallback(() => {
    if (canGoBack) setCurrentSpread((s) => s - 1);
  }, [canGoBack]);

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

  useEffect(() => {
    if (brochure) {
      document.title = `${brochure.title} | FlipBook`;
    }
    return () => { document.title = "Portfolio — Digital Brochure Viewer"; };
  }, [brochure]);

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
      img.src = page.imageUrl;
    });
  }, [brochure]);

  useEffect(() => {
    if (!brochure) return;
    const indices = isMobile
      ? [currentSpread - 1, currentSpread + 1]
      : [currentSpread * 2 - 2, currentSpread * 2 - 1, currentSpread * 2 + 2, currentSpread * 2 + 3];
    indices.forEach((i) => {
      if (i >= 0 && i < brochure.pages.length) {
        const img = new Image();
        img.src = brochure.pages[i].imageUrl;
      }
    });
  }, [currentSpread, brochure, isMobile]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-white/50 text-sm animate-pulse">Loading brochure…</div>
      </div>
    );
  }

  if (error || !brochure) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6" style={{ backgroundColor: "#1a1a2e" }}>
        <BookX size={48} className="text-white/30" />
        <div className="text-center">
          <p className="text-white/70 text-lg mb-2">{error ?? "Brochure not found"}</p>
          <p className="text-white/40 text-sm mb-6">The brochure you're looking for doesn't exist or has been removed.</p>
          <Link
            to="/portfolio"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  if (!imagesReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
        <p className="text-white/60 text-sm">{brochure.title}</p>
      </div>
    );
  }

  // Embed mode page indicator
  const leftPage = isMobile ? currentSpread + 1 : currentSpread * 2 + 1;
  const rightPage = isMobile ? currentSpread + 1 : Math.min(currentSpread * 2 + 2, brochure.pages.length);
  const embedPageLabel = isMobile || leftPage === rightPage
    ? `${leftPage} / ${brochure.pages.length}`
    : `${leftPage}–${rightPage} / ${brochure.pages.length}`;

  const fullViewerUrl = `${window.location.origin}/portfolio/view/${id}`;

  if (isEmbed) {
    return (
      <div
        ref={containerRef}
        className="h-screen flex flex-col"
        style={{ backgroundColor: "#1a1a2e" }}
      >
        {/* Slim embed toolbar */}
        <div
          className="flex items-center justify-between px-3 py-1.5 shrink-0 select-none"
          style={{ backgroundColor: "rgba(15, 15, 26, 0.9)" }}
        >
          <div className="flex items-center gap-1">
            <button
              onClick={goPrev}
              disabled={!canGoBack}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-white/50 text-xs tabular-nums px-1">{embedPageLabel}</span>
            <button
              onClick={goNext}
              disabled={!canGoForward}
              className="min-w-[36px] min-h-[36px] flex items-center justify-center rounded-md text-white hover:bg-white/10 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <a
            href={fullViewerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors"
          >
            Open full version
            <ExternalLink size={12} />
          </a>
        </div>

        <main className="flex-1 flex items-center justify-center overflow-hidden">
          <FlipbookViewer
            pages={brochure.pages}
            currentSpread={currentSpread}
            onSpreadChange={setCurrentSpread}
            showHotlinks={false}
          />
        </main>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      <header className={`flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0 ${isFullscreen && isMobile ? "hidden" : ""}`}>
        <Link
          to="/portfolio"
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Portfolio</span>
        </Link>
        <div className="w-24" />
      </header>

      <ViewerToolbar
        title={brochure.title}
        currentSpread={currentSpread}
        totalPages={brochure.pages.length}
        isMobile={isMobile}
        canGoBack={canGoBack}
        canGoForward={canGoForward}
        onPrev={goPrev}
        onNext={goNext}
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
            pages={brochure.pages}
            currentSpread={currentSpread}
            onSpreadChange={setCurrentSpread}
            showHotlinks={showHotlinks}
          />
        </div>
      </main>

      <ThumbnailStrip
        pages={brochure.pages}
        currentSpread={currentSpread}
        isMobile={isMobile}
        onNavigate={setCurrentSpread}
      />
    </div>
  );
};

export default PortfolioViewer;
