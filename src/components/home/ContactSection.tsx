import { Link } from "react-router-dom";
import { Mail, Phone, MapPin } from "lucide-react";

const ContactSection = () => {
  return (
    <section className="py-24 px-6 lg:px-8 bg-secondary">
      <div className="max-w-5xl mx-auto text-center">
        <p className="text-subtitle mb-4">Get in Touch</p>
        <h2 className="font-serif text-3xl md:text-4xl font-light text-foreground mb-12">
          聯絡我們
        </h2>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="p-8 bg-background">
            <Mail className="w-6 h-6 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-foreground mb-2">Email</h3>
            <a href="mailto:info@wincyc.com" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              info@wincyc.com
            </a>
          </div>

          <div className="p-8 bg-background">
            <Phone className="w-6 h-6 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-foreground mb-2">Phone</h3>
            <a href="tel:+85212345678" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              +852 1234 5678
            </a>
          </div>

          <div className="p-8 bg-background">
            <MapPin className="w-6 h-6 text-muted-foreground mx-auto mb-4" strokeWidth={1.5} />
            <h3 className="text-sm font-medium text-foreground mb-2">Location</h3>
            <p className="text-sm text-muted-foreground">
              Hong Kong & Guangdong
            </p>
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/contact"
          className="inline-block px-12 py-4 bg-foreground text-background text-xs tracking-[0.2em] uppercase transition-all duration-300 hover:bg-primary-hover"
        >
          獲取報價
        </Link>
      </div>
    </section>
  );
};

export default ContactSection;