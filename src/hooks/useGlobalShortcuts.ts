import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { isEditableTarget } from "../lib/focusable";
import { openDocument, saveActiveDocument } from "../services/documentActions";
import { isTauri } from "../services/tauriBridge";

/**
 * One shortcut authority for the whole app. The CodeMirror keymap only keeps
 * editor-local formatting and undo bindings, so nothing fires twice.
 */
export function useGlobalShortcuts() {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      // Interface zoom works everywhere in the desktop app, including while
      // typing, so handle it before the editable-target guard.
      if (isTauri() && (event.ctrlKey || event.metaKey) && !event.altKey) {
        const zoomStore = useEditorStore.getState();
        if (event.code === "Minus" || event.code === "NumpadSubtract") {
          event.preventDefault();
          zoomStore.updateSettings({ zoom: zoomStore.settings.zoom - 0.1 });
          return;
        }
        if (event.code === "Equal" || event.code === "NumpadAdd") {
          event.preventDefault();
          zoomStore.updateSettings({ zoom: zoomStore.settings.zoom + 0.1 });
          return;
        }
        if (event.code === "Digit0" || event.code === "Numpad0") {
          event.preventDefault();
          zoomStore.updateSettings({ zoom: 1 });
          return;
        }
      }

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
          if (store.activeTabId) store.requestCloseTab(store.activeTabId);
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
