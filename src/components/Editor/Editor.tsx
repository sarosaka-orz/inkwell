import { useEffect, useRef, useCallback } from "react";
import { EditorState } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
} from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import {
  defaultKeymap,
  history,
  historyKeymap,
  indentWithTab,
  undo,
  redo,
} from "@codemirror/commands";
import {
  syntaxHighlighting,
  defaultHighlightStyle,
  bracketMatching,
  foldGutter,
  indentOnInput,
  HighlightStyle,
} from "@codemirror/language";
import { tags } from "@lezer/highlight";
import { vim } from "@replit/codemirror-vim";
import { useEditorStore } from "../../store/editorStore";
import { createTheme } from "./theme";
import { markdownRenderPlugin } from "./renderPlugin";
import { generateHtml } from "../../utils/generateHtml";

// ── Custom syntax highlight for markdown ──

const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontSize: "2em", fontWeight: 800, lineHeight: "1.3" },
  { tag: tags.heading2, fontSize: "1.5em", fontWeight: 700, lineHeight: "1.35" },
  { tag: tags.heading3, fontSize: "1.25em", fontWeight: 600, lineHeight: "1.4" },
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through", color: "var(--color-text-secondary)" },
  { tag: tags.monospace, fontFamily: "JetBrains Mono, Fira Code, monospace", fontSize: "0.9em" },
  { tag: tags.link, color: "var(--color-accent)", textDecoration: "underline" },
  { tag: tags.quote, color: "var(--color-text-secondary)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--color-text-muted)" },
  { tag: tags.comment, color: "var(--color-text-muted)" },
  { tag: tags.string, color: "#a8c07a" },
  { tag: tags.number, color: "#e8a87c" },
  { tag: tags.keyword, color: "#c792ea" },
  { tag: tags.atom, color: "#e8a87c" },
  { tag: tags.bool, color: "#e8a87c" },
  { tag: tags.variableName, color: "var(--color-text-primary)" },
  { tag: tags.definition(tags.variableName), color: "#8cb4d8" },
  { tag: tags.function(tags.variableName), color: "#8cb4d8" },
  { tag: tags.propertyName, color: "#e8c87c" },
  { tag: tags.operator, color: "#89ddff" },
  { tag: tags.punctuation, color: "#89ddff" },
  { tag: tags.processingInstruction, color: "var(--color-text-muted)" },
]);

export function Editor() {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const { tabs, activeTabId, updateTabContent, vimMode, theme, settings, addToast, markTabSaved, openFile } = useEditorStore();

  const activeTab = tabs.find((t) => t.id === activeTabId);

  const saveFile = useCallback(async () => {
    if (!activeTab) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const { save } = await import("@tauri-apps/plugin-dialog");
      let path = activeTab.path;
      if (!path) {
        const savePath = await save({
          filters: [{ name: "Markdown", extensions: ["md"] }],
        });
        if (!savePath) return;
        path = savePath;
        const name = path.split("/").pop() || path.split("\\").pop() || "untitled.md";
        useEditorStore.setState((state) => ({
          tabs: state.tabs.map((t) =>
            t.id === activeTab.id ? { ...t, path, name } : t
          ),
        }));
      }
      await invoke("write_file", { path, contents: activeTab.content });
      markTabSaved(activeTab.id);
      addToast("File saved", "success");
    } catch (e) {
      addToast(`Save failed: ${e}`, "error");
    }
  }, [activeTab]);

  const openFileDlg = useCallback(async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const { open } = await import("@tauri-apps/plugin-dialog");
      const selected = await open({
        multiple: false,
        filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
      });
      if (selected) {
        const path = selected as string;
        const name = path.split("/").pop() || path.split("\\").pop() || "untitled.md";
        const content = await invoke<string>("read_file", { path });
        openFile(path, name, content);
        await invoke("add_recent_file", { path, name });
      }
    } catch (e) {
      addToast(`Failed to open file: ${e}`, "error");
    }
  }, []);

  const exportPdf = useCallback(async () => {
    if (!activeTab) return;
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const { save } = await import("@tauri-apps/plugin-dialog");
      const defaultName = activeTab.name.replace(/\.[^.]+$/, "") + ".pdf";
      const outputPath = await save({
        defaultPath: defaultName,
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!outputPath) return;
      const html = await generateHtml(activeTab.content, activeTab.name);
      await invoke("export_pdf", { html, outputPath });
      addToast("PDF exported successfully", "success");
    } catch (e) {
      addToast(`PDF export failed: ${e}`, "error");
    }
  }, [activeTab]);

  useEffect(() => {
    if (!editorRef.current || !activeTab) return;

    const extensions = [
      highlightSpecialChars(),
      history(),
      drawSelection(),
      dropCursor(),
      indentOnInput(),
      bracketMatching(),
      foldGutter(),
      rectangularSelection(),
      crosshairCursor(),
      highlightActiveLine(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
      syntaxHighlighting(markdownHighlight),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      markdownRenderPlugin(),
      EditorView.lineWrapping,
      EditorView.updateListener.of((update) => {
        if (update.docChanged && activeTabId) {
          updateTabContent(activeTabId, update.state.doc.toString());
        }
      }),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        indentWithTab,
        // File operations
        { key: "Mod-s", run: () => { saveFile(); return true; } },
        { key: "Mod-o", run: () => { openFileDlg(); return true; } },
        { key: "Mod-Shift-s", run: () => { saveFile(); return true; } },
        { key: "Mod-p", run: () => { exportPdf(); return true; } },
        // Undo/redo
        { key: "Mod-z", run: (view) => { undo(view); return true; } },
        { key: "Mod-Shift-z", run: (view) => { redo(view); return true; } },
        // Toggle sidebar
        { key: "Mod-\\", run: () => { useEditorStore.getState().toggleSidebar(); return true; } },
        // Settings
        { key: "Mod-,", run: () => { useEditorStore.getState().toggleSettings(); return true; } },
      ]),
      createTheme(),
    ];

    if (vimMode) {
      extensions.push(vim());
    }

    // Apply font settings from store
    const fontExt = EditorView.theme({
      ".cm-content": {
        fontFamily: `"${settings.fontFamily}", monospace`,
        fontSize: `${settings.fontSize}px`,
        lineHeight: `${settings.lineHeight}`,
      },
    });
    extensions.push(fontExt);

    const state = EditorState.create({
      doc: activeTab.content,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [activeTabId, vimMode, theme, settings.fontFamily, settings.fontSize, settings.lineHeight]);

  if (!activeTab) {
    return (
      <div
        className="flex-1 flex items-center justify-center empty-state"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6 opacity-10" style={{ color: "var(--color-accent)" }}>
            ✦
          </div>
          <h2
            className="text-2xl font-semibold mb-3"
            style={{ color: "var(--color-text-primary)", fontFamily: "'iA Writer Quattro', 'Literata', Georgia, serif" }}
          >
            Welcome to Inkwell
          </h2>
          <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
            A free, open-source Markdown editor
          </p>
          <div className="space-y-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <p>
              <kbd className="px-2 py-0.5 rounded" style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)" }}>
                Ctrl+O
              </kbd>{" "}
              Open file
            </p>
            <p>
              <kbd className="px-2 py-0.5 rounded" style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)" }}>
                Ctrl+S
              </kbd>{" "}
              Save
            </p>
            <p>
              <kbd className="px-2 py-0.5 rounded" style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)" }}>
                Ctrl+\
              </kbd>{" "}
              Toggle sidebar
            </p>
            <p>
              <kbd className="px-2 py-0.5 rounded" style={{ background: "var(--color-bg-tertiary)", border: "1px solid var(--color-border)" }}>
                Ctrl+,
              </kbd>{" "}
              Settings
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={editorRef}
      className="flex-1 overflow-auto"
      style={{ background: "var(--color-bg-primary)" }}
    />
  );
}
