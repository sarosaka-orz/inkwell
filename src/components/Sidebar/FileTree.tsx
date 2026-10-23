import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileCode,
  FileJson,
  FileText,
  LoaderCircle,
} from "lucide-react";
import { readDirectory, type FileEntry } from "../../services/tauriBridge";
import { openPath } from "../../services/documentActions";
import { useEditorStore } from "../../store/editorStore";
import { cn } from "../../lib/cn";

export function FileTree({ entries, depth = 0 }: { entries: FileEntry[]; depth?: number }) {
  return (
    <div className={depth === 0 ? "space-y-px" : "space-y-px"}>
      {entries.map((entry) => (
        <FileTreeItem key={entry.path} entry={entry} depth={depth} />
      ))}
    </div>
  );
}

function FileTreeItem({ entry, depth }: { entry: FileEntry; depth: number }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileEntry[] | null>(null);
  const [loading, setLoading] = useState(false);

  const activePath = useEditorStore((s) => s.tabs.find((tab) => tab.id === s.activeTabId)?.path);
  const addToast = useEditorStore((s) => s.addToast);

  const isActive = activePath === entry.path;

  const activate = async () => {
    if (!entry.is_dir) {
      await openPath(entry.path, entry.name);
      return;
    }

    if (!expanded && children === null) {
      setLoading(true);
      try {
        setChildren(await readDirectory(entry.path));
      } catch (error) {
        addToast(`Failed to open folder: ${error}`, "error");
      } finally {
        setLoading(false);
      }
    }
    setExpanded((value) => !value);
  };

  return (
    <div>
      <button
        type="button"
        onClick={activate}
        title={entry.name}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-[var(--radius-xs)] py-1.5 pr-2 text-left text-[12px] transition-colors",
          isActive
            ? "bg-[var(--color-active)] text-[var(--color-ink)]"
            : "text-[var(--color-ink-soft)] hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          {entry.is_dir ? (
            loading ? (
              <LoaderCircle size={12} className="animate-spin text-[var(--color-ink-muted)]" />
            ) : expanded ? (
              <ChevronDown size={12} className="text-[var(--color-ink-muted)]" />
            ) : (
              <ChevronRight size={12} className="text-[var(--color-ink-muted)]" />
            )
          ) : (
            <FileIcon name={entry.name} active={isActive} />
          )}
        </span>
        <span className="truncate">{entry.name}</span>
      </button>

      {expanded && children && children.length > 0 && (
        <div className="ml-3 border-l border-[var(--color-line-soft)] pl-0.5">
          <FileTree entries={children} depth={depth + 1} />
        </div>
      )}
    </div>
  );
}

function FileIcon({ name, active }: { name: string; active: boolean }) {
  if (/\.(md|markdown|mdown|txt)$/i.test(name)) {
    return <FileText size={13} className={active ? "text-[var(--color-accent)]" : "text-[var(--color-ink-muted)]"} />;
  }
  if (/\.json$/i.test(name)) {
    return <FileJson size={13} className="text-[var(--color-ink-muted)]" />;
  }
  if (/\.(ts|tsx|js|jsx|rs|css|html)$/i.test(name)) {
    return <FileCode size={13} className="text-[var(--color-ink-muted)]" />;
  }
  return <FileText size={13} className="text-[var(--color-ink-muted)]" />;
}
