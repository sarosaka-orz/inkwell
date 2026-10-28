import { useRef, type KeyboardEvent } from "react";
import { Plus, X } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { cn } from "../../lib/cn";

export function DocumentTabs() {
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const requestCloseTab = useEditorStore((s) => s.requestCloseTab);
  const createNewFile = useEditorStore((s) => s.createNewFile);
  const stripRef = useRef<HTMLDivElement>(null);

  const move = (direction: -1 | 1) => {
    if (tabs.length === 0) return;
    const index = tabs.findIndex((tab) => tab.id === activeTabId);
    const next = tabs[(index + direction + tabs.length) % tabs.length];
    if (!next) return;
    setActiveTab(next.id);
    window.setTimeout(() => {
      stripRef.current
        ?.querySelector<HTMLElement>(`[data-tab-id="${next.id}"]`)
        ?.focus();
    }, 0);
  };

  const onTabKeyDown = (event: KeyboardEvent<HTMLDivElement>, id: string) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      move(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      move(-1);
    } else if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      requestCloseTab(id);
    }
  };

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label="Open documents"
      className="flex min-w-0 flex-1 items-center overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const active = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            data-tab-id={tab.id}
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            title={tab.path || tab.name}
            onClick={() => setActiveTab(tab.id)}
            onKeyDown={(event) => onTabKeyDown(event, tab.id)}
            onAuxClick={(event) => {
              if (event.button === 1) requestCloseTab(tab.id);
            }}
            className={cn(
              "group relative flex h-full max-w-[190px] shrink-0 cursor-pointer items-center gap-1.5 px-3 text-[12px] outline-none transition-colors",
              active
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink-soft)]",
            )}
          >
            <span className="truncate">{tab.name}</span>

            {tab.modified && (
              <span
                aria-label="Unsaved changes"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]"
              />
            )}

            <button
              type="button"
              tabIndex={-1}
              aria-label={`Close ${tab.name}`}
              title={`Close ${tab.name} (Ctrl+W)`}
              onClick={(event) => {
                event.stopPropagation();
                requestCloseTab(tab.id);
              }}
              className={cn(
                "ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] transition-all hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]",
                active
                  ? "opacity-60 hover:opacity-100"
                  : "opacity-0 group-hover:opacity-60 group-focus-within:opacity-60 focus-visible:opacity-100",
              )}
            >
              <X size={11} />
            </button>

            {active && (
              <span className="absolute inset-x-2 bottom-0 h-px bg-[var(--color-accent)]" />
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={createNewFile}
        title="New document (Ctrl+N)"
        aria-label="New document"
        className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-ink-muted)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)]"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
