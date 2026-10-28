import { describe, expect, it } from "vitest";
import { findBlocks, isInsideBlock, overlapsBlock } from "./blocks";

function codeBlock(doc: string) {
  return findBlocks(doc).find((block) => block.type === "code");
}

function content(doc: string) {
  const block = codeBlock(doc);
  expect(block).toBeDefined();
  return doc.slice(block!.contentFrom, block!.contentTo);
}

describe("findBlocks fenced code", () => {
  it("finds a single-line block", () => {
    const doc = "```js\nconst a = 1;\n```";
    const block = codeBlock(doc);
    expect(block).toMatchObject({ lang: "js", closed: true });
    expect(content(doc)).toBe("const a = 1;");
  });

  it("keeps every content line in one block", () => {
    const doc = "```ts\none\ntwo\n\nthree\n```";
    const block = codeBlock(doc);
    expect(block).toMatchObject({ closed: true });
    expect(content(doc)).toBe("one\ntwo\n\nthree");
  });

  it("accepts tilde fences", () => {
    const doc = "~~~python\ndef x():\n    return 1\n~~~";
    expect(codeBlock(doc)).toMatchObject({ lang: "python", closed: true });
    expect(content(doc)).toBe("def x():\n    return 1");
  });

  it("accepts fences indented by up to three spaces", () => {
    const doc = "   ```js\n   const a = 1;\n   ```";
    expect(codeBlock(doc)).toMatchObject({ closed: true });
    expect(content(doc)).toBe("   const a = 1;");
  });

  it("accepts longer fences", () => {
    const doc = "````md\n```js\nconst a = 1;\n```\n````";
    expect(codeBlock(doc)).toMatchObject({ lang: "md", closed: true });
    expect(content(doc)).toBe("```js\nconst a = 1;\n```");
  });

  it("does not let a shorter fence close a longer one", () => {
    const doc = "````\n```\n````";
    expect(codeBlock(doc)).toMatchObject({ closed: true });
    expect(content(doc)).toBe("```");
  });

  it("treats an unclosed fence as a block to the end of the document", () => {
    const doc = "```js\nconst a = 1;";
    expect(codeBlock(doc)).toMatchObject({ closed: false });
    expect(content(doc)).toBe("const a = 1;");
  });

  it("does not open a fence when backticks appear in the info string", () => {
    const doc = "```js`\nnot code\n```";
    expect(findBlocks(doc).some((block) => block.from === 0 && block.type === "code")).toBe(false);
  });

  it("runs findBlocks for Mermaid blocks", () => {
    const doc = "```mermaid\ngraph TD\nA-->B\n```";
    const block = findBlocks(doc).find((item) => item.type === "mermaid");
    expect(block).toMatchObject({ closed: true, lang: "graph TD\nA-->B" });
  });
});

describe("block ranges", () => {
  const doc = "intro\n```js\nconst a = 1;\n```\noutro";
  const blocks = findBlocks(doc);

  it("detects positions inside a block", () => {
    expect(isInsideBlock(blocks, doc.indexOf("const a"))).toBe(true);
    expect(isInsideBlock(blocks, doc.indexOf("intro"))).toBe(false);
  });

  it("rejects inline ranges that only end inside a block", () => {
    expect(overlapsBlock(blocks, 0, doc.indexOf("const a") + 3)).toBe(true);
    expect(overlapsBlock(blocks, 0, doc.indexOf("```js"))).toBe(false);
  });
});

describe("other block types", () => {
  it("still finds math and tables", () => {
    const doc = "$$\nx = 1\n$$\n\n| a | b |\n| :-- | :-- |\n| 1 | 2 |";
    const types = findBlocks(doc).map((block) => block.type);
    expect(types).toContain("math");
    expect(types).toContain("table");
  });
});
