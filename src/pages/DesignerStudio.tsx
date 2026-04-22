import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";

const DesignerStudio = () => {
  const { t } = useI18n();
  const { session, primaryBrand } = useAuth();

  const workspaceHref = session ? "/designer-studio/dashboard?tab=library" : "/designer-studio/login";

  return (
    <>
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/30 via-background to-background py-20 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-4">
              {t("studioIntro.eyebrow")}
            </p>
            <h1 className="text-3xl lg:text-5xl font-semibold tracking-tight text-foreground leading-tight mb-6">
              {t("studioIntro.title")}
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground max-w-xl leading-relaxed mb-8">
              {t("studioIntro.subtitle")}
            </p>

            <div className="flex flex-wrap gap-3">
              <Link to="/designer-studio/trim-library">
                <Button size="lg" className="tracking-[0.05em] text-xs px-8 uppercase">
                  {t("studioIntro.primaryCta")}
                </Button>
              </Link>
              <Link to={workspaceHref}>
                <Button variant="outline" size="lg" className="tracking-[0.05em] text-xs px-8 uppercase">
                  {session ? t("studioIntro.workspaceCtaAuthed") : t("studioIntro.workspaceCtaGuest")}
                </Button>
              </Link>
            </div>

            {session && primaryBrand && (
              <p className="text-xs text-foreground/70 mt-5">
                {t("studioIntro.brandHint", { brand: primaryBrand.name })}
              </p>
            )}
          </div>

          <div className="grid gap-4">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="border border-border bg-background/70 backdrop-blur-sm p-5 lg:p-6"
              >
                <h2 className="text-sm font-semibold tracking-tight text-foreground mb-2">
                  {t(`studioIntro.value${item}Title`)}
                </h2>
                <p className="text-xs leading-relaxed text-muted-foreground">
                  {t(`studioIntro.value${item}Body`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 lg:px-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.1fr] gap-10 lg:gap-14 items-start">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
              {t("studioIntro.flowLabel")}
            </p>
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-5">
              {t("studioIntro.flowTitle")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              {t("studioIntro.flowBody")}
            </p>
          </div>

          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="flex items-start gap-3 border border-border p-4 lg:p-5">
                <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-foreground mb-1">
                    {t(`studioIntro.flow${item}Title`)}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {t(`studioIntro.flow${item}Body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6 lg:px-10 bg-foreground text-background">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight mb-4">
            {t("studioIntro.bottomTitle")}
          </h2>
          <p className="text-sm text-background/75 leading-relaxed max-w-2xl mx-auto mb-8">
            {t("studioIntro.bottomBody")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/designer-studio/trim-library">
              <Button variant="outline-inverse" size="lg" className="tracking-[0.05em] text-xs px-8 uppercase">
                {t("studioIntro.primaryCta")}
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="ghost"
                size="lg"
                className="tracking-[0.05em] text-xs px-8 uppercase text-background hover:bg-background/10"
              >
                <span>{t("studioIntro.contactCta")}</span>
                <ArrowRight className="w-3.5 h-3.5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default DesignerStudio;
