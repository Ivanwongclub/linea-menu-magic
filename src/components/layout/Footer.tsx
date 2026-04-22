import { Link } from "react-router-dom";
import { useCookieContext } from "@/features/cookies/CookieProvider";
import { useI18n } from "@/features/i18n/I18nProvider";

const Footer = () => {
  const { resetConsent, openCustomise } = useCookieContext();
  const { t } = useI18n();

  return (
    <footer className="w-full bg-foreground text-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <div className="flex flex-col items-center leading-none select-none">
                <span className="text-[24px] font-extrabold tracking-[0.06em] text-white">WIN-CYC</span>
                <span className="text-[12px] lg:text-[14px] tracking-[0.12em] uppercase text-white/70">Group Limited</span>
              </div>
            </div>
            <p className="text-xs text-white/45 tracking-[0.06em] mt-3 leading-relaxed">
              {t("footer.brand.tagline")}
            </p>
          </div>

          {/* Navigation */}
          <div className="lg:col-span-1">
            <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/40 mb-5">
              {t("footer.nav.title")}
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/", key: "footer.nav.home" },
                { to: "/about", key: "footer.nav.about" },
                { to: "/products", key: "footer.nav.products" },
                { to: "/sustainability", key: "footer.nav.sustainability" },
                { to: "/ecollections", key: "footer.nav.ecatalogue" },
                { to: "/designer-studio", key: "footer.nav.designerStudio" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/65 hover:text-white hover:underline transition-colors duration-150">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div className="lg:col-span-1">
            <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/40 mb-5">
              {t("footer.products.title")}
            </h4>
            <ul className="space-y-3">
              {[
                { to: "/products#buttons", key: "footer.products.buttons" },
                { to: "/products#zippers", key: "footer.products.zippers" },
                { to: "/products#lace", key: "footer.products.laceTrim" },
                { to: "/products#hardware", key: "footer.products.metalHardware" },
                { to: "/products#other", key: "footer.products.other" },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm text-white/65 hover:text-white hover:underline transition-colors duration-150">
                    {t(link.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-1">
            <h4 className="text-xs font-medium uppercase tracking-[0.12em] text-white/40 mb-5">
              {t("footer.contact.title")}
            </h4>
            <div className="space-y-4 text-sm text-white/65">
              <div>
                <p className="text-white mb-1 font-medium">{t("footer.contact.email")}</p>
                <a href="mailto:info@wincyc.com" className="hover:text-white hover:underline transition-colors duration-150">
                  info@wincyc.com
                </a>
              </div>
              <div>
                <p className="text-white mb-1 font-medium">{t("footer.contact.phone")}</p>
                <a href="tel:+85212345678" className="hover:text-white hover:underline transition-colors duration-150">
                  +852 1234 5678
                </a>
              </div>
              <div>
                <p className="text-white mb-1 font-medium">{t("footer.contact.address")}</p>
                <p className="leading-relaxed">
                  {t("footer.contact.hk")}<br />
                  {t("footer.contact.gd")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10 mt-12 pt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center gap-4">
              <p className="text-xs text-white/35">
                {t("footer.rights")}
              </p>
              <button
                onClick={() => { resetConsent(); openCustomise(); }}
                className="text-xs text-white/45 hover:text-white/70 transition-colors duration-150"
              >
                {t("footer.cookieSettings")}
              </button>
            </div>
            <div className="flex space-x-6">
              <Link to="/privacy-policy" className="text-xs text-white/35 hover:text-white transition-colors duration-150">
                {t("footer.privacy")}
              </Link>
              <Link to="/terms-of-service" className="text-xs text-white/35 hover:text-white transition-colors duration-150">
                {t("footer.terms")}
              </Link>
              <Link to="/cookie-policy" className="text-xs text-white/35 hover:text-white transition-colors duration-150">
                {t("footer.cookies")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
