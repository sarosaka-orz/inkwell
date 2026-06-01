import { unified, type Plugin } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

/**
 * Convert Markdown to a self-contained HTML document.
 * Uses unified/remark/rehype for proper parsing (GFM, math, code highlighting).
 */
export async function generateHtml(markdown: string, title: string): Promise<string> {
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeSanitize, {
      ...defaultSchema,
      tagNames: [
        ...(defaultSchema.tagNames || []),
        "math", "mrow", "mi", "mo", "mn", "msup", "msub", "mfrac",
        "msqrt", "mtext", "mspace", "mover", "munder", "munderover",
        "semantics", "annotation", "annotation-xml",
      ],
      attributes: {
        ...defaultSchema.attributes,
        "*": [...(defaultSchema.attributes?.["*"] || []), "className", "style"],
        math: ["xmlns"],
        annotation: ["encoding"],
      },
    })
    .use(rehypeHighlight, { detect: true })
    .use(rehypeKatex)
    .use(rehypeStringify)
    .process(markdown);

  const bodyHtml = String(file);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
<style>
@import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600;8..60,700&display=swap');

body {
  font-family: 'Source Serif 4', Georgia, serif;
  max-width: 800px;
  margin: 3rem auto;
  padding: 0 2rem;
  line-height: 1.8;
  color: #1a1a1a;
  font-size: 16px;
}

h1 { font-size: 2em; font-weight: 700; margin: 1.5em 0 0.5em; letter-spacing: -0.02em; }
h2 { font-size: 1.5em; font-weight: 600; margin: 1.3em 0 0.4em; letter-spacing: -0.01em; }
h3 { font-size: 1.25em; font-weight: 600; margin: 1.2em 0 0.3em; }

blockquote {
  border-left: 3px solid #d4a574;
  padding-left: 1em;
  color: #555;
  font-style: italic;
  margin: 1em 0;
}

code {
  background: #f4f4f4;
  padding: 0.15em 0.4em;
  border-radius: 3px;
  font-size: 0.9em;
  font-family: 'JetBrains Mono', monospace;
}

pre {
  background: #f8f8f8;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  border: 1px solid #e0e0e0;
}

pre code {
  background: transparent;
  padding: 0;
  border: none;
}

a { color: #268bd2; text-decoration: underline; }

hr {
  border: none;
  border-top: 1px solid #ddd;
  margin: 2em 0;
}

ul, ol { padding-left: 2em; }
li { margin: 0.3em 0; }

table {
  border-collapse: collapse;
  width: 100%;
  margin: 1em 0;
}

th, td {
  border: 1px solid #ddd;
  padding: 0.5em 0.75em;
  text-align: left;
}

th { background: #f4f4f4; font-weight: 600; }

img { max-width: 100%; height: auto; }

/* highlight.js theme (One Light) */
.hljs-keyword { color: #a626a4; }
.hljs-string { color: #50a14f; }
.hljs-number { color: #986801; }
.hljs-comment { color: #a0a1a7; font-style: italic; }
.hljs-function { color: #4078f2; }
.hljs-title { color: #4078f2; }
.hljs-built_in { color: #c18401; }
.hljs-type { color: #c18401; }
.hljs-attr { color: #986801; }
.hljs-variable { color: #e45649; }
.hljs-operator { color: #383a42; }
.hljs-punctuation { color: #383a42; }

@media print {
  body { margin: 0; max-width: none; padding: 1rem; }
  pre { white-space: pre-wrap; word-break: break-all; }
}
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
