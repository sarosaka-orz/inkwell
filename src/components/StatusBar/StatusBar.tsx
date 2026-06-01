import { useEditorStore } from "../../store/editorStore";

export function StatusBar() {
  const { tabs, activeTabId, vimMode, vimStatus, toggleVimMode, theme } = useEditorStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const wordCount = activeTab
    ? activeTab.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
  const charCount = activeTab ? activeTab.content.length : 0;
  const lineCount = activeTab ? activeTab.content.split("\n").length : 0;

  return (
    <div
      className="flex items-center justify-between text-xs border-t shrink-0 select-none"
      style={{
        padding: "6px 20px",
        background: "var(--color-bg-secondary)",
        borderColor: "var(--color-border)",
        color: "var(--color-text-muted)",
        fontFamily: "'iA Writer Quattro', 'Literata', Georgia, serif",
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-4">
        {activeTab ? (
          <>
            <span style={{ color: "var(--color-text-secondary)" }}>{activeTab.name}</span>
            <span>{lineCount} lines</span>
            <span>{wordCount} words</span>
            <span>{charCount} chars</span>
            {activeTab.modified && (
              <span className="flex items-center gap-1" style={{ color: "var(--color-accent)" }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--color-accent)" }} />
                Modified
              </span>
            )}
          </>
        ) : (
          <span>No file open</span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        <span className="opacity-60">{theme}</span>
        {vimMode && (
          <span
            className="vim-status px-1.5 py-0.5 rounded"
            style={{
              color: "var(--color-bg-primary)",
              background: "var(--color-accent)",
              fontWeight: 600,
            }}
          >
            {vimStatus || "NORMAL"}
          </span>
        )}
        <button
          onClick={toggleVimMode}
          className="px-2 py-0.5 rounded transition-all duration-150 hover:bg-[var(--color-bg-hover)]"
          style={{
            color: vimMode ? "var(--color-accent)" : "var(--color-text-muted)",
            fontWeight: vimMode ? 600 : 400,
          }}
        >
          VIM {vimMode ? "ON" : "OFF"}
        </button>
      </div>
    </div>
  );
}
