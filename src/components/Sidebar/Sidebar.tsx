import { useEffect, useState } from "react";
import { FolderOpen, File, ChevronRight, ChevronDown, RefreshCw } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

function FileTreeItem({ entry, depth = 0 }: { entry: FileEntry; depth?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[]>([]);
  const { openFile, addToast, tabs, activeTabId } = useEditorStore();

  const isActive = tabs.find((t) => t.id === activeTabId)?.path === entry.path;

  const handleClick = async () => {
    if (entry.is_dir) {
      if (!expanded) {
        try {
          const entries = await invoke<FileEntry[]>("read_directory", { path: entry.path });
          setChildren(entries);
        } catch (e) {
          addToast(`Failed to read directory: ${e}`, "error");
        }
      }
      setExpanded(!expanded);
    } else {
      try {
        const content = await invoke<string>("read_file", { path: entry.path });
        openFile(entry.path, entry.name, content);
        await invoke("add_recent_file", { path: entry.path, name: entry.name });
      } catch (e) {
        addToast(`Failed to open file: ${e}`, "error");
      }
    }
  };

  const getFileIcon = (name: string) => {
    if (name.endsWith(".md") || name.endsWith(".markdown")) return "📝";
    if (name.endsWith(".ts") || name.endsWith(".tsx")) return "🔷";
    if (name.endsWith(".js") || name.endsWith(".jsx")) return "🟡";
    if (name.endsWith(".json")) return "📋";
    if (name.endsWith(".css") || name.endsWith(".scss")) return "🎨";
    if (name.endsWith(".html")) return "🌐";
    if (name.endsWith(".rs")) return "🦀";
    if (name.endsWith(".toml")) return "⚙️";
    return "📄";
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="w-full flex items-center gap-1.5 px-2 py-1 text-sm rounded-md transition-all duration-150"
        style={{
          paddingLeft: `${depth * 14 + 8}px`,
          color: isActive ? "var(--color-accent)" : "var(--color-text-secondary)",
          background: isActive ? "rgba(212, 165, 116, 0.08)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!isActive) e.currentTarget.style.background = "var(--color-bg-hover)";
        }}
        onMouseLeave={(e) => {
          if (!isActive) e.currentTarget.style.background = "transparent";
        }}
      >
        {entry.is_dir ? (
          expanded ? (
            <ChevronDown size={14} className="shrink-0" style={{ color: "var(--color-text-muted)" }} />
          ) : (
            <ChevronRight size={14} className="shrink-0" style={{ color: "var(--color-text-muted)" }} />
          )
        ) : (
          <span className="w-3.5 shrink-0" />
        )}
        {entry.is_dir ? (
          <FolderOpen size={14} className="shrink-0" style={{ color: "var(--color-accent)", opacity: 0.8 }} />
        ) : (
          <span className="text-xs shrink-0">{getFileIcon(entry.name)}</span>
        )}
        <span className="truncate text-[13px]">{entry.name}</span>
      </button>
      {expanded && children.length > 0 && (
        <div className="ml-1">
          {children.map((child) => (
            <FileTreeItem key={child.path} entry={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar() {
  const { currentFolder, setCurrentFolder, addToast } = useEditorStore();
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const openFolder = async () => {
    try {
      const selected = await open({ directory: true });
      if (selected) {
        setCurrentFolder(selected as string);
      }
    } catch (e) {
      addToast(`Failed to open folder: ${e}`, "error");
    }
  };

  const refresh = async () => {
    if (!currentFolder) return;
    setLoading(true);
    try {
      const entries = await invoke<FileEntry[]>("read_directory", { path: currentFolder });
      setEntries(entries);
    } catch (e) {
      addToast(`Failed to refresh: ${e}`, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!currentFolder) return;
    setLoading(true);
    invoke<FileEntry[]>("read_directory", { path: currentFolder })
      .then(setEntries)
      .catch((e) => addToast(`Failed to read directory: ${e}`, "error"))
      .finally(() => setLoading(false));
  }, [currentFolder]);

  const folderName = currentFolder?.split("/").pop() || currentFolder?.split("\\").pop() || "";

  return (
    <div
      className="flex flex-col overflow-hidden border-r shrink-0"
      style={{ width: 288, background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b shrink-0"
        style={{ padding: "12px 16px", borderColor: "var(--color-border)" }}
      >
        <span
          className="text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={refresh}
            className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
            title="Refresh"
            style={{ color: "var(--color-text-muted)" }}
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={openFolder}
            className="p-1 rounded-md hover:bg-[var(--color-bg-hover)] transition-colors"
            title="Open Folder"
            style={{ color: "var(--color-text-muted)" }}
          >
            <FolderOpen size={14} />
          </button>
        </div>
      </div>

      {/* Folder name */}
      {currentFolder && (
        <div
          className="px-3 py-1.5 border-b text-[12px] font-medium truncate"
          style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
        >
          {folderName}
        </div>
      )}

      {/* File tree */}
      <div className="flex-1 overflow-auto" style={{ padding: "8px" }}>
        {currentFolder ? (
          entries.length > 0 ? (
            entries.map((entry) => <FileTreeItem key={entry.path} entry={entry} />)
          ) : (
            <div className="px-3 py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
              <p className="text-xs">Empty folder</p>
            </div>
          )
        ) : (
          <div className="px-3 py-8 text-center empty-state">
            <FolderOpen
              size={32}
              className="mx-auto mb-3 opacity-20"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p className="text-xs mb-3" style={{ color: "var(--color-text-muted)" }}>
              No folder open
            </p>
            <button
              onClick={openFolder}
              className="text-xs px-4 py-1.5 rounded-md transition-all duration-150 hover:bg-[var(--color-bg-hover)]"
              style={{
                background: "var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
                fontWeight: 600,
                border: "1px solid var(--color-border)",
              }}
            >
              Open Folder
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
