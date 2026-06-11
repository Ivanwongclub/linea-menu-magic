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

            {/* Mini visual — atelier photograph */}
            <div className="mt-5 w-full max-w-[260px] aspect-[3/2] border border-border bg-secondary/40 relative overflow-hidden">
              <img
                src={`/images/studio/workflow-${key}-${["concept", "craft", "spec", "production"][i]}.webp`}
                alt={t(`studioIntro.step${key}Title`)}
                loading="lazy"
                decoding="async"
                className="object-cover w-full h-full"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
