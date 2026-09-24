import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MoreHorizontal, PanelLeft, PanelRight, PanelRightClose, Redo2, RotateCcw, Undo2 } from "lucide-react";
import { useI18n } from "@/features/i18n/I18nProvider";
import { cn } from "@/lib/utils";
import { selectCanRedo, selectCanUndo, useEditorStore } from "../../store/useEditorStore";
import { useUndoShortcuts } from "../../hooks/useUndoShortcuts";
import type { AutosaveStatus } from "../../hooks/useAutosaveDraft";
import type { DockSide } from "../../lib/workspaceLayout";

export interface DocumentBarProps {
  /** The design's name, or the product's on the anonymous `/new` path. */
  name: string;
  saveStatus?: AutosaveStatus;
  /** Anonymous buyers have no designs to go back to, so they get no link. */
  designsLink?: boolean;
  side: DockSide;
  onDock: () => void;
  onCollapse: () => void;
  onReset: () => void;
}

/**
 * The document bar (E2 U7): the home for everything that is not a selection.
 *
 * Undo and redo are document verbs, not view tools (E2 §3.4 item 4), so they
 * live here beside the name rather than in a layer group's header or in U9's
 * floating cluster — and the keyboard shortcuts are bound here with them, so
 * history is owned where its buttons are. Autosave moved here from the Output
 * dock for the same reason: it is the document's state, and the dock is now
 * just the versions it holds.
 *
 * The workspace menu is the other half (E2 §3.4 item 8): dock side, collapse
 * and Reset workspace, which resets the chrome and never the design — which is
 * what the menu says on the item itself, since that is the only place a buyer
 * reads it.
 *
 * `WorkspaceShell` does not render this under `?calibration=1`: it has height,
 * and every render baseline is measured in pixels.
 */
export function DocumentBar({ name, saveStatus, designsLink = false, side, onDock, onCollapse, onReset }: DocumentBarProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const canUndo = useEditorStore(selectCanUndo);
  const canRedo = useEditorStore(selectCanRedo);
  useUndoShortcuts();

  const saving = saveStatus && saveStatus !== "idle" ? saveStatus : null;
  const close = () => setMenuOpen(false);

  return (
    <div
      data-testid="document-bar"
      className="relative flex shrink-0 items-center gap-2 border-b border-border bg-background px-3 py-1.5"
    >
      {designsLink && (
        <Link
          to="/designer-studio/designs"
          data-testid="document-designs-link"
          className="flex shrink-0 items-center gap-1 text-[11px] tracking-[0.05em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
          {t("editor.document.allDesigns")}
        </Link>
      )}

      <span className="min-w-0 truncate text-sm text-foreground" data-testid="document-name" title={name}>
        {name}
      </span>

      {saving && (
        <span className="shrink-0 text-[11px] text-muted-foreground" data-testid="autosave-status" data-status={saving}>
          {saving === "saving" ? t("editor.autosave.saving") : saving === "error" ? t("editor.autosave.notSaved") : t("editor.autosave.saved")}
        </span>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-0.5">
        <BarButton testId="undo" label={t("editor.branding.undo")} disabled={!canUndo} onClick={undo}>
          <Undo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </BarButton>
        <BarButton testId="redo" label={t("editor.branding.redo")} disabled={!canRedo} onClick={redo}>
          <Redo2 className="h-3.5 w-3.5" strokeWidth={1.5} />
        </BarButton>
        <BarButton
          testId="workspace-menu"
          label={t("editor.workspace.menu")}
          expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <MoreHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
        </BarButton>
      </div>

      {menuOpen && (
        <>
          {/* A click anywhere else closes it — the menu must never sit between
              the buyer and the model. */}
          <button type="button" aria-hidden="true" tabIndex={-1} className="fixed inset-0 z-20 cursor-default" onClick={close} />
          <div
            data-testid="workspace-menu-items"
            role="menu"
            className="absolute right-2 top-full z-30 mt-1 w-56 border border-border bg-background py-1 shadow-sm"
          >
            <MenuItem testId="workspace-dock" onClick={() => { onDock(); close(); }} className="hidden lg:flex">
              {side === "right" ? <PanelLeft className="h-3.5 w-3.5" strokeWidth={1.5} /> : <PanelRight className="h-3.5 w-3.5" strokeWidth={1.5} />}
              {t(side === "right" ? "editor.workspace.dockLeft" : "editor.workspace.dockRight")}
            </MenuItem>
            <MenuItem testId="workspace-collapse" onClick={() => { onCollapse(); close(); }}>
              <PanelRightClose className="h-3.5 w-3.5" strokeWidth={1.5} />
              {t("editor.workspace.collapse")}
            </MenuItem>
            <MenuItem testId="workspace-reset" onClick={() => { onReset(); close(); }}>
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
              {/* The label already carries "the design is untouched" (U4) —
                  which is the confirm copy E2 §3.4 item 8 asks for, said where
                  the buyer actually reads it. */}
              <span className="text-left">{t("editor.workspace.reset")}</span>
            </MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

function BarButton({
  testId,
  label,
  disabled,
  expanded,
  onClick,
  children,
}: {
  testId: string;
  label: string;
  disabled?: boolean;
  expanded?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      data-testid={testId}
      aria-label={label}
      title={label}
      disabled={disabled}
      aria-expanded={expanded}
      onClick={onClick}
      className="flex h-6 w-6 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
    >
      {children}
    </button>
  );
}

function MenuItem({
  testId,
  onClick,
  className,
  children,
}: {
  testId: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      data-testid={testId}
      onClick={onClick}
      className={cn("flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-secondary", className)}
    >
      {children}
    </button>
  );
}
