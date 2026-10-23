import { Clock } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { openPath } from "../../services/documentActions";

export function RecentList({ filter = "" }: { filter?: string }) {
  const recentFiles = useEditorStore((s) => s.recentFiles);
  const query = filter.trim().toLowerCase();
  const filtered = query
    ? recentFiles.filter(
        (file) =>
          file.name.toLowerCase().includes(query) || file.path.toLowerCase().includes(query),
      )
    : recentFiles;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <Clock size={20} className="text-[var(--color-ink-muted)]" />
        <p className="text-[12px] text-[var(--color-ink-soft)]">
          {query ? "No matching documents" : "No recent documents"}
        </p>
        {!query && (
          <p className="max-w-[24ch] text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
            Documents you open will appear here for quick access.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-px">
      {filtered.map((file) => (
        <button
          key={file.path}
          type="button"
          onClick={() => void openPath(file.path, file.name)}
          title={file.path}
          className="flex w-full flex-col items-start rounded-[var(--radius-xs)] px-2 py-1.5 text-left transition-colors hover:bg-[var(--color-hover)]"
        >
          <span className="w-full truncate text-[12px] text-[var(--color-ink-soft)]">
            {file.name}
          </span>
          <span className="mt-0.5 w-full truncate text-[10.5px] text-[var(--color-ink-muted)]">
            {file.path}
          </span>
        </button>
      ))}
    </div>
  );
}
