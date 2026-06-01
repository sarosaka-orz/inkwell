import { X } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";

export function Tabs() {
  const { tabs, activeTabId, setActiveTab, closeTab } = useEditorStore();

  if (tabs.length === 0) return null;

  return (
    <div
      className="flex items-end overflow-x-auto border-b shrink-0"
      style={{ background: "var(--color-bg-secondary)", borderColor: "var(--color-border)" }}
    >
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="group flex items-center gap-1.5 text-[13px] border-r transition-all duration-150 shrink-0 relative"
            style={{
              padding: "10px 20px",
              maxWidth: 208,
              background: isActive ? "var(--color-bg-primary)" : "transparent",
              borderColor: "var(--color-border)",
              color: isActive ? "var(--color-text-primary)" : "var(--color-text-muted)",
            }}
          >
            {/* Active indicator */}
            {isActive && (
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: "var(--color-accent)" }}
              />
            )}

            <span className="truncate">{tab.name}</span>

            {tab.modified && (
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: "var(--color-accent)" }}
              />
            )}

            <span
              onClick={(e) => {
                e.stopPropagation();
                closeTab(tab.id);
              }}
              className="ml-0.5 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-150 hover:bg-[var(--color-bg-hover)] shrink-0"
              style={{ color: "var(--color-text-muted)" }}
            >
              <X size={12} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
