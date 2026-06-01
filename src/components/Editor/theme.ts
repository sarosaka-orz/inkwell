import { EditorView } from "@codemirror/view";

export function createTheme() {
  return EditorView.theme({
    "&": {
      backgroundColor: "transparent",
    },
    ".cm-content": {
      caretColor: "var(--color-accent)",
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    },
    ".cm-cursor, .cm-dropCursor": {
      borderLeftColor: "var(--color-accent)",
      borderLeftWidth: "2px",
    },
    "&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection": {
      backgroundColor: "rgba(212, 165, 116, 0.2)",
    },
    ".cm-panels": {
      backgroundColor: "var(--color-bg-secondary)",
      color: "var(--color-text-primary)",
    },
    ".cm-panels.cm-panels-top": {
      borderBottom: "1px solid var(--color-border)",
    },
    ".cm-panels.cm-panels-bottom": {
      borderTop: "1px solid var(--color-border)",
    },
    ".cm-searchMatch": {
      backgroundColor: "rgba(212, 165, 116, 0.3)",
      borderRadius: "2px",
    },
    ".cm-searchMatch.cm-searchMatch-selected": {
      backgroundColor: "rgba(212, 165, 116, 0.5)",
    },
    ".cm-activeLine": {
      backgroundColor: "transparent",
    },
    ".cm-selectionMatch": {
      backgroundColor: "rgba(212, 165, 116, 0.15)",
    },
    ".cm-matchingBracket, .cm-nonmatchingBracket": {
      backgroundColor: "rgba(212, 165, 116, 0.3)",
      outline: "none",
    },
    ".cm-tooltip": {
      border: "1px solid var(--color-border)",
      backgroundColor: "var(--color-bg-secondary)",
      borderRadius: "8px",
      boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
    },
    ".cm-tooltip .cm-tooltip-arrow:before": {
      borderTopColor: "var(--color-border)",
      borderBottomColor: "var(--color-border)",
    },
    ".cm-tooltip .cm-tooltip-arrow:after": {
      borderTopColor: "var(--color-bg-secondary)",
      borderBottomColor: "var(--color-bg-secondary)",
    },
    ".cm-tooltip-autocomplete": {
      "& > ul > li": {
        padding: "4px 8px",
        borderRadius: "4px",
      },
      "& > ul > li[aria-selected]": {
        backgroundColor: "var(--color-bg-hover)",
        color: "var(--color-text-primary)",
      },
    },
    // Smooth scrolling
    ".cm-scroller": {
      scrollBehavior: "smooth",
      overflow: "auto",
    },
    ".cm-foldGutter": {
      width: "0",
    },
    ".cm-foldPlaceholder": {
      backgroundColor: "var(--color-bg-tertiary)",
      border: "1px solid var(--color-border)",
      color: "var(--color-text-muted)",
      borderRadius: "4px",
      padding: "0 6px",
      margin: "0 4px",
    },
    // Vim mode cursor styles
    ".cm-vimMode &": {
      cursor: "none",
    },
  });
}
