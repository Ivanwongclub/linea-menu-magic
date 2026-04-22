import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Library,
  Layers,
  Box,
  Link2,
  ClipboardList,
  ShieldCheck,
  Lock,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useAuth } from "@/features/auth/AuthProvider";
import { useI18n } from "@/features/i18n/I18nProvider";
import { useScrollAnimation } from "@/hooks/use-scroll-animation";
import StudioPreview from "@/components/designer-studio/StudioPreview";
import StudioCapabilityTile from "@/components/designer-studio/StudioCapabilityTile";
import StudioWorkflowRail from "@/components/designer-studio/StudioWorkflowRail";

const REVEAL_BASE = "transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)]";

const trustWordmarks = [
  "POLO RALPH LAUREN",
  "TOMMY HILFIGER",
  "LACOSTE",
  "CALVIN KLEIN",
  "HUGO BOSS",
];

const DesignerStudio = () => {
  const { t } = useI18n();
  const { session, primaryBrand } = useAuth();

  const workspaceHref = session ? "/designer-studio/dashboard?tab=library" : "/designer-studio/login";

  const trust = useScrollAnimation();
  const caps = useScrollAnimation();
  const flow = useScrollAnimation();
  const spot1 = useScrollAnimation();
  const spot2 = useScrollAnimation();
  const metrics = useScrollAnimation();
  const faq = useScrollAnimation();
  const bottom = useScrollAnimation();

  const capabilities = [
    { icon: Library, t: "cap1" },
    { icon: Layers, t: "cap2" },
    { icon: Box, t: "cap3" },
    { icon: Link2, t: "cap4" },
    { icon: ClipboardList, t: "cap5" },
    { icon: ShieldCheck, t: "cap6" },
  ] as const;

  return (
    <>
      {/* 1. HERO */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-secondary/40 via-background to-background py-20 lg:py-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-5">
              {t("studioIntro.eyebrow")}
            </p>
            <h1 className="text-4xl lg:text-6xl font-semibold tracking-tight text-foreground leading-[1.05] mb-6">
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
              <div className="inline-flex items-center gap-2 mt-6 px-3 py-1.5 border border-border bg-background">
                <ShieldCheck className="w-3.5 h-3.5 text-foreground" strokeWidth={1.5} />
                <p className="text-xs text-foreground/80">
                  {t("studioIntro.brandHint", { brand: primaryBrand.name })}
                </p>
              </div>
            )}
          </div>

          <div className="lg:pl-4">
            <StudioPreview />
          </div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section
        ref={trust.ref}
        className={`border-b border-border bg-background py-8 px-6 lg:px-8 ${REVEAL_BASE} ${trust.isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground whitespace-nowrap">
            {t("studioIntro.trustLabel")}
          </p>
          <div className="flex-1 flex flex-wrap items-center justify-center lg:justify-end gap-x-8 lg:gap-x-12 gap-y-3">
            {trustWordmarks.map((name) => (
              <span
                key={name}
                className="text-[11px] tracking-[0.22em] text-foreground/40 font-semibold hover:text-foreground/80 transition-colors duration-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CAPABILITY GRID */}
      <section
        ref={caps.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-secondary/30 ${REVEAL_BASE} ${caps.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-12 lg:mb-14">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t("studioIntro.capabilitiesEyebrow")}
            </p>
            <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight text-foreground">
              {t("studioIntro.capabilitiesTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
            {capabilities.map(({ icon, t: key }) => (
              <StudioCapabilityTile
                key={key}
                icon={icon}
                title={t(`studioIntro.${key}Title`)}
                body={t(`studioIntro.${key}Body`)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 4. WORKFLOW RAIL */}
      <section
        ref={flow.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-background border-y border-border ${REVEAL_BASE} ${flow.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-14 mb-14">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
                {t("studioIntro.flowLabel")}
              </p>
              <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight text-foreground">
                {t("studioIntro.flowTitle")}
              </h2>
            </div>
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed self-end">
              {t("studioIntro.flowBody")}
            </p>
          </div>

          <StudioWorkflowRail />
        </div>
      </section>

      {/* 5. SPOTLIGHT ROW A — text left / visual right */}
      <section
        ref={spot1.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-secondary/30 ${REVEAL_BASE} ${spot1.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t("studioIntro.spot1Eyebrow")}
            </p>
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-5">
              {t("studioIntro.spot1Title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t("studioIntro.spot1Body")}
            </p>
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span className="text-xs text-foreground/80 leading-relaxed">
                    {t(`studioIntro.spot1Bullet${i}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Mock — composer board */}
          <div className="relative aspect-[4/3] border border-border bg-background overflow-hidden">
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }} />
            <div className="absolute top-[8%] left-[8%] w-[55%] h-[80%] bg-secondary border border-foreground/10">
              <div className="absolute top-[20%] left-[18%] w-[28%] aspect-square bg-foreground/[0.06] border border-foreground/15" />
              <div className="absolute bottom-[18%] right-[15%] w-[20%] aspect-square bg-foreground/[0.06] border border-foreground/15 rounded-full" />
              <div className="absolute top-[55%] left-[35%] w-[18%] aspect-[2/1] bg-foreground/[0.06] border border-foreground/15" />
            </div>
            <div className="absolute top-[12%] right-[6%] max-w-[28%] flex items-start gap-1.5">
              <MessageSquare className="w-3 h-3 text-foreground/30 mt-0.5 shrink-0" strokeWidth={1.5} />
              <div>
                <p className="text-[9px] font-semibold text-foreground/60 leading-tight mb-0.5">Collar trim</p>
                <p className="text-[8px] text-muted-foreground/50 leading-tight">Brushed nickel — verify finish</p>
              </div>
            </div>
            <div className="absolute bottom-[8%] right-[6%] w-[28%] border border-foreground/10 bg-background/90 p-2">
              <div className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground/50 mb-1.5">Layers</div>
              <div className="space-y-1">
                <div className="h-1.5 bg-foreground/[0.1] w-3/4" />
                <div className="h-1.5 bg-foreground/[0.06] w-1/2" />
                <div className="h-1.5 bg-foreground/[0.06] w-2/3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5b. SPOTLIGHT ROW B — visual left / text right */}
      <section
        ref={spot2.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-background border-t border-border ${REVEAL_BASE} ${spot2.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Mock — locked private library */}
          <div className="relative aspect-[4/3] border border-border bg-secondary/40 overflow-hidden order-2 lg:order-1">
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }} />
            {/* Brand tag header */}
            <div className="absolute top-6 left-6 right-6 flex items-center justify-between border border-foreground/15 bg-background px-4 py-2.5">
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-foreground" strokeWidth={2} />
                <span className="text-[10px] uppercase tracking-[0.18em] text-foreground font-semibold">Polo Ralph Lauren</span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.15em] text-muted-foreground">Private</span>
            </div>
            {/* Mock library grid */}
            <div className="absolute top-[28%] left-6 right-6 bottom-6 grid grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="border border-foreground/10 bg-background flex flex-col">
                  <div className="flex-1 bg-foreground/[0.05] flex items-center justify-center">
                    <div className="w-1/2 h-1/2 bg-foreground/[0.08] rounded-full" />
                  </div>
                  <div className="px-1.5 py-1 border-t border-foreground/10">
                    <div className="h-1 bg-foreground/[0.1] w-full mb-0.5" />
                    <div className="h-1 bg-foreground/[0.06] w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t("studioIntro.spot2Eyebrow")}
            </p>
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-5">
              {t("studioIntro.spot2Title")}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {t("studioIntro.spot2Body")}
            </p>
            <ul className="space-y-3">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
                  <span className="text-xs text-foreground/80 leading-relaxed">
                    {t(`studioIntro.spot2Bullet${i}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 6. METRICS STRIP */}
      <section
        ref={metrics.ref}
        className={`py-16 lg:py-20 px-6 lg:px-8 bg-secondary/30 border-y border-border ${REVEAL_BASE} ${metrics.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-7xl mx-auto">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-8 text-center">
            {t("studioIntro.metricsLabel")}
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-y divide-x divide-border lg:divide-y-0 border border-border bg-background">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="px-6 py-8 lg:py-10 text-center">
                <div className="text-3xl lg:text-5xl font-semibold tracking-tight text-foreground mb-2">
                  {t(`studioIntro.metric${i}Value`)}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  {t(`studioIntro.metric${i}Label`)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section
        ref={faq.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-background ${REVEAL_BASE} ${faq.isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground mb-3">
              {t("studioIntro.faqLabel")}
            </p>
            <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight text-foreground">
              {t("studioIntro.faqTitle")}
            </h2>
          </div>

          <Accordion type="single" collapsible className="border-t border-border">
            {[1, 2, 3, 4].map((i) => (
              <AccordionItem key={i} value={`faq-${i}`} className="border-b border-border">
                <AccordionTrigger className="text-sm font-semibold tracking-tight text-foreground py-5 hover:no-underline">
                  {t(`studioIntro.faq${i}Q`)}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-5">
                  {t(`studioIntro.faq${i}A`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* 8. FINAL CTA */}
      <section
        ref={bottom.ref}
        className={`py-20 lg:py-24 px-6 lg:px-8 bg-foreground text-background ${REVEAL_BASE} ${bottom.isVisible ? "opacity-100" : "opacity-0"}`}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl lg:text-4xl font-semibold tracking-tight mb-4">
            {t("studioIntro.bottomTitle")}
          </h2>
          <p className="text-sm lg:text-base text-background/75 leading-relaxed max-w-2xl mx-auto mb-8">
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
          {!session && (
            <Link
              to="/designer-studio/login"
              className="inline-block mt-6 text-[11px] uppercase tracking-[0.16em] text-background/60 hover:text-background underline-offset-4 hover:underline transition-colors"
            >
              {t("studioIntro.signInLink")}
            </Link>
          )}
        </div>
      </section>
    </>
  );
};

export default DesignerStudio;
