import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { BrochureWithPages, Page } from "../types";
import PageHotlinks from "./PageHotlinks";

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */

interface FlipbookViewerProps {
  brochure: BrochureWithPages;
  embedMode?: boolean;
  showHotlinks?: boolean;
  editHints?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Reduced-motion helper                                              */
/* ------------------------------------------------------------------ */

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/* ------------------------------------------------------------------ */
/*  Single page renderer                                               */
/* ------------------------------------------------------------------ */

function PageSlot({ page }: { page: Page | undefined }) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading"
  );

  // Reset when the page changes
  useEffect(() => {
    setStatus("loading");
  }, [page?.id]);

  if (!page) {
    return <div className="flex-1 h-full bg-white" />;
  }

  return (
    <div className="flex-1 h-full relative bg-white overflow-hidden">
      {/* Skeleton pulse while loading */}
      {status === "loading" && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}

      {/* Error fallback */}
      {status === "error" && (
        <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-2">
          <ImageOff size={28} className="text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            Page unavailable
          </span>
        </div>
      )}

      {/* The actual image */}
      <img
        src={page.image_url}
        alt={`Page ${page.page_number}`}
        onLoad={() => setStatus("loaded")}
        onError={() => setStatus("error")}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          status === "loaded" ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main viewer                                                        */
/* ------------------------------------------------------------------ */

export default function FlipbookViewer({
  brochure,
  embedMode = false,
}: FlipbookViewerProps) {
  const isMobile = useIsMobile();
  const containerRef = useRef<HTMLDivElement>(null);

  const pages = brochure.pages;
  const totalPages = pages.length;

  /* ---- spread logic ---- */
  const maxSpread = isMobile
    ? totalPages - 1
    : Math.max(Math.ceil(totalPages / 2) - 1, 0);

  const [currentSpread, setCurrentSpread] = useState(0);
  const [turning, setTurning] = useState<"forward" | "backward" | null>(null);

  const canGoBack = currentSpread > 0;
  const canGoForward = currentSpread < maxSpread;

  /* ---- visible pages ---- */
  const { leftPage, rightPage } = useMemo(() => {
    if (isMobile) {
      return { leftPage: pages[currentSpread], rightPage: undefined };
    }
    return {
      leftPage: pages[currentSpread * 2],
      rightPage: pages[currentSpread * 2 + 1],
    };
  }, [currentSpread, isMobile, pages]);

  /* ---- navigation ---- */
  const turnDuration = prefersReducedMotion() ? 0 : 380;

  const goNext = useCallback(() => {
    if (!canGoForward || turning) return;
    if (turnDuration === 0) {
      setCurrentSpread((s) => s + 1);
      return;
    }
    setTurning("forward");
    setTimeout(() => {
      setCurrentSpread((s) => s + 1);
      setTurning(null);
    }, turnDuration);
  }, [canGoForward, turning, turnDuration]);

  const goPrev = useCallback(() => {
    if (!canGoBack || turning) return;
    if (turnDuration === 0) {
      setCurrentSpread((s) => s - 1);
      return;
    }
    setTurning("backward");
    setTimeout(() => {
      setCurrentSpread((s) => s - 1);
      setTurning(null);
    }, turnDuration);
  }, [canGoBack, turning, turnDuration]);

  const goFirst = useCallback(() => {
    if (turning) return;
    setCurrentSpread(0);
  }, [turning]);

  const goLast = useCallback(() => {
    if (turning) return;
    setCurrentSpread(maxSpread);
  }, [turning, maxSpread]);

  /* ---- keyboard ---- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowRight":
        case " ":
          e.preventDefault();
          goNext();
          break;
        case "ArrowLeft":
          e.preventDefault();
          goPrev();
          break;
        case "Home":
          e.preventDefault();
          goFirst();
          break;
        case "End":
          e.preventDefault();
          goLast();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, goFirst, goLast]);

  /* ---- touch swipe ---- */
  const touchStartX = useRef<number | null>(null);

  const onTouchStart = (e: ReactTouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: ReactTouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      delta > 0 ? goNext() : goPrev();
    }
    touchStartX.current = null;
  };

  /* ---- preload adjacent spreads ---- */
  useEffect(() => {
    if (!pages.length) return;
    const indices = isMobile
      ? [currentSpread - 1, currentSpread + 1]
      : [
          currentSpread * 2 - 2,
          currentSpread * 2 - 1,
          currentSpread * 2 + 2,
          currentSpread * 2 + 3,
        ];
    indices.forEach((i) => {
      if (i >= 0 && i < totalPages) {
        const img = new Image();
        img.src = pages[i].image_url;
      }
    });
  }, [currentSpread, pages, isMobile, totalPages]);

  /* ---- page-turn animation styles ---- */
  const turnStyle = useMemo(() => {
    if (!turning) return {};
    const deg = turning === "forward" ? "-180deg" : "180deg";
    return {
      transform: `perspective(1200px) rotateY(${deg})`,
      transition: `transform ${turnDuration}ms ease-in-out`,
    };
  }, [turning, turnDuration]);

  /* ---- render ---- */
  return (
    <div
      ref={containerRef}
      className="relative select-none w-full h-full flex items-center justify-center"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      role="region"
      aria-label={`${brochure.title} flipbook viewer`}
    >
      {/* Book container */}
      <div
        className="relative flex bg-white rounded-lg overflow-hidden"
        style={{
          aspectRatio: isMobile ? "0.707" : "1.41",
          maxWidth: isMobile ? "90vw" : "85vw",
          maxHeight: embedMode ? "calc(100% - 16px)" : "75vh",
          width: "100%",
          boxShadow:
            "0 12px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)",
        }}
      >
        {/* Center spine shadow (desktop only) */}
        {!isMobile && (
          <div
            className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
            style={{
              width: 20,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.18) 55%, rgba(0,0,0,0.08) 100%)",
            }}
          />
        )}

        {/* Left page */}
        <PageSlot page={leftPage} />

        {/* Right page (desktop only) */}
        {!isMobile && <PageSlot page={rightPage} />}

        {/* Page-turn overlay */}
        {turning && (
          <div
            className="absolute top-0 bottom-0 z-20 overflow-hidden"
            style={{
              width: isMobile ? "100%" : "50%",
              left: turning === "forward" ? (isMobile ? 0 : "50%") : 0,
              transformOrigin:
                turning === "forward" ? "left center" : "right center",
              ...turnStyle,
              backfaceVisibility: "hidden",
            }}
          >
            {/* Face of the turning page */}
            <div className="w-full h-full bg-white relative">
              {/* Shadow gradient on inner face */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    turning === "forward"
                      ? "linear-gradient(to left, rgba(0,0,0,0.15), transparent 60%)"
                      : "linear-gradient(to right, rgba(0,0,0,0.15), transparent 60%)",
                }}
              />
            </div>
          </div>
        )}

        {/* Navigation arrows */}
        {canGoBack && (
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        {canGoForward && (
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>
        )}
      </div>

      {/* Page indicator */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs tabular-nums">
        {isMobile
          ? `${currentSpread + 1} / ${totalPages}`
          : `${currentSpread * 2 + 1}–${Math.min(
              currentSpread * 2 + 2,
              totalPages
            )} / ${totalPages}`}
      </div>
    </div>
  );
}
