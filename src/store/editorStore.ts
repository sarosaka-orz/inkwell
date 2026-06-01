import { create } from "zustand";

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

export interface Settings {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  vimMode: boolean;
  spellCheck: boolean;
  defaultExportPath: string;
}

export type Theme = "inkwell-dark" | "github-dark" | "dracula" | "solarized-light" | "nord";

interface EditorState {
  // Tabs
  tabs: Tab[];
  activeTabId: string | null;

  // Sidebar
  sidebarOpen: boolean;
  currentFolder: string | null;

  // Theme
  theme: Theme;

  // Vim mode
  vimMode: boolean;
  vimStatus: string;

  // Toasts
  toasts: Toast[];

  // Settings
  settingsOpen: boolean;
  settings: Settings;

  // Recent files
  recentFiles: { path: string; name: string; lastOpened: string }[];

  // Actions
  openFile: (path: string, name: string, content: string) => void;
  createNewFile: () => void;
  closeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  updateTabContent: (id: string, content: string) => void;
  markTabSaved: (id: string) => void;
  toggleSidebar: () => void;
  setCurrentFolder: (path: string | null) => void;
  setTheme: (theme: Theme) => void;
  toggleVimMode: () => void;
  setVimStatus: (status: string) => void;
  addToast: (message: string, type: Toast["type"]) => void;
  removeToast: (id: string) => void;
  toggleSettings: () => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setRecentFiles: (files: { path: string; name: string; lastOpened: string }[]) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  tabs: [],
  activeTabId: null,
  sidebarOpen: true,
  currentFolder: null,
  theme: "inkwell-dark",
  vimMode: false,
  vimStatus: "",
  toasts: [],
  settingsOpen: false,
  settings: {
    fontFamily: "JetBrains Mono",
    fontSize: 15,
    lineHeight: 1.8,
    vimMode: false,
    spellCheck: false,
    defaultExportPath: "",
  },
  recentFiles: [],

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
    const count = get().tabs.filter((t) => t.path === "").length;
    const name = count === 0 ? "untitled.md" : `untitled-${count + 1}.md`;
    const tab: Tab = { id, path: "", name, content: "", modified: false };
    set((state) => ({
      tabs: [...state.tabs, tab],
      activeTabId: id,
    }));
  },

  closeTab: (id) => {
    set((state) => {
      const newTabs = state.tabs.filter((t) => t.id !== id);
      let newActiveId = state.activeTabId;
      if (state.activeTabId === id) {
        const idx = state.tabs.findIndex((t) => t.id === id);
        newActiveId = newTabs.length > 0 ? newTabs[Math.min(idx, newTabs.length - 1)].id : null;
      }
      return { tabs: newTabs, activeTabId: newActiveId };
    });
  },

  setActiveTab: (id) => set({ activeTabId: id }),

  updateTabContent: (id, content) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, content, modified: true } : t)),
    }));
  },

  markTabSaved: (id) => {
    set((state) => ({
      tabs: state.tabs.map((t) => (t.id === id ? { ...t, modified: false } : t)),
    }));
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setCurrentFolder: (path) => set({ currentFolder: path }),

  setTheme: (theme) => set({ theme }),

  toggleVimMode: () => set((state) => ({ vimMode: !state.vimMode })),

  setVimStatus: (status) => set({ vimStatus: status }),

  addToast: (message, type) => {
    const id = crypto.randomUUID();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  toggleSettings: () => set((state) => ({ settingsOpen: !state.settingsOpen })),

  updateSettings: (newSettings) => {
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  setRecentFiles: (files) => set({ recentFiles: files }),
}));
