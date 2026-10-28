import type { HeadingItem } from "../store/editorStore";

export function extractHeadings(markdown: string): HeadingItem[] {
  const headings: HeadingItem[] = [];
  const lines = markdown.split("\n");
  let charOffset = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(#{1,6})\s+(.*)$/);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim().replace(/[*_`~[\]]/g, "");
      headings.push({
        id: `heading-${i}-${charOffset}`,
        level,
        text,
        pos: charOffset,
        line: i + 1,
      });
    }
    charOffset += line.length + 1;
  }

  return headings;
}
