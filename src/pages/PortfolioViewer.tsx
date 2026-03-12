import { useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBrochure } from "@/hooks/useBrochure";
import FlipbookViewer from "@/components/FlipbookViewer";

const PortfolioViewer = () => {
  const { id } = useParams<{ id: string }>();
  const { brochure, loading, error } = useBrochure(id);
  const [currentSpread, setCurrentSpread] = useState(0);

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
      </main>
    </div>
  );
};

export default PortfolioViewer;
