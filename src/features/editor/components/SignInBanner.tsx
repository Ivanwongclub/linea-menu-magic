import { Link, useLocation } from "react-router-dom";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/features/i18n/I18nProvider";

export function SignInBanner() {
  const { t } = useI18n();
  const location = useLocation();
  const next = encodeURIComponent(location.pathname + location.search);
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-secondary/40">
      <p className="text-sm text-foreground">{t("editor.signIn.banner")}</p>
      <Link to={`/designer-studio/login?next=${next}`}>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs tracking-[0.05em] rounded-none">
          <LogIn className="h-3.5 w-3.5" />
          {t("editor.signIn.cta")}
        </Button>
      </Link>
    </div>
  );
}
