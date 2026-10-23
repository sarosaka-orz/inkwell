import { useMemo } from "react";
import { useEditorStore } from "../../store/editorStore";
import { cn } from "../../lib/cn";

export function StatusBar() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const saveStatus = useEditorStore((s) => s.saveStatus);
  const cursorStats = useEditorStore((s) => s.cursorStats);
  const vimMode = useEditorStore((s) => s.vimMode);
  const mode = useEditorStore((s) => s.mode);

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  const stats = useMemo(() => {
    const text = activeTab?.content ?? "";
    const trimmed = text.trim();
    const words = trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
    return {
      words,
      readingMinutes: Math.max(1, Math.ceil(words / 200)),
      hasContent: words > 0,
    };
  }, [activeTab?.content]);

  // Prefer the active tab's dirty flag; the global flag can belong to another tab.
  const effectiveSaveStatus: "saved" | "saving" | "unsaved" =
    saveStatus === "saving" ? "saving" : activeTab?.modified ? "unsaved" : "saved";

  const saveLabel =
    effectiveSaveStatus === "saving"
      ? "Saving…"
      : effectiveSaveStatus === "unsaved"
        ? "Unsaved"
        : "Saved";

  return (
    <footer
      className="flex h-[var(--statusbar-h)] shrink-0 select-none items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-canvas)] px-3 text-[10.5px] text-[var(--color-ink-muted)]"
      style={{ zIndex: "var(--z-topbar)" }}
    >
      <div className="flex min-w-0 items-center gap-2">
        {activeTab ? (
          <>
            <span className="truncate tabular-nums">
              {stats.words.toLocaleString()} {stats.words === 1 ? "word" : "words"}
            </span>
            {stats.hasContent && (
              <>
                <span aria-hidden className="h-2.5 w-px bg-[var(--color-line)]" />
                <span className="tabular-nums">{stats.readingMinutes} min read</span>
              </>
            )}
            {mode !== "live" && (
              <>
                <span aria-hidden className="h-2.5 w-px bg-[var(--color-line)]" />
                <span>{mode === "source" ? "Source" : "Preview"}</span>
              </>
            )}
          </>
        ) : (
          <span>No document open</span>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {activeTab && mode !== "preview" && (
          <span className="tabular-nums">
            Ln {cursorStats.line}, Col {cursorStats.col}
            {cursorStats.selectedChars > 0 && ` (${cursorStats.selectedChars} selected)`}
          </span>
        )}

        {vimMode && mode !== "preview" && (
          <span className="rounded-[var(--radius-xs)] border border-[var(--color-line)] px-1.5 py-px font-mono text-[9.5px] font-semibold text-[var(--color-accent)]">
            VIM
          </span>
        )}

        {activeTab && (
          <span
            className={cn(
              "flex items-center gap-1.5",
              effectiveSaveStatus === "saved" && "text-[var(--color-success)]",
              effectiveSaveStatus === "saving" && "text-[var(--color-accent)]",
            )}
          >
            <span
              className={cn(
                "h-1 w-1 rounded-full",
                effectiveSaveStatus === "saved" && "bg-[var(--color-success)]",
                effectiveSaveStatus === "saving" && "bg-[var(--color-accent)]",
                effectiveSaveStatus === "unsaved" && "bg-[var(--color-ink-muted)]",
              )}
            />
            {saveLabel}
          </span>
        )}
      </div>
    </footer>
  );
}
