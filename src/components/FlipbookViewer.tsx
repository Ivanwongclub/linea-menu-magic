import { useState, useEffect, useRef, useCallback } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Page } from "@/types/flipbook";

interface FlipbookViewerProps {
  pages: Page[];
  currentSpread: number;
  onSpreadChange: (spread: number) => void;
}

const ANIMATION_DURATION = 380;

function PageImage({ page }: { page: Page | null }) {
  if (!page) {
    return (
      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm bg-neutral-50">
        No page
      </div>
    );
  }
  return (
    <img
      src={page.imageUrl}
      alt={`Page ${page.pageNumber}`}
      className="w-full h-full object-cover"
    />
  );
}

const FlipbookViewer = ({ pages, currentSpread, onSpreadChange }: FlipbookViewerProps) => {
  const isMobile = useIsMobile();
  const [displayedSpread, setDisplayedSpread] = useState(currentSpread);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward");
  const [animationPhase, setAnimationPhase] = useState<"idle" | "flipping">("idle");
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

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
      <div className="flex items-center justify-center w-full h-full p-4">
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
    <div className="flex items-center justify-center w-full h-full p-8">
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
