import { Search, Layers, Presentation, FileCheck2 } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";

const steps = [
  { icon: Search, key: 1 },
  { icon: Layers, key: 2 },
  { icon: Presentation, key: 3 },
  { icon: FileCheck2, key: 4 },
];

export default function StudioWorkflowRail() {
  const { t } = useI18n();

  return (
    <div className="relative">
      {/* Desktop hairline connector */}
      <div className="hidden lg:block absolute top-[34px] left-[10%] right-[10%] h-px bg-border" aria-hidden="true" />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-6 relative">
        {steps.map(({ icon: Icon, key }, i) => (
          <div key={key} className="relative flex flex-col items-start lg:items-center text-left lg:text-center">
            {/* Numbered chip */}
            <div className="relative z-10 w-[68px] h-[68px] border border-foreground bg-background flex flex-col items-center justify-center mb-5">
              <span className="text-[9px] tracking-[0.18em] uppercase text-muted-foreground font-medium leading-none mb-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Icon className="w-4 h-4 text-foreground" strokeWidth={1.5} />
            </div>

            <h3 className="text-sm font-semibold tracking-tight text-foreground mb-2">
              {t(`studioIntro.step${key}Title`)}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[220px]">
              {t(`studioIntro.step${key}Body`)}
            </p>

            {/* Mini visual */}
            <div className="mt-5 w-full max-w-[200px] aspect-[4/3] border border-border bg-secondary/40 relative overflow-hidden">
              <div
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
                  backgroundSize: "16px 16px",
                }}
              />
              {key === 1 && (
                <div className="absolute inset-3 grid grid-cols-3 gap-1.5">
                  {[...Array(6)].map((_, idx) => (
                    <div key={idx} className="bg-foreground/[0.06] border border-foreground/10" />
                  ))}
                </div>
              )}
              {key === 2 && (
                <>
                  <div className="absolute top-3 left-3 w-1/2 h-1/2 bg-foreground/[0.08] border border-foreground/15" />
                  <div className="absolute bottom-3 right-3 w-1/3 h-1/3 bg-foreground/[0.06] border border-foreground/15" />
                </>
              )}
              {key === 3 && (
                <div className="absolute inset-3 border border-foreground/15 bg-background flex items-center justify-center">
                  <div className="w-[60%] h-[55%] bg-foreground/[0.06]" />
                </div>
              )}
              {key === 4 && (
                <div className="absolute inset-3 flex flex-col gap-1.5 p-2">
                  <div className="h-1.5 bg-foreground/[0.1] w-3/4" />
                  <div className="h-1.5 bg-foreground/[0.06] w-1/2" />
                  <div className="h-1.5 bg-foreground/[0.06] w-2/3" />
                  <div className="mt-auto h-4 bg-foreground border border-foreground w-1/3" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
