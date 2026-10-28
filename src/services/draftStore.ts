/**
 * Crash recovery for unsaved work. Only dirty tabs are persisted, so the
 * draft disappears as soon as a document is saved or deliberately discarded.
 */

export const DRAFT_STORAGE_KEY = "inkwell:drafts";

export interface DraftTab {
  id: string;
  path: string;
  name: string;
  content: string;
}

export interface DraftSession {
  tabs: DraftTab[];
  activeTabId: string | null;
  savedAt: number;
}

export interface DraftSource extends DraftTab {
  modified: boolean;
}

function storage(): Storage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null;
  }
}

function isDraftTab(value: unknown): value is Partial<DraftTab> {
  if (!value || typeof value !== "object") return false;
  const tab = value as Partial<DraftTab>;
  return (
    typeof tab.id === "string" &&
    typeof tab.name === "string" &&
    typeof tab.content === "string"
  );
}

export function readDraft(): DraftSession | null {
  const store = storage();
  if (!store) return null;

  try {
    const raw = store.getItem(DRAFT_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<DraftSession>;
    if (!Array.isArray(parsed.tabs)) return null;

    const tabs: DraftTab[] = parsed.tabs.filter(isDraftTab).map((tab) => ({
      id: tab.id as string,
      path: typeof tab.path === "string" ? tab.path : "",
      name: tab.name as string,
      content: tab.content as string,
    }));
    if (tabs.length === 0) return null;

    const activeTabId =
      typeof parsed.activeTabId === "string" && tabs.some((tab) => tab.id === parsed.activeTabId)
        ? parsed.activeTabId
        : tabs[0].id;

    return {
      tabs,
      activeTabId,
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function writeDrafts(
  tabs: DraftSource[],
  activeTabId: string | null,
): void {
  const store = storage();
  if (!store) return;

  const dirty = tabs
    .filter((tab) => tab.modified)
    .map(({ id, path, name, content }) => ({ id, path, name, content }));

  try {
    if (dirty.length === 0) {
      store.removeItem(DRAFT_STORAGE_KEY);
      return;
    }
    const session: DraftSession = { tabs: dirty, activeTabId, savedAt: Date.now() };
    store.setItem(DRAFT_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Private mode or quota exceeded: saving to disk is still the primary path.
  }
}

export function clearDrafts(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(DRAFT_STORAGE_KEY);
  } catch {
    // ignore storage failures
  }
}
