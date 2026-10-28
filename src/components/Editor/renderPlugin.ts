import {
  EditorView,
  ViewPlugin,
  Decoration,
  DecorationSet,
  type ViewUpdate,
  WidgetType,
} from "@codemirror/view";
import { Facet, StateEffect, StateField, type EditorState } from "@codemirror/state";
import katex from "katex";
import mermaid from "mermaid";
import { findBlocks, isInsideBlock, overlapsBlock, type BlockInfo } from "../../editor/blocks";

/** Dispatch this to force widgets (notably Mermaid) to re-render. */
export const themeRefresh = StateEffect.define<null>();

/**
 * Read-only preview mode hides all syntax and never reveals source under the
 * cursor. It is provided by the preview mode extension.
 */
export const previewMode = Facet.define<boolean, boolean>({
  combine: (values) => values.some(Boolean),
});

function themeKey(): string {
  const root = document.documentElement;
  return `${root.dataset.theme ?? "inkwell-dark"}:${root.dataset.scheme ?? "dark"}`;
}

function isDarkTheme(): boolean {
  return document.documentElement.dataset.scheme !== "light";
}

// Initialize mermaid once; the theme is re-applied per render below.
try {
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
  });
} catch {
  // ignore
}

// ── Interactive Widgets ──────────────────────────────────────────────────────────

/**
 * Clickable task list checkbox that dispatches updates directly to CodeMirror doc.
 */
class CheckboxWidget extends WidgetType {
  constructor(
    private checked: boolean,
    private charPos: number,
    private readOnly = false,
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const el = document.createElement("input");
    el.type = "checkbox";
    el.checked = this.checked;
    el.className = "cm-task-checkbox";
    el.style.cssText =
      "accent-color:var(--color-accent);margin-right:6px;vertical-align:middle;width:15px;height:15px;";

    el.addEventListener("mousedown", (e) => {
      e.stopPropagation();
    });

    if (this.readOnly) {
      el.disabled = true;
      el.style.cursor = "default";
      el.setAttribute("aria-label", this.checked ? "Completed task" : "Incomplete task");
    } else {
      el.style.cursor = "pointer";
      el.addEventListener("change", (e) => {
        e.stopPropagation();
        e.preventDefault();
        const newChar = el.checked ? "x" : " ";
        try {
          view.dispatch({
            changes: { from: this.charPos, to: this.charPos + 1, insert: newChar },
          });
        } catch {
          // ignore if pos shifted
        }
      });
    }

    return el;
  }

  eq(other: CheckboxWidget) {
    return (
      this.checked === other.checked &&
      this.charPos === other.charPos &&
      this.readOnly === other.readOnly
    );
  }

  ignoreEvent() {
    return false;
  }
}

/**
 * Divider line widget.
 */
class HorizontalRuleWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    hr.className = "cm-hr-widget";
    hr.style.cssText =
      "border:none;border-top:1.5px solid var(--color-line);margin:1.8em 0;opacity:0.75;cursor:default;";
    return hr;
  }
  eq() {
    return true;
  }
}

/**
 * Inline image widget that renders real image thumbnail with fallback.
 */
class ImageWidget extends WidgetType {
  constructor(
    private alt: string,
    private src: string,
    private from: number,
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const wrap = document.createElement("span");
    wrap.className = "cm-rendered-image-wrap";
    wrap.style.cssText =
      "display:inline-flex;flex-direction:column;align-items:flex-start;margin:0.5em 0;max-width:100%;cursor:pointer;";

    const img = document.createElement("img");
    img.src = this.src;
    img.alt = this.alt;
    img.style.cssText =
      "max-width:100%;max-height:480px;border-radius:8px;border:1px solid var(--color-line);object-fit:contain;background:var(--color-surface);";

    img.onerror = () => {
      img.style.display = "none";
      const errorChip = document.createElement("span");
      errorChip.className = "cm-inline-image-error";
      errorChip.style.cssText =
        "display:inline-flex;align-items:center;gap:6px;background:var(--color-sunken);border:1px dashed var(--color-line);border-radius:6px;padding:4px 10px;font-size:0.85em;color:var(--color-ink-muted);";
      errorChip.textContent = `🖼 [Image: ${this.alt || this.src}]`;
      wrap.appendChild(errorChip);
    };

    wrap.appendChild(img);

    if (this.alt) {
      const caption = document.createElement("span");
      caption.style.cssText =
        "font-size:0.8em;color:var(--color-ink-muted);margin-top:4px;font-style:italic;";
      caption.textContent = this.alt;
      wrap.appendChild(caption);
    }

    // Click on image puts cursor right at markdown source
    wrap.addEventListener("click", () => {
      view.dispatch({
        selection: { anchor: this.from },
      });
      view.focus();
    });

    return wrap;
  }

  eq(other: ImageWidget) {
    return this.alt === other.alt && this.src === other.src && this.from === other.from;
  }
}

/**
 * Standalone KaTeX display math widget.
 */
class MathBlockWidget extends WidgetType {
  constructor(
    private tex: string,
    private from: number,
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const div = document.createElement("div");
    div.className = "cm-math-block";
    div.title = "Click to edit LaTeX equation";
    div.style.cssText =
      "padding:1em 1.25em;margin:0.75em 0;background:var(--color-sunken);border:1px solid var(--color-line);border-radius:8px;overflow-x:auto;cursor:pointer;text-align:center;transition:border-color 0.15s ease;";

    div.addEventListener("mouseenter", () => {
      div.style.borderColor = "var(--color-accent)";
    });
    div.addEventListener("mouseleave", () => {
      div.style.borderColor = "var(--color-line)";
    });

    div.addEventListener("click", () => {
      view.dispatch({
        selection: { anchor: this.from + 3 },
      });
      view.focus();
    });

    try {
      katex.render(this.tex, div, { displayMode: true, throwOnError: false });
    } catch {
      div.textContent = this.tex;
    }

    return div;
  }

  eq(other: MathBlockWidget) {
    return this.tex === other.tex;
  }
}

/**
 * Inline KaTeX math widget ($...$).
 */
class MathInlineWidget extends WidgetType {
  constructor(
    private tex: string,
    private from: number,
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const span = document.createElement("span");
    span.className = "cm-math-inline";
    span.title = "Click to edit math formula";
    span.style.cssText =
      "padding:0 3px;color:var(--color-accent);cursor:pointer;display:inline-block;";

    span.addEventListener("click", () => {
      view.dispatch({
        selection: { anchor: this.from + 1 },
      });
      view.focus();
    });

    try {
      katex.render(this.tex, span, { displayMode: false, throwOnError: false });
    } catch {
      span.textContent = `$${this.tex}$`;
    }

    return span;
  }

  eq(other: MathInlineWidget) {
    return this.tex === other.tex;
  }
}

/**
 * Inline Mermaid Diagram Widget.
 */
let mermaidCounter = 0;

class MermaidWidget extends WidgetType {
  private id: string;

  constructor(
    private code: string,
    private from: number,
    private theme: string,
    private dark: boolean,
  ) {
    super();
    this.id = `mermaid-${++mermaidCounter}`;
  }

  toDOM(view: EditorView) {
    const container = document.createElement("div");
    container.className = "mermaid-container";
    container.id = this.id;
    container.style.cssText =
      "background:var(--color-sunken);border:1px solid var(--color-line);border-radius:10px;padding:1.25rem;margin:1em 0;text-align:center;position:relative;overflow-x:auto;";

    // Header actions
    const toolbar = document.createElement("div");
    toolbar.style.cssText =
      "position:absolute;top:8px;right:10px;display:flex;gap:6px;opacity:0.6;transition:opacity 0.15s ease;";
    container.addEventListener("mouseenter", () => (toolbar.style.opacity = "1"));
    container.addEventListener("mouseleave", () => (toolbar.style.opacity = "0.6"));

    const editBtn = document.createElement("button");
    editBtn.textContent = "✎ Edit";
    editBtn.style.cssText =
      "font-size:11px;padding:2px 8px;border-radius:4px;border:1px solid var(--color-line);background:var(--color-surface);color:var(--color-ink-soft);cursor:pointer;";
    editBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      view.dispatch({ selection: { anchor: this.from + 10 } });
      view.focus();
    });
    toolbar.appendChild(editBtn);
    container.appendChild(toolbar);

    const chartArea = document.createElement("div");
    chartArea.textContent = "Rendering diagram...";
    container.appendChild(chartArea);

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: this.dark ? "dark" : "neutral",
        securityLevel: "loose",
      });
    } catch {
      // ignore initialization failures and keep the previous theme
    }

    mermaid
      .render(this.id + "-svg", this.code)
      .then(({ svg }) => {
        if (!container.isConnected) return;
        chartArea.innerHTML = svg;
      })
      .catch((err: Error) => {
        if (!container.isConnected) return;
        chartArea.innerHTML = `<div class="mermaid-error">Diagram error: ${err.message}</div>`;
      });

    return container;
  }

  eq(other: MermaidWidget) {
    return this.code === other.code && this.theme === other.theme;
  }
}

/**
 * GFM Table Render Widget.
 */
class TableWidget extends WidgetType {
  constructor(
    private rawMarkdown: string,
    private from: number,
  ) {
    super();
  }

  toDOM(view: EditorView) {
    const wrapper = document.createElement("div");
    wrapper.className = "cm-table-widget-wrap";
    wrapper.title = "Click to edit table";
    wrapper.style.cssText =
      "margin:1em 0;overflow-x:auto;border-radius:8px;border:1px solid var(--color-line);cursor:pointer;";

    const table = document.createElement("table");
    table.style.cssText =
      "width:100%;border-collapse:collapse;font-size:0.92em;text-align:left;";

    const lines = this.rawMarkdown.trim().split("\n");
    if (lines.length >= 2) {
      // Parse header
      const headerRow = lines[0].replace(/^\||\|$/g, "").split("|");
      const alignments = lines[1].replace(/^\||\|$/g, "").split("|").map((col) => {
        const c = col.trim();
        if (c.startsWith(":") && c.endsWith(":")) return "center";
        if (c.endsWith(":")) return "right";
        return "left";
      });

      const thead = document.createElement("thead");
      const trHead = document.createElement("tr");
      trHead.style.background = "var(--color-sunken)";
      headerRow.forEach((cell, i) => {
        const th = document.createElement("th");
        th.style.cssText = `padding:8px 14px;border-bottom:2px solid var(--color-line);font-weight:600;color:var(--color-ink);text-align:${alignments[i] || "left"};`;
        th.textContent = cell.trim();
        trHead.appendChild(th);
      });
      thead.appendChild(trHead);
      table.appendChild(thead);

      // Parse body
      const tbody = document.createElement("tbody");
      for (let r = 2; r < lines.length; r++) {
        const rowCells = lines[r].replace(/^\||\|$/g, "").split("|");
        const tr = document.createElement("tr");
        tr.style.borderBottom = "1px solid var(--color-line)";
        if (r % 2 === 1) tr.style.background = "var(--color-hover)";
        rowCells.forEach((cell, i) => {
          const td = document.createElement("td");
          td.style.cssText = `padding:8px 14px;color:var(--color-ink-soft);text-align:${alignments[i] || "left"};`;
          td.textContent = cell.trim();
          tr.appendChild(td);
        });
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
    }

    wrapper.appendChild(table);

    wrapper.addEventListener("click", () => {
      view.dispatch({ selection: { anchor: this.from } });
      view.focus();
    });

    return wrapper;
  }

  eq(other: TableWidget) {
    return this.rawMarkdown === other.rawMarkdown;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function pushDeco(
  arr: { from: number; to: number; deco: Decoration }[],
  from: number,
  to: number,
  deco: Decoration,
) {
  if (from < to) arr.push({ from, to, deco });
}

// Checks if cursor/selection intersects with a range [from, to]
function cursorIntersects(selectionFrom: number, selectionTo: number, targetFrom: number, targetTo: number): boolean {
  return selectionTo >= targetFrom && selectionFrom <= targetTo;
}

// Blocks only change when the document does, so cache them across selections.
let blockCache: { doc: string; blocks: BlockInfo[] } = { doc: "", blocks: [] };

function getBlocks(doc: string): BlockInfo[] {
  if (doc !== blockCache.doc) {
    blockCache = { doc, blocks: findBlocks(doc) };
  }
  return blockCache.blocks;
}

/**
 * Multi-line replacements must come from a state field, not a view plugin.
 * This field renders tables, math and Mermaid diagrams and reveals the raw
 * source while the cursor is inside the block.
 */
const blockWidgetField = StateField.define<DecorationSet>({
  create(state) {
    return buildBlockDecorations(state);
  },
  update(decorations, transaction) {
    const themeChanged = transaction.effects.some((effect) => effect.is(themeRefresh));
    if (transaction.docChanged || transaction.selection || themeChanged) {
      return buildBlockDecorations(transaction.state);
    }
    return decorations.map(transaction.changes);
  },
  provide: (field) => EditorView.decorations.from(field),
});

function buildBlockDecorations(state: EditorState): DecorationSet {
  const doc = state.doc.toString();
  const blocks = getBlocks(doc);
  const sel = state.selection.main;
  const preview = state.facet(previewMode);
  const decoList: { from: number; to: number; deco: Decoration }[] = [];
  const key = themeKey();
  const dark = isDarkTheme();

  for (const block of blocks) {
    if (!preview && cursorIntersects(sel.from, sel.to, block.from, block.to)) continue;

    if (block.type === "math") {
      pushDeco(
        decoList,
        block.from,
        block.to,
        Decoration.replace({ widget: new MathBlockWidget(block.lang || "", block.from) }),
      );
    } else if (block.type === "mermaid") {
      pushDeco(
        decoList,
        block.from,
        block.to,
        Decoration.replace({ widget: new MermaidWidget(block.lang || "", block.from, key, dark) }),
      );
    } else if (block.type === "table") {
      pushDeco(
        decoList,
        block.from,
        block.to,
        Decoration.replace({ widget: new TableWidget(block.raw || "", block.from) }),
      );
    }
  }

  return Decoration.set(
    decoList.map((d) => d.deco.range(d.from, d.to)),
    true,
  );
}

// ── Build decorations ────────────────────────────────────────────────

export function buildDecorations(view: EditorView): DecorationSet {
  const decoList: { from: number; to: number; deco: Decoration }[] = [];
  const doc = view.state.doc.toString();
  const sel = view.state.selection.main;
  const cursorLine = view.state.doc.lineAt(sel.head);
  const preview = view.state.facet(previewMode);

  const blocks = getBlocks(doc);

  // ── Block-level line styling (code blocks only) ──
  // Decorate each content line instead of marking the whole range: a mark
  // split across lines paints a separate box per line, which looks like a
  // stack of cards. Line decorations share one continuous panel.
  for (const block of blocks) {
    if (block.type !== "code") continue;

    const contentFrom = block.contentFrom ?? block.from;
    const contentTo = block.contentTo ?? block.to;
    const fenceLine = view.state.doc.lineAt(block.from);
    const closingLine = block.closed
      ? view.state.doc.lineAt(Math.max(block.from, block.to - 1))
      : null;

    let firstContentLine: { number: number; from: number } | null = null;
    let lastContentLine: { number: number; from: number } | null = null;

    if (contentTo > contentFrom) {
      firstContentLine = view.state.doc.lineAt(contentFrom);
      lastContentLine = view.state.doc.lineAt(contentTo - 1);
    } else {
      // An empty block can still have one blank line between its fences.
      const candidate = view.state.doc.lineAt(contentFrom);
      if (
        candidate.number > fenceLine.number &&
        (!closingLine || candidate.number < closingLine.number)
      ) {
        firstContentLine = candidate;
        lastContentLine = candidate;
      }
    }

    if (firstContentLine && lastContentLine) {
      for (let n = firstContentLine.number; n <= lastContentLine.number; n++) {
        const line = view.state.doc.line(n);
        const classes = ["cm-code-block"];
        if (n === firstContentLine.number) classes.push("cm-code-block-first");
        if (n === lastContentLine.number) classes.push("cm-code-block-last");
        decoList.push({
          from: line.from,
          to: line.from,
          deco: Decoration.line({ attributes: { class: classes.join(" ") } }),
        });
      }
    }

    // A block with no content line at all (opening fence immediately followed
    // by the closing fence) has nothing to click or show, so keep its fences.
    if (!firstContentLine) continue;

    // Hide the fences like the rest of the rendered Markdown. They come back
    // as soon as the cursor/selection reaches the fence line itself, so the
    // block stays editable without showing "```lang" above every example.
    const fenceLines = [fenceLine];
    if (closingLine && closingLine.number !== fenceLine.number) {
      fenceLines.push(closingLine);
    }

    for (const line of fenceLines) {
      const showFence = !preview && cursorIntersects(sel.from, sel.to, line.from, line.to);
      if (showFence) continue;

      pushDeco(decoList, line.from, line.to, Decoration.replace({}));
      decoList.push({
        from: line.from,
        to: line.from,
        deco: Decoration.line({ attributes: { class: "cm-code-fence-hidden" } }),
      });
    }
  }

  // ── Line-level decorations (Headings, Quotes, Lists, HR) ──
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;
      const isCurrentLine = cursorLine.number === line.number;

      if (isInsideBlock(blocks, line.from)) {
        pos = line.to + 1;
        continue;
      }

      // Headings: # ... ######
      const hMatch = text.match(/^(#{1,6})\s/);
      if (hMatch) {
        const level = hMatch[1].length;
        decoList.push({
          from: line.from,
          to: line.from,
          deco: Decoration.line({ attributes: { class: `cm-header-${level}` } }),
        });

        // Conceal '#' markers unless the cursor is editing this line.
        if (preview || !isCurrentLine) {
          pushDeco(decoList, line.from, line.from + level + 1, Decoration.replace({}));
        }
      }

      // Blockquote: > text
      const quoteMatch = text.match(/^>\s?/);
      if (quoteMatch) {
        decoList.push({
          from: line.from,
          to: line.from,
          deco: Decoration.line({ attributes: { class: "cm-quote" } }),
        });
        if (preview || !isCurrentLine) {
          pushDeco(decoList, line.from, line.from + quoteMatch[0].length, Decoration.replace({}));
        }
      }

      // Task list: - [ ] or - [x]
      const taskMatch = text.match(/^(\s*[-*+]\s)\[([ xX])\]\s/);
      if (taskMatch) {
        const markerEnd = line.from + taskMatch[1].length;
        const checkStart = markerEnd;
        const checkEnd = checkStart + 3; // "[ ]" or "[x]"
        const checked = taskMatch[2].toLowerCase() === "x";
        const charPos = checkStart + 1; // position of ' ' or 'x'

        // Hide the list bullet that precedes the checkbox.
        if (preview || !isCurrentLine) {
          pushDeco(decoList, line.from, line.from + taskMatch[1].length, Decoration.replace({}));
        }

        // Checkbox widget is always rendered for fast toggling
        pushDeco(
          decoList,
          checkStart,
          checkEnd + 1,
          Decoration.replace({
            widget: new CheckboxWidget(checked, charPos, preview),
          }),
        );
      } else {
        // Bullet list marker (- / * / +)
        const bulletMatch = text.match(/^(\s*)([-*+])\s/);
        if (bulletMatch && (preview || !isCurrentLine)) {
          pushDeco(decoList, line.from, line.from + bulletMatch[0].length, Decoration.replace({}));
        }

        // Ordered list marker (1. / 2.)
        const olMatch = text.match(/^(\s*)(\d+[.)])\s/);
        if (olMatch && (preview || !isCurrentLine)) {
          pushDeco(decoList, line.from, line.from + olMatch[0].length, Decoration.replace({}));
        }
      }

      // Horizontal rule: --- or *** or ___
      if (text.match(/^(\s*)([-*_])\2{2,}\s*$/)) {
        if (preview || !isCurrentLine) {
          pushDeco(
            decoList,
            line.from,
            line.to,
            Decoration.replace({
              widget: new HorizontalRuleWidget(),
            }),
          );
        }
      }

      pos = line.to + 1;
    }
  }

  // ── Inline decorations (Bold, Italic, Strikethrough, Code, Highlight, Link, Image, Inline Math) ──
  // Images: ![alt](src)
  for (const m of doc.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(
          decoList,
          matchFrom,
          matchTo,
          Decoration.replace({
            widget: new ImageWidget(m[1], m[2], matchFrom),
          }),
        );
      }
    }
  }

  // Links: [text](url)
  for (const m of doc.matchAll(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const linkStart = m.index;
      const textStart = linkStart + 1;
      const textEnd = textStart + m[1].length;
      const linkEnd = linkStart + m[0].length;

      if (preview || !cursorIntersects(sel.from, sel.to, linkStart, linkEnd)) {
        pushDeco(decoList, linkStart, textStart, Decoration.replace({}));
        pushDeco(decoList, textStart, textEnd, Decoration.mark({ class: "cm-link-text" }));
        pushDeco(decoList, textEnd, linkEnd, Decoration.replace({}));
      }
    }
  }

  // Highlight: ==text==
  for (const m of doc.matchAll(/==(.+?)==/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(decoList, matchFrom, matchFrom + 2, Decoration.replace({}));
        pushDeco(decoList, matchFrom + 2, matchTo - 2, Decoration.mark({ class: "cm-highlight" }));
        pushDeco(decoList, matchTo - 2, matchTo, Decoration.replace({}));
      }
    }
  }

  // Bold: **text** or __text__
  for (const m of doc.matchAll(/(\*\*|__)(.+?)\1/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(decoList, matchFrom, matchFrom + 2, Decoration.replace({}));
        pushDeco(decoList, matchFrom + 2, matchTo - 2, Decoration.mark({ class: "cm-strong" }));
        pushDeco(decoList, matchTo - 2, matchTo, Decoration.replace({}));
      }
    }
  }

  // Italic: *text* or _text_
  for (const m of doc.matchAll(/(?<!\*|_)(\*|_)(?!\*|_)(.+?)(?<!\*|_)\1(?!\*|_)/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(decoList, matchFrom, matchFrom + 1, Decoration.replace({}));
        pushDeco(decoList, matchFrom + 1, matchTo - 1, Decoration.mark({ class: "cm-emphasis" }));
        pushDeco(decoList, matchTo - 1, matchTo, Decoration.replace({}));
      }
    }
  }

  // Strikethrough: ~~text~~
  for (const m of doc.matchAll(/~~(.+?)~~/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(decoList, matchFrom, matchFrom + 2, Decoration.replace({}));
        pushDeco(decoList, matchFrom + 2, matchTo - 2, Decoration.mark({ class: "cm-strikethrough" }));
        pushDeco(decoList, matchTo - 2, matchTo, Decoration.replace({}));
      }
    }
  }

  // Inline code: `text` (never across a line break, so a stray backtick
  // cannot swallow the fence of the next block)
  for (const m of doc.matchAll(/(?<!\\)`([^`\n]+)`/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(decoList, matchFrom, matchFrom + 1, Decoration.replace({}));
        pushDeco(decoList, matchFrom + 1, matchTo - 1, Decoration.mark({ class: "cm-inline-code" }));
        pushDeco(decoList, matchTo - 1, matchTo, Decoration.replace({}));
      }
    }
  }

  // Inline math: $...$
  for (const m of doc.matchAll(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(
          decoList,
          matchFrom,
          matchTo,
          Decoration.replace({
            widget: new MathInlineWidget(m[1], matchFrom),
          }),
        );
      }
    }
  }

  // Footnote references: [^1]
  for (const m of doc.matchAll(/\[\^([^\]]+)\]/g)) {
    if (m.index !== undefined && !overlapsBlock(blocks, m.index, m.index + m[0].length)) {
      const matchFrom = m.index;
      const matchTo = matchFrom + m[0].length;
      if (preview || !cursorIntersects(sel.from, sel.to, matchFrom, matchTo)) {
        pushDeco(decoList, matchFrom, matchTo, Decoration.mark({ class: "cm-footnote-ref" }));
      }
    }
  }

  // Sort by start position
  decoList.sort((a, b) => a.from - b.from || b.to - a.to);

  return Decoration.set(
    decoList.map((d) => d.deco.range(d.from, d.to)),
    true,
  );
}

// ── Plugin export ────────────────────────────────────────────────────

export function markdownRenderPlugin() {
  return [
    blockWidgetField,
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        constructor(view: EditorView) {
          this.decorations = buildDecorations(view);
        }
        update(update: ViewUpdate) {
          const themeChanged = update.transactions.some((tr) =>
            tr.effects.some((effect) => effect.is(themeRefresh)),
          );
          if (themeChanged || update.docChanged || update.selectionSet || update.viewportChanged) {
            this.decorations = buildDecorations(update.view);
          }
        }
      },
      { decorations: (v) => v.decorations },
    ),
  ];
}
