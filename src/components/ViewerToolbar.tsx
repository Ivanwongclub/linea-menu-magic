import { useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Share2,
} from "lucide-react";
import { toast } from "sonner";

interface ViewerToolbarProps {
  title: string;
  currentSpread: number;
  totalPages: number;
  isMobile: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  onPrev: () => void;
  onNext: () => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const ZOOM_MIN = 50;
const ZOOM_MAX = 200;
const ZOOM_STEP = 25;

const ViewerToolbar = ({
  title,
  currentSpread,
  totalPages,
  isMobile,
  canGoBack,
  canGoForward,
  onPrev,
  onNext,
  zoom,
  onZoomChange,
  isFullscreen,
  onToggleFullscreen,
}: ViewerToolbarProps) => {
  const leftPage = isMobile
    ? currentSpread + 1
    : currentSpread * 2 + 1;
  const rightPage = isMobile
    ? currentSpread + 1
    : Math.min(currentSpread * 2 + 2, totalPages);

  const pageLabel = isMobile || leftPage === rightPage
    ? `Page ${leftPage} of ${totalPages}`
    : `Pages ${leftPage}–${rightPage} of ${totalPages}`;

  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(zoom + ZOOM_STEP, ZOOM_MAX));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(zoom - ZOOM_STEP, ZOOM_MIN));
  }, [zoom, onZoomChange]);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.success("Link copied!");
    }).catch(() => {
      toast.error("Failed to copy link");
    });
  }, []);

  const btnBase =
    "w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div
      className="flex items-center justify-between px-4 py-2 shrink-0 select-none"
      style={{ backgroundColor: "rgba(15, 15, 26, 0.9)" }}
    >
      {/* Left: title + page indicator */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <span className="text-white/90 text-sm font-medium truncate max-w-[180px] hidden sm:inline">
          {title}
        </span>
        <span className="text-white/50 text-xs whitespace-nowrap">{pageLabel}</span>
      </div>

      {/* Center: nav buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!canGoBack}
          className={`${btnBase} text-white`}
          aria-label="Previous page"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          onClick={onNext}
          disabled={!canGoForward}
          className={`${btnBase} text-white`}
          aria-label="Next page"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Right: zoom, fullscreen, share */}
      <div className="flex items-center gap-1 flex-1 justify-end">
        <button
          onClick={handleZoomOut}
          disabled={zoom <= ZOOM_MIN}
          className={`${btnBase} text-white`}
          aria-label="Zoom out"
        >
          <ZoomOut size={16} />
        </button>
        <span className="text-white/70 text-xs w-10 text-center tabular-nums">
          {zoom}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= ZOOM_MAX}
          className={`${btnBase} text-white`}
          aria-label="Zoom in"
        >
          <ZoomIn size={16} />
        </button>

        <div className="w-px h-4 bg-white/15 mx-1" />

        <button
          onClick={onToggleFullscreen}
          className={`${btnBase} text-white`}
          aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        >
          {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>

        <button
          onClick={handleShare}
          className={`${btnBase} text-white`}
          aria-label="Share"
        >
          <Share2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default ViewerToolbar;
