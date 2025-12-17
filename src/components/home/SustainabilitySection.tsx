import { Link } from "react-router-dom";

const SustainabilitySection = () => {
  const certifications = [
    { name: "GRS", fullName: "Global Recycled Standard" },
    { name: "RCS", fullName: "Recycled Claim Standard" },
    { name: "OEKO-TEX", fullName: "Standard 100" },
    { name: "ISO 9001", fullName: "Quality Management" },
  ];

  return (
    <section className="py-24 px-6 lg:px-8 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Visual */}
          <div className="relative">
            <div className="aspect-square bg-secondary" />
            <div className="absolute inset-8 border border-border" />
          </div>

          {/* Content */}
          <div>
            <p className="text-subtitle mb-4">Sustainability</p>
            <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-6">
              永續願景
            </h2>
            
            <p className="text-muted-foreground leading-relaxed mb-8">
              我們深信，優質的產品應該對環境負責。透過國際認證的可持續製程，
              我們致力於減少生態足跡，同時維持卓越的品質標準。
            </p>

            {/* Certifications */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {certifications.map((cert) => (
                <div key={cert.name} className="p-4 border border-border">
                  <span className="text-lg font-serif text-foreground">{cert.name}</span>
                  <p className="text-xs text-muted-foreground mt-1">{cert.fullName}</p>
                </div>
              ))}
            </div>

            <Link
              to="/sustainability"
              className="inline-flex items-center text-sm tracking-wider text-foreground link-elegant"
            >
              了解更多
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SustainabilitySection;