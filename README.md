# Inkwell

A free, open-source Markdown editor — built as a permanent alternative to Typora.

Inkwell is a cross-platform desktop application that renders Markdown as you type, with live inline previews for headings, bold, italic, code, math, diagrams, and more. No split-pane, no preview button — just write.

## Features

**WYSIWYG Markdown Editing**
Live inline rendering powered by CodeMirror 6. Write Markdown, see the result immediately.

**Rich Content Support**
- GFM tables, task lists, strikethrough
- LaTeX math via KaTeX — inline `$...$` and block `$$...$$`
- Mermaid diagrams — flowcharts, sequence, pie charts, rendered inline
- Syntax-highlighted code blocks for dozens of languages

**File Management**
- File tree sidebar for browsing project folders
- Multi-tab editing
- Auto-save with debounced writes
- Recent files tracking

**Export**
- PDF export via native webkit2gtk print pipeline
- HTML export as a self-contained single file
- Copy as rich text for pasting into other apps

**Vim Mode**
Full Vim keybinding support — Normal, Insert, Visual modes. Toggle from the status bar.

**Themes**
5 built-in themes with smooth transitions:

| Theme | Style |
|-------|-------|
| Inkwell Dark | Deep charcoal with amber accent |
| GitHub Dark | GitHub's dark palette |
| Dracula | Classic Dracula colors |
| Solarized Light | Warm paper-like light theme |
| Nord | Arctic blue-toned dark theme |

**Keyboard Shortcuts**

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+P` | Export PDF |
| `Ctrl+\` | Toggle sidebar |
| `Ctrl+,` | Settings |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Tauri v2 |
| Frontend | React 19, TypeScript, TailwindCSS v4 |
| Editor | CodeMirror 6 |
| State | Zustand |
| Markdown | unified, remark, rehype |
| Math | KaTeX |
| Diagrams | Mermaid |
| Syntax | highlight.js |
| Icons | lucide-react |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Rust](https://www.rust-lang.org/tools/install) (latest stable)
- System dependencies for Tauri — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Install

```bash
git clone https://github.com/your-username/inkwell.git
cd inkwell
pnpm install
```

### Development

```bash
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

The binary will be in `src-tauri/target/release/`.

## Project Structure

```
inkwell/
├── src/                          # React frontend
│   ├── components/
│   │   ├── Editor/               # CodeMirror editor + WYSIWYG rendering
│   │   │   ├── Editor.tsx        # Main editor component
│   │   │   ├── renderPlugin.ts   # Inline Markdown decoration plugin
│   │   │   └── theme.ts          # CodeMirror theme definition
│   │   ├── Sidebar/              # File tree
│   │   ├── Tabs/                 # Multi-file tab bar
│   │   ├── Toolbar/              # Top action bar
│   │   ├── StatusBar/            # Bottom bar (Vim mode, etc.)
│   │   ├── Settings/             # Settings modal
│   │   └── Toast/                # Notification toasts
│   ├── store/editorStore.ts      # Zustand global state
│   ├── themes/index.ts           # Theme definitions
│   ├── utils/generateHtml.ts     # Markdown → HTML pipeline
│   └── index.css                 # Global styles
├── src-tauri/                    # Rust backend
│   └── src/
│       ├── commands/file_ops.rs  # File I/O, PDF export, recent files
│       ├── lib.rs                # Tauri plugin registration
│       └── main.rs               # Entry point
├── package.json
└── tauri.conf.json
```

## License

MIT
