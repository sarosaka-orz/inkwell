import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { isTauri } from "../services/tauriBridge";

/**
 * Ask before the window disappears with unsaved work. In the browser we can
 * only use the native beforeunload prompt; in Tauri the app's own dialog is
 * shown instead.
 */
export function useAppCloseGuard() {
  useEffect(() => {
    if (!isTauri()) {
      const onBeforeUnload = (event: BeforeUnloadEvent) => {
        if (useEditorStore.getState().tabs.some((tab) => tab.modified)) {
          event.preventDefault();
          event.returnValue = "";
        }
      };

      window.addEventListener("beforeunload", onBeforeUnload);
      return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }

    let disposed = false;
    let unlisten: (() => void) | undefined;

    void import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) =>
        getCurrentWindow()
          .onCloseRequested((event) => {
            if (useEditorStore.getState().requestAppClose()) {
              event.preventDefault();
            }
          })
          .then((stopListening) => {
            if (disposed) stopListening();
            else unlisten = stopListening;
          }),
      )
      .catch(() => {
        // Window APIs are unavailable in plain web previews.
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);
}
