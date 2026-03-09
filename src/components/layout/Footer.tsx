import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="w-full bg-secondary border-t border-border">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
              <div className="mb-6">
                 <div className="inline-flex items-center justify-center bg-primary px-6 py-1.5 lg:px-8 lg:py-1.5">
                   <div className="flex flex-col items-center justify-center leading-none">
                     <span className="text-sm lg:text-base text-primary-foreground font-normal" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
                       WIN-CYC
                     </span>
                     <span className="text-[4px] lg:text-[5px] tracking-[0.12em] text-primary-foreground/60 uppercase">
                       Group Limited
                     </span>
                   </div>
                 </div>
               </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Timeless Craftsmanship in Garment Accessories since 1979.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.15em] uppercase mb-6 text-muted-foreground font-medium">
              Navigation
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/", label: "Home" },
                { to: "/about", label: "About" },
                { to: "/products", label: "Products" },
                { to: "/sustainability", label: "Sustainability" },
                { to: "/designer-studio", label: "Designer Studio" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.15em] uppercase mb-6 text-muted-foreground font-medium">
              Products
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/products#buttons", label: "Buttons" },
                { to: "/products#zippers", label: "Zippers" },
                { to: "/products#lace", label: "Lace & Trimming" },
                { to: "/products#hardware", label: "Metal Hardware" },
                { to: "/products#other", label: "Other Products" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-muted-foreground hover:text-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.15em] uppercase mb-6 text-muted-foreground font-medium">
              Contact
            </h4>
            <div className="space-y-4 text-sm text-muted-foreground">
              <div>
                <p className="text-foreground mb-1 font-medium">Email</p>
                <a href="mailto:info@wincyc.com" className="hover:text-accent transition-colors">
                  info@wincyc.com
                </a>
              </div>
              <div>
                <p className="text-foreground mb-1 font-medium">Phone</p>
                <a href="tel:+85212345678" className="hover:text-accent transition-colors">
                  +852 1234 5678
                </a>
              </div>
              <div>
                <p className="text-foreground mb-1 font-medium">Address</p>
                <p className="leading-relaxed">
                  Hong Kong<br />
                  Guangdong, China
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-muted-foreground">
              © 2024 WIN-CYC GROUP LIMITED. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-accent transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-xs text-muted-foreground hover:text-accent transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
