import type { ReactNode } from "react";

interface EditorShellProps {
  banner?: ReactNode;
  viewport: ReactNode;
  measurement?: ReactNode;
  panel: ReactNode;
}

/** Full-height below the site header; viewport left, 360px panel right (v3-review §3, axis-design §7). */
export function EditorShell({ banner, viewport, measurement, panel }: EditorShellProps) {
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {banner}
      <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
        <div className="flex flex-col flex-1 min-h-0">
          {viewport}
          {measurement}
        </div>
        {panel}
      </div>
    </div>
  );
}
