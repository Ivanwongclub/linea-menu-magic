import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Page } from "@/types/flipbook";

interface ThumbnailStripProps {
  pages: Page[];
  currentSpread: number;
  isMobile: boolean;
  onNavigate: (spread: number) => void;
}

const THUMB_WIDTH = 80;

const ThumbnailStrip = ({
  pages,
  currentSpread,
  isMobile,
  onNavigate,
}: ThumbnailStripProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (isOpen && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentSpread, isOpen]);

  const getSpreadForPage = useCallback(
    (pageIndex: number) => (isMobile ? pageIndex : Math.floor(pageIndex / 2)),
    [isMobile]
  );

  const isActive = useCallback(
    (pageIndex: number) => {
      if (isMobile) return pageIndex === currentSpread;
      const spreadStart = currentSpread * 2;
      return pageIndex === spreadStart || pageIndex === spreadStart + 1;
    },
    [currentSpread, isMobile]
  );

  return (
    <div className="shrink-0 select-none">
      {/* Toggle button */}
      <div className="flex justify-end px-4">
        <button
          onClick={() => setIsOpen((o) => !o)}
          className="flex items-center gap-1 text-white/50 hover:text-white/80 text-xs py-1 px-2 rounded transition-colors"
          aria-label={isOpen ? "Hide thumbnails" : "Show thumbnails"}
        >
          {isOpen ? "Hide" : "Thumbnails"}
          {isOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {/* Thumbnail strip with animated height */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: isOpen ? "140px" : "0px" }}
      >
        <div
          ref={scrollRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "rgba(255,255,255,0.2) transparent",
          }}
        >
          {pages.map((page, index) => {
            const active = isActive(index);
            const spread = getSpreadForPage(index);
            return (
              <button
                key={page.id}
                ref={active ? activeRef : undefined}
                onClick={() => onNavigate(spread)}
                className="shrink-0 flex flex-col items-center gap-1 group"
                aria-label={`Go to page ${page.pageNumber}`}
              >
                <div
                  className="rounded overflow-hidden transition-all duration-200"
                  style={{
                    width: `${THUMB_WIDTH}px`,
                    aspectRatio: "1 / 1.41",
                    border: active
                      ? "2px solid hsl(var(--accent))"
                      : "2px solid transparent",
                    opacity: active ? 1 : 0.6,
                    boxShadow: active
                      ? "0 0 8px hsl(var(--accent) / 0.3)"
                      : "none",
                  }}
                >
                  <img
                    src={page.imageUrl}
                    alt={`Page ${page.pageNumber}`}
                    className="w-full h-full object-cover group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                </div>
                <span
                  className="text-xs transition-colors"
                  style={{
                    color: active
                      ? "hsl(var(--accent))"
                      : "rgba(255,255,255,0.4)",
                  }}
                >
                  {page.pageNumber}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ThumbnailStrip;
