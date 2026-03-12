import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useBrochure } from "@/hooks/useBrochure";
import { useIsMobile } from "@/hooks/use-mobile";
import FlipbookViewer from "@/components/FlipbookViewer";

const PortfolioViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { brochure, loading, error } = useBrochure(id);
  const isMobile = useIsMobile();
  const [currentSpread, setCurrentSpread] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);

  const navigate = useCallback((delta: number) => {
    if (isFlipping) return;
    setIsFlipping(true);
    setCurrentSpread((s) => s + delta);
    setTimeout(() => setIsFlipping(false), 400);
  }, [isFlipping]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-white/50 text-sm animate-pulse">Loading brochure…</div>
      </div>
    );
  }

  if (error || !brochure) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-center">
          <p className="text-white/70 text-lg mb-4">{error ?? "Brochure not found"}</p>
          <Link to="/portfolio" className="text-white underline underline-offset-4 text-sm hover:text-white/80">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link
          to="/portfolio"
          className="flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Portfolio
        </Link>
        <h1 className="text-white text-sm font-medium tracking-wide">{brochure.title}</h1>
        <div className="w-24" />
      </header>

      <main className="flex-1 flex items-center justify-center relative">
        <FlipbookViewer
          pages={brochure.pages}
          currentSpread={currentSpread}
          onSpreadChange={setCurrentSpread}
        />

        {/* Navigation arrows */}
        {(() => {
          const maxSpread = isMobile
            ? brochure.pages.length - 1
            : Math.ceil(brochure.pages.length / 2) - 1;
          return (
            <>
              {currentSpread > 0 && (
                <button
                  onClick={() => navigate(-1)}
                  disabled={isFlipping}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              {currentSpread < maxSpread && (
                <button
                  onClick={() => navigate(1)}
                  disabled={isFlipping}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors disabled:opacity-30"
                >
                  <ChevronRight size={20} />
                </button>
              )}
            </>
          );
        })()}
      </main>
    </div>
  );
};

export default PortfolioViewer;
