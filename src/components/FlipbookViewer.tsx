import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import HotlinkOverlay from "@/components/HotlinkOverlay";
import type { Page } from "@/types/flipbook";

interface FlipbookViewerProps {
  pages: Page[];
  currentSpread: number;
  onSpreadChange: (spread: number) => void;
  showHotlinks?: boolean;
}

const ANIMATION_DURATION = 380;

function PageImage({ page, showHotlinks = false }: { page: Page | null; showHotlinks?: boolean }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  // Reset status when page changes
  useEffect(() => {
    setStatus("loading");
  }, [page?.imageUrl]);

  if (!page) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm bg-neutral-50">
        No page
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {/* Skeleton loader */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}
      {/* Error state */}
      {status === "error" && (
        <div className="absolute inset-0 bg-neutral-100 flex flex-col items-center justify-center gap-2 text-neutral-400">
          <ImageOff size={24} />
          <span className="text-xs">Page unavailable</span>
        </div>
      )}
      <img
        src={page.imageUrl}
        alt={`Page ${page.pageNumber}`}
        className={`w-full h-full object-cover transition-opacity duration-200 ${status === "loaded" ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
      />
      {page.links && page.links.length > 0 && status === "loaded" && (
        <HotlinkOverlay links={page.links} showHints={showHotlinks} />
      )}
    </div>
  );
}

const FlipbookViewer = ({ pages, currentSpread, onSpreadChange }: FlipbookViewerProps) => {
  const isMobile = useIsMobile();
  const [displayedSpread, setDisplayedSpread] = useState(currentSpread);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");
  const [animationPhase, setAnimationPhase] = useState<"idle" | "flipping">("idle");
  const prefersReducedMotion = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const maxSpread = isMobile
    ? pages.length - 1
    : Math.ceil(pages.length / 2) - 1;

  const canGoBack = currentSpread > 0;
  const canGoForward = currentSpread < maxSpread;

  const goNext = useCallback(() => {
    if (isAnimating || !canGoForward) return;
    onSpreadChange(currentSpread + 1);
  }, [isAnimating, canGoForward, currentSpread, onSpreadChange]);

  const goPrev = useCallback(() => {
    if (isAnimating || !canGoBack) return;
    onSpreadChange(currentSpread - 1);
  }, [isAnimating, canGoBack, currentSpread, onSpreadChange]);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowRight":
        case "ArrowDown":
          goNext();
          break;
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
        case "ArrowUp":
          goPrev();
          break;
        case "Home":
          if (!isAnimating && currentSpread !== 0) onSpreadChange(0);
          break;
        case "End":
          if (!isAnimating && currentSpread !== maxSpread) onSpreadChange(maxSpread);
          break;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goNext, goPrev, isAnimating, currentSpread, maxSpread, onSpreadChange]);

  // Touch/swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (delta < -50) goNext();
    else if (delta > 50) goPrev();
  }, [goNext, goPrev]);

  // Detect spread changes from parent and trigger animation
  useEffect(() => {
    if (currentSpread === displayedSpread) return;

    if (prefersReducedMotion.current) {
      setDisplayedSpread(currentSpread);
      return;
    }

    const direction = currentSpread > displayedSpread ? "forward" : "backward";
    setAnimationDirection(direction);
    setIsAnimating(true);
    setAnimationPhase("flipping");

    const timer = setTimeout(() => {
      setDisplayedSpread(currentSpread);
      setIsAnimating(false);
      setAnimationPhase("idle");
    }, ANIMATION_DURATION);

    return () => clearTimeout(timer);
  }, [currentSpread]); // intentionally only depend on currentSpread

  if (isMobile) {
    const page = pages[currentSpread] ?? null;
    return (
      <div
        ref={containerRef}
        className="relative flex items-center justify-center w-full h-full p-4"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="relative bg-white rounded-lg overflow-hidden"
          style={{
            aspectRatio: "1 / 1.41",
            width: "min(90vw, 500px)",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          }}
        >
          <PageImage page={page} />
        </div>
        {canGoBack && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors z-40"
          >
            <ChevronLeft size={18} />
          </button>
        )}
        {canGoForward && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/20 hover:bg-black/30 flex items-center justify-center text-white transition-colors z-40"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    );
  }

  // Spread indices
  const newLeftIndex = currentSpread * 2;
  const newRightIndex = currentSpread * 2 + 1;
  const oldLeftIndex = displayedSpread * 2;
  const oldRightIndex = displayedSpread * 2 + 1;

  const newLeftPage = pages[newLeftIndex] ?? null;
  const newRightPage = pages[newRightIndex] ?? null;
  const oldLeftPage = pages[oldLeftIndex] ?? null;
  const oldRightPage = pages[oldRightIndex] ?? null;

  // During forward: the old right page flips left, revealing new spread underneath
  // During backward: the old left page flips right, revealing new spread underneath

  const bookStyle: React.CSSProperties = {
    aspectRatio: "1.41 / 1",
    height: "min(75vh, 620px)",
    boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
  };

  return (
    <div
      ref={containerRef}
      className="group relative flex items-center justify-center w-full h-full p-8"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="relative bg-white rounded-lg"
        style={{ ...bookStyle, perspective: "1800px" }}
      >
        {/* Base layer: the NEW spread (revealed underneath the flipping page) */}
        <div className="absolute inset-0 flex rounded-lg overflow-hidden">
          <div className="w-1/2 h-full">
            <PageImage page={isAnimating ? newLeftPage : (pages[displayedSpread * 2] ?? null)} />
          </div>
          <div className="w-1/2 h-full">
            <PageImage page={isAnimating ? newRightPage : (pages[displayedSpread * 2 + 1] ?? null)} />
          </div>
        </div>

        {/* Flipping page overlay — only visible during animation */}
        {isAnimating && animationPhase === "flipping" && animationDirection === "forward" && (
          // Forward: old right page flips from right to left (rotateY 0 → -180)
          // Origin is the left edge of the right page (center of the book)
          <div
            className="absolute top-0 right-0 w-1/2 h-full z-20"
            style={{
              transformOrigin: "left center",
              animation: `flipForward ${ANIMATION_DURATION}ms ease-in-out forwards`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Front face: old right page */}
            <div
              className="absolute inset-0 overflow-hidden rounded-r-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <PageImage page={oldRightPage} />
              {/* Shadow overlay that intensifies during flip */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to left, rgba(0,0,0,0.03), rgba(0,0,0,0.15))",
                  animation: `shadowIn ${ANIMATION_DURATION}ms ease-in-out forwards`,
                }}
              />
            </div>
            {/* Back face: new left page (mirrored) */}
            <div
              className="absolute inset-0 overflow-hidden rounded-l-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <PageImage page={newLeftPage} />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.03))",
                }}
              />
            </div>
          </div>
        )}

        {isAnimating && animationPhase === "flipping" && animationDirection === "backward" && (
          // Backward: old left page flips from left to right (rotateY 0 → 180)
          // Origin is the right edge of the left page (center of the book)
          <div
            className="absolute top-0 left-0 w-1/2 h-full z-20"
            style={{
              transformOrigin: "right center",
              animation: `flipBackward ${ANIMATION_DURATION}ms ease-in-out forwards`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Front face: old left page */}
            <div
              className="absolute inset-0 overflow-hidden rounded-l-lg"
              style={{ backfaceVisibility: "hidden" }}
            >
              <PageImage page={oldLeftPage} />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.15))",
                  animation: `shadowIn ${ANIMATION_DURATION}ms ease-in-out forwards`,
                }}
              />
            </div>
            {/* Back face: new right page (mirrored) */}
            <div
              className="absolute inset-0 overflow-hidden rounded-r-lg"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(-180deg)",
              }}
            >
              <PageImage page={newRightPage} />
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to left, rgba(0,0,0,0.15), rgba(0,0,0,0.03))",
                }}
              />
            </div>
          </div>
        )}

        {/* Center spine shadow — always on top */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 h-full pointer-events-none z-30"
          style={{
            width: "30px",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 40%, transparent 50%, rgba(0,0,0,0.02) 60%, rgba(0,0,0,0.08) 100%)",
          }}
        />
      </div>

      {/* Navigation arrows — visible on hover (desktop) */}
      {canGoBack && (
        <button
          onClick={goPrev}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-40"
        >
          <ChevronLeft size={20} />
        </button>
      )}
      {canGoForward && (
        <button
          onClick={goNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all opacity-0 group-hover:opacity-100 z-40"
        >
          <ChevronRight size={20} />
        </button>
      )}

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes flipForward {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(-180deg); }
        }
        @keyframes flipBackward {
          0% { transform: rotateY(0deg); }
          100% { transform: rotateY(180deg); }
        }
        @keyframes shadowIn {
          0% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default FlipbookViewer;
