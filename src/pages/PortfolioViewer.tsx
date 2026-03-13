import { useState, useCallback, useRef, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBrochure } from "@/hooks/useBrochure";
import { useIsMobile } from "@/hooks/use-mobile";
import FlipbookViewer from "@/components/FlipbookViewer";
import ViewerToolbar from "@/components/ViewerToolbar";
import ThumbnailStrip from "@/components/ThumbnailStrip";

const PortfolioViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { brochure, loading, error } = useBrochure(id);
  const isMobile = useIsMobile();
  const [currentSpread, setCurrentSpread] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-white/50 text-sm animate-pulse">Loading brochure…</div>
      </div>
    );
  }

  if (error || !brochure) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-center">
          <p className="text-white/70 text-lg mb-4">{error ?? "Brochure not found"}</p>
          <Link to="/portfolio" className="text-white underline underline-offset-4 text-sm hover:text-white/80">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: "#1a1a2e" }}
    >
      {/* Top header with back link */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 shrink-0">
        <Link
          to="/portfolio"
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Portfolio
        </Link>
        <div className="w-24" />
      </header>

      {/* Toolbar */}
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
      />

      {/* Flipbook area with zoom */}
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
          />
        </div>
      </main>

      {/* Thumbnail strip */}
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
