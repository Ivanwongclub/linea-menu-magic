import { useRef, useEffect, useCallback } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Page } from "../types";

interface ThumbnailStripProps {
  pages: Page[];
  currentSpread: number;
  onSpreadSelect: (spread: number) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobile?: boolean;
  isFullscreen?: boolean;
}

const THUMB_WIDTH = 80;

const ThumbnailStrip = ({
  pages,
  currentSpread,
  onSpreadSelect,
  collapsed,
  onToggleCollapse,
  isMobile = false,
  isFullscreen = false,
}: ThumbnailStripProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!collapsed && activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [currentSpread, collapsed]);

  const getSpreadForPage = useCallback(
    (pageIndex: number) => (isMobile ? pageIndex : Math.floor(pageIndex / 2)),
    [isMobile],
  );

  const isActive = useCallback(
    (pageIndex: number) => {
      if (isMobile) return pageIndex === currentSpread;
      const spreadStart = currentSpread * 2;
      return pageIndex === spreadStart || pageIndex === spreadStart + 1;
    },
    [currentSpread, isMobile],
  );

  return (
    <div
      className={`shrink-0 select-none ${
        isFullscreen ? "fixed bottom-0 left-0 right-0 z-50 bg-[hsl(var(--background))]/95 backdrop-blur-sm" : ""
      }`}
    >
      {/* Toggle button */}
      <div className="flex justify-end px-4">
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-xs py-1 px-2 rounded transition-colors"
          aria-label={collapsed ? "Show thumbnails" : "Hide thumbnails"}
        >
          {collapsed ? "Thumbnails" : "Hide"}
          {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Thumbnail strip */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: collapsed ? "0px" : "120px" }}
      >
        <div
          ref={scrollRef}
          className="flex gap-2 px-4 py-3 overflow-x-auto overscroll-x-contain touch-pan-x"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "hsl(var(--muted-foreground) / 0.2) transparent",
          }}
        >
          {pages.map((page, index) => {
            const active = isActive(index);
            const spread = getSpreadForPage(index);
            return (
              <button
                key={page.id}
                ref={active ? activeRef : undefined}
                onClick={() => onSpreadSelect(spread)}
                className="shrink-0 flex flex-col items-center gap-1 group"
                aria-label={`Go to page ${page.page_number}`}
              >
                <div
                  className={`rounded overflow-hidden transition-all duration-200 ${
                    active
                      ? "border-2 border-primary opacity-100 shadow-[0_0_8px_hsl(var(--primary)/0.3)]"
                      : "border-2 border-transparent opacity-60"
                  }`}
                  style={{
                    width: `${THUMB_WIDTH}px`,
                    aspectRatio: "1 / 1.41",
                  }}
                >
                  <img
                    src={page.image_url}
                    alt={`Page ${page.page_number}`}
                    className="w-full h-full object-cover group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                  />
                </div>
                <span
                  className={`text-xs transition-colors ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {page.page_number}
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
