import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Code2, Link2, Upload, Info, BookOpen } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import EmbedModal from "@/components/EmbedModal";
import UploadModal from "@/components/UploadModal";
import { brochures } from "@/data/brochures";
import { toast } from "sonner";

const Portfolio = () => {
  const [embedModal, setEmbedModal] = useState<{ id: string; title: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Portfolio — Digital Brochure Viewer";
  }, []);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/portfolio/view/${id}`;
    navigator.clipboard.writeText(url).then(() => {
      toast.success("Link copied!");
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <PageBreadcrumb
        segments={[
          { label: "Home", href: "/" },
          { label: "Portfolio" },
        ]}
        title="Portfolio"
      />

      {/* Hero section */}
      <section className="max-w-[1200px] mx-auto w-full px-6 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-3">
              Our Brochures
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
              Browse and read our latest publications
            </p>
          </div>
          <button
            onClick={() => setShowUpload(true)}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground text-xs tracking-widest uppercase rounded-full transition-all duration-300 hover:bg-primary-hover self-start"
          >
            <Upload size={14} />
            Upload Brochure
          </button>
        </div>

        {/* Demo badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-xs">
          <Info size={14} />
          Demo mode — connect a backend to enable real uploads
        </div>
      </section>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 pb-20">
        {loading ? (
          /* Skeleton loading state */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="aspect-[3/4] bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-[80%]" />
                  <div className="h-3 bg-muted animate-pulse rounded w-[60%]" />
                  <div className="flex justify-between items-center pt-2">
                    <div className="h-3 bg-muted animate-pulse rounded w-20" />
                    <div className="flex gap-2">
                      <div className="h-7 w-7 bg-muted animate-pulse rounded-full" />
                      <div className="h-7 w-7 bg-muted animate-pulse rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : brochures.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">No brochures published yet</h2>
            <p className="text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          /* Brochure grid */
          <>
            <style>{`
              @media (prefers-reduced-motion: no-preference) {
                .brochure-card-animate {
                  opacity: 0;
                  animation: brochureCardIn 350ms ease-out forwards;
                }
              }
              @keyframes brochureCardIn {
                from { opacity: 0; transform: translateY(16px); }
                to { opacity: 1; transform: translateY(0); }
              }
            `}</style>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {brochures.map((brochure, index) => (
              <BrochureCard
                key={brochure.id}
                brochure={brochure}
                index={index}
                onEmbed={() => setEmbedModal({ id: brochure.id, title: brochure.title })}
                onCopyLink={(e) => handleCopyLink(brochure.id, e)}
              />
            ))}
            </div>
          </>
        )}
      </main>

      {embedModal && (
        <EmbedModal
          brochureId={embedModal.id}
          brochureTitle={embedModal.title}
          isOpen={true}
          onClose={() => setEmbedModal(null)}
        />
      )}

      <UploadModal isOpen={showUpload} onClose={() => setShowUpload(false)} />

      <Footer />
    </div>
  );
};

/* ─── Card Component ─── */

interface BrochureCardProps {
  brochure: (typeof brochures)[number];
  index: number;
  onEmbed: () => void;
  onCopyLink: (e: React.MouseEvent) => void;
}

const BrochureCard = ({ brochure, index, onEmbed, onCopyLink }: BrochureCardProps) => {
  const [linkTooltip, setLinkTooltip] = useState(false);
  const pageCount = brochure.pages?.length ?? 0;

  const handleCopyLink = (e: React.MouseEvent) => {
    onCopyLink(e);
    setLinkTooltip(true);
    setTimeout(() => setLinkTooltip(false), 1500);
  };

  return (
    <div
      className="group rounded-lg border border-transparent bg-card overflow-hidden transition-all duration-300 hover:border-accent/40"
      style={{
        animationDelay: `${index * 60}ms`,
        animationFillMode: "forwards",
      }}
    >
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .brochure-card-animate {
            opacity: 0;
            animation: brochureCardIn 350ms ease-out forwards;
          }
        }
        @keyframes brochureCardIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Cover area */}
      <Link
        to={`/portfolio/view/${brochure.id}`}
        className="block relative cursor-pointer"
      >
        <div
          className="aspect-[3/4] overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
          style={{
            boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          }}
        >
          <img
            src={brochure.coverImage}
            alt={brochure.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />

          {/* Right spine shadow */}
          <div
            className="absolute top-0 right-0 bottom-0 w-2 pointer-events-none"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.25))",
            }}
          />

          {/* Left edge highlight */}
          <div
            className="absolute top-0 left-0 bottom-0 w-px pointer-events-none"
            style={{ background: "rgba(255,255,255,0.15)" }}
          />

          {/* Page count badge */}
          {pageCount > 0 && (
            <div className="absolute bottom-2.5 left-2.5 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-medium backdrop-blur-sm">
              {pageCount} pages
            </div>
          )}
        </div>
      </Link>

      {/* Info area */}
      <div className="p-4">
        <Link to={`/portfolio/view/${brochure.id}`} className="block cursor-pointer">
          <h2 className="text-[15px] font-semibold text-foreground truncate leading-snug">
            {brochure.title}
          </h2>
        </Link>
        <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
          {brochure.description}
        </p>

        {/* Bottom row */}
        <div className="flex items-center justify-between mt-3">
          <Link
            to={`/portfolio/view/${brochure.id}`}
            className="text-[13px] font-semibold text-accent hover:underline inline-flex items-center gap-1"
          >
            Read now
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">
              →
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {/* Share / copy link */}
            <div className="relative">
              <button
                onClick={handleCopyLink}
                className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Copy link"
              >
                <Link2 size={15} />
              </button>
              {linkTooltip && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-foreground text-background text-[11px] whitespace-nowrap animate-fade-in">
                  Copied!
                </div>
              )}
            </div>

            {/* Embed */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEmbed();
              }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Embed"
            >
              <Code2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
