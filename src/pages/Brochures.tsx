import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Code2, Link2 } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import EmbedModal from "@/components/EmbedModal";
import { useBrochures } from "@/features/flipbook/hooks/useBrochures";
import { toast } from "sonner";
import type { Brochure } from "@/features/flipbook/types";

export default function Brochures() {
  const { data: brochures, isLoading } = useBrochures();
  const [embedModal, setEmbedModal] = useState<{ slug: string; title: string } | null>(null);

  const handleCopyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/brochures/${slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <PageBreadcrumb
        segments={[{ label: "Home", href: "/" }, { label: "Brochures" }]}
        title="Brochures"
      />

      <section className="max-w-[1200px] mx-auto w-full px-6 mb-12">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-3">
          Our Brochures
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
          Browse our latest digital publications and catalogues.
        </p>
      </section>

      <main className="flex-1 max-w-[1200px] mx-auto w-full px-6 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="aspect-[3/4] bg-muted animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-muted animate-pulse rounded w-[80%]" />
                  <div className="h-3 bg-muted animate-pulse rounded w-[60%]" />
                </div>
              </div>
            ))}
          </div>
        ) : !brochures?.length ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <BookOpen size={48} className="text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold text-foreground mb-1">No brochures published yet</h2>
            <p className="text-sm text-muted-foreground">Check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {brochures.map((b, i) => (
              <BrochureCard
                key={b.id}
                brochure={b}
                index={i}
                onEmbed={() => setEmbedModal({ slug: b.slug, title: b.title })}
                onCopyLink={(e) => handleCopyLink(b.slug, e)}
              />
            ))}
          </div>
        )}
      </main>

      {embedModal && (
        <EmbedModal
          slug={embedModal.slug}
          brochureTitle={embedModal.title}
          isOpen
          onClose={() => setEmbedModal(null)}
        />
      )}

      <Footer />
    </div>
  );
}

/* ─── Card ─── */

function BrochureCard({
  brochure,
  index,
  onEmbed,
  onCopyLink,
}: {
  brochure: Brochure;
  index: number;
  onEmbed: () => void;
  onCopyLink: (e: React.MouseEvent) => void;
}) {
  const [linkTooltip, setLinkTooltip] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    onCopyLink(e);
    setLinkTooltip(true);
    setTimeout(() => setLinkTooltip(false), 1500);
  };

  return (
    <div
      className="group rounded-lg border border-transparent bg-card overflow-hidden transition-all duration-300 hover:border-accent/40 opacity-0 animate-fade-up"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "forwards" }}
    >
      <Link to={`/brochures/${brochure.slug}`} className="block relative">
        <div
          className="aspect-[3/4] overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1.5 group-hover:scale-[1.02]"
          style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.18)" }}
        >
          {brochure.cover_image_url ? (
            <img
              src={brochure.cover_image_url}
              alt={brochure.title}
              className="w-full h-full object-cover object-top"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
              <BookOpen size={32} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-2">No cover</span>
            </div>
          )}
        </div>
      </Link>

      <div className="p-4">
        <Link to={`/brochures/${brochure.slug}`}>
          <h2 className="text-[15px] font-semibold text-foreground truncate leading-snug">
            {brochure.title}
          </h2>
        </Link>
        {brochure.description && (
          <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {brochure.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <Link
            to={`/brochures/${brochure.slug}`}
            className="text-[13px] font-semibold text-accent hover:underline inline-flex items-center gap-1"
          >
            Read
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={handleCopy}
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
            <button
              onClick={(e) => { e.stopPropagation(); onEmbed(); }}
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Embed brochure"
            >
              <Code2 size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
