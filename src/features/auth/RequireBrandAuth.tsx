import { ReactNode } from "react";
import { Navigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";

interface Props {
  children: ReactNode;
}

export default function RequireBrandAuth({ children }: Props) {
  const { session, brands, loading, membershipLoading } = useAuth();
  const { t } = useI18n();
  const location = useLocation();

  if (loading || (session && membershipLoading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="h-3 w-40 bg-secondary animate-pulse rounded" />
      </div>
    );
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/designer-studio/login?next=${next}`} replace />;
  }

  if (brands.length === 0) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-6 border border-border p-10 bg-background">
          <div className="mx-auto w-12 h-12 flex items-center justify-center border border-foreground">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-light tracking-wide text-foreground">{t("auth.noBrand.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("auth.noBrand.body")}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="rounded-none">
              <Link to="/contact">{t("auth.noBrand.contact")}</Link>
            </Button>
            <Button asChild variant="ghost" className="rounded-none">
              <Link to="/designer-studio">{t("auth.noBrand.back")}</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
