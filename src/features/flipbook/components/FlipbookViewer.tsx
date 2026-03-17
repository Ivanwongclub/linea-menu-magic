import {
  useState,
  useCallback,
  useEffect,
  useRef,
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
    const u = new URL(url);
    u.searchParams.delete("t");
    u.searchParams.delete("v");
    u.searchParams.delete("_");
    return u.toString();
  } catch {
    return url;
  }
}

function getSpreadPages(
  spreadIndex: number,
  pages: Page[],
  isMobile: boolean
): (Page | null)[] {
  if (isMobile) {
    return [pages[spreadIndex] ?? null];
  }
  const leftIndex = spreadIndex * 2;
  const rightIndex = leftIndex + 1;
  return [pages[leftIndex] ?? null, pages[rightIndex] ?? null];
}

/* ------------------------------------------------------------------ */
/*  Single page renderer                                               */
/* ------------------------------------------------------------------ */

function PageSlot({
  page,
  showHotlinks = false,
  editHints = false,
  isLoaded = false,
}: {
  page: Page | undefined | null;
  showHotlinks?: boolean;
  editHints?: boolean;
  isLoaded?: boolean;
}) {
  if (!page) {
    return <div className="w-full h-full bg-white" />;
  }

  const src = normaliseImageUrl(page.image_url);

  return (
    <div className="w-full h-full relative bg-white overflow-hidden">
      {!isLoaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden="true" />
      )}
      <img
        src={src}
        alt={`Page ${page.page_number}`}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        draggable={false}
      />
      {showHotlinks && page.hotlinks && page.hotlinks.length > 0 && isLoaded && (
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
    const [spreadLoading, setSpreadLoading] = useState(false);

    const canGoBack = currentSpread > 0;
    const canGoForward = currentSpread < maxSpread;

    useEffect(() => {
      prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    }, []);

    /* ---- image preload tracking ---- */
    const loadedPages = useRef<Set<string>>(new Set());
    const preloadRefs = useRef<Record<string, HTMLImageElement | null>>({});
    const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

    const isPageInCurrentSpread = useCallback(
      (pageId: string) => {
        if (isMobile) {
          return pages[currentSpread]?.id === pageId;
        }
        const leftIdx = currentSpread * 2;
        const rightIdx = currentSpread * 2 + 1;
        return pages[leftIdx]?.id === pageId || pages[rightIdx]?.id === pageId;
      },
      [currentSpread, isMobile, pages]
    );

    const markPageLoaded = useCallback(
      (pageId: string) => {
        loadedPages.current.add(pageId);
        if (isPageInCurrentSpread(pageId)) {
          forceUpdate();
        }
      },
      [isPageInCurrentSpread]
    );

    const isLoaded = useCallback((page: Page | undefined | null) => {
      if (!page) return false;
      return loadedPages.current.has(page.id);
    }, []);

    /* ---- update fetch priority on spread change ---- */
    useEffect(() => {
      pages.forEach((page, index) => {
        const spreadIndex = isMobile ? index : Math.floor(index / 2);
        const distance = Math.abs(spreadIndex - currentSpread);
        const el = preloadRefs.current[page.id];
        if (!el) return;
        if (distance <= 1) {
          el.fetchPriority = "high";
          el.loading = "eager";
        } else if (distance <= 3) {
          el.fetchPriority = "auto";
          el.loading = "lazy";
        } else {
          el.fetchPriority = "low";
          el.loading = "lazy";
        }
      });
      forceUpdate();
    }, [currentSpread, pages, isMobile]);

    /* ---- JS Image() preload for adjacent spreads ---- */
    useEffect(() => {
      const adjacentSpreads = [currentSpread - 1, currentSpread + 1].filter(
        (s) => s >= 0 && s <= maxSpread
      );
      adjacentSpreads.forEach((spread) => {
        const spreadPages = getSpreadPages(spread, pages, isMobile);
        spreadPages.forEach((page) => {
          if (!page) return;
          if (loadedPages.current.has(page.id)) return;
          const img = new window.Image();
          img.fetchPriority = "high";
          img.onload = () => {
            loadedPages.current.add(page.id);
            if (isPageInCurrentSpread(page.id)) forceUpdate();
          };
          img.src = normaliseImageUrl(page.image_url);
        });
      });
    }, [currentSpread, maxSpread, pages, isMobile, isPageInCurrentSpread]);

    /* ---- wait for pages helper ---- */
    const waitForPages = useCallback(
      (targetPages: (Page | null)[], timeout: number): Promise<void> => {
        return new Promise((resolve) => {
          const timer = setTimeout(resolve, timeout);
          function check() {
            const loaded = targetPages.every(
              (p) => !p || loadedPages.current.has(p.id)
            );
            if (loaded) {
              clearTimeout(timer);
              resolve();
            } else {
              requestAnimationFrame(check);
            }
          }
          check();
        });
      },
      []
    );

    /* ---- spread update (sets state / calls parent) ---- */
    const commitSpread = useCallback(
      (value: number) => {
        const clamped = Math.max(0, Math.min(value, maxSpread));
        if (!isControlled) setInternalSpread(clamped);
        onSpreadChange?.(clamped);
      },
      [maxSpread, isControlled, onSpreadChange]
    );

    /* ---- navigation with preload gate ---- */
    const navigateToSpread = useCallback(
      async (targetSpread: number) => {
        if (isAnimating || spreadLoading) return;
        const clamped = Math.max(0, Math.min(targetSpread, maxSpread));
        if (clamped === currentSpread) return;

        const targetPages = getSpreadPages(clamped, pages, isMobile);
        const allLoaded = targetPages.every(
          (p) => !p || loadedPages.current.has(p.id)
        );

        if (allLoaded) {
          commitSpread(clamped);
        } else {
          setSpreadLoading(true);
          // Kick off high-priority fetches for target pages
          targetPages.forEach((page) => {
            if (!page || loadedPages.current.has(page.id)) return;
            const img = new window.Image();
            img.fetchPriority = "high";
            img.onload = () => loadedPages.current.add(page.id);
            img.src = normaliseImageUrl(page.image_url);
          });
          await waitForPages(targetPages, 3000);
          setSpreadLoading(false);
          commitSpread(clamped);
        }
      },
      [isAnimating, spreadLoading, maxSpread, currentSpread, pages, isMobile, commitSpread, waitForPages]
    );

    /* ---- public navigation methods ---- */
    const goNext = useCallback(() => {
      if (!canGoForward) return;
      navigateToSpread(currentSpread + 1);
    }, [canGoForward, currentSpread, navigateToSpread]);

    const goPrev = useCallback(() => {
      if (!canGoBack) return;
      navigateToSpread(currentSpread - 1);
    }, [canGoBack, currentSpread, navigateToSpread]);

    const goFirst = useCallback(() => {
      navigateToSpread(0);
    }, [navigateToSpread]);

    const goLast = useCallback(() => {
      navigateToSpread(maxSpread);
    }, [maxSpread, navigateToSpread]);

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

    /* ---- compute fetch priority for preload container ---- */
    const getPagePriority = useCallback(
      (index: number): "high" | "auto" | "low" => {
        const spreadIndex = isMobile ? index : Math.floor(index / 2);
        const distance = Math.abs(spreadIndex - currentSpread);
        if (distance <= 1) return "high";
        if (distance <= 3) return "auto";
        return "low";
      },
      [currentSpread, isMobile]
    );

    /* ---- loading overlay ---- */
    const loadingOverlay = spreadLoading && (
      <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
        <div className="w-5 h-5 rounded-full border-2 border-[hsl(var(--foreground))]/20 border-t-[hsl(var(--foreground))] animate-spin" />
      </div>
    );

    /* ---- hidden preload container for ALL pages ---- */
    const preloadContainer = (
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {pages.map((page, index) => {
          const priority = getPagePriority(index);
          return (
            <img
              key={page.id}
              ref={(el) => {
                preloadRefs.current[page.id] = el;
              }}
              src={normaliseImageUrl(page.image_url)}
              alt=""
              fetchPriority={priority}
              loading={priority === "low" ? "lazy" : undefined}
              onLoad={() => markPageLoaded(page.id)}
              onError={() => markPageLoaded(page.id)}
            />
          );
        })}
      </div>
    );

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
            {loadingOverlay}
            <PageSlot page={newLeftPage} showHotlinks={showHotlinks} editHints={editHints} isLoaded={isLoaded(newLeftPage)} />
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

          {/* Page indicator */}
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
          {loadingOverlay}

          {/* Base layer: the NEW spread (revealed underneath the flipping page) */}
          <div className="absolute inset-0 flex rounded-lg overflow-hidden">
            <div className="w-1/2 h-full">
              <PageSlot
                page={isAnimating ? newLeftPage : (pages[displayedSpread * 2] ?? null)}
                showHotlinks={showHotlinks}
                editHints={editHints}
                isLoaded={isLoaded(isAnimating ? newLeftPage : (pages[displayedSpread * 2] ?? null))}
              />
            </div>
            <div className="w-1/2 h-full">
              <PageSlot
                page={isAnimating ? newRightPage : (pages[displayedSpread * 2 + 1] ?? null)}
                showHotlinks={showHotlinks}
                editHints={editHints}
                isLoaded={isLoaded(isAnimating ? newRightPage : (pages[displayedSpread * 2 + 1] ?? null))}
              />
            </div>
          </div>

          {/* Forward flip: old right page flips left (rotateY 0 → -180) */}
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
                <PageSlot page={oldRightPage} isLoaded={isLoaded(oldRightPage)} />
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
                <PageSlot page={newLeftPage} isLoaded={isLoaded(newLeftPage)} />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.15), rgba(0,0,0,0.03))",
                  }}
                />
              </div>
            </div>
          )}

          {/* Backward flip: old left page flips right (rotateY 0 → 180) */}
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
                <PageSlot page={oldLeftPage} isLoaded={isLoaded(oldLeftPage)} />
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
                <PageSlot page={newRightPage} isLoaded={isLoaded(newRightPage)} />
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

        {/* Page indicator */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 px-3 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white text-xs tabular-nums">
          {currentSpread * 2 + 1}–{Math.min(currentSpread * 2 + 2, totalPages)} / {totalPages}
        </div>

        {/* Keyframes */}
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
