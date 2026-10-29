import { useEditorStore, type Tab } from "../store/editorStore";
import { generateHtml } from "../utils/generateHtml";
import {
  addRecentFile,
  downloadFile,
  exportPdfDoc,
  getRecentFiles,
  readDirectory,
  readFile,
  showOpenFileDialog,
  showOpenFolderDialog,
  showSaveFileDialog,
  writeFile,
} from "./tauriBridge";

export function getActiveTab(): Tab | undefined {
  const { tabs, activeTabId } = useEditorStore.getState();
  return tabs.find((tab) => tab.id === activeTabId);
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "document";
}

function fileNameOf(path: string): string {
  return path.split("/").pop() || path.split("\\").pop() || "untitled.md";
}

export async function saveDocument(
  tabId: string,
  options?: { forceDialog?: boolean },
): Promise<boolean> {
  const tab = useEditorStore.getState().tabs.find((item) => item.id === tabId);
  if (!tab) return false;

  const store = useEditorStore.getState();
  try {
    let path = options?.forceDialog ? null : tab.path;
    if (!path) {
      path = await showSaveFileDialog(tab.name || "untitled.md");
      if (!path) return false;
      useEditorStore.setState((state) => ({
        tabs: state.tabs.map((item) =>
          item.id === tab.id ? { ...item, path: path as string, name: fileNameOf(path as string) } : item,
        ),
      }));
    }

    const latest = useEditorStore.getState().tabs.find((item) => item.id === tab.id);
    store.setSaveStatus("saving");
    await writeFile(path, latest?.content ?? tab.content);
    useEditorStore.getState().markTabSaved(tab.id);
    store.addToast("Saved", "success");
    return true;
  } catch (error) {
    store.setSaveStatus("unsaved");
    store.addToast(`Save failed: ${error}`, "error");
    return false;
  }
}

export async function saveActiveDocument(options?: { forceDialog?: boolean }): Promise<boolean> {
  const tab = getActiveTab();
  if (!tab) return false;
  return saveDocument(tab.id, options);
}

export async function openDocument(): Promise<void> {
  const store = useEditorStore.getState();
  try {
    const result = await showOpenFileDialog();
    if (!result) return;
    store.openFile(result.path, result.name, result.content);
    store.addToast(`Opened ${result.name}`, "info");
    getRecentFiles().then(store.setRecentFiles);
  } catch (error) {
    store.addToast(`Open failed: ${error}`, "error");
  }
}

export async function openPath(path: string, name: string): Promise<void> {
  const store = useEditorStore.getState();
  try {
    const content = await readFile(path);
    store.openFile(path, name, content);
    // Reveal the document: a drawer that was open has done its job.
    store.closeOverlay();
    addRecentFile(path, name)
      .then(store.setRecentFiles)
      .catch(() => {
        /* recents are optional */
      });
  } catch (error) {
    store.addToast(`Failed to open ${name}: ${error}`, "error");
  }
}

export async function loadWorkspaceFolder(path: string): Promise<void> {
  const store = useEditorStore.getState();
  store.setFolderLoading(true);
  try {
    const entries = await readDirectory(path);
    store.setFolderEntries(entries);
    store.setCurrentFolder(path);
  } catch (error) {
    store.addToast(`Failed to load folder: ${error}`, "error");
  } finally {
    store.setFolderLoading(false);
  }
}

export async function openWorkspaceFolder(): Promise<void> {
  try {
    const folder = await showOpenFolderDialog();
    if (!folder) return;
    await loadWorkspaceFolder(folder);
    useEditorStore.getState().openOverlay("sidebar");
    useEditorStore.getState().setSidebarTab("files");
  } catch (error) {
    useEditorStore.getState().addToast(`Folder open failed: ${error}`, "error");
  }
}

export async function exportActiveHtml(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;
  const store = useEditorStore.getState();
  try {
    const html = await generateHtml(tab.content, tab.name);
    const saved = await downloadFile(`${baseName(tab.name)}.html`, html, "text/html");
    if (saved) store.addToast("Exported HTML", "success");
  } catch (error) {
    store.addToast(`Export failed: ${error}`, "error");
  }
}

export async function exportActivePdf(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;
  const store = useEditorStore.getState();
  try {
    const html = await generateHtml(tab.content, tab.name);
    await exportPdfDoc(html, `${baseName(tab.name)}.pdf`);
    store.addToast("PDF ready", "success");
  } catch (error) {
    store.addToast(`PDF export failed: ${error}`, "error");
  }
}

export async function exportActiveMarkdown(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;
  const store = useEditorStore.getState();
  try {
    const saved = await downloadFile(tab.name || "document.md", tab.content, "text/markdown");
    if (saved) store.addToast("Downloaded Markdown", "success");
  } catch (error) {
    store.addToast(`Export failed: ${error}`, "error");
  }
}

export async function copyActiveRichText(): Promise<void> {
  const tab = getActiveTab();
  if (!tab) return;
  const store = useEditorStore.getState();
  try {
    const html = await generateHtml(tab.content, tab.name);
    await navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([tab.content], { type: "text/plain" }),
      }),
    ]);
    store.addToast("Copied rich text", "success");
  } catch {
    try {
      await navigator.clipboard.writeText(tab.content);
      store.addToast("Copied Markdown", "success");
    } catch (error) {
      store.addToast(`Copy failed: ${error}`, "error");
    }
  }
}
