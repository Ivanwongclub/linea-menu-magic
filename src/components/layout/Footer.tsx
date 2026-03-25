import { Link } from "react-router-dom";
import { useCookieContext } from "@/features/cookies/CookieProvider";

const Footer = () => {
  const { resetConsent, openCustomise } = useCookieContext();

  return (
    <footer className="w-full bg-foreground text-background pt-16 pb-8">
      <div className="max-w-[1200px] mx-auto px-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center bg-background px-5 py-1 lg:px-7 lg:py-1">
                <div className="flex flex-col items-center justify-center leading-none">
                  <span className="text-xs lg:text-sm text-foreground font-bold tracking-[0.04em]">
                    WIN-CYC
                  </span>
                  <span className="text-[6px] lg:text-[8px] tracking-[0.12em] text-foreground uppercase">
                    Group Limited
                  </span>
                </div>
              </div>
            </div>
            <p className="text-xs text-white/45 tracking-[0.06em] mt-3 leading-relaxed">
              Timeless Craftsmanship in Garment Accessories since 1979.
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-1">
            <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/40 mb-5">
              Navigation
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/", label: "Home" },
                { to: "/about", label: "About" },
                { to: "/products", label: "Products" },
                { to: "/sustainability", label: "Sustainability" },
                { to: "/brochures", label: "Brochures" },
                { to: "/designer-studio", label: "Designer Studio" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/65 hover:text-white hover:underline transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div className="lg:col-span-1">
            <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/40 mb-5">
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
                  <Link to={link.to} className="text-sm text-white/65 hover:text-white hover:underline transition-colors duration-150">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-1">
            <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/40 mb-5">
              Contact
            </h4>
            <div className="space-y-4 text-sm text-white/65">
              <div>
                <p className="text-white mb-1 font-medium">Email</p>
                <a href="mailto:info@wincyc.com" className="hover:text-white hover:underline transition-colors duration-150">
                  info@wincyc.com
                </a>
              </div>
              <div>
                <p className="text-white mb-1 font-medium">Phone</p>
                <a href="tel:+85212345678" className="hover:text-white hover:underline transition-colors duration-150">
                  +852 1234 5678
                </a>
              </div>
              <div>
                <p className="text-white mb-1 font-medium">Address</p>
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
      <div className="border-t border-white/10 mt-12 pt-8">
        <div className="max-w-[1200px] mx-auto px-10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-4">
              <p className="text-xs text-white/35">
                © 2024 WIN-CYC GROUP LIMITED. All rights reserved.
              </p>
              <button
                onClick={() => { resetConsent(); openCustomise(); }}
                className="text-xs text-white/45 hover:text-white/70 transition-colors duration-150"
              >
                Cookie Settings
              </button>
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy-policy" className="text-xs text-white/35 hover:text-white transition-colors duration-150">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-xs text-white/35 hover:text-white transition-colors duration-150">
                Terms of Service
              </Link>
              <Link to="/cookie-policy" className="text-xs text-white/35 hover:text-white transition-colors duration-150">
                Cookies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
