# Inkwell

A free, modern, open-source Markdown editor — built as a permanent alternative to Typora.

Inkwell is a cross-platform desktop application that renders Markdown seamlessly as you type, with live inline previews for headings, bold, italic, code, math, diagrams, tables, task lists, and more. No split-pane, no preview button — just write.

---

## Features

### ✍️ True WYSIWYG & Live Preview Editing
- **Intelligent Syntax Conceal/Reveal**: Markdown delimiters (`#`, `**`, `_`, `~~`, `==`, `[]()`) and code fences hide automatically for a clean reading view and reveal instantly when your cursor focuses on the token or line.
- **Three View Modes**: Write with **Live WYSIWYG**, read a clean, read-only **Preview**, or edit raw **Source Code** with line numbers and gutters (`Ctrl+/` source, `Ctrl+Shift+E` read).
- **Smart Markdown Typing**: Automatic list continuation (`- `, `* `, `+ `, `1. `, `- [ ] `), empty item clearing on Enter, and Tab / Shift+Tab indentation.

### 📐 Rich Content Ecosystem
- **Interactive Task Lists**: Click directly on `- [ ]` and `- [x]` checkboxes in the editor to toggle their state in real-time.
- **GFM Tables**: Rendered tables with column alignment, row styling, and interactive table generator (`Insert Table` dialog).
- **LaTeX Math (KaTeX)**: Inline (`$...$`) and block (`$$...$$`) math formulas with click-to-edit TeX.
- **Mermaid Diagrams**: Live rendering for flowcharts, sequence diagrams, state diagrams, and mindmaps with error fallbacks and source edit triggers.
- **Code Highlighting**: Syntax highlighting for dozens of programming languages.
- **Highlights & Footnotes**: Support for `==highlight==` and `[^1]` footnotes.
- **Inline Images**: Rendered image thumbnails with alt captions, fallback broken-link chips, and click-to-edit.

### 📁 Workspace & Navigation
- **Multi-Tab Interface**: Open and manage multiple documents simultaneously.
- **Document Outline (Table of Contents)**: Dynamic H1–H6 hierarchy extracted in real-time; click any heading to scroll immediately to that section.
- **Command Palette (`Ctrl+P`)**: Fuzzy jump between open tabs and recent files, run every command, or jump to a heading.
- **Find & Replace (`Ctrl+F`)**: Search with match counter, previous/next navigation, case sensitivity, regex, and replace all.
- **Debounced Auto-Save**: Real-time background saving with visual status indicators (`Saved`, `Saving...`, `Unsaved`).
- **Close Protection & Draft Recovery**: Closing a dirty tab or the window asks first, and unsaved work is recovered from a local draft after a crash or accidental quit.
- **Links Open Outside**: Web and mail links open in the system browser; in write mode use Ctrl/Cmd-click so a plain click still places the cursor.
- **Workspace File Tree**: Browse and open files directly from your workspace directory.

### 🪶 Quiet, Document-First Interface
- **Zen workspace**: a single slim top bar, a calm status line, and the document as the only hero. No permanent activity rail.
- **Library drawer**: files, outline, and recents open as an overlay (`Ctrl+\`) without reflowing the page.
- **Command palette (`Ctrl+P`)**: every document, view, theme, and formatting action in one searchable list. `>` filters commands, `@` jumps to a heading.
- **Selection-triggered formatting dock**: formatting appears when you select text and can be pinned when you want it around.
- **Smooth caret**: an optional VS Code-style glide between caret positions, on by default.
- **Accessible by default**: dialogs trap focus and restore it on close, Escape dismisses layers, tabs and palette results are keyboard-operable, and motion respects `prefers-reduced-motion`.

### 🎨 Themes & Customization
- **7 Built-in Themes**:
  - Ink
  - Paper (light)
  - Tokyo Night
  - Nord
  - Dracula
  - GitHub Dark
  - GitHub Light
- **Bundled, offline typography**: Literata (documents), Instrument Sans (interface), and JetBrains Mono (code) — no network requests.
- **Document typeface choice**: Literata, Instrument Sans, JetBrains Mono, or the system font.
- **Reading Modes**: Focus mode, Typewriter scrolling (keeps current line centered), and Full Width layout.
- **Full Vim Mode**: Normal, Insert, and Visual modes with status bar indicators.

### 📤 Export & Sharing
- **Export to PDF**: System print dialog with “Save as PDF”, typeset with the document's own styles.
- **Export to HTML**: Self-contained single HTML document with styles, KaTeX, and highlight.js bundled.
- **Download Markdown**: Direct `.md` file download.
- **Copy as Rich Text**: One-click clipboard copy for pasting into Google Docs, Word, or Notion.

---

## Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl+N` | New Document |
| `Ctrl+O` | Open Document |
| `Ctrl+S` | Save Document |
| `Ctrl+W` | Close Tab |
| `Ctrl+P` | Command Palette |
| `Ctrl+F` | Find & Replace Panel |
| `Ctrl+Shift+F` | Pin / Unpin Formatting Dock |
| `Ctrl+/` | Toggle WYSIWYG / Source Code Mode |
| `Ctrl+Shift+E` | Toggle Read (Preview) Mode |
| `Ctrl+B` | Bold (`**text**`) |
| `Ctrl+I` | Italic (`*text*`) |
| `Ctrl+K` | Insert Hyperlink |
| `Ctrl+1` – `Ctrl+4` | Headings 1 through 4 |
| `Ctrl+\` | Toggle Library Drawer |
| `Ctrl+,` | Settings |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Runtime** | Tauri v2 (Rust) |
| **Frontend** | React 19, TypeScript, Vite, TailwindCSS v4 |
| **Editor Core** | CodeMirror 6 |
| **State** | Zustand |
| **Math & Diagrams** | KaTeX, Mermaid |
| **Markdown AST** | Unified, Remark, Rehype |
| **Icons** | Lucide React |

---

## Getting Started

### Prerequisites
- Node.js (v18+) & pnpm
- Rust (for Tauri desktop app)

### Install & Run
```bash
git clone https://github.com/sarosaka-orz/inkwell.git
cd inkwell
pnpm install
```

#### Run in Web Browser
```bash
pnpm dev
```
Open `http://localhost:1420` in your browser.

#### Run as Desktop Application
```bash
pnpm tauri dev
```

#### Build Production Desktop Binary
```bash
pnpm tauri build
```

---

## Testing

```bash
pnpm test        # unit tests (Vitest)
pnpm exec tsc -b # typecheck
pnpm build       # production build
```

---

## License

MIT — see [LICENSE](LICENSE).
