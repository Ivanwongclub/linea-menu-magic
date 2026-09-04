import { ReactNode } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useCatalogueEditorStatus } from "@/features/admin/hooks/useCatalogueEditorStatus";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";

interface Props {
  children: ReactNode;
}

/**
 * Gates /admin on a `catalogue_editors` row, not brand membership — this is
 * a UX gate only. The database already enforces this on every write (and
 * every catalogue-table read beyond the public/house baseline) via RLS
 * policies keyed off the same `user_is_catalogue_editor` predicate, so a bug
 * here fails safe: a rejected write, not an unauthorized one.
 */
export default function RequireCatalogueEditor({ children }: Props) {
  const { session, loading: authLoading, signOut } = useAuth();
  const { isEditor, loading: editorLoading } = useCatalogueEditorStatus();
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/admin/login");
  };

  if (authLoading || (session && editorLoading)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="h-3 w-40 bg-secondary animate-pulse rounded" />
      </div>
    );
  }

  if (!session) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/admin/login?next=${next}`} replace />;
  }

  // Terminal state, not a redirect: bouncing back to /admin/login here would
  // just send this same session straight back to this same screen.
  if (!isEditor) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center space-y-6 border border-border p-10 bg-background">
          <div className="mx-auto w-12 h-12 flex items-center justify-center border border-foreground">
            <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-light tracking-wide text-foreground">{t("admin.noAccess.title")}</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">{t("admin.noAccess.body")}</p>
          </div>
          <Button variant="outline" className="rounded-none" onClick={handleSignOut}>
            <LogOut className="w-3.5 h-3.5 mr-2" />
            {t("admin.common.signOut")}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
