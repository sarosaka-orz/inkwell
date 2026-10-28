import { type KeyBinding, EditorView } from "@codemirror/view";

/**
 * Handle Enter key in Markdown lists:
 * 1. Continues unordered lists (- item, * item, + item)
 * 2. Continues ordered lists (1. item -> 2. item)
 * 3. Continues task lists (- [ ] item, - [x] item -> - [ ] item)
 * 4. Cleans up empty list item on Enter to exit list
 */
function handleSmartEnter(view: EditorView): boolean {
  const { state } = view;
  const { selection } = state;
  const line = state.doc.lineAt(selection.main.head);
  const text = line.text;

  // Empty task list line: just "- [ ] " or "- [x] "
  const emptyTaskMatch = text.match(/^(\s*[-*+]\s\[[ xX]\]\s*)$/);
  if (emptyTaskMatch) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
    });
    return true;
  }

  // Active task list line: "- [ ] Something"
  const taskMatch = text.match(/^(\s*[-*+]\s\[[ xX]\]\s)(.*)/);
  if (taskMatch) {
    const indent = text.match(/^\s*/)?.[0] || "";
    const insertText = `\n${indent}- [ ] `;
    view.dispatch({
      changes: { from: selection.main.from, to: selection.main.to, insert: insertText },
      selection: { anchor: selection.main.from + insertText.length },
    });
    return true;
  }

  // Empty bullet list line: just "- " or "* "
  const emptyBulletMatch = text.match(/^(\s*[-*+]\s*)$/);
  if (emptyBulletMatch) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
    });
    return true;
  }

  // Active bullet list line: "- something"
  const bulletMatch = text.match(/^(\s*)([-*+]\s)(.*)/);
  if (bulletMatch) {
    const indent = bulletMatch[1];
    const marker = bulletMatch[2];
    const insertText = `\n${indent}${marker}`;
    view.dispatch({
      changes: { from: selection.main.from, to: selection.main.to, insert: insertText },
      selection: { anchor: selection.main.from + insertText.length },
    });
    return true;
  }

  // Empty numbered list line: just "1. "
  const emptyNumberMatch = text.match(/^(\s*\d+[.)]\s*)$/);
  if (emptyNumberMatch) {
    view.dispatch({
      changes: { from: line.from, to: line.to, insert: "" },
      selection: { anchor: line.from },
    });
    return true;
  }

  // Active numbered list line: "1. something"
  const numberMatch = text.match(/^(\s*)(\d+)([.)]\s)(.*)/);
  if (numberMatch) {
    const indent = numberMatch[1];
    const nextNum = parseInt(numberMatch[2], 10) + 1;
    const delimiter = numberMatch[3];
    const insertText = `\n${indent}${nextNum}${delimiter}`;
    view.dispatch({
      changes: { from: selection.main.from, to: selection.main.to, insert: insertText },
      selection: { anchor: selection.main.from + insertText.length },
    });
    return true;
  }

  return false;
}

/**
 * Handle Tab key: Indent list item or insert 2 spaces
 */
function handleSmartTab(view: EditorView): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const text = line.text;

  // If on a list line, indent the list marker
  if (text.match(/^\s*([-*+]|\d+[.)])\s/)) {
    view.dispatch({
      changes: { from: line.from, to: line.from, insert: "  " },
      selection: { anchor: state.selection.main.head + 2 },
    });
    return true;
  }

  // Default: insert 2 spaces
  view.dispatch(view.state.replaceSelection("  "));
  return true;
}

/**
 * Handle Shift-Tab: Unindent list item
 */
function handleSmartShiftTab(view: EditorView): boolean {
  const { state } = view;
  const line = state.doc.lineAt(state.selection.main.head);
  const text = line.text;

  if (text.startsWith("  ")) {
    view.dispatch({
      changes: { from: line.from, to: line.from + 2, insert: "" },
      selection: { anchor: Math.max(line.from, state.selection.main.head - 2) },
    });
    return true;
  } else if (text.startsWith(" ")) {
    view.dispatch({
      changes: { from: line.from, to: line.from + 1, insert: "" },
      selection: { anchor: Math.max(line.from, state.selection.main.head - 1) },
    });
    return true;
  }

  return false;
}

export const smartMarkdownKeymap: KeyBinding[] = [
  {
    key: "Enter",
    run: handleSmartEnter,
  },
  {
    key: "Tab",
    run: handleSmartTab,
  },
  {
    key: "Shift-Tab",
    run: handleSmartShiftTab,
  },
];
