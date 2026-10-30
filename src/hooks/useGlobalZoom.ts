import { useEffect } from "react";
import { useEditorStore } from "../store/editorStore";
import { isTauri } from "../services/tauriBridge";

const ZOOM_STEP = 0.1;

/** Apply a scale factor to the desktop webview. No-op in the browser. */
export function applyZoom(zoom: number): void {
  if (!isTauri()) return;
  void import("@tauri-apps/api/webview")
    .then(({ getCurrentWebview }) => getCurrentWebview().setZoom(zoom))
    .catch(() => {
      // The webview API is unavailable outside the desktop app.
    });
}

/**
 * Keep the whole interface at the persisted zoom level, and let Ctrl+wheel
 * adjust it without losing the setting.
 */
export function useGlobalZoom() {
  const zoom = useEditorStore((s) => s.settings.zoom);

  useEffect(() => {
    applyZoom(zoom);
  }, [zoom]);

  useEffect(() => {
    if (!isTauri()) return;

    const onWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      event.preventDefault();
      const store = useEditorStore.getState();
      store.updateSettings({
        zoom: store.settings.zoom + (event.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP),
      });
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);
}
