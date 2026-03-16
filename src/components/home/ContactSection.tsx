import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";
import { Button } from "@/components/ui/button";

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
      <div className="section-inner text-center">
        <div ref={headerRef}>
          <span className={`section-label transition-all duration-700 ease-out ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Get in Touch
          </span>
          <LetterReveal
            text="Contact Us"
            as="h2"
            className="text-5xl md:text-6xl lg:text-7xl font-serif-display italic text-foreground mb-12"
            isVisible={headerVisible}
            startDelay={100}
            letterDelay={55}
          />
        </div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {contactItems.map((item, index) => (
            <div
              key={item.title}
              className={`group p-8 bg-secondary border border-border hover:border-foreground rounded-[var(--radius)] transition-all duration-500 ease-out hover:-translate-y-1 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={getDelay(index)}
            >
              <item.icon className="w-6 h-6 text-foreground mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-foreground mb-2">{item.title}</h3>
              {item.href ? (
                <a href={item.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{item.content}</a>
              ) : (
                <p className="text-sm text-muted-foreground">{item.content}</p>
              )}
            </div>
          ))}
        </div>

        <Link
          to="/contact"
          className={`inline-block transition-all duration-500 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '450ms' }}
        >
          <Button size="lg">Get a Quote</Button>
        </Link>
      </div>
    </section>
  );
};

export default ContactSection;
