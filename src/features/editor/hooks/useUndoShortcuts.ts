import { useEffect } from "react";
import { useEditorStore } from "../store/useEditorStore";

/**
 * Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z (4i R2), anywhere in the editor. A focused
 * field is blurred first so its edit commits as its own entry, then undone.
 *
 * Extracted from `BrandingGroup` in E2 U2: history is the document's, not a
 * layer group's, and U7 moves the buttons to the document bar.
 */
export function useUndoShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "z") return;
      event.preventDefault();
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA")) active.blur();
      const { undo, redo } = useEditorStore.getState();
      if (event.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
