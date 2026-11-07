import { useEffect } from "react";
import { useEditorStore } from "../store/useEditorStore.ts";

/**
 * Cmd/Ctrl+Z and Shift+Cmd/Ctrl+Z (4i R2), anywhere in the editor.
 * Text inputs retain focus; undoHistory commits their live edit itself.
 * Numeric fields still blur first to settle their local precision drafts.
 *
 * Owned by WorkspaceShell, including anonymous previews without a document bar.
 */
export function useUndoShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      handleUndoShortcut(event, document.activeElement as HTMLElement | null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}

export function handleUndoShortcut(event: KeyboardEvent, active: HTMLElement | null): void {
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229) return;
  if (!(event.metaKey || event.ctrlKey) || event.altKey || event.key.toLowerCase() !== "z") return;
  event.preventDefault();
  if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA") && !active.hasAttribute("data-layer-text-input")) active.blur();
  const { undo, redo } = useEditorStore.getState();
  if (event.shiftKey) redo();
  else undo();
}
