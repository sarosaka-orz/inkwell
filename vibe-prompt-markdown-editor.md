# Vibe Coding Prompt — Markdown Editor

## 🎯 Project Overview

Build a **free, open-source, cross-platform Markdown editor** as a desktop GUI application.
Target: a free, open-source Markdown editor with richer features and a better-looking UI.

**Project name (placeholder):** `inkwell` (change freely)
**Tech stack:** Tauri v2 + TypeScript + React + TailwindCSS
**Target platforms:** macOS, Windows, Linux

---

## 🏗️ Architecture

```
inkwell/
├── src-tauri/          # Rust backend (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/   # File I/O, export, config
│   │   └── ...
├── src/                # React frontend
│   ├── components/
│   │   ├── Editor/         # Core WYSIWYG editor
│   │   ├── Preview/        # Rendered Markdown preview
│   │   ├── Sidebar/        # File tree
│   │   ├── StatusBar/
│   │   └── Toolbar/
│   ├── hooks/
│   ├── store/          # Zustand global state
│   ├── themes/         # Theme definitions
│   └── main.tsx
├── package.json
└── tauri.conf.json
```

---

## ✅ Feature Requirements

### Core Editor
- **WYSIWYG Markdown editing** — live inline rendering as you type, NOT split-pane preview
- Based on **ProseMirror** or **CodeMirror 6** with a custom Markdown schema
- Full CommonMark + GFM (GitHub Flavored Markdown) support
- Inline rendering of: **bold**, *italic*, ~~strikethrough~~, `inline code`, links, images

### Syntax & Rendering
- **Mermaid diagrams** — render inline inside the editor (flowchart, sequence, gantt, etc.)
- **LaTeX / KaTeX math** — inline `$...$` and block `$$...$$`
- **Syntax highlighted code blocks** — using highlight.js or shiki, with language label
- **Tables** — render as proper HTML tables with editing support
- **Task lists** — `- [ ]` / `- [x]` with clickable checkboxes

### File Management
- **File tree sidebar** — open a folder, browse and switch files
- **Tabs** — multiple files open simultaneously
- **Auto-save** — debounced save on every keystroke
- **Recent files** list

### Export
- Export to **PDF** (via Tauri print/webview)
- Export to **HTML** (self-contained single file)
- Copy as **rich text** (for pasting into Word/Notion/etc.)

### Vim Keybindings
- Full **Vim mode** toggle (Normal / Insert / Visual)
- Implemented via CodeMirror 6's `@replit/codemirror-vim` or equivalent
- Status indicator in bottom-left showing current Vim mode

### Themes & Appearance
- **Dark mode / Light mode** toggle (system default respected)
- At least **4 built-in themes**: GitHub Dark, Dracula, Solarized Light, Nord
- Custom theme support via CSS variables
- Smooth, beautiful UI — NOT a plain text editor aesthetic. Think refined, modern, slightly editorial. Use a distinctive monospace or serif font for the editor body.
- Subtle animations: fade-in on file open, smooth theme transition

### Settings
- Font family, font size, line height
- Vim mode on/off
- Default export path
- Spell check toggle
- Stored in a local JSON config file via Tauri's app config dir

---

## 🎨 UI Design Direction

- **Overall tone:** Refined dark-first design. Think "premium text editor meets publishing tool."
- **Editor area:** Centered, max-width ~800px, generous line height (~1.8), slightly off-white text on deep background
- **Sidebar:** Subtle, collapsible, file icons via `lucide-react`
- **Typography:** Use a beautiful serif or humanist monospace for editor content (e.g. `iA Writer Quattro`, `Literata`, or `JetBrains Mono`). UI chrome uses a clean sans-serif.
- **Color accents:** One strong accent color (e.g. amber, teal, or indigo) used sparingly for selections, active states, and focus rings
- **No generic AI aesthetics** — no purple gradients, no Inter font, no cookie-cutter shadcn components without customization

---

## 📦 Dependencies to Use

```json
{
  "frontend": [
    "@tauri-apps/api",
    "react",
    "react-dom",
    "zustand",
    "tailwindcss",
    "@codemirror/view",
    "@codemirror/state",
    "@codemirror/lang-markdown",
    "@codemirror/language",
    "@replit/codemirror-vim",
    "mermaid",
    "katex",
    "highlight.js",
    "lucide-react",
    "remark",
    "remark-gfm",
    "rehype-highlight"
  ],
  "tauri (Rust)": [
    "tauri (v2)",
    "serde",
    "serde_json",
    "tokio"
  ]
}
```

---

## 🚀 Implementation Order

Build in this order to get a working prototype as fast as possible:

1. **Scaffold** — `create-tauri-app` with React + TypeScript template
2. **Basic file open/save** — Tauri commands for read/write file, open dialog
3. **CodeMirror editor** — plain Markdown editing with syntax highlight
4. **WYSIWYG inline rendering** — integrate `@codemirror/lang-markdown` with live rendering
5. **Mermaid rendering** — detect fenced code blocks with `mermaid` lang, render diagram
6. **KaTeX math** — inline and block math rendering
7. **File tree sidebar** — read directory, render tree, click to open file
8. **Tabs** — multi-file tab bar with close button
9. **Vim mode** — toggle via status bar or shortcut
10. **Themes** — CSS variable–based theme system with switcher
11. **Export PDF / HTML** — Tauri print dialog + HTML serializer
12. **Settings panel** — modal with config options
13. **Polish** — animations, transitions, empty states, loading states

---

## 🐛 Error Handling Strategy

- File read/write errors: show toast notification (top-right, auto-dismiss)
- Mermaid parse error: show red error box inline instead of diagram
- KaTeX parse error: show raw source with red underline
- Unsaved changes on close: show native dialog "Save changes?"

---

## 📝 Additional Notes

- All features must work **100% offline** — no telemetry, no cloud sync, no accounts
- The app must be **permanently free and open-source** (MIT license)
- README should include: feature list, install instructions, screenshot, roadmap
- Target binary size: under 15MB (Tauri advantage over Electron)
- The editor should feel **fast** — no lag on large files (use virtualization if needed)

---

## 💬 First Prompt to Send MiMo

Use this as your opening message:

> 你是一個資深的 Tauri + React + TypeScript 工程師。我要做一個叫做 `inkwell` 的開源桌面 Markdown 編輯器，永久免費。
>
> 請先幫我完成第一步：用 `create-tauri-app` scaffold 整個專案結構，並設定好所有必要的依賴套件（frontend 和 Rust 端），讓專案能夠成功執行 `pnpm tauri dev`。
>
> 要求：
> - Frontend: React + TypeScript + TailwindCSS
> - 狀態管理: Zustand
> - 編輯器核心: CodeMirror 6
> - 確保 `src-tauri/tauri.conf.json` 設定正確
> - 給我完整的檔案內容，不要省略任何部分
>
> 完成後告訴我下一步該做什麼。

---

之後每一步都這樣餵：把上面「Implementation Order」的第 N 步描述給 MiMo，並附上目前的檔案結構和任何編譯錯誤，讓它持續往下做。
