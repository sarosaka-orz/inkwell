<p align="center">
  <img src="assets/icon.svg" width="80" height="80" alt="Inkwell icon" />
</p>

<h1 align="center">Inkwell</h1>

<p align="center"><strong>A quiet place to write.</strong></p>

Inkwell is a free, open-source Markdown editor that renders your writing as you type — headings, code, math, diagrams, tables, task lists — without a split pane or a preview button. Just the page, and the sentence arriving.

**v0.2.1 adds a remembered interface zoom.** Desktop builds for Linux and macOS are on [GitHub Releases](https://github.com/sarosaka-orz/inkwell/releases). The homepage is <https://sarosaka-orz.github.io/inkwell/>; the browser editor is <https://sarosaka-orz.github.io/inkwell/app/>.

> **Web build notes:** edits autosave to browser local storage; use **Export → Markdown/HTML** to download a real file. Folder browsing and native desktop integrations are desktop-only.

## Download

| Platform | Package |
| :--- | :--- |
| Linux | `.AppImage`, `.deb`, and `.rpm` from [Releases](https://github.com/sarosaka-orz/inkwell/releases) |
| Arch Linux | Build from [packaging/arch](packaging/arch/PKGBUILD) with `makepkg -si`; AUR publication is on hold |
| macOS | Universal `.dmg` from [Releases](https://github.com/sarosaka-orz/inkwell/releases) |
| Browser | <https://sarosaka-orz.github.io/inkwell/app/> |

> **macOS is unsigned for now.** On first launch, right-click **Inkwell.app** and choose **Open**, or run `xattr -dr com.apple.quarantine /Applications/Inkwell.app`.

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

On macOS, use **Cmd** instead of **Ctrl**.

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
| `Ctrl+-` / `Ctrl+=` / `Ctrl+0` | Zoom out / in / reset the desktop window |
| `Ctrl+B` | Bold (`**text**`) |
| `Ctrl+I` | Italic (`*text*`) |
| `Ctrl+K` | Insert Hyperlink |
| `Ctrl+1` – `Ctrl+4` | Headings 1 through 4 |
| `Ctrl+\` | Toggle Library Drawer |
| `Ctrl+,` | Settings |
| `Ctrl+Z` / `Ctrl+Shift+Z` | Undo / Redo |

The desktop app remembers its interface zoom between sessions. Document font size is separate, under **Settings → Typography**.

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

## Web deployment

Pushes to `main` build the landing page at `/inkwell/` and the browser app at `/inkwell/app/` with [deploy-pages.yml](.github/workflows/deploy-pages.yml). The app is built with `INKWELL_BASE=/inkwell/app/` into `dist/app/`, then `site/` is copied to the root of `dist/`.

## Desktop releases

Pushing a `v*` tag builds Linux bundles (`.AppImage`, `.deb`, `.rpm`) and a universal macOS `.dmg` with [release-desktop.yml](.github/workflows/release-desktop.yml), then uploads them to a draft GitHub Release. The macOS build is unsigned for now.

Arch Linux packaging is in [packaging/arch](packaging/arch/PKGBUILD) (package name `inkwell-editor`). AUR publication is on hold while AUR registration is closed.

---

## License

MIT — see [LICENSE](LICENSE).
