import { Compartment, type Extension } from "@codemirror/state";
import {
  EditorView,
  keymap,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
  highlightActiveLine,
  lineNumbers,
} from "@codemirror/view";
import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import {
  syntaxHighlighting,
  bracketMatching,
  foldGutter,
  indentOnInput,
  HighlightStyle,
  type TagStyle,
} from "@codemirror/language";
import { search } from "@codemirror/search";
import { tags } from "@lezer/highlight";
import { vim } from "@replit/codemirror-vim";
import { useEditorStore, type EditorMode, type Settings } from "../../store/editorStore";
import { resolveFontStack } from "../../themes/fonts";
import { extractHeadings } from "../../utils/outline";
import { writeFile } from "../../services/tauriBridge";
import { formatInline, formatLinePrefix, insertLink } from "../../services/editorController";
import { createTheme } from "./theme";
import { markdownRenderPlugin, themeRefresh } from "./renderPlugin";
import { smartMarkdownKeymap } from "./smartKeys";

export const modeCompartment = new Compartment();
export const vimCompartment = new Compartment();
export const typographyCompartment = new Compartment();

const inlineRules: TagStyle[] = [
  { tag: tags.strong, fontWeight: "700" },
  { tag: tags.emphasis, fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.monospace, fontFamily: "var(--font-mono)", fontSize: "0.88em" },
  { tag: tags.link, color: "var(--color-accent)", textDecoration: "underline" },
  { tag: tags.url, color: "var(--color-accent)" },
  { tag: tags.quote, color: "var(--color-ink-soft)", fontStyle: "italic" },
  { tag: tags.meta, color: "var(--color-ink-muted)" },
  { tag: tags.processingInstruction, color: "var(--color-ink-muted)" },
  { tag: tags.comment, color: "var(--color-syntax-comment)", fontStyle: "italic" },
  { tag: tags.string, color: "var(--color-syntax-string)" },
  { tag: tags.number, color: "var(--color-syntax-number)" },
  { tag: tags.keyword, color: "var(--color-syntax-keyword)" },
  { tag: tags.atom, color: "var(--color-syntax-number)" },
  { tag: tags.bool, color: "var(--color-syntax-number)" },
  { tag: tags.variableName, color: "var(--color-syntax-variable)" },
  { tag: tags.definition(tags.variableName), color: "var(--color-syntax-function)" },
  { tag: tags.function(tags.variableName), color: "var(--color-syntax-function)" },
  { tag: tags.propertyName, color: "var(--color-syntax-type)" },
  { tag: tags.typeName, color: "var(--color-syntax-type)" },
  { tag: tags.operator, color: "var(--color-syntax-operator)" },
  { tag: tags.punctuation, color: "var(--color-syntax-operator)" },
];

/**
 * Live mode sizes headings on the line element (`.cm-header-N`). Source mode
 * has no line classes, so it sizes the token itself. Never do both, or a
 * heading scales twice.
 */
const liveHeadingRules: TagStyle[] = [
  { tag: tags.heading1, fontWeight: "700" },
  { tag: tags.heading2, fontWeight: "650" },
  { tag: tags.heading3, fontWeight: "620" },
  { tag: tags.heading4, fontWeight: "620" },
  { tag: tags.heading5, fontWeight: "620" },
  { tag: tags.heading6, fontWeight: "620" },
];

const sourceHeadingRules: TagStyle[] = [
  { tag: tags.heading1, fontSize: "1.95em", fontWeight: "700", lineHeight: "1.18" },
  { tag: tags.heading2, fontSize: "1.45em", fontWeight: "650", lineHeight: "1.25" },
  { tag: tags.heading3, fontSize: "1.18em", fontWeight: "620", lineHeight: "1.35" },
  { tag: tags.heading4, fontSize: "1.02em", fontWeight: "620" },
  { tag: tags.heading5, fontSize: "1.02em", fontWeight: "620" },
  { tag: tags.heading6, fontSize: "1.02em", fontWeight: "620" },
];

const markdownHighlight = HighlightStyle.define([...liveHeadingRules, ...inlineRules]);
const sourceMarkdownHighlight = HighlightStyle.define([...sourceHeadingRules, ...inlineRules]);

export function modeExtension(mode: EditorMode): Extension {
  return mode === "source"
    ? [lineNumbers(), syntaxHighlighting(sourceMarkdownHighlight)]
    : [syntaxHighlighting(markdownHighlight), markdownRenderPlugin()];
}

export function vimExtension(enabled: boolean): Extension {
  return enabled ? vim() : [];
}

export function typographyExtension(settings: Settings): Extension {
  return EditorView.theme({
    ".cm-content": {
      fontFamily: resolveFontStack(settings.fontFamily),
      fontSize: `${settings.fontSize}px`,
      lineHeight: `${settings.lineHeight}`,
    },
  });
}

/** Reconfiguration effects for an existing editor state. */
export function currentCompartmentEffects() {
  const { mode, vimMode, settings } = useEditorStore.getState();
  return [
    modeCompartment.reconfigure(modeExtension(mode)),
    vimCompartment.reconfigure(vimExtension(vimMode)),
    typographyCompartment.reconfigure(typographyExtension(settings)),
    // Cached tabs may still hold widgets rendered with the old palette.
    themeRefresh.of(null),
  ];
}

// ── Auto-save ───────────────────────────────────────────────────────

const autoSaveTimers = new Map<string, number>();

export function clearAutoSave(tabId?: string) {
  if (tabId) {
    const timer = autoSaveTimers.get(tabId);
    if (timer) window.clearTimeout(timer);
    autoSaveTimers.delete(tabId);
    return;
  }
  autoSaveTimers.forEach((timer) => window.clearTimeout(timer));
  autoSaveTimers.clear();
}

function scheduleAutoSave(tabId: string, content: string) {
  const state = useEditorStore.getState();
  const tab = state.tabs.find((t) => t.id === tabId);
  if (!state.settings.autoSave || !tab?.path) return;

  const existing = autoSaveTimers.get(tabId);
  if (existing) window.clearTimeout(existing);

  const timer = window.setTimeout(async () => {
    autoSaveTimers.delete(tabId);
    try {
      useEditorStore.getState().setSaveStatus("saving");
      await writeFile(tab.path, content);
      useEditorStore.getState().markTabSaved(tabId);
    } catch {
      useEditorStore.getState().setSaveStatus("unsaved");
    }
  }, state.settings.autoSaveDelay);

  autoSaveTimers.set(tabId, timer);
}

// ── Update listener ─────────────────────────────────────────────────

function handleUpdate(tabId: string, update: { docChanged: boolean; selectionSet: boolean; state: EditorView["state"] }) {
  const state = useEditorStore.getState();

  if (update.docChanged) {
    const doc = update.state.doc.toString();
    state.updateTabContent(tabId, doc);
    state.setOutline(extractHeadings(doc));
    scheduleAutoSave(tabId, doc);
  }

  if (update.selectionSet || update.docChanged) {
    const selection = update.state.selection.main;
    const line = update.state.doc.lineAt(selection.head);
    state.setCursorStats({
      line: line.number,
      col: selection.head - line.from + 1,
      selectedChars: Math.abs(selection.to - selection.from),
    });
  }
}

// ── Extension set ───────────────────────────────────────────────────

const editorKeymap = [
  ...smartMarkdownKeymap,
  ...defaultKeymap,
  ...historyKeymap,
  indentWithTab,
  { key: "Mod-b", run: () => (formatInline("**", "bold text"), true) },
  { key: "Mod-i", run: () => (formatInline("*", "italic text"), true) },
  { key: "Mod-k", run: () => (insertLink(), true) },
  { key: "Mod-1", run: () => (formatLinePrefix("# "), true) },
  { key: "Mod-2", run: () => (formatLinePrefix("## "), true) },
  { key: "Mod-3", run: () => (formatLinePrefix("### "), true) },
  { key: "Mod-4", run: () => (formatLinePrefix("#### "), true) },
  { key: "Mod-0", run: () => (formatLinePrefix(""), true) },
];

export function buildEditorExtensions(tabId: string): Extension[] {
  const { mode, vimMode, settings } = useEditorStore.getState();

  return [
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
    search({ top: false }),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    EditorView.lineWrapping,
    keymap.of(editorKeymap),
    createTheme(),
    modeCompartment.of(modeExtension(mode)),
    vimCompartment.of(vimExtension(vimMode)),
    typographyCompartment.of(typographyExtension(settings)),
    EditorView.updateListener.of((update) => handleUpdate(tabId, update)),
  ];
}
