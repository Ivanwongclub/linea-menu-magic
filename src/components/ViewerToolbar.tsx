import { useCallback, useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Share2,
  MousePointerClick,
  Code2,
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
  onJumpToPage?: (spread: number) => void;
  showHotlinks: boolean;
  onToggleHotlinks: () => void;
  embedMode?: boolean;
  onEmbed?: () => void;
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
  onJumpToPage,
  showHotlinks,
  onToggleHotlinks,
  embedMode,
  onEmbed,
}: ViewerToolbarProps) => {
  const [showPageJump, setShowPageJump] = useState(false);
  const [pageInput, setPageInput] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const openPageJump = useCallback(() => {
    setPageInput(String(leftPage));
    setShowPageJump(true);
    setTimeout(() => inputRef.current?.select(), 50);
  }, [leftPage]);

  const closePageJump = useCallback(() => {
    setShowPageJump(false);
    setPageInput("");
  }, []);

  const handlePageJump = useCallback(() => {
    const num = parseInt(pageInput, 10);
    if (isNaN(num) || num < 1 || num > totalPages) {
      toast.error(`Enter a page between 1 and ${totalPages}`);
      return;
    }
    const spread = isMobile ? num - 1 : Math.floor((num - 1) / 2);
    onJumpToPage?.(spread);
    closePageJump();
  }, [pageInput, totalPages, isMobile, onJumpToPage, closePageJump]);

  // Close on Escape
  useEffect(() => {
    if (!showPageJump) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePageJump();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [showPageJump, closePageJump]);

  // Close on click outside
  useEffect(() => {
    if (!showPageJump) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closePageJump();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showPageJump, closePageJump]);

  const btnBase =
    "min-w-[44px] min-h-[44px] md:min-w-[32px] md:min-h-[32px] w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div
      className="flex items-center justify-between px-4 py-2 shrink-0 select-none"
      style={{ backgroundColor: "rgba(15, 15, 26, 0.9)" }}
    >
      {/* Left: title + page indicator */}
      <div className="flex items-center gap-3 min-w-0 flex-1 relative">
        <span className="text-white/90 text-sm font-medium truncate max-w-[180px] hidden md:inline">
          {title}
        </span>
        <button
          onClick={openPageJump}
          className="text-white/50 text-xs whitespace-nowrap hover:text-white/80 transition-colors cursor-pointer underline-offset-2 hover:underline"
        >
          {pageLabel}
        </button>

        {/* Page jump popover */}
        {showPageJump && (
          <div
            ref={popoverRef}
            className="absolute top-full left-0 mt-2 z-50 rounded-lg p-3 flex items-center gap-2 animate-scale-in"
            style={{ backgroundColor: "rgba(15, 15, 26, 0.95)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            <label className="text-white/60 text-xs whitespace-nowrap">Go to page</label>
            <input
              ref={inputRef}
              type="number"
              min={1}
              max={totalPages}
              value={pageInput}
              onChange={(e) => setPageInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handlePageJump(); }}
              className="w-16 h-7 rounded bg-white/10 border border-white/20 text-white text-xs text-center outline-none focus:border-white/40"
            />
            <button
              onClick={handlePageJump}
              className="h-7 px-3 rounded bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
            >
              Go
            </button>
          </div>
        )}
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
          onClick={onToggleHotlinks}
          className={`${btnBase} ${showHotlinks ? "text-indigo-400 bg-white/10" : "text-white"}`}
          aria-label={showHotlinks ? "Hide hotlinks" : "Show hotlinks"}
        >
          <MousePointerClick size={16} />
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
