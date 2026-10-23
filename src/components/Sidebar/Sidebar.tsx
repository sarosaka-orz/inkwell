import { useState } from "react";
import { FolderOpen, RefreshCw, Search, X } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { loadWorkspaceFolder, openWorkspaceFolder } from "../../services/documentActions";
import { Button, Drawer, IconButton, SegmentedControl } from "../ui";
import { FileTree } from "./FileTree";
import { RecentList } from "./RecentList";
import { OutlineView } from "./OutlineView";

export function Sidebar() {
  const overlay = useEditorStore((s) => s.overlay);
  const closeOverlay = useEditorStore((s) => s.closeOverlay);
  const sidebarTab = useEditorStore((s) => s.sidebarTab);
  const setSidebarTab = useEditorStore((s) => s.setSidebarTab);
  const currentFolder = useEditorStore((s) => s.currentFolder);
  const folderEntries = useEditorStore((s) => s.folderEntries);
  const folderLoading = useEditorStore((s) => s.folderLoading);

  const [filter, setFilter] = useState("");
  const open = overlay === "sidebar";

  const query = filter.trim().toLowerCase();
  const filteredEntries = query
    ? folderEntries.filter((entry) => entry.name.toLowerCase().includes(query))
    : folderEntries;

  const folderName = currentFolder?.split(/[\\/]/).filter(Boolean).pop() ?? currentFolder;

  return (
    <Drawer open={open} onClose={closeOverlay} label="Library">
      <header className="flex h-[var(--topbar-h)] shrink-0 items-center justify-between border-b border-[var(--color-line)] px-3">
        <span className="font-document text-[15px] font-semibold tracking-[-0.01em] text-[var(--color-ink)]">
          Library
        </span>
        <div className="flex items-center gap-0.5">
          {sidebarTab === "files" && (
            <>
              <IconButton
                label="Open folder"
                size="sm"
                icon={<FolderOpen size={14} />}
                onClick={() => void openWorkspaceFolder()}
              />
              {currentFolder && (
                <IconButton
                  label="Refresh folder"
                  size="sm"
                  icon={<RefreshCw size={13} className={folderLoading ? "animate-spin" : ""} />}
                  onClick={() => void loadWorkspaceFolder(currentFolder)}
                />
              )}
            </>
          )}
          <IconButton label="Close library" size="sm" icon={<X size={14} />} onClick={closeOverlay} />
        </div>
      </header>

      <div className="shrink-0 space-y-2 border-b border-[var(--color-line)] px-3 py-2.5">
        <SegmentedControl
          label="Library view"
          value={sidebarTab}
          onChange={setSidebarTab}
          fill
          className="w-full"
          options={[
            { value: "files", label: "Files" },
            { value: "outline", label: "Outline" },
            { value: "recent", label: "Recent" },
          ]}
        />

        {(sidebarTab === "files" || sidebarTab === "recent") && (
          <div className="input-shell flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-2 py-1">
            <Search size={11} className="shrink-0 text-[var(--color-ink-muted)]" />
            <input
              data-autofocus
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              placeholder={sidebarTab === "files" ? "Filter files…" : "Filter recents…"}
              className="w-full bg-transparent text-[11px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
            />
            {filter && (
              <button
                type="button"
                aria-label="Clear filter"
                onClick={() => setFilter("")}
                className="text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                <X size={11} />
              </button>
            )}
          </div>
        )}

        {sidebarTab === "files" && currentFolder && (
          <div className="flex items-center gap-1.5 px-1 text-[11px] font-medium text-[var(--color-ink-soft)]">
            <FolderOpen size={12} className="shrink-0 text-[var(--color-accent)]" />
            <span className="truncate">{folderName}</span>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {sidebarTab === "outline" && <OutlineView />}

        {sidebarTab === "recent" && <RecentList filter={filter} />}

        {sidebarTab === "files" &&
          (currentFolder ? (
            filteredEntries.length === 0 ? (
              <div className="px-4 py-8 text-center text-[11px] text-[var(--color-ink-muted)]">
                {query ? "No matching files" : "This folder is empty"}
              </div>
            ) : (
              <FileTree entries={filteredEntries} />
            )
          ) : (
            <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <FolderOpen size={20} className="text-[var(--color-ink-muted)]" />
              <div>
                <p className="text-[12px] text-[var(--color-ink-soft)]">No folder open</p>
                <p className="mt-1 max-w-[26ch] text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
                  Open a folder to browse and switch between your notes.
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                icon={<FolderOpen size={13} />}
                onClick={() => void openWorkspaceFolder()}
              >
                Open folder
              </Button>
            </div>
          ))}
      </div>
    </Drawer>
  );
}
