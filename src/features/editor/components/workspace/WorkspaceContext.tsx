import { createContext, useContext, type ReactNode } from "react";
import { DEFAULT_SECTIONS, type SheetTab, type WorkspaceSections } from "../../lib/workspaceLayout";

/**
 * What the panel's own contents need to know about the workspace around them
 * (E2 U11).
 *
 * `WorkspaceShell` owns the layout — U7's rule, that two `useWorkspaceLayout`
 * callers would be two independent layouts, still holds — so the dock and the
 * panel read it from here rather than calling the hook a second time.
 *
 * Off a phone there is no sheet: `wide` is true, the tab means nothing, and
 * everything renders as it always has. The default below is that case, so a
 * panel rendered outside a shell (a test, a future surface) is the desk
 * layout rather than a crash.
 */
export interface WorkspaceContextValue {
  /** True above `lg`: two columns, no sheet. */
  wide: boolean;
  /** Which segment of the sheet is showing. Ignored when `wide`. */
  tab: SheetTab;
  /** How the strip hands the buyer its lines on a phone: by selecting Check. */
  setTab: (tab: SheetTab) => void;
  sections: WorkspaceSections;
  toggleSection: (key: keyof WorkspaceSections) => void;
}

const FALLBACK: WorkspaceContextValue = {
  wide: true,
  tab: "layers",
  setTab: () => {},
  sections: DEFAULT_SECTIONS,
  toggleSection: () => {},
};

const WorkspaceContext = createContext<WorkspaceContextValue>(FALLBACK);

export function WorkspaceProvider({ value, children }: { value: WorkspaceContextValue; children: ReactNode }) {
  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  return useContext(WorkspaceContext);
}

/** True when this part of the panel should render: everything does on a desk. */
export function showsTab(ctx: WorkspaceContextValue, tab: SheetTab): boolean {
  return ctx.wide || ctx.tab === tab;
}
