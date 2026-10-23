import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { isEditableTarget } from "../lib/focusable";
import { openDocument, saveActiveDocument } from "../services/documentActions";

/**
 * One shortcut authority for the whole app. The CodeMirror keymap only keeps
 * editor-local formatting and undo bindings, so nothing fires twice.
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      if (!(event.ctrlKey || event.metaKey)) return;

      const store = useEditorStore.getState();

      // Overlays own their own keyboard handling (including Escape).
      if (store.overlay !== null) return;
      if (isEditableTarget(event.target)) return;

      const code = event.code;
      const handled = () => event.preventDefault();

      if (event.shiftKey) {
        if (code === "KeyF") {
          handled();
          store.toggleFormatBarPinned();
        } else if (code === "KeyE") {
          handled();
          store.toggleReadMode();
        }
        return;
      }

      switch (code) {
        case "KeyN":
          handled();
          store.createNewFile();
          break;
        case "KeyO":
          handled();
          void openDocument();
          break;
        case "KeyS":
          handled();
          void saveActiveDocument();
          break;
        case "KeyW": {
          handled();
          if (store.activeTabId) store.closeTab(store.activeTabId);
          break;
        }
        case "KeyP":
          handled();
          store.openOverlay("command");
          break;
        case "KeyF":
          handled();
          store.toggleSearch();
          break;
        case "Backslash":
          handled();
          store.toggleSidebar();
          break;
        case "Comma":
          handled();
          store.openSettings();
          break;
        case "Slash":
          handled();
          store.toggleMode();
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
