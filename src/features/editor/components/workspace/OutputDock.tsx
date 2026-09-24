import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";

export interface OutputSection {
  /** Stable name, for the read-back and for whoever fills it later. */
  id: string;
  title: string;
  body: ReactNode;
}

/**
 * Versions and Output (E2 U8): the socket Phase 7's named saves and Phase
 * 9/10/12's quote, spec sheet and export plug into.
 *
 * It renders only when it has something to show (E2 §3.4 item 7) — an empty
 * dock is the placeholder group U8 deleted, wearing a different name. Since
 * U7 that rule has no exception: the save state a buyer needs at a glance is
 * on the document bar, and what is left here is the versions themselves.
 */
export function OutputDock({ sections = [] }: { sections?: OutputSection[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  // U7 took the save state to the document bar, so the one exception to "an
  // empty socket is deleted, not carried" is retired: the dock renders only
  // when it has something in it, which is standing ruling 1 with no asterisk.
  if (sections.length === 0) return null;

  return (
    <div className="border border-border" data-testid="output-dock" data-sections={sections.length}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          data-testid="output-toggle"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} strokeWidth={1.5} />
          {t("editor.output.title")}
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-border p-3" data-testid="output-body">
          {sections.map((section) => (
            <section key={section.id} data-testid="output-section" data-section={section.id} className="space-y-1.5">
              <h4 className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{section.title}</h4>
              {section.body}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
