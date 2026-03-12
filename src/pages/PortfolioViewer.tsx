import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { brochures } from "@/data/brochures";

const PortfolioViewer = () => {
  const { id } = useParams<{ id: string }>();
  const brochure = brochures.find((b) => b.id === id);

  if (!brochure) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1a1a2e" }}>
        <div className="text-center">
          <p className="text-white/70 text-lg mb-4">Brochure not found</p>
          <Link to="/portfolio" className="text-white underline underline-offset-4 text-sm hover:text-white/80">
            Back to Portfolio
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#1a1a2e" }}>
      {/* Top bar */}
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

      {/* Placeholder viewer area */}
      <main className="flex-1 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <img
            src={brochure.coverImage}
            alt={brochure.title}
            className="w-64 mx-auto rounded-lg shadow-2xl mb-8"
          />
          <h2 className="text-white text-xl font-semibold mb-2">{brochure.title}</h2>
          <p className="text-white/50 text-sm mb-6">{brochure.pages.length} pages</p>
          <p className="text-white/30 text-xs">Flipbook viewer coming soon — this is the foundation page.</p>
        </div>
      </main>
    </div>
  );
};

export default PortfolioViewer;
