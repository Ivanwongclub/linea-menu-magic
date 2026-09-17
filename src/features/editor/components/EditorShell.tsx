import type { ReactNode } from "react";

interface EditorShellProps {
  banner?: ReactNode;
  viewport: ReactNode;
  panel: ReactNode;
}

/**
 * Full-height below the site header; viewport left, 360px panel right
 * (v3-review §3, axis-design §7). The fixed measurement line under the
 * viewport is gone (E1 collision 16) — its content is now the ruler
 * overlay's default, an on-canvas toggle in `EditorViewport`, not a shell
 * slot.
 */
export function EditorShell({ banner, viewport, panel }: EditorShellProps) {
  return (
    // The fixed site header's height is one token (`--site-header-height`,
    // index.css), so the viewport's bottom edge can't drift below the fold.
    <div className="flex flex-col h-[calc(100vh-var(--site-header-height))]">
      {banner}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="flex flex-col flex-1 min-h-0">{viewport}</div>
        {panel}
      </div>
    </div>
  );
}
