use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use tauri::command;

#[derive(Serialize, Deserialize, Clone)]
pub struct FileEntry {
    pub name: String,
    pub path: String,
    pub is_dir: bool,
}

#[derive(Serialize, Deserialize)]
pub struct RecentFile {
    pub path: String,
    pub name: String,
    pub last_opened: String,
}

#[command]
pub fn read_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| format!("Failed to read file: {}", e))
}

#[command]
pub fn write_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, &contents).map_err(|e| format!("Failed to write file: {}", e))
}

#[command]
pub fn read_directory(path: String) -> Result<Vec<FileEntry>, String> {
    let dir = Path::new(&path);
    if !dir.is_dir() {
        return Err("Path is not a directory".to_string());
    }

    let mut entries = Vec::new();
    let read_dir = fs::read_dir(dir).map_err(|e| format!("Failed to read directory: {}", e))?;

    for entry in read_dir {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let metadata = entry
            .metadata()
            .map_err(|e| format!("Failed to read metadata: {}", e))?;
        let name = entry.file_name().to_string_lossy().to_string();

        if name.starts_with('.') {
            continue;
        }

        entries.push(FileEntry {
            name,
            path: entry.path().to_string_lossy().to_string(),
            is_dir: metadata.is_dir(),
        });
    }

    entries.sort_by(|a, b| {
        if a.is_dir == b.is_dir {
            a.name.to_lowercase().cmp(&b.name.to_lowercase())
        } else {
            b.is_dir.cmp(&a.is_dir)
        }
    });

    Ok(entries)
}

fn recent_files_path() -> std::path::PathBuf {
    let data_dir = dirs::data_dir().unwrap_or_else(|| Path::new(".").to_path_buf());
    let app_dir = data_dir.join("inkwell");
    fs::create_dir_all(&app_dir).ok();
    app_dir.join("recent_files.json")
}

#[command]
pub fn get_recent_files() -> Result<Vec<RecentFile>, String> {
    let path = recent_files_path();
    if !path.exists() {
        return Ok(Vec::new());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[command]
pub fn add_recent_file(path: String, name: String) -> Result<Vec<RecentFile>, String> {
    let now = chrono::Utc::now().to_rfc3339();
    let mut files = get_recent_files().unwrap_or_default();
    files.retain(|f| f.path != path);
    files.insert(
        0,
        RecentFile {
            path,
            name,
            last_opened: now,
        },
    );
    files.truncate(20);

    let json = serde_json::to_string_pretty(&files).map_err(|e| e.to_string())?;
    fs::write(recent_files_path(), json).map_err(|e| e.to_string())?;
    Ok(files)
}

#[command]
pub fn export_pdf(app: tauri::AppHandle, html: String, output_path: String) -> Result<(), String> {
    use tauri::WebviewUrl;
    use tauri::WebviewWindowBuilder;

    // Create a temporary hidden window with a webview for PDF generation
    let temp_win = WebviewWindowBuilder::new(
        &app,
        "pdf-export-temp",
        WebviewUrl::App("index.html".into()),
    )
    .title("Exporting PDF...")
    .inner_size(800.0, 1000.0)
    .visible(false)
    .build()
    .map_err(|e| format!("Failed to create temp webview: {}", e))?;

    // Load the HTML content as a data URI
    let encoded = format!("data:text/html;base64,{}", base64_encode(html.as_bytes()));

    temp_win
        .with_webview(move |webview| {
            // Give the renderer time to lay out the page
            std::thread::sleep(std::time::Duration::from_millis(600));

            // Use webkit2gtk's PrintOperation for native "Save as PDF" on Linux
            let _ = webview.print();
        })
        .map_err(|e| format!("with_webview failed: {}", e))?;

    // Wait for the print operation to complete, then close the temp window
    std::thread::sleep(std::time::Duration::from_millis(500));
    let _ = temp_win.close();

    Ok(())
}

fn base64_encode(bytes: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut result = String::new();
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as u32;
        let b1 = if chunk.len() > 1 { chunk[1] as u32 } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as u32 } else { 0 };
        let triple = (b0 << 16) | (b1 << 8) | b2;
        result.push(CHARS[((triple >> 18) & 0x3F) as usize] as char);
        result.push(CHARS[((triple >> 12) & 0x3F) as usize] as char);
        if chunk.len() > 1 {
            result.push(CHARS[((triple >> 6) & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
        if chunk.len() > 2 {
            result.push(CHARS[(triple & 0x3F) as usize] as char);
        } else {
            result.push('=');
        }
    }
    result
}

#[command]
pub fn generate_example() -> Result<String, String> {
    let doc_dir = dirs::document_dir()
        .or_else(|| dirs::home_dir())
        .unwrap_or_else(|| Path::new(".").to_path_buf());
    let inkwell_dir = doc_dir.join("Inkwell");
    fs::create_dir_all(&inkwell_dir).ok();
    let example_path = inkwell_dir.join("example.md");

    if example_path.exists() {
        return Ok(example_path.to_string_lossy().to_string());
    }

    let content = r#"# Welcome to Inkwell

> A free, open-source Markdown editor — built for writers who love clean, distraction-free writing.

This document showcases every feature Inkwell supports. Play around!

---

## Table of Contents

Inkwell automatically renders a live TOC for any document with headings. Just use standard Markdown headings and the editor handles the rest.

---

## Text Formatting

You can write in **bold**, *italic*, ~~strikethrough~~, and `inline code`. Combine them: ***bold and italic***.

Links work too: [Inkwell on GitHub](https://github.com)

---

## Task Lists

- [x] Write the spec
- [x] Build the editor
- [x] Add WYSIWYG rendering
- [ ] Ship v1.0
- [ ] Take over the world

---

## Code Blocks

Syntax highlighting works for dozens of languages:

```typescript
interface EditorConfig {
  fontFamily: string;
  fontSize: number;
  vimMode: boolean;
}

const defaults: EditorConfig = {
  fontFamily: "JetBrains Mono",
  fontSize: 15,
  vimMode: false,
};
```

```python
def fibonacci(n: int) -> list[int]:
    """Generate first n Fibonacci numbers."""
    a, b = 0, 1
    result = []
    for _ in range(n):
        result.append(a)
        a, b = b, a + b
    return result
```

```rust
fn main() {
    let message = "Hello from Inkwell!";
    println!("{}", message);
}
```

---

## Math (KaTeX)

Inline math: The quadratic formula is $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$.

Block math:

$$
\int_{-\infty}^{\infty} e^{-x^2} \, dx = \sqrt{\pi}
$$

Euler's identity:

$$
e^{i\pi} + 1 = 0
$$

---

## Mermaid Diagrams

### Flowchart

```mermaid
graph TD
    A[Open Inkwell] --> B{Write or Code?}
    B -->|Write| C[Markdown Mode]
    B -->|Code| D[Code Blocks]
    C --> E[Live Preview]
    D --> E
    E --> F[Export HTML/PDF]
```

### Sequence Diagram

```mermaid
sequenceDiagram
    User->>Inkwell: Open file
    Inkwell->>Backend: read_file(path)
    Backend-->>Inkwell: file contents
    Inkwell->>Editor: render markdown
    User->>Inkwell: Ctrl+S
    Inkwell->>Backend: write_file(path, content)
    Backend-->>Inkwell: success
```

### Pie Chart

```mermaid
pie title What Inkwell Users Write
    "Documentation" : 40
    "Blog Posts" : 25
    "Notes" : 20
    "Code READMEs" : 15
```

---

## Blockquotes

> "The best editor is the one that gets out of your way."
>
> — Every writer, ever

Nested quotes:

> Outer quote
>> Inner quote
>>> Even deeper

---

## Lists

### Unordered
- First item
- Second item
  - Nested item
  - Another nested
- Third item

### Ordered
1. Step one
2. Step two
3. Step three

---

## Horizontal Rules

Three dashes create a visual separator:

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | New file |
| `Ctrl+O` | Open file |
| `Ctrl+S` | Save |
| `Ctrl+\` | Toggle sidebar |
| `Ctrl+,` | Settings |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` | Redo |

---

## Themes

Inkwell ships with **5 themes**: Inkwell Dark, GitHub Dark, Dracula, Solarized Light, and Nord. Switch instantly from the toolbar or settings.

---

## Vim Mode

Toggle Vim keybindings from the status bar or settings. Full NORMAL/INSERT/VISUAL mode support.

---

*Built with Tauri, React, and CodeMirror. Open source, forever free.*
"#;

    fs::write(&example_path, content).map_err(|e| format!("Failed to write example: {}", e))?;
    Ok(example_path.to_string_lossy().to_string())
}
