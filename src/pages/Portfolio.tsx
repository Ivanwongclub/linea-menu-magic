import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Code, Upload, Info } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import EmbedModal from "@/components/EmbedModal";
import UploadModal from "@/components/UploadModal";
import { brochures } from "@/data/brochures";

const Portfolio = () => {
  const [embedModal, setEmbedModal] = useState<{ id: string; title: string } | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    document.title = "Portfolio — Digital Brochure Viewer";
  }, []);

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
      <section className="max-w-7xl mx-auto w-full px-6 lg:px-8 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight mb-4">
              Your brochures, beautifully presented
            </h1>
            <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
              Browse our digital brochures and catalogs. Click any publication to explore it in an immersive flipbook experience with page-turn animations, zoom, and more.
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
        <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-muted-foreground text-xs">
          <Info size={14} />
          Demo mode — connect a backend to enable real uploads
        </div>
      </section>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 pb-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {brochures.map((brochure, index) => (
            <div
              key={brochure.id}
              className="group rounded-lg border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "forwards" }}
            >
              <Link to={`/portfolio/view/${brochure.id}`} className="block">
                <div className="aspect-[3/4] overflow-hidden">
                  <img
                    src={brochure.coverImage}
                    alt={brochure.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
              </Link>
              <div className="p-5">
                <h2 className="text-lg font-semibold text-foreground mb-1">{brochure.title}</h2>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{brochure.description}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/portfolio/view/${brochure.id}`}
                    className="inline-block px-6 py-2.5 bg-primary text-primary-foreground text-xs tracking-widest uppercase rounded-full transition-all duration-300 hover:bg-primary-hover"
                  >
                    Read Now
                  </Link>
                  <button
                    onClick={() => setEmbedModal({ id: brochure.id, title: brochure.title })}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 border border-border text-muted-foreground text-xs tracking-widest uppercase rounded-full transition-all duration-300 hover:bg-muted hover:text-foreground"
                  >
                    <Code size={14} />
                    Embed
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
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

export default Portfolio;
