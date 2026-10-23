import { EditorView } from "@codemirror/view";

/**
 * CodeMirror chrome. Every color is a CSS variable so switching themes never
 * requires rebuilding the editor state.
 */
export function createTheme() {
  return EditorView.theme({
    "&": {
      backgroundColor: "transparent",
    },
    ".cm-content": {
      caretColor: "var(--color-accent)",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-accent)",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "var(--color-selection)",
    },
    ".cm-panels": {
      backgroundColor: "var(--color-surface)",
      color: "var(--color-ink)",
    },
    ".cm-panels.cm-panels-top": {
      borderBottom: "1px solid var(--color-line)",
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: "1px solid var(--color-line)",
    },
    ".cm-searchMatch": {
      backgroundColor: "var(--color-accent-soft)",
      borderRadius: "2px",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "var(--color-selection)",
    },
    ".cm-selectionMatch": {
      backgroundColor: "var(--color-accent-soft)",
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "var(--color-accent-soft)",
      outline: "none",
    },
    ".cm-tooltip": {
      border: "1px solid var(--color-line)",
      backgroundColor: "var(--color-surface)",
      color: "var(--color-ink)",
      borderRadius: "var(--radius-sm)",
      boxShadow: "var(--shadow-card)",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "var(--color-line)",
      borderBottomColor: "var(--color-line)",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: "var(--color-surface)",
      borderBottomColor: "var(--color-surface)",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li": {
        padding: "4px 8px",
        borderRadius: "var(--radius-xs)",
      },
      "& > ul > li[aria-selected]": {
        backgroundColor: "var(--color-hover)",
        color: "var(--color-ink)",
      },
    },
    ".cm-foldGutter": {
      width: "0",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "var(--color-sunken)",
      border: "1px solid var(--color-line)",
      color: "var(--color-ink-muted)",
      borderRadius: "var(--radius-xs)",
      padding: "0 6px",
      margin: "0 4px",
    },
    ".cm-vimMode &": {
      cursor: "none",
    },
  });
}
