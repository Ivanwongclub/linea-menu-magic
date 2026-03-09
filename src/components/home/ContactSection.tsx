import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";
import { useScrollAnimation, useStaggeredAnimation } from "@/hooks/use-scroll-animation";
import LetterReveal from "@/components/ui/LetterReveal";

const ContactSection = () => {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation();
  const { ref: cardsRef, isVisible: cardsVisible, getDelay } = useStaggeredAnimation(3, 150);

  const contactItems = [
    { icon: Mail, title: "Email", content: "info@wincyc.com", href: "mailto:info@wincyc.com" },
    { icon: Phone, title: "Phone", content: "+852 1234 5678", href: "tel:+85212345678" },
    { icon: MapPin, title: "Location", content: "Hong Kong & Guangdong", href: null },
  ];

  return (
    <section className="py-24 px-6 lg:px-8 bg-secondary overflow-hidden">
      <div className="max-w-5xl mx-auto text-center">
        <div ref={headerRef}>
          <p className={`text-subtitle mb-4 transition-all duration-700 ease-out ${headerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Get in Touch
          </p>
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
              className={`group p-8 bg-background rounded-lg transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
              style={getDelay(index)}
            >
              <item.icon className="w-6 h-6 text-accent mx-auto mb-4 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
              <h3 className="text-sm font-medium text-foreground mb-2">{item.title}</h3>
              {item.href ? (
                <a href={item.href} className="text-sm text-muted-foreground hover:text-accent transition-colors">{item.content}</a>
              ) : (
                <p className="text-sm text-muted-foreground">{item.content}</p>
              )}
            </div>
          ))}
        </div>

        <Link
          to="/contact"
          className={`inline-block px-12 py-4 bg-primary text-primary-foreground text-xs tracking-[0.2em] uppercase rounded-full transition-all duration-500 hover:bg-primary-hover hover:scale-105 ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          style={{ transitionDelay: '450ms' }}
        >
          Get a Quote
        </Link>
      </div>
    </section>
  );
};

export default ContactSection;
