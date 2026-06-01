import { ViewPlugin, Decoration, DecorationSet, ViewUpdate, WidgetType } from "@codemirror/view";
import type { EditorView } from "@codemirror/view";

// ── Widgets ──────────────────────────────────────────────────────────

class CheckboxWidget extends WidgetType {
  constructor(private checked: boolean) { super(); }
  toDOM() {
    const el = document.createElement("input");
    el.type = "checkbox";
    el.checked = this.checked;
    el.className = "cm-task-checkbox";
    el.style.cssText = "accent-color:var(--color-accent);cursor:pointer;margin-right:4px;vertical-align:middle;";
    return el;
  }
  eq(other: CheckboxWidget) { return this.checked === other.checked; }
}

class HorizontalRuleWidget extends WidgetType {
  toDOM() {
    const hr = document.createElement("hr");
    hr.style.cssText = "border:none;border-top:1px solid var(--color-border);margin:1.5em 0;opacity:0.5;";
    return hr;
  }
  eq() { return true; }
}

class ImageWidget extends WidgetType {
  constructor(private alt: string, private src: string) { super(); }
  toDOM() {
    const wrap = document.createElement("span");
    wrap.className = "cm-inline-image";
    wrap.style.cssText = "display:inline-flex;align-items:center;gap:4px;background:var(--color-bg-tertiary);border:1px solid var(--color-border);border-radius:4px;padding:2px 6px;font-size:0.85em;color:var(--color-text-secondary);";
    wrap.textContent = `🖼 ${this.alt || this.src.split("/").pop() || "image"}`;
    return wrap;
  }
  eq(other: ImageWidget) { return this.alt === other.alt && this.src === other.src; }
}

// ── Helpers ──────────────────────────────────────────────────────────

function pushDeco(arr: { from: number; to: number; deco: Decoration }[], from: number, to: number, deco: Decoration) {
  if (from < to) arr.push({ from, to, deco });
}

// ── Block-level scanning ─────────────────────────────────────────────

interface BlockInfo {
  type: "code" | "math" | "mermaid";
  from: number;
  to: number;
  lang?: string;
}

function findBlocks(doc: string): BlockInfo[] {
  const blocks: BlockInfo[] = [];
  const lines = doc.split("\n");
  let offset = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks: ```
    const fenceMatch = line.match(/^```(\w*)/);
    if (fenceMatch) {
      const lang = fenceMatch[1] || "";
      const from = offset;
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("```")) j++;
      const to = j < lines.length ? offset + line.length + 1 + lines.slice(i + 1, j + 1).join("\n").length : doc.length;
      const inner = lines.slice(i + 1, j).join("\n");

      if (lang === "mermaid") {
        blocks.push({ type: "mermaid", from, to, lang: inner });
      } else {
        blocks.push({ type: "code", from, to, lang });
      }
      i = j < lines.length ? j + 1 : lines.length;
      offset = to;
      continue;
    }

    // Math blocks: $$
    if (line.trim() === "$$") {
      const from = offset;
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "$$") j++;
      const to = j < lines.length ? offset + line.length + 1 + lines.slice(i + 1, j + 1).join("\n").length : doc.length;
      blocks.push({ type: "math", from, to, lang: lines.slice(i + 1, j).join("\n") });
      i = j < lines.length ? j + 1 : lines.length;
      offset = to;
      continue;
    }

    offset += line.length + 1;
    i++;
  }

  return blocks;
}

function isInsideBlock(blocks: BlockInfo[], pos: number): boolean {
  return blocks.some((b) => pos >= b.from && pos < b.to);
}

// ── Build decorations ────────────────────────────────────────────────

function buildDecorations(view: EditorView): DecorationSet {
  const decoList: { from: number; to: number; deco: Decoration }[] = [];
  const doc = view.state.doc.toString();
  const blocks = findBlocks(doc);

  // ── Block-level decorations ──
  for (const block of blocks) {
    if (block.type === "code") {
      const firstLine = view.state.doc.lineAt(block.from);
      const lastLine = view.state.doc.lineAt(block.to - 1);
      // Hide opening fence
      pushDeco(decoList, firstLine.from, firstLine.to + 1,
        Decoration.replace({}));
      // Hide closing fence
      if (lastLine.from !== firstLine.from) {
        pushDeco(decoList, lastLine.from, lastLine.to,
          Decoration.replace({}));
      }
      // Mark code block content
      if (firstLine.to + 1 < lastLine.from) {
        pushDeco(decoList, firstLine.to + 1, lastLine.from,
          Decoration.mark({ class: "cm-code-block" }));
      }
    } else if (block.type === "math") {
      const firstLine = view.state.doc.lineAt(block.from);
      const lastLine = view.state.doc.lineAt(block.to - 1);
      // Hide fences, replace content with widget
      pushDeco(decoList, firstLine.from, lastLine.to,
        Decoration.replace({
          widget: new MathBlockWidget(block.lang || ""),
        }));
    } else if (block.type === "mermaid") {
      const firstLine = view.state.doc.lineAt(block.from);
      const lastLine = view.state.doc.lineAt(block.to - 1);
      pushDeco(decoList, firstLine.from, lastLine.to,
        Decoration.replace({
          widget: new MermaidWidget(block.lang || ""),
        }));
    }
  }

  // ── Line-level decorations ──
  for (const { from, to } of view.visibleRanges) {
    for (let pos = from; pos <= to; ) {
      const line = view.state.doc.lineAt(pos);
      const text = line.text;

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
        // Hide the # markers
        pushDeco(decoList, line.from, line.from + level + 1,
          Decoration.replace({}));
      }

      // Blockquote: > text
      if (text.match(/^>\s?/)) {
        decoList.push({
          from: line.from,
          to: line.from,
          deco: Decoration.line({ attributes: { class: "cm-quote" } }),
        });
        pushDeco(decoList, line.from, line.from + text.match(/^>\s?/)![0].length,
          Decoration.replace({}));
      }

      // Task list: - [ ] or - [x]
      const taskMatch = text.match(/^(\s*[-*+]\s)\[([ xX])\]\s/);
      if (taskMatch) {
        const markerEnd = line.from + taskMatch[1].length;
        const checkStart = markerEnd;
        const checkEnd = checkStart + 3; // [x] or [ ]
        const checked = taskMatch[2] !== " ";
        pushDeco(decoList, markerEnd, checkEnd + 1,
          Decoration.replace({
            widget: new CheckboxWidget(checked),
          }));
      }

      // Unordered list marker: - / * / +
      else if (text.match(/^(\s*)([-*+])\s/)) {
        const m = text.match(/^(\s*)([-*+])\s/)!;
        pushDeco(decoList, line.from, line.from + m[0].length,
          Decoration.replace({}));
      }

      // Ordered list marker: 1. / 2) etc
      const olMatch = text.match(/^(\s*)(\d+[.)])\s/);
      if (olMatch && !taskMatch) {
        pushDeco(decoList, line.from, line.from + olMatch[0].length,
          Decoration.replace({}));
      }

      // Horizontal rule: --- or *** or ___
      if (text.match(/^(\s*)([-*_])\2{2,}\s*$/)) {
        pushDeco(decoList, line.from, line.to,
          Decoration.replace({
            widget: new HorizontalRuleWidget(),
          }));
      }

      pos = line.to + 1;
    }
  }

  // ── Inline decorations ──
  // Images: ![alt](src)
  for (const m of doc.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
    if (m.index !== undefined && !isInsideBlock(blocks, m.index)) {
      pushDeco(decoList, m.index, m.index + m[0].length,
        Decoration.replace({
          widget: new ImageWidget(m[1], m[2]),
        }));
    }
  }

  // Links: [text](url) — hide syntax, show text with link class
  for (const m of doc.matchAll(/(?<!!)\[([^\]]+)\]\(([^)]+)\)/g)) {
    if (m.index !== undefined && !isInsideBlock(blocks, m.index)) {
      const linkStart = m.index;
      const textStart = linkStart + 1;
      const textEnd = textStart + m[1].length;
      const linkEnd = linkStart + m[0].length;
      // Hide opening [
      pushDeco(decoList, linkStart, textStart, Decoration.replace({}));
      // Mark text as link
      pushDeco(decoList, textStart, textEnd, Decoration.mark({ class: "cm-link-text" }));
      // Hide ](url)
      pushDeco(decoList, textEnd, linkEnd, Decoration.replace({}));
    }
  }

  // Bold: **text** or __text__
  for (const m of doc.matchAll(/(\*\*|__)(.+?)\1/g)) {
    if (m.index !== undefined && !isInsideBlock(blocks, m.index)) {
      const openEnd = m.index + 2;
      const closeStart = m.index + m[0].length - 2;
      // Hide opening **
      pushDeco(decoList, m.index, openEnd, Decoration.replace({}));
      // Mark text bold
      pushDeco(decoList, openEnd, closeStart, Decoration.mark({ class: "cm-strong" }));
      // Hide closing **
      pushDeco(decoList, closeStart, m.index + m[0].length, Decoration.replace({}));
    }
  }

  // Italic: *text* or _text_ (not inside bold)
  for (const m of doc.matchAll(/(?<!\*|_)(\*|_)(?!\*|_)(.+?)(?<!\*|_)\1(?!\*|_)/g)) {
    if (m.index !== undefined && !isInsideBlock(blocks, m.index)) {
      const openEnd = m.index + 1;
      const closeStart = m.index + m[0].length - 1;
      pushDeco(decoList, m.index, openEnd, Decoration.replace({}));
      pushDeco(decoList, openEnd, closeStart, Decoration.mark({ class: "cm-emphasis" }));
      pushDeco(decoList, closeStart, m.index + m[0].length, Decoration.replace({}));
    }
  }

  // Strikethrough: ~~text~~
  for (const m of doc.matchAll(/~~(.+?)~~/g)) {
    if (m.index !== undefined && !isInsideBlock(blocks, m.index)) {
      const openEnd = m.index + 2;
      const closeStart = m.index + m[0].length - 2;
      pushDeco(decoList, m.index, openEnd, Decoration.replace({}));
      pushDeco(decoList, openEnd, closeStart, Decoration.mark({ class: "cm-strikethrough" }));
      pushDeco(decoList, closeStart, m.index + m[0].length, Decoration.replace({}));
    }
  }

  // Inline code: `text`
  for (const m of doc.matchAll(/`([^`]+)`/g)) {
    if (m.index !== undefined && !isInsideBlock(blocks, m.index)) {
      const openEnd = m.index + 1;
      const closeStart = m.index + m[0].length - 1;
      pushDeco(decoList, m.index, openEnd, Decoration.replace({}));
      pushDeco(decoList, openEnd, closeStart, Decoration.mark({ class: "cm-inline-code" }));
      pushDeco(decoList, closeStart, m.index + m[0].length, Decoration.replace({}));
    }
  }

  // Inline math: $...$  (not $$)
  for (const m of doc.matchAll(/(?<!\$)\$(?!\$)(.+?)(?<!\$)\$(?!\$)/g)) {
    if (m.index !== undefined && !isInsideBlock(blocks, m.index)) {
      pushDeco(decoList, m.index, m.index + m[0].length,
        Decoration.replace({
          widget: new MathInlineWidget(m[1]),
        }));
    }
  }

  // Sort by position (from ascending, then to descending for proper nesting)
  decoList.sort((a, b) => a.from - b.from || b.to - a.to);

  return Decoration.set(
    decoList.map((d) => d.deco.range(d.from, d.to)),
  );
}

// ── Math block widget ────────────────────────────────────────────────

let katexLoaded = false;
let katexModule: typeof import("katex") | null = null;

async function loadKatex() {
  if (katexLoaded) return katexModule;
  try {
    katexModule = await import("katex");
    await import("katex/dist/katex.min.css");
    katexLoaded = true;
    return katexModule;
  } catch {
    return null;
  }
}

class MathBlockWidget extends WidgetType {
  private rendered = false;
  constructor(private tex: string) { super(); }
  toDOM() {
    const div = document.createElement("div");
    div.className = "cm-math-block";
    div.style.cssText = "padding:0.75em 1em;margin:0.5em 0;background:var(--color-bg-tertiary);border-radius:6px;overflow-x:auto;";
    div.textContent = this.tex;
    // Async render
    loadKatex().then((katex) => {
      if (katex && !this.rendered) {
        try {
          katex.default.render(this.tex, div, { displayMode: true, throwOnError: false });
          this.rendered = true;
        } catch { /* keep raw tex */ }
      }
    });
    return div;
  }
  eq(other: MathBlockWidget) { return this.tex === other.tex; }
}

class MathInlineWidget extends WidgetType {
  private rendered = false;
  constructor(private tex: string) { super(); }
  toDOM() {
    const span = document.createElement("span");
    span.className = "cm-math-inline";
    span.style.cssText = "padding:0 2px;color:var(--color-accent);";
    span.textContent = this.tex;
    loadKatex().then((katex) => {
      if (katex && !this.rendered) {
        try {
          katex.default.render(this.tex, span, { displayMode: false, throwOnError: false });
          this.rendered = true;
        } catch { /* keep raw tex */ }
      }
    });
    return span;
  }
  eq(other: MathInlineWidget) { return this.tex === other.tex; }
}

// ── Mermaid widget ───────────────────────────────────────────────────

let mermaidId = 0;

class MermaidWidget extends WidgetType {
  private id: string;
  constructor(private code: string) {
    super();
    this.id = `mermaid-${++mermaidId}`;
  }
  toDOM() {
    const container = document.createElement("div");
    container.className = "mermaid-container";
    container.id = this.id;
    container.style.cssText = "background:var(--color-bg-tertiary);border-radius:8px;padding:1rem;margin:0.5em 0;text-align:center;";
    container.textContent = "Loading diagram...";

    import("mermaid").then((mermaid) => {
      mermaid.default.initialize({
        startOnLoad: false,
        theme: document.documentElement.getAttribute("data-theme") === "solarized-light" ? "default" : "dark",
        securityLevel: "loose",
      });
      mermaid.default.render(this.id + "-svg", this.code).then(({ svg }) => {
        container.innerHTML = svg;
      }).catch((err: Error) => {
        container.innerHTML = `<div class="mermaid-error">Mermaid Error: ${err.message}</div>`;
      });
    }).catch(() => {
      container.textContent = "Failed to load Mermaid";
    });

    return container;
  }
  eq(other: MermaidWidget) { return this.code === other.code; }
}

// ── Plugin export ────────────────────────────────────────────────────

export function markdownRenderPlugin() {
  return ViewPlugin.fromClass(
    class {
      decorations: DecorationSet;
      constructor(view: EditorView) {
        this.decorations = buildDecorations(view);
      }
      update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) {
          this.decorations = buildDecorations(update.view);
        }
      }
    },
    { decorations: (v) => v.decorations },
  );
}
