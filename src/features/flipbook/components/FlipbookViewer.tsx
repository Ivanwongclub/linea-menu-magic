import {
  useState,
  useCallback,
  useEffect,
  useRef,
  useMemo,
  useReducer,
  useImperativeHandle,
  forwardRef,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  currentSpread?: number;
  onSpreadChange?: (spread: number) => void;
}

export interface FlipbookViewerHandle {
  goNext: () => void;
  goPrev: () => void;
  goFirst: () => void;
  goLast: () => void;
}

/* ------------------------------------------------------------------ */
/*  Constants & helpers                                                */
/* ------------------------------------------------------------------ */

const ANIMATION_DURATION = 380;

function normaliseImageUrl(url: string): string {
  try {
    const u = new URL(url, window.location.origin);
    ["t", "v", "_", "_cb", "cache"].forEach((p) => u.searchParams.delete(p));
    return u.toString();
  } catch {
    return url;
  }
}

/* ------------------------------------------------------------------ */
/*  Single page renderer                                               */
/* ------------------------------------------------------------------ */

function PageSlot({
  page,
  src,
  showHotlinks = false,
  editHints = false,
  onGlobalLoad,
}: {
  page: Page | undefined | null;
  src?: string;
  showHotlinks?: boolean;
  editHints?: boolean;
  /** Notify the parent preload tracker when this src loads */
  onGlobalLoad?: () => void;
}) {
  const resolvedSrc = src ?? page?.image_url;
  const [ready, setReady] = useState(false);

  // Reset ready state whenever the actual src changes
  useEffect(() => {
    setReady(false);
  }, [resolvedSrc]);

  if (!page) {
    return <div className="w-full h-full bg-white" />;
  }

  const handleLoad = () => {
    setReady(true);
    onGlobalLoad?.();
  };

  const handleError = () => {
    setReady(true); // show whatever loaded (or nothing) rather than infinite skeleton
    onGlobalLoad?.();
  };

  return (
    <div className="w-full h-full relative bg-white overflow-hidden">
      {/* Skeleton — fades out when this specific src loads */}
      <div
        aria-hidden="true"
        className={`absolute inset-0 bg-muted transition-opacity duration-300 ${
          ready ? "opacity-0" : "opacity-100 animate-pulse"
        }`}
      />
      <img
        src={resolvedSrc}
        alt={`Page ${page.page_number}`}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-300 ${
          ready ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
        onLoad={handleLoad}
        onError={handleError}
      />
      {showHotlinks && page.hotlinks && page.hotlinks.length > 0 && ready && (
        <PageHotlinks hotlinks={page.hotlinks} editHints={editHints} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main viewer                                                        */
/* ------------------------------------------------------------------ */

const FlipbookViewer = forwardRef<FlipbookViewerHandle, FlipbookViewerProps>(
  function FlipbookViewer(
    {
      brochure,
      embedMode = false,
      showHotlinks = false,
      editHints = false,
      currentSpread: controlledSpread,
      onSpreadChange,
    },
    ref
  ) {
    const isMobile = useIsMobile();
    const containerRef = useRef<HTMLDivElement>(null);
    const prefersReducedMotion = useRef(false);

    const pages = brochure.pages;
    const totalPages = pages.length;

    /* ---- normalised URLs (stable across renders) ---- */
    const normalisedUrls = useMemo(() => {
      const map: Record<string, string> = {};
      pages.forEach((page) => {
        map[page.id] = normaliseImageUrl(page.image_url);
      });
      return map;
    }, [pages]);

    /* ---- spread logic ---- */
    const maxSpread = isMobile
      ? totalPages - 1
      : Math.max(Math.ceil(totalPages / 2) - 1, 0);

    const [internalSpread, setInternalSpread] = useState(0);
    const isControlled = controlledSpread !== undefined;
    const currentSpread = isControlled ? controlledSpread : internalSpread;

    /* ---- animation state ---- */
    const [displayedSpread, setDisplayedSpread] = useState(currentSpread);
    const [isAnimating, setIsAnimating] = useState(false);
    const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");

    const canGoBack = currentSpread > 0;
    const canGoForward = currentSpread < maxSpread;

    useEffect(() => {
      prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    /* ---- image preload tracking ---- */
    const loadedPages = useRef<Set<string>>(new Set());
    const preloadRefs = useRef<Record<string, HTMLImageElement | null>>({});
    const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

    const markPageLoaded = useCallback(
      (pageId: string) => {
        if (loadedPages.current.has(pageId)) return;
        loadedPages.current.add(pageId);
        forceUpdate();
      },
      []
    );

    const isLoaded = useCallback((page: Page | undefined | null) => {
      if (!page) return false;
      return loadedPages.current.has(page.id);
    }, []);

    /* ---- compute fetch priority ---- */
    const getPagePriority = useCallback(
      (index: number): "high" | "auto" | "low" => {
        const spreadIndex = isMobile ? index : Math.floor(index / 2);
        const distance = Math.abs(spreadIndex - currentSpread);
        if (distance === 0) return "high";
        if (distance <= 1) return "auto";
        return "low";
      },
      [currentSpread, isMobile]
    );

    /* ---- update fetch priority on spread change ---- */
    useEffect(() => {
      pages.forEach((page, index) => {
        const el = preloadRefs.current[page.id];
        if (!el) return;
        const priority = getPagePriority(index);
        el.fetchPriority = priority;
        if (priority === "high") {
          el.loading = "eager";
        }
      });
      forceUpdate();
    }, [currentSpread, pages, getPagePriority]);

    /* ---- JS Image() preload for adjacent spreads ---- */
    useEffect(() => {
      const adjacentSpreads = [currentSpread, currentSpread + 1].filter(
        (s) => s >= 0 && s <= maxSpread
      );
      adjacentSpreads.forEach((spread) => {
        const indices = isMobile ? [spread] : [spread * 2, spread * 2 + 1];
        indices.forEach((idx) => {
          const page = pages[idx];
          if (!page) return;
          if (loadedPages.current.has(page.id)) return;
          const img = new window.Image();
          img.onload = () => markPageLoaded(page.id);
          img.onerror = () => markPageLoaded(page.id);
          img.src = normalisedUrls[page.id];
        });
      });
    }, [currentSpread, maxSpread, pages, isMobile, normalisedUrls, markPageLoaded]);

    /* ---- simple synchronous navigation ---- */
    const updateSpread = useCallback(
      (next: number | ((prev: number) => number)) => {
        const value = typeof next === "function" ? next(currentSpread) : next;
        const clamped = Math.max(0, Math.min(value, maxSpread));
        if (clamped === currentSpread) return;
        if (!isControlled) setInternalSpread(clamped);
        onSpreadChange?.(clamped);
      },
      [currentSpread, maxSpread, isControlled, onSpreadChange]
    );

    const goNext = useCallback(() => {
      if (!canGoForward || isAnimating) return;
      updateSpread((s) => s + 1);
    }, [canGoForward, isAnimating, updateSpread]);

    const goPrev = useCallback(() => {
      if (!canGoBack || isAnimating) return;
      updateSpread((s) => s - 1);
    }, [canGoBack, isAnimating, updateSpread]);

    const goFirst = useCallback(() => {
      if (isAnimating) return;
      updateSpread(0);
    }, [isAnimating, updateSpread]);

    const goLast = useCallback(() => {
      if (isAnimating) return;
      updateSpread(maxSpread);
    }, [isAnimating, maxSpread, updateSpread]);

    useImperativeHandle(ref, () => ({ goNext, goPrev, goFirst, goLast }), [
      goNext, goPrev, goFirst, goLast,
    ]);

    /* ---- detect spread changes & trigger animation ---- */
    useEffect(() => {
      if (currentSpread === displayedSpread) return;

      if (prefersReducedMotion.current) {
        setDisplayedSpread(currentSpread);
        return;
      }

      const direction = currentSpread > displayedSpread ? "forward" : "backward";
      setAnimationDirection(direction);
      setIsAnimating(true);

      const timer = setTimeout(() => {
        setDisplayedSpread(currentSpread);
        setIsAnimating(false);
      }, ANIMATION_DURATION);

      return () => clearTimeout(timer);
    }, [currentSpread]); // intentionally only depend on currentSpread

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

    /* ---- page references ---- */
    const newLeftPage = isMobile ? pages[currentSpread] : pages[currentSpread * 2];
    const newRightPage = isMobile ? undefined : pages[currentSpread * 2 + 1];
    const oldLeftPage = isMobile ? pages[displayedSpread] : pages[displayedSpread * 2];
    const oldRightPage = isMobile ? undefined : pages[displayedSpread * 2 + 1];

    /* ---- hidden preload container for nearby pages only ---- */
    const preloadIndices = useMemo(() => {
      const indices = new Set<number>();
      // Current spread + next spread only
      const spreads = [currentSpread, currentSpread + 1].filter(s => s >= 0 && s <= maxSpread);
      spreads.forEach(s => {
        if (isMobile) {
          indices.add(s);
        } else {
          indices.add(s * 2);
          indices.add(s * 2 + 1);
        }
      });
      // Also include displayed spread during animation
      if (displayedSpread !== currentSpread) {
        if (isMobile) {
          indices.add(displayedSpread);
        } else {
          indices.add(displayedSpread * 2);
          indices.add(displayedSpread * 2 + 1);
        }
      }
      return indices;
    }, [currentSpread, displayedSpread, maxSpread, isMobile]);

    const preloadContainer = (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        {pages.map((page, index) => {
          if (!preloadIndices.has(index)) return null;
          const priority = getPagePriority(index);
          return (
            <img
              key={page.id}
              ref={(el) => {
                preloadRefs.current[page.id] = el;
              }}
              src={normalisedUrls[page.id]}
              alt=""
              fetchPriority={priority}
              loading={priority === "low" ? "lazy" : undefined}
              decoding="async"
              onLoad={() => markPageLoaded(page.id)}
              onError={() => markPageLoaded(page.id)}
            />
          );
        })}
      </div>
    );

    /* helper to get normalised src for a page */
    const getSrc = (page: Page | undefined | null) =>
      page ? normalisedUrls[page.id] : undefined;

    /* ---- render: mobile ---- */
    if (isMobile) {
      return (
        <div
          ref={containerRef}
          className="relative select-none w-full h-full flex items-center justify-center"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          role="region"
          aria-label={`${brochure.title} flipbook viewer`}
        >
          {preloadContainer}
          <div
            className="relative bg-white rounded-lg overflow-hidden"
            style={{
              aspectRatio: "0.707",
              maxWidth: "90vw",
              maxHeight: embedMode ? "calc(100% - 16px)" : "75vh",
              width: "100%",
              boxShadow: "0 12px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)",
            }}
          >
            <PageSlot
              page={newLeftPage}
              src={getSrc(newLeftPage)}
              showHotlinks={showHotlinks}
              editHints={editHints}
              isLoaded={isLoaded(newLeftPage)}
              onLoad={() => newLeftPage && markPageLoaded(newLeftPage.id)}
              onError={() => newLeftPage && markPageLoaded(newLeftPage.id)}
            />
          </div>

          <button
            onClick={goPrev}
            disabled={!canGoBack}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={goNext}
            disabled={!canGoForward}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-sm transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight size={20} />
          </button>

          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs tabular-nums">
            {currentSpread + 1} / {totalPages}
          </div>
        </div>
      );
    }

    /* ---- render: desktop with 3D page-turn ---- */
    const bookStyle: React.CSSProperties = {
      aspectRatio: "1.41 / 1",
      maxWidth: "85vw",
      maxHeight: embedMode ? "calc(100% - 16px)" : "75vh",
      width: "100%",
      boxShadow: "0 12px 40px rgba(0,0,0,0.25), 0 2px 8px rgba(0,0,0,0.12)",
    };

    /* pick which page to show in the base layer */
    const baseLeftPage = isAnimating ? newLeftPage : (pages[displayedSpread * 2] ?? null);
    const baseRightPage = isAnimating ? newRightPage : (pages[displayedSpread * 2 + 1] ?? null);

    return (
      <div
        ref={containerRef}
        className="group relative select-none w-full h-full flex items-center justify-center"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        role="region"
        aria-label={`${brochure.title} flipbook viewer`}
      >
        {preloadContainer}
        <div
          className="relative bg-white rounded-lg"
          style={{ ...bookStyle, perspective: "1800px" }}
        >
          {/* Base layer: the NEW spread (revealed underneath the flipping page) */}
          <div className="absolute inset-0 flex rounded-lg overflow-hidden">
            <div className="w-1/2 h-full">
              <PageSlot
                page={baseLeftPage}
                src={getSrc(baseLeftPage)}
                showHotlinks={showHotlinks}
                editHints={editHints}
                isLoaded={isLoaded(baseLeftPage)}
                onLoad={() => baseLeftPage && markPageLoaded(baseLeftPage.id)}
                onError={() => baseLeftPage && markPageLoaded(baseLeftPage.id)}
              />
            </div>
            <div className="w-1/2 h-full">
              <PageSlot
                page={baseRightPage}
                src={getSrc(baseRightPage)}
                showHotlinks={showHotlinks}
                editHints={editHints}
                isLoaded={isLoaded(baseRightPage)}
                onLoad={() => baseRightPage && markPageLoaded(baseRightPage.id)}
                onError={() => baseRightPage && markPageLoaded(baseRightPage.id)}
              />
            </div>
          </div>

          {/* Forward flip: old right page flips left */}
          {isAnimating && animationDirection === "forward" && (
            <div
              className="absolute top-0 right-0 w-1/2 h-full z-20"
              style={{
                transformOrigin: "left center",
                animation: `flipForward ${ANIMATION_DURATION}ms ease-in-out forwards`,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-r-lg"
                style={{ backfaceVisibility: "hidden" }}
              >
                <PageSlot page={oldRightPage} src={getSrc(oldRightPage)} isLoaded={isLoaded(oldRightPage)} />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to left, rgba(0,0,0,0.03), rgba(0,0,0,0.15))",
                    animation: `shadowIn ${ANIMATION_DURATION}ms ease-in-out forwards`,
                  }}
                />
              </div>
              <div
                className="absolute inset-0 overflow-hidden rounded-l-lg"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <PageSlot page={newLeftPage} src={getSrc(newLeftPage)} isLoaded={isLoaded(newLeftPage)} />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.03))",
                  }}
                />
              </div>
            </div>
          )}

          {/* Backward flip: old left page flips right */}
          {isAnimating && animationDirection === "backward" && (
            <div
              className="absolute top-0 left-0 w-1/2 h-full z-20"
              style={{
                transformOrigin: "right center",
                animation: `flipBackward ${ANIMATION_DURATION}ms ease-in-out forwards`,
                transformStyle: "preserve-3d",
              }}
            >
              <div
                className="absolute inset-0 overflow-hidden rounded-l-lg"
                style={{ backfaceVisibility: "hidden" }}
              >
                <PageSlot page={oldLeftPage} src={getSrc(oldLeftPage)} isLoaded={isLoaded(oldLeftPage)} />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.03), rgba(0,0,0,0.15))",
                    animation: `shadowIn ${ANIMATION_DURATION}ms ease-in-out forwards`,
                  }}
                />
              </div>
              <div
                className="absolute inset-0 overflow-hidden rounded-r-lg"
                style={{
                  backfaceVisibility: "hidden",
                  transform: "rotateY(-180deg)",
                }}
              >
                <PageSlot page={newRightPage} src={getSrc(newRightPage)} isLoaded={isLoaded(newRightPage)} />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to left, rgba(0,0,0,0.15), rgba(0,0,0,0.03))",
                  }}
                />
              </div>
            </div>
          )}

          {/* Center spine shadow */}
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 h-full pointer-events-none z-30"
            style={{
              width: 30,
              background:
                "linear-gradient(to right, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 40%, transparent 50%, rgba(0,0,0,0.02) 60%, rgba(0,0,0,0.08) 100%)",
            }}
          />
        </div>

        {/* Navigation arrows */}
        <button
          onClick={goPrev}
          disabled={!canGoBack}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:group-hover:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={goNext}
          disabled={!canGoForward}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 disabled:opacity-0 disabled:group-hover:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs tabular-nums">
          {currentSpread * 2 + 1}–{Math.min(currentSpread * 2 + 2, totalPages)} / {totalPages}
        </div>

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
  }
);

export default FlipbookViewer;
