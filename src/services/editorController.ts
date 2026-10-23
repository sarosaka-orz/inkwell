import type { EditorView } from "@codemirror/view";
import {
  SearchQuery,
  setSearchQuery,
  findNext,
  findPrevious,
  getSearchQuery,
  replaceNext,
  replaceAll,
} from "@codemirror/search";

let currentView: EditorView | null = null;

export function setGlobalEditorView(view: EditorView | null) {
  currentView = view;
}

export function getGlobalEditorView(): EditorView | null {
  return currentView;
}

/**
 * Jump and scroll to character position (e.g. clicking TOC outline heading)
 */
export function jumpToPos(pos: number) {
  if (!currentView) return;
  currentView.dispatch({
    selection: { anchor: pos },
    scrollIntoView: true,
  });
  currentView.focus();
}

/**
 * Toggle inline formatting like **bold**, *italic*, `code`, ~~strikethrough~~, ==highlight==
 */
export function formatInline(delimiter: string, placeholder: string = "text") {
  if (!currentView || currentView.state.readOnly) return;
  const { state } = currentView;
  const sel = state.selection.main;
  const len = delimiter.length;

  if (sel.empty) {
    // Insert delimiter + placeholder + delimiter
    const insert = `${delimiter}${placeholder}${delimiter}`;
    currentView.dispatch({
      changes: { from: sel.from, to: sel.to, insert },
      selection: { anchor: sel.from + len, head: sel.from + len + placeholder.length },
    });
  } else {
    const selectedText = state.sliceDoc(sel.from, sel.to);
    // Check if already formatted
    const before = state.sliceDoc(Math.max(0, sel.from - len), sel.from);
    const after = state.sliceDoc(sel.to, Math.min(state.doc.length, sel.to + len));

    if (before === delimiter && after === delimiter) {
      // Unwrap
      currentView.dispatch({
        changes: [
          { from: sel.from - len, to: sel.from, insert: "" },
          { from: sel.to, to: sel.to + len, insert: "" },
        ],
        selection: { anchor: sel.from - len, head: sel.to - len },
      });
    } else {
      // Wrap
      currentView.dispatch({
        changes: [
          { from: sel.from, to: sel.from, insert: delimiter },
          { from: sel.to, to: sel.to, insert: delimiter },
        ],
        selection: { anchor: sel.from + len, head: sel.to + len },
      });
    }
  }
  currentView.focus();
}

/**
 * Apply block heading (#, ##, etc.) or prefix (> , - , 1. , - [ ] )
 */
export function formatLinePrefix(prefix: string) {
  if (!currentView || currentView.state.readOnly) return;
  const { state } = currentView;
  const line = state.doc.lineAt(state.selection.main.head);
  const text = line.text;

  if (prefix === "") {
    const cleaned = text.replace(/^(#{1,6}\s+|>\s*|[-*+]\s+(\[[ xX]\]\s*)?|\d+[.)]\s+)/, "");
    currentView.dispatch({ changes: { from: line.from, to: line.to, insert: cleaned } });
    currentView.focus();
    return;
  }

  // If already starts with this prefix, toggle off
  if (text.startsWith(prefix)) {
    currentView.dispatch({
      changes: { from: line.from, to: line.from + prefix.length, insert: "" },
    });
  } else {
    // Remove existing heading/list prefixes if switching headings
    const cleaned = text.replace(/^(#{1,6}\s+|>\s*|[-*+]\s+(\[[ xX]\]\s*)?|\d+[.)]\s+)/, "");
    currentView.dispatch({
      changes: { from: line.from, to: line.to, insert: `${prefix}${cleaned}` },
    });
  }
  currentView.focus();
}

/**
 * Insert code block or math block
 */
export function insertFencedBlock(lang: string = "", placeholder: string = "code here") {
  if (!currentView || currentView.state.readOnly) return;
  const { state } = currentView;
  const sel = state.selection.main;
  const selectedText = sel.empty ? placeholder : state.sliceDoc(sel.from, sel.to);
  const insert = `\n\`\`\`${lang}\n${selectedText}\n\`\`\`\n`;

  currentView.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor: sel.from + 4 + lang.length, head: sel.from + 4 + lang.length + selectedText.length },
  });
  currentView.focus();
}

/**
 * Insert math block ($$)
 */
export function insertMathBlock() {
  if (!currentView || currentView.state.readOnly) return;
  const { state } = currentView;
  const sel = state.selection.main;
  const selectedText = sel.empty ? "f(x) = \\int_{-\\infty}^{\\infty} e^{-x^2} dx" : state.sliceDoc(sel.from, sel.to);
  const insert = `\n$$\n${selectedText}\n$$\n`;

  currentView.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor: sel.from + 4, head: sel.from + 4 + selectedText.length },
  });
  currentView.focus();
}

/** Insert literal text at the cursor/selection. */
export function insertText(text: string) {
  if (!currentView || currentView.state.readOnly) return;
  const sel = currentView.state.selection.main;
  currentView.dispatch({
    changes: { from: sel.from, to: sel.to, insert: text },
    selection: { anchor: sel.from + text.length },
  });
  currentView.focus();
}

/**
 * Insert table
 */
export function insertTable(rows: number = 3, cols: number = 3) {
  if (!currentView || currentView.state.readOnly) return;
  const { state } = currentView;
  const sel = state.selection.main;

  let table = "\n|";
  for (let c = 1; c <= cols; c++) table += ` Header ${c} |`;
  table += "\n|";
  for (let c = 1; c <= cols; c++) table += ` :--- |`;
  table += "\n";

  for (let r = 1; r <= rows; r++) {
    table += "|";
    for (let c = 1; c <= cols; c++) table += ` Row ${r} Col ${c} |`;
    table += "\n";
  }
  table += "\n";

  currentView.dispatch({
    changes: { from: sel.from, to: sel.to, insert: table },
  });
  currentView.focus();
}

/**
 * Insert link [text](url)
 */
export function insertLink(url: string = "https://", text: string = "link") {
  if (!currentView || currentView.state.readOnly) return;
  const { state } = currentView;
  const sel = state.selection.main;
  const label = sel.empty ? text : state.sliceDoc(sel.from, sel.to);
  const insert = `[${label}](${url})`;

  currentView.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
    selection: { anchor: sel.from + label.length + 3, head: sel.from + label.length + 3 + url.length },
  });
  currentView.focus();
}

/**
 * Insert image ![alt](url)
 */
export function insertImage(url: string = "https://via.placeholder.com/600x300", alt: string = "Image description") {
  if (!currentView || currentView.state.readOnly) return;
  const { state } = currentView;
  const sel = state.selection.main;
  const insert = `\n![${alt}](${url})\n`;

  currentView.dispatch({
    changes: { from: sel.from, to: sel.to, insert },
  });
  currentView.focus();
}

/**
 * Search and Replace operations
 */
export function executeSearch(query: string, caseSensitive: boolean = false, regexp: boolean = false): number {
  if (!currentView) return 0;
  if (!query) {
    currentView.dispatch({ effects: setSearchQuery.of(new SearchQuery({ search: "" })) });
    return 0;
  }

  const searchQuery = new SearchQuery({
    search: query,
    caseSensitive,
    regexp,
  });

  currentView.dispatch({ effects: setSearchQuery.of(searchQuery) });

  // Count matches with the same options used for navigation.
  let count = 0;
  try {
    const cursor = searchQuery.getCursor(currentView.state);
    while (!cursor.next().done) {
      count++;
      if (count > 999) break;
    }
  } catch {
    // ignore invalid patterns
  }

  return count;
}

export function searchNext() {
  if (currentView) findNext(currentView);
}

export function searchPrevious() {
  if (currentView) findPrevious(currentView);
}

function applyReplacement(replacement: string): boolean {
  if (!currentView || currentView.state.readOnly) return false;
  const current = getSearchQuery(currentView.state);
  if (!current || !current.search) return false;
  currentView.dispatch({
    effects: setSearchQuery.of(
      new SearchQuery({
        search: current.search,
        caseSensitive: current.caseSensitive,
        regexp: current.regexp,
        wholeWord: current.wholeWord,
        replace: replacement,
      }),
    ),
  });
  return true;
}

export function doReplaceNext(replacement: string) {
  if (!applyReplacement(replacement)) return;
  if (currentView) replaceNext(currentView);
}

export function doReplaceAll(replacement: string) {
  if (!applyReplacement(replacement)) return;
  if (currentView) replaceAll(currentView);
}
