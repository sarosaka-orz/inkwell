import { useEffect } from "react";
import { useEditorStore } from "./store/editorStore";
import { applyTheme } from "./themes/applyTheme";
import { useAppCloseGuard } from "./hooks/useAppCloseGuard";
import { useGlobalShortcuts } from "./hooks/useGlobalShortcuts";
import { useGlobalZoom } from "./hooks/useGlobalZoom";
import { getRecentFiles, isTauri, readFile } from "./services/tauriBridge";
import { writeDrafts } from "./services/draftStore";
import { TopBar } from "./components/Layout/TopBar";
import { StatusBar } from "./components/Layout/StatusBar";
import { Editor } from "./components/Editor/Editor";
import { FormattingDock } from "./components/Editor/FormattingDock";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import { SettingsModal } from "./components/Settings/SettingsModal";
import { InsertTableModal } from "./components/TableModal/InsertTableModal";
import { CloseConfirmDialog } from "./components/Dialogs/CloseConfirmDialog";
import { ToastContainer } from "./components/Toast/Toast";

export default function App() {
  const theme = useEditorStore((s) => s.theme);
  const overlay = useEditorStore((s) => s.overlay);
  const mode = useEditorStore((s) => s.mode);
  const pendingClose = useEditorStore((s) => s.pendingClose);
  const recoveredDraftCount = useEditorStore((s) => s.recoveredDraftCount);
  const setRecentFiles = useEditorStore((s) => s.setRecentFiles);

  useGlobalShortcuts();
  useAppCloseGuard();
  useGlobalZoom();

  // Persist only dirty tabs; the draft clears itself once everything is saved.
  useEffect(() => {
    let timer: number | undefined;

    const persist = () => {
      const state = useEditorStore.getState();
      writeDrafts(state.tabs, state.activeTabId);
    };

    const unsubscribe = useEditorStore.subscribe((state, previous) => {
      if (state.tabs === previous.tabs) return;
      window.clearTimeout(timer);
      timer = window.setTimeout(persist, 400);
    });

    const flush = () => {
      window.clearTimeout(timer);
      persist();
    };

    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);

    return () => {
      unsubscribe();
      window.clearTimeout(timer);
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
    };
  }, []);

  useEffect(() => {
    if (recoveredDraftCount === 0) return;
    const timer = window.setTimeout(() => {
      useEditorStore
        .getState()
        .addToast(
          `Recovered ${recoveredDraftCount} unsaved draft${recoveredDraftCount === 1 ? "" : "s"}`,
          "info",
        );
    }, 600);
    return () => window.clearTimeout(timer);
  }, [recoveredDraftCount]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-transition");
    applyTheme(theme);
    const timer = window.setTimeout(() => root.classList.remove("theme-transition"), 260);
    return () => window.clearTimeout(timer);
  }, [theme]);

  useEffect(() => {
    getRecentFiles()
      .then(setRecentFiles)
      .catch(() => {
        /* recents unavailable */
      });
  }, [setRecentFiles]);

  // Load the generated example document on first launch in the desktop app.
  useEffect(() => {
    if (!isTauri() || useEditorStore.getState().recoveredDraftCount > 0) return;
    let cancelled = false;

    import("@tauri-apps/api/core")
      .then(({ invoke }) => invoke<string>("generate_example"))
      .then(async (path) => {
        const content = await readFile(path);
        if (!cancelled) {
          useEditorStore.getState().openFile(path, "example.md", content);
        }
      })
      .catch(() => {
        /* example generation is optional */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--color-canvas)] text-[var(--color-ink)]">
      <div
        id="app-shell"
        className="flex min-h-0 flex-1 flex-col"
        inert={overlay !== null || pendingClose !== null}
      >
        <TopBar />
        <Editor />
        <StatusBar />
      </div>

      <Sidebar />
      {overlay === "command" && <CommandPalette />}
      {overlay === "settings" && <SettingsModal />}
      {overlay === "table" && <InsertTableModal />}
      {pendingClose && <CloseConfirmDialog />}
      {overlay === null && mode !== "preview" && <FormattingDock />}
      <ToastContainer />
    </div>
  );
}
