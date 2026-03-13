import { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import { brochures } from "@/data/brochures";

const Portfolio = () => {
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
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground tracking-tight mb-4">
          Your brochures, beautifully presented
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-2xl leading-relaxed">
          Browse our digital brochures and catalogs. Click any publication to explore it in an immersive flipbook experience with page-turn animations, zoom, and more.
        </p>
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
                <Link
                  to={`/portfolio/view/${brochure.id}`}
                  className="inline-block px-6 py-2.5 bg-primary text-primary-foreground text-xs tracking-widest uppercase rounded-full transition-all duration-300 hover:bg-primary-hover"
                >
                  Read Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Portfolio;
