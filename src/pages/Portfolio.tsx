import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageBreadcrumb from "@/components/ui/PageBreadcrumb";
import { brochures } from "@/data/brochures";
import type { Brochure } from "@/types/flipbook";

const Portfolio = () => {
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-8 pb-20">
        <p className="text-muted-foreground text-sm max-w-2xl mb-12">
          Browse our digital brochures and catalogs. Click "Read Now" to explore each publication in an immersive flipbook experience.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {brochures.map((brochure) => (
            <div
              key={brochure.id}
              className="group rounded-lg border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <div className="aspect-[3/4] overflow-hidden">
                <img
                  src={brochure.coverImage}
                  alt={brochure.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
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
