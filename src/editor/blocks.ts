/**
 * Block-level Markdown scanning shared by the live-preview decorations.
 * Kept free of CodeMirror imports so the parser can be unit-tested directly.
 */

export interface BlockInfo {
  type: "code" | "math" | "mermaid" | "table";
  from: number;
  to: number;
  lang?: string;
  raw?: string;
  /** Content range inside the fences (code and Mermaid blocks). */
  contentFrom?: number;
  contentTo?: number;
  /** Whether a matching closing fence was found. */
  closed?: boolean;
}

export function findBlocks(doc: string): BlockInfo[] {
  const blocks: BlockInfo[] = [];
  const lines = doc.split("\n");
  let offset = 0;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code blocks: ``` or ~~~, indented by up to three spaces.
    const fenceMatch = line.match(/^( {0,3})(`{3,}|~{3,})(.*)$/);
    if (fenceMatch) {
      const marker = fenceMatch[2][0];
      const fenceLength = fenceMatch[2].length;
      const info = fenceMatch[3].trim();
      // A backtick fence's info string may not contain backticks.
      if (marker === "`" && info.includes("`")) {
        offset += line.length + 1;
        i++;
        continue;
      }

      const lang = info.split(/\s+/)[0] || "";
      const from = offset;
      let j = i + 1;
      let closed = false;

      for (; j < lines.length; j++) {
        const close = lines[j].match(/^ {0,3}(`{3,}|~{3,})\s*$/);
        // The closing fence must use the same character and be at least as long.
        if (close && close[1][0] === marker && close[1].length >= fenceLength) {
          closed = true;
          break;
        }
      }

      const blockLines = lines.slice(i, closed ? j + 1 : j);
      const to = offset + blockLines.join("\n").length;
      const inner = lines.slice(i + 1, j).join("\n");
      const contentStart = offset + line.length + 1;
      const contentEnd = offset + lines.slice(i, j).join("\n").length;
      const contentFrom = Math.min(contentStart, contentEnd, doc.length);

      if (lang === "mermaid") {
        blocks.push({
          type: "mermaid",
          from,
          to,
          lang: inner,
          contentFrom,
          contentTo: contentEnd,
          closed,
        });
      } else {
        blocks.push({
          type: "code",
          from,
          to,
          lang,
          contentFrom,
          contentTo: contentEnd,
          closed,
        });
      }
      i = closed ? j + 1 : lines.length;
      offset = to + 1;
      continue;
    }

    // Math blocks: $$
    if (line.trim() === "$$") {
      const from = offset;
      let j = i + 1;
      while (j < lines.length && lines[j].trim() !== "$$") j++;
      const blockLines = lines.slice(i, j < lines.length ? j + 1 : lines.length);
      const to = offset + blockLines.join("\n").length;
      const inner = lines.slice(i + 1, j).join("\n");

      blocks.push({ type: "math", from, to, lang: inner });
      i = j < lines.length ? j + 1 : lines.length;
      offset = to + 1;
      continue;
    }

    // Markdown Table blocks: begins with | and line i+1 has | :-- |
    if (line.trim().startsWith("|") && line.trim().endsWith("|") && i + 1 < lines.length) {
      const nextLine = lines[i + 1].trim();
      if (nextLine.startsWith("|") && /^[|\s:-]+$/.test(nextLine)) {
        const from = offset;
        let j = i + 2;
        while (j < lines.length && lines[j].trim().startsWith("|") && lines[j].trim().endsWith("|")) {
          j++;
        }
        const tableLines = lines.slice(i, j);
        const to = offset + tableLines.join("\n").length;
        blocks.push({ type: "table", from, to, raw: tableLines.join("\n") });
        i = j;
        offset = to + 1;
        continue;
      }
    }

    offset += line.length + 1;
    i++;
  }

  return blocks;
}

export function isInsideBlock(blocks: BlockInfo[], pos: number): boolean {
  return blocks.some((b) => pos >= b.from && pos < b.to);
}

/**
 * Inline syntax must never reach into a fenced block, even when a stray
 * backtick before the fence would make a regex match span into it.
 */
export function overlapsBlock(blocks: BlockInfo[], from: number, to: number): boolean {
  return blocks.some((b) => from < b.to && to > b.from);
}
