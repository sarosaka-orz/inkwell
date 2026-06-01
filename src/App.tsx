import { useEffect, useState } from "react";
import { useEditorStore } from "./store/editorStore";
import { themes } from "./themes";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { Editor } from "./components/Editor/Editor";
import { Toolbar } from "./components/Toolbar/Toolbar";
import { StatusBar } from "./components/StatusBar/StatusBar";
import { Tabs } from "./components/Tabs/Tabs";
import { ToastContainer } from "./components/Toast/Toast";
import { SettingsModal } from "./components/Settings/SettingsModal";
import { invoke } from "@tauri-apps/api/core";

export default function App() {
  const { sidebarOpen, settingsOpen, theme, openFile } = useEditorStore();
  const [transitioning, setTransitioning] = useState(false);

  // Apply theme CSS variables
  useEffect(() => {
    const themeDef = themes.find((t) => t.name === theme);
    if (!themeDef) return;

    setTransitioning(true);
    const root = document.documentElement;

    // Apply CSS variables
    Object.entries(themeDef.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply data-theme for CSS selectors
    root.setAttribute("data-theme", theme);

    // Remove transition class after animation
    const timer = setTimeout(() => setTransitioning(false), 400);
    return () => clearTimeout(timer);
  }, [theme]);

  // Load example.md on first launch
  useEffect(() => {
    invoke<string>("generate_example")
      .then(async (path) => {
        const content = await invoke<string>("read_file", { path });
        openFile(path, "example.md", content);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        useEditorStore.getState().createNewFile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <div
      className={`flex flex-col h-screen ${transitioning ? "theme-transition" : ""}`}
      style={{ background: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}
    >
      {/* Toolbar */}
      <Toolbar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarOpen && <Sidebar />}

        {/* Editor area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Tabs */}
          <Tabs />

          {/* Editor */}
          <Editor />
        </div>
      </div>

      {/* Status bar */}
      <StatusBar />

      {/* Toasts */}
      <ToastContainer />

      {/* Settings modal */}
      {settingsOpen && <SettingsModal />}
    </div>
  );
}
