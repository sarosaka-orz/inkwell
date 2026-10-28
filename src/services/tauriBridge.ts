// Safe desktop (Tauri v2) and Web browser abstraction layer

export interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

export interface RecentFile {
  path: string;
  name: string;
  lastOpened: string;
}

export const isTauri = (): boolean => {
  return typeof window !== "undefined" && Boolean((window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__);
};

// Read file contents
export async function readFile(path: string): Promise<string> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<string>("read_file", { path });
  }
  const saved = localStorage.getItem(`inkwell:doc:${path}`);
  if (saved !== null) return saved;
  return "";
}

// Write file contents
export async function writeFile(path: string, contents: string): Promise<void> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path, contents });
    return;
  }
  localStorage.setItem(`inkwell:doc:${path}`, contents);
}

// Read directory
export async function readDirectory(path: string): Promise<FileEntry[]> {
  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<FileEntry[]>("read_directory", { path });
  }
  return [];
}

// Recent files
export async function getRecentFiles(): Promise<RecentFile[]> {
  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const list = await invoke<{ path: string; name: string; last_opened?: string; lastOpened?: string }[]>("get_recent_files");
      return list.map((item) => ({
        path: item.path,
        name: item.name,
        lastOpened: item.last_opened || item.lastOpened || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }
  try {
    const raw = localStorage.getItem("inkwell:recent_files");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function addRecentFile(path: string, name: string): Promise<RecentFile[]> {
  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("add_recent_file", { path, name });
    } catch {
      // ignore
    }
  }
  try {
    const now = new Date().toISOString();
    const existing = await getRecentFiles();
    const filtered = existing.filter((f) => f.path !== path);
    const updated = [{ path, name, lastOpened: now }, ...filtered].slice(0, 20);
    localStorage.setItem("inkwell:recent_files", JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

// Open File Dialog
export async function showOpenFileDialog(): Promise<{ path: string; name: string; content: string } | null> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const { invoke } = await import("@tauri-apps/api/core");
    const selected = await open({
      multiple: false,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "mdown", "txt"] }],
    });
    if (!selected) return null;
    const path = selected as string;
    const name = path.split("/").pop() || path.split("\\").pop() || "untitled.md";
    const content = await invoke<string>("read_file", { path });
    await addRecentFile(path, name);
    return { path, name, content };
  }

  // Web File Picker fallback
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const text = await file.text();
      const path = `web:/${file.name}`;
      await addRecentFile(path, file.name);
      resolve({ path, name: file.name, content: text });
    };
    input.click();
  });
}

// Open Directory Dialog
export async function showOpenFolderDialog(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const selected = await open({
      directory: true,
      multiple: false,
    });
    if (!selected) return null;
    return selected as string;
  }
  return null;
}

// Save File Dialog
export async function showSaveFileDialog(defaultName: string = "untitled.md"): Promise<string | null> {
  if (isTauri()) {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const savePath = await save({
      defaultPath: defaultName,
      filters: [{ name: "Markdown", extensions: ["md", "markdown", "txt"] }],
    });
    return savePath || null;
  }
  return defaultName;
}

// Export PDF through the system print dialog (which offers "Save as PDF").
// An off-screen iframe keeps the app window itself out of the print job.
export async function exportPdfDoc(html: string, defaultName: string = "document.pdf"): Promise<void> {
  const frame = document.createElement("iframe");
  frame.title = defaultName;
  frame.setAttribute("aria-hidden", "true");
  Object.assign(frame.style, {
    position: "fixed",
    left: "-10000px",
    top: "0",
    width: "800px",
    height: "1000px",
    border: "0",
  });
  document.body.appendChild(frame);

  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    return;
  }

  doc.open();
  doc.write(html);
  doc.close();

  // Let the renderer lay out fonts and diagrams before opening the dialog.
  await new Promise((resolve) => window.setTimeout(resolve, 400));

  try {
    frame.contentWindow?.focus();
    frame.contentWindow?.print();
  } finally {
    window.setTimeout(() => frame.remove(), 1000);
  }
}

// Download file directly in web mode
export function downloadFile(filename: string, content: string, mimeType: string = "text/markdown"): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Only real web/mail links leave the app; relative paths stay in the draft. */
export function normalizeExternalUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^(https?:\/\/|mailto:)/i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    return ["http:", "https:", "mailto:"].includes(parsed.protocol) ? parsed.href : null;
  } catch {
    return null;
  }
}

export async function openExternalUrl(raw: string): Promise<void> {
  const url = normalizeExternalUrl(raw);
  if (!url) return;

  if (isTauri()) {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("open_url", { url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

/** Close the desktop window without re-triggering the close guard. */
export async function closeWindow(): Promise<void> {
  if (!isTauri()) return;
  const { getCurrentWindow } = await import("@tauri-apps/api/window");
  await getCurrentWindow().destroy();
}
