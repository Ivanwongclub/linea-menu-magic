import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

// Nav links are added as their routes land phase by phase, rather than
// linking ahead to routes that don't exist yet.
const NAV_ITEMS = [
  { to: "/admin/products", key: "admin.nav.products" },
  { to: "/admin/finishes", key: "admin.nav.finishes" },
  { to: "/admin/taxonomy", key: "admin.nav.taxonomy" },
];

/**
 * Deliberately does not render the customer-facing Header/Footer (Layout.tsx)
 * — this is the first route in the app to sit outside that shared shell.
 * Shares the app-wide I18nProvider and LanguageSwitcher, so a staff member's
 * language choice follows them between the site and the CMS.
 */
export default function AdminLayout() {
  const { signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-sm font-medium tracking-wide text-foreground">{t("admin.brand")}</span>
            <nav className="flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "px-3 py-1.5 text-sm border-b-2 transition-colors",
                      isActive
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(item.key)}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button variant="ghost" size="sm" className="rounded-none" onClick={handleSignOut}>
              <LogOut className="w-3.5 h-3.5 mr-2" />
              {t("admin.common.signOut")}
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
