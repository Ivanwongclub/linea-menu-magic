import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/features/auth/AuthProvider";
import {
  DEFAULT_WORKSPACE_LAYOUT,
  layoutStorageKey,
  parseLayout,
  serializeLayout,
  type DockSide,
  type WorkspaceLayout,
} from "../lib/workspaceLayout";

export interface WorkspaceLayoutControls {
  layout: WorkspaceLayout;
  setSide: (side: DockSide) => void;
  setCollapsed: (collapsed: boolean) => void;
  setWidth: (px: number) => void;
  /** Chrome back to the default — the design, the selection and the camera are untouched (E2 §3.4 item 8). */
  reset: () => void;
  /** True while the workspace is fixed to the default and nothing is stored. */
  locked: boolean;
}

/**
 * Reads and remembers the workspace layout (E2 U4): `localStorage`, keyed by
 * user id and layout version. Private windows and blocked site data throw on
 * access, so every read and write is guarded and a failure just means the
 * default layout — the editor never depends on it.
 *
 * `locked` is the calibration path: a saved layout would change the canvas's
 * width, and the render baselines are measured in pixels, so `?calibration=1`
 * always renders the default and stores nothing.
 */
export function useWorkspaceLayout(locked = false): WorkspaceLayoutControls {
  const { user } = useAuth();
  const key = layoutStorageKey(user?.id ?? null);
  const [layout, setLayout] = useState<WorkspaceLayout>(DEFAULT_WORKSPACE_LAYOUT);

  // The key changes when a sign-in claims the session: read that user's own.
  useEffect(() => {
    if (locked) {
      setLayout(DEFAULT_WORKSPACE_LAYOUT);
      return;
    }
    try {
      setLayout(parseLayout(window.localStorage.getItem(key)));
    } catch {
      setLayout(DEFAULT_WORKSPACE_LAYOUT);
    }
  }, [key, locked]);

  const store = useCallback(
    (next: WorkspaceLayout) => {
      setLayout(next);
      if (locked) return;
      try {
        window.localStorage.setItem(key, serializeLayout(next));
      } catch {
        // A workspace that cannot be remembered is still a usable workspace.
      }
    },
    [key, locked],
  );

  return {
    layout,
    locked,
    setSide: (side) => store({ ...layout, side }),
    setCollapsed: (collapsed) => store({ ...layout, collapsed }),
    setWidth: (widthPx) => store({ ...layout, widthPx }),
    reset: () => {
      setLayout(DEFAULT_WORKSPACE_LAYOUT);
      if (locked) return;
      try {
        window.localStorage.removeItem(key);
      } catch {
        // Nothing stored is the same as the default.
      }
    },
  };
}
