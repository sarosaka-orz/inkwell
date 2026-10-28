import { describe, expect, it } from "vitest";
import { extractHeadings } from "./outline";

describe("extractHeadings", () => {
  it("extracts levels, text, lines and positions", () => {
    const doc = "# Title\n\nintro\n\n## Section *one*\n### Deep `code`";
    const headings = extractHeadings(doc);

    expect(headings.map((heading) => heading.level)).toEqual([1, 2, 3]);
    expect(headings.map((heading) => heading.text)).toEqual(["Title", "Section one", "Deep code"]);
    expect(headings.map((heading) => heading.line)).toEqual([1, 5, 6]);
    expect(headings[1].pos).toBe(doc.indexOf("## Section"));
  });

  it("ignores hash lines that are not headings", () => {
    const headings = extractHeadings("#nope\n####### too deep\n#### fine");
    expect(headings.map((heading) => heading.text)).toEqual(["fine"]);
  });
});
