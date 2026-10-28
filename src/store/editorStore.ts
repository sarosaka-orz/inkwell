import { create } from "zustand";
import type { Theme } from "../themes";
import { applyTheme, getStoredTheme, THEME_STORAGE_KEY } from "../themes/applyTheme";
import type { FileEntry } from "../services/tauriBridge";
import { readDraft } from "../services/draftStore";
import { SAMPLE_MARKDOWN } from "../sampleMarkdown";

export interface Tab {
  id: string;
  path: string;
  name: string;
  content: string;
  modified: boolean;
}

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "error";
}

export type FontChoice = "literata" | "instrument" | "mono" | "system";

export interface Settings {
  fontFamily: FontChoice;
  fontSize: number;
  lineHeight: number;
  vimMode: boolean;
  spellCheck: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
  typewriterMode: boolean;
  focusMode: boolean;
  fullWidth: boolean;
  smoothCaret: boolean;
  defaultExportPath: string;
}

export type EditorMode = "live" | "source" | "preview";
export type SidebarTab = "files" | "outline" | "recent";
export type SaveStatus = "saved" | "saving" | "unsaved";
export type Overlay = "sidebar" | "command" | "settings" | "table" | null;
export type SettingsSection = "appearance" | "typography" | "editor" | "shortcuts";

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
  pos: number;
  line: number;
}

export interface CursorStats {
  line: number;
  col: number;
  selectedChars: number;
}

export interface PendingClose {
  tabIds: string[];
  /** True when the window itself is closing, not a single tab. */
  closeWindow: boolean;
}

interface EditorState {
  // Tabs
  tabs: Tab[];
  activeTabId: string | null;
  /** Number of crash-recovered tabs loaded at startup. */
  recoveredDraftCount: number;
  pendingClose: PendingClose | null;

  // View modes
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;
  toggleMode: () => void;
  toggleReadMode: () => void;

  // Sidebar & workspace
  sidebarTab: SidebarTab;
  currentFolder: string | null;
  folderEntries: FileEntry[];
  folderLoading: boolean;
  outline: HeadingItem[];
  setSidebarTab: (tab: SidebarTab) => void;
  setCurrentFolder: (path: string | null) => void;
  setFolderEntries: (entries: FileEntry[]) => void;
  setFolderLoading: (loading: boolean) => void;
  setOutline: (headings: HeadingItem[]) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Vim mode
  vimMode: boolean;
  vimStatus: string;
  toggleVimMode: () => void;
  setVimStatus: (status: string) => void;

  // Auto-save & status
  saveStatus: SaveStatus;
  setSaveStatus: (status: SaveStatus) => void;

  // Document statistics
  cursorStats: CursorStats;
  setCursorStats: (stats: CursorStats) => void;

  // Search
  searchOpen: boolean;
  setSearchOpen: (open: boolean) => void;
  toggleSearch: () => void;

  // Formatting dock
  formatBarPinned: boolean;
  setFormatBarPinned: (pinned: boolean) => void;
  toggleFormatBarPinned: () => void;

  // One overlay at a time keeps Escape and focus handling deterministic.
  overlay: Overlay;
  settingsSection: SettingsSection;
  openOverlay: (overlay: Exclude<Overlay, null>) => void;
  closeOverlay: () => void;
  toggleOverlay: (overlay: Exclude<Overlay, null>) => void;
  openSettings: (section?: SettingsSection) => void;
  setSettingsSection: (section: SettingsSection) => void;

  // Toasts
  toasts: Toast[];
  addToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;

  // Settings
  settings: Settings;
  updateSettings: (settings: Partial<Settings>) => void;

  // Recent files
  recentFiles: { path: string; name: string; lastOpened: string }[];
  setRecentFiles: (files: { path: string; name: string; lastOpened: string }[]) => void;

  // Actions
  openFile: (path: string, name: string, content: string) => void;
  createNewFile: () => void;
  closeTab: (id: string) => void;
  closeTabs: (ids: string[]) => void;
  requestCloseTab: (id: string) => void;
  requestAppClose: () => boolean;
  dismissPendingClose: () => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabSaved: (id: string) => void;
  toggleSidebar: () => void;
}

const LEGACY_FONT_MAP: Record<string, FontChoice> = {
  "JetBrains Mono": "mono",
  "Fira Code": "mono",
  "Cascadia Code": "mono",
  "iA Writer Quattro": "instrument",
  Literata: "literata",
  Georgia: "literata",
  "system-ui": "system",
  "Instrument Sans": "instrument",
};

function migrateFontFamily(value: unknown): FontChoice {
  if (value === "literata" || value === "instrument" || value === "mono" || value === "system") {
    return value;
  }
  if (typeof value === "string" && LEGACY_FONT_MAP[value]) return LEGACY_FONT_MAP[value];
  return "literata";
}

const loadInitialSettings = (): Settings => {
  const defaults: Settings = {
    fontFamily: "literata",
    fontSize: 17,
    lineHeight: 1.7,
    vimMode: false,
    spellCheck: false,
    autoSave: true,
    autoSaveDelay: 1000,
    typewriterMode: false,
    focusMode: false,
    fullWidth: false,
    smoothCaret: true,
    defaultExportPath: "",
  };
  try {
    const raw = localStorage.getItem("inkwell:settings");
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<Settings>;
      return {
        ...defaults,
        ...parsed,
        fontFamily: migrateFontFamily(parsed.fontFamily),
      };
    }
  } catch {
    // ignore malformed storage
  }
  return defaults;
};

const initialSettings = loadInitialSettings();
const initialTheme = getStoredTheme();

const initialDocId = "initial-welcome-tab";
const initialTab: Tab = {
  id: initialDocId,
  path: "",
  name: "welcome.md",
  content: SAMPLE_MARKDOWN,
  modified: false,
};

// Restore unsaved work before the first render. Drafts only contain dirty
// tabs, so a clean shutdown never resurrects old documents.
const recoveredDraft = readDraft();
const recoveredTabs: Tab[] = (recoveredDraft?.tabs ?? []).map((tab) => ({
  ...tab,
  modified: true,
}));
const initialTabs = recoveredTabs.length > 0 ? recoveredTabs : [initialTab];
const initialActiveTabId =
  recoveredTabs.find((tab) => tab.id === recoveredDraft?.activeTabId)?.id ??
  recoveredTabs[0]?.id ??
  initialDocId;

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: initialTabs,
  activeTabId: initialActiveTabId,
  recoveredDraftCount: recoveredTabs.length,
  pendingClose: null,

  mode: "live",
  setMode: (mode) => set({ mode }),
  toggleMode: () => set((state) => ({ mode: state.mode === "source" ? "live" : "source" })),
  toggleReadMode: () =>
    set((state) => ({ mode: state.mode === "preview" ? "live" : "preview" })),

  sidebarTab: "files",
  currentFolder: null,
  folderEntries: [],
  folderLoading: false,
  outline: [],
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setCurrentFolder: (currentFolder) => set({ currentFolder }),
  setFolderEntries: (folderEntries) => set({ folderEntries }),
  setFolderLoading: (folderLoading) => set({ folderLoading }),
  setOutline: (outline) => set({ outline }),

  theme: initialTheme,
  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage failures
    }
    applyTheme(theme);
    set({ theme });
  },

  vimMode: initialSettings.vimMode,
  vimStatus: "",
  toggleVimMode: () => {
    const next = !get().vimMode;
    get().updateSettings({ vimMode: next });
    set({ vimMode: next });
  },
  setVimStatus: (vimStatus) => set({ vimStatus }),

  saveStatus: "saved",
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  cursorStats: { line: 1, col: 1, selectedChars: 0 },
  setCursorStats: (cursorStats) => {
    const prev = get().cursorStats;
    if (
      prev.line === cursorStats.line &&
      prev.col === cursorStats.col &&
      prev.selectedChars === cursorStats.selectedChars
    ) {
      return;
    }
    set({ cursorStats });
  },

  searchOpen: false,
  setSearchOpen: (searchOpen) => set({ searchOpen }),
  toggleSearch: () => set((state) => ({ searchOpen: !state.searchOpen })),

  formatBarPinned: false,
  setFormatBarPinned: (formatBarPinned) => set({ formatBarPinned }),
  toggleFormatBarPinned: () => set((state) => ({ formatBarPinned: !state.formatBarPinned })),

  overlay: null,
  settingsSection: "appearance",
  openOverlay: (overlay) => set({ overlay }),
  closeOverlay: () => set({ overlay: null }),
  toggleOverlay: (overlay) =>
    set((state) => ({ overlay: state.overlay === overlay ? null : overlay })),
  openSettings: (settingsSection = "appearance") => set({ overlay: "settings", settingsSection }),
  setSettingsSection: (settingsSection) => set({ settingsSection }),

  toasts: [],
  addToast: (message, type) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 3800);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  settings: initialSettings,
  updateSettings: (newSettings) => {
    set((state) => {
      const updated = { ...state.settings, ...newSettings };
      try {
        localStorage.setItem("inkwell:settings", JSON.stringify(updated));
      } catch {
        // ignore storage failures
      }
      return { settings: updated, vimMode: updated.vimMode };
    });
  },

  recentFiles: [],
  setRecentFiles: (recentFiles) => set({ recentFiles }),

  openFile: (path, name, content) => {
    const existing = path ? get().tabs.find((t) => t.path === path) : undefined;
    if (existing) {
      set({ activeTabId: existing.id });
      return;
    }
    const id = crypto.randomUUID();
    const tab: Tab = { id, path, name, content, modified: false };
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: id,
    }));
  },

  createNewFile: () => {
    const id = crypto.randomUUID();
    const untitledCount = get().tabs.filter(
      (t) => !t.path && t.name.startsWith("untitled"),
    ).length;
    const name = untitledCount === 0 ? "untitled.md" : `untitled-${untitledCount + 1}.md`;
    const tab: Tab = {
      id,
      path: "",
      name,
      content: "# Untitled\n\nStart writing here...",
      modified: false,
    };
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: id,
      // A new document is for writing, even if the last one was being read.
      mode: "live",
    }));
  },

  closeTab: (id) => get().closeTabs([id]),

  closeTabs: (ids) => {
    const closing = new Set(ids);
    set((state) => {
      const activeIndex = state.activeTabId
        ? state.tabs.findIndex((tab) => tab.id === state.activeTabId)
        : -1;
      const newTabs = state.tabs.filter((tab) => !closing.has(tab.id));

      let newActiveId = state.activeTabId;
      if (state.activeTabId && closing.has(state.activeTabId)) {
        newActiveId = null;
        // Prefer the next tab to the right, then the previous one.
        for (let offset = 1; offset < state.tabs.length; offset++) {
          const forward = state.tabs[activeIndex + offset];
          if (forward && !closing.has(forward.id)) {
            newActiveId = forward.id;
            break;
          }
          const backward = state.tabs[activeIndex - offset];
          if (backward && !closing.has(backward.id)) {
            newActiveId = backward.id;
            break;
          }
        }
      }

      return { tabs: newTabs, activeTabId: newActiveId };
    });
  },

  requestCloseTab: (id) => {
    const tab = get().tabs.find((item) => item.id === id);
    if (!tab) return;
    if (!tab.modified) {
      get().closeTabs([id]);
      return;
    }
    set({ pendingClose: { tabIds: [id], closeWindow: false } });
  },

  requestAppClose: () => {
    if (get().pendingClose) return true;
    const modified = get().tabs.filter((tab) => tab.modified);
    if (modified.length === 0) return false;
    set({
      pendingClose: {
        tabIds: modified.map((tab) => tab.id),
        closeWindow: true,
      },
    });
    return true;
  },

  dismissPendingClose: () => set({ pendingClose: null }),

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) => {
    set((state) => {
      const tab = state.tabs.find((t) => t.id === id);
      if (!tab || tab.content === content) return state;
      return {
        tabs: state.tabs.map((t) => (t.id === id ? { ...t, content, modified: true } : t)),
        saveStatus: "unsaved",
      };
    });
  },

  markTabSaved: (id) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, modified: false } : t)),
      saveStatus: "saved",
    }));
  },

  toggleSidebar: () =>
    set((state) => ({ overlay: state.overlay === "sidebar" ? null : "sidebar" })),
}));
