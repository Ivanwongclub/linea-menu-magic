import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import { Button } from "@/components/ui/button";

const locations = [
  { city: "Hong Kong", role: "HQ", since: "1979" },
  { city: "Shenzhen", role: "Production", since: "2011" },
  { city: "Munich", role: "Europe", since: "2012" },
  { city: "New York", role: "Americas", since: "2013" },
];

const ContactSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible, getDelay } = useStaggeredAnimation(3, 150);

  const contactItems = [
    { icon: Mail, title: "Email", content: "info@wincyc.com", href: "mailto:info@wincyc.com" },
    { icon: Phone, title: "Phone", content: "+852 1234 5678", href: "tel:+85212345678" },
    { icon: MapPin, title: "Location", content: "Hong Kong & Guangdong", href: null },
  ];

  return (
    <section className="section-light overflow-hidden">
      {/* Editorial header with location grid */}
      <div
        ref={headerRef}
        className={`section-inner mb-16 flex flex-col lg:flex-row items-start gap-12 transition-all duration-700 ease-out ${
          headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
        }`}
      >
        <div className="lg:w-1/2">
          <span className="section-label">Get in touch</span>
          <h2 className="text-3xl font-semibold tracking-tight mt-2 text-foreground">
            We'd love to hear from you
          </h2>
          <p className="text-sm text-muted-foreground mt-4 max-w-md leading-relaxed">
            Our team is based in Hong Kong with offices and production facilities across Asia, Europe, and the Americas.
          </p>
        </div>

        <div className="lg:w-1/2 grid grid-cols-2 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.city}
              className="border border-[hsl(var(--border))] rounded-[var(--radius)] p-4"
            >
              <span className="text-xs uppercase tracking-[0.1em] text-muted-foreground block mb-1">
                {loc.role} · Est. {loc.since}
              </span>
              <span className="text-base font-semibold text-foreground">
                {loc.city}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Contact cards */}
      <div className="section-inner text-center">
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {contactItems.map((item, index) => (
            <div
              key={item.title}
              className={`group p-8 bg-secondary border border-border hover:border-foreground rounded-[var(--radius)] transition-all duration-500 ease-out hover:-translate-y-1 ${
                cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"
              }`}
              style={getDelay(index)}
            >
              <item.icon
                className="w-6 h-6 text-foreground mx-auto mb-4 transition-transform duration-300 group-hover:scale-110"
                strokeWidth={1.5}
              />
              <h3 className="text-sm font-medium text-foreground mb-2">{item.title}</h3>
              {item.href ? (
                <a
                  href={item.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {item.content}
                </a>
              ) : (
                <p className="text-sm text-muted-foreground">{item.content}</p>
              )}
            </div>
          ))}
        </div>

        <Link
          to="/contact"
          className={`inline-block transition-all duration-500 ${
            cardsVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          style={{ transitionDelay: "450ms" }}
        >
          <Button size="lg">Get a Quote</Button>
        </Link>
      </div>
    </section>
  );
};

export default ContactSection;
