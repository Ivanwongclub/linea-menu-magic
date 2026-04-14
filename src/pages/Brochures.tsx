import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Code2, Link2 } from "lucide-react";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import EmbedModal from "@/components/EmbedModal";
import { useBrochures, type BrochureWithMeta } from "@/features/flipbook/hooks/useBrochures";
import { toast } from "sonner";

export default function Brochures() {
  const { data: brochures, isLoading } = useBrochures();
  const [embedModal, setEmbedModal] = useState<{ slug: string; title: string } | null>(null);

  const handleCopyLink = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/ecollections/${slug}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Link copied!"));
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PageBreadcrumb
        segments={[{ label: "Home", href: "/" }, { label: "Brochures" }]}
        title="Brochures"
      />

      <section className="max-w-7xl mx-auto w-full px-6 lg:px-8 mb-12">
        <h1 className="text-3xl md:text-4xl font-semibold text-foreground tracking-tight mb-3">
          Our Brochures
        </h1>
        <p className="text-muted-foreground text-sm md:text-base max-w-xl leading-relaxed">
          Browse and read our latest publications
        </p>
      </section>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-[var(--radius)] border border-border bg-card overflow-hidden">
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
      {embedModal && (
        <EmbedModal
          slug={embedModal.slug}
          brochureTitle={embedModal.title}
          isOpen
          onClose={() => setEmbedModal(null)}
        />
      )}
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
  brochure: BrochureWithMeta;
  index: number;
  onEmbed: () => void;
  onCopyLink: (e: React.MouseEvent) => void;
}) {
  const [linkTooltip, setLinkTooltip] = useState(false);
  const [visible, setVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Staggered entry with reduced-motion check
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      setVisible(true);
      return;
    }
    const timer = setTimeout(() => setVisible(true), index * 60);
    return () => clearTimeout(timer);
  }, [index]);

  const handleCopy = (e: React.MouseEvent) => {
    onCopyLink(e);
    setLinkTooltip(true);
    setTimeout(() => setLinkTooltip(false), 1500);
  };

  const coverSrc = brochure.first_page_url ?? brochure.cover_image_url;

  return (
    <div
      ref={cardRef}
      className="group rounded-[var(--radius)] border border-border bg-card overflow-hidden transition-[border-color,box-shadow] duration-200 hover:border-foreground hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: "opacity 350ms ease-out, transform 350ms ease-out, border-color 200ms, box-shadow 200ms",
      }}
    >
      {/* Cover area */}
      <Link to={`/ecollections/${brochure.slug}`} className="block relative cursor-pointer">
        <div className="aspect-[3/4] overflow-hidden relative">
          {coverSrc ? (
            <img
              src={coverSrc}
              alt={brochure.title}
              className="w-full h-full object-cover object-top transition-transform duration-[400ms] ease-out group-hover:scale-[1.03]"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-muted">
              <BookOpen size={32} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground mt-2">No cover</span>
            </div>
          )}

          {/* Right-side spine shadow */}
          <div
            className="absolute top-0 right-0 w-2 h-full pointer-events-none"
            style={{
              background: "linear-gradient(to right, rgba(0,0,0,0), rgba(0,0,0,0.25))",
            }}
          />

          {/* Left-edge highlight */}
          <div
            className="absolute top-0 left-0 w-px h-full pointer-events-none"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          />

          {/* Page count badge */}
          {brochure.page_count > 0 && (
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-[var(--radius)] bg-black/70 text-white text-xs tracking-[0.06em] uppercase backdrop-blur-sm">
              {brochure.page_count} pages
            </div>
          )}
        </div>
      </Link>

      {/* Info area */}
      <div className="p-4 bg-card border-t border-border">
        <Link to={`/ecollections/${brochure.slug}`}>
          <h2 className="text-sm font-semibold tracking-tight text-foreground truncate leading-snug hover:opacity-70 transition-opacity">
            {brochure.title}
          </h2>
        </Link>
        {brochure.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
            {brochure.description}
          </p>
        )}

        <div className="flex items-center justify-between mt-3">
          <Link
            to={`/ecollections/${brochure.slug}`}
            className="text-xs font-medium uppercase tracking-[0.06em] text-foreground underline-offset-4 hover:underline inline-flex items-center gap-1"
          >
            Read now
            <span className="inline-block transition-transform duration-200 group-hover:translate-x-1">→</span>
          </Link>

          <div className="flex items-center gap-1">
            <div className="relative">
              <button
                onClick={handleCopy}
                className="w-7 h-7 flex items-center justify-center rounded-[var(--radius)] text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Copy link"
              >
                <Link2 size={15} />
              </button>
              {linkTooltip && (
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-[var(--radius)] bg-foreground text-background text-[11px] whitespace-nowrap animate-fade-in">
                  Copied!
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onEmbed(); }}
              className="w-7 h-7 flex items-center justify-center rounded-[var(--radius)] text-muted-foreground hover:text-foreground transition-colors"
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
