import { useState } from "react";
import { ListTree, Search } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { jumpToPos } from "../../services/editorController";
import { cn } from "../../lib/cn";

const INDENT: Record<number, string> = {
  1: "pl-2 text-[12.5px] font-medium text-[var(--color-ink)]",
  2: "pl-5 text-[12px] text-[var(--color-ink-soft)]",
  3: "pl-8 text-[12px] text-[var(--color-ink-soft)]",
  4: "pl-11 text-[11.5px] text-[var(--color-ink-muted)]",
  5: "pl-14 text-[11.5px] text-[var(--color-ink-muted)]",
  6: "pl-[4.25rem] text-[11.5px] text-[var(--color-ink-muted)]",
};

export function OutlineView() {
  const outline = useEditorStore((s) => s.outline);
  const closeOverlay = useEditorStore((s) => s.closeOverlay);
  const [filter, setFilter] = useState("");

  if (outline.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
        <ListTree size={20} className="text-[var(--color-ink-muted)]" />
        <p className="text-[12px] text-[var(--color-ink-soft)]">No headings yet</p>
        <p className="max-w-[26ch] text-[11px] leading-relaxed text-[var(--color-ink-muted)]">
          Add a heading with <code className="font-mono text-[var(--color-accent)]"># Title</code>{" "}
          and it will appear here.
        </p>
      </div>
    );
  }

  const query = filter.trim().toLowerCase();
  const filtered = query
    ? outline.filter((heading) => heading.text.toLowerCase().includes(query))
    : outline;

  return (
    <div className="flex h-full flex-col">
      <div className="mb-2 flex items-center justify-between px-2 text-[10.5px] text-[var(--color-ink-muted)]">
        <span>Outline</span>
        <span className="tabular-nums">{outline.length}</span>
      </div>

      {outline.length > 5 && (
        <div className="input-shell mx-1 mb-2 flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-line)] bg-[var(--color-sunken)] px-2 py-1">
          <Search size={11} className="shrink-0 text-[var(--color-ink-muted)]" />
          <input
            data-autofocus
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter headings…"
            className="w-full bg-transparent text-[11px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
          />
        </div>
      )}

      <div className="flex-1 space-y-px overflow-y-auto pb-2">
        {filtered.map((heading) => (
          <button
            key={heading.id}
            type="button"
            onClick={() => {
              closeOverlay();
              window.setTimeout(() => jumpToPos(heading.pos), 0);
            }}
            title={`Line ${heading.line}`}
            className={cn(
              "block w-full truncate rounded-[var(--radius-xs)] py-1.5 pr-2 text-left transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]",
              INDENT[heading.level] ?? INDENT[6],
            )}
          >
            {heading.text}
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="px-3 py-6 text-center text-[11px] text-[var(--color-ink-muted)]">
            No matching headings
          </div>
        )}
      </div>
    </div>
  );
}
