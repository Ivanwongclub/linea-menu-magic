import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

// Nav links are added as their routes land phase by phase, rather than
// linking ahead to routes that don't exist yet.
const NAV_ITEMS = [{ to: "/admin/taxonomy", label: "Taxonomy" }];

/**
 * Deliberately does not render the customer-facing Header/Footer (Layout.tsx)
 * — this is the first route in the app to sit outside that shared shell.
 */
export default function AdminLayout() {
  const { signOut } = useAuth();
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
            <span className="text-sm font-medium tracking-wide text-foreground">
              WIN-CYC Admin
            </span>
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
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <Button variant="ghost" size="sm" className="rounded-none" onClick={handleSignOut}>
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sign out
          </Button>
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
