import { Link } from "react-router-dom";

const Footer = () => {
  const certifications = ["GRS", "RCS", "OEKO-TEX", "ISO 9001", "Intertek"];

  return (
    <footer className="w-full bg-foreground text-primary-foreground">
      {/* Main Footer */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="mb-6">
              <h3 className="font-serif text-2xl font-light tracking-wide mb-1">
                WIN-CYC
              </h3>
              <p className="text-xs tracking-[0.2em] text-primary-foreground/60 uppercase">
                Group Limited
              </p>
              <p className="text-sm font-chinese text-primary-foreground/80 mt-2">
                雲傑震業集團有限公司
              </p>
            </div>
            <p className="text-sm text-primary-foreground/70 leading-relaxed mb-6">
              匠心傳承 · 始於1979
              <br />
              <span className="text-xs">Timeless Craftsmanship in Garment Accessories</span>
            </p>
            
            {/* Certifications */}
            <div className="flex flex-wrap gap-2">
              {certifications.map((cert) => (
                <span
                  key={cert}
                  className="text-[10px] px-2 py-1 border border-primary-foreground/30 text-primary-foreground/70 tracking-wider"
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>

          {/* Navigation Links */}
          <div className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.2em] uppercase mb-6 text-primary-foreground/60">
              Navigation
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  首頁 Home
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  關於我們 About
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  產品 Products
                </Link>
              </li>
              <li>
                <Link to="/sustainability" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  可持續發展 Sustainability
                </Link>
              </li>
              <li>
                <Link to="/designer-studio" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  設計師工作室 Designer Studio
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.2em] uppercase mb-6 text-primary-foreground/60">
              Products 產品
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/products#buttons" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  鈕扣 Buttons
                </Link>
              </li>
              <li>
                <Link to="/products#zippers" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  拉鏈 Zippers
                </Link>
              </li>
              <li>
                <Link to="/products#lace" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  花邊 Lace & Trimming
                </Link>
              </li>
              <li>
                <Link to="/products#hardware" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  五金配件 Metal Hardware
                </Link>
              </li>
              <li>
                <Link to="/products#other" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
                  其他產品 Other Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-1">
            <h4 className="text-xs tracking-[0.2em] uppercase mb-6 text-primary-foreground/60">
              Contact 聯絡
            </h4>
            <div className="space-y-4 text-sm text-primary-foreground/80">
              <div>
                <p className="text-primary-foreground mb-1">Email</p>
                <a href="mailto:info@wincyc.com" className="hover:text-primary-foreground transition-colors">
                  info@wincyc.com
                </a>
              </div>
              <div>
                <p className="text-primary-foreground mb-1">Phone</p>
                <a href="tel:+85212345678" className="hover:text-primary-foreground transition-colors">
                  +852 1234 5678
                </a>
              </div>
              <div>
                <p className="text-primary-foreground mb-1">Address</p>
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
      <div className="border-t border-primary-foreground/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-xs text-primary-foreground/50">
              © 2024 WIN-CYC GROUP LIMITED. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy-policy" className="text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="text-xs text-primary-foreground/50 hover:text-primary-foreground/80 transition-colors">
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