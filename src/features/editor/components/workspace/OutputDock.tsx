import { useState, type ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import type { AutosaveStatus } from "../../hooks/useAutosaveDraft";

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
 * dock is the placeholder group this phase deleted, wearing a different name.
 * Today the one thing it has is the design's own save state, which is why the
 * header carries it and the body collapses: a buyer needs to see "Saved", not
 * to open a drawer to find it.
 */
export function OutputDock({ saveStatus, sections = [] }: { saveStatus?: AutosaveStatus; sections?: OutputSection[] }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const saving = saveStatus && saveStatus !== "idle" ? saveStatus : null;
  if (!saving && sections.length === 0) return null;

  return (
    <div className="border border-border" data-testid="output-dock" data-sections={sections.length}>
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          type="button"
          data-testid="output-toggle"
          aria-expanded={open}
          disabled={sections.length === 0}
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-muted-foreground disabled:opacity-60"
        >
          <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} strokeWidth={1.5} />
          {t("editor.output.title")}
        </button>
        {saving && (
          <span className="ml-auto shrink-0 text-[11px] text-muted-foreground" data-testid="autosave-status" data-status={saving}>
            {saving === "saving" ? t("editor.autosave.saving") : saving === "error" ? t("editor.autosave.notSaved") : t("editor.autosave.saved")}
          </span>
        )}
      </div>

      {open && sections.length > 0 && (
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
