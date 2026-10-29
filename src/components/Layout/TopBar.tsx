import { useEffect, useRef, useState } from "react";
import {
  AlignCenter,
  BookOpen,
  CodeXml,
  Command,
  Copy,
  Download,
  Eye,
  FileDown,
  Maximize2,
  MoreHorizontal,
  PanelLeft,
  Pencil,
  Pin,
  Save,
  Search,
  Settings,
} from "lucide-react";
import { useEditorStore } from "../../store/editorStore";
import { themes } from "../../themes";
import {
  copyActiveRichText,
  exportActiveHtml,
  exportActiveMarkdown,
  exportActivePdf,
  saveActiveDocument,
} from "../../services/documentActions";
import { formatShortcut } from "../../lib/platform";
import { IconButton, Menu, MenuItem, MenuLabel, MenuSeparator } from "../ui";
import { DocumentTabs } from "./DocumentTabs";

export function TopBar() {
  const overlay = useEditorStore((s) => s.overlay);
  const searchOpen = useEditorStore((s) => s.searchOpen);
  const mode = useEditorStore((s) => s.mode);
  const settings = useEditorStore((s) => s.settings);
  const theme = useEditorStore((s) => s.theme);
  const formatBarPinned = useEditorStore((s) => s.formatBarPinned);

  const toggleSidebar = useEditorStore((s) => s.toggleSidebar);
  const toggleSearch = useEditorStore((s) => s.toggleSearch);
  const toggleReadMode = useEditorStore((s) => s.toggleReadMode);
  const openOverlay = useEditorStore((s) => s.openOverlay);
  const setMode = useEditorStore((s) => s.setMode);
  const updateSettings = useEditorStore((s) => s.updateSettings);
  const toggleFormatBarPinned = useEditorStore((s) => s.toggleFormatBarPinned);
  const setTheme = useEditorStore((s) => s.setTheme);
  const openSettings = useEditorStore((s) => s.openSettings);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Opening any overlay should dismiss the local menu.
  useEffect(() => {
    if (overlay !== null) setMenuOpen(false);
  }, [overlay]);

  return (
    <header
      className="relative flex h-[var(--topbar-h)] shrink-0 select-none items-center gap-1 border-b border-[var(--color-line)] bg-[var(--color-canvas)] px-2"
      style={{ zIndex: "var(--z-topbar)" }}
    >
      <IconButton
        label={overlay === "sidebar" ? "Hide library" : "Show library (Ctrl+\\)"}
        icon={<PanelLeft size={16} />}
        active={overlay === "sidebar"}
        onClick={toggleSidebar}
      />

      <button
        type="button"
        onClick={() => openOverlay("command")}
        aria-label="Open command palette"
        title="Command palette (Ctrl+P)"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] font-document text-[17px] leading-none text-[var(--color-accent)] transition-colors hover:bg-[var(--color-hover)]"
      >
        ✦
      </button>

      <div className="mx-1 h-4 w-px shrink-0 bg-[var(--color-line)]" aria-hidden />

      <DocumentTabs />

      <div className="ml-1 flex shrink-0 items-center gap-0.5">
        <IconButton
          label={
            mode === "preview"
              ? "Switch to write mode (Ctrl+Shift+E)"
              : "Switch to read mode (Ctrl+Shift+E)"
          }
          icon={mode === "preview" ? <Pencil size={15} /> : <BookOpen size={15} />}
          active={mode === "preview"}
          onClick={toggleReadMode}
        />

        <IconButton
          label="Find in document (Ctrl+F)"
          icon={<Search size={15} />}
          active={searchOpen}
          onClick={toggleSearch}
        />

        <button
          ref={menuButtonRef}
          type="button"
          aria-label="More actions"
          title="More actions"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-ink-soft)] transition-colors hover:bg-[var(--color-hover)] hover:text-[var(--color-ink)] aria-expanded:bg-[var(--color-active)] aria-expanded:text-[var(--color-ink)]"
        >
          <MoreHorizontal size={16} />
        </button>
      </div>

      <Menu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={menuButtonRef}
        label="Application menu"
        className="w-64"
      >
        <MenuItem
          label="Save"
          shortcut={formatShortcut("Mod+S")}
          icon={<Save size={14} />}
          onSelect={() => void saveActiveDocument()}
        />
        <MenuItem
          label="Save as…"
          icon={<Save size={14} />}
          onSelect={() => void saveActiveDocument({ forceDialog: true })}
        />

        <MenuSeparator />
        <MenuLabel>View</MenuLabel>
        <MenuItem
          label="Write mode"
          icon={<Pencil size={14} />}
          checked={mode === "live"}
          onSelect={() => setMode("live")}
        />
        <MenuItem
          label="Read mode"
          shortcut={formatShortcut("Mod+Shift+E")}
          icon={<BookOpen size={14} />}
          checked={mode === "preview"}
          onSelect={() => setMode("preview")}
        />
        <MenuItem
          label="Source mode"
          shortcut={formatShortcut("Mod+/")}
          icon={<CodeXml size={14} />}
          checked={mode === "source"}
          onSelect={() => setMode("source")}
        />
        <MenuItem
          label="Focus mode"
          icon={<Eye size={14} />}
          checked={settings.focusMode}
          onSelect={() => updateSettings({ focusMode: !settings.focusMode })}
        />
        <MenuItem
          label="Typewriter scrolling"
          icon={<AlignCenter size={14} />}
          checked={settings.typewriterMode}
          onSelect={() => updateSettings({ typewriterMode: !settings.typewriterMode })}
        />
        <MenuItem
          label="Full width"
          icon={<Maximize2 size={14} />}
          checked={settings.fullWidth}
          onSelect={() => updateSettings({ fullWidth: !settings.fullWidth })}
        />
        <MenuItem
          label="Pin formatting"
          shortcut={formatShortcut("Mod+Shift+F")}
          icon={<Pin size={14} />}
          checked={formatBarPinned}
          onSelect={toggleFormatBarPinned}
        />

        <MenuSeparator />
        <MenuLabel>Theme</MenuLabel>
        {themes.map((item) => (
          <MenuItem
            key={item.name}
            label={item.label}
            checked={theme === item.name}
            onSelect={() => setTheme(item.name)}
          />
        ))}

        <MenuSeparator />
        <MenuLabel>Export</MenuLabel>
        <MenuItem
          label="Export as PDF"
          icon={<FileDown size={14} />}
          onSelect={() => void exportActivePdf()}
        />
        <MenuItem
          label="Export as HTML"
          icon={<Download size={14} />}
          onSelect={() => void exportActiveHtml()}
        />
        <MenuItem
          label="Download Markdown"
          icon={<Download size={14} />}
          onSelect={() => void exportActiveMarkdown()}
        />
        <MenuItem
          label="Copy as rich text"
          icon={<Copy size={14} />}
          onSelect={() => void copyActiveRichText()}
        />

        <MenuSeparator />
        <MenuItem
          label="Command palette"
          shortcut={formatShortcut("Mod+P")}
          icon={<Command size={14} />}
          onSelect={() => openOverlay("command")}
        />
        <MenuItem
          label="Settings"
          shortcut={formatShortcut("Mod+,")}
          icon={<Settings size={14} />}
          onSelect={() => openSettings("appearance")}
        />
      </Menu>
    </header>
  );
}
