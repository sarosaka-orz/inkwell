// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DRAFT_STORAGE_KEY } from "../services/draftStore";

beforeEach(() => {
  localStorage.clear();
  vi.resetModules();
});

describe("startup hydration", () => {
  it("restores unsaved drafts instead of the welcome document", async () => {
    localStorage.setItem(
      DRAFT_STORAGE_KEY,
      JSON.stringify({
        tabs: [{ id: "draft-1", path: "", name: "draft.md", content: "hello" }],
        activeTabId: "draft-1",
        savedAt: 1,
      }),
    );

    const { useEditorStore } = await import("./editorStore");
    const state = useEditorStore.getState();

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]).toMatchObject({
      id: "draft-1",
      name: "draft.md",
      content: "hello",
      modified: true,
    });
    expect(state.activeTabId).toBe("draft-1");
    expect(state.recoveredDraftCount).toBe(1);
  });

  it("shows the welcome document when there is no draft", async () => {
    const { useEditorStore } = await import("./editorStore");
    const state = useEditorStore.getState();

    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].name).toBe("welcome.md");
    expect(state.tabs[0].modified).toBe(false);
    expect(state.recoveredDraftCount).toBe(0);
  });
});
