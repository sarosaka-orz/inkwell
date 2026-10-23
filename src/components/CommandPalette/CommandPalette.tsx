import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { FileText, Hash, Search, type LucideIcon } from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { buildCommands } from "../../commands/registry";
import { bestScore } from "../../commands/score";
import type { AppCommand } from "../../commands/types";
import { openPath } from "../../services/documentActions";
import { jumpToPos } from "../../services/editorController";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { formatShortcut } from "../../lib/platform";
import { cn } from "../../lib/cn";
import { Kbd } from "../ui";

type PaletteMode = "all" | "commands" | "headings";

interface PaletteEntry {
  id: string;
  title: string;
  subtitle?: string;
  group: string;
  icon?: LucideIcon;
  shortcut?: string;
  active?: boolean;
  keywords?: string;
  run: () => void | Promise<void>;
}

const GROUP_ORDER = [
  "Open tabs",
  "Recent",
  "Document",
  "Edit",
  "View",
  "Theme",
  "App",
  "Outline",
];

const LISTBOX_ID = "command-palette-listbox";

function modeFor(query: string): { mode: PaletteMode; term: string } {
  if (query.startsWith(">")) return { mode: "commands", term: query.slice(1) };
  if (query.startsWith("@")) return { mode: "headings", term: query.slice(1) };
  return { mode: "all", term: query };
}

export function CommandPalette() {
  const closeOverlay = useEditorStore((s) => s.closeOverlay);
  const tabs = useEditorStore((s) => s.tabs);
  const activeTabId = useEditorStore((s) => s.activeTabId);
  const recentFiles = useEditorStore((s) => s.recentFiles);
  const outline = useEditorStore((s) => s.outline);
  const addToast = useEditorStore((s) => s.addToast);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useFocusTrap({
    active: true,
    containerRef: panelRef,
    onEscape: closeOverlay,
    initialFocusRef: inputRef,
    restoreFocus: true,
  });

  const { mode, term } = modeFor(query);

  const commands = useMemo<PaletteEntry[]>(() => {
    return buildCommands().map((command: AppCommand) => ({
      id: `cmd-${command.id}`,
      title: command.title,
      subtitle: command.detail,
      group: command.group,
      icon: command.icon,
      shortcut: command.shortcut ? formatShortcut(command.shortcut) : undefined,
      active: command.active,
      keywords: command.keywords,
      run: command.run,
    }));
    // Rebuild whenever the underlying view state changes.
  }, [tabs, activeTabId, recentFiles, outline, query, closeOverlay]);

  const entries = useMemo<PaletteEntry[]>(() => {
    const list: { entry: PaletteEntry; score: number }[] = [];

    if (mode === "all") {
      for (const tab of tabs) {
        list.push({
          entry: {
            id: `tab-${tab.id}`,
            title: tab.name,
            subtitle: tab.modified ? "Unsaved changes" : tab.path || "Not saved yet",
            group: "Open tabs",
            icon: FileText,
            active: tab.id === activeTabId,
            keywords: tab.path,
            run: () => useEditorStore.getState().setActiveTab(tab.id),
          },
          score: bestScore(term, tab.name, tab.path) ?? (term ? -1 : 0),
        });
      }

      for (const recent of recentFiles.slice(0, 8)) {
        list.push({
          entry: {
            id: `recent-${recent.path}`,
            title: recent.name,
            subtitle: recent.path,
            group: "Recent",
            icon: FileText,
            keywords: recent.path,
            run: () => openPath(recent.path, recent.name),
          },
          score: bestScore(term, recent.name, recent.path) ?? (term ? -1 : 0),
        });
      }
    }

    if (mode !== "headings") {
      for (const command of commands) {
        list.push({
          entry: command,
          score: bestScore(term, command.title, command.keywords) ?? (term ? -1 : 0),
        });
      }
    } else {
      for (const heading of outline) {
        list.push({
          entry: {
            id: `heading-${heading.id}`,
            title: heading.text,
            subtitle: `Line ${heading.line}`,
            group: "Outline",
            icon: Hash,
            keywords: `h${heading.level}`,
            run: () => jumpToPos(heading.pos),
          },
          score: bestScore(term, heading.text) ?? (term ? -1 : 0),
        });
      }
    }

    return list
      .filter((item) => item.score >= 0)
      .sort((a, b) => {
        const groupDelta =
          GROUP_ORDER.indexOf(a.entry.group) - GROUP_ORDER.indexOf(b.entry.group);
        if (groupDelta !== 0) return groupDelta;
        return b.score - a.score;
      })
      .slice(0, 60)
      .map((item) => item.entry);
  }, [mode, term, tabs, activeTabId, recentFiles, commands, outline]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    if (selected >= entries.length) setSelected(Math.max(0, entries.length - 1));
  }, [entries.length, selected]);

  useEffect(() => {
    document.getElementById(`palette-option-${selected}`)?.scrollIntoView({ block: "nearest" });
  }, [selected, entries.length]);

  const runEntry = (entry: PaletteEntry | undefined) => {
    if (!entry) return;
    closeOverlay();
    window.setTimeout(() => {
      try {
        const result = entry.run();
        if (result instanceof Promise) {
          result.catch((error) => addToast(`Command failed: ${error}`, "error"));
        }
      } catch (error) {
        addToast(`Command failed: ${error}`, "error");
      }
    }, 0);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setSelected((current) => (entries.length ? (current + 1) % entries.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setSelected((current) => (entries.length ? (current - 1 + entries.length) % entries.length : 0));
    } else if (event.key === "Home") {
      event.preventDefault();
      setSelected(0);
    } else if (event.key === "End") {
      event.preventDefault();
      setSelected(Math.max(0, entries.length - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      runEntry(entries[selected]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeOverlay();
    }
  };

  let lastGroup = "";

  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center bg-[var(--color-scrim)] px-4 pt-[11vh] animate-fade-in"
      style={{ zIndex: "var(--z-modal)" }}
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) closeOverlay();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
        className="w-[min(640px,94vw)] overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] animate-fade-up"
      >
        <div className="flex items-center gap-2.5 border-b border-[var(--color-line)] px-3.5">
          <Search size={15} className="shrink-0 text-[var(--color-ink-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-label="Search documents and commands"
            aria-expanded="true"
            aria-controls={LISTBOX_ID}
            aria-activedescendant={entries.length ? `palette-option-${selected}` : undefined}
            aria-autocomplete="list"
            placeholder={
              mode === "commands"
                ? "Run a command…"
                : mode === "headings"
                  ? "Jump to a heading…"
                  : "Search documents and commands…"
            }
            className="h-12 flex-1 bg-transparent text-[13px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
            spellCheck={false}
          />
          <Kbd>Esc</Kbd>
        </div>

        <div
          id={LISTBOX_ID}
          role="listbox"
          aria-label="Results"
          className="max-h-[52vh] overflow-y-auto p-1.5"
        >
          {entries.length === 0 && (
            <div className="px-3 py-8 text-center text-[12px] text-[var(--color-ink-muted)]">
              No matches{term ? ` for “${term}”` : ""}.
            </div>
          )}

          {entries.map((entry, index) => {
            const showGroup = entry.group !== lastGroup;
            lastGroup = entry.group;
            const Icon = entry.icon;

            return (
              <div key={entry.id}>
                {showGroup && (
                  <div className="px-2 pb-1 pt-2.5 text-[10px] font-medium text-[var(--color-ink-muted)]">
                    {entry.group}
                  </div>
                )}
                <button
                  id={`palette-option-${index}`}
                  role="option"
                  aria-selected={index === selected}
                  tabIndex={-1}
                  onMouseEnter={() => setSelected(index)}
                  onClick={() => runEntry(entry)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-xs)] px-2.5 py-2 text-left transition-colors",
                    index === selected
                      ? "bg-[var(--color-active)]"
                      : "hover:bg-[var(--color-hover)]",
                  )}
                >
                  {Icon ? (
                    <Icon
                      size={14}
                      className={cn(
                        "shrink-0",
                        index === selected
                          ? "text-[var(--color-accent)]"
                          : "text-[var(--color-ink-muted)]",
                      )}
                    />
                  ) : (
                    <span className="w-3.5" />
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] text-[var(--color-ink)]">
                      {entry.title}
                    </span>
                    {entry.subtitle && (
                      <span className="block truncate text-[10.5px] text-[var(--color-ink-muted)]">
                        {entry.subtitle}
                      </span>
                    )}
                  </span>
                  {entry.active && (
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
                  )}
                  {entry.shortcut && <Kbd>{entry.shortcut}</Kbd>}
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--color-line)] px-3.5 py-2 text-[10.5px] text-[var(--color-ink-muted)]">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd>
              navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd>
              select
            </span>
          </span>
          <span className="flex items-center gap-2.5">
            <span className="flex items-center gap-1.5">
              <Kbd>&gt;</Kbd> commands
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>@</Kbd> headings
            </span>
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}
