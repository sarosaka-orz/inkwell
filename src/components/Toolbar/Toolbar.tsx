import {
  FolderOpen,
  Save,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Settings,
  Download,
  Moon,
  Sun,
  FileDown,
  Copy,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import { generateHtml } from "../../utils/generateHtml";

export function Toolbar() {
  const { sidebarOpen, toggleSidebar, toggleSettings, addToast, tabs, activeTabId, openFile, createNewFile, markTabSaved, theme, setTheme } = useEditorStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleOpenFile = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
      });
      if (selected) {
        const path = selected as string;
        const name = path.split("/").pop() || path.split("\\").pop() || "untitled.md";
        const content = await invoke<string>("read_file", { path });
        openFile(path, name, content);
        await invoke("add_recent_file", { path, name });
      }
    } catch (e) {
      addToast(`Failed to open file: ${e}`, "error");
    }
  };

  const handleSave = async () => {
    if (!activeTab) return;
    try {
      let path = activeTab.path;
      if (!path) {
        const savePath = await save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
        });
        if (!savePath) return;
        path = savePath;
        const name = path.split("/").pop() || path.split("\\").pop() || "untitled.md";
        useEditorStore.setState((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, path, name } : t
          ),
        }));
      }
      await invoke("write_file", { path, contents: activeTab.content });
      markTabSaved(activeTab.id);
      addToast("File saved", "success");
    } catch (e) {
      addToast(`Save failed: ${e}`, "error");
    }
  };

  const handleExportHtml = async () => {
    if (!activeTab) return;
    try {
      const path = await save({
        filters: [{ name: "HTML", extensions: ["html"] }],
      });
      if (path) {
        const html = await generateHtml(activeTab.content, activeTab.name);
        await invoke("write_file", { path, contents: html });
        addToast("Exported as HTML", "success");
      }
    } catch (e) {
      addToast(`Export failed: ${e}`, "error");
    }
  };

  const handleExportPdf = async () => {
    if (!activeTab) return;
    try {
      const defaultName = activeTab.name.replace(/\.[^.]+$/, "") + ".pdf";
      const outputPath = await save({
        defaultPath: defaultName,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!outputPath) return;
      const html = await generateHtml(activeTab.content, activeTab.name);
      await invoke("export_pdf", { html, outputPath });
      addToast("PDF exported successfully", "success");
    } catch (e) {
      addToast(`PDF export failed: ${e}`, "error");
    }
  };

  const handleCopyRichText = async () => {
    if (!activeTab) return;
    try {
      const html = await generateHtml(activeTab.content, activeTab.name);
      const blob = new Blob([html], { type: "text/html" });
      const textBlob = new Blob([activeTab.content], { type: "text/plain" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": blob,
          "text/plain": textBlob,
        }),
      ]);
      addToast("Copied as rich text", "success");
    } catch {
      // Fallback: copy plain text
      try {
        await navigator.clipboard.writeText(activeTab.content);
        addToast("Copied as plain text", "success");
      } catch {
        addToast("Failed to copy", "error");
      }
    }
  };

  return (
    <div
      className="flex items-center justify-between border-b shrink-0"
      style={{ padding: "10px 20px", background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}
    >
      {/* Left actions */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={sidebarOpen ? <PanelLeftClose size={15} /> : <PanelLeft size={15} />}
          onClick={toggleSidebar}
          title="Toggle Sidebar (Ctrl+\\)"
        />
        <Separator />
        <ToolbarButton icon={<FolderOpen size={15} />} onClick={handleOpenFile} title="Open File (Ctrl+O)" />
        <ToolbarButton icon={<FileText size={15} />} onClick={createNewFile} title="New File (Ctrl+N)" />
        <ToolbarButton icon={<Save size={15} />} onClick={handleSave} title="Save (Ctrl+S)" />
        <Separator />
        <ToolbarButton icon={<Download size={15} />} onClick={handleExportHtml} title="Export HTML" />
        <ToolbarButton icon={<FileDown size={15} />} onClick={handleExportPdf} title="Export PDF" />
        <ToolbarButton icon={<Copy size={15} />} onClick={handleCopyRichText} title="Copy as Rich Text" />
      </div>

      {/* Center: app name */}
      <div className="flex items-center gap-2 select-none">
        <span className="text-sm font-semibold tracking-widest" style={{ color: "var(--color-accent)" }}>
          INKWELL
        </span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-0.5">
        <ToolbarButton
          icon={theme === "solarized-light" ? <Moon size={15} /> : <Sun size={15} />}
          onClick={() => setTheme(theme === "solarized-light" ? "inkwell-dark" : "solarized-light")}
          title="Toggle Theme"
        />
        <ToolbarButton icon={<Settings size={15} />} onClick={toggleSettings} title="Settings (Ctrl+,)" />
      </div>
    </div>
  );
}

function ToolbarButton({ icon, onClick, title }: { icon: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="rounded-md transition-all duration-150 hover:bg-[var(--color-bg-hover)] active:scale-95"
      style={{ padding: "8px", color: "var(--color-text-secondary)" }}
    >
      {icon}
    </button>
  );
}

function Separator() {
  return <div className="w-px h-4 mx-1" style={{ background: "var(--color-border)" }} />;
}
