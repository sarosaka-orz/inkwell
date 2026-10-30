export const SAMPLE_MARKDOWN = `# Welcome to Inkwell ✦

> A quiet place to write.
> A free, open-source Markdown editor with live inline rendering, distraction-free writing, and comprehensive syntax support.

---

## 🚀 Key Highlights

Inkwell delivers a seamless **live preview** experience — you type Markdown and see typography instantly:

- **WYSIWYG Inline Rendering**: Syntax markers gracefully hide when you move away, and reveal when your cursor is editing.
- **Rich Content Ecosystem**: Built-in support for GFM tables, math equations, diagrams, and task checklists.
- **Power User Controls**: Full Vim mode, customizable typography, and instant search & replace.
- **Export Anywhere**: One-click export to PDF, standalone HTML, or rich text for pasting into docs.

---

## 📝 Typography & Formatting

You can write formatting effortlessly using standard Markdown shorthand:

- **Bold text** with \`**bold**\` or \`__bold__\`
- *Italicized text* with \`*italic*\` or \`_italic_\`
- ~~Strikethrough~~ with \`~~strikethrough~~\`
- ==Highlighted text== with \`==highlighted==\`
- Inline code like \`const answer = 42;\`
- Web hyperlinks like [GitHub Inkwell Repository](https://github.com)
- Footnotes like this[^1] for annotations

[^1]: Footnotes provide references and annotations at the bottom of the document.

---

## ✅ Interactive Task Lists

Click directly on any checkbox below to toggle its status in real time:

- [x] Download and install Inkwell
- [x] Experience live inline WYSIWYG rendering
- [ ] Test the integrated LaTeX math equations
- [ ] Render a Mermaid diagram
- [ ] Export document to clean PDF or HTML

---

## 📊 GitHub Flavored Markdown Tables

Tables are formatted with clean borders and column alignments:

| Capability | Inkwell |
| :--- | :---: |
| Inline WYSIWYG | ✅ |
| LaTeX Math (KaTeX) | ✅ |
| Mermaid Diagrams | ✅ |
| Open source & free | ✅ |
| Lightweight Tauri core | ✅ |

---

## 🧮 Mathematical Formulas (KaTeX)

Inkwell supports both inline and multi-line LaTeX equations.

The iconic mass-energy equivalence is $E = mc^2$, and Euler's identity is $e^{i\\pi} + 1 = 0$.

Here is the famous Gaussian integral in a standalone math block:

$$
\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

And Cauchy-Schwarz Inequality:

$$
\\left( \\sum_{k=1}^n a_k b_k \\right)^2 \\le \\left( \\sum_{k=1}^n a_k^2 \\right) \\left( \\sum_{k=1}^n b_k^2 \\right)
$$

---

## 📐 Live Mermaid Diagrams

Diagrams render automatically inside the editor:

\`\`\`mermaid
flowchart LR
    A[Markdown Input] --> B[CodeMirror 6]
    B --> C{Inkwell Engine}
    C -->|Inline Render| D[Live WYSIWYG]
    C -->|Export| E[Standalone HTML / PDF]
\`\`\`

Here is a sequence flow:

\`\`\`mermaid
sequenceDiagram
    autonumber
    User->>Inkwell: Type Markdown text
    Inkwell->>KaTeX: Render math expressions
    Inkwell->>Mermaid: Generate vector diagram
    Inkwell-->>User: Instant visual feedback
\`\`\`

---

## 💻 Code Blocks with Syntax Highlighting

\`\`\`typescript
// TypeScript Example: Auto-save debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
\`\`\`

\`\`\`rust
// Rust Tauri Command
#[tauri::command]
pub fn save_document(path: String, content: String) -> Result<(), String> {
    std::fs::write(&path, content).map_err(|e| e.to_string())
}
\`\`\`

---

## ⌨️ Useful Keyboard Shortcuts

- \`Ctrl + N\` : New Document
- \`Ctrl + O\` : Open File
- \`Ctrl + S\` : Save File
- \`Ctrl + F\` : Find & Replace
- \`Ctrl + P\` : Command Palette
- \`Ctrl + Shift + F\` : Pin Formatting Dock
- \`Ctrl + /\` : Toggle WYSIWYG / Source Code Mode
- \`Ctrl + Shift + E\` : Toggle Read Mode
- \`Ctrl + B\` : Toggle Bold
- \`Ctrl + I\` : Toggle Italic
- \`Ctrl + \\\` : Toggle Library
- \`Ctrl + ,\` : Settings

*Enjoy writing with Inkwell!*
`;
