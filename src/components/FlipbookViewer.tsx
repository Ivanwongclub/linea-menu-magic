import { useIsMobile } from "@/hooks/use-mobile";
import type { Page } from "@/types/flipbook";

interface FlipbookViewerProps {
  pages: Page[];
  currentSpread: number;
  onSpreadChange: (spread: number) => void;
}

const FlipbookViewer = ({ pages, currentSpread, onSpreadChange }: FlipbookViewerProps) => {
  const isMobile = useIsMobile();

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
          {page ? (
            <img
              src={page.imageUrl}
              alt={`Page ${page.pageNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
              No page
            </div>
          )}
        </div>
      </div>
    );
  }

  const leftIndex = currentSpread * 2;
  const rightIndex = currentSpread * 2 + 1;
  const leftPage = pages[leftIndex] ?? null;
  const rightPage = pages[rightIndex] ?? null;

  return (
    <div className="flex items-center justify-center w-full h-full p-8">
      <div
        className="relative flex bg-white rounded-lg overflow-hidden"
        style={{
          aspectRatio: "1.41 / 1",
          height: "min(75vh, 620px)",
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
        }}
      >
        {/* Left page */}
        <div className="relative w-1/2 h-full">
          {leftPage ? (
            <img
              src={leftPage.imageUrl}
              alt={`Page ${leftPage.pageNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm bg-neutral-50">
              No page
            </div>
          )}
        </div>

        {/* Center spine shadow */}
        <div
          className="absolute left-1/2 top-0 -translate-x-1/2 h-full pointer-events-none z-10"
          style={{
            width: "30px",
            background:
              "linear-gradient(to right, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.02) 40%, transparent 50%, rgba(0,0,0,0.02) 60%, rgba(0,0,0,0.08) 100%)",
          }}
        />

        {/* Right page */}
        <div className="relative w-1/2 h-full">
          {rightPage ? (
            <img
              src={rightPage.imageUrl}
              alt={`Page ${rightPage.pageNumber}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm bg-neutral-50">
              No page
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlipbookViewer;
